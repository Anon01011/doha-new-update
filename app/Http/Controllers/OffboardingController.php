<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\OffboardingRequest;
use App\Models\OffboardingTask;
use App\Models\OffboardingExitInterview;
use App\Models\Company;
use App\Models\Department;
use App\Models\LeaveBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\Setting;
use App\Services\NotificationService;
use App\Notifications\OffboardingNotification;
use App\Mail\RelievingCertificateMail;
use Illuminate\Support\Facades\Mail;

class OffboardingController extends Controller
{
    // ─── Index ───────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $user       = Auth::user();
        $status     = $request->query('status', '');
        $reason     = $request->query('reason', '');
        $company    = $request->query('company_id', $request->query('company', ''));
        $department = $request->query('department_id', $request->query('department', ''));
        $search     = $request->query('search', '');
        $month      = $request->query('month', '');
        $year       = $request->query('year', now()->year);

        $query = OffboardingRequest::with([
            'employee.company',
            'employee.department',
            'initiator',
            'tasks',
            'exitInterview',
        ]);

        $isEmployeeOnly = $user->isEmployee() && !$user->isAdmin() && !$user->isHR() && !$user->hasPermission('approve-offboarding');

        // Scope queries: employees see their own; HR/managers see their company; Admins see all
        if ($isEmployeeOnly && $user->employee_id) {
            $query->where('employee_id', $user->employee_id);
        } elseif ($user->role !== 'admin' && $user->employee_id) {
            $query->byCompany($user->employee->company_id);
        } elseif ($company) {
            $query->byCompany($company);
        }

