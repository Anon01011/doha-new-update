<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\Employee;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Carbon\Carbon;

class LeaveRequestController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');
        $search = $request->query('search');

        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('view-leave-requests')) {
            // Default behavior for employees is to see their own requests
        }

        $query = LeaveRequest::with(['employee', 'leaveType']);

        // Role-based filtering (additional to global scope)
        if ($user->isEmployee() && $user->employee_id) {
            // Employees/Managers should see their own requests AND requests waiting for their approval
            $query->where(function ($q) use ($user) {
                $q->where('employee_id', $user->employee_id)
                    ->orWhere(function ($q2) use ($user) {
                        $q2->where('manager_id', $user->employee_id)
                            ->where('manager_approval_status', 'pending');
                    });
            });
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('reason', 'like', "%{$search}%")
                    ->orWhereHas('employee', function ($emp) use ($search) {
                        $emp->where('name', 'like', "%{$search}%")
                            ->orWhere('employee_code', 'like', "%{$search}%");
                    })
                    ->orWhereHas('leaveType', function ($lt) use ($search) {
                        $lt->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        $leaveRequests = $query->latest()->paginate(10)->withQueryString();

        // Get leave balances for employee
        $leaveBalances = [];
        $empId = $user->employee_id ?: ($user->employee ? $user->employee->id : null);
        if ($empId) {
            $employee = $user->employee ?: \App\Models\Employee::withoutGlobalScopes()->find($empId);
            if ($employee) {
                $leaveBalances = \App\Services\LeaveBalanceService::getOrSyncBalancesForEmployee($employee, (int) now()->year);
            }
        }

        return Inertia::render('Leave/Index', [
            'leaveRequests' => $leaveRequests,
            'leaveBalances' => $leaveBalances,
            'status' => $status,
            'search' => $search,
            'userRole' => $user->role,
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('create-leave-requests')) {
            // Employees can usually create for themselves, so we check permission or role
        }

        $leaveTypes = LeaveType::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'max_days_per_year', 'min_notice_days', 'requires_approval', 'requires_attachment', 'is_paid', 'carry_forward_allowed']);

        // Role-based employee selection (Global scope handles branch isolation)
        if ($user->isEmployee() && $user->employee_id) {
            $employees = Employee::where('id', $user->employee_id)->get(['id', 'name', 'employee_code']);
        } else {
            $employees = Employee::orderBy('name')->get(['id', 'name', 'employee_code']);
        }

        $companyId = $user->company_id ?: ($user->employee_id ? $user->employee->company_id : null);
        $settings = [
            'min_notice_period'       => Setting::get('minimum_notice_period', 0, $companyId),
            'enable_leave_attachment' => (bool) Setting::get('enable_leave_attachment', false, $companyId),
            'attachment_max_size_mb'  => (int) Setting::get('attachment_max_size_mb', 5, $companyId),
            'attachment_allowed_types'=> Setting::get('attachment_allowed_types', 'pdf,jpg,jpeg,png,doc,docx', $companyId),
        ];

        return Inertia::render('Leave/Create', [
            'employees'  => $employees,
            'leaveTypes' => $leaveTypes,
            'userRole'   => $user->role,
            'settings'   => $settings,
        ]);
    }

    /**
     * A tenant scoped `exists` rule for employee references.
     *
     * SECURITY (MED-07): the built-in `exists:employees,id` rule queries the
     * table directly and therefore IGNORES the BelongsToCompany global scope.
     * A forged id of an employee belonging to another tenant passed validation
     * and was then written into the new leave request. This rule adds the
     * `company_id` predicate so a foreign employee id fails validation.
     *
     * @param  \App\Models\User  $user
     * @return \Illuminate\Validation\Rules\Exists
     */
    private function employeeExistsRule($user): \Illuminate\Validation\Rules\Exists
    {
        return Rule::exists('employees', 'id')->where(function ($query) use ($user) {
            // Admins are superusers across tenants - no restriction, exactly
            // like the BelongsToCompany scope.
            if ($user->isAdmin()) {
                return;
            }

            $companyId = $this->companyIdFor($user);

            if ($companyId === null) {
                // A non-admin without any tenant context may not reference any
                // employee. Deny by default rather than allow everything.
                $query->whereRaw('1 = 0');

                return;
            }

            $query->where('company_id', $companyId);
        });
    }

    /**
     * The company the authenticated user acts for.
     *
     * `company_id` is read from the user row first; the employee profile is
     * only consulted as a fallback. The lookup uses a raw DB query on purpose:
     * resolving the employee through the model would trigger the
     * BelongsToCompany scope, which is exactly what is being determined here.
     */
    private function companyIdFor($user): ?int
    {
        if (! empty($user->company_id)) {
            return (int) $user->company_id;
        }

        if (! empty($user->employee_id)) {
            $companyId = \Illuminate\Support\Facades\DB::table('employees')
                ->where('id', $user->employee_id)
                ->value('company_id');

            return $companyId === null ? null : (int) $companyId;
        }

        return null;
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $companyId = null;

        // Determine company for settings lookup (done after we know which employee)
        $validated = $request->validate([
            // SECURITY (MED-07): the plain `exists:employees,id` rule does NOT
            // honour the BelongsToCompany global scope, so it happily accepted
            // the id of an employee belonging to another tenant. The rule is
            // now tenant scoped, so a foreign employee id is rejected during
            // validation, before anything is written.
            'employee_id'  => ['nullable', $this->employeeExistsRule($user)],
            'employee_ids' => 'nullable|array',
            'employee_ids.*' => [$this->employeeExistsRule($user)],
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date'   => 'required|date',
            'end_date'     => 'required|date|after_or_equal:start_date',
            'reason'       => 'required|string|max:2000',
            'attachment'   => 'nullable|file|max:51200', // validated more precisely per-company below
        ]);

        $employeeIds = [];
        if (!empty($validated['employee_ids'])) {
            $employeeIds = $validated['employee_ids'];
        } elseif (!empty($validated['employee_id'])) {
            $employeeIds = [$validated['employee_id']];
        }

        // If user is employee, automatically use their own employee_id
        if (empty($employeeIds) && ($user->isEmployee() || (!$isAdminOrHR && !$canCreateForOthers))) {
            $empId = $user->employee_id ?: ($user->employee ? $user->employee->id : null);
            if ($empId) {
                $employeeIds = [$empId];
            }
        }

        if (empty($employeeIds)) {
            return back()->withErrors(['employee_id' => 'The employee field is required.'])->withInput();
        }

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);
        $isAdminOrHR = $user->isAdmin() || $user->isHR();

        // BUG FIX: the previous check rejected EVERY non-HR user, including
        // managers who legitimately create leave requests on behalf of their
        // team. The frontend already renders a multi-employee picker for
        // non-employees, so the backend and the UI disagreed and managers
        // always received a 403.
        //
        // The rule is now:
        //   * employees may only request for themselves;
        //   * managers (and anyone holding `create-leave-requests`) may request
        //     for other employees, but ONLY within their own tenant.
        // Tenant isolation itself is enforced by the scoped validation rule
        // above and by the scoped Employee lookup further down.
        $canCreateForOthers = $user->isManager() || $user->hasPermission('create-leave-requests');

        if (!$isAdminOrHR && !$canCreateForOthers) {
            if (count($employeeIds) > 1 || (int) $employeeIds[0] !== (int) $user->employee_id) {
                abort(403, 'You can only create leave requests for yourself.');
            }
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $createdRequestsCount = 0;

            // Resolve the notice period once for this leave type.
            // A non-null `min_notice_days` on the leave type overrides the
            // global company `minimum_notice_period` setting.
            $selectedLeaveType = LeaveType::find($validated['leave_type_id']);
            $leaveTypeNoticeDays = $selectedLeaveType?->min_notice_days;
            $leaveTypeName = $selectedLeaveType?->name;

            foreach ($employeeIds as $empId) {
                // SECURITY (MED-07): resolve the employee through the SCOPED
                // model. An employee of another tenant resolves to null and is
                // rejected here, so a forged id can never reach the write path.
                $employee = Employee::find($empId);

                if ($employee === null) {
                    throw new \Exception('The selected employee could not be found in your company.');
                }
                $companyId = $employee->company_id;


                // 1. Check Minimum Notice Period (Bypass for HR/Admin)
                if (!$isAdminOrHR) {
                    $minNoticeDays = $leaveTypeNoticeDays !== null
                        ? (int) $leaveTypeNoticeDays
                        : (int) Setting::get(
                            'minimum_notice_period',
                            0,
                            $companyId
                        );

                    if ($minNoticeDays > 0) {
                        $noticeDate = now()->addDays($minNoticeDays);

                        if ($startDate->lt($noticeDate)) {
                            $typeLabel = $leaveTypeName ? " for {$leaveTypeName}" : '';
                            throw new \Exception(
                                "Leave{$typeLabel} must be requested at least {$minNoticeDays} day(s) in advance for {$employee->name}."
                            );
                        }
                    }
                }


                // 2. Check Probation Eligibility (Bypass for HR/Admin)
                if (!$isAdminOrHR) {
                    $probationAllowed = Setting::get('probation_leave_eligibility', true, $companyId);
                    if (!$probationAllowed && $employee->joined_date) {
                        $probationPeriod = 3; // Default 3 months
                        $probationEndDate = \Carbon\Carbon::parse($employee->joined_date)->copy()->addMonths($probationPeriod);
                        if (now()->lt($probationEndDate)) {
                            throw new \Exception("Leave is not allowed during the probation period for {$employee->name} (until {$probationEndDate->format('Y-m-d')}).");
                        }
                    }
                }

                // Calculate days excluding holidays
                $daysRequested = 0;
                $currentDate = $startDate->copy();
                
                $holidayRecords = \App\Models\Holiday::where('company_id', $companyId)
                    ->where(function ($q) use ($startDate, $endDate) {
                        $q->where(function ($q2) use ($startDate, $endDate) {
                            $q2->where('start_date', '>=', $startDate)->where('start_date', '<=', $endDate);
                        })->orWhere(function ($q2) use ($startDate, $endDate) {
                            $q2->where('end_date', '>=', $startDate)->where('end_date', '<=', $endDate);
                        })->orWhere(function ($q2) use ($startDate, $endDate) {
                            $q2->where('start_date', '<=', $startDate)->where('end_date', '>=', $endDate);
                        });
                    })->get();

                $holidayDates = [];
                foreach ($holidayRecords as $holiday) {
                    $hCurrent = \Carbon\Carbon::parse($holiday->start_date);
                    $hEnd = \Carbon\Carbon::parse($holiday->end_date);
                    while ($hCurrent->lte($hEnd)) {
                        $holidayDates[] = $hCurrent->toDateString();
                        $hCurrent->addDay();
                    }
                }
                $holidays = array_unique($holidayDates);

                while ($currentDate->lte($endDate)) {
                    if (!in_array($currentDate->toDateString(), $holidays)) {
                        $daysRequested++;
                    }
                    $currentDate->addDay();
                }

                // Check max consecutive days
                $maxConsecutive = Setting::get('max_consecutive_days', 0, $companyId);
                if ($maxConsecutive > 0 && $daysRequested > $maxConsecutive) {
                    throw new \Exception("Leave request for {$employee->name} exceeds maximum consecutive days allowed ({$maxConsecutive} days).");
                }

                // Check for overlapping leave requests (excluding rejected ones)
                $overlapping = LeaveRequest::where('employee_id', $empId)
                    ->where('status', '!=', 'rejected')
                    ->where(function ($q) use ($startDate, $endDate) {
                        $q->where(function ($q2) use ($startDate, $endDate) {
                            $q2->where('start_date', '>=', $startDate)
                                ->where('start_date', '<=', $endDate);
                        })->orWhere(function ($q2) use ($startDate, $endDate) {
                            $q2->where('end_date', '>=', $startDate)
                                ->where('end_date', '<=', $endDate);
                        })->orWhere(function ($q2) use ($startDate, $endDate) {
                            $q2->where('start_date', '<=', $startDate)
                                ->where('end_date', '>=', $endDate);
                        });
                    })
                    ->exists();

                if ($overlapping) {
                    throw new \Exception("There is an overlapping leave request for {$employee->name} during this period.");
                }

                // Check and sync leave balance
                $year = $startDate->year;
                $leaveType = LeaveType::withoutGlobalScopes()->find($validated['leave_type_id']);
                $balance = \App\Services\LeaveBalanceService::syncBalanceForType($employee, $leaveType, $year);
                $availableDays = $balance ? (float) $balance->remaining_days : (float) ($leaveType->max_days_per_year ?? 0);

                // 3. Check Negative Balance Allowed (Bypass for HR/Admin)
                $negativeAllowed = Setting::get('negative_balance_allowed', false, $companyId);
                if (!$isAdminOrHR && !$negativeAllowed && $availableDays < $daysRequested) {
                    throw new \Exception("Insufficient leave balance for {$employee->name}. Available: {$availableDays} days, Requested: {$daysRequested} days.");
                }

                // Check attachment requirement
                $leaveType = LeaveType::find($validated['leave_type_id']);
                $enableAttachment = (bool) Setting::get('enable_leave_attachment', false, $companyId);
                if ($enableAttachment && $leaveType && $leaveType->requires_attachment && !$request->hasFile('attachment')) {
                    throw new \Exception("A supporting document is required for {$employee->name}'s {$leaveType->name} leave request.");
                }

                // Prepare request data
                $requestData = [
                    'employee_id'          => $empId,
                    'leave_type_id'        => $validated['leave_type_id'],
                    'start_date'           => $validated['start_date'],
                    'end_date'             => $validated['end_date'],
                    'reason'               => $validated['reason'],
                    'days_requested'       => $daysRequested,
                    'company_id'           => $companyId,
                    'status'               => $isAdminOrHR ? 'approved' : 'pending',
                    'hr_approval_status'   => $isAdminOrHR ? 'approved' : 'pending',
                ];

                // Handle file upload
                if ($enableAttachment && $request->hasFile('attachment')) {
                    $maxSizeMb  = (int) Setting::get('attachment_max_size_mb', 5, $companyId);
                    $allowedRaw = Setting::get('attachment_allowed_types', 'pdf,jpg,jpeg,png,doc,docx', $companyId);
                    $allowedExt = array_map('trim', explode(',', strtolower($allowedRaw)));
                    $file       = $request->file('attachment');
                    $ext        = strtolower($file->getClientOriginalExtension());

                    if ($file->getSize() > $maxSizeMb * 1024 * 1024) {
                        throw new \Exception("Attachment exceeds the maximum allowed size of {$maxSizeMb}MB.");
                    }
                    if (!in_array($ext, $allowedExt)) {
                        throw new \Exception("Attachment type '.{$ext}' is not allowed. Allowed: " . implode(', ', $allowedExt));
                    }

                    $path = $file->store('leave-attachments', 'public');
                    $requestData['attachment']               = $path;
                    $requestData['attachment_original_name'] = $file->getClientOriginalName();
                }

                if ($isAdminOrHR) {
                    $requestData['approved_by'] = auth()->id();
                    $requestData['approved_at'] = now();
                }

                // Set manager approval chain
                if ($employee->reports_to_id) {
                    $requestData['manager_approval_status'] = $isAdminOrHR ? 'approved' : 'pending';
                    $requestData['manager_id'] = $employee->reports_to_id;
                } else {
                    // No manager in chain — skip manager step
                    $requestData['manager_approval_status'] = 'approved';
                }

                $leaveRequest = LeaveRequest::create($requestData);
                $createdRequestsCount++;

                // If approved directly, update leave balance and create attendance
                if ($isAdminOrHR) {
                    $this->updateLeaveBalance($leaveRequest);
                    $this->createAttendanceFromLeave($leaveRequest);
                }

                // Notify Manager if exists
                if ($leaveRequest->manager_id && !$isAdminOrHR) {
                    $this->notifyEmployee($leaveRequest->manager_id, new \App\Notifications\LeaveRequested($leaveRequest, $employee->name));
                } elseif ($isAdminOrHR) {
                    // HR/Admin submitted on behalf of employee — notify employee
                    $this->notifyEmployee($leaveRequest->employee_id, new \App\Notifications\LeaveRequested($leaveRequest, $employee->name));
                }
            }

            \Illuminate\Support\Facades\DB::commit();

            $msg = $createdRequestsCount > 1 
                ? "{$createdRequestsCount} leave entries created successfully!" 
                : "Leave request submitted successfully!";

            return redirect()->route('leave-requests.index')->with('success', $msg);

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return back()->withErrors(['general' => $e->getMessage(), 'error' => $e->getMessage()])->with('error', $e->getMessage())->withInput();
        }
    }

    public function show(LeaveRequest $leaveRequest)
    {
        $user = auth()->user();
        if ($user->isEmployee() && $leaveRequest->employee_id != $user->employee_id && $leaveRequest->manager_id != $user->employee_id) {
            abort(403, 'Unauthorized access.');
        }

        // BelongsToCompany handles branch isolation for non-admins automatically.

        $leaveRequest->load(['employee', 'leaveType', 'approver', 'rejector']);

        return Inertia::render('Leave/Show', [
            'leaveRequest' => $leaveRequest,
            'userRole' => $user->role,
        ]);
    }

    public function edit(LeaveRequest $leaveRequest)
    {
        $user = auth()->user();
        if ($user->isEmployee()) {
            if ($leaveRequest->employee_id != $user->employee_id) {
                abort(403, 'Unauthorized access.');
            }
            if ($leaveRequest->status !== 'pending') {
                abort(403, 'You cannot edit a leave request that is already processed.');
            }
        }

        // BelongsToCompany handles branch isolation.

        $leaveRequest->load('employee');
        $employees = Employee::orderBy('name')->get(['id', 'name', 'employee_code']);
        $leaveTypes = LeaveType::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'max_days_per_year', 'min_notice_days', 'requires_approval', 'requires_attachment', 'is_paid', 'carry_forward_allowed']);

        $companyId = $user->company_id ?: ($user->employee_id && $user->employee ? $user->employee->company_id : null);
        $settings = [
            'min_notice_period'       => (int) Setting::get('minimum_notice_period', 0, $companyId),
            'enable_leave_attachment' => (bool) Setting::get('enable_leave_attachment', false, $companyId),
            'attachment_max_size_mb'  => (int) Setting::get('attachment_max_size_mb', 5, $companyId),
            'attachment_allowed_types'=> Setting::get('attachment_allowed_types', 'pdf,jpg,jpeg,png,doc,docx', $companyId),
        ];

        return Inertia::render('Leave/Edit', [
            'leaveRequest' => $leaveRequest,
            'employees'    => $employees,
            'leaveTypes'   => $leaveTypes,
            'userRole'     => $user->role,
            'settings'     => $settings,
        ]);
    }

    public function update(Request $request, LeaveRequest $leaveRequest)
    {
        $user = auth()->user();
        if ($user->isEmployee()) {
            if ($leaveRequest->employee_id != $user->employee_id) {
                abort(403, 'Unauthorized access.');
            }
            if ($leaveRequest->status !== 'pending') {
                abort(403, 'You cannot update a leave request that is already processed.');
            }
        }

        $validated = $request->validate([
            'employee_id'   => 'required|exists:employees,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date'    => 'required|date',
            'end_date'      => 'required|date|after_or_equal:start_date',
            'reason'        => 'required|string|max:2000',
            'attachment'    => 'nullable|file|max:51200',
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);

        // Minimum notice period check (Bypass for HR/Admin).
        // A non-null `min_notice_days` on the leave type overrides the global setting.
        // Only enforced when the start date is changed, so editing the reason or
        // attachment of an already-valid request is never retroactively blocked.
        $originalStartDate = Carbon::parse($leaveRequest->start_date)->toDateString();
        if (!$user->isAdmin() && !$user->isHR() && $startDate->toDateString() !== $originalStartDate) {
            $selectedLeaveType = LeaveType::find($validated['leave_type_id']);
            $employee = Employee::find($validated['employee_id']);
            $empCompanyId = $employee?->company_id;

            $minNoticeDays = $selectedLeaveType && $selectedLeaveType->min_notice_days !== null
                ? (int) $selectedLeaveType->min_notice_days
                : (int) Setting::get('minimum_notice_period', 0, $empCompanyId);

            if ($minNoticeDays > 0 && $startDate->lt(now()->addDays($minNoticeDays))) {
                $typeLabel = $selectedLeaveType?->name ? " for {$selectedLeaveType->name}" : '';
                return back()->withErrors([
                    'start_date' => "Leave{$typeLabel} must be requested at least {$minNoticeDays} day(s) in advance.",
                ])->withInput();
            }
        }

        // Calculate days excluding holidays
        $daysRequested = 0;
        $currentDate = $startDate->copy();

        $holidayRecords = \App\Models\Holiday::where(function ($q) use ($startDate, $endDate) {
            $q->where(function ($q2) use ($startDate, $endDate) {
                $q2->where('start_date', '>=', $startDate)->where('start_date', '<=', $endDate);
            })->orWhere(function ($q2) use ($startDate, $endDate) {
                $q2->where('end_date', '>=', $startDate)->where('end_date', '<=', $endDate);
            })->orWhere(function ($q2) use ($startDate, $endDate) {
                $q2->where('start_date', '<=', $startDate)->where('end_date', '>=', $endDate);
            });
        })->get();

        $holidayDates = [];
        foreach ($holidayRecords as $holiday) {
            $hCurrent = \Carbon\Carbon::parse($holiday->start_date);
            $hEnd = \Carbon\Carbon::parse($holiday->end_date);
            while ($hCurrent->lte($hEnd)) {
                $holidayDates[] = $hCurrent->toDateString();
                $hCurrent->addDay();
            }
        }
        $holidays = array_unique($holidayDates);

        while ($currentDate->lte($endDate)) {
            if (!in_array($currentDate->toDateString(), $holidays)) {
                $daysRequested++;
            }
            $currentDate->addDay();
        }

        $validated['days_requested'] = $daysRequested;

        // Handle attachment update
        $employee = Employee::find($validated['employee_id']);
        $companyId = $employee ? $employee->company_id : null;
        $enableAttachment = (bool) Setting::get('enable_leave_attachment', false, $companyId);
        if ($enableAttachment && $request->hasFile('attachment')) {
            $maxSizeMb  = (int) Setting::get('attachment_max_size_mb', 5, $companyId);
            $allowedRaw = Setting::get('attachment_allowed_types', 'pdf,jpg,jpeg,png,doc,docx', $companyId);
            $allowedExt = array_map('trim', explode(',', strtolower($allowedRaw)));
            $file       = $request->file('attachment');
            $ext        = strtolower($file->getClientOriginalExtension());

            if ($file->getSize() > $maxSizeMb * 1024 * 1024) {
                return back()->withErrors(['attachment' => "File exceeds the maximum allowed size of {$maxSizeMb}MB."])->withInput();
            }
            if (!in_array($ext, $allowedExt)) {
                return back()->withErrors(['attachment' => "File type '.{$ext}' not allowed. Allowed: " . implode(', ', $allowedExt)])->withInput();
            }

            // Delete old attachment
            if ($leaveRequest->attachment) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($leaveRequest->attachment);
            }

            $path = $file->store('leave-attachments', 'public');
            $validated['attachment']               = $path;
            $validated['attachment_original_name'] = $file->getClientOriginalName();
        }

        $leaveRequest->update($validated);

        return redirect()->route('leave-requests.show', $leaveRequest)->with('success', 'Leave request updated successfully!');
    }

    public function destroy(LeaveRequest $leaveRequest)
    {
        $user = auth()->user();

        if ($user->isEmployee()) {
            if ($leaveRequest->employee_id != $user->employee_id) {
                abort(403, 'Unauthorized access.');
            }
            if (!in_array($leaveRequest->status, ['pending', 'rejected'])) {
                abort(403, 'You cannot delete a leave request that has been processed. Please use Cancel instead.');
            }
        } elseif (!$user->isAdmin() && !$user->isHR()) {
            // Managers can only delete if global scope allows it (same company)
            if (!$user->hasPermission('approve-leave-requests')) {
                abort(403, 'Unauthorized.');
            }
        }

        // If it was already approved, we need to restore the balance and remove attendance records
        if ($leaveRequest->status === 'approved') {
            $this->restoreLeaveBalance($leaveRequest);
            $this->removeAttendanceRecords($leaveRequest);
        }

        $leaveRequest->delete();
        return redirect()->route('leave-requests.index')->with('success', 'Leave request deleted successfully!');
    }

    public function cancel(LeaveRequest $leaveRequest)
    {
        $user = auth()->user();

        // Only the owner can cancel
        if ($leaveRequest->employee_id != $user->employee_id) {
            abort(403, 'Unauthorized.');
        }

        // Can only cancel approved leaves that are in the future
        if ($leaveRequest->status !== 'approved') {
            return back()->with('error', 'Only approved leaves can be cancelled.');
        }

        $startDate = Carbon::parse($leaveRequest->start_date);
        if ($startDate->isPast()) {
            return back()->with('error', 'Cannot cancel a leave that has already started.');
        }

        // Restore balance and remove attendance
        $this->restoreLeaveBalance($leaveRequest);
        $this->removeAttendanceRecords($leaveRequest);

        $leaveRequest->update([
            'status' => 'cancelled',
            'manager_approval_status' => 'cancelled',
            'hr_approval_status' => 'cancelled',
        ]);

        return redirect()->route('leave-requests.index')->with('success', 'Leave request cancelled successfully!');
    }

    private function restoreLeaveBalance(LeaveRequest $leaveRequest)
    {
        $year = Carbon::parse($leaveRequest->start_date)->year;
        $balance = \App\Models\LeaveBalance::where('employee_id', $leaveRequest->employee_id)
            ->where('leave_type_id', $leaveRequest->leave_type_id)
            ->where('year', $year)
            ->first();

        if ($balance) {
            $balance->used_days = max(0, $balance->used_days - $leaveRequest->days_requested);
            $balance->remaining_days = $balance->total_days - $balance->used_days;
            $balance->save();
        }
    }

    private function removeAttendanceRecords(LeaveRequest $leaveRequest)
    {
        \App\Models\EmployeeAttendance::where('employee_id', $leaveRequest->employee_id)
            ->whereBetween('date', [$leaveRequest->start_date, $leaveRequest->end_date])
            ->where('attendance', 'Leave')
            ->delete();
    }

    public function approve(Request $request, LeaveRequest $leaveRequest)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('approve-leave-requests')) {
            abort(403, 'Unauthorized. You do not have permission to approve leave requests.');
        }

        $employee = $leaveRequest->employee;

        $remarks = $request->input('remarks') ?? $request->input('approval_remarks');

        // If current user is the manager (and request is pending manager approval)
        if ($user->employee_id == $leaveRequest->manager_id && $leaveRequest->manager_approval_status === 'pending') {
            $leaveRequest->update([
                'manager_approval_status' => 'approved',
                'manager_approved_at' => now(),
                'approval_remarks' => $remarks,
            ]);

            // If now approved by manager, it goes to HR (status remains pending overall, but HR status is pending)
            $this->notifyEmployee($leaveRequest->employee_id, new \App\Notifications\LeaveStatusUpdated($leaveRequest, 'approved by Manager', 'Your leave request has been approved by your manager and is now awaiting HR approval.'));

            return redirect()->back()->with('success', 'Leave request approved! Awaiting HR approval.');
        }

        // If current user is HR/Admin (and manager has approved or no manager)
        if (in_array($user->role, ['admin', 'hr'])) {
            $leaveRequest->update([
                'status' => 'approved',
                'hr_approval_status' => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
                'approval_remarks' => $remarks,
            ]);

            // Update leave balance
            $this->updateLeaveBalance($leaveRequest);

            // Create attendance records for the leave duration
            $this->createAttendanceFromLeave($leaveRequest);

            $this->notifyEmployee($leaveRequest->employee_id, new \App\Notifications\LeaveStatusUpdated($leaveRequest, 'approved'));

            return redirect()->back()->with('success', 'Leave request fully approved!');
        }

        return redirect()->back()->with('error', 'You are not authorized to approve this request at this stage.');
    }

    public function bulkApprove(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('approve-leave-requests') && !$user->hasPermission('manage-leaves')) {
            abort(403, 'Unauthorized. You do not have permission to approve leave requests.');
        }

        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:leave_requests,id',
        ]);

        $approvedCount = 0;
        $managerApprovedCount = 0;

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            foreach ($validated['ids'] as $id) {
                $leaveRequest = LeaveRequest::findOrFail($id);

                // Check if user is the manager and the request is pending manager approval
                if ($user->employee_id == $leaveRequest->manager_id && $leaveRequest->manager_approval_status === 'pending') {
                    $leaveRequest->update([
                        'manager_approval_status' => 'approved',
                        'manager_approved_at' => now(),
                    ]);
                    $this->notifyEmployee($leaveRequest->employee_id, new \App\Notifications\LeaveStatusUpdated($leaveRequest, 'approved by Manager', 'Your leave request has been approved by your manager and is now awaiting HR approval.'));
                    $managerApprovedCount++;
                }
                // Check if user is HR/Admin
                elseif (in_array($user->role, ['admin', 'hr'])) {
                    if ($leaveRequest->status !== 'approved') {
                        $leaveRequest->update([
                            'status' => 'approved',
                            'hr_approval_status' => 'approved',
                            'approved_by' => auth()->id(),
                            'approved_at' => now(),
                        ]);

                        // Update leave balance
                        $this->updateLeaveBalance($leaveRequest);

                        // Create attendance records
                        $this->createAttendanceFromLeave($leaveRequest);

                        $this->notifyEmployee($leaveRequest->employee_id, new \App\Notifications\LeaveStatusUpdated($leaveRequest, 'approved'));
                        $approvedCount++;
                    }
                }
            }

            \Illuminate\Support\Facades\DB::commit();

            $msg = '';
            if ($approvedCount > 0) {
                $msg .= "{$approvedCount} leave request(s) fully approved. ";
            }
            if ($managerApprovedCount > 0) {
                $msg .= "{$managerApprovedCount} leave request(s) approved by manager and sent to HR.";
            }

            if (empty($msg)) {
                $msg = 'No leave requests were modified.';
            }

            return redirect()->back()->with('success', trim($msg));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return redirect()->back()->with('error', 'Failed to approve leave requests: ' . $e->getMessage());
        }
    }

    public function bulkReject(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('reject-leave-requests') && !$user->hasPermission('manage-leaves')) {
            abort(403, 'Unauthorized. You do not have permission to reject leave requests.');
        }

        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:leave_requests,id',
            'rejection_reason' => 'required|string',
        ]);

        $rejectedCount = 0;
        $managerRejectedCount = 0;

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            foreach ($validated['ids'] as $id) {
                $leaveRequest = LeaveRequest::findOrFail($id);

                // Check if user is manager and pending manager approval
                if ($user->employee_id == $leaveRequest->manager_id && $leaveRequest->manager_approval_status === 'pending') {
                    $leaveRequest->update([
                        'status' => 'rejected',
                        'manager_approval_status' => 'rejected',
                        'rejection_reason_manager' => $validated['rejection_reason'],
                        'rejected_by' => auth()->id(),
                        'rejected_at' => now(),
                    ]);
                    $this->notifyEmployee($leaveRequest->employee_id, new \App\Notifications\LeaveStatusUpdated($leaveRequest, 'rejected', "Your leave request has been rejected. Reason: " . $validated['rejection_reason']));
                    $managerRejectedCount++;
                }
                // Check if user is HR/Admin
                elseif (in_array($user->role, ['admin', 'hr'])) {
                    $leaveRequest->update([
                        'status' => 'rejected',
                        'hr_approval_status' => 'rejected',
                        'rejection_reason_hr' => $validated['rejection_reason'],
                        'rejected_by' => auth()->id(),
                        'rejected_at' => now(),
                        'rejection_reason' => $validated['rejection_reason'],
                    ]);
                    $this->notifyEmployee($leaveRequest->employee_id, new \App\Notifications\LeaveStatusUpdated($leaveRequest, 'rejected', "Your leave request has been rejected. Reason: " . $validated['rejection_reason']));
                    $rejectedCount++;
                }
            }

            \Illuminate\Support\Facades\DB::commit();

            $msg = '';
            if ($rejectedCount > 0 || $managerRejectedCount > 0) {
                $msg = ($rejectedCount + $managerRejectedCount) . " leave request(s) rejected successfully.";
            } else {
                $msg = 'No leave requests were modified.';
            }

            return redirect()->back()->with('success', $msg);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return redirect()->back()->with('error', 'Failed to reject leave requests: ' . $e->getMessage());
        }
    }

    public function reject(Request $request, LeaveRequest $leaveRequest)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('reject-leave-requests')) {
            abort(403, 'Unauthorized. You do not have permission to reject leave requests.');
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        if ($user->employee_id == $leaveRequest->manager_id && $leaveRequest->manager_approval_status === 'pending') {
            $leaveRequest->update([
                'status' => 'rejected',
                'manager_approval_status' => 'rejected',
                'rejection_reason_manager' => $validated['rejection_reason'],
                'rejected_by' => auth()->id(),
                'rejected_at' => now(),
            ]);
        } elseif (in_array($user->role, ['admin', 'hr'])) {
            $leaveRequest->update([
                'status' => 'rejected',
                'hr_approval_status' => 'rejected',
                'rejection_reason_hr' => $validated['rejection_reason'],
                'rejected_by' => auth()->id(),
                'rejected_at' => now(),
                'rejection_reason' => $validated['rejection_reason'], // Keep generic reason for backward compatibility
            ]);
        } else {
            return redirect()->back()->with('error', 'You are not authorized to reject this request.');
        }

        $this->notifyEmployee($leaveRequest->employee_id, new \App\Notifications\LeaveStatusUpdated($leaveRequest, 'rejected', "Your leave request has been rejected. Reason: " . $validated['rejection_reason']));

        return redirect()->back()->with('success', 'Leave request rejected!');
    }

    public function updateLeaveBalance(LeaveRequest $leaveRequest)
    {
        if ($leaveRequest->employee && $leaveRequest->leaveType) {
            $year = Carbon::parse($leaveRequest->start_date)->year;
            \App\Services\LeaveBalanceService::syncBalanceForType($leaveRequest->employee, $leaveRequest->leaveType, $year);
        }
    }

    /**
     * Create attendance records for the approved leave duration.
     */
    private function createAttendanceFromLeave(LeaveRequest $leaveRequest)
    {
        $startDate = Carbon::parse($leaveRequest->start_date);
        $endDate = Carbon::parse($leaveRequest->end_date);
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            // Skip if it's a holiday for this company
            $isHoliday = \App\Models\Holiday::where('start_date', '<=', $currentDate->toDateString())
                ->where('end_date', '>=', $currentDate->toDateString())
                ->where('company_id', $leaveRequest->employee->company_id)
                ->exists();

            if (!$isHoliday) {
                \App\Models\EmployeeAttendance::updateOrCreate([
                    'employee_id' => $leaveRequest->employee_id,
                    'date' => $currentDate->toDateString(),
                ], [
                    'company_id' => $leaveRequest->employee->company_id,
                    'attendance' => 'Leave',
                    'is_paid' => $leaveRequest->leaveType->is_paid ?? false,
                    'reason' => ($leaveRequest->leaveType->name ?? 'Leave') . ': ' . $leaveRequest->reason,
                    'hours_worked' => 0,
                    'normal_hours' => 0,
                    'ot' => 0,
                    'ot_amt' => 0,
                ]);
            }
            $currentDate->addDay();
        }
    }
    /**
     * Helper to notify employee
     */
    private function notifyEmployee($employeeId, $notification)
    {
        $employee = Employee::find($employeeId);
        if ($employee && $employee->user) {
            try {
                $employee->user->notify($notification);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Notification failed: ' . $e->getMessage());
            }
        }
    }
}
