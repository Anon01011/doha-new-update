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
use App\Models\Setting;
use App\Jobs\SendWhatsAppRosterNotification;
use App\Jobs\SendRosterSmsNotification;

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

            if (!$user->isAdmin() && !$user->hasPermission('view-shift-rosters') && !$user->hasPermission('view-rosters')) {
                // Handled below
            }

            // Multi-tenancy scoping
            $company_id = $request->input('company_id');
            // Only force company_id for plain employees (not HR, not Manager, not Shift Roster Managers)
            // so that users with multi-branch assignments can switch between their assigned branches.
            $canManageRosters = $user->isAdmin() || $user->isHR() || $user->isManager()
                || $user->hasRole('shift-manager')
                || $user->hasPermission('manage-shift-rosters')
                || $user->hasPermission('manage-rosters')
                || $user->hasPermission('view-shift-rosters');
            if (!$canManageRosters && $user->employee_id) {
                $company_id = $user->employee->company_id;
            }

            $assignedCompanyIds = collect();
            $companiesQuery = Company::withoutGlobalScope('company')->orderBy('name');
            if (!$user->isAdmin() && !$user->isHR() && $user->employee_id && $user->employee) {
                // Support multi-branch assignments: include both the primary company_id
                // and any additional companies linked via the employee_company pivot table.
                $employee = $user->employee;
                $assignedCompanyIds = collect([$employee->company_id]);

                // Check if the employee has additional companies via pivot
                $pivotIds = \Illuminate\Support\Facades\DB::table('employee_company')
                    ->where('employee_id', $employee->id)
                    ->pluck('company_id');
                $assignedCompanyIds = $assignedCompanyIds->merge($pivotIds)->unique()->filter()->values();

                $companiesQuery->whereIn('id', $assignedCompanyIds);
            }
            $companies = $companiesQuery->get(['id', 'name', 'slug']);

            // Determine effective company scope
            // For users who can manage rosters with multiple assigned branches:
            // - no company_id in request + multiple assigned branches = multi-company mode
            // - explicit company_id in request = single company mode (selected by user)
            // For plain employees: always forced to their primary company
            $requestedCompanyId = $request->input('company_id');
            $multiCompanyMode = false;

            if ($canManageRosters && !$requestedCompanyId && $assignedCompanyIds->count() > 1) {
                // User can manage rosters, multiple assigned branches, no branch selected
                $multiCompanyMode = true;
                $effectiveCompanyIds = $assignedCompanyIds->values();
                $effectiveCompanyId = null;
            } elseif ($company_id) {
                $effectiveCompanyIds = collect([$company_id]);
                $effectiveCompanyId = $company_id;
            } elseif ($companies->isNotEmpty()) {
                $effectiveCompanyId = $companies->first()->id;
                $effectiveCompanyIds = collect([$effectiveCompanyId]);
                $company_id = $effectiveCompanyId;
            } else {
                $effectiveCompanyIds = collect();
                $effectiveCompanyId = null;
            }



            // Fetch departments for the selected company (or all assigned companies in multi mode)
            $departmentsQuery = \App\Models\Department::withoutGlobalScope('company')->orderBy('name');
            if ($multiCompanyMode) {
                $departmentsQuery->whereHas('companies', function ($q) use ($effectiveCompanyIds) {
                    $q->whereIn('companies.id', $effectiveCompanyIds);
                });
            } elseif ($effectiveCompanyId) {
                $departmentsQuery->whereHas('companies', function ($q) use ($effectiveCompanyId) {
                    $q->where('companies.id', $effectiveCompanyId);
                });
            }
            $departments = $departmentsQuery->get(['departments.id', 'name', 'departments.company_id']);

            // Multi-department support: include departments from employee_department pivot
            $assignedDepartmentIds = collect();
            if (!$user->isAdmin() && !$user->isHR() && $user->employee_id && $user->employee) {
                $employee = $user->employee;
                $assignedDepartmentIds = collect([$employee->department_id]);

                $pivotDeptIds = \Illuminate\Support\Facades\DB::table('employee_department')
                    ->where('employee_id', $employee->id)
                    ->pluck('department_id');
                $assignedDepartmentIds = $assignedDepartmentIds->merge($pivotDeptIds)->unique()->filter()->values();
            }


            // Filter employees by company_id and department_id if provided
            $employeesQuery = Employee::withoutGlobalScope('company')->orderBy('name');
            if ($multiCompanyMode) {
                $employeesQuery->whereIn('company_id', $effectiveCompanyIds);
            } elseif ($effectiveCompanyId) {
                $employeesQuery->where('company_id', $effectiveCompanyId);
            }
            if ($department_id) {
                $employeesQuery->where('department_id', $department_id);
            }

            // If employee, only show themselves
            if ($user->isEmployee() && $user->employee_id) {
                $employeesQuery->where('id', $user->employee_id);
            }

            $employees = $employeesQuery->with([
                'weeklyOffs:id,employee_id,weekly_off_day,effective_date',
                'company:id,name,weekly_off_days'
            ])->select([
                'id', 'name', 'employee_code', 'designation', 'department_id', 'company_id', 'employee_image'
            ])->get();

            $rosters = $this->getRosterData($request, $effectiveCompanyIds, $employees);

            // If employee without permission, filter rosters to only their own
            if ($user->isEmployee() && $user->employee_id && !$user->hasPermission('view-shift-rosters') && !$user->hasPermission('view-rosters') && isset($rosters)) {
                $rosters = $rosters->where('employee_id', $user->employee_id);
            }

            // Fetch dynamic shift types
            $shiftTypes = \App\Models\DropdownOption::where('category', 'Shift')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->pluck('value');

            $canApprove = $user->isAdmin() || $user->isHR() || $user->isManager()
                || $user->hasRole('shift-manager')
                || $user->hasPermission('approve-shift-rosters');

            // Compute week-level approval status efficiently using single aggregate query
            $weekApprovalStatus = null;
            $currentWeekStart = Carbon::parse($request->input('week_start', now()->startOfWeek(Carbon::MONDAY)->toDateString()))->startOfWeek(Carbon::MONDAY)->toDateString();
            if ($company_id && !$user->isEmployee()) {
                $weekStatsQuery = \App\Models\ShiftRoster::withoutGlobalScope('company')
                    ->where('company_id', $company_id)
                    ->where('week_start', $currentWeekStart);

                if ($department_id) {
                    $deptEmployeeIds = \App\Models\Employee::withoutGlobalScope('company')->where('department_id', $department_id)->pluck('id');
                    $weekStatsQuery->whereIn('employee_id', $deptEmployeeIds);
                }

                $weekStats = $weekStatsQuery->selectRaw("
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                    MAX(approved_by) as approved_by,
                    MAX(approved_at) as approved_at,
                    MAX(rejection_reason) as rejection_reason
                ")->first();

                $total    = (int) ($weekStats?->total ?? 0);
                $approved = (int) ($weekStats?->approved ?? 0);
                $pending  = (int) ($weekStats?->pending ?? 0);
                $rejected = (int) ($weekStats?->rejected ?? 0);

                $approvedByName = null;
                if ($weekStats?->approved_by) {
                    $approvedByName = \App\Models\User::where('id', $weekStats->approved_by)->value('name');
                }

                $weekApprovalStatus = [
                    'total'            => $total,
                    'approved'         => $approved,
                    'pending'          => $pending,
                    'rejected'         => $rejected,
                    'all_approved'     => $total > 0 && $approved === $total,
                    'has_pending'      => $pending > 0,
                    'has_rejected'     => $rejected > 0,
                    'status'           => ($total === 0) ? 'empty' : ($rejected > 0 ? 'rejected' : ($pending > 0 ? 'pending' : 'approved')),
                    'approved_by_name' => $approvedByName,
                    'approved_at'      => $weekStats?->approved_at ? Carbon::parse($weekStats->approved_at)->format('M d, Y h:i A') : null,
                    'rejection_reason' => $weekStats?->rejection_reason,
                ];
            }

            return Inertia::render('ShiftRoster/Index', [
                'companies'          => $companies,
                'departments'        => $departments,
                'employees'          => $employees,
                'rosters'            => $rosters instanceof \Illuminate\Support\Collection ? $rosters->values() : $rosters,
                'week_start'         => $currentWeekStart,
                'company_id'         => $effectiveCompanyId,
                'department_id'      => $department_id,
                'shiftTemplates'     => $this->shiftTemplates,
                'shiftTypes'         => $shiftTypes,
                'userRole'           => $user->role,
                'canApprove'         => $canApprove,
                'canManageRosters'      => $canManageRosters,
                'multiCompanyMode'      => $multiCompanyMode,
                'assignedCompanyIds'    => $assignedCompanyIds->values()->all(),
                'weekApprovalStatus' => $weekApprovalStatus,
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
            if (!$user->isAdmin() && !$user->hasPermission('create-shift-rosters') && !$user->hasPermission('manage-shift-rosters') && !$user->hasPermission('manage-rosters')) {
                abort(403, 'Unauthorized.');
            }
            $companiesQuery = Company::withoutGlobalScope('company')->orderBy('name');
            if (!$user->isAdmin() && !$user->isHR() && $user->employee_id && $user->employee) {
                // Support multi-branch assignments: include both the primary company_id
                // and any additional companies linked via the employee_company pivot table.
                $employee = $user->employee;
                $assignedCompanyIds = collect([$employee->company_id]);

                // Check if the employee has additional companies via pivot
                $pivotIds = \Illuminate\Support\Facades\DB::table('employee_company')
                    ->where('employee_id', $employee->id)
                    ->pluck('company_id');
                $assignedCompanyIds = $assignedCompanyIds->merge($pivotIds)->unique()->filter()->values();

                $companiesQuery->whereIn('id', $assignedCompanyIds);
            }
            $companies = $companiesQuery->get(['id', 'name', 'slug']);
            $companyParam = $request->input('company');
            $departmentParam = $request->input('department');

            // Multi-tenancy check
            if (!$user->isAdmin() && !$user->isHR() && $user->employee_id) {
                $companyParam = $user->employee->company_id;
            }

            $employeesQuery = Employee::active()
                ->with([
                    'company:id,slug,weekly_off_days',
                    'weeklyOffs:id,employee_id,weekly_off_day,effective_date'
                ])
                ->orderBy('name');
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

            // Fetch departments for the selected company (supports both direct and pivot)
            $departmentsQuery = \App\Models\Department::withoutGlobalScope('company')->orderBy('name');
            if ($company_id) {
                $departmentsQuery->where(function ($q) use ($company_id) {
                    $q->where('company_id', $company_id)
                      ->orWhereHas('companies', function ($sub) use ($company_id) {
                          $sub->where('companies.id', $company_id);
                      });
                });
            }
            $departments = $departmentsQuery->get(['departments.id', 'name', 'departments.company_id']);

            // Filter by department if provided
            if ($departmentParam && is_numeric($departmentParam)) {
                $employeesQuery->where('department_id', $departmentParam);
                $selectedDepartment = $departmentParam;
            }

            $employees = $employeesQuery->get(['id', 'name', 'designation', 'company_id', 'department_id', 'employee_image']);

            // Preload approved leaves for this week so the grid displays and protects leaves
            $weekStartParam = $request->input('week_start', now()->startOfWeek(Carbon::MONDAY)->toDateString());
            $currentWeekStart = Carbon::parse($weekStartParam)->startOfWeek(Carbon::MONDAY);
            $currentWeekEnd = $currentWeekStart->copy()->endOfWeek(Carbon::SUNDAY);
            $employeeIds = $employees->pluck('id');

            $approvedLeaves = collect();
            if ($employeeIds->isNotEmpty()) {
                $approvedLeaves = \App\Models\LeaveRequest::with('leaveType:id,name')
                    ->whereIn('employee_id', $employeeIds)
                    ->where('status', 'approved')
                    ->where(function ($q) use ($currentWeekStart, $currentWeekEnd) {
                        $q->whereBetween('start_date', [$currentWeekStart->toDateString(), $currentWeekEnd->toDateString()])
                          ->orWhereBetween('end_date', [$currentWeekStart->toDateString(), $currentWeekEnd->toDateString()])
                          ->orWhere(function ($sub) use ($currentWeekStart, $currentWeekEnd) {
                              $sub->where('start_date', '<=', $currentWeekStart->toDateString())
                                  ->where('end_date', '>=', $currentWeekEnd->toDateString());
                          });
                    })
                    ->select(['id', 'employee_id', 'leave_type_id', 'start_date', 'end_date'])
                    ->get()
                    ->map(fn($l) => [
                        'id'          => $l->id,
                        'employee_id' => $l->employee_id,
                        'leave_type'  => $l->leaveType?->name ?? 'Leave',
                        'start_date'  => is_string($l->start_date) ? substr($l->start_date, 0, 10) : $l->start_date->toDateString(),
                        'end_date'    => is_string($l->end_date) ? substr($l->end_date, 0, 10) : $l->end_date->toDateString(),
                    ]);
            }

            // Fetch dynamic shift types
            $shiftTypes = \App\Models\DropdownOption::where('category', 'Shift')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->pluck('value');

            return Inertia::render('ShiftRoster/Create', [
                'companies'          => $companies,
                'departments'        => $departments,
                'employees'          => $employees,
                'shiftTemplates'     => $this->shiftTemplates,
                'selectedCompany'    => $selectedCompany,
                'selectedDepartment' => $selectedDepartment,
                'shiftTypes'         => $shiftTypes,
                'approvedLeaves'     => $approvedLeaves,
            ]);
        } catch (\Exception $e) {
            Log::error('ShiftRoster create error: ' . $e->getMessage());
            return back()->with('error', 'Error loading create form: ' . $e->getMessage());
        }
    }

    /**
     * Check if roster entries conflict with existing shifts (approved or pending).
     */
    public function checkConflicts(Request $request)
    {
        try {
            $user = auth()->user();
            if (!$user->isAdmin() && !$user->hasPermission('create-shift-rosters') && !$user->hasPermission('manage-shift-rosters') && !$user->hasPermission('manage-rosters')) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $companyId = $request->input('company_id');
            $entries = $request->input('entries', []);

            if (empty($entries) || !is_array($entries)) {
                return response()->json([
                    'has_conflicts' => false,
                    'total_conflicts' => 0,
                    'approved_count' => 0,
                    'pending_count' => 0,
                    'rejected_count' => 0,
                    'conflicts' => [],
                ]);
            }

            // Filter entries with non-empty shift_time
            $entriesCollection = collect($entries)->filter(fn($e) => !empty(trim($e['shift_time'] ?? '')));
            $employeeIds = $entriesCollection->pluck('employee_id')->unique()->values();

            if ($employeeIds->isEmpty()) {
                return response()->json([
                    'has_conflicts' => false,
                    'total_conflicts' => 0,
                    'approved_count' => 0,
                    'pending_count' => 0,
                    'rejected_count' => 0,
                    'conflicts' => [],
                ]);
            }

            // Build lookup keys for requested entries: employeeId_weekStart_day
            $lookupKeys = [];
            $weekStarts = [];
            foreach ($entriesCollection as $entry) {
                $ws = $entry['week_start'] ?? $request->input('week_start');
                if ($ws && !empty($entry['day'])) {
                    $normalizedWs = Carbon::parse($ws)->startOfWeek(Carbon::MONDAY)->toDateString();
                    $lookupKeys[$entry['employee_id'] . '_' . $normalizedWs . '_' . $entry['day']] = true;
                    $weekStarts[] = $normalizedWs;
                }
            }
            $weekStarts = array_unique($weekStarts);

            $existing = ShiftRoster::whereIn('employee_id', $employeeIds)
                ->whereIn('week_start', $weekStarts)
                ->with('employee:id,name,designation')
                ->get();

            $conflicts = [];
            $approvedCount = 0;
            $pendingCount = 0;
            $rejectedCount = 0;

            foreach ($existing as $roster) {
                $rosterWs = Carbon::parse($roster->week_start)->toDateString();
                $key = $roster->employee_id . '_' . $rosterWs . '_' . $roster->day;

                if (isset($lookupKeys[$key])) {
                    if ($roster->status === 'approved') {
                        $approvedCount++;
                    } elseif ($roster->status === 'rejected') {
                        $rejectedCount++;
                    } else {
                        $pendingCount++;
                    }

                    $empName = $roster->employee ? $roster->employee->name : "Employee #{$roster->employee_id}";
                    if (!isset($conflicts[$roster->employee_id])) {
                        $conflicts[$roster->employee_id] = [
                            'employee_id' => $roster->employee_id,
                            'employee_name' => $empName,
                            'designation' => $roster->employee?->designation,
                            'shifts' => [],
                        ];
                    }

                    $conflicts[$roster->employee_id]['shifts'][] = [
                        'day' => $roster->day,
                        'week_start' => $rosterWs,
                        'shift_time' => $roster->shift_time,
                        'shift_type' => $roster->shift_type,
                        'status' => $roster->status,
                    ];
                }
            }

            $totalConflicts = $approvedCount + $pendingCount + $rejectedCount;

            return response()->json([
                'has_conflicts' => $totalConflicts > 0,
                'total_conflicts' => $totalConflicts,
                'approved_count' => $approvedCount,
                'pending_count' => $pendingCount,
                'rejected_count' => $rejectedCount,
                'conflicts' => array_values($conflicts),
            ]);

        } catch (\Exception $e) {
            Log::error('checkConflicts error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $user = auth()->user();
            if (!$user->isAdmin() && !$user->hasPermission('create-shift-rosters') && !$user->hasPermission('manage-shift-rosters') && !$user->hasPermission('manage-rosters')) {
                abort(403, 'Unauthorized.');
            }
            // SECURITY: Do NOT log $request->all() — it may contain sensitive shift/employee data.
            Log::info('ShiftRoster store initiated', ['user_id' => auth()->id()]);

            // Multi-tenancy check
            if (!$user->isAdmin() && $user->employee_id && $user->employee) {
                if ($request->input('company_id') && $request->input('company_id') != $user->employee->company_id) {
                    abort(403, 'Unauthorized access to another branch.');
                }
            }

            $data = $this->validateRosterData($request);
            $result = $this->processRosterEntries($data);

            // Send WhatsApp notifications after successful save
            $this->sendBulkAutomaticNotifications($data);

            // In-app notification to affected employees that their roster has been created and assigned
            $startDate = $data['week_start'] ?? now()->toDateString();
            $endDate = !empty($data['entries']) ? collect($data['entries'])->max('date') : \Carbon\Carbon::parse($startDate)->addDays(6)->toDateString();
            $affectedEmpIds = collect($data['entries'] ?? [])->pluck('employee_id')->filter()->unique();
            foreach ($affectedEmpIds as $empId) {
                \App\Services\NotificationService::notifyEmployee(
                    $empId,
                    new \App\Notifications\ShiftAssignedNotification($startDate, $endDate)
                );
            }

            // Notify Management Stakeholders (Admins across all branches, HR, and Department/Branch Managers)
            $company = Company::find($data['company_id']);
            if ($company) {
                $shiftsCount = count($data['entries'] ?? []);
                \App\Services\NotificationService::notifyManagementStakeholders(
                    new \App\Notifications\ShiftRosterCreatedNotification($company, $startDate, $shiftsCount, $user->name),
                    $company->id,
                    $data['department_id'] ?? null,
                    $user->id
                );
            }

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
            $user = auth()->user();
            if (!$user->isAdmin() && !$user->hasPermission('view-shift-rosters') && !$user->hasPermission('view-rosters')) {
                if ($user->isEmployee() && $user->employee_id && $shiftRoster->employee_id !== $user->employee_id) {
                    abort(403, 'Unauthorized.');
                }
            }
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
            if (!$user->isAdmin() && !$user->hasPermission('edit-shift-rosters') && !$user->hasPermission('manage-shift-rosters') && !$user->hasPermission('manage-rosters')) {
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
            $user = auth()->user();
            if (!$user->isAdmin() && !$user->hasPermission('edit-shift-rosters') && !$user->hasPermission('manage-shift-rosters') && !$user->hasPermission('manage-rosters')) {
                abort(403, 'Unauthorized.');
            }

            // Multi-tenancy check
            if (!$user->isAdmin() && $user->employee_id && $user->employee) {
                if ($shiftRoster->company_id != $user->employee->company_id) {
                    abort(403, 'Unauthorized access to another branch.');
                }
            }

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

            // In-app real-time notification to affected employee
            if ($shiftRoster->employee_id) {
                \App\Services\NotificationService::notifyEmployee(
                    $shiftRoster->employee_id,
                    new \App\Notifications\ShiftRosterUpdatedNotification(
                        'Shift Schedule Updated',
                        "Your shift for {$shiftRoster->date} has been updated to {$shiftRoster->shift_time} by {$user->name}.",
                        route('shift-rosters.index', ['week_start' => $shiftRoster->week_start]),
                        'shift_roster_updated'
                    )
                );
            }

            // In-app real-time notification to Management Stakeholders (HR, Manager, Admin)
            $shiftRoster->loadMissing('employee');
            \App\Services\NotificationService::notifyManagementStakeholders(
                new \App\Notifications\ShiftRosterUpdatedNotification(
                    'Shift Schedule Updated',
                    "{$user->name} updated the shift schedule for {$shiftRoster->employee?->name} ({$shiftRoster->date}: {$shiftRoster->shift_time}).",
                    route('shift-rosters.index', ['week_start' => $shiftRoster->week_start, 'company_id' => $shiftRoster->company_id]),
                    'shift_roster_updated'
                ),
                $shiftRoster->company_id,
                $shiftRoster->employee?->department_id,
                $user->id
            );

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

    // =========================================================================
    //  Approval Workflow
    // =========================================================================

    /**
     * Check if the current user can approve rosters.
     */
    private function canApproveRosters(): bool
    {
        $user = auth()->user();
        return $user->isAdmin() || $user->isHR() || $user->isManager()
            || $user->hasRole('shift-manager')
            || $user->hasPermission('approve-shift-rosters');
    }

    /**
     * Approve all roster entries for a given company + week_start (optionally dept).
     */
    public function approveRoster(Request $request)
    {
        try {
            if (!$this->canApproveRosters()) {
                return back()->with('error', 'Unauthorized: You do not have permission to approve rosters.');
            }

            $data = $request->validate([
                'company_id' => 'required|exists:companies,id',
                'week_start' => 'required|date',
                'department_id' => 'nullable|exists:departments,id',
            ]);

            $user = auth()->user();

            // Multi-tenancy check
            if (!$user->isAdmin() && $user->employee_id && $user->employee) {
                if ($data['company_id'] != $user->employee->company_id) {
                    abort(403, 'Unauthorized access to another branch.');
                }
            }

            $query = ShiftRoster::where('company_id', $data['company_id'])
                ->where('week_start', $data['week_start'])
                ->where('status', 'pending');

            if (!empty($data['department_id'])) {
                $deptEmployeeIds = Employee::where('department_id', $data['department_id'])->pluck('id');
                $query->whereIn('employee_id', $deptEmployeeIds);
            }

            $pendingEntries = $query->get();

            if ($pendingEntries->isEmpty()) {
                return back()->with('info', 'No pending roster entries found to approve.');
            }

            // Pre-fetch approved leaves for these employees during the target week range
            $weekStartCarbon = Carbon::parse($data['week_start'])->startOfWeek(Carbon::MONDAY);
            $minDate = $weekStartCarbon->toDateString();
            $maxDate = $weekStartCarbon->copy()->endOfWeek(Carbon::SUNDAY)->toDateString();
            $employeeIds = $pendingEntries->pluck('employee_id')->unique();

            $approvedLeaves = \App\Models\LeaveRequest::with('leaveType')
                ->whereIn('employee_id', $employeeIds)
                ->where('status', 'approved')
                ->where(function ($q) use ($minDate, $maxDate) {
                    $q->whereBetween('start_date', [$minDate, $maxDate])
                      ->orWhereBetween('end_date', [$minDate, $maxDate])
                      ->orWhere(function ($sub) use ($minDate, $maxDate) {
                          $sub->where('start_date', '<=', $minDate)
                              ->where('end_date', '>=', $maxDate);
                      });
                })
                ->get()
                ->groupBy('employee_id');

            $dayOffsets = ['Monday' => 0, 'Tuesday' => 1, 'Wednesday' => 2, 'Thursday' => 3,
                           'Friday' => 4, 'Saturday' => 5, 'Sunday' => 6];

            $count = 0;
            foreach ($pendingEntries as $entry) {
                $dayOffset = $dayOffsets[$entry->day] ?? 0;
                $actualDateStr = $weekStartCarbon->copy()->addDays($dayOffset)->toDateString();

                $empLeaves = $approvedLeaves->get($entry->employee_id, collect());
                $matchingLeave = $empLeaves->first(function ($leave) use ($actualDateStr) {
                    $s = is_string($leave->start_date) ? substr($leave->start_date, 0, 10) : $leave->start_date->toDateString();
                    $e = is_string($leave->end_date) ? substr($leave->end_date, 0, 10) : $leave->end_date->toDateString();
                    return $actualDateStr >= $s && $actualDateStr <= $e;
                });

                $updateData = [
                    'status'           => 'approved',
                    'approved_by'      => $user->id,
                    'approved_at'      => now(),
                    'rejection_reason' => null,
                ];

                // If employee is on approved leave on this day, ensure shift remains/sets to On Leave
                if ($matchingLeave) {
                    $leaveName = $matchingLeave->leaveType->name ?? 'Leave';
                    $updateData['shift_time'] = 'On Leave';
                    $updateData['shift_type'] = 'Leave';
                    $updateData['notes']      = 'Approved ' . $leaveName;
                }

                $entry->update($updateData);
                $count++;
            }

            Log::info('ShiftRoster approved', [
                'approved_by' => $user->id,
                'company_id'  => $data['company_id'],
                'week_start'  => $data['week_start'],
                'count'       => $count,
            ]);

            // Automatic notification dispatch upon approval (Email, SMS, WhatsApp as per company settings)
            $notifStatus = '';
            if ($count > 0) {
                $company = Company::find($data['company_id']);
                if ($company) {
                    $dispatchResult = $this->dispatchRosterNotifications($company, $data['week_start'], $data['department_id'] ?? null);
                    if ($dispatchResult['dispatched']) {
                        $channelsList = implode(', ', $dispatchResult['channels']);
                        $notifStatus = " Notifications dispatched automatically via: {$channelsList} to {$dispatchResult['recipients_count']} employees.";
                    }
                }
            }

            // In-app system notification to assigned employees
            if ($count > 0 && isset($employeeIds) && $employeeIds->isNotEmpty()) {
                $compName = isset($company) && $company ? $company->name : 'Company';
                foreach ($employeeIds as $empId) {
                    \App\Services\NotificationService::notifyEmployee(
                        $empId,
                        new \App\Notifications\ShiftRosterApprovedNotification($data['week_start'], $compName)
                    );
                }

                // In-app system notification to Management Stakeholders (Admins, HR, Managers)
                \App\Services\NotificationService::notifyManagementStakeholders(
                    new \App\Notifications\ShiftRosterUpdatedNotification(
                        'Shift Roster Approved',
                        "{$user->name} approved the weekly shift roster for {$compName} (Week: {$data['week_start']}).",
                        route('shift-rosters.index', ['week_start' => $data['week_start'], 'company_id' => $data['company_id']]),
                        'shift_roster_approved'
                    ),
                    $data['company_id'],
                    $data['department_id'] ?? null,
                    $user->id
                );
            }

            return back()->with('success', "✅ {$count} roster entries approved successfully!{$notifStatus}");

        } catch (\Exception $e) {
            Log::error('ShiftRoster approve error: ' . $e->getMessage());
            return back()->with('error', 'Error approving roster: ' . $e->getMessage());
        }
    }

    /**
     * Dispatch roster notifications to employees across enabled channels (Email, WhatsApp, SMS).
     */
    public function dispatchRosterNotifications(Company $company, string $weekStart, ?int $departmentId = null): array
    {
        try {
            $companyId = $company->id;

            $sendEmail    = Setting::get('roster_send_email', true, $companyId);
            $sendWhatsapp = Setting::get('roster_send_whatsapp', false, $companyId);
            $sendSms      = Setting::get('roster_send_sms', false, $companyId);

            $enabledChannels = [];
            if ($sendEmail) $enabledChannels[] = 'Email';
            if ($sendWhatsapp) $enabledChannels[] = 'WhatsApp';
            if ($sendSms) $enabledChannels[] = 'SMS';

            if (empty($enabledChannels)) {
                Log::info("dispatchRosterNotifications: No notification channels enabled for company {$companyId}");
                return ['dispatched' => false, 'channels' => [], 'recipients_count' => 0];
            }

            $startDate = Carbon::parse($weekStart);
            $endDate   = $startDate->copy()->addDays(6);
            $dateRange = $startDate->format('M d, Y') . ' - ' . $endDate->format('M d, Y');

            $query = ShiftRoster::where('company_id', $companyId)
                ->where('week_start', $weekStart)
                ->where('status', 'approved');

            if ($departmentId) {
                $deptEmployeeIds = Employee::where('department_id', $departmentId)->pluck('id');
                $query->whereIn('employee_id', $deptEmployeeIds);
            }

            $rosters = $query->get();

            if ($rosters->isEmpty()) {
                return ['dispatched' => false, 'channels' => $enabledChannels, 'recipients_count' => 0];
            }

            $employeeIds = $rosters->pluck('employee_id')->unique();
            $employees = Employee::whereIn('id', $employeeIds)->get();

            $dispatchedCount = 0;

            foreach ($employees as $employee) {
                $employeeRoster = $rosters->where('employee_id', $employee->id)->map(function ($r) {
                    return [
                        'day'         => $r->day,
                        'date'        => Carbon::parse($r->week_start)->addDays($this->getDayOffset($r->day))->format('M d, Y'),
                        'shift_time'  => $r->shift_time,
                        'shift_type'  => $r->shift_type,
                        'designation' => $r->designation,
                        'notes'       => $r->notes,
                    ];
                })->values()->toArray();

                if (empty($employeeRoster)) {
                    continue;
                }

                $sentToEmployee = false;

                // 1. Email Channel
                if ($sendEmail && !empty($employee->email)) {
                    try {
                        Mail::to($employee->email)->queue(new EmployeeRosterMail($employee, $company, $employeeRoster, $dateRange));
                        $sentToEmployee = true;
                    } catch (\Exception $e) {
                        Log::error("Failed to queue email for {$employee->name}: " . $e->getMessage());
                    }
                }

                // 2. WhatsApp Channel
                if ($sendWhatsapp && !empty($employee->mobile)) {
                    try {
                        \App\Jobs\SendWhatsAppRosterNotification::dispatch($employee, $company, $employeeRoster, $dateRange);
                        $sentToEmployee = true;
                    } catch (\Exception $e) {
                        Log::error("Failed to dispatch WhatsApp for {$employee->name}: " . $e->getMessage());
                    }
                }

                // 3. SMS Channel
                if ($sendSms && !empty($employee->mobile)) {
                    try {
                        \App\Jobs\SendRosterSmsNotification::dispatch($employee, $company, $employeeRoster, $dateRange);
                        $sentToEmployee = true;
                    } catch (\Exception $e) {
                        Log::error("Failed to dispatch SMS for {$employee->name}: " . $e->getMessage());
                    }
                }

                if ($sentToEmployee) {
                    $dispatchedCount++;
                }
            }

            Log::info("Automatic roster notifications dispatched for week {$weekStart}", [
                'company_id'       => $companyId,
                'channels'         => $enabledChannels,
                'recipients_count' => $dispatchedCount,
            ]);

            return [
                'dispatched'       => $dispatchedCount > 0,
                'channels'         => $enabledChannels,
                'recipients_count' => $dispatchedCount,
            ];
        } catch (\Exception $e) {
            Log::error('dispatchRosterNotifications error: ' . $e->getMessage());
            return ['dispatched' => false, 'channels' => [], 'recipients_count' => 0];
        }
    }

    /**
     * Reject all pending roster entries for a given company + week_start.
     */
    public function rejectRoster(Request $request)
    {
        try {
            if (!$this->canApproveRosters()) {
                return back()->with('error', 'Unauthorized: You do not have permission to reject rosters.');
            }

            $data = $request->validate([
                'company_id'       => 'required|exists:companies,id',
                'week_start'       => 'required|date',
                'department_id'    => 'nullable|exists:departments,id',
                'rejection_reason' => 'nullable|string|max:500',
            ]);

            $user = auth()->user();

            if (!$user->isAdmin() && $user->employee_id && $user->employee) {
                if ($data['company_id'] != $user->employee->company_id) {
                    abort(403, 'Unauthorized access to another branch.');
                }
            }

            $query = ShiftRoster::where('company_id', $data['company_id'])
                ->where('week_start', $data['week_start'])
                ->whereIn('status', ['pending', 'approved']);

            if (!empty($data['department_id'])) {
                $deptEmployeeIds = Employee::where('department_id', $data['department_id'])->pluck('id');
                $query->whereIn('employee_id', $deptEmployeeIds);
            }

            $count = $query->update([
                'status'           => 'rejected',
                'approved_by'      => $user->id,
                'approved_at'      => now(),
                'rejection_reason' => $data['rejection_reason'] ?? null,
            ]);

            Log::info('ShiftRoster rejected', [
                'rejected_by' => $user->id,
                'company_id'  => $data['company_id'],
                'week_start'  => $data['week_start'],
                'count'       => $count,
            ]);

            // In-app notification to Management Stakeholders (HR, Manager, Admin)
            \App\Services\NotificationService::notifyManagementStakeholders(
                new \App\Notifications\ShiftRosterUpdatedNotification(
                    'Shift Roster Rejected',
                    "{$user->name} rejected the shift roster for Week: {$data['week_start']}. Reason: " . ($data['rejection_reason'] ?? 'Needs revision'),
                    route('shift-rosters.management', ['from_date' => $data['week_start'], 'company_id' => $data['company_id']]),
                    'shift_roster_rejected'
                ),
                $data['company_id'],
                $data['department_id'] ?? null,
                $user->id
            );

            return back()->with('success', "❌ {$count} roster entries rejected. Creator can revise and resubmit.");

        } catch (\Exception $e) {
            Log::error('ShiftRoster reject error: ' . $e->getMessage());
            return back()->with('error', 'Error rejecting roster: ' . $e->getMessage());
        }
    }

    /**
     * Reset rejected/approved rosters back to pending (for re-editing).
     */
    public function resetToPending(Request $request)
    {
        try {
            $user = auth()->user();
            if (!$this->canApproveRosters() && !$user->hasPermission('manage-shift-rosters') && !$user->hasPermission('manage-rosters')) {
                return back()->with('error', 'Unauthorized.');
            }

            $data = $request->validate([
                'company_id'    => 'required|exists:companies,id',
                'week_start'    => 'required|date',
                'department_id' => 'nullable|exists:departments,id',
            ]);

            $query = ShiftRoster::where('company_id', $data['company_id'])
                ->where('week_start', $data['week_start']);

            if (!empty($data['department_id'])) {
                $deptEmployeeIds = Employee::where('department_id', $data['department_id'])->pluck('id');
                $query->whereIn('employee_id', $deptEmployeeIds);
            }

            $count = $query->update([
                'status'           => 'pending',
                'approved_by'      => null,
                'approved_at'      => null,
                'rejection_reason' => null,
            ]);

            return back()->with('success', "{$count} roster entries reset to pending.");

        } catch (\Exception $e) {
            Log::error('ShiftRoster reset error: ' . $e->getMessage());
            return back()->with('error', 'Error resetting roster: ' . $e->getMessage());
        }
    }

    /**
     * Display all created rosters grouped by week/schedule batch with status & approval tracking.
     */
    public function managementIndex(Request $request)
    {
        try {
            $user = auth()->user();

            // Permission check: Admin, HR, Manager, or users with view-shift-roster-management / approve-shift-rosters / manage-shift-rosters
            $canAccess = $user->isAdmin() || $user->isHR() || $user->isManager()
                || $user->hasPermission('view-shift-roster-management')
                || $user->hasPermission('approve-shift-rosters')
                || $user->hasPermission('manage-shift-rosters')
                || $user->hasPermission('view-shift-rosters');

            if (!$canAccess) {
                abort(403, 'Unauthorized access to Shift Roster Management.');
            }

            // Multi-tenancy scoping
            $company_id = $request->input('company_id');
            if (!$user->isAdmin() && !$user->isHR() && $user->employee_id && $user->employee) {
                $company_id = $user->employee->company_id;
            }

            $companiesQuery = Company::withoutGlobalScope('company')->orderBy('name');
            if (!$user->isAdmin() && !$user->isHR() && $user->employee_id && $user->employee) {
                // Support multi-branch assignments: include both the primary company_id
                // and any additional companies linked via the employee_company pivot table.
                $employee = $user->employee;
                $assignedCompanyIds = collect([$employee->company_id]);

                // Check if the employee has additional companies via pivot
                $pivotIds = \Illuminate\Support\Facades\DB::table('employee_company')
                    ->where('employee_id', $employee->id)
                    ->pluck('company_id');
                $assignedCompanyIds = $assignedCompanyIds->merge($pivotIds)->unique()->filter()->values();

                $companiesQuery->whereIn('id', $assignedCompanyIds);
            }
            $companies = $companiesQuery->get(['id', 'name', 'slug']);

            // Accessible departments
            $departmentsQuery = \App\Models\Department::withoutGlobalScope('company')->orderBy('name');
            if ($company_id) {
                $departmentsQuery->where(function ($q) use ($company_id) {
                    $q->where('company_id', $company_id)
                      ->orWhereHas('companies', fn($sub) => $sub->where('companies.id', $company_id));
                });
            }
            $departments = $departmentsQuery->get(['id', 'name']);

            // Base query for schedule batches
            $query = ShiftRoster::withoutGlobalScope('company')->newQuery();

            if (!$user->isAdmin() && !$user->isHR() && $user->employee_id && $user->employee) {
                $query->where('company_id', $user->employee->company_id);
            } elseif ($company_id) {
                $query->where('company_id', $company_id);
            }

            if ($request->filled('department_id')) {
                $deptEmployeeIds = Employee::where('department_id', $request->department_id)->pluck('id');
                $query->whereIn('employee_id', $deptEmployeeIds);
            }

            $period = $request->input('period', 'all');
            if ($period === 'this_week') {
                $ws = now()->startOfWeek(Carbon::MONDAY)->toDateString();
                $query->where('week_start', $ws);
            } elseif ($period === 'next_week') {
                $ws = now()->addWeek()->startOfWeek(Carbon::MONDAY)->toDateString();
                $query->where('week_start', $ws);
            } elseif ($period === 'this_month') {
                $ms = now()->startOfMonth()->startOfWeek(Carbon::MONDAY)->toDateString();
                $me = now()->endOfMonth()->startOfWeek(Carbon::MONDAY)->toDateString();
                $query->whereBetween('week_start', [$ms, $me]);
            } elseif ($period === 'last_month') {
                $ms = now()->subMonth()->startOfMonth()->startOfWeek(Carbon::MONDAY)->toDateString();
                $me = now()->subMonth()->endOfMonth()->startOfWeek(Carbon::MONDAY)->toDateString();
                $query->whereBetween('week_start', [$ms, $me]);
            } else {
                if ($request->filled('from_date')) {
                    $query->where('week_start', '>=', $request->from_date);
                }

                if ($request->filled('to_date')) {
                    $query->where('week_start', '<=', $request->to_date);
                }
            }

            // Aggregate by company_id and week_start
            $rawBatches = $query->selectRaw("
                company_id,
                week_start,
                COUNT(*) as total_shifts,
                COUNT(DISTINCT employee_id) as total_employees,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
                MAX(approved_by) as approved_by,
                MAX(approved_at) as approved_at,
                MAX(rejection_reason) as rejection_reason,
                MIN(created_at) as created_at,
                MAX(updated_at) as updated_at
            ")
            ->groupBy('company_id', 'week_start')
            ->orderBy('week_start', 'desc')
            ->get();

            // Collect IDs for bulk eager loading
            $companyIds = $rawBatches->pluck('company_id')->unique()->filter()->values();
            $approverIds = $rawBatches->pluck('approved_by')->unique()->filter()->values();

            $companiesMap = Company::whereIn('id', $companyIds)->get(['id', 'name', 'slug'])->keyBy('id');
            $approversMap = \App\Models\User::whereIn('id', $approverIds)->get(['id', 'name', 'email', 'role'])->keyBy('id');

            $batches = $rawBatches->map(function ($row) use ($companiesMap, $approversMap) {
                $company = $companiesMap[$row->company_id] ?? null;
                $approver = $row->approved_by ? ($approversMap[$row->approved_by] ?? null) : null;

                $weekStartCarbon = Carbon::parse($row->week_start);
                $weekEndCarbon = $weekStartCarbon->copy()->addDays(6);

                $status = 'pending';
                if ($row->rejected_count > 0) {
                    $status = 'rejected';
                } elseif ($row->pending_count == 0 && $row->approved_count > 0) {
                    $status = 'approved';
                }

                return [
                    'company_id'       => $row->company_id,
                    'company_name'     => $company ? $company->name : "Branch #{$row->company_id}",
                    'company_slug'     => $company ? $company->slug : '',
                    'week_start'       => $weekStartCarbon->toDateString(),
                    'week_end'         => $weekEndCarbon->toDateString(),
                    'week_label'       => $weekStartCarbon->format('M d') . ' - ' . $weekEndCarbon->format('M d, Y'),
                    'total_shifts'     => (int) $row->total_shifts,
                    'total_employees'  => (int) $row->total_employees,
                    'pending_count'    => (int) $row->pending_count,
                    'approved_count'   => (int) $row->approved_count,
                    'rejected_count'   => (int) $row->rejected_count,
                    'status'           => $status,
                    'approved_by_name' => $approver ? $approver->name : null,
                    'approved_by_role' => $approver ? $approver->role : null,
                    'approved_at'      => $row->approved_at ? Carbon::parse($row->approved_at)->format('M d, Y h:i A') : null,
                    'rejection_reason' => $row->rejection_reason,
                    'created_at'       => $row->created_at ? Carbon::parse($row->created_at)->format('M d, Y') : null,
                    'updated_at'       => $row->updated_at ? Carbon::parse($row->updated_at)->format('M d, Y h:i A') : null,
                ];
            });

            // Global Metrics before filtering by status tab
            $metrics = [
                'total_schedules' => $batches->count(),
                'pending'         => $batches->where('status', 'pending')->count(),
                'approved'        => $batches->where('status', 'approved')->count(),
                'rejected'        => $batches->where('status', 'rejected')->count(),
                'total_shifts'    => $batches->sum('total_shifts'),
            ];

            // Apply status filter tab if specified
            $statusFilter = $request->input('status', 'all');
            if ($statusFilter !== 'all' && in_array($statusFilter, ['pending', 'approved', 'rejected'])) {
                $batches = $batches->where('status', $statusFilter)->values();
            }

            // Apply search filter if specified
            if ($request->filled('search')) {
                $search = strtolower($request->search);
                $batches = $batches->filter(function ($b) use ($search) {
                    return str_contains(strtolower($b['company_name']), $search)
                        || str_contains(strtolower($b['week_label']), $search)
                        || str_contains(strtolower($b['week_start']), $search);
                })->values();
            }

            // Sort batches according to sort_by filter
            $sortBy = $request->input('sort_by', 'date_desc');
            if ($sortBy === 'date_asc') {
                $batches = $batches->sortBy('week_start')->values();
            } elseif ($sortBy === 'shifts_desc') {
                $batches = $batches->sortByDesc('total_shifts')->values();
            } elseif ($sortBy === 'shifts_asc') {
                $batches = $batches->sortBy('total_shifts')->values();
            } elseif ($sortBy === 'employees_desc') {
                $batches = $batches->sortByDesc('total_employees')->values();
            } elseif ($sortBy === 'pending_desc') {
                $batches = $batches->sortByDesc('pending_count')->values();
            } else {
                $batches = $batches->sortByDesc('week_start')->values();
            }

            $canApprove = $user->isAdmin() || $user->isHR() || $user->isManager()
                || $user->hasRole('shift-manager')
                || $user->hasPermission('approve-shift-rosters');

            return Inertia::render('ShiftRoster/Management', [
                'batches'      => $batches,
                'metrics'      => $metrics,
                'companies'    => $companies,
                'departments'  => $departments,
                'filters'      => [
                    'company_id'    => $company_id,
                    'department_id' => $request->department_id,
                    'status'        => $statusFilter,
                    'search'        => $request->search,
                    'from_date'     => $request->from_date,
                    'to_date'       => $request->to_date,
                    'period'        => $period,
                    'sort_by'       => $sortBy,
                ],
                'canApprove'   => $canApprove,
                'userRole'     => $user->role,
            ]);

        } catch (\Exception $e) {
            Log::error('ShiftRoster managementIndex error: ' . $e->getMessage());
            return back()->with('error', 'Error loading roster management: ' . $e->getMessage());
        }
    }

    /**
     * Get detailed roster breakdown for a specific company + week_start batch (used by Details Modal).
     */
    public function getBatchDetails(Request $request)
    {
        try {
            $user = auth()->user();

            $canAccess = $user->isAdmin() || $user->isHR() || $user->isManager()
                || $user->hasPermission('view-shift-roster-management')
                || $user->hasPermission('view-shift-rosters');

            if (!$canAccess) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $request->validate([
                'company_id'    => 'required|exists:companies,id',
                'week_start'    => 'required|date',
                'department_id' => 'nullable|exists:departments,id',
            ]);

            $company_id = $request->company_id;
            $week_start = $request->week_start;

            // Multi-tenancy check
            if (!$user->isAdmin() && !$user->isHR() && $user->employee_id && $user->employee) {
                if ($company_id != $user->employee->company_id) {
                    return response()->json(['success' => false, 'message' => 'Unauthorized access to another branch.'], 403);
                }
            }

            $company = Company::findOrFail($company_id);

            $rostersQuery = ShiftRoster::with([
                'employee:id,name,employee_image,designation,department_id,email,mobile',
                'employee.department:id,name',
                'approvedByUser:id,name,email,role'
            ])
            ->where('company_id', $company_id)
            ->where('week_start', $week_start);

            if ($request->filled('department_id')) {
                $deptEmployeeIds = Employee::where('department_id', $request->department_id)->pluck('id');
                $rostersQuery->whereIn('employee_id', $deptEmployeeIds);
            }

            $rosters = $rostersQuery->get();

            if ($rosters->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No roster records found for the selected schedule.'
                ], 404);
            }

            $weekStartCarbon = Carbon::parse($week_start);
            $weekEndCarbon = $weekStartCarbon->copy()->addDays(6);

            $totalShifts = $rosters->count();
            $approvedCount = $rosters->where('status', 'approved')->count();
            $pendingCount = $rosters->where('status', 'pending')->count();
            $rejectedCount = $rosters->where('status', 'rejected')->count();

            $status = 'pending';
            if ($rejectedCount > 0) {
                $status = 'rejected';
            } elseif ($pendingCount == 0 && $approvedCount > 0) {
                $status = 'approved';
            }

            $lastApproved = $rosters->whereNotNull('approved_by')->first();
            $lastRejected = $rosters->where('status', 'rejected')->whereNotNull('rejection_reason')->first();

            // Group shifts by employee for a comprehensive weekly breakdown
            $dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            $employeesGrouped = $rosters->groupBy('employee_id')->map(function ($empRosters) use ($dayNames, $weekStartCarbon) {
                $employee = $empRosters->first()->employee;
                $daysMap = [];

                foreach ($dayNames as $index => $day) {
                    $roster = $empRosters->firstWhere('day', $day);
                    $actualDate = $weekStartCarbon->copy()->addDays($index)->format('M d');
                    if ($roster) {
                        $daysMap[$day] = [
                            'date'             => $actualDate,
                            'shift_time'       => $roster->shift_time,
                            'shift_type'       => $roster->shift_type,
                            'designation'      => $roster->designation,
                            'notes'            => $roster->notes,
                            'status'           => $roster->status,
                            'rejection_reason' => $roster->rejection_reason,
                        ];
                    } else {
                        $daysMap[$day] = [
                            'date'       => $actualDate,
                            'shift_time' => 'Off',
                            'shift_type' => 'Weekly Off',
                            'status'     => 'none'
                        ];
                    }
                }

                return [
                    'employee_id'        => $employee ? $employee->id : null,
                    'employee_name'      => $employee ? $employee->name : 'Unknown Employee',
                    'employee_image'     => $employee ? $employee->employee_image : null,
                    'designation'        => $employee ? $employee->designation : null,
                    'department_name'    => $employee && $employee->department ? $employee->department->name : 'General',
                    'email'              => $employee ? $employee->email : null,
                    'mobile'             => $employee ? $employee->mobile : null,
                    'days'               => $daysMap,
                    'active_shifts_count'=> $empRosters->count(),
                ];
            })->values();

            $canApprove = $user->isAdmin() || $user->isHR() || $user->isManager()
                || $user->hasRole('shift-manager')
                || $user->hasPermission('approve-shift-rosters');

            return response()->json([
                'success' => true,
                'data' => [
                    'company_id'       => $company->id,
                    'company_name'     => $company->name,
                    'company_slug'     => $company->slug,
                    'week_start'       => $weekStartCarbon->toDateString(),
                    'week_end'         => $weekEndCarbon->toDateString(),
                    'week_label'       => $weekStartCarbon->format('M d') . ' - ' . $weekEndCarbon->format('M d, Y'),
                    'status'           => $status,
                    'total_shifts'     => $totalShifts,
                    'total_employees'  => $employeesGrouped->count(),
                    'pending_count'    => $pendingCount,
                    'approved_count'   => $approvedCount,
                    'rejected_count'   => $rejectedCount,
                    'approved_by_name' => $lastApproved && $lastApproved->approvedByUser ? $lastApproved->approvedByUser->name : null,
                    'approved_by_role' => $lastApproved && $lastApproved->approvedByUser ? $lastApproved->approvedByUser->role : null,
                    'approved_at'      => $lastApproved && $lastApproved->approved_at ? $lastApproved->approved_at->format('M d, Y h:i A') : null,
                    'rejection_reason' => $lastRejected ? $lastRejected->rejection_reason : null,
                    'employees'        => $employeesGrouped,
                    'can_approve'      => $canApprove,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('ShiftRoster getBatchDetails error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error loading details: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(ShiftRoster $shiftRoster)
    {
        try {
            $user = auth()->user();
            if (!$user->isAdmin() && !$user->hasPermission('delete-shift-rosters') && !$user->hasPermission('manage-shift-rosters') && !$user->hasPermission('manage-rosters')) {
                abort(403, 'Unauthorized.');
            }

            // Multi-tenancy check
            if (!$user->isAdmin() && $user->employee_id && $user->employee) {
                if ($shiftRoster->company_id != $user->employee->company_id) {
                    abort(403, 'Unauthorized access to another branch.');
                }
            }

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
            $user = auth()->user();
            if (!$user->isAdmin() && !$user->hasPermission('create-shift-rosters') && !$user->hasPermission('edit-shift-rosters') && !$user->hasPermission('manage-shift-rosters') && !$user->hasPermission('manage-rosters')) {
                abort(403, 'Unauthorized.');
            }

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

            // Multi-tenancy check
            if (!$user->isAdmin() && $user->employee_id && $user->employee) {
                if ($data['company_id'] != $user->employee->company_id) {
                    abort(403, 'Unauthorized access to another branch.');
                }
            }

            // Ensure week_start is normalized to Monday
            $data['week_start'] = Carbon::parse($data['week_start'])->startOfWeek(Carbon::MONDAY)->toDateString();

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

            // Created or edited shift starts as pending approval
            $data['status'] = 'pending';
            $data['approved_by'] = null;
            $data['approved_at'] = null;
            $data['rejection_reason'] = null;

            $shiftRoster = ShiftRoster::updateOrCreate(
                [
                    'employee_id' => $data['employee_id'],
                    'week_start' => $data['week_start'],
                    'day' => $data['day'],
                ],
                $data
            );
            $this->sendAutomaticNotification($shiftRoster);

            // In-app notification to affected employee
            \App\Services\NotificationService::notifyEmployee(
                $shiftRoster->employee_id,
                new \App\Notifications\ShiftRosterUpdatedNotification(
                    'Shift Schedule Assigned',
                    "Your shift for {$shiftRoster->date} has been scheduled as {$shiftRoster->shift_time} by {$user->name}.",
                    route('shift-rosters.index', ['week_start' => $shiftRoster->week_start]),
                    'shift_roster_updated'
                )
            );

            // In-app notification to Management Stakeholders (HR, Manager, Admin)
            $shiftRoster->loadMissing('employee');
            \App\Services\NotificationService::notifyManagementStakeholders(
                new \App\Notifications\ShiftRosterUpdatedNotification(
                    'Shift Schedule Updated',
                    "{$user->name} saved shift for {$shiftRoster->employee?->name} ({$shiftRoster->date}: {$shiftRoster->shift_time}).",
                    route('shift-rosters.index', ['week_start' => $shiftRoster->week_start, 'company_id' => $shiftRoster->company_id]),
                    'shift_roster_updated'
                ),
                $shiftRoster->company_id,
                $shiftRoster->employee?->department_id,
                $user->id
            );

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
            $user = auth()->user();
            if (!$user->isAdmin() && !$user->hasPermission('create-shift-rosters') && !$user->hasPermission('manage-shift-rosters') && !$user->hasPermission('manage-rosters')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized.'
                ], 403);
            }

            $data = $this->validateRosterData($request);

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

    public function batchStore(Request $request)
    {
        return $this->bulkStore($request);
    }

    public function duplicateWeek(Request $request)
    {
        try {
            $user = auth()->user();
            if (!$user->isAdmin() && !$user->hasPermission('create-shift-rosters') && !$user->hasPermission('manage-shift-rosters') && !$user->hasPermission('manage-rosters')) {
                abort(403, 'Unauthorized.');
            }

            $data = $request->validate([
                'source_week' => 'required|date',
                'target_week' => 'required|date',
                'company_id' => 'required|exists:companies,id',
            ]);

            // Snap weeks to Monday
            $data['source_week'] = Carbon::parse($data['source_week'])->startOfWeek(Carbon::MONDAY)->toDateString();
            $data['target_week'] = Carbon::parse($data['target_week'])->startOfWeek(Carbon::MONDAY)->toDateString();

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

            if ($sourceRosters->isEmpty()) {
                return $request->boolean('check_conflicts')
                    ? response()->json(['has_conflicts' => false, 'total_conflicts' => 0, 'approved_count' => 0, 'pending_count' => 0])
                    : back()->with('error', 'No shifts found in the source week to duplicate.');
            }

            // Target week conflict check
            if ($request->boolean('check_conflicts')) {
                $targetQuery = ShiftRoster::where('company_id', $data['company_id'])
                    ->where('week_start', $data['target_week']);
                if ($request->has('department_id') && $request->department_id) {
                    $targetQuery->whereIn('employee_id', $employeeIds);
                }
                $existingCount = (clone $targetQuery)->count();
                $approvedCount = (clone $targetQuery)->where('status', 'approved')->count();
                $pendingCount = (clone $targetQuery)->where('status', 'pending')->count();
                return response()->json([
                    'has_conflicts' => $existingCount > 0,
                    'total_conflicts' => $existingCount,
                    'approved_count' => $approvedCount,
                    'pending_count' => $pendingCount,
                ]);
            }

            $duplicatedCount = 0;
            DB::beginTransaction();

            try {
                $now = now();
                $targetWeekCarbon = Carbon::parse($data['target_week']);
                $weeklyOffService = app(WeeklyOffService::class);

                // Pre-fetch employees for weekly off resolution in target week
                $empIds = $sourceRosters->pluck('employee_id')->unique();
                $employeesCollection = Employee::with(['weeklyOffs', 'company'])
                    ->whereIn('id', $empIds)
                    ->get()
                    ->keyBy('id');
                $weeklyOffMap = $weeklyOffService->buildWeeklyOffMap($employeesCollection, $targetWeekCarbon);

                $dayOffsets = [
                    'Monday' => 0, 'Tuesday' => 1, 'Wednesday' => 2, 'Thursday' => 3,
                    'Friday' => 4, 'Saturday' => 5, 'Sunday' => 6
                ];

                $upsertData = [];
                foreach ($sourceRosters as $roster) {
                    $dayOffset = $dayOffsets[$roster->day] ?? 0;
                    $targetDate = $targetWeekCarbon->copy()->addDays($dayOffset);

                    $isWeeklyOff = $weeklyOffService->isWeeklyOffFromMap($roster->employee_id, $targetDate, $weeklyOffMap);
                    $shiftTime = $isWeeklyOff ? 'Weekly Off' : $roster->shift_time;
                    $shiftType = $isWeeklyOff ? 'Weekly Off' : $roster->shift_type;
                    $notes = $isWeeklyOff ? 'Auto: Weekly Off Day' : $roster->notes;

                    $upsertData[] = [
                        'employee_id' => $roster->employee_id,
                        'company_id' => $roster->company_id,
                        'week_start' => $data['target_week'],
                        'day' => $roster->day,
                        'shift_time' => $shiftTime,
                        'shift_type' => $shiftType,
                        'designation' => $roster->designation,
                        'notes' => $notes,
                        'status' => 'pending',
                        'approved_by' => null,
                        'approved_at' => null,
                        'rejection_reason' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                if (!empty($upsertData)) {
                    collect($upsertData)->chunk(500)->each(function ($chunk) {
                        ShiftRoster::upsert(
                            $chunk->all(),
                            ['employee_id', 'week_start', 'day'],
                            ['shift_time', 'shift_type', 'designation', 'notes', 'company_id', 'status', 'approved_by', 'approved_at', 'rejection_reason', 'updated_at']
                        );
                    });
                    $duplicatedCount = count($upsertData);
                }

                DB::commit();
                return back()->with('success', "Successfully duplicated {$duplicatedCount} roster entries to week starting {$data['target_week']}");

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
            if (!$user->isAdmin() && !$user->hasPermission('delete-shift-rosters') && !$user->hasPermission('manage-shift-rosters') && !$user->hasPermission('manage-rosters')) {
                abort(403, 'Unauthorized.');
            }

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
            if (!$user->isAdmin() && !$user->hasPermission('view-shift-rosters') && !$user->hasPermission('manage-shift-rosters') && !$user->hasPermission('view-rosters') && !$user->hasPermission('manage-rosters')) {
                abort(403, 'Unauthorized.');
            }

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
            if (!$user->isAdmin() && !$user->hasPermission('manage-shift-rosters') && !$user->hasPermission('manage-rosters')) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $company_id = $request->input('company_id');
            $week_start = $request->input('week_start');

            // ----------------------------------------------------------------
            // APPROVAL GATE: Only allow broadcast if roster is approved
            // ----------------------------------------------------------------
            if ($week_start && $company_id) {
                $department_id = $request->input('department_id');

                $pendingQuery = ShiftRoster::where('company_id', $company_id)
                    ->where('week_start', $week_start)
                    ->where('status', 'pending');

                $rejectedQuery = ShiftRoster::where('company_id', $company_id)
                    ->where('week_start', $week_start)
                    ->where('status', 'rejected');

                if ($department_id) {
                    $deptEmployeeIds = Employee::where('department_id', $department_id)->pluck('id');
                    $pendingQuery->whereIn('employee_id', $deptEmployeeIds);
                    $rejectedQuery->whereIn('employee_id', $deptEmployeeIds);
                }

                $pendingCount = $pendingQuery->count();
                if ($pendingCount > 0) {
                    return response()->json([
                        'success' => false,
                        'message' => "Roster broadcast blocked: {$pendingCount} roster entries are still pending approval. Please have HR or a Manager approve the roster before broadcasting to employees.",
                        'blocked_reason' => 'pending_approval',
                    ], 422);
                }

                $rejectedCount = $rejectedQuery->count();
                if ($rejectedCount > 0) {
                    return response()->json([
                        'success' => false,
                        'message' => "Roster broadcast blocked: {$rejectedCount} roster entries have been rejected. Please revise and resubmit for approval.",
                        'blocked_reason' => 'rejected',
                    ], 422);
                }
            }

            $month = $request->input('month');
            $year = $request->input('year');
            $start_date = $request->input('start_date');
            $end_date = $request->input('end_date');

            if (!$company_id) {
                return response()->json(['success' => false, 'message' => 'Company ID is required.'], 422);
            }

            // Multi-tenancy check
            if (!$user->isAdmin() && $user->employee_id && $user->employee) {
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
                        \App\Jobs\SendWhatsAppRosterNotification::dispatch($employee, $company, $employeeRoster, $dateRange);
                    }

                    if ($sendSms && !empty($employee->mobile)) {
                        \App\Jobs\SendRosterSmsNotification::dispatch($employee, $company, $employeeRoster, $dateRange);
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
            $user = auth()->user();
            if (!$user->isAdmin() && !$user->hasPermission('manage-shift-rosters') && !$user->hasPermission('manage-rosters')) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

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

            // Multi-tenancy check
            if (!$user->isAdmin() && $user->employee_id && $user->employee) {
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
                // APPROVAL GATE: Selected employees
                $pendingCount = ShiftRoster::where('company_id', $company_id)
                    ->where('week_start', $week_start)
                    ->whereIn('employee_id', $employee_ids)
                    ->where('status', 'pending')
                    ->count();

                if ($pendingCount > 0) {
                    return response()->json([
                        'success' => false,
                        'message' => "Roster broadcast blocked: {$pendingCount} selected roster entries are still pending approval. Please have HR or a Manager approve the roster before broadcasting.",
                        'blocked_reason' => 'pending_approval',
                    ], 422);
                }

                $rejectedCount = ShiftRoster::where('company_id', $company_id)
                    ->where('week_start', $week_start)
                    ->whereIn('employee_id', $employee_ids)
                    ->where('status', 'rejected')
                    ->count();

                if ($rejectedCount > 0) {
                    return response()->json([
                        'success' => false,
                        'message' => "Roster broadcast blocked: {$rejectedCount} selected roster entries are marked as rejected. Please revise and approve before broadcasting.",
                        'blocked_reason' => 'rejected',
                    ], 422);
                }

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
                        \App\Jobs\SendWhatsAppRosterNotification::dispatch($employee, $company, $employeeRoster, $dateRange);
                    }

                    if ($sendSms && !empty($employee->mobile)) {
                        \App\Jobs\SendRosterSmsNotification::dispatch($employee, $company, $employeeRoster, $dateRange);
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
            $user = auth()->user();
            if (!$user->isAdmin() && !$user->hasPermission('manage-shift-rosters') && !$user->hasPermission('manage-rosters')) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

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

            // Multi-tenancy check
            if (!$user->isAdmin() && $user->employee_id && $user->employee) {
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
                // APPROVAL GATE: Single employee
                $pendingCount = ShiftRoster::where('company_id', $company_id)
                    ->where('employee_id', $employee_id)
                    ->where('week_start', $week_start)
                    ->where('status', 'pending')
                    ->count();

                if ($pendingCount > 0) {
                    return response()->json([
                        'success' => false,
                        'message' => "Roster broadcast blocked: Roster for this employee is still pending approval. Please have HR or a Manager approve the roster first.",
                        'blocked_reason' => 'pending_approval',
                    ], 422);
                }

                $rejectedCount = ShiftRoster::where('company_id', $company_id)
                    ->where('employee_id', $employee_id)
                    ->where('week_start', $week_start)
                    ->where('status', 'rejected')
                    ->count();

                if ($rejectedCount > 0) {
                    return response()->json([
                        'success' => false,
                        'message' => "Roster broadcast blocked: Roster for this employee has been rejected.",
                        'blocked_reason' => 'rejected',
                    ], 422);
                }

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
                    \App\Jobs\SendWhatsAppRosterNotification::dispatch($employee, $company, $employeeRoster, $dateRange);
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
        // Broadcast ONLY once the roster is approved
        if ($shiftRoster->status !== 'approved') {
            Log::info("sendAutomaticNotification: Shift {$shiftRoster->id} is pending approval, skipping auto-notification.");
            return;
        }

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

                \App\Jobs\SendWhatsAppRosterNotification::dispatch($shiftRoster->employee, $shiftRoster->company, $employeeRoster, $dateRange);
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

            // Broadcast ONLY once approved
            $rosters = $rosters->filter(fn($r) => $r->status === 'approved');

            if ($rosters->isEmpty()) {
                Log::info('sendBulkAutomaticNotifications: Roster entries are pending approval — notifications deferred until approved.');
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
                    \App\Jobs\SendWhatsAppRosterNotification::dispatch($employee, $company, $employeeRoster, $dateRange);
                    Log::info("sendBulkAutomaticNotifications: WhatsApp queued for {$employee->name} (ID: {$empId}), shifts: " . count($employeeRoster));
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

    private function getRosterData(Request $request, $companyIds, $preloadedEmployees = null)
    {
        $query = ShiftRoster::withoutGlobalScope('company')->newQuery();

        $week = $request->input('week_start', now()->startOfWeek()->toDateString());

        // Build the query based on view mode
        if ($request->has('month') && $request->has('year')) {
            $month = (int) $request->input('month');
            $year = (int) $request->input('year');
            $start_week = Carbon::create($year, $month + 1, 1)->startOfWeek(Carbon::MONDAY)->toDateString();
            $end_week = Carbon::create($year, $month + 1, 1)->endOfMonth()->startOfWeek(Carbon::MONDAY)->toDateString();

            $query->whereBetween('week_start', [$start_week, $end_week]);
        } elseif ($request->has('start_date') && $request->has('end_date')) {
            $start_week = Carbon::parse($request->input('start_date'))->startOfWeek(Carbon::MONDAY)->toDateString();
            $end_week = Carbon::parse($request->input('end_date'))->startOfWeek(Carbon::MONDAY)->toDateString();

            $query->whereBetween('week_start', [$start_week, $end_week]);
        } else {
            $normalizedWeek = Carbon::parse($week)->startOfWeek(Carbon::MONDAY)->toDateString();
            $query->where('week_start', $normalizedWeek);
        }

        // Support multi-company scope (when "All Branches" is selected)
        if ($companyIds instanceof \Illuminate\Support\Collection) {
            if ($companyIds->isNotEmpty()) {
                $query->whereIn('company_id', $companyIds->values()->all());
            }
        } elseif ($companyIds) {
            $query->where('company_id', $companyIds);
        }

        // Filter by department if provided (scope to the same companies as the roster query)
        $department_id = $request->input('department_id');
        if ($department_id) {
            $deptEmployeeQuery = Employee::withoutGlobalScope('company')->where('department_id', $department_id);
            if ($companyIds instanceof \Illuminate\Support\Collection) {
                if ($companyIds->isNotEmpty()) {
                    $deptEmployeeQuery->whereIn('company_id', $companyIds->values()->all());
                }
            } elseif ($companyIds) {
                $deptEmployeeQuery->where('company_id', $companyIds);
            }
            $employeeIds = $deptEmployeeQuery->pluck('id');
            $query->whereIn('employee_id', $employeeIds);
        }

        // Fetch roster rows with necessary columns including approval metadata
        $rosters = $query->select([
            'id',
            'employee_id',
            'company_id',
            'week_start',
            'day',
            'shift_time',
            'shift_type',
            'designation',
            'notes',
            'status',
            'approved_by',
            'approved_at',
            'rejection_reason',
        ])->get();

        // Build weekly off map for all unique employees in this roster result (bulk, efficient)
        // referenceDate: use the actual start of the period being viewed (not always current week)
        $weeklyOffService = app(WeeklyOffService::class);
        $employeeIds = $rosters->pluck('employee_id')->unique()->values();

        if ($preloadedEmployees instanceof \Illuminate\Support\Collection && $preloadedEmployees->isNotEmpty()) {
            $employees = $preloadedEmployees->whereIn('id', $employeeIds)->keyBy('id');
        } else {
            $employees = Employee::with([
                'weeklyOffs:id,employee_id,weekly_off_day,effective_date',
                'company:id,weekly_off_days'
            ])
            ->whereIn('id', $employeeIds)
            ->get(['id', 'company_id'])
            ->keyBy('id');
        }

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
            'entries.*.employee_id' => 'required|integer',
            'entries.*.day' => 'required|in:Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
            'entries.*.shift_time' => 'required|string|max:255',
            'entries.*.shift_type' => 'nullable|string|max:255',
            'entries.*.designation' => 'nullable|string|max:255',
            'entries.*.notes' => 'nullable|string|max:1000',
            'entries.*.week_start' => 'nullable|date',
            'confirm_override' => 'nullable|boolean',
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
            $topLevelWs = $data['week_start'] ?? null;
            if (empty($topLevelWs)) {
                $topLevelWs = $entries->first()['week_start'] ?? null;
            }
            $referenceDate = Carbon::parse($topLevelWs ?? now());
            $weeklyOffMap = $weeklyOffService->buildWeeklyOffMap($validEmployeesCollection, $referenceDate);

            // Pre-fetch approved leaves for these employees during the target week range
            $minDate = $referenceDate->copy()->startOfWeek(Carbon::MONDAY)->toDateString();
            $maxDate = $referenceDate->copy()->endOfWeek(Carbon::SUNDAY)->toDateString();

            $approvedLeaves = \App\Models\LeaveRequest::with('leaveType')
                ->whereIn('employee_id', $validEmployeeIds)
                ->where('status', 'approved')
                ->where(function ($q) use ($minDate, $maxDate) {
                    $q->whereBetween('start_date', [$minDate, $maxDate])
                      ->orWhereBetween('end_date', [$minDate, $maxDate])
                      ->orWhere(function ($sub) use ($minDate, $maxDate) {
                          $sub->where('start_date', '<=', $minDate)
                              ->where('end_date', '>=', $maxDate);
                      });
                })
                ->get();

            $leavesMap = $approvedLeaves->groupBy('employee_id');

            // Day-offset map for computing actual dates
            $dayOffsets = ['Monday' => 0, 'Tuesday' => 1, 'Wednesday' => 2, 'Thursday' => 3,
                           'Friday' => 4, 'Saturday' => 5, 'Sunday' => 6];

            // Cache Carbon instances for distinct week_starts to avoid thousands of Carbon::parse() calls
            $wsCarbonCache = [];

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

                if (!isset($wsCarbonCache[$ws])) {
                    $wsCarbonCache[$ws] = Carbon::parse($ws)->startOfWeek(Carbon::MONDAY);
                }
                $normalizedWs = $wsCarbonCache[$ws]->toDateString();

                $dayOffset = $dayOffsets[$entry['day']] ?? 0;
                $actualDate = $wsCarbonCache[$ws]->copy()->addDays($dayOffset);
                $actualDateStr = $actualDate->toDateString();

                // Check if employee has an approved leave on this date
                $empLeaves = $leavesMap->get($entry['employee_id'], collect());
                $matchingLeave = $empLeaves->first(function ($leave) use ($actualDateStr) {
                    $s = is_string($leave->start_date) ? substr($leave->start_date, 0, 10) : $leave->start_date->toDateString();
                    $e = is_string($leave->end_date) ? substr($leave->end_date, 0, 10) : $leave->end_date->toDateString();
                    return $actualDateStr >= $s && $actualDateStr <= $e;
                });

                // Check if this day is a weekly off for the employee
                $isWeeklyOff = $weeklyOffService->isWeeklyOffFromMap($entry['employee_id'], $actualDate, $weeklyOffMap);

                // Auto-sync shift details: Leave takes highest priority, followed by Weekly Off
                if ($matchingLeave) {
                    $leaveName = $matchingLeave->leaveType->name ?? 'Leave';
                    $time = 'On Leave';
                    $shiftType = 'Leave';
                    $notes = 'Approved ' . $leaveName;
                } elseif ($isWeeklyOff) {
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
                    'week_start' => $normalizedWs,
                    'day' => $entry['day'],
                    'shift_time' => $time,
                    'shift_type' => $shiftType,
                    'designation' => !empty($entry['designation']) ? trim($entry['designation']) : null,
                    'notes' => $notes,
                    'status' => 'pending',
                    'approved_by' => null,
                    'approved_at' => null,
                    'rejection_reason' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (!empty($upsertData)) {
                // Chunk in batches of 500 to prevent MySQL parameter limits, packet drops, and memory pressure
                collect($upsertData)->chunk(500)->each(function ($chunk) {
                    ShiftRoster::upsert(
                        $chunk->all(),
                        ['employee_id', 'week_start', 'day'],
                        ['shift_time', 'shift_type', 'designation', 'notes', 'company_id', 'status', 'approved_by', 'approved_at', 'rejection_reason', 'updated_at']
                    );
                });

                $updatedCount = count($upsertData);
            }

            DB::commit();

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