        if ($department) {
            $query->whereHas('employee', fn($q) => $q->where('department_id', $department));
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($reason) {
            $query->where('separation_reason', $reason);
        }

        if ($search) {
            $query->whereHas('employee', fn($q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('employee_code', 'like', "%{$search}%"));
        }

        if ($year) {
            $query->whereYear('proposed_last_working_day', $year);
        }

        if ($month) {
            $query->whereMonth('proposed_last_working_day', $month);
        }

        $requests = $query->latest()->paginate(20)->withQueryString();

        // KPI summary
        $base = OffboardingRequest::when($isEmployeeOnly && $user->employee_id, fn($q) =>
            $q->where('employee_id', $user->employee_id)
        )->when(!$isEmployeeOnly && $user->role !== 'admin' && $user->employee_id, fn($q) =>
            $q->byCompany($user->employee->company_id)
        );

        $summary = [
            'total'             => (clone $base)->count(),
            'pending_approval'  => (clone $base)->where('status', 'pending_approval')->count(),
            'in_progress'       => (clone $base)->whereIn('status', ['approved', 'in_progress', 'clearance_pending', 'exit_interview_pending', 'settlement_pending'])->count(),
            'completed_month'   => (clone $base)->where('status', 'completed')->whereMonth('completed_at', now()->month)->count(),
            'upcoming_30'       => (clone $base)->upcoming(30)->count(),
        ];

        $companies = $user->role === 'admin'
            ? Company::orderBy('name')->get(['id', 'name'])
            : collect();

        $departments = Department::orderBy('name')->get(['id', 'name', 'company_id']);

        return Inertia::render('Offboarding/Index', [
            'requests'    => $requests,
            'summary'     => $summary,
            'companies'   => $companies,
            'departments' => $departments,
            'filters'     => [
                'status'        => $status,
                'reason'        => $reason,
                'company'       => $company,
                'company_id'    => $company,
                'department'    => $department,
                'department_id' => $department,
                'search'        => $search,
                'month'         => $month,
                'year'          => $year,
            ],
        ]);
    }

    // ─── Create ──────────────────────────────────────────────────────────────────

    public function create(Request $request)
    {
        $user = Auth::user();
        $employeeId = $request->query('employee_id');
        $userRole = $user->role ?? 'employee';
        $isManagementRole = in_array($userRole, ['admin', 'hr', 'manager']);

        $currentEmployee = null;
        if ($user->employee_id) {
            $currentEmployee = Employee::with(['company', 'department'])->find($user->employee_id);
        }
        if (!$currentEmployee && $user->email) {
            $currentEmployee = Employee::with(['company', 'department'])->where('email', $user->email)->first();
        }

        if (!$isManagementRole && $currentEmployee) {
            // Employee submitting their own resignation/offboarding
            $preselected = $currentEmployee;
            $employees = collect([$currentEmployee]);
            $companies = collect();
            $departments = collect();
        } else {
            // Admin, HR, or Manager
            $employeesQuery = Employee::active()
                ->with('company', 'department')
                ->orderBy('name');

            if ($userRole !== 'admin' && $user->employee_id) {
                $employeesQuery->where('company_id', $user->employee->company_id);
            }

            $employees = $employeesQuery->get(['id', 'name', 'employee_code', 'company_id', 'department_id', 'designation', 'joined_date', 'employee_image']);
            $preselected = $employeeId 
                ? Employee::with('company', 'department')->find($employeeId) 
                : ($isManagementRole ? null : $currentEmployee);

            $companies = Company::orderBy('name')->get(['id', 'name']);
            $departments = Department::orderBy('name')->get(['id', 'name', 'company_id']);
        }

        return Inertia::render('Offboarding/Create', [
            'employees'        => $employees,
            'preselected'      => $preselected,
            'currentEmployee'  => $currentEmployee,
            'userRole'         => $userRole,
            'companies'        => $companies,
            'departments'      => $departments,
        ]);
    }

    // ─── Store ───────────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $user = Auth::user();
        $userRole = $user->role ?? 'employee';
        $isManagementRole = in_array($userRole, ['admin', 'hr', 'manager']);

        $validated = $request->validate([
            'employee_id'             => [$isManagementRole ? 'required' : 'nullable', 'exists:employees,id'],
            'separation_reason'       => ['required', 'in:resignation,retirement,termination,contract_completion,redundancy,mutual_separation,absconding,other'],
            'proposed_last_working_day' => ['required', 'date', 'after_or_equal:today'],
            'notice_pay_applicable'   => ['boolean'],
            'notice_pay_amount'       => ['nullable', 'numeric', 'min:0'],
            'remarks'                 => ['nullable', 'string', 'max:2000'],
            'supporting_document'     => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:5120'],
        ]);

        // If employee role, ensure request is strictly for themselves
        if (!$isManagementRole) {
            $currentEmpId = $user->employee_id ?: Employee::where('email', $user->email)->value('id');
            if (!$currentEmpId) {
                return back()->withErrors(['employee_id' => 'No employee profile linked to your account. Please contact HR.']);
            }
            $validated['employee_id'] = $currentEmpId;
            $validated['notice_pay_applicable'] = false;
            $validated['notice_pay_amount'] = null;
        }

        // Check no active offboarding for this employee
        $existing = OffboardingRequest::where('employee_id', $validated['employee_id'])
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->first();

        if ($existing) {
            return back()->withErrors(['employee_id' => 'This employee already has an active offboarding request.']);
        }

        $docPath = null;
        if ($request->hasFile('supporting_document')) {
            $docPath = $request->file('supporting_document')->store('offboarding/documents', 'public');
        }

        $employee = Employee::find($validated['employee_id']);
        $noticeDays = $employee && $employee->joined_date
            ? max(0, (int) Carbon::parse($validated['proposed_last_working_day'])->diffInDays(now(), false) * -1)
            : 0;

        $offboarding = OffboardingRequest::create([
            'employee_id'             => $validated['employee_id'],
            'initiated_by'            => Auth::id(),
            'separation_reason'       => $validated['separation_reason'],
            'proposed_last_working_day' => $validated['proposed_last_working_day'],
            'notice_period_days'      => max(0, (int) Carbon::parse($validated['proposed_last_working_day'])->diffInDays(now())),
            'notice_pay_applicable'   => $validated['notice_pay_applicable'] ?? false,
            'notice_pay_amount'       => $validated['notice_pay_amount'] ?? null,
            'remarks'                 => $validated['remarks'] ?? null,
            'supporting_document'     => $docPath,
            'status'                  => 'pending_approval',
        ]);

        if ($employee) {
            NotificationService::notifyApprovers(
                $employee->id,
                new OffboardingNotification(
                    $offboarding,
                    'Offboarding Request Submitted',
                    "Offboarding request for {$employee->name} has been submitted.",
                    'offboarding_submitted'
                )
            );
        }

        return redirect()->route('offboarding.show', $offboarding->request_number ?: $offboarding->id)
            ->with('success', 'Offboarding request submitted for approval.');
    }

