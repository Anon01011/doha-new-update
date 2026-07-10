<?php

namespace App\Http\Controllers;

use App\Models\SalaryPosting;
use App\Models\Employee;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Services\PayrollService;

class SalaryPostingController extends Controller
{
    protected $payrollService;

    public function __construct(PayrollService $payrollService)
    {
        $this->payrollService = $payrollService;
    }

    /**
     * Get the authenticated user's company_id
     */
    private function getUserCompanyId()
    {
        $user = auth()->user();
        return $user && $user->employee_id && $user->employee
            ? $user->employee->company_id
            : null;
    }
    public function index(Request $request)
    {
        $month = $request->query('month', now()->month);
        $year = $request->query('year', now()->year);

        $query = SalaryPosting::with('employee')
            ->where('month', $month)
            ->where('year', $year);
        $user = auth()->user();

        // Role-based filtering
        if ($user->role === 'employee' && $user->employee_id) {
            // Employees can only see their own salary postings
            $query->where('employee_id', $user->employee_id);
        }

        $salaryPostings = $query->latest()->paginate(10);

        return Inertia::render('Salary/Index', [
            'salaryPostings' => $salaryPostings,
            'month' => $month,
            'year' => $year,
            'userRole' => $user->role,
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-payroll')) {
            abort(403, 'Unauthorized. You do not have permission to manage payroll.');
        }

        // Employee::active() is already scoped by BelongsToCompany
        $employees = Employee::active()->orderBy('name')
            ->with(['company:id,name', 'department:id,name'])
            ->get(['id', 'name', 'employee_code', 'basic_salary', 'company_id', 'department_id', 'manual_status', 'exit_status']);

        // Fetch all companies if super admin
        $companies = [];
        if ($user->isAdmin()) {
            $companies = \App\Models\Company::orderBy('name')->get(['id', 'name']);
        }

        // SalaryComponent is also scoped by BelongsToCompany
        $salaryComponents = \App\Models\SalaryComponent::where('is_active', true)->get();

        return Inertia::render('Salary/Create', [
            'employees' => $employees,
            'salaryComponents' => $salaryComponents,
            'companies' => $companies,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-payroll')) {
            abort(403, 'Unauthorized. You do not have permission to manage payroll.');
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2000|max:2100',
            'basic_salary' => 'required|numeric|min:0',
            'allowances' => 'nullable|array',
            'deductions' => 'nullable|array',
            'overtime_amount' => 'nullable|numeric|min:0',
            'leave_deduction' => 'nullable|numeric|min:0',
        ]);

        $employee = Employee::find($validated['employee_id']);

        // 1. Check if employee is active
        if (!$employee->is_active) {
            return redirect()->back()->withErrors(['employee_id' => 'Cannot create salary for an inactive employee.']);
        }

        // 2. Check for duplicate posting
        $exists = SalaryPosting::where('employee_id', $validated['employee_id'])
            ->where('month', $validated['month'])
            ->where('year', $validated['year'])
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['employee_id' => 'Salary already created for this employee for the selected month and year.']);
        }


        // Ensure numeric fields are not null
        $validated['overtime_amount'] = $validated['overtime_amount'] ?? 0;
        $validated['leave_deduction'] = $validated['leave_deduction'] ?? 0;
        $validated['allowances'] = $validated['allowances'] ?? [];
        $validated['deductions'] = $validated['deductions'] ?? [];

        // Create missing salary components manually added
        $this->ensureComponentsExist($validated['allowances'], 'allowance', $employee->company_id);
        $this->ensureComponentsExist($validated['deductions'], 'deduction', $employee->company_id);

        // Calculate net salary
        $netSalary = $validated['basic_salary']
            + array_sum($validated['allowances'])
            + $validated['overtime_amount']
            - array_sum($validated['deductions'])
            - $validated['leave_deduction'];

