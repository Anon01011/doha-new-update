<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Company;
use App\Models\EmployeeAttendance;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Employee;
use App\Models\ShiftRoster;
use Illuminate\Support\Facades\Log;
use App\Services\WeeklyOffService;

class EmployeeAttendanceController extends Controller
{
    public function import(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('import-attendance')) {
             abort(403, 'Unauthorized. You do not have permission to import attendance.');
        }

        // Validate file upload
        $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:csv,txt',
                'max:10240', // 10MB max
            ],
            'company_id' => 'required|exists:companies,id',
        ], [
            'file.required' => 'Please select a CSV file to upload.',
            'file.mimes' => 'Only CSV files are supported. Please upload a .csv or .txt file.',
            'file.max' => 'File size must not exceed 10MB.',
            'company_id.required' => 'Please select a company.',
            'company_id.exists' => 'Selected company does not exist.',
        ]);

        $file = $request->file('file');
        $companyId = $request->input('company_id');

        // Multi-tenancy check (BelongsToCompany handles isolation for employees, but for import we check explicit access)
        if (!$user->isAdmin() && !$user->isHR() && $user->employee_id) {
             if ($companyId != $user->employee->company_id) {
                 abort(403, 'Unauthorized access to another branch.');
             }
        }

        // Validate file is readable
        if (!$file->isValid()) {
            return back()->withErrors(['file' => 'The uploaded file is invalid or corrupted. Please try again.']);
        }

        // Read CSV file
        $path = $file->getRealPath();

        try {
            $data = array_map('str_getcsv', file($path));
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Failed to read CSV file. Please ensure the file is a valid CSV format.']);
        }

        if (empty($data)) {
            return back()->withErrors(['file' => 'The CSV file is empty. Please upload a file with attendance data.']);
        }

        // Biometric CSV files often have title rows before the actual header
        // Find the actual header row by looking for common column names
        $header = null;
        $headerIndex = -1;

        foreach ($data as $index => $row) {
            if (empty($row) || count($row) < 3) {
                continue;
            }

            // Check if this row looks like a header (contains common column names)
            $rowLower = array_map('strtolower', array_map('trim', $row));
            $hasIdColumn = in_array('id', $rowLower) ||
                in_array('employee id', $rowLower) ||
                in_array('emp id', $rowLower);
            $hasDateColumn = in_array('date', $rowLower);

            if ($hasIdColumn || $hasDateColumn) {
                $header = $row;
                $headerIndex = $index;
                break;
            }
        }

        // If no header found, try the first row
        if ($header === null) {
            $header = array_shift($data);
            $headerIndex = 0;
        } else {
            // Remove all rows before and including the header
            $data = array_slice($data, $headerIndex + 1);
        }

        if (empty($header) || count($header) < 3) {
            return back()->withErrors([
                'file' => 'Invalid CSV format. The file must have a header row with column names. 
                
Supported formats:
1. Biometric CSV: ID, Date, Clock-In Date, Clock-In Time, Clock-Out Date, Clock-Out Time, Worked Hours, Overtime Duration
2. Simple CSV: Employee Code/ID, Date, Clock-In Time, Clock-Out Time

Example:
ID,Date,Clock-In Time,Clock-Out Time,Worked Hours,Overtime Duration
105,26/01/2026,07:20,16:01,08:40,00:00'
            ]);
        }

        // Detect column indices for biometric CSV format
        $colMap = [
            'id' => -1,
            'date' => -1,
            'clock_in_date' => -1,
            'clock_in_time' => -1,
            'clock_out_date' => -1,
            'clock_out_time' => -1,
            'worked_hours' => -1,
            'overtime' => -1,
            'absent_duration' => -1,
        ];

        foreach ($header as $index => $col) {
            $col = strtolower(trim($col));

            // Match ID column
            if ($col === 'id' || str_contains($col, 'employee id') || str_contains($col, 'emp id')) {
                $colMap['id'] = $index;
            }
            // Match Date column (main date)
            if ($col === 'date' && $colMap['date'] === -1) {
                $colMap['date'] = $index;
            }
            // Match Clock-In Date
            if (str_contains($col, 'clock-in date') || str_contains($col, 'clock in date')) {
                $colMap['clock_in_date'] = $index;
            }
            // Match Clock-In Time
            if (str_contains($col, 'clock-in time') || str_contains($col, 'clock in time')) {
                $colMap['clock_in_time'] = $index;
            }
            // Match Clock-Out Date
            if (str_contains($col, 'clock-out date') || str_contains($col, 'clock out date')) {
                $colMap['clock_out_date'] = $index;
            }
            // Match Clock-Out Time
            if (str_contains($col, 'clock-out time') || str_contains($col, 'clock out time')) {
                $colMap['clock_out_time'] = $index;
            }
            // Match Worked Hours
            if (str_contains($col, 'worked hours') || str_contains($col, 'work hours')) {
                $colMap['worked_hours'] = $index;
            }
            // Match Overtime
            if (str_contains($col, 'overtime duration') || str_contains($col, 'overtime')) {
                $colMap['overtime'] = $index;
            }
            // Match Absent Duration
            if (str_contains($col, 'absent duration')) {
                $colMap['absent_duration'] = $index;
            }
        }

        // Validate required columns
        if ($colMap['id'] === -1 || $colMap['date'] === -1) {
            $foundColumns = implode(', ', array_map(function ($col) {
                return trim($col);
            }, $header));

            return back()->withErrors([
                'file' => "Required columns not found in CSV file.

Required columns:
- ID or Employee ID (employee code/number)
- Date (attendance date)

Optional columns for biometric import:
- Clock-In Date, Clock-In Time
- Clock-Out Date, Clock-Out Time  
- Worked Hours, Overtime Duration

Your CSV has these columns: {$foundColumns}

Please ensure your CSV file has at least 'ID' and 'Date' columns."
            ]);
        }

        $importedCount = 0;
        $skippedCount = 0;
        $errors = [];

        foreach ($data as $rowIndex => $row) {
            if (count($row) < 3) {
                continue; // Skip empty or invalid rows
            }

            try {
                // Get employee ID/code
                $empCode = trim($row[$colMap['id']]);
                if (empty($empCode)) {
                    $skippedCount++;
                    continue;
                }

                // Parse date (handle DD/MM/YYYY and DD-MM-YYYY formats, with 1 or 2 digits)
                $dateStr = trim($row[$colMap['date']]);
                try {
                    // Try DD/MM/YYYY or DD-MM-YYYY format first (flexible for 1-2 digits)
                    if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2}|\d{4})$/', $dateStr, $matches)) {
                        $year = strlen($matches[3]) == 2 ? 2000 + (int)$matches[3] : $matches[3];
                        $date = Carbon::createFromDate($year, $matches[2], $matches[1])->toDateString();
                    } else {
                        $date = Carbon::parse($dateStr)->toDateString();
                    }
                    
                    if ($date > now()->toDateString()) {
                        $errors[] = "Row " . ($rowIndex + 2) . ": Future dates are not allowed ($date)";
                        $skippedCount++;
                        continue;
                    }
                } catch (\Exception $e) {
                    $skippedCount++;
                    continue;
                }

                // Find Employee by employee_code or id (eager-load weekly off data to avoid N+1)
                $employee = Employee::with(['weeklyOffs', 'company'])
                    ->where('company_id', $companyId)
                    ->where(function($query) use ($empCode) {
                        $query->where('employee_code', $empCode)
                              ->orWhere('id', $empCode);
                    })
                    ->first();

                if (!$employee) {
                    $errors[] = "Employee with ID {$empCode} not found in company";
                    $skippedCount++;
                    continue;
                }

                // Parse clock-in and clock-out times
                $clockInTime = null;
                $clockOutTime = null;
                $isAbsent = false;

                if ($colMap['clock_in_time'] !== -1) {
                    $clockInStr = trim($row[$colMap['clock_in_time']]);
                    if ($clockInStr && $clockInStr !== '--' && $clockInStr !== '') {
                        $clockInTime = $clockInStr;
                    } else {
                        $isAbsent = true;
                    }
                }

                if ($colMap['clock_out_time'] !== -1) {
                    $clockOutStr = trim($row[$colMap['clock_out_time']]);
                    if ($clockOutStr && $clockOutStr !== '--' && $clockOutStr !== '') {
                        $clockOutTime = $clockOutStr;
                    }
                }

                // Parse worked hours (format: HH:MM)
                $hoursWorked = 0;
                if ($colMap['worked_hours'] !== -1) {
                    $workedStr = trim($row[$colMap['worked_hours']]);
                    $hoursWorked = $this->parseTimeToDecimal($workedStr);
                }

                // Parse overtime (format: HH:MM)
                $overtimeHours = 0;
                if ($colMap['overtime'] !== -1) {
                    $overtimeStr = trim($row[$colMap['overtime']]);
                    $overtimeHours = $this->parseTimeToDecimal($overtimeStr);
                }

                // Determine attendance status
                $attendanceStatus = 'Present';

                // Check weekly off FIRST (overrides all other status logic)
                $weeklyOffService = app(WeeklyOffService::class);
                $parsedDate = Carbon::parse($date);
                if ($weeklyOffService->isWeeklyOff($employee, $parsedDate)) {
                    $attendanceStatus = 'Weekly Off';
                } elseif ($isAbsent || $hoursWorked == 0) {
                    $attendanceStatus = 'Absent';
                } elseif ($hoursWorked < 4) {
                    $attendanceStatus = 'Half Day';
                }

                // Calculate normal hours (worked hours - overtime)
                $normalHours = max(0, $hoursWorked - $overtimeHours);

                // Fetch roster for this day (optional, for reference)
                $dayName = $parsedDate->format('l');
                $roster = ShiftRoster::where('employee_id', $employee->id)
                    ->where('day', $dayName)
                    ->where('week_start', '<=', $date)
                    ->orderBy('week_start', 'desc')
                    ->first();

                // Save/Update Attendance
                EmployeeAttendance::updateOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'date' => $date,
                        'company_id' => $companyId
                    ],
                    [
                        'shift_id' => $roster ? $roster->id : null,
                        'from_time' => $attendanceStatus === 'Weekly Off' ? null : $clockInTime,
                        'to_time' => $attendanceStatus === 'Weekly Off' ? null : $clockOutTime,
                        'hours_worked' => $attendanceStatus === 'Weekly Off' ? 0 : $hoursWorked,
                        'normal_hours' => $attendanceStatus === 'Weekly Off' ? 0 : ($normalHours > 0 ? $normalHours : ($roster ? ($roster->shift_duration ?? 8) : 8)),
                        'ot' => $attendanceStatus === 'Weekly Off' ? 0 : $overtimeHours,
                        'ot_amt' => null, // Will be calculated in payroll
                        'attendance' => $attendanceStatus,
                        'is_paid' => false,
                    ]
                );
                $importedCount++;

            } catch (\Exception $e) {
                Log::error("Error importing attendance row " . ($rowIndex + 2) . ": " . $e->getMessage());
                $errors[] = "Row " . ($rowIndex + 2) . ": " . $e->getMessage();
                $skippedCount++;
            }
        }

        $message = "Successfully imported {$importedCount} attendance records.";
        if ($skippedCount > 0) {
            $message .= " Skipped {$skippedCount} records.";
        }

        if (count($errors) > 0 && count($errors) <= 10) {
            $message .= " Errors: " . implode('; ', array_slice($errors, 0, 10));
        }

        return back()->with('success', $message);
    }

    /**
     * Download the attendance import template
     */
    public function downloadTemplate()
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('import-attendance')) {
            abort(403, 'Unauthorized.');
        }

        $headers = [
            'Employee ID',
            'Date',
            'Clock-In Time',
            'Clock-Out Time',
            'Worked Hours',
            'Overtime Duration'
        ];

        $filename = "attendance_import_template_" . now()->format('Y-m-d') . ".csv";

        $callback = function () use ($headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);

            // Sample data row
            fputcsv($file, [
                '101',
                date('d/m/Y'),
                '08:00',
                '17:00',
                '09:00',
                '01:00'
            ]);

            fclose($file);
        };

        return response()->stream($callback, 200, [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename={$filename}",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ]);
    }

    /**
     * Helper function to parse time in HH:MM format to decimal hours
     */
    private function parseTimeToDecimal($timeStr)
    {
        if (empty($timeStr) || $timeStr === '--' || $timeStr === '00:00') {
            return 0;
        }

        // Handle HH:MM format
        if (preg_match('/^(\d{1,2}):(\d{2})$/', $timeStr, $matches)) {
            $hours = (int) $matches[1];
            $minutes = (int) $matches[2];
            return round($hours + ($minutes / 60), 2);
        }

        // Try to parse as decimal directly
        if (is_numeric($timeStr)) {
            return round((float) $timeStr, 2);
        }

        return 0;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('view-attendance')) {
             // Employees see their own (handled below)
        }

        // Fetch all branches (companies) for the dropdown
        $branches = Company::orderBy('name')->get(['id', 'name']);

        // Determine selected branch and week
        $company_id = $request->input('company_id');

        // Multi-tenancy scoping (Non-admins are isolated to their own branch by global scopes, 
        // but for the UI we force the company_id)
        if (!$user->isAdmin() && !$user->isHR() && $user->employee_id) {
            $company_id = $user->employee->company_id;
        }

        $week_start = $request->input('week_start', now()->startOfWeek()->toDateString());

        // Fetch roster/attendance data
        $employeesQuery = Employee::orderBy('name');
        if ($company_id) {
            $employeesQuery->where('company_id', $company_id);
        }

        if (!$user->isAdmin() && !$user->isHR() && !$user->isManager() && $user->employee_id) {
            $employeesQuery->where('id', $user->employee_id);
        }

        // Search filter
        if ($request->has('search') && $request->search) {
            $employeesQuery->where('name', 'like', '%' . $request->search . '%');
        }

        // Paginate employees (20 per page) to optimize performance
        $employees = $employeesQuery->paginate(20)->withQueryString();
        $employeeIds = $employees->pluck('id')->toArray();

        $attendancesQuery = EmployeeAttendance::whereIn('employee_id', $employeeIds) // OPTIMIZATION: Scope to displayed employees
            ->whereBetween('date', [
                $week_start,
                Carbon::parse($week_start)->addDays(6)->toDateString()
            ]);

        if ($company_id) {
            $attendancesQuery->where('company_id', $company_id);
        }

        if (!$user->isAdmin() && !$user->isHR() && !$user->isManager() && $user->employee_id) {
            $attendancesQuery->where('employee_id', $user->employee_id);
        }

        $attendances = $attendancesQuery->get();

        // Fetch planned roster for reference
        $rostersQuery = ShiftRoster::whereIn('employee_id', $employeeIds) // OPTIMIZATION: Scope to displayed employees
            ->where('week_start', $week_start);

        if ($company_id) {
            $rostersQuery->where('company_id', $company_id);
        }

        if (!$user->isAdmin() && !$user->isHR() && !$user->isManager() && $user->employee_id) {
            $rostersQuery->where('employee_id', $user->employee_id);
        }

        $rosters = $rostersQuery->with(['employee.weeklyOffs', 'employee.company'])->get()->map(function ($roster) {
            $roster->is_weekly_off = $roster->isWeeklyOffDay();
            return $roster;
        });

        // Fetch dynamic options
        $attendanceOptions = \App\Models\DropdownOption::where('category', 'Attendance Status')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->pluck('value');

        // Find roster for today
        $dayName = now()->format('l');
        $weekStart = now()->startOfWeek()->toDateString();
        $todayRoster = null;
        if ($user->employee_id) {
            $todayRoster = ShiftRoster::where('employee_id', $user->employee_id)
                ->where('week_start', $weekStart)
                ->where('day', $dayName)
                ->first();
        }

        $companyId = $user->employee_id ? $user->employee->company_id : $company_id;
        $settings = [
            'grace_period_minutes' => Setting::get('clock_in_grace_period', 15, $companyId),
            'company_opening_time' => Setting::get('company_opening_time', '09:30', $companyId),
            'company_closing_time' => Setting::get('company_closing_time', '03:00', $companyId),
            'standard_working_hours' => Setting::get('standard_working_hours', 9, $companyId),
        ];

        $view = (!$user->isAdmin() && !$user->isHR() && !$user->isManager()) ? 'Employee/Attendance' : 'EmployeeAttendance/Index';
        return \Inertia\Inertia::render($view, [
            'branches' => $branches,
            'employees' => $employees,
            'attendances' => $attendances,
            'rosters' => $rosters ?? [],
            'initialCompanyId' => $company_id,
            'initialWeekStart' => $week_start,
            'attendanceOptions' => $attendanceOptions,
            'userRole' => $user->role,
            'todayAttendance' => ($user->isEmployee() || $user->employee_id) ? EmployeeAttendance::where('employee_id', $user->employee_id)->where('date', now()->toDateString())->first() : null,
            'todayRoster' => $todayRoster,
            'settings' => $settings,
        ]);
    }

    /**
     * Clock in for the day.
     */
    public function clockIn(Request $request)
    {
        $user = auth()->user();
        if (!$user->employee_id) {
            return back()->with('error', 'No employee profile linked.');
        }

        $employee = Employee::with(['weeklyOffs', 'company'])->findOrFail($user->employee_id);
        $today = now()->toDateString();

        $attendance = EmployeeAttendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        // Check if already clocked in using punches history
        $punches = $attendance ? ($attendance->punches ?: []) : [];
        if (!empty($punches) && end($punches)['type'] === 'in') {
            return back()->with('error', 'You are already clocked in.');
        }

        // --- WEEKLY OFF CHECK ---
        $weeklyOffService = app(WeeklyOffService::class);
        if ($weeklyOffService->isWeeklyOff($employee, Carbon::parse($today))) {
            // Auto-create/update attendance as Weekly Off (no clock-in allowed)
            EmployeeAttendance::updateOrCreate([
                'employee_id' => $employee->id,
                'date' => $today,
            ], [
                'company_id' => $employee->company_id,
                'attendance' => 'Weekly Off',
                'hours_worked' => 0,
                'normal_hours' => 0,
                'ot' => 0,
                'ot_amt' => 0,
            ]);
            return back()->with('error', 'Today is your weekly off. You cannot clock in.');
        }

        // Find roster for today
        $dayName = now()->format('l');
        $weekStart = now()->startOfWeek()->toDateString();
        $roster = ShiftRoster::where('employee_id', $employee->id)
            ->where('week_start', $weekStart)
            ->where('day', $dayName)
            ->first();

        $attendanceStatus = 'Present';
        if ($roster && $roster->shift_start_time) {
            $gracePeriod = Setting::get('clock_in_grace_period', 15, $employee->company_id);
            $lateThreshold = Setting::get('late_arrival_threshold', 0, $employee->company_id);
            $startTime = $roster->shift_start_time;
            $clockInTime = now();

            // Set start time to today initially
            $startTime->setDate($clockInTime->year, $clockInTime->month, $clockInTime->day);

            // If clock-in is early morning (e.g. 1 AM) and start time is late evening (e.g. 10 PM)
            if ($clockInTime->hour < 8 && $startTime->hour > 18) {
                $startTime->subDay();
            }

            if ($clockInTime->gt($startTime->copy()->addMinutes($gracePeriod + $lateThreshold))) {
                $attendanceStatus = 'Late';
            }
        }

        $punches[] = [
            'type' => 'in',
            'time' => now()->toDateTimeString(),
        ];

        $updateData = [
            'company_id' => $employee->company_id,
            'to_time' => null,
            'punches' => $punches,
        ];

        // Only set from_time and attendance on first check-in
        if (!$attendance || !$attendance->from_time) {
            $updateData['from_time'] = now()->format('H:i');
            $updateData['attendance'] = $attendanceStatus;
            $updateData['shift_id'] = $roster ? $roster->id : null;
            $defaultStdHours = Setting::get('standard_working_hours', 9, $employee->company_id);
            $updateData['normal_hours'] = $roster ? ($roster->shift_duration ?: $defaultStdHours) : $defaultStdHours;
        }

        EmployeeAttendance::updateOrCreate([
            'employee_id' => $employee->id,
            'date' => $today,
        ], $updateData);

        return back()->with('success', 'Clocked in successfully at ' . now()->format('h:i A'));
    }

    /**
     * Clock out for the day.
     */
    public function clockOut(Request $request)
    {
        $user = auth()->user();
        if (!$user->employee_id) {
            return back()->with('error', 'No employee profile linked.');
        }

        $attendance = EmployeeAttendance::where('employee_id', $user->employee_id)
            ->where('date', now()->toDateString())
            ->first();

        // Check if clocked in using punches history
        $punches = $attendance ? ($attendance->punches ?: []) : [];
        $isClockedIn = false;
        if (!empty($punches)) {
            $isClockedIn = end($punches)['type'] === 'in';
        } elseif ($attendance && $attendance->from_time && !$attendance->to_time) {
            $isClockedIn = true;
        }

        if (!$isClockedIn) {
            return back()->with('error', 'You must clock in first.');
        }

        $toTime = now();

        // If punches is empty but we have from_time (legacy record), initialize punches
        if (empty($punches) && $attendance->from_time) {
            $punches[] = [
                'type' => 'in',
                'time' => Carbon::parse($attendance->date . ' ' . $attendance->from_time)->toDateTimeString()
            ];
        }

        $punches[] = [
            'type' => 'out',
            'time' => $toTime->toDateTimeString(),
        ];

        // Temporarily assign punches to calculate hours correctly
        $attendance->punches = $punches;
        $hoursWorked = $attendance->calculateFlexibleHours();
        $totalBreakMinutes = $attendance->calculateFlexibleBreaks();

        // Calculate OT
        $defaultStdHours = Setting::get('standard_working_hours', 9, $attendance->company_id);
        $normalHours = $attendance->normal_hours ?: $defaultStdHours;
        $ot = $hoursWorked > $normalHours ? $hoursWorked - $normalHours : 0;

        // Get overtime rate from settings
        $overtimeRate = Setting::get('overtime_rate_multiplier', 1.5, $attendance->company_id);
        $otAmount = ($ot > 0 && $overtimeRate > 0) ? $ot * $overtimeRate : 0;

        // Check for early departure
        $earlyThreshold = Setting::get('early_departure_threshold', 0, $attendance->company_id);
        $isEarlyDeparture = false;
        if ($attendance->shift_id) {
            $roster = ShiftRoster::find($attendance->shift_id);
            if ($roster && $roster->shift_end_time) {
                $endTime = $roster->shift_end_time;
                $startTime = $roster->shift_start_time;
                $endTime->setDate($toTime->year, $toTime->month, $toTime->day);

                $isOvernight = ($startTime && $roster->shift_end_time->day !== $startTime->day);

                if ($isOvernight) {
                    if ($toTime->hour > 12 && $endTime->hour < 12) {
                        $endTime->addDay();
                    }
                }

                if ($toTime->lt($endTime->copy()->subMinutes($earlyThreshold))) {
                    $isEarlyDeparture = true;
                }
            }
        }

        $attendance->update([
            'to_time' => $toTime->format('H:i'),
            'hours_worked' => $hoursWorked,
            'total_break_minutes' => $totalBreakMinutes,
            'ot' => $ot,
            'ot_amt' => $otAmount,
            'punches' => $punches,
            'reason' => $isEarlyDeparture ? ($attendance->reason ? $attendance->reason . ' | Early Departure' : 'Early Departure') : $attendance->reason,
        ]);

        return back()->with('success', 'Clocked out successfully at ' . $toTime->format('h:i A') . '. Total hours: ' . $hoursWorked . ' (Break: ' . $totalBreakMinutes . ' mins)');
    }

    /**
     * Start a break.
     */
    public function startBreak(Request $request)
    {
        $user = auth()->user();
        if (!$user->employee_id) {
            return back()->with('error', 'No employee profile linked.');
        }

        $attendance = EmployeeAttendance::where('employee_id', $user->employee_id)
            ->where('date', now()->toDateString())
            ->first();

        // Check if clocked in using punches history
        $punches = $attendance ? ($attendance->punches ?: []) : [];
        $isClockedIn = false;
        if (!empty($punches)) {
            $isClockedIn = end($punches)['type'] === 'in';
        } elseif ($attendance && $attendance->from_time && !$attendance->to_time) {
            $isClockedIn = true;
        }

        if (!$isClockedIn) {
            return back()->with('error', 'You must clock in first.');
        }

        if ($attendance->current_break_start) {
            return back()->with('error', 'You are already on a break.');
        }

        // Initialize punches if empty (legacy record support)
        if (empty($punches) && $attendance->from_time) {
            $punches[] = [
                'type' => 'in',
                'time' => Carbon::parse($attendance->date . ' ' . $attendance->from_time)->toDateTimeString()
            ];
        }

        $punches[] = [
            'type' => 'out',
            'time' => now()->toDateTimeString(),
            'is_break' => true
        ];

        $attendance->update([
            'current_break_start' => now(),
            'punches' => $punches
        ]);

        return back()->with('success', 'Break started at ' . now()->format('h:i A'));
    }

    /**
     * End a break.
     */
    public function endBreak(Request $request)
    {
        $user = auth()->user();
        if (!$user->employee_id) {
            return back()->with('error', 'No employee profile linked.');
        }

        $attendance = EmployeeAttendance::where('employee_id', $user->employee_id)
            ->where('date', now()->toDateString())
            ->first();

        if (!$attendance || !$attendance->current_break_start) {
            return back()->with('error', 'You are not on a break.');
        }

        $breakStart = $attendance->current_break_start;
        $breakEnd = now();
        $duration = $breakEnd->diffInMinutes($breakStart);

        $punches = $attendance->punches ?: [];
        $punches[] = [
            'type' => 'in',
            'time' => $breakEnd->toDateTimeString(),
            'is_break' => true
        ];

        $history = $attendance->break_history ?: [];
        $history[] = [
            'start' => $breakStart->toDateTimeString(),
            'end' => $breakEnd->toDateTimeString(),
            'duration' => $duration,
        ];

        $maxBreak = Setting::get('max_break_duration', 0, $attendance->company_id);
        $overBreak = ($maxBreak > 0 && $duration > $maxBreak);

        $attendance->update([
            'current_break_start' => null,
            'total_break_minutes' => ($attendance->total_break_minutes ?: 0) + $duration,
            'break_history' => $history,
            'punches' => $punches,
            'reason' => $overBreak ? ($attendance->reason ? $attendance->reason . ' | Over Break' : 'Over Break') : $attendance->reason,
        ]);

        return back()->with('success', 'Break ended. Duration: ' . $duration . ' minutes.');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-attendance')) {
             abort(403, 'Unauthorized.');
        }
        $companies = Company::orderBy('name')->get(['id', 'name']);

        // Fetch dynamic options
        $attendanceOptions = \App\Models\DropdownOption::where('category', 'Attendance Status')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->pluck('value');

        return \Inertia\Inertia::render('EmployeeAttendance/Create', [
            'branches' => $companies,
            'attendanceOptions' => $attendanceOptions,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('manage-attendance')) {
            abort(403, 'Unauthorized. Only admin, HR, and managers (with permission) can create attendance records.');
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'company_id' => 'required|exists:companies,id',
            'date' => 'required|date',
            'attendance' => 'nullable|string',
            'from_time' => 'nullable',
            'to_time' => 'nullable',
            'hours_worked' => 'nullable|numeric',
            'normal_hours' => 'nullable|numeric',
            'ot' => 'nullable|numeric',
            'ot_amt' => 'nullable|numeric',
            'reason' => 'nullable|string',
        ]);

        $validated['company_id'] = $validated['company_id'] ?? ($user->employee ? $user->employee->company_id : null);

        // Auto-detect and enforce Weekly Off status
        $employee = Employee::with(['weeklyOffs', 'company'])->findOrFail($validated['employee_id']);
        $weeklyOffService = app(WeeklyOffService::class);
        if ($weeklyOffService->isWeeklyOff($employee, Carbon::parse($validated['date']))) {
            $validated['attendance'] = 'Weekly Off';
            $validated['hours_worked'] = 0;
            $validated['normal_hours'] = 0;
            $validated['ot'] = 0;
            $validated['ot_amt'] = 0;
            $validated['from_time'] = null;
            $validated['to_time'] = null;
        }

        EmployeeAttendance::create($validated);

        return redirect()->route('employee-attendances.index')
            ->with('success', 'Attendance created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = auth()->user();
        $attendance = EmployeeAttendance::with(['employee', 'company'])->findOrFail($id);

        // BelongsToCompany handles branch isolation.
        if ($user->isEmployee() && $attendance->employee_id != $user->employee_id && !$user->hasPermission('view-attendance')) {
             abort(403, 'Unauthorized access.');
        }
        return \Inertia\Inertia::render('EmployeeAttendance/Show', [
            'attendance' => $attendance,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $user = auth()->user();
        $attendance = EmployeeAttendance::with(['employee', 'company'])->findOrFail($id);

        if (!$user->isAdmin() && $user->role !== 'hr' && $user->employee_id && $user->employee) {
            if ($attendance->company_id != $user->employee->company_id) {
                abort(403, 'Unauthorized access.');
            }
        }

        $compQuery = Company::orderBy('name');
        if (!$user->isAdmin() && $user->role !== 'hr' && $user->employee_id && $user->employee) {
            $compQuery->where('id', $user->employee->company_id);
        }
        $companies = $compQuery->get(['id', 'name']);

        $empQuery = Employee::where('company_id', $attendance->company_id)->orderBy('name');
        $employees = $empQuery->get(['id', 'name', 'employee_code']);

        // Fetch dynamic options
        $attendanceOptions = \App\Models\DropdownOption::where('category', 'Attendance Status')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->pluck('value');

        return \Inertia\Inertia::render('EmployeeAttendance/Edit', [
            'attendance' => $attendance,
            'branches' => $companies,
            'employees' => $employees,
            'attendanceOptions' => $attendanceOptions,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = auth()->user();

        // Only admin, hr, and manager can update attendance records
        if (!in_array($user->role, ['admin', 'hr', 'manager'])) {
            abort(403, 'Unauthorized. Only admin, HR, and managers can update attendance records.');
        }

        $attendance = EmployeeAttendance::findOrFail($id);

        // Multi-tenancy check for existing record
        if (!$user->isAdmin() && $user->role !== 'hr' && $user->employee_id && $user->employee) {
            if ($attendance->company_id != $user->employee->company_id) {
                abort(403, 'Unauthorized access.');
            }
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'company_id' => 'required|exists:companies,id',
            'date' => 'required|date',
            'attendance' => 'nullable|string',
            'from_time' => 'nullable',
            'to_time' => 'nullable',
            'hours_worked' => 'nullable|numeric',
            'normal_hours' => 'nullable|numeric',
            'ot' => 'nullable|numeric',
            'ot_amt' => 'nullable|numeric',
            'reason' => 'nullable|string',
        ]);

        // Multi-tenancy check for target company
        if (!$user->isAdmin() && $user->role !== 'hr' && $user->employee_id && $user->employee) {
            if ($validated['company_id'] != $user->employee->company_id) {
                abort(403, 'Unauthorized access to another branch.');
            }
        }

        // Enforce Weekly Off status (admin/HR cannot override a weekly off day with Present)
        $empForCheck = Employee::with(['weeklyOffs', 'company'])->find($validated['employee_id']);
        if ($empForCheck) {
            $weeklyOffService = app(WeeklyOffService::class);
            if ($weeklyOffService->isWeeklyOff($empForCheck, Carbon::parse($validated['date']))) {
                $validated['attendance'] = 'Weekly Off';
                $validated['hours_worked'] = 0;
                $validated['normal_hours'] = 0;
                $validated['ot'] = 0;
                $validated['ot_amt'] = 0;
                $validated['from_time'] = null;
                $validated['to_time'] = null;
            }
        }

        $attendance->update($validated);

        return redirect()->route('employee-attendances.index')
            ->with('success', 'Attendance updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = auth()->user();

        // Only admin and HR can delete attendance records
        if (!in_array($user->role, ['admin', 'hr'])) {
            abort(403, 'Unauthorized. Only admin and HR can delete attendance records.');
        }

        $attendance = EmployeeAttendance::findOrFail($id);
        $attendance->delete();

        return redirect()->route('employee-attendances.index')
            ->with('success', 'Attendance deleted successfully!');
    }

    /**
     * Batch fetch attendances for a company and week.
     */
    public function week(Request $request)
    {
        $company_id = $request->input('company_id');
        $week_start = $request->input('week_start', now()->startOfWeek()->toDateString());
        $companies = Company::orderBy('name')->get(['id', 'name']);

        $employees = [];
        $attendances = [];

        if ($company_id) {
            $employees = Employee::where('company_id', $company_id)->orderBy('name')->get(['id', 'name', 'designation', 'company_id']);
            $attendances = EmployeeAttendance::where('company_id', $company_id)
                ->whereBetween('date', [
                    $week_start,
                    Carbon::parse($week_start)->addDays(6)->toDateString()
                ])->get();
        }

        // Fetch dynamic options
        $attendanceOptions = \App\Models\DropdownOption::where('category', 'Attendance Status')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->pluck('value');

        return \Inertia\Inertia::render('EmployeeAttendance/Index', [
            'branches' => $companies,
            'employees' => $employees,
            'attendances' => $attendances,
            'initialCompanyId' => $company_id,
            'initialWeekStart' => $week_start,
            'attendanceOptions' => $attendanceOptions,
        ]);
    }

    /**
     * Batch store attendances for a week.
     */
    public function batchStore(Request $request)
    {
        $user = auth()->user();

        // Only admin and HR can batch store attendance
        if (!in_array($user->role, ['admin', 'hr'])) {
            abort(403, 'Unauthorized. Only admin and HR can batch store attendance.');
        }

        $validated = $request->validate([
            'attendances' => 'required|array',
            'attendances.*.employee_id' => 'required|exists:employees,id',
            'attendances.*.company_id' => 'required|exists:companies,id',
            'attendances.*.date' => 'required|date',
            'attendances.*.attendance' => 'nullable|string',
            'attendances.*.from_time' => 'nullable',
            'attendances.*.to_time' => 'nullable',
            'attendances.*.hours_worked' => 'nullable',
            'attendances.*.normal_hours' => 'nullable',
            'attendances.*.ot' => 'nullable',
            'attendances.*.ot_amt' => 'nullable',
            'attendances.*.reason' => 'nullable',
        ]);

        $attendances = $validated['attendances'];
        $companyId = $attendances[0]['company_id'] ?? null;

        // Eager-load employees to avoid N+1 queries in the loop
        $employeeIds = collect($attendances)->pluck('employee_id')->unique()->all();
        $employeesMap = Employee::with(['weeklyOffs', 'company'])->whereIn('id', $employeeIds)->get()->keyBy('id');

        // Eager-load shift rosters and existing attendances in bulk to eliminate N+1 queries in loop
        $maxDate = collect($attendances)->pluck('date')->max();
        $rosters = ShiftRoster::whereIn('employee_id', $employeeIds)
            ->where('week_start', '<=', $maxDate)
            ->get()
            ->groupBy('employee_id');

        $dates = collect($attendances)->pluck('date')->unique()->all();
        $existingAttendances = EmployeeAttendance::whereIn('employee_id', $employeeIds)
            ->whereIn('date', $dates)
            ->get()
            ->groupBy(function ($item) {
                return $item->employee_id . '_' . $item->date;
            });

        // Get overtime rate from settings
        $overtimeRate = Setting::get('overtime_rate_multiplier', 1.5, $companyId);
        $weeklyOffService = app(WeeklyOffService::class);

        DB::beginTransaction();
        try {
            $now = now();
            $insertData = [];

            foreach ($attendances as $entry) {
                // Skip empty entries
                if (empty($entry['attendance']) && empty($entry['hours_worked'])) {
                    continue;
                }

                $employee = $employeesMap->get($entry['employee_id']);
                $isWeeklyOff = false;
                if ($employee) {
                    $isWeeklyOff = $weeklyOffService->isWeeklyOff($employee, Carbon::parse($entry['date']));
                }

                if ($isWeeklyOff) {
                    $entry['attendance'] = 'Weekly Off';
                    $entry['from_time'] = null;
                    $entry['to_time'] = null;
                    $hoursWorked = 0;
                    $normalHours = 0;
                    $otHours = 0;
                    $otAmount = 0;
                    $roster = null;
                } else {
                    // Fetch rostered shift for this day (from in-memory eager loaded collection)
                    $dayName = Carbon::parse($entry['date'])->format('l');
                    $employeeRosters = $rosters->get($entry['employee_id'], collect());
                    $roster = $employeeRosters
                        ->filter(function ($r) use ($dayName, $entry) {
                            return $r->day === $dayName && $r->week_start <= $entry['date'];
                        })
                        ->sortByDesc('week_start')
                        ->first();

                    // Determine normal hours — prefer entry value, then roster shift duration, then company setting
                    $stdHours = Setting::get('standard_working_hours', 9, $entry['company_id'] ?? $companyId);
                    $normalHours = $entry['normal_hours'] ?? ($roster ? ($roster->shift_duration ?? $stdHours) : $stdHours);
                    $hoursWorked = $entry['hours_worked'] ?? 0;

                    // Auto-calculate OT Hours: hours worked beyond the standard shift
                    $otHours = $entry['ot'] ?? 0;
                    if ($hoursWorked > $normalHours && $otHours == 0) {
                        $otHours = round($hoursWorked - $normalHours, 3);
                    }

                    // Auto-calculate OT Amount if OT hours exist and Amount is not manually provided
                    $otAmount = $entry['ot_amt'] ?? null;
                    if ($otHours > 0 && empty($otAmount) && $overtimeRate > 0) {
                        $otAmount = $otHours * $overtimeRate;
                    }
                }

                $key = $entry['employee_id'] . '_' . $entry['date'];
                $existing = $existingAttendances->get($key)?->first();

                if ($existing) {
                    $existing->update([
                        'shift_id' => $roster ? $roster->id : null,
                        'attendance' => $entry['attendance'] ?? ($hoursWorked > 0 ? 'Present' : null),
                        'from_time' => $entry['from_time'] ?? null,
                        'to_time' => $entry['to_time'] ?? null,
                        'hours_worked' => $hoursWorked,
                        'normal_hours' => $normalHours,
                        'ot' => $otHours,
                        'ot_amt' => $otAmount,
                        'reason' => $entry['reason'] ?? null,
                    ]);
                } else {
                    $insertData[] = [
                        'employee_id' => $entry['employee_id'],
                        'company_id' => $entry['company_id'],
                        'date' => $entry['date'],
                        'shift_id' => $roster ? $roster->id : null,
                        'attendance' => $entry['attendance'] ?? ($hoursWorked > 0 ? 'Present' : null),
                        'from_time' => $entry['from_time'] ?? null,
                        'to_time' => $entry['to_time'] ?? null,
                        'hours_worked' => $hoursWorked,
                        'normal_hours' => $normalHours,
                        'ot' => $otHours,
                        'ot_amt' => $otAmount,
                        'reason' => $entry['reason'] ?? null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            if (!empty($insertData)) {
                EmployeeAttendance::insert($insertData);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Batch attendance store failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to save attendance: ' . $e->getMessage()]);
        }

        return back()->with('success', 'Attendance saved successfully!');
    }
}