    // ─── Show ────────────────────────────────────────────────────────────────────

    public function show(OffboardingRequest $offboarding)
    {
        $user = Auth::user();
        $userRole = $user->role ?? 'employee';
        $isManagementRole = in_array($userRole, ['admin', 'hr', 'manager']);

        // If employee role, ensure they can only view their own offboarding request
        $currentEmployeeId = $user->employee_id ?: Employee::where('email', $user->email)->value('id');

        if (!$isManagementRole && $currentEmployeeId && $offboarding->employee_id != $currentEmployeeId) {
            abort(403, 'Unauthorized access to this offboarding request.');
        }

        $offboarding->load([
            'employee.company',
            'employee.department',
            'employee.leaveBalances.leaveType',
            'initiator',
            'manager',
            'hrUser',
            'settlementApprover',
            'tasks.assignedUser',
            'exitInterview.conductor',
        ]);

        // Group tasks by role
        $tasksByRole = $offboarding->tasks->groupBy('assigned_role');

        // Leave balance summary for settlement preview
        $leaveBalances = LeaveBalance::where('employee_id', $offboarding->employee_id)
            ->with('leaveType')
            ->get();

        return Inertia::render('Offboarding/Show', [
            'offboarding'      => $offboarding,
            'tasksByRole'      => $tasksByRole,
            'leaveBalances'    => $leaveBalances,
            'userRole'         => $userRole,
            'isManagementRole' => $isManagementRole,
            'canApprove'       => $isManagementRole,
            'canSettle'        => in_array($userRole, ['admin', 'hr', 'payroll']),
        ]);
    }

    // ─── Edit ────────────────────────────────────────────────────────────────────

    public function edit(OffboardingRequest $offboarding)
    {
        $user = Auth::user();
        $userRole = $user->role ?? 'employee';
        $isManagementRole = in_array($userRole, ['admin', 'hr', 'manager']);

        $currentEmployeeId = $user->employee_id ?: Employee::where('email', $user->email)->value('id');

        if (!$isManagementRole && $currentEmployeeId && $offboarding->employee_id != $currentEmployeeId) {
            abort(403, 'Unauthorized to edit this offboarding request.');
        }

        if (!in_array($offboarding->status, ['draft', 'pending_approval'])) {
            return back()->withErrors(['error' => 'Only draft or pending requests can be edited.']);
        }

        $offboarding->load('employee.company', 'employee.department');

        return Inertia::render('Offboarding/Edit', [
            'offboarding'      => $offboarding,
            'userRole'         => $userRole,
            'isManagementRole' => $isManagementRole,
        ]);
    }

    // ─── Update ──────────────────────────────────────────────────────────────────

