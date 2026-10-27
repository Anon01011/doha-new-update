<?php

namespace App\Http\Controllers;

use App\Helpers\TimeHelper;
use App\Models\Company;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\LeaveRequest;
use App\Models\Setting;
use App\Services\WeeklyOffService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LiveAttendanceController extends Controller
{
    /**
     * Display the Real-Time Employee Live Feed page.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        if (!$this->canViewLiveFeed($user)) {
            abort(403, 'Unauthorized access to live employee feed.');
        }

        $feedData = $this->getLiveFeedData($request, $user);

        return Inertia::render('EmployeeAttendance/LiveFeed', [
            'initialData' => $feedData,
            'filters' => [
                'company_id' => $request->input('company_id', $feedData['selected_company_id']),
                'department_id' => $request->input('department_id', ''),
                'status' => $request->input('status', 'all'),
                'search' => $request->input('search', ''),
            ],
            'companies' => $feedData['companies'],
            'departments' => $feedData['departments'],
        ]);
    }

    /**
     * Lightweight JSON polling endpoint for live background updates.
     */
    public function data(Request $request)
    {
        $user = auth()->user();
        if (!$this->canViewLiveFeed($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $feedData = $this->getLiveFeedData($request, $user);

        return response()->json($feedData);
    }

    /**
     * Determine if current user has permission or role to view the live feed.
     */
    protected function canViewLiveFeed($user): bool
    {
        if (!$user) return false;
        if ($user->isAdmin() || $user->isHR() || $user->isManager()) return true;
        if ($user->hasPermission('view-live-attendance') || $user->hasPermission('view-attendance')) return true;

        return false;
    }

    /**
     * Core data aggregation engine for live employee status, metrics, and event timeline.
     */
    protected function getLiveFeedData(Request $request, $user): array
    {
        // 1. Resolve Company Scope
        $availableCompanies = [];
        $selectedCompanyId = $request->input('company_id');

        if ($user->isAdmin()) {
            $availableCompanies = Company::orderBy('name')->get(['id', 'name']);
        } else {
            $userCompanyId = $user->company_id ?: $user->employee?->company_id;
            if ($userCompanyId) {
                $availableCompanies = Company::where('id', $userCompanyId)->get(['id', 'name']);
                $selectedCompanyId = $userCompanyId; // Non-admins locked to their company
            } else {
                $availableCompanies = Company::orderBy('name')->get(['id', 'name']);
            }
        }

        $companyIdForTimezone = $selectedCompanyId ? (int)$selectedCompanyId : ($user->company_id ?: $user->employee?->company_id);
        $today = TimeHelper::now($companyIdForTimezone)->toDateString();
        $currentTimeString = TimeHelper::now($companyIdForTimezone)->format('h:i:s A');
        $currentDateString = TimeHelper::now($companyIdForTimezone)->format('l, d M Y');

        // 2. Resolve Departments
        $deptQuery = Department::orderBy('name');
        if ($selectedCompanyId) {
            $deptQuery->where(function ($q) use ($selectedCompanyId) {
                $q->where('company_id', $selectedCompanyId)->orWhereNull('company_id');
            });
        }
        $departments = $deptQuery->get(['id', 'name', 'company_id']);

        // 3. Query Monitored Employees
        $empQuery = Employee::with(['department:id,name', 'company:id,name', 'weeklyOffs'])
            ->where(function ($q) {
                $q->whereNull('exit_status')
                  ->orWhereNotIn('exit_status', ['Abscond', 'Terminated', 'Resigned', 'End of Contract', 'exited']);
            })
            ->whereNull('exit_date');

        // Scoping by user role
        if ($selectedCompanyId) {
            $empQuery->where('company_id', $selectedCompanyId);
        } elseif (!$user->isAdmin()) {
            $userCompanyId = $user->company_id ?: $user->employee?->company_id;
            if ($userCompanyId) {
                $empQuery->where('company_id', $userCompanyId);
            }
            if ($user->isManager() && $user->employee?->department_id) {
                $empQuery->where('department_id', $user->employee->department_id);
            }
        }

        // Additional Request Filters
        if ($request->filled('department_id')) {
            $empQuery->where('department_id', $request->department_id);
        }

        if ($request->filled('search')) {
            $term = trim($request->search);
            $empQuery->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('employee_code', 'like', "%{$term}%")
                  ->orWhere('designation', 'like', "%{$term}%");
            });
        }

        $employees = $empQuery->orderBy('name')->get();
        $employeeIds = $employees->pluck('id')->toArray();

        // 4. Fetch Today's Attendances & Leaves for these employees
        $attendances = EmployeeAttendance::whereIn('employee_id', $employeeIds)
            ->where('date', $today)
            ->get()
            ->keyBy('employee_id');

        $leaves = LeaveRequest::whereIn('employee_id', $employeeIds)
            ->where('status', 'approved')
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->with('leaveType:id,name')
            ->get()
            ->keyBy('employee_id');

        $weeklyOffService = app(WeeklyOffService::class);

        // 5. Build Employee Statuses and Real-time Activity Events
        $processedEmployees = [];
        $activityEvents = [];
        $kpi = [
            'total' => $employees->count(),
            'working' => 0,
            'on_break' => 0,
            'clocked_out' => 0,
            'not_checked_in' => 0,
            'on_leave' => 0,
            'weekly_off' => 0,
        ];

        foreach ($employees as $emp) {
            $att = $attendances->get($emp->id);
            $leave = $leaves->get($emp->id);

            $status = 'not_checked_in';
            $statusLabel = 'Not Checked In';
            $statusColor = 'slate';
            $clockInTime = null;
            $clockOutTime = null;
            $breakStartTime = null;
            $breakStartIso = null;
            $breakElapsedMinutes = 0;
            $totalBreakMinutes = 0;
            $hoursWorked = 0;
            $punches = [];
            $breakHistory = [];

            if ($att) {
                $punches = $att->punches ?: [];
                $breakHistory = $att->break_history ?: [];
                $totalBreakMinutes = (int)($att->total_break_minutes ?: 0);

                if ($att->current_break_start) {
                    $status = 'on_break';
                    $statusLabel = 'On Break';
                    $statusColor = 'amber';
                    $kpi['on_break']++;

                    $breakStartTime = TimeHelper::inTz($att->current_break_start, $emp->company_id)->format('h:i A');
                    $breakStartIso = Carbon::parse($att->current_break_start)->toIso8601String();
                    $breakElapsedMinutes = (int) round(abs(now()->diffInMinutes($att->current_break_start, true)));
                    $clockInTime = $att->from_time;
                    $hoursWorked = (float)$att->calculateFlexibleHours();

                    // Activity event: currently on break
                    $activityEvents[] = [
                        'id' => "break_curr_{$emp->id}",
                        'employee_id' => $emp->id,
                        'employee_name' => $emp->name,
                        'employee_code' => $emp->employee_code,
                        'employee_image' => $emp->employee_image,
                        'department' => $emp->department?->name ?? 'General',
                        'company' => $emp->company?->name ?? 'Branch',
                        'type' => 'break_start',
                        'title' => 'Started Break',
                        'time' => $breakStartTime,
                        'timestamp' => Carbon::parse($att->current_break_start)->timestamp,
                        'detail' => "Active break ({$breakElapsedMinutes} mins)",
                        'color' => 'amber',
                    ];
                } elseif ($att->to_time) {
                    $status = 'clocked_out';
                    $statusLabel = 'Clocked Out';
                    $statusColor = 'blue';
                    $kpi['clocked_out']++;

                    $clockInTime = $att->from_time;
                    $clockOutTime = $att->to_time;
                    $hoursWorked = (float)($att->hours_worked ?: $att->calculateFlexibleHours());

                    // Activity event: clock out
                    $activityEvents[] = [
                        'id' => "out_{$emp->id}",
                        'employee_id' => $emp->id,
                        'employee_name' => $emp->name,
                        'employee_code' => $emp->employee_code,
                        'employee_image' => $emp->employee_image,
                        'department' => $emp->department?->name ?? 'General',
                        'company' => $emp->company?->name ?? 'Branch',
                        'type' => 'clock_out',
                        'title' => 'Clocked Out',
                        'time' => $clockOutTime,
                        'timestamp' => Carbon::parse($today . ' ' . $clockOutTime)->timestamp,
                        'detail' => "Completed {$hoursWorked} hrs" . ($totalBreakMinutes > 0 ? " ({$totalBreakMinutes}m break)" : ''),
                        'color' => 'blue',
                    ];
                } elseif ($att->from_time) {
                    $status = 'working';
                    $statusLabel = 'Working Now';
                    $statusColor = 'emerald';
                    $kpi['working']++;

                    $clockInTime = $att->from_time;
                    $hoursWorked = (float)$att->calculateFlexibleHours();

                    // Activity event: clock in
                    $activityEvents[] = [
                        'id' => "in_{$emp->id}",
                        'employee_id' => $emp->id,
                        'employee_name' => $emp->name,
                        'employee_code' => $emp->employee_code,
                        'employee_image' => $emp->employee_image,
                        'department' => $emp->department?->name ?? 'General',
                        'company' => $emp->company?->name ?? 'Branch',
                        'type' => 'clock_in',
                        'title' => 'Clocked In',
                        'time' => $clockInTime,
                        'timestamp' => Carbon::parse($today . ' ' . $clockInTime)->timestamp,
                        'detail' => ($att->attendance ?: 'Present') . " • Working for {$hoursWorked} hrs",
                        'color' => 'emerald',
                    ];
                }

                // Add past break events from history
                foreach ($breakHistory as $idx => $b) {
                    if (!empty($b['end'])) {
                        $endTimeFormatted = TimeHelper::inTz($b['end'], $emp->company_id)->format('h:i A');
                        $activityEvents[] = [
                            'id' => "break_end_{$emp->id}_{$idx}",
                            'employee_id' => $emp->id,
                            'employee_name' => $emp->name,
                            'employee_code' => $emp->employee_code,
                            'employee_image' => $emp->employee_image,
                            'department' => $emp->department?->name ?? 'General',
                            'company' => $emp->company?->name ?? 'Branch',
                            'type' => 'break_end',
                            'title' => 'Resumed Work',
                            'time' => $endTimeFormatted,
                            'timestamp' => Carbon::parse($b['end'])->timestamp,
                            'detail' => "Break ended (" . round($b['duration'] ?? 0) . " mins)",
                            'color' => 'teal',
                        ];
                    }
                }
            } elseif ($leave) {
                $status = 'on_leave';
                $statusLabel = 'On Leave (' . ($leave->leaveType?->name ?? 'Approved') . ')';
                $statusColor = 'purple';
                $kpi['on_leave']++;
            } elseif ($weeklyOffService->isWeeklyOff($emp, Carbon::parse($today))) {
                $status = 'weekly_off';
                $statusLabel = 'Weekly Off';
                $statusColor = 'indigo';
                $kpi['weekly_off']++;
            } else {
                $status = 'not_checked_in';
                $statusLabel = 'Not Checked In';
                $statusColor = 'slate';
                $kpi['not_checked_in']++;
            }

            // Status filter check
            $statusFilter = $request->input('status', 'all');
            if ($statusFilter !== 'all' && $statusFilter !== $status) {
                continue;
            }

            $processedEmployees[] = [
                'id' => $emp->id,
                'name' => $emp->name,
                'employee_code' => $emp->employee_code,
                'image' => $emp->employee_image,
                'designation' => $emp->designation ?? 'Team Member',
                'department' => $emp->department?->name ?? 'General',
                'company' => $emp->company?->name ?? 'Branch',
                'status' => $status,
                'status_label' => $statusLabel,
                'status_color' => $statusColor,
                'clock_in_time' => $clockInTime,
                'clock_out_time' => $clockOutTime,
                'break_start_time' => $breakStartTime,
                'break_start_iso' => $breakStartIso,
                'break_elapsed_minutes' => $breakElapsedMinutes,
                'total_break_minutes' => $totalBreakMinutes,
                'hours_worked' => $hoursWorked,
                'attendance_status' => $att?->attendance ?? null,
                'punches_count' => count($punches),
                'punches' => array_slice(array_reverse($punches), 0, 4), // Latest 4 punches
            ];
        }

        // Sort activity events descending by timestamp
        usort($activityEvents, fn($a, $b) => $b['timestamp'] <=> $a['timestamp']);
        $activityEvents = array_slice($activityEvents, 0, 40);

        return [
            'summary' => $kpi,
            'employees' => $processedEmployees,
            'timeline' => $activityEvents,
            'companies' => $availableCompanies,
            'departments' => $departments,
            'selected_company_id' => $selectedCompanyId,
            'date' => $today,
            'current_time' => $currentTimeString,
            'current_date' => $currentDateString,
            'timezone' => Setting::get('app_timezone', config('app.timezone', 'UTC'), $companyIdForTimezone),
        ];
    }
}