        $validated['net_salary'] = max(0, $netSalary);
        $validated['status'] = 'draft';
        $validated['posted_by'] = auth()->id();

        SalaryPosting::create($validated);
        return redirect()->route('salary-postings.index')->with('success', 'Salary posting created successfully!');
    }

    public function show(SalaryPosting $salaryPosting)
    {
        $user = auth()->user();
        if ($user->role === 'employee' && $salaryPosting->employee_id != $user->employee_id) {
            abort(403, 'Unauthorized access.');
        }

        // Global scope BelongsToCompany already ensures users can only see records from their company.
        // Super admins bypass this as per the trait logic.

        $salaryPosting->load(['employee.company', 'employee.department', 'poster', 'approver']);

        $startDate = \Carbon\Carbon::create($salaryPosting->year, $salaryPosting->month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $loanInstallments = \App\Models\LoanInstallment::whereHas('loan', function ($query) use ($salaryPosting) {
            $query->where('employee_id', $salaryPosting->employee_id)
                  ->where('repayment_method', 'salary_deduction');
        })
            ->with('loan')
            ->whereBetween('due_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->get();

        $advances = \App\Models\Advance::where('employee_id', $salaryPosting->employee_id)
            ->whereBetween('repayment_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->get();

        return Inertia::render('Salary/Show', [
            'salaryPosting' => $salaryPosting,
            'loanInstallments' => $loanInstallments,
            'advances' => $advances,
            'userRole' => $user->role,
        ]);
    }

    public function edit(SalaryPosting $salaryPosting)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-payroll')) {
            abort(403, 'Unauthorized. You do not have permission to manage payroll.');
        }

        $query = Employee::active()->orderBy('name');

        // If current employee is inactive, we still need them in the list to avoid empty selection
        if ($salaryPosting->employee && !$salaryPosting->employee->is_active) {
            $query->orWhere('id', $salaryPosting->employee_id);
        }

        $employees = $query->with(['company:id,name', 'department:id,name'])
            ->get(['id', 'name', 'employee_code', 'basic_salary', 'company_id', 'department_id', 'manual_status', 'exit_status']);

        // Fetch all companies if admin
        $companies = [];
        if ($user->isAdmin()) {
            $companies = \App\Models\Company::orderBy('name')->get(['id', 'name']);
        }

        $salaryComponents = \App\Models\SalaryComponent::where('is_active', true)->get();

        return Inertia::render('Salary/Edit', [
            'salaryPosting' => $salaryPosting,
            'employees' => $employees,
            'salaryComponents' => $salaryComponents,
            'companies' => $companies,
        ]);
    }

    public function update(Request $request, SalaryPosting $salaryPosting)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-payroll')) {
            abort(403, 'Unauthorized. You do not have permission to manage payroll.');
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2000|max:2100',
            'basic_salary' => 'required|numeric|min:0',
            'allowances' => 'nullable|array',
            'deductions' => 'nullable|array',
            'overtime_amount' => 'nullable|numeric|min:0',
            'leave_deduction' => 'nullable|numeric|min:0',
        ]);

        $employee = Employee::find($validated['employee_id']);

        // 1. Check if employee is active
        if (!$employee->is_active && $employee->id != $salaryPosting->employee_id) {
            return redirect()->back()->withErrors(['employee_id' => 'Cannot assign salary to an inactive employee.']);
        }

        // 2. Check for duplicate posting if employee/month/year changed
        if (
            $validated['employee_id'] != $salaryPosting->employee_id ||
            $validated['month'] != $salaryPosting->month ||
            $validated['year'] != $salaryPosting->year
        ) {

            $exists = SalaryPosting::where('employee_id', $validated['employee_id'])
                ->where('month', $validated['month'])
                ->where('year', $validated['year'])
                ->where('id', '!=', $salaryPosting->id)
                ->exists();

            if ($exists) {
                return redirect()->back()->withErrors(['employee_id' => 'Salary already exists for this employee for the selected month and year.']);
            }
        }

        // Ensure numeric fields are not null
        $validated['overtime_amount'] = $validated['overtime_amount'] ?? 0;
        $validated['leave_deduction'] = $validated['leave_deduction'] ?? 0;
        $validated['allowances'] = $validated['allowances'] ?? [];
        $validated['deductions'] = $validated['deductions'] ?? [];

        // Create missing salary components manually added
        $this->ensureComponentsExist($validated['allowances'], 'allowance', $employee->company_id);
        $this->ensureComponentsExist($validated['deductions'], 'deduction', $employee->company_id);

        // Recalculate net salary
        $netSalary = $validated['basic_salary']
            + array_sum($validated['allowances'])
            + $validated['overtime_amount']
            - array_sum($validated['deductions'])
            - $validated['leave_deduction'];

        $validated['net_salary'] = max(0, $netSalary);
        $salaryPosting->update($validated);

        return redirect()->route('salary-postings.show', $salaryPosting)->with('success', 'Salary posting updated successfully!');
    }

    public function destroy(SalaryPosting $salaryPosting)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-payroll')) {
            abort(403, 'Unauthorized. You do not have permission to manage payroll.');
        }

        $salaryPosting->delete();
        return redirect()->route('salary-postings.index')->with('success', 'Salary posting deleted successfully!');
    }

    public function generateSlip(SalaryPosting $salaryPosting, \Illuminate\Http\Request $request)
    {
        $user = auth()->user();
        if ($user->role === 'employee' && $salaryPosting->employee_id != $user->employee_id) {
            abort(403, 'Unauthorized access.');
        }

        if ($user->role !== 'admin' && $user->employee_id && $salaryPosting->employee->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access.');
        }

        $salaryPosting->load(['employee.company', 'employee.department', 'poster', 'approver']);

        // Load loan installments for this month
        $month = $salaryPosting->month;
        $year = $salaryPosting->year;
        $employeeId = $salaryPosting->employee_id;
        $startDate = \Carbon\Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $loanInstallments = \App\Models\LoanInstallment::with('loan')
            ->whereHas('loan', function ($query) use ($employeeId) {
                $query->where('employee_id', $employeeId);
            })
            ->whereBetween('due_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->get();

        $advances = \App\Models\Advance::where('employee_id', $employeeId)
            ->whereBetween('repayment_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->get();

        if ($request->has('download')) {
            if ($salaryPosting->status !== 'approved') {
                return back()->with('error', 'You cannot download an unapproved salary slip.');
            }
            $appSettings = \App\Models\Setting::pluck('value', 'key')->toArray();
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.salary_slip', [
                'salaryPosting' => $salaryPosting,
                'loanInstallments' => $loanInstallments,
                'advances' => $advances,
                'appSettings' => $appSettings,
            ]);
            return $pdf->download('Salary_Slip_' . str_replace(' ', '_', $salaryPosting->employee->name) . '_' . $month . '_' . $year . '.pdf');
        }

        return inertia('Salary/Slip', [
            'salaryPosting' => $salaryPosting,
            'loanInstallments' => $loanInstallments,
            'advances' => $advances,
        ]);
    }

    public function reject(Request $request, SalaryPosting $salaryPosting)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !in_array(strtolower($user->role), ['admin', 'hr', 'manager', 'system admin', 'system_admin', 'super admin', 'superadmin']) && !$user->hasPermission('approve-salary-postings')) {
            abort(403, 'Unauthorized.');
        }

        $salaryPosting->update([
            'status' => 'rejected',
            'approved_by' => null,
            'approved_at' => null,
        ]);

        return redirect()->back()->with('success', 'Salary posting rejected.');
    }

    public function approve(Request $request, SalaryPosting $salaryPosting)
    {
        // Only admin, HR, and authorized users can approve salary postings
        $user = auth()->user();
        if (!$user->isAdmin() && !in_array(strtolower($user->role), ['admin', 'hr', 'manager', 'system admin', 'system_admin', 'super admin', 'superadmin']) && !$user->hasPermission('approve-salary-postings')) {
            abort(403, 'Unauthorized. Only authorized users can approve salary postings.');
        }

        if ($user->role !== 'admin' && $user->employee_id && $salaryPosting->employee->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access.');
        }

        $salaryPosting->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        $this->notifyEmployee($salaryPosting->employee_id, new \App\Notifications\SalaryGenerated($salaryPosting));

        // Mark loans and advances for this month as repaid
        $this->markRepaymentsAsPaid($salaryPosting);

        return redirect()->back()->with('success', 'Salary posting approved successfully!');
    }

    public function calculateSalary(Request $request)
    {
        $user = auth()->user();
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2000|max:2100',
        ]);

        $employee = Employee::findOrFail($request->employee_id);
        if ($user->role !== 'admin' && $user->employee_id && $employee->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access.');
        }

        try {
            $data = $this->payrollService->calculateMonthlyPayroll(
                $request->employee_id,
                $request->month,
                $request->year
            );
            return response()->json(array_merge(['success' => true], $data));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Mark loan installments and advances for the salary month as repaid.
     */
    private function markRepaymentsAsPaid(SalaryPosting $salaryPosting)
    {
        $month = $salaryPosting->month;
        $year = $salaryPosting->year;
        $employeeId = $salaryPosting->employee_id;
        $startDate = \Carbon\Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        // 1. Mark Loan Installments as paid if "Loan Repayment" deduction exists
        $loanDeduction = isset($salaryPosting->deductions['Loan Repayment']) ? (float)$salaryPosting->deductions['Loan Repayment'] : 0;
        
        if ($loanDeduction > 0) {
            $installments = \App\Models\LoanInstallment::whereHas('loan', function ($query) use ($employeeId) {
                $query->where('employee_id', $employeeId)
                      ->where('repayment_method', 'salary_deduction');
            })
                ->whereBetween('due_date', [$startDate->toDateString(), $endDate->toDateString()])
                ->where('status', '!=', 'paid')
                ->orderBy('due_date')
                ->get();

            $remainingAmount = $loanDeduction;
            foreach ($installments as $installment) {
                if ($remainingAmount <= 0) break;

                $payAmount = min($remainingAmount, $installment->amount);
                $installment->update([
                    'status' => $payAmount >= $installment->amount ? 'paid' : 'pending',
                    'paid_amount' => $payAmount,
                    'paid_date' => now(),
                    'remarks' => $payAmount < $installment->amount ? "Partial payment of $payAmount from salary." : "Full payment from salary.",
                ]);
                $remainingAmount -= $payAmount;
            }
        }

        // 2. Mark Advances as repaid if "Advance Repayment" deduction exists
        $advanceDeduction = isset($salaryPosting->deductions['Advance Repayment']) ? (float)$salaryPosting->deductions['Advance Repayment'] : 0;
        
        if ($advanceDeduction > 0) {
            $advances = \App\Models\Advance::where('employee_id', $employeeId)
                ->whereBetween('repayment_date', [$startDate->toDateString(), $endDate->toDateString()])
                ->where('status', 'approved')
                ->whereNull('repaid_at')
                ->orderBy('repayment_date')
                ->get();

            $remainingAmount = $advanceDeduction;
            foreach ($advances as $advance) {
                if ($remainingAmount <= 0) break;

                $payAmount = min($remainingAmount, $advance->amount);
                $advance->update([
                    'repaid_amount' => $payAmount,
                    'repaid_at' => now(),
                    'status' => $payAmount >= $advance->amount ? 'repaid' : 'approved',
                    'remarks' => $advance->remarks . ($payAmount < $advance->amount ? "\nPartial repayment of $payAmount from salary." : "\nFull repayment from salary."),
                ]);
                $remainingAmount -= $payAmount;
            }
        }
    }
    public function bulkAction(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-payroll')) {
            abort(403, 'Unauthorized. You do not have permission to manage payroll.');
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:salary_postings,id',
            'action' => 'required|in:approve,delete,reject',
        ]);

        // BelongsToCompany handles isolation for non-admins automatically on find/query.

        $ids = $request->ids;
        $action = $request->action;

        if ($action === 'approve') {
            $count = 0;
            foreach ($ids as $id) {
                $posting = SalaryPosting::find($id);
                if ($posting && $posting->status === 'draft') {
                    $posting->update([
                        'status' => 'approved',
                        'approved_by' => auth()->id(),
                        'approved_at' => now(),
                    ]);
                    $this->markRepaymentsAsPaid($posting);
                    $this->notifyEmployee($posting->employee_id, new \App\Notifications\SalaryGenerated($posting));
                    $count++;
                }
            }
            return redirect()->back()->with('success', $count . ' salary postings approved successfully!');
        } elseif ($action === 'reject') {
            SalaryPosting::whereIn('id', $ids)
                ->where('status', '!=', 'approved')
                ->update(['status' => 'rejected']);
            return redirect()->back()->with('success', 'Selected salary postings rejected.');
        } elseif ($action === 'delete') {
            SalaryPosting::whereIn('id', $ids)->delete();
            return redirect()->back()->with('success', count($ids) . ' salary postings deleted successfully!');
        }
    }
    public function bulkGenerate(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-payroll')) {
            abort(403, 'Unauthorized. You do not have permission to manage payroll.');
        }

        $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2000|max:2100',
            'company_id' => 'nullable|exists:companies,id',
        ]);

        $month = $request->month;
        $year = $request->year;

        // Scoping is handled by BelongsToCompany on Employee::active()
        $query = Employee::active();
        if ($user->isAdmin() && $request->company_id) {
            $query->where('company_id', $request->company_id);
        }

        $employees = $query->get();
        $count = 0;

        foreach ($employees as $employee) {
            // Check if posting already exists
            $exists = SalaryPosting::where('employee_id', $employee->id)
                ->where('month', $month)
                ->where('year', $year)
                ->exists();

            if ($exists)
                continue;

            try {
                // Calculate salary
                $data = $this->payrollService->calculateMonthlyPayroll($employee->id, $month, $year);

                SalaryPosting::create([
                    'employee_id' => $employee->id,
                    'month' => $month,
                    'year' => $year,
                    'basic_salary' => $data['basic_salary'],
                    'allowances' => $data['allowances'],
                    'deductions' => $data['deductions'],
                    'overtime_amount' => $data['overtime_amount'],
                    'leave_deduction' => $data['leave_deduction'],
                    'net_salary' => $data['net_salary'],
                    'status' => 'draft',
                    'posted_by' => auth()->id(),
                ]);
                $count++;
            } catch (\Exception $e) {
                // Log error or continue
                continue;
            }
        }

        return redirect()->route('salary-postings.index')->with('success', "Generated salary postings for $count employees.");
    }

    private function ensureComponentsExist(array $components, string $type, $companyId = null)
    {
        // Fallback to user's company only if no specific company provided (and not admin)
        if (!$companyId) {
            $companyId = $this->getUserCompanyId();
        }

        // Optimization: Fetch existing components for this company OR global components first
        $existing = \App\Models\SalaryComponent::where('type', $type)
            ->where(function($query) use ($companyId) {
                $query->where('company_id', $companyId)
                      ->orWhereNull('company_id');
            })
            ->whereIn('name', array_keys($components))
            ->pluck('name')
            ->toArray();

        foreach ($components as $name => $amount) {
            if (in_array($name, $existing))
                continue;

            \App\Models\SalaryComponent::create([
                'name' => $name,
                'type' => $type,
                'is_active' => true,
                'default_amount' => $amount,
                'company_id' => $companyId,
            ]);
        }
    }
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