    public function update(Request $request, OffboardingRequest $offboarding)
    {
        $user = Auth::user();
        $userRole = $user->role ?? 'employee';
        $isManagementRole = in_array($userRole, ['admin', 'hr', 'manager']);

        $currentEmployeeId = $user->employee_id ?: Employee::where('email', $user->email)->value('id');

        if (!$isManagementRole && $currentEmployeeId && $offboarding->employee_id != $currentEmployeeId) {
            abort(403, 'Unauthorized to edit this offboarding request.');
        }

        if (!in_array($offboarding->status, ['draft', 'pending_approval'])) {
            return back()->withErrors(['error' => 'Only draft or pending requests can be edited.']);
        }

        $validated = $request->validate([
            'separation_reason'         => ['required', 'in:resignation,retirement,termination,contract_completion,redundancy,mutual_separation,absconding,other'],
            'proposed_last_working_day' => ['required', 'date', 'after_or_equal:today'],
            'notice_pay_applicable'     => ['boolean'],
            'notice_pay_amount'         => ['nullable', 'numeric', 'min:0'],
            'remarks'                   => ['nullable', 'string', 'max:2000'],
            'supporting_document'       => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:5120'],
        ]);

        if (!$isManagementRole) {
            unset($validated['notice_pay_applicable'], $validated['notice_pay_amount']);
        }

        if ($request->hasFile('supporting_document')) {
            if ($offboarding->supporting_document) {
                Storage::disk('public')->delete($offboarding->supporting_document);
            }
            $validated['supporting_document'] = $request->file('supporting_document')
                ->store('offboarding/documents', 'public');
        } else {
            unset($validated['supporting_document']);
        }

        $validated['notice_period_days'] = max(0, (int) Carbon::parse($validated['proposed_last_working_day'])->diffInDays(now()));

        $offboarding->update($validated);

        return redirect()->route('offboarding.show', $offboarding->request_number ?: $offboarding->id)
            ->with('success', 'Offboarding request updated successfully.');
    }

    /**
     * Assert that the acting user is allowed to manage offboarding records.
     *
     * A management role (admin / hr / manager) may manage any request, subject
     * to the branch check. A plain employee may only act on a request that
     * belongs to them.
     *
     * @param  \App\Models\User|null  $user
     * @param  \App\Models\OffboardingRequest|null  $offboarding
     */
    private function assertCanManageOffboarding($user, $offboarding = null): void
    {
        if (!$user) {
            abort(403, 'Unauthorized.');
        }

        $userRole = $user->role ?? 'employee';
        $isManagementRole = in_array($userRole, ['admin', 'hr', 'manager'])
            || $user->isAdmin() || $user->isHR() || $user->isManager();

        if ($isManagementRole) {
            // Management may only act inside their own company unless they are admin.
            if (!$user->isAdmin() && $offboarding && $user->employee_id && $user->employee) {
                $companyId = $user->employee->company_id;
                $targetCompanyId = $offboarding->employee?->company_id;
                if ($companyId && $targetCompanyId && (int) $companyId !== (int) $targetCompanyId) {
                    abort(403, 'Unauthorized branch access.');
                }
            }

            return;
        }

        // A plain employee may only manage their own request.
        if ($offboarding) {
            $currentEmployeeId = $user->employee_id ?: \App\Models\Employee::where('email', $user->email)->value('id');
            if (!$currentEmployeeId || (int) $offboarding->employee_id !== (int) $currentEmployeeId) {
                abort(403, 'Unauthorized access to this offboarding request.');
            }

            return;
        }

        abort(403, 'You are not authorized to perform this action.');
    }

    // ─── Approve ─────────────────────────────────────────────────────────────────
    public function approve(Request $request, OffboardingRequest $offboarding)
    {
        $user = Auth::user();
        $request->validate([
            'role'     => ['required', 'in:manager,hr'],
            'comments' => ['nullable', 'string', 'max:1000'],
        ]);

        // Only management roles may approve an offboarding request. Without this
        // guard any authenticated employee could approve (and record themselves
        // as the manager approver of) somebody else's offboarding.
        $this->assertCanManageOffboarding($user);

        // Separation of duties: the "manager" approval must be performed by a
        // manager, the "hr" approval by HR. An admin may act in either capacity.
        if ($request->role === 'manager' && !$user->isAdmin() && !$user->isManager()) {
            abort(403, 'Only a manager may record the manager approval.');
        }

        if ($request->role === 'hr' && !$user->isAdmin() && !$user->isHR()) {
            abort(403, 'Only HR may record the HR approval.');
        }

        // A request that has already been approved must not be approved again.
        if (in_array($offboarding->status, ['approved', 'in_progress', 'exit_interview_pending', 'settlement_pending', 'completed'], true)) {
            return back()->withErrors(['error' => 'This offboarding request has already been approved.']);
        }

        DB::transaction(function () use ($offboarding, $user, $request) {
            if ($request->role === 'manager') {
                $offboarding->update([
                    'manager_id'          => $user->id,
                    'manager_approved_at' => now(),
                ]);
            } else {
                $offboarding->update([
                    'hr_user_id'      => $user->id,
                    'hr_approved_at'  => now(),
                    'status'          => 'approved',
                ]);
                // Generate default checklist on HR approval
                if ($offboarding->tasks()->count() === 0) {
                    $offboarding->generateDefaultTasks();
                }
                $offboarding->update(['status' => 'in_progress']);
            }
        });

        NotificationService::notifyEmployee(
            $offboarding->employee_id,
            new OffboardingNotification(
                $offboarding,
                'Offboarding Request Approved',
                "Your offboarding request has been approved ({$request->role} approval).",
                'offboarding_approved'
            )
        );

        return back()->with('success', 'Offboarding request approved.');
    }

