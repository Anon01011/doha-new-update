<?php

namespace App\Http\Controllers;

use App\Models\ShiftRoster;
use App\Models\Company;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Mail\EmployeeRosterMail;
use Illuminate\Support\Facades\Mail;
use App\Services\WeeklyOffService;

class ShiftRosterController extends Controller
{
    // Predefined shift templates
    private $shiftTemplates = [
        'morning' => ['name' => 'Morning Shift', 'time' => '6:00 AM - 2:00 PM', 'type' => 'Morning'],
        'evening' => ['name' => 'Evening Shift', 'time' => '2:00 PM - 10:00 PM', 'type' => 'Evening'],
        'night' => ['name' => 'Night Shift', 'time' => '10:00 PM - 6:00 AM', 'type' => 'Night'],
        'full_day' => ['name' => 'Full Day', 'time' => '8:00 AM - 5:00 PM', 'type' => 'Full Day'],
        'half_day' => ['name' => 'Half Day', 'time' => '8:00 AM - 12:00 PM', 'type' => 'Half Day'],
        'custom' => ['name' => 'Custom', 'time' => '', 'type' => ''],
    ];

    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            $department_id = $request->input('department_id');

            if (!$user->isAdmin() && !$user->hasPermission('view-rosters')) {
                // Handled below
            }

            // Multi-tenancy scoping
            $company_id = $request->input('company_id');
            if (!$user->isAdmin() && !$user->isHR() && $user->employee_id) {
                $company_id = $user->employee->company_id;
            }

            $companies = Company::orderBy('name')->get(['id', 'name', 'slug']);

            // Fetch departments for the selected company via pivot
            $departmentsQuery = \App\Models\Department::orderBy('name');
            if ($company_id) {
                $departmentsQuery->whereHas('companies', function ($q) use ($company_id) {
                    $q->where('companies.id', $company_id);
                });
            }
            $departments = $departmentsQuery->get(['departments.id', 'name', 'departments.company_id']);

            // Filter employees by company_id and department_id if provided
            $employeesQuery = Employee::orderBy('name');
            if ($company_id) {
                $employeesQuery->where('company_id', $company_id);
            }
            if ($department_id) {
                $employeesQuery->where('department_id', $department_id);
            }

            // If employee, only show themselves
            if ($user->role === 'employee' && $user->employee_id) {
                $employeesQuery->where('id', $user->employee_id);
            }

            $employees = $employeesQuery->with(['weeklyOffs', 'company'])->get();
            $rosters = $this->getRosterData($request, $company_id);

            // If employee without permission, filter rosters to only their own
            if ($user->isEmployee() && $user->employee_id && !$user->hasPermission('view-rosters') && isset($rosters)) {
                $rosters = $rosters->where('employee_id', $user->employee_id);
            }

            // Fetch dynamic shift types
            $shiftTypes = \App\Models\DropdownOption::where('category', 'Shift')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->pluck('value');