    // ─── Reject ──────────────────────────────────────────────────────────────────

    public function reject(Request $request, OffboardingRequest $offboarding)
    {
        $request->validate(['reason' => ['required', 'string', 'max:1000']]);

        // Only management roles may cancel an offboarding request.
        $this->assertCanManageOffboarding(Auth::user());

        $offboarding->update([
            'status'  => 'cancelled',
            'remarks' => ($offboarding->remarks ? $offboarding->remarks . "\n" : '') . 'Rejected: ' . $request->reason,
        ]);

        NotificationService::notifyEmployee(
            $offboarding->employee_id,
            new OffboardingNotification(
                $offboarding,
                'Offboarding Request Rejected',
                "Your offboarding request has been rejected. Reason: {$request->reason}",
                'offboarding_rejected'
            )
        );

        return back()->with('success', 'Offboarding request rejected/cancelled.');
    }

    // ─── Update Task ─────────────────────────────────────────────────────────────

    public function updateTask(Request $request, OffboardingRequest $offboarding, OffboardingTask $task)
    {
        $request->validate([
            'status'           => ['required', 'in:pending,in_progress,completed,skipped'],
            'completion_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $task->update([
            'status'           => $request->status,
            'completion_notes' => $request->completion_notes,
            'completed_at'     => $request->status === 'completed' ? now() : null,
            'assigned_to'      => $task->assigned_to ?? Auth::id(),
        ]);

        // Auto-advance status if all tasks done
        $pending = $offboarding->tasks()->whereNotIn('status', ['completed', 'skipped'])->count();
        if ($pending === 0 && $offboarding->status === 'in_progress') {
            $offboarding->update(['status' => 'exit_interview_pending']);
        }

        return back()->with('success', 'Task updated.');
    }

    // ─── Exit Interview ──────────────────────────────────────────────────────────

    public function exitInterview(OffboardingRequest $offboarding)
    {
        $offboarding->load('employee', 'exitInterview.conductor');

        return Inertia::render('Offboarding/ExitInterview', [
            'offboarding'   => $offboarding,
            'exitInterview' => $offboarding->exitInterview,
        ]);
    }

    public function storeExitInterview(Request $request, OffboardingRequest $offboarding)
    {
        $validated = $request->validate([
            'reason_for_leaving'          => ['nullable', 'string', 'max:2000'],
            'job_satisfaction_rating'     => ['nullable', 'integer', 'min:1', 'max:5'],
            'management_rating'           => ['nullable', 'integer', 'min:1', 'max:5'],
            'work_environment_rating'     => ['nullable', 'integer', 'min:1', 'max:5'],
            'compensation_rating'         => ['nullable', 'integer', 'min:1', 'max:5'],
            'growth_opportunity_rating'   => ['nullable', 'integer', 'min:1', 'max:5'],
            'best_part_of_job'            => ['nullable', 'string', 'max:2000'],
            'improvement_suggestions'     => ['nullable', 'string', 'max:2000'],
            'additional_comments'         => ['nullable', 'string', 'max:2000'],
            'rehire_eligible'             => ['boolean'],
        ]);

        OffboardingExitInterview::updateOrCreate(
            ['offboarding_request_id' => $offboarding->id],
            array_merge($validated, [
                'employee_id'  => $offboarding->employee_id,
                'conducted_by' => Auth::id(),
                'conducted_at' => now(),
            ])
        );

        // Advance status
        if ($offboarding->status === 'exit_interview_pending') {
            $offboarding->update(['status' => 'settlement_pending']);
        }

        // Mark exit interview task complete
        $offboarding->tasks()->where('task_type', 'exit_interview')->update([
            'status'       => 'completed',
            'completed_at' => now(),
        ]);

        return redirect()->route('offboarding.show', $offboarding)
            ->with('success', 'Exit interview recorded.');
    }

    // ─── Settlement Preview ──────────────────────────────────────────────────────

    public function settlementPreview(Request $request, OffboardingRequest $offboarding)
    {
        $offboarding->load('employee.salaryStructure', 'employee.leaveBalances.leaveType');

        $employee  = $offboarding->employee;
        $rawLwd    = $offboarding->actual_last_working_day ?? $offboarding->proposed_last_working_day;
        $lwd       = $rawLwd instanceof Carbon ? $rawLwd : ($rawLwd ? Carbon::parse((string) $rawLwd) : Carbon::today());
        $structure = $employee->salaryStructure;

        $basicMonthly = $structure ? (float) $structure->basic_salary : 0;
        $dailyRate    = $basicMonthly > 0 ? $basicMonthly / 26 : 0;

        // Days worked in final month
        $startOfMonth = $lwd->copy()->startOfMonth();
        $workedDays   = $startOfMonth->diffInWeekdays($lwd) + 1;
        $basicTillLwd = round($dailyRate * $workedDays, 2);

        // Leave encashment (earned leave balance × daily rate)
        $earnedLeaveBalance = $employee->leaveBalances
            ->filter(fn($b) => $b->leaveType && strtolower($b->leaveType->name) === 'earned leave')
            ->sum('balance');
        $leaveEncashment = round($dailyRate * $earnedLeaveBalance, 2);

        // Gratuity: 15/26 × last drawn basic × years of service (≥5 years)
        $joiningDate    = $employee->joined_date instanceof Carbon ? $employee->joined_date : ($employee->joined_date ? Carbon::parse($employee->joined_date) : null);
        $yearsOfService = $joiningDate ? $joiningDate->diffInYears($lwd) : 0;
        $gratuity       = $yearsOfService >= 5 ? round((15 / 26) * $basicMonthly * $yearsOfService, 2) : 0;

        // Notice pay
        $noticePay = $offboarding->notice_pay_applicable ? (float) ($offboarding->notice_pay_amount ?? 0) : 0;

        // Loan/Advance deductions (outstanding)
        $loanDeduction    = $employee->getLoanDeduction(now()->month, now()->year) ?? 0;
        $advanceDeduction = $employee->getAdvanceDeduction(now()->month, now()->year) ?? 0;
        $deductionsTotal  = $loanDeduction + $advanceDeduction;

        $netSettlement = $basicTillLwd + $leaveEncashment + $gratuity + $noticePay - $deductionsTotal;

        // Save preview to request
        $offboarding->update([
            'basic_salary_till_lwd'   => $basicTillLwd,
            'leave_encashment_amount' => $leaveEncashment,
            'gratuity_amount'         => $gratuity,
            'deductions_total'        => $deductionsTotal,
            'net_settlement_amount'   => max(0, $netSettlement),
        ]);

        return back()->with([
            'success'    => 'Settlement preview calculated.',
            'settlement' => [
                'basic_till_lwd'    => $basicTillLwd,
                'leave_encashment'  => $leaveEncashment,
                'gratuity'          => $gratuity,
                'notice_pay'        => $noticePay,
                'deductions_total'  => $deductionsTotal,
                'net_settlement'    => max(0, $netSettlement),
                'years_of_service'  => $yearsOfService,
                'worked_days'       => $workedDays,
                'daily_rate'        => $dailyRate,
            ],
        ]);
    }