            return Inertia::render('ShiftRoster/Index', [
                'companies' => $companies,
                'departments' => $departments,
                'employees' => $employees,
                'rosters' => $rosters instanceof \Illuminate\Support\Collection ? $rosters->values() : $rosters,
                'week_start' => $request->input('week_start', now()->startOfWeek()->toDateString()),
                'company_id' => $company_id,
                'department_id' => $department_id,
                'shiftTemplates' => $this->shiftTemplates,
                'shiftTypes' => $shiftTypes,
                'userRole' => $user->role,
            ]);
        } catch (\Exception $e) {
            Log::error('ShiftRoster index error: ' . $e->getMessage());
            return back()->with('error', 'Error loading roster data: ' . $e->getMessage());
        }
    }

    public function create(Request $request)
    {
        try {
            $user = auth()->user();
            if (!$user->isAdmin() && !$user->hasPermission('manage-rosters')) {
                abort(403, 'Unauthorized.');
            }
            $companies = Company::orderBy('name')->get(['id', 'name', 'slug']);
            $companyParam = $request->input('company');
            $departmentParam = $request->input('department');

            // Multi-tenancy check
            if (!$user->isAdmin() && !$user->isHR() && $user->employee_id) {
                $companyParam = $user->employee->company_id;
            }

            $employeesQuery = Employee::with(['company:id,slug,weekly_off_days', 'weeklyOffs'])->orderBy('name');
            $selectedCompany = '';
            $selectedDepartment = '';
            $company_id = null;

            if ($companyParam) {
                // Check if it's a numeric ID or a slug
                if (is_numeric($companyParam)) {
                    // It's an ID
                    $company_id = $companyParam;
                    $selectedCompany = $companyParam;
                    $employeesQuery->where('company_id', $company_id);
                } else {
                    // It's a slug
                    $company = Company::where('slug', $companyParam)->first();
                    if ($company) {
                        $company_id = $company->id;
                        $selectedCompany = $company->id;
                        $employeesQuery->where('company_id', $company_id);
                    }
                }
            } else {
                $employeesQuery->whereRaw('1 = 0');
            }

            // Fetch departments for the selected company
            $departmentsQuery = \App\Models\Department::orderBy('name');
            if ($company_id) {
                $departmentsQuery->where('company_id', $company_id);
            }
            $departments = $departmentsQuery->get(['id', 'name', 'company_id']);

            // Filter by department if provided
            if ($departmentParam && is_numeric($departmentParam)) {
                $employeesQuery->where('department_id', $departmentParam);
                $selectedDepartment = $departmentParam;
            }

            $employees = $employeesQuery->get(['id', 'name', 'designation', 'company_id', 'department_id', 'employee_image']);

            // Fetch dynamic shift types
            $shiftTypes = \App\Models\DropdownOption::where('category', 'Shift')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->pluck('value');

            return Inertia::render('ShiftRoster/Create', [
                'companies' => $companies,
                'departments' => $departments,
                'employees' => $employees,
                'shiftTemplates' => $this->shiftTemplates,
                'selectedCompany' => $selectedCompany,
                'selectedDepartment' => $selectedDepartment,
                'shiftTypes' => $shiftTypes,
            ]);
        } catch (\Exception $e) {
            Log::error('ShiftRoster create error: ' . $e->getMessage());
            return back()->with('error', 'Error loading create form: ' . $e->getMessage());
        }
    }

    public function store(Request $request)
    {
        try {
            $user = auth()->user();
            if (!$user->isAdmin() && !$user->hasPermission('manage-rosters')) {
                abort(403, 'Unauthorized.');
            }
            Log::info('ShiftRoster store request:', $request->all());

            // Multi-tenancy check
            if (!$user->isAdmin() && $user->employee_id && $user->employee) {
                if ($request->input('company_id') && $request->input('company_id') != $user->employee->company_id) {
                    abort(403, 'Unauthorized access to another branch.');
                }
            }

            $data = $this->validateRosterData($request);
            Log::info('Validated data:', $data);

            $result = $this->processRosterEntries($data);
            Log::info('Process result:', $result);

            // Send WhatsApp notifications after successful save
            $this->sendBulkAutomaticNotifications($data);

            // Redirect with the correct parameters to show the saved data
            $redirectParams = [
                'company_id' => $data['company_id'],
                'week_start' => $data['week_start']
            ];

            // Include department_id if it was in the request
            if ($request->has('department_id')) {
                $redirectParams['department_id'] = $request->input('department_id');
            }

            return redirect()->route('shift-rosters.index', $redirectParams)
                ->with('success', $this->generateSuccessMessage($result));

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('ShiftRoster validation error: ' . json_encode($e->errors()));
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('ShiftRoster store error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Error saving roster: ' . $e->getMessage())->withInput();
        }
    }

    public function show(ShiftRoster $shiftRoster)
    {
        try {
            $shiftRoster->load(['employee', 'company']);
            return Inertia::render('ShiftRoster/Show', [
                'roster' => $shiftRoster,
                'shiftTemplates' => $this->shiftTemplates,
            ]);
        } catch (\Exception $e) {
            Log::error('ShiftRoster show error: ' . $e->getMessage());
            return back()->with('error', 'Error loading roster details: ' . $e->getMessage());
        }
    }

    public function edit(ShiftRoster $shiftRoster)
    {
        try {
            $user = auth()->user();
            if (!$user->isAdmin() && !$user->hasPermission('manage-rosters')) {
                abort(403, 'Unauthorized.');
            }
            $shiftRoster->load(['employee', 'company']);

            // Fetch dynamic shift types
            $shiftTypes = \App\Models\DropdownOption::where('category', 'Shift')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->pluck('value');

            return Inertia::render('ShiftRoster/Edit', [
                'roster' => $shiftRoster,
                'shiftTemplates' => $this->shiftTemplates,
                'shiftTypes' => $shiftTypes,
            ]);
        } catch (\Exception $e) {
            Log::error('ShiftRoster edit error: ' . $e->getMessage());
            return back()->with('error', 'Error loading edit form: ' . $e->getMessage());
        }
    }

    public function update(Request $request, ShiftRoster $shiftRoster)
    {
        try {
            $data = $request->validate([
                'shift_time' => 'required|string|max:255',
                'shift_type' => 'nullable|string|max:255',
                'designation' => 'nullable|string|max:255',
                'notes' => 'nullable|string|max:1000',
            ]);

            if ($shiftRoster->isWeeklyOffDay()) {
                $data['shift_time'] = 'Weekly Off';
                $data['shift_type'] = 'Weekly Off';
                $data['notes'] = 'Auto: Weekly Off Day';
            }

            $shiftRoster->update($data);
            $this->sendAutomaticNotification($shiftRoster);

            Log::info('ShiftRoster updated', ['id' => $shiftRoster->id]);

            // Return redirect for both regular and AJAX (Inertia) requests
            return back()->with('success', 'Roster updated successfully!');

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('ShiftRoster update validation error: ' . json_encode($e->errors()));

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors()
                ], 422);
            }

            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('ShiftRoster update error: ' . $e->getMessage());

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error updating roster: ' . $e->getMessage()
                ], 500);
            }

            return back()->with('error', 'Error updating roster: ' . $e->getMessage())->withInput();
        }
    }

    public function destroy(ShiftRoster $shiftRoster)
    {
        try {
            $shiftRoster->delete();
            Log::info('ShiftRoster deleted', ['id' => $shiftRoster->id]);

            return back()->with('success', 'Roster deleted successfully!');
        } catch (\Exception $e) {
            Log::error('ShiftRoster destroy error: ' . $e->getMessage());
            return back()->with('error', 'Error deleting roster: ' . $e->getMessage());
        }
    }

    // Create individual shift from inline editor
    public function createShift(Request $request)
    {
        try {
            $data = $request->validate([
                'employee_id' => 'required|exists:employees,id',
                'company_id' => 'required|exists:companies,id',
                'week_start' => 'required|date',
                'day' => 'required|in:Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
                'shift_time' => 'required|string|max:255',
                'shift_type' => 'nullable|string|max:255',
                'designation' => 'nullable|string|max:255',
                'notes' => 'nullable|string|max:1000',
            ]);

            $employee = Employee::with(['weeklyOffs', 'company'])->find($data['employee_id']);
            if ($employee) {
                $dayMap = [
                    'Monday' => 0, 'Tuesday' => 1, 'Wednesday' => 2, 'Thursday' => 3,
                    'Friday' => 4, 'Saturday' => 5, 'Sunday' => 6
                ];
                $dayOffset = $dayMap[$data['day']] ?? 0;
                $actualDate = Carbon::parse($data['week_start'])->addDays($dayOffset);

                $weeklyOffService = app(WeeklyOffService::class);
                if ($weeklyOffService->isWeeklyOff($employee, $actualDate)) {
                    $data['shift_time'] = 'Weekly Off';
                    $data['shift_type'] = 'Weekly Off';
                    $data['notes'] = 'Auto: Weekly Off Day';
                }
            }

            $shiftRoster = ShiftRoster::updateOrCreate(
                [
                    'employee_id' => $data['employee_id'],
                    'week_start' => $data['week_start'],
                    'day' => $data['day'],
                ],
                $data
            );
            $this->sendAutomaticNotification($shiftRoster);

            Log::info('ShiftRoster created/updated from inline editor', ['id' => $shiftRoster->id]);

            return back()->with('success', 'Shift saved successfully!');

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('ShiftRoster create shift validation error: ' . json_encode($e->errors()));
            return back()->withErrors($e->errors());
        } catch (\Exception $e) {
            Log::error('ShiftRoster create shift error: ' . $e->getMessage());
            return back()->with('error', 'Error creating shift: ' . $e->getMessage());
        }
    }

    // Advanced Methods

    public function bulkStore(Request $request)
    {
        try {
            $data = $this->validateRosterData($request);
            $user = auth()->user();

            // Multi-tenancy check
            if (!$user->isAdmin() && $user->employee_id && $user->employee) {
                if ($data['company_id'] != $user->employee->company_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized access to another branch.'
                    ], 403);
                }
            }

            $result = $this->processRosterEntries($data);

            return response()->json([
                'success' => true,
                'message' => $this->generateSuccessMessage($result),
                'data' => $result
            ]);

        } catch (\Exception $e) {
            Log::error('ShiftRoster bulk store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error in batch operation: ' . $e->getMessage()
            ], 500);
        }
    }

    public function duplicateWeek(Request $request)
    {
        try {
            $user = auth()->user();
            $data = $request->validate([
                'source_week' => 'required|date',
                'target_week' => 'required|date',
                'company_id' => 'required|exists:companies,id',
            ]);

            // Multi-tenancy check
            if (!$user->isAdmin() && $user->employee_id && $user->employee) {
                if ($data['company_id'] != $user->employee->company_id) {
                    abort(403, 'Unauthorized access to another branch.');
                }
            }

            $query = ShiftRoster::where('company_id', $data['company_id'])
                ->where('week_start', $data['source_week']);

            if ($request->has('department_id') && $request->department_id) {
                $departmentId = $request->department_id;
                $employeeIds = Employee::where('department_id', $departmentId)->pluck('id');
                $query->whereIn('employee_id', $employeeIds);
            }

            $sourceRosters = $query->get();

            $duplicatedCount = 0;
            DB::beginTransaction();

            try {
                foreach ($sourceRosters as $roster) {
                    ShiftRoster::updateOrCreate([
                        'employee_id' => $roster->employee_id,
                        'company_id' => $roster->company_id,
                        'week_start' => $data['target_week'],
                        'day' => $roster->day,
                    ], [
                        'shift_time' => $roster->shift_time,
                        'shift_type' => $roster->shift_type,
                        'designation' => $roster->designation,
                        'notes' => $roster->notes,
                    ]);
                    $duplicatedCount++;
                }

                DB::commit();
                return back()->with('success', "Successfully duplicated {$duplicatedCount} roster entries");

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('ShiftRoster duplicate week error: ' . $e->getMessage());
            return back()->with('error', 'Error duplicating week: ' . $e->getMessage());
        }
    }

    public function clearWeek(Request $request)
    {
        try {
            $user = auth()->user();
            $data = $request->validate([
                'week_start' => 'required|date',
                'company_id' => 'required|exists:companies,id',
            ]);

            // Multi-tenancy check
            if (!$user->isAdmin() && $user->employee_id && $user->employee) {
                if ($data['company_id'] != $user->employee->company_id) {
                    abort(403, 'Unauthorized access to another branch.');
                }
            }

            $query = ShiftRoster::where('company_id', $data['company_id'])
                ->where('week_start', $data['week_start']);

            if ($request->has('department_id') && $request->department_id) {
                $departmentId = $request->department_id;
                $employeeIds = Employee::where('department_id', $departmentId)->pluck('id');
                $query->whereIn('employee_id', $employeeIds);
            }

            $deletedCount = $query->delete();

            return back()->with('success', "Successfully cleared {$deletedCount} roster entries");

        } catch (\Exception $e) {
            Log::error('ShiftRoster clear week error: ' . $e->getMessage());
            return back()->with('error', 'Error clearing week: ' . $e->getMessage());
        }
    }

    public function exportWeek(Request $request)
    {
        try {
            $user = auth()->user();
            $data = $request->validate([
                'week_start' => 'required|date',
                'company_id' => 'required|exists:companies,id',
            ]);

            // Multi-tenancy check
            if (!$user->isAdmin() && $user->employee_id && $user->employee) {
                if ($data['company_id'] != $user->employee->company_id) {
                    abort(403, 'Unauthorized access to another branch.');
                }
            }

            $weekStart = Carbon::parse($data['week_start']);
            $company = Company::find($data['company_id']);

            // Get all employees for this company, filtered by department if needed
            $employeesQuery = Employee::where('company_id', $data['company_id'])->orderBy('name');

            if ($request->has('department_id') && $request->department_id) {
                $employeesQuery->where('department_id', $request->department_id);
            }

            $employees = $employeesQuery->get();

            // Get rosters for the week, filtered by department employees
            $rosterQuery = ShiftRoster::with(['employee'])
                ->where('company_id', $data['company_id'])
                ->where('week_start', $data['week_start']);

            if ($request->has('department_id') && $request->department_id) {
                $rosterQuery->whereIn('employee_id', $employees->pluck('id'));
            }

            $rosters = $rosterQuery->get()->groupBy('employee_id');

            // Generate days of the week
            $days = [];
            for ($i = 0; $i < 7; $i++) {
                $date = $weekStart->copy()->addDays($i);
                $days[] = [
                    'date' => $date->format('Y-m-d'),
                    'day' => $date->format('l'),
                    'label' => $date->format('D, M d')
                ];
            }

            // Create Excel file using PhpSpreadsheet
            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Roster');

            // Set page orientation to landscape
            $sheet->getPageSetup()->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE);

            // Title Row
            $sheet->setCellValue('A1', $company->name . ' - Weekly Roster');
            $sheet->mergeCells('A1:J1');
            $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
            $sheet->getStyle('A1')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('A1')->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setARGB('FF4472C4');
            $sheet->getStyle('A1')->getFont()->getColor()->setARGB('FFFFFFFF');
            $sheet->getRowDimension(1)->setRowHeight(30);

            // Week Info Row
            $weekInfo = 'Week: ' . $weekStart->format('M d, Y') . ' - ' . $weekStart->copy()->addDays(6)->format('M d, Y');
            $sheet->setCellValue('A2', $weekInfo);
            $sheet->mergeCells('A2:J2');
            $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(12);
            $sheet->getStyle('A2')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('A2')->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setARGB('FFD9E1F2');
            $sheet->getRowDimension(2)->setRowHeight(25);

            // Header Row
            $headerRow = 4;
            $headers = ['Employee ID', 'Employee Name', 'Designation'];
            foreach ($days as $day) {
                $headers[] = $day['label'];
            }

            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . $headerRow, $header);
                $sheet->getStyle($col . $headerRow)->getFont()->setBold(true)->setSize(11);
                $sheet->getStyle($col . $headerRow)->getAlignment()
                    ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER)
                    ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);
                $sheet->getStyle($col . $headerRow)->getFill()
                    ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                    ->getStartColor()->setARGB('FF5B9BD5');
                $sheet->getStyle($col . $headerRow)->getFont()->getColor()->setARGB('FFFFFFFF');
                $col++;
            }
            $sheet->getRowDimension($headerRow)->setRowHeight(25);

            // Data Rows
            $row = $headerRow + 1;
            foreach ($employees as $employee) {
                $employeeRosters = $rosters->get($employee->id, collect());

                // Employee ID
                $sheet->setCellValue('A' . $row, $employee->employee_code ?? $employee->id);

                // Employee Name
                $sheet->setCellValue('B' . $row, $employee->name);

                // Designation
                $sheet->setCellValue('C' . $row, $employee->designation ?? '-');

                // Shift times for each day
                $col = 'D';
                foreach ($days as $day) {
                    $roster = $employeeRosters->firstWhere('day', $day['day']);
                    if ($roster) {
                        $cellValue = $roster->shift_time;
                        if ($roster->shift_type) {
                            $cellValue .= "\n(" . $roster->shift_type . ")";
                        }
                        $sheet->setCellValue($col . $row, $cellValue);

                        // Color code based on shift type
                        $bgColor = 'FFFFFFFF'; // White default
                        if ($roster->shift_type === 'Morning') {
                            $bgColor = 'FFFCE4D6'; // Light orange
                        } elseif ($roster->shift_type === 'Evening') {
                            $bgColor = 'FFE2EFDA'; // Light green
                        } elseif ($roster->shift_type === 'Night') {
                            $bgColor = 'FFD9E1F2'; // Light blue
                        }

                        $sheet->getStyle($col . $row)->getFill()
                            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                            ->getStartColor()->setARGB($bgColor);

                        $sheet->getStyle($col . $row)->getAlignment()
                            ->setWrapText(true)
                            ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);
                    } else {
                        $sheet->setCellValue($col . $row, '-');
                        $sheet->getStyle($col . $row)->getAlignment()
                            ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
                    }
                    $col++;
                }

                // Alternate row colors
                if ($row % 2 == 0) {
                    $sheet->getStyle('A' . $row . ':C' . $row)->getFill()
                        ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                        ->getStartColor()->setARGB('FFF2F2F2');
                }

                $sheet->getRowDimension($row)->setRowHeight(35);
                $row++;
            }

            // Set column widths
            $sheet->getColumnDimension('A')->setWidth(15); // Employee ID
            $sheet->getColumnDimension('B')->setWidth(25); // Employee Name
            $sheet->getColumnDimension('C')->setWidth(20); // Designation

            // Day columns
            foreach (range('D', 'J') as $col) {
                $sheet->getColumnDimension($col)->setWidth(18);
            }

            // Add borders to all data
            $lastRow = $row - 1;
            $sheet->getStyle('A4:J' . $lastRow)->getBorders()->getAllBorders()
                ->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN)
                ->getColor()->setARGB('FF000000');

            // Center align all cells
            $sheet->getStyle('A' . $headerRow . ':J' . $lastRow)->getAlignment()
                ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER)
                ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);

            // Left align employee names
            $sheet->getStyle('B' . ($headerRow + 1) . ':B' . $lastRow)->getAlignment()
                ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_LEFT);

            // Add legend
            $legendRow = $lastRow + 2;
            $sheet->setCellValue('A' . $legendRow, 'Legend:');
            $sheet->getStyle('A' . $legendRow)->getFont()->setBold(true);

            $legendRow++;
            $sheet->setCellValue('A' . $legendRow, 'Morning Shift');
            $sheet->getStyle('A' . $legendRow)->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setARGB('FFFCE4D6');

            $sheet->setCellValue('B' . $legendRow, 'Evening Shift');
            $sheet->getStyle('B' . $legendRow)->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setARGB('FFE2EFDA');

            $sheet->setCellValue('C' . $legendRow, 'Night Shift');
            $sheet->getStyle('C' . $legendRow)->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setARGB('FFD9E1F2');

            // Generate filename
            $filename = 'Roster_' . $company->name . '_' . $weekStart->format('Y-m-d') . '.xlsx';
            $filename = preg_replace('/[^A-Za-z0-9_\-.]/', '_', $filename);

            // Save to temporary file
            $tempFile = tempnam(sys_get_temp_dir(), 'roster_');
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $writer->save($tempFile);

            // Return file download
            return response()->download($tempFile, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            Log::error('ShiftRoster export week error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error exporting week: ' . $e->getMessage()
            ], 500);
        }
    }

    public function sendRosterEmails(Request $request)
    {
        try {
            $user = auth()->user();
            $company_id = $request->input('company_id');
            $week_start = $request->input('week_start');
            $month = $request->input('month');
            $year = $request->input('year');
            $start_date = $request->input('start_date');
            $end_date = $request->input('end_date');

            if (!$company_id) {
                return response()->json(['success' => false, 'message' => 'Company ID is required.'], 422);
            }

            // Multi-tenancy check
            if ($user->role !== 'admin' && $user->employee_id && $user->employee) {
                if ($company_id != $user->employee->company_id) {
                    return response()->json(['success' => false, 'message' => 'Unauthorized access to another branch.'], 403);
                }
            }

            $company = Company::findOrFail($company_id);

            // Fetch integration settings
            $sendEmail = \App\Models\Setting::get('roster_send_email', true, $company_id);
            $sendWhatsapp = \App\Models\Setting::get('roster_send_whatsapp', false, $company_id);
            $sendSms = \App\Models\Setting::get('roster_send_sms', false, $company_id);

            // Validation check
            if ($sendWhatsapp) {
                $waProvider = \App\Models\Setting::get('whatsapp_provider', 'custom', $company_id);
                switch ($waProvider) {
                    case 'twilio':
                        if (empty(\App\Models\Setting::get('twilio_sid', null, $company_id)) || empty(\App\Models\Setting::get('twilio_token', null, $company_id))) {
                            return response()->json(['success' => false, 'message' => 'WhatsApp notifications are enabled (Twilio) but credentials are not configured. Please configure them in Settings -> Integrations.', 'missing_integration' => 'whatsapp'], 422);
                        }
                        break;
                    case 'vonage':
                        if (empty(\App\Models\Setting::get('vonage_api_key', null, $company_id)) || empty(\App\Models\Setting::get('vonage_api_secret', null, $company_id))) {
                            return response()->json(['success' => false, 'message' => 'WhatsApp notifications are enabled (Vonage) but credentials are not configured.', 'missing_integration' => 'whatsapp'], 422);
                        }
                        break;
                    case 'infobip':
                        if (empty(\App\Models\Setting::get('infobip_api_key', null, $company_id)) || empty(\App\Models\Setting::get('infobip_base_url', null, $company_id))) {
                            return response()->json(['success' => false, 'message' => 'WhatsApp notifications are enabled (InfoBip) but credentials are not configured.', 'missing_integration' => 'whatsapp'], 422);
                        }
                        break;
                    case 'messagebird':
                        if (empty(\App\Models\Setting::get('messagebird_access_key', null, $company_id))) {
                            return response()->json(['success' => false, 'message' => 'WhatsApp notifications are enabled (MessageBird) but credentials are not configured.', 'missing_integration' => 'whatsapp'], 422);
                        }
                        break;
                    case 'plivo':
                        if (empty(\App\Models\Setting::get('plivo_auth_id', null, $company_id)) || empty(\App\Models\Setting::get('plivo_auth_token', null, $company_id))) {
                            return response()->json(['success' => false, 'message' => 'WhatsApp notifications are enabled (Plivo) but credentials are not configured.', 'missing_integration' => 'whatsapp'], 422);
                        }
                        break;
                    case 'meta':
                        if (empty(\App\Models\Setting::get('meta_phone_number_id', null, $company_id)) || empty(\App\Models\Setting::get('whatsapp_api_token', null, $company_id))) {
                            return response()->json(['success' => false, 'message' => 'WhatsApp notifications are enabled (Meta) but credentials are not configured. Please configure them in Settings -> Integrations.', 'missing_integration' => 'whatsapp'], 422);
                        }
                        break;
                    default:
                        if (empty(\App\Models\Setting::get('whatsapp_api_url', null, $company_id)) || empty(\App\Models\Setting::get('whatsapp_api_token', null, $company_id))) {
                            return response()->json(['success' => false, 'message' => 'WhatsApp notifications are enabled (Custom) but API credentials are not configured. Please configure them in Settings -> Integrations.', 'missing_integration' => 'whatsapp'], 422);
                        }
                        break;
                }
            }

            if ($sendSms) {
                $smsProvider = \App\Models\Setting::get('sms_provider', 'custom', $company_id);
                switch ($smsProvider) {
                    case 'twilio':
                        if (empty(\App\Models\Setting::get('twilio_sid', null, $company_id)) || empty(\App\Models\Setting::get('twilio_token', null, $company_id))) {
                            return response()->json(['success' => false, 'message' => 'SMS notifications are enabled (Twilio) but credentials are not configured. Please configure them in Settings -> Integrations.', 'missing_integration' => 'sms'], 422);
                        }
                        break;
                    case 'vonage':
                        if (empty(\App\Models\Setting::get('vonage_api_key', null, $company_id)) || empty(\App\Models\Setting::get('vonage_api_secret', null, $company_id))) {
                            return response()->json(['success' => false, 'message' => 'SMS notifications are enabled (Vonage) but credentials are not configured.', 'missing_integration' => 'sms'], 422);
                        }
                        break;
                    case 'infobip':
                        if (empty(\App\Models\Setting::get('infobip_api_key', null, $company_id)) || empty(\App\Models\Setting::get('infobip_base_url', null, $company_id))) {
                            return response()->json(['success' => false, 'message' => 'SMS notifications are enabled (InfoBip) but credentials are not configured.', 'missing_integration' => 'sms'], 422);
                        }
                        break;
                    case 'messagebird':
                        if (empty(\App\Models\Setting::get('messagebird_access_key', null, $company_id))) {
                            return response()->json(['success' => false, 'message' => 'SMS notifications are enabled (MessageBird) but credentials are not configured.', 'missing_integration' => 'sms'], 422);
                        }
                        break;
                    case 'plivo':
                        if (empty(\App\Models\Setting::get('plivo_auth_id', null, $company_id)) || empty(\App\Models\Setting::get('plivo_auth_token', null, $company_id))) {
                            return response()->json(['success' => false, 'message' => 'SMS notifications are enabled (Plivo) but credentials are not configured.', 'missing_integration' => 'sms'], 422);
                        }
                        break;
                    default:
                        if (empty(\App\Models\Setting::get('sms_api_url', null, $company_id)) || empty(\App\Models\Setting::get('sms_api_token', null, $company_id))) {
                            return response()->json(['success' => false, 'message' => 'SMS notifications are enabled (Custom) but API credentials are not configured. Please configure them in Settings -> Integrations.', 'missing_integration' => 'sms'], 422);
                        }
                        break;
                }
            }

            // At least one channel must be enabled
            if (!$sendEmail && !$sendWhatsapp && !$sendSms) {
                return response()->json([
                    'success' => false,
                    'message' => 'No notification channels are enabled. Please enable Email, WhatsApp, or SMS in Settings -> Integrations.',
                    'missing_integration' => 'all'
                ], 422);
            }

            $employeesQuery = Employee::where('company_id', $company_id);
            if ($request->has('department_id') && $request->department_id) {
                $employeesQuery->where('department_id', $request->department_id);
            }
            $employees = $employeesQuery->get();

            if ($employees->isEmpty()) {
                return response()->json(['success' => false, 'message' => 'No employees found for this selection.'], 422);
            }

            // Build date range and fetch rosters
            $rosters = collect();
            $dateRange = '';

            $rosterQuery = ShiftRoster::where('company_id', $company_id);

            if ($request->has('department_id') && $request->department_id) {
                $rosterQuery->whereIn('employee_id', $employees->pluck('id'));
            }

            if ($week_start) {
                $startDate = Carbon::parse($week_start);
                $endDate = $startDate->copy()->addDays(6);
                $dateRange = $startDate->format('M d, Y') . ' - ' . $endDate->format('M d, Y');

                $rosterQuery->where('week_start', $week_start);
            } elseif ($month !== null && $year) {
                $startDate = Carbon::create($year, $month + 1, 1);
                $endDate = $startDate->copy()->endOfMonth();
                $dateRange = $startDate->format('F Y');

                $rosterQuery->whereYear('week_start', $year)
                    ->whereMonth('week_start', $month + 1);
            } elseif ($start_date && $end_date) {
                $startDate = Carbon::parse($start_date);
                $endDate = Carbon::parse($end_date);
                $dateRange = $startDate->format('M d, Y') . ' - ' . $endDate->format('M d, Y');

                $rosterQuery->whereBetween('week_start', [$start_date, $end_date]);
            } else {
                return response()->json(['success' => false, 'message' => 'Invalid date range. Please specify week_start, month/year, or start_date/end_date.'], 422);
            }

            $rosters = $rosterQuery->get();

            Log::info('Sending roster emails', [
                'company_id' => $company_id,
                'company_name' => $company->name,
                'date_range' => $dateRange,
                'total_employees' => $employees->count(),
                'total_rosters' => $rosters->count(),
                'week_start' => $week_start,
                'month' => $month,
                'year' => $year,
                'start_date' => $start_date,
                'end_date' => $end_date
            ]);

            $sent = 0;
            $failed = 0;
            $noContact = 0;
            $noShifts = 0;
            $results = [];

            foreach ($employees as $employee) {
                $employeeRoster = $rosters->where('employee_id', $employee->id)->map(function ($r) {
                    return [
                        'day' => $r->day,
                        'date' => Carbon::parse($r->week_start)->addDays($this->getDayOffset($r->day))->format('M d, Y'),
                        'shift_time' => $r->shift_time,
                        'shift_type' => $r->shift_type,
                        'designation' => $r->designation,
                        'notes' => $r->notes,
                    ];
                })->values()->toArray();

                $hasContactInfo = false;
                if ($sendEmail && !empty($employee->email))
                    $hasContactInfo = true;
                if ($sendWhatsapp && !empty($employee->mobile))
                    $hasContactInfo = true;
                if ($sendSms && !empty($employee->mobile))
                    $hasContactInfo = true;

                if (!$hasContactInfo) {
                    $noContact++;
                    $results[] = [
                        'employee' => $employee->name,
                        'status' => 'no_contact',
                        'message' => 'No valid email or mobile found for enabled channels'
                    ];
                    continue;
                }

                if (empty($employeeRoster)) {
                    $noShifts++;
                    $results[] = [
                        'employee' => $employee->name,
                        'status' => 'no_shifts',
                        'message' => 'No shifts assigned for this period'
                    ];
                    continue;
                }

                try {
                    if ($sendEmail) {
                        Mail::to($employee->email)->queue(new EmployeeRosterMail($employee, $company, $employeeRoster, $dateRange));
                    }

                    if ($sendWhatsapp && !empty($employee->mobile)) {
                        $waService = new \App\Services\WhatsAppService();
                        $waService->sendRosterNotification($employee, $company, $employeeRoster, $dateRange);
                    }

                    if ($sendSms && !empty($employee->mobile)) {
                        $smsMessage = "Hi {$employee->name},\nYour shift roster for {$dateRange} at {$company->name}:\n";
                        foreach ($employeeRoster as $shift) {
                            $smsMessage .= "- {$shift['date']} ({$shift['day']}): {$shift['shift_time']} ({$shift['designation']})\n";
                        }
                        $smsMessage .= "Please arrive 10 mins early. Contact HR for queries.";

                        // TODO: Implement actual SMS API call (Twilio or Custom)
                        Log::info('SMS roster notification queued', [
                            'employee_id' => $employee->id,
                            'mobile' => $employee->mobile,
                            'message_preview' => $smsMessage
                        ]);
                    }

                    $sent++;
                    $results[] = [
                        'employee' => $employee->name,
                        'email' => $employee->email,
                        'status' => 'sent',
                        'shifts_count' => count($employeeRoster)
                    ];

                    Log::info('Roster notification queued successfully', [
                        'employee_id' => $employee->id,
                        'employee_name' => $employee->name,
                        'channels' => [
                            'email' => $sendEmail,
                            'whatsapp' => $sendWhatsapp,
                            'sms' => $sendSms
                        ],
                        'shifts_count' => count($employeeRoster)
                    ]);
                } catch (\Exception $e) {
                    $failed++;
                    $results[] = [
                        'employee' => $employee->name,
                        'email' => $employee->email,
                        'status' => 'failed',
                        'error' => $e->getMessage()
                    ];

                    Log::error('Failed to send roster email', [
                        'employee_id' => $employee->id,
                        'employee_name' => $employee->name,
                        'email' => $employee->email,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            $message = "Roster notifications processed for {$company->name} ({$dateRange}):\n";
            $message .= "✅ Sent: {$sent}\n";
            $message .= "❌ Failed: {$failed}\n";
            $message .= "⚠️ No Contact Info: {$noContact}\n";
            $message .= "📅 No Shifts: {$noShifts}";

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'company' => $company->name,
                    'date_range' => $dateRange,
                    'total_employees' => $employees->count(),
                    'sent' => $sent,
                    'failed' => $failed,
                    'no_contact' => $noContact,
                    'no_shifts' => $noShifts,
                    'results' => $results
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error sending roster emails: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error sending roster emails: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send roster emails to selected employees
     */
    public function sendRosterEmailsToSelected(Request $request)
    {
        try {
            $request->validate([
                'employee_ids' => 'required|array|min:1',
                'employee_ids.*' => 'integer|exists:employees,id',
                'company_id' => 'required|integer|exists:companies,id',
                'week_start' => 'nullable|date',
                'month' => 'nullable|integer|min:0|max:11',
                'year' => 'nullable|integer|min:2000|max:2100',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
            ]);

            $company_id = $request->input('company_id');
            $employee_ids = $request->input('employee_ids');
            $week_start = $request->input('week_start');
            $month = $request->input('month');
            $year = $request->input('year');
            $start_date = $request->input('start_date');
            $end_date = $request->input('end_date');

            $user = auth()->user();
            // Multi-tenancy check
            if ($user->role !== 'admin' && $user->employee_id && $user->employee) {
                if ($company_id != $user->employee->company_id) {
                    return response()->json(['success' => false, 'message' => 'Unauthorized access to another branch.'], 403);
                }
            }

            $company = Company::findOrFail($company_id);
            $employees = Employee::whereIn('id', $employee_ids)->where('company_id', $company_id)->get();

            if ($employees->isEmpty()) {
                return response()->json(['success' => false, 'message' => 'No valid employees found for the selected company.'], 422);
            }

            // Build date range and fetch rosters
            $rosters = collect();
            $dateRange = '';

            if ($week_start) {
                $startDate = Carbon::parse($week_start);
                $endDate = $startDate->copy()->addDays(6);
                $dateRange = $startDate->format('M d, Y') . ' - ' . $endDate->format('M d, Y');

                $rosters = ShiftRoster::where('company_id', $company_id)
                    ->where('week_start', $week_start)
                    ->get();
            } elseif ($month !== null && $year) {
                $startDate = Carbon::create($year, $month + 1, 1);
                $endDate = $startDate->copy()->endOfMonth();
                $dateRange = $startDate->format('F Y');

                $rosters = ShiftRoster::where('company_id', $company_id)
                    ->whereYear('week_start', $year)
                    ->whereMonth('week_start', $month + 1)
                    ->get();
            } elseif ($start_date && $end_date) {
                $startDate = Carbon::parse($start_date);
                $endDate = Carbon::parse($end_date);
                $dateRange = $startDate->format('M d, Y') . ' - ' . $endDate->format('M d, Y');

                $rosters = ShiftRoster::where('company_id', $company_id)
                    ->whereBetween('week_start', [$start_date, $end_date])
                    ->get();
            } else {
                return response()->json(['success' => false, 'message' => 'Invalid date range. Please specify week_start, month/year, or start_date/end_date.'], 422);
            }

            $sent = 0;
            $failed = 0;
            $noContact = 0;
            $noShifts = 0;
            $results = [];

            foreach ($employees as $employee) {
                $employeeRoster = $rosters->where('employee_id', $employee->id)->map(function ($r) {
                    return [
                        'day' => $r->day,
                        'date' => Carbon::parse($r->week_start)->addDays($this->getDayOffset($r->day))->format('M d, Y'),
                        'shift_time' => $r->shift_time,
                        'shift_type' => $r->shift_type,
                        'designation' => $r->designation,
                        'notes' => $r->notes,
                    ];
                })->values()->toArray();

                try {
                    $sendEmail = \App\Models\Setting::get('roster_send_email', true, $company_id);
                    $sendWhatsapp = \App\Models\Setting::get('roster_send_whatsapp', false, $company_id);
                    $sendSms = \App\Models\Setting::get('roster_send_sms', false, $company_id);

                    $hasContactInfo = false;
                    if ($sendEmail && !empty($employee->email))
                        $hasContactInfo = true;
                    if ($sendWhatsapp && !empty($employee->mobile))
                        $hasContactInfo = true;
                    if ($sendSms && !empty($employee->mobile))
                        $hasContactInfo = true;

                    if (!$hasContactInfo) {
                        $noContact++;
                        $results[] = [
                            'employee' => $employee->name,
                            'status' => 'no_contact',
                            'message' => 'No valid email or mobile found for enabled channels'
                        ];
                        continue;
                    }

                    if ($sendEmail && !empty($employee->email)) {
                        Mail::to($employee->email)->queue(new EmployeeRosterMail($employee, $company, $employeeRoster, $dateRange));
                    }

                    if ($sendWhatsapp && !empty($employee->mobile)) {
                        $waService = new \App\Services\WhatsAppService();
                        $waService->sendRosterNotification($employee, $company, $employeeRoster, $dateRange);
                    }

                    if ($sendSms && !empty($employee->mobile)) {
                        // TODO: Implement actual SMS API call
                        Log::info('SMS roster notification queued (selected)', [
                            'employee_id' => $employee->id,
                            'mobile' => $employee->mobile
                        ]);
                    }

                    $sent++;
                    $results[] = [
                        'employee' => $employee->name,
                        'email' => $employee->email,
                        'status' => 'sent',
                        'shifts_count' => count($employeeRoster)
                    ];
                } catch (\Exception $e) {
                    $failed++;
                    $results[] = [
                        'employee' => $employee->name,
                        'email' => $employee->email,
                        'status' => 'failed',
                        'error' => $e->getMessage()
                    ];
                }
            }

            $message = "Roster notifications sent to selected employees ({$dateRange}):\n";
            $message .= "✅ Sent: {$sent}\n";
            $message .= "❌ Failed: {$failed}\n";
            $message .= "⚠️ No Contact Info: {$noContact}\n";
            $message .= "📅 No Shifts: {$noShifts}";

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'company' => $company->name,
                    'date_range' => $dateRange,
                    'total_employees' => $employees->count(),
                    'sent' => $sent,
                    'failed' => $failed,
                    'no_contact' => $noContact,
                    'no_shifts' => $noShifts,
                    'results' => $results
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error sending roster emails to selected employees: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error sending roster emails: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send roster email to a single employee
     */
    public function sendRosterEmailToSingle(Request $request)
    {
        try {
            $request->validate([
                'employee_id' => 'required|integer|exists:employees,id',
                'company_id' => 'required|integer|exists:companies,id',
                'week_start' => 'nullable|date',
                'month' => 'nullable|integer|min:0|max:11',
                'year' => 'nullable|integer|min:2000|max:2100',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
            ]);

            $company_id = $request->input('company_id');
            $employee_id = $request->input('employee_id');
            $week_start = $request->input('week_start');
            $month = $request->input('month');
            $year = $request->input('year');
            $start_date = $request->input('start_date');
            $end_date = $request->input('end_date');

            $user = auth()->user();
            // Multi-tenancy check
            if ($user->role !== 'admin' && $user->employee_id && $user->employee) {
                if ($company_id != $user->employee->company_id) {
                    return response()->json(['success' => false, 'message' => 'Unauthorized access to another branch.'], 403);
                }
            }

            $company = Company::findOrFail($company_id);
            $employee = Employee::where('id', $employee_id)->where('company_id', $company_id)->first();

            if (!$employee) {
                return response()->json(['success' => false, 'message' => 'Employee not found or does not belong to the specified company.'], 422);
            }

            // Build date range and fetch rosters
            $rosters = collect();
            $dateRange = '';

            if ($week_start) {
                $startDate = Carbon::parse($week_start);
                $endDate = $startDate->copy()->addDays(6);
                $dateRange = $startDate->format('M d, Y') . ' - ' . $endDate->format('M d, Y');

                $rosters = ShiftRoster::where('company_id', $company_id)
                    ->where('employee_id', $employee_id)
                    ->where('week_start', $week_start)
                    ->get();
            } elseif ($month !== null && $year) {
                $startDate = Carbon::create($year, $month + 1, 1);
                $endDate = $startDate->copy()->endOfMonth();
                $dateRange = $startDate->format('F Y');

                $rosters = ShiftRoster::where('company_id', $company_id)
                    ->where('employee_id', $employee_id)
                    ->whereYear('week_start', $year)
                    ->whereMonth('week_start', $month + 1)
                    ->get();
            } elseif ($start_date && $end_date) {
                $startDate = Carbon::parse($start_date);
                $endDate = Carbon::parse($end_date);
                $dateRange = $startDate->format('M d, Y') . ' - ' . $endDate->format('M d, Y');

                $rosters = ShiftRoster::where('company_id', $company_id)
                    ->where('employee_id', $employee_id)
                    ->whereBetween('week_start', [$start_date, $end_date])
                    ->get();
            } else {
                return response()->json(['success' => false, 'message' => 'Invalid date range. Please specify week_start, month/year, or start_date/end_date.'], 422);
            }

            $employeeRoster = $rosters->map(function ($r) {
                return [
                    'day' => $r->day,
                    'date' => Carbon::parse($r->week_start)->addDays($this->getDayOffset($r->day))->format('M d, Y'),
                    'shift_time' => $r->shift_time,
                    'shift_type' => $r->shift_type,
                    'designation' => $r->designation,
                    'notes' => $r->notes,
                ];
            })->values()->toArray();

            if (empty($employeeRoster)) {
                return response()->json(['success' => false, 'message' => 'No shifts found for this employee in the specified period.'], 422);
            }

            try {
                $sendEmail = \App\Models\Setting::get('roster_send_email', true, $company_id);
                $sendWhatsapp = \App\Models\Setting::get('roster_send_whatsapp', false, $company_id);
                $sendSms = \App\Models\Setting::get('roster_send_sms', false, $company_id);

                $sentChannels = [];

                if ($sendEmail && !empty($employee->email)) {
                    Mail::to($employee->email)->queue(new EmployeeRosterMail($employee, $company, $employeeRoster, $dateRange));
                    $sentChannels[] = 'Email';
                }

                if ($sendWhatsapp && !empty($employee->mobile)) {
                    $waService = new \App\Services\WhatsAppService();
                    $waService->sendRosterNotification($employee, $company, $employeeRoster, $dateRange);
                    $sentChannels[] = 'WhatsApp';
                }

                if ($sendSms && !empty($employee->mobile)) {
                    // SMS logic
                    $sentChannels[] = 'SMS';
                }

                if (empty($sentChannels)) {
                    return response()->json(['success' => false, 'message' => 'No valid contact info found for enabled channels.'], 422);
                }

                return response()->json([
                    'success' => true,
                    'message' => "Roster notification sent via " . implode(', ', $sentChannels) . " to {$employee->name}",
                    'data' => [
                        'employee' => $employee->name,
                        'channels' => $sentChannels,
                        'company' => $company->name,
                        'date_range' => $dateRange,
                        'shifts_count' => count($employeeRoster)
                    ]
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to send roster notification to single employee', [
                    'employee_id' => $employee->id,
                    'employee_name' => $employee->name,
                    'email' => $employee->email,
                    'mobile' => $employee->mobile,
                    'error' => $e->getMessage()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send email: ' . $e->getMessage()
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Error sending roster email to single employee: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error sending roster email: ' . $e->getMessage()
            ], 500);
        }
    }

    private function getDayOffset($day)
    {
        $days = [
            'Monday' => 0,
            'Tuesday' => 1,
            'Wednesday' => 2,
            'Thursday' => 3,
            'Friday' => 4,
            'Saturday' => 5,
            'Sunday' => 6,
        ];
        return $days[$day] ?? 0;
    }

    private function sendAutomaticNotification(ShiftRoster $shiftRoster)
    {
        $shiftRoster->load(['employee', 'company']);

        $sendWhatsapp = \App\Models\Setting::get('roster_send_whatsapp', false, $shiftRoster->company_id);
        if ($sendWhatsapp && !empty($shiftRoster->employee->mobile)) {
            try {
                $startDate = Carbon::parse($shiftRoster->week_start);
                $endDate = $startDate->copy()->addDays(6);
                $dateRange = $startDate->format('M d, Y') . ' - ' . $endDate->format('M d, Y');

                $employeeRoster = [
                    [
                        'day' => $shiftRoster->day,
                        'date' => Carbon::parse($shiftRoster->week_start)->addDays($this->getDayOffset($shiftRoster->day))->format('M d, Y'),
                        'shift_time' => $shiftRoster->shift_time,
                        'shift_type' => $shiftRoster->shift_type,
                        'designation' => $shiftRoster->designation,
                        'notes' => $shiftRoster->notes,
                    ]
                ];

                $waService = new \App\Services\WhatsAppService();
                $waService->sendRosterNotification($shiftRoster->employee, $shiftRoster->company, $employeeRoster, $dateRange);
            } catch (\Exception $e) {
                Log::error('Auto-WhatsApp notification failed: ' . $e->getMessage());
            }
        }
    }

    /**
     * Send WhatsApp notifications for all employees affected by a bulk store/upsert.
     * Handles week-view (single week_start) AND month/custom-range (multiple week_starts
     * carried per-entry, top-level week_start is null).
     * Groups saved rosters by employee and sends ONE message per employee covering ALL shifts.
     */
    private function sendBulkAutomaticNotifications(array $data)
    {
        try {
            $companyId = $data['company_id'];

            $sendWhatsapp = \App\Models\Setting::get('roster_send_whatsapp', false, $companyId);
            if (!$sendWhatsapp) {
                Log::info('sendBulkAutomaticNotifications: WhatsApp notifications disabled for company ' . $companyId);
                return;
            }

            // Collect unique employee IDs from submitted entries
            $employeeIds = collect($data['entries'])->pluck('employee_id')->unique()->filter()->values();

            if ($employeeIds->isEmpty()) {
                return;
            }

            // ---------------------------------------------------------------
            // Determine which week_start values to query.
            //
            // Week-view  : $data['week_start'] is set; entries may or may not
            //              carry their own week_start.
            // Month/Range: $data['week_start'] is null; each entry carries its
            //              own week_start (multiple weeks in one submission).
            // ---------------------------------------------------------------
            $topLevelWeekStart = $data['week_start'] ?? null;

            $weekStarts = collect($data['entries'])
                ->pluck('week_start')
                ->filter()
                ->unique()
                ->values();

            // Fall back to top-level if entries don't carry individual week_starts
            if ($weekStarts->isEmpty() && $topLevelWeekStart) {
                $weekStarts = collect([$topLevelWeekStart]);
            }

            if ($weekStarts->isEmpty()) {
                Log::warning('sendBulkAutomaticNotifications: No week_start found in entries or top-level — skipping notifications.');
                return;
            }

            // Load all saved rosters across every relevant week in one query
            $rosters = ShiftRoster::with(['employee', 'company'])
                ->where('company_id', $companyId)
                ->whereIn('week_start', $weekStarts)
                ->whereIn('employee_id', $employeeIds)
                ->orderBy('week_start')
                ->orderBy('employee_id')
                ->get();

            if ($rosters->isEmpty()) {
                Log::warning('sendBulkAutomaticNotifications: No rosters found for weeks: ' . $weekStarts->implode(', '));
                return;
            }

            $company = $rosters->first()->company;

            // Build a human-readable date range spanning ALL shifted dates
            $allDates = $rosters->map(fn($r) =>
                Carbon::parse($r->week_start)->addDays($this->getDayOffset($r->day))
            );
            $rangeStart = $allDates->min()->format('M d, Y');
            $rangeEnd   = $allDates->max()->format('M d, Y');
            $dateRange  = ($rangeStart === $rangeEnd) ? $rangeStart : "{$rangeStart} - {$rangeEnd}";

            Log::info('sendBulkAutomaticNotifications: Sending notifications', [
                'company_id'  => $companyId,
                'weeks'       => $weekStarts->all(),
                'date_range'  => $dateRange,
                'employees'   => $employeeIds->count(),
                'roster_rows' => $rosters->count(),
            ]);

            $waService = new \App\Services\WhatsAppService();

            // Group by employee → one WhatsApp per employee covering all their shifts
            $grouped = $rosters->groupBy('employee_id');
            foreach ($grouped as $empId => $empRosters) {
                $employee = $empRosters->first()->employee;

                if (!$employee || empty($employee->mobile)) {
                    Log::info("sendBulkAutomaticNotifications: Skipping employee ID {$empId} — no mobile number.");
                    continue;
                }

                // Sort shifts chronologically
                $employeeRoster = $empRosters
                    ->sortBy(fn($r) => Carbon::parse($r->week_start)->addDays($this->getDayOffset($r->day)))
                    ->map(fn($r) => [
                        'day'         => $r->day,
                        'date'        => Carbon::parse($r->week_start)->addDays($this->getDayOffset($r->day))->format('M d, Y'),
                        'shift_time'  => $r->shift_time,
                        'shift_type'  => $r->shift_type,
                        'designation' => $r->designation,
                        'notes'       => $r->notes,
                    ])->values()->toArray();

                try {
                    $waService->sendRosterNotification($employee, $company, $employeeRoster, $dateRange);
                    Log::info("sendBulkAutomaticNotifications: WhatsApp sent to {$employee->name} (ID: {$empId}), shifts: " . count($employeeRoster));
                } catch (\Exception $e) {
                    Log::error("sendBulkAutomaticNotifications: Failed for employee {$empId}: " . $e->getMessage());
                }
            }
        } catch (\Exception $e) {
            // Never break the save flow — just log
            Log::error('sendBulkAutomaticNotifications error: ' . $e->getMessage());
        }
    }

    // Debug method to check roster data
    public function debug(Request $request)
    {
        try {
            $week_start = $request->input('week_start', now()->startOfWeek()->toDateString());
            $company_id = $request->input('company_id');

            // Get all rosters for the week
            $query = ShiftRoster::with(['employee', 'company'])->where('week_start', $week_start);

            if ($company_id) {
                $query->where('company_id', $company_id);
            }

            $rosters = $query->get();

            // Get a sample roster if any exist
            $sampleRoster = $rosters->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_rosters' => $rosters->count(),
                    'week_start' => $week_start,
                    'company_id' => $company_id,
                    'sample_roster' => $sampleRoster ? $sampleRoster->toArray() : null,
                    'all_rosters' => $rosters->toArray()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Test method to verify database connection and table structure
    public function testDatabase(Request $request)
    {
        try {
            // Test 1: Check if table exists
            $tableExists = \Schema::hasTable('shift_rosters');

            // Test 2: Check table structure
            $columns = \Schema::getColumnListing('shift_rosters');

            // Test 3: Try to insert a test record
            $testData = [
                'employee_id' => 1,
                'company_id' => 1,
                'week_start' => '2025-07-13',
                'day' => 'Sunday',
                'shift_time' => 'TEST SHIFT',
                'shift_type' => 'Test',
                'designation' => 'Test',
                'notes' => 'Test entry'
            ];

            $testRecord = ShiftRoster::create($testData);
            $testId = $testRecord->id;

            // Test 4: Try to retrieve the test record
            $retrievedRecord = ShiftRoster::find($testId);

            // Test 5: Delete the test record
            $testRecord->delete();

            // Test 6: Check all existing roster data
            $allRosters = ShiftRoster::all();

            return response()->json([
                'success' => true,
                'data' => [
                    'table_exists' => $tableExists,
                    'columns' => $columns,
                    'test_insert_successful' => $testId > 0,
                    'test_retrieve_successful' => $retrievedRecord !== null,
                    'test_data' => $testData,
                    'retrieved_data' => $retrievedRecord ? $retrievedRecord->toArray() : null,
                    'total_rosters_in_db' => $allRosters->count(),
                    'all_rosters' => $allRosters->toArray()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    // Show a single employee's roster for a week and company
    public function showEmployeeRoster($companySlug, $employeeId, Request $request)
    {
        $week_start = $request->query('week_start');
        $company = Company::where('slug', $companySlug)->first();
        $employee = Employee::with(['weeklyOffs', 'company'])->find($employeeId);

        if (!$company || !$employee || $employee->company_id !== $company->id) {
            $allCompanies = Company::pluck('name')->values()->all();
            $allEmployees = Employee::pluck('name')->values()->all();
            return inertia('ShiftRoster/EmployeeNotFound', [
                'employee_id' => $employeeId,
                'employee_name' => $employee->name ?? 'Unknown',
                'company_slug' => $companySlug,
                'company_name' => $company->name ?? 'Unknown',
                'week_start' => $week_start,
                'employee_exists' => (bool) $employee,
                'company_exists' => (bool) $company,
                'all_companies' => $allCompanies,
                'all_employees' => $allEmployees,
            ]);
        }

        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        $weeklyOffService = app(WeeklyOffService::class);
        $rosters = [];
        $weeklyOffDays = [];

        foreach ($days as $day) {
            $roster = ShiftRoster::where('employee_id', $employee->id)
                ->where('company_id', $company->id)
                ->where('week_start', $week_start)
                ->where('day', $day)
                ->first();
            $rosters[$day] = $roster;

            // Calculate actual date for this day
            $dayOffsets = ['Monday' => 0, 'Tuesday' => 1, 'Wednesday' => 2, 'Thursday' => 3,
                           'Friday' => 4, 'Saturday' => 5, 'Sunday' => 6];
            $actualDate = Carbon::parse($week_start)->addDays($dayOffsets[$day] ?? 0);
            $weeklyOffDays[$day] = $weeklyOffService->isWeeklyOff($employee, $actualDate);
        }

        // Build resolved weekly off day names list
        $resolvedWeeklyOffDays = $weeklyOffService->getWeeklyOffDaysForEmployee($employee, Carbon::parse($week_start));

        return inertia('ShiftRoster/Show', [
            'employee' => $employee,
            'company' => $company,
            'week_start' => $week_start,
            'rosters' => $rosters,
            'days' => $days,
            'weeklyOffDays' => $weeklyOffDays,
            'resolvedWeeklyOffDays' => $resolvedWeeklyOffDays,
        ]);
    }

    // Private Helper Methods

    private function getRosterData(Request $request, $company_id)
    {
        $query = ShiftRoster::query();

        $week = $request->input('week_start', now()->startOfWeek()->toDateString());

        // Build the query based on view mode
        if ($request->has('month') && $request->has('year')) {
            $month = $request->input('month');
            $year = $request->input('year');
            $start_date = Carbon::create($year, $month + 1, 1)->startOfMonth()->toDateString();
            $end_date = Carbon::create($year, $month + 1, 1)->endOfMonth()->toDateString();

            $query->whereBetween('week_start', [$start_date, $end_date]);
        } elseif ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('week_start', [$request->input('start_date'), $request->input('end_date')]);
        } else {
            $query->where('week_start', $week);
        }

        if ($company_id) {
            $query->where('company_id', $company_id);
        }

        // Filter by department if provided
        $department_id = $request->input('department_id');
        if ($department_id) {
            $employeeIds = Employee::where('department_id', $department_id)->pluck('id');
            $query->whereIn('employee_id', $employeeIds);
        }

        // Fetch roster rows with necessary columns
        $rosters = $query->select([
            'id',
            'employee_id',
            'company_id',
            'week_start',
            'day',
            'shift_time',
            'shift_type',
            'designation',
            'notes'
        ])->get();

        // Build weekly off map for all unique employees in this roster result (bulk, efficient)
        // referenceDate: use the actual start of the period being viewed (not always current week)
        $weeklyOffService = app(WeeklyOffService::class);
        $employeeIds = $rosters->pluck('employee_id')->unique()->values();
        $employees = Employee::with(['weeklyOffs', 'company'])
            ->whereIn('id', $employeeIds)
            ->get()
            ->keyBy('id');

        // Pick correct reference date based on view mode
        if ($request->has('month') && $request->has('year')) {
            $refMonth = $request->input('month');
            $refYear  = $request->input('year');
            $referenceDate = Carbon::create($refYear, $refMonth + 1, 1)->startOfMonth();
        } elseif ($request->has('start_date')) {
            $referenceDate = Carbon::parse($request->input('start_date'));
        } else {
            $referenceDate = Carbon::parse($week);
        }

        $weeklyOffMap = $weeklyOffService->buildWeeklyOffMap($employees, $referenceDate);

        // Optimized mapping with cached Carbon instances
        $daysOfWeek = [
            'Monday' => 0,
            'Tuesday' => 1,
            'Wednesday' => 2,
            'Thursday' => 3,
            'Friday' => 4,
            'Saturday' => 5,
            'Sunday' => 6
        ];
        $carbonCache = [];

        return $rosters->map(function ($roster) use ($daysOfWeek, &$carbonCache, $weeklyOffService, $weeklyOffMap) {
            $ws = (string) $roster->week_start;
            if (!isset($carbonCache[$ws])) {
                $carbonCache[$ws] = Carbon::parse($ws);
            }

            $dayOffset = $daysOfWeek[$roster->day] ?? 0;
            $actualDate = $carbonCache[$ws]->copy()->addDays($dayOffset);
            $roster->date = $actualDate->toDateString();

            // Annotate with weekly off status for frontend highlighting
            $roster->is_weekly_off = $weeklyOffService->isWeeklyOffFromMap($roster->employee_id, $actualDate, $weeklyOffMap);

            return $roster;
        });
    }

    private function validateRosterData(Request $request)
    {
        return $request->validate([
            'week_start' => 'nullable|date',
            'company_id' => 'required|exists:companies,id',
            'entries' => 'required|array|min:1',
            'entries.*.employee_id' => 'required|exists:employees,id',
            'entries.*.day' => 'required|in:Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
            'entries.*.shift_time' => 'required|string|max:255',
            'entries.*.shift_type' => 'nullable|string|max:255',
            'entries.*.designation' => 'nullable|string|max:255',
            'entries.*.notes' => 'nullable|string|max:1000',
            'entries.*.week_start' => 'nullable|date',
        ]);
    }

    private function processRosterEntries($data)
    {
        $createdCount = 0;
        $updatedCount = 0;
        $errors = [];

        DB::beginTransaction();

        try {
            // Filter out entries with empty shift_time early
            $entries = collect($data['entries'])->filter(fn($e) => !empty(trim($e['shift_time'])));

            if ($entries->isEmpty()) {
                DB::rollBack();
                return ['created' => 0, 'updated' => 0, 'errors' => []];
            }

            // Pre-fetch employees to verify company membership (with weekly off and company data)
            $employeeIds = $entries->pluck('employee_id')->unique();
            $validEmployeesCollection = Employee::with(['weeklyOffs', 'company'])
                ->whereIn('id', $employeeIds)
                ->where('company_id', $data['company_id'])
                ->get()
                ->keyBy('id');

            $validEmployeeIds = $validEmployeesCollection->keys()->toArray();

            $upsertData = [];
            $now = now();
            $weeklyOffService = app(WeeklyOffService::class);

            // Build weekly off map — derive reference date from top-level week_start or first entry
            // (top-level week_start is null in month/range view; each entry carries its own)
            $topLevelWs = $data['week_start'] ?? null;
            if (empty($topLevelWs)) {
                // Use the first entry's week_start as the reference
                $topLevelWs = $entries->first()['week_start'] ?? null;
            }
            $referenceDate = Carbon::parse($topLevelWs ?? now());
            $weeklyOffMap = $weeklyOffService->buildWeeklyOffMap($validEmployeesCollection, $referenceDate);

            // Day-offset map for computing actual dates
            $dayOffsets = ['Monday' => 0, 'Tuesday' => 1, 'Wednesday' => 2, 'Thursday' => 3,
                           'Friday' => 4, 'Saturday' => 5, 'Sunday' => 6];

            foreach ($entries as $index => $entry) {
                // Verification: Employee MUST belong to the company
                if (!in_array($entry['employee_id'], $validEmployeeIds)) {
                    $errors[] = "Entry {$index}: Employee ID {$entry['employee_id']} does not belong to the selected company.";
                    continue;
                }

                $time = trim($entry['shift_time']);
                if (empty($time)) {
                    continue;
                }

                $ws = $entry['week_start'] ?? $data['week_start'];
                if (empty($ws)) {
                    $errors[] = "Entry {$index}: Week start date is missing.";
                    continue;
                }

                // Compute the actual date for this entry
                $weekStartDate = Carbon::parse($ws);
                $dayOffset = $dayOffsets[$entry['day']] ?? 0;
                $actualDate = $weekStartDate->copy()->addDays($dayOffset);

                // Check if this day is a weekly off for the employee
                $isWeeklyOff = $weeklyOffService->isWeeklyOffFromMap($entry['employee_id'], $actualDate, $weeklyOffMap);

                // Override shift details if it is a weekly off day
                if ($isWeeklyOff) {
                    $time = 'Weekly Off';
                    $shiftType = 'Weekly Off';
                    $notes = 'Auto: Weekly Off Day';
                } else {
                    $shiftType = !empty($entry['shift_type']) ? trim($entry['shift_type']) : null;
                    $notes = !empty($entry['notes']) ? trim($entry['notes']) : null;
                }

                $upsertData[] = [
                    'employee_id' => $entry['employee_id'],
                    'company_id' => $data['company_id'],
                    'week_start' => $ws,
                    'day' => $entry['day'],
                    'shift_time' => $time,
                    'shift_type' => $shiftType,
                    'designation' => !empty($entry['designation']) ? trim($entry['designation']) : null,
                    'notes' => $notes,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (!empty($upsertData)) {
                // Use upsert for bulk processing
                // Unique index is ['employee_id', 'week_start', 'day']
                $affected = ShiftRoster::upsert(
                    $upsertData,
                    ['employee_id', 'week_start', 'day'],
                    ['shift_time', 'shift_type', 'designation', 'notes', 'company_id', 'updated_at']
                );

                // For upsert, specific created/updated counts are hard to determine precisely
                // We'll report the total processed count
                $updatedCount = count($upsertData);
            }

            DB::commit();

            // Return updatedCount as total processed to satisfy frontend expectation safely
            return ['created' => 0, 'updated' => $updatedCount, 'errors' => $errors];

        } catch (\Exception $e) {
            Log::error('Error in processRosterEntries: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            DB::rollBack();
            throw $e;
        }
    }

    private function generateSuccessMessage($result)
    {
        $message = "Roster saved successfully! ";
        if ($result['created'] > 0) {
            $message .= "Created: {$result['created']} entries. ";
        }
        if ($result['updated'] > 0) {
            $message .= "Updated: {$result['updated']} entries. ";
        }
        if (!empty($result['errors'])) {
            $message .= "Errors: " . implode(', ', $result['errors']);
        }
        return $message;
    }
}