    // ─── Complete ────────────────────────────────────────────────────────────────

    public function complete(Request $request, OffboardingRequest $offboarding)
    {
        $user = Auth::user();
        if (!$user->isAdmin() && !in_array($user->role, ['admin', 'hr', 'payroll'])) {
            abort(403, 'Unauthorized. Only HR, Payroll, or Administrator can complete offboarding.');
        }

        $request->validate([
            'actual_last_working_day' => ['required', 'date'],
        ]);

        DB::transaction(function () use ($offboarding, $request) {
            $offboarding->update([
                'status'                  => 'completed',
                'actual_last_working_day' => $request->actual_last_working_day,
                'completed_at'            => now(),
                'settlement_approved'     => true,
                'settlement_approved_by'  => Auth::id(),
                'settlement_approved_at'  => now(),
            ]);

            $exitStatus = match($offboarding->separation_reason) {
                'termination'         => 'Terminated',
                'contract_completion' => 'End of Contract',
                'absconding'          => 'Abscond',
                default               => 'Resigned',
            };

            // Lock employee profile, set inactive and store exit metadata
            $offboarding->employee->update([
                'manual_status'     => 'inactive',
                'exit_status'       => $exitStatus,
                'exit_date'         => $request->actual_last_working_day,
                'exit_reason'       => $offboarding->remarks ?? 'Separation completed through Offboarding process.',
            ]);
        });

        // Notify the employee about completion
        NotificationService::notifyEmployee(
            $offboarding->employee_id,
            new OffboardingNotification(
                $offboarding,
                'Offboarding Completed',
                'Your offboarding process has been completed. Your experience & relieving certificate is now available for download.',
                'offboarding_completed'
            )
        );

        // Auto-send relieving certificate by email if setting is enabled
        $empCompanyId = $offboarding->employee?->company_id;
        $sendEmail = Setting::get('offboarding_send_email', '1', $empCompanyId) === '1';
        if ($sendEmail) {
            try {
                $this->dispatchRelievingEmail($offboarding);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Auto relieving email failed: ' . $e->getMessage());
            }
        }

        return redirect()->route('offboarding.show', $offboarding->request_number ?: $offboarding->id)
            ->with('success', 'Offboarding completed. Employee profile has been locked and relieving certificate sent by email.');
    }

    // ─── Unlock / Reactivate Profile ─────────────────────────────────────────────

    public function unlockProfile(Request $request, OffboardingRequest $offboarding)
    {
        $user = Auth::user();
        if (!$user->isAdmin() && !in_array($user->role, ['admin', 'hr'])) {
            abort(403, 'Unauthorized. Only HR or Administrator can unlock an employee profile.');
        }

        DB::transaction(function () use ($offboarding) {
            $offboarding->employee->update([
                'manual_status'     => 'active',
                'exit_status'       => null,
                'exit_date'         => null,
                'exit_reason'       => null,
            ]);

            $offboarding->update([
                'status' => 'settlement_pending',
            ]);
        });

        return back()->with('success', 'Employee profile has been successfully unlocked and reactivated.');
    }

    // ─── Destroy ─────────────────────────────────────────────────────────────────

    public function destroy(OffboardingRequest $offboarding)
    {
        // Only management roles (or the employee who raised the request) may
        // delete an offboarding request. Without this guard any authenticated
        // employee could delete another employee's request and its document.
        $this->assertCanManageOffboarding(Auth::user(), $offboarding);

        if (!in_array($offboarding->status, ['draft', 'pending_approval', 'cancelled'])) {
            return back()->withErrors(['error' => 'Only draft or cancelled requests can be deleted.']);
        }

        if ($offboarding->supporting_document) {
            Storage::disk('public')->delete($offboarding->supporting_document);
        }

        $offboarding->delete();

        return redirect()->route('offboarding.index')
            ->with('success', 'Offboarding request deleted.');
    }

    // ─── Relieving Letter: Download PDF ─────────────────────────────────────────

    public function generateRelievingLetter(OffboardingRequest $offboarding)
    {
        $offboarding->load(['employee.company', 'employee.department']);
        $employee = $offboarding->employee;
        $company  = $employee->company;

        // Use the admin-configured template (allowlisted)
        $allowed  = ['relieving_letter', 'relieving_letter_classic', 'relieving_letter_modern', 'relieving_letter_comprehensive'];
        $template = Setting::get('relieving_letter_template', 'relieving_letter', $company?->id ?? null);
        if (!in_array($template, $allowed)) {
            $template = 'relieving_letter';
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.' . $template, [
            'offboarding' => $offboarding,
            'employee'    => $employee,
            'company'     => $company,
        ])->setPaper('a4', 'portrait');

        $fileName = 'Relieving_Certificate_' . str_replace(' ', '_', $employee->name) . '_' . now()->format('Ymd') . '.pdf';
        return $pdf->download($fileName);
    }

    // ─── Relieving Letter: Inline Preview ────────────────────────────────────────

    public function previewRelievingLetter(OffboardingRequest $offboarding)
    {
        $offboarding->load(['employee.company', 'employee.department']);
        $employee = $offboarding->employee;
        $company  = $employee->company;

        $allowed  = ['relieving_letter', 'relieving_letter_classic', 'relieving_letter_modern', 'relieving_letter_comprehensive'];
        $template = Setting::get('relieving_letter_template', 'relieving_letter', $company?->id ?? null);
        if (!in_array($template, $allowed)) {
            $template = 'relieving_letter';
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.' . $template, [
            'offboarding' => $offboarding,
            'employee'    => $employee,
            'company'     => $company,
        ])->setPaper('a4', 'portrait');

        $fileName = 'Preview_Relieving_' . ($employee->employee_code ?? $employee->id) . '.pdf';
        return $pdf->stream($fileName);
    }

    // ─── Relieving Letter: Send by Email ─────────────────────────────────────────

    public function sendRelievingEmail(Request $request, OffboardingRequest $offboarding)
    {
        $user = Auth::user();
        if (!$user->isAdmin() && !in_array($user->role, ['admin', 'hr'])) {
            abort(403, 'Unauthorized. Only HR or Administrator can send relieving certificates.');
        }

        if ($offboarding->status !== 'completed') {
            return back()->withErrors(['error' => 'Relieving certificate can only be sent after offboarding is fully completed.']);
        }

        try {
            $this->dispatchRelievingEmail($offboarding);
            return back()->with('success', 'Relieving certificate successfully sent to ' . ($offboarding->employee->email ?? 'employee') . ' by email.');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Relieving email failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to send email: ' . $e->getMessage()]);
        }
    }

    /**
     * Shared helper: build the PDF and dispatch RelievingCertificateMail.
     */
    private function dispatchRelievingEmail(OffboardingRequest $offboarding): void
    {
        $offboarding->loadMissing(['employee.company', 'employee.department']);
        $employee = $offboarding->employee;
        $company  = $employee->company;

        if (!$employee || !$employee->email) {
            return;
        }

        $allowed  = ['relieving_letter', 'relieving_letter_classic', 'relieving_letter_modern', 'relieving_letter_comprehensive'];
        $template = Setting::get('relieving_letter_template', 'relieving_letter', $company?->id ?? null);
        if (!in_array($template, $allowed)) {
            $template = 'relieving_letter';
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.' . $template, [
            'offboarding' => $offboarding,
            'employee'    => $employee,
            'company'     => $company,
        ])->setPaper('a4', 'portrait');

        $pdfContent = $pdf->output();
        $fileName   = 'Relieving_Certificate_' . str_replace(' ', '_', $employee->name) . '_' . now()->format('Ymd') . '.pdf';

        Mail::to($employee->email)
            ->queue(new RelievingCertificateMail($offboarding, $pdfContent, $fileName));
    }
}
