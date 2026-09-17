<?php

namespace App\Http\Controllers;

use App\Models\ExpenseClaim;
use App\Models\ExpenseCategory;
use App\Models\Employee;
use App\Models\Company;
use App\Models\Department;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Carbon\Carbon;

class ExpenseClaimController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        if (!$user->isEmployee() && !$user->isAdmin() && !$user->isHR() && !$user->isManager() && !$user->hasPermission('view-expenses')) {
            abort(403, 'Unauthorized.');
        }

        $query = ExpenseClaim::with(['employee.company', 'employee.department', 'category', 'manager', 'financeReviewer', 'payer']);

        // Scope access
        if ($user->isEmployee()) {
            $query->where('employee_id', $user->employee_id);
        } elseif (!$user->isAdmin() && !$user->isHR() && $user->employee_id && $user->employee) {
            $query->where('company_id', $user->employee->company_id);
        }

        if ($request->filled('company_id') && ($user->isAdmin() || $user->isHR())) {
            $query->where('company_id', $request->input('company_id'));
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->input('department_id'));
        }

        // Filters
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('claim_number', 'like', "%{$search}%")
                    ->orWhere('vendor_name', 'like', "%{$search}%")
                    ->orWhere('business_purpose', 'like', "%{$search}%")
                    ->orWhereHas('employee', function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%")
                            ->orWhere('employee_code', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('category_id')) {
            $query->where('expense_category_id', $request->input('category_id'));
        }

        if ($request->filled('reimbursement_status')) {
            $query->where('reimbursement_status', $request->input('reimbursement_status'));
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('expense_date', [$request->input('start_date'), $request->input('end_date')]);
        }

        // Summary KPI Metrics
        $summaryQuery = clone $query;
        $allClaims = $summaryQuery->get();

        $summary = [
            'total_claims' => $allClaims->count(),
            'total_amount' => (float) $allClaims->sum('amount'),
            'pending_manager' => $allClaims->where('status', 'submitted')->count(),
            'pending_finance' => $allClaims->where('status', 'manager_approved')->count(),
            'approved_reimbursable' => (float) $allClaims->where('status', 'finance_approved')->where('reimbursement_status', 'pending')->sum('amount'),
            'total_paid' => (float) $allClaims->where('reimbursement_status', 'paid')->sum('amount') + (float) $allClaims->where('reimbursement_status', 'included_in_payroll')->sum('amount'),
            'violations_count' => $allClaims->where('policy_violation_flag', true)->count(),
        ];

        $claims = $query->latest('expense_date')->paginate(15)->withQueryString();
        $categories = ExpenseCategory::active()->orderBy('name')->get(['id', 'name', 'code', 'policy_limit_amount']);
        $companies = ($user->isAdmin() || $user->isHR()) ? Company::orderBy('name')->get(['id', 'name']) : collect();
        $departments = Department::orderBy('name')->get(['id', 'name', 'company_id']);

        return Inertia::render('Expenses/Index', [
            'claims' => $claims,
            'summary' => $summary,
            'categories' => $categories,
            'companies' => $companies,
            'departments' => $departments,
            'filters' => $request->only(['search', 'status', 'category_id', 'reimbursement_status', 'start_date', 'end_date', 'company_id', 'department_id']),
            'userRole' => $user->role,
            'userEmployeeId' => $user->employee_id,
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        if (!$user->isEmployee() && !$user->isAdmin() && !$user->isHR() && !$user->isManager() && !$user->hasPermission('create-expenses')) {
            abort(403, 'Unauthorized.');
        }

        $currentEmployee = $user->employee;
        $userRole = $user->role;

        if ($user->isAdmin() || $user->isHR()) {
            $employees = Employee::active()
                ->with(['company:id,name', 'department:id,name'])
                ->orderBy('name')
                ->get(['id', 'name', 'employee_code', 'company_id', 'department_id', 'designation', 'employee_image']);
            $companies = Company::orderBy('name')->get(['id', 'name']);
            $departments = Department::orderBy('name')->get(['id', 'name', 'company_id']);
            $companyId = $currentEmployee ? $currentEmployee->company_id : null;
        } elseif ($user->isManager()) {
            $managerCompanyId = $currentEmployee ? $currentEmployee->company_id : $user->company_id;
            $employees = Employee::active()
                ->when($managerCompanyId, function($q) use ($managerCompanyId) {
                    $q->where('company_id', $managerCompanyId);
                })
                ->with(['company:id,name', 'department:id,name'])
                ->orderBy('name')
                ->get(['id', 'name', 'employee_code', 'company_id', 'department_id', 'designation', 'employee_image']);
            $companies = $managerCompanyId ? Company::where('id', $managerCompanyId)->get(['id', 'name']) : collect();
            $departments = $managerCompanyId ? Department::where('company_id', $managerCompanyId)->orderBy('name')->get(['id', 'name', 'company_id']) : collect();
            $companyId = $managerCompanyId;
        } else {
            // Normal employee
            $employees = $currentEmployee ? collect([$currentEmployee->load(['company:id,name', 'department:id,name'])]) : collect();
            $companies = collect();
            $departments = collect();
            $companyId = $currentEmployee ? $currentEmployee->company_id : null;
        }

        $categories = ExpenseCategory::active()
            ->when($companyId, function ($q) use ($companyId) {
                $q->where(function ($sub) use ($companyId) {
                    $sub->where('company_id', $companyId)->orWhereNull('company_id');
                });
            })
            ->orderBy('name')
            ->get();

        $projects = class_exists(Project::class) ? Project::orderBy('name')->get(['id', 'name']) : [];

        return Inertia::render('Expenses/Create', [
            'categories' => $categories,
            'projects' => $projects,
            'companies' => $companies,
            'departments' => $departments,
            'employees' => $employees,
            'currentEmployee' => $currentEmployee,
            'userRole' => $userRole,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user->isEmployee() && !$user->isAdmin() && !$user->isHR() && !$user->isManager() && !$user->hasPermission('create-expenses')) {
            abort(403, 'Unauthorized.');
        }

        if ($user->isEmployee()) {
            $employeeId = $user->employee_id;
            if (!$employeeId) {
                return back()->withErrors(['employee_id' => 'Your user account is not linked to an employee record.']);
            }
            $employee = Employee::findOrFail($employeeId);
        } else {
            $targetId = $request->input('employee_id') ?: $user->employee_id;
            if (!$targetId) {
                return back()->withErrors(['employee_id' => 'Please select an employee for this claim.']);
            }
            $employee = Employee::findOrFail($targetId);

            // Scope check for manager: must be within manager's branch
            if ($user->isManager() && !$user->isAdmin() && !$user->isHR()) {
                $managerCompanyId = $user->employee ? $user->employee->company_id : $user->company_id;
                if ($managerCompanyId && $employee->company_id != $managerCompanyId) {
                    abort(403, 'You can only create expense claims for employees in your assigned branch/Company.');
                }
            }
        }

        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'expense_date' => 'required|date|before_or_equal:today',
            'amount' => 'required|numeric|min:1',
            'tax_amount' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'tax_invoice_number' => 'nullable|string|max:100',
            'vendor_name' => 'nullable|string|max:255',
            'business_purpose' => 'required|string|min:5|max:2000',
            'cost_center' => 'nullable|string|max:100',
            'project_name' => 'nullable|string|max:100',
            'payment_method' => 'required|in:cash,personal_card,corporate_card,bank_transfer,upi',
            'receipt' => 'nullable|file|mimes:jpeg,png,jpg,webp,pdf|max:10240',
            'submit_now' => 'nullable|boolean',
        ]);

        $category = ExpenseCategory::findOrFail($validated['expense_category_id']);

        // Receipt validation if mandated
        if ($category->requires_receipt && !$request->hasFile('receipt')) {
            return back()->withErrors(['receipt' => "Receipt upload is mandatory for {$category->name}."]);
        }

        // Upload receipt
        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $receiptPath = $request->file('receipt')->store('expense_receipts', 'public');
        }

        // Step 27: Initial Automated Validation (Policy Limits & Duplicate Checks)
        $policyViolation = false;
        $violationReason = null;

        // 1. Policy Limit Check (INR)
        if ($category->policy_limit_amount && (float) $validated['amount'] > (float) $category->policy_limit_amount) {
            $policyViolation = true;
            $violationReason = "Claim amount (₹" . number_format((float) $validated['amount'], 2) . ") exceeds category policy limit of ₹" . number_format((float) $category->policy_limit_amount, 2) . ".";
        }

        // 2. Duplicate Check
        $possibleDuplicate = ExpenseClaim::where('employee_id', $employee->id)
            ->where('expense_date', $validated['expense_date'])
            ->where('amount', $validated['amount'])
            ->where('expense_category_id', $validated['expense_category_id'])
            ->where('status', '!=', 'rejected')
            ->first();

        if ($possibleDuplicate) {
            $policyViolation = true;
            $violationReason = ($violationReason ? $violationReason . " | " : "") . "Potential duplicate claim detected with Claim #" . $possibleDuplicate->claim_number . " on the same date.";
        }

        // Generate unique claim number
        $claimNumber = 'EXP-' . date('Ym') . '-' . strtoupper(substr(uniqid(), -5));

        $status = $request->boolean('submit_now', true) ? 'submitted' : 'draft';

        $claim = ExpenseClaim::create([
            'claim_number' => $claimNumber,
            'company_id' => $employee->company_id,
            'employee_id' => $employee->id,
            'department_id' => $employee->department_id,
            'expense_category_id' => $validated['expense_category_id'],
            'expense_date' => $validated['expense_date'],
            'amount' => $validated['amount'],
            'tax_amount' => $validated['tax_amount'] ?? 0.00,
            'tax_rate' => $validated['tax_rate'] ?? null,
            'tax_invoice_number' => $validated['tax_invoice_number'] ?? null,
            'vendor_name' => $validated['vendor_name'] ?? null,
            'business_purpose' => $validated['business_purpose'],
            'cost_center' => $validated['cost_center'] ?? null,
            'project_name' => $validated['project_name'] ?? null,
            'payment_method' => $validated['payment_method'],
            'receipt_path' => $receiptPath,
            'status' => $status,
            'reimbursement_method' => 'payroll',
            'reimbursement_status' => 'pending',
            'policy_violation_flag' => $policyViolation,
            'violation_reason' => $violationReason,
        ]);

        return redirect()->route('expenses.show', $claim->id)
            ->with('success', $status === 'submitted' ? 'Expense claim submitted for review successfully.' : 'Expense claim saved as draft.');
    }

    public function show(ExpenseClaim $expense)
    {
        $user = auth()->user();
        $expense->load(['employee.company', 'employee.department', 'category', 'manager', 'financeReviewer', 'payer', 'salaryPosting']);

        // Authorization
        if ($user->isEmployee() && $expense->employee_id !== $user->employee_id) {
            abort(403, 'Unauthorized.');
        }

        if (!$user->isAdmin() && !$user->isHR() && $user->employee_id && $user->employee && !$user->isEmployee()) {
            if ($expense->company_id != $user->employee->company_id) {
                abort(403, 'Unauthorized branch access.');
            }
        }

        $applicantUser = \App\Models\User::where('employee_id', $expense->employee_id)->first();
        $applicantRole = $applicantUser ? $applicantUser->role : 'employee';
        $isManagerOrAdminApplicant = in_array($applicantRole, ['manager', 'admin']);

        [$canManagerApprove, $approvalReason] = $this->canUserApproveClaim($user, $expense);

        return Inertia::render('Expenses/Show', [
            'claim' => $expense,
            'userRole' => $user->role,
            'userEmployeeId' => $user->employee_id,
            'applicantRole' => $applicantRole,
            'isManagerOrAdminApplicant' => $isManagerOrAdminApplicant,
            'canManagerApprove' => $canManagerApprove,
            'approvalReason' => $approvalReason,
        ]);
    }

    protected function canUserApproveClaim($user, ExpenseClaim $expense)
    {
        // Find the user account belonging to the applicant employee
        $applicantUser = \App\Models\User::where('employee_id', $expense->employee_id)->first();
        $applicantRole = $applicantUser ? $applicantUser->role : 'employee';
        $isManagerOrAdminApplicant = in_array($applicantRole, ['manager', 'admin']);

        // Prevent self-approval
        if ($user->employee_id && $user->employee_id == $expense->employee_id) {
            return [false, 'You cannot approve your own expense claim.'];
        }

        if ($isManagerOrAdminApplicant) {
            // Only Admin role can approve claims submitted by a Manager or Admin
            if (!$user->isAdmin()) {
                return [false, 'Expense claims submitted for Managers or Administrators strictly require Administrator approval.'];
            }
            return [true, ''];
        }

        // Standard employee claims: Admin, HR, or Manager from the same branch
        if ($user->isAdmin() || $user->isHR()) {
            return [true, ''];
        }

        if ($user->isManager()) {
            $managerCompanyId = $user->employee ? $user->employee->company_id : $user->company_id;
            if ($managerCompanyId && $managerCompanyId != $expense->company_id) {
                return [false, 'You can only review expense claims from your assigned Company.'];
            }
            return [true, ''];
        }

        return [false, 'Unauthorized to approve this expense claim.'];
    }

    public function edit(ExpenseClaim $expense)
    {
        $user = auth()->user();

        if ($expense->is_locked || !in_array($expense->status, ['draft', 'returned_to_employee'])) {
            return redirect()->route('expenses.show', $expense->id)->with('error', 'This claim cannot be edited in its current status.');
        }

        if ($user->isEmployee() && $expense->employee_id !== $user->employee_id) {
            abort(403, 'Unauthorized.');
        }

        $categories = ExpenseCategory::active()->orderBy('name')->get();
        $projects = class_exists(Project::class) ? Project::orderBy('name')->get(['id', 'name']) : [];
        $departments = Department::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Expenses/Edit', [
            'claim' => $expense,
            'categories' => $categories,
            'projects' => $projects,
            'departments' => $departments,
        ]);
    }

    public function update(Request $request, ExpenseClaim $expense)
    {
        $user = auth()->user();

        if ($expense->is_locked || !in_array($expense->status, ['draft', 'returned_to_employee'])) {
            return redirect()->route('expenses.show', $expense->id)->with('error', 'This claim cannot be edited.');
        }

        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'expense_date' => 'required|date|before_or_equal:today',
            'amount' => 'required|numeric|min:1',
            'tax_amount' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'tax_invoice_number' => 'nullable|string|max:100',
            'vendor_name' => 'nullable|string|max:255',
            'business_purpose' => 'required|string|min:5|max:2000',
            'cost_center' => 'nullable|string|max:100',
            'project_name' => 'nullable|string|max:100',
            'payment_method' => 'required|in:cash,personal_card,corporate_card,bank_transfer,upi',
            'receipt' => 'nullable|file|mimes:jpeg,png,jpg,webp,pdf|max:10240',
            'submit_now' => 'nullable|boolean',
        ]);

        $category = ExpenseCategory::findOrFail($validated['expense_category_id']);

        if ($request->hasFile('receipt')) {
            if ($expense->receipt_path) {
                Storage::disk('public')->delete($expense->receipt_path);
            }
            $expense->receipt_path = $request->file('receipt')->store('expense_receipts', 'public');
        }

        // Policy checks
        $policyViolation = false;
        $violationReason = null;
        if ($category->policy_limit_amount && (float) $validated['amount'] > (float) $category->policy_limit_amount) {
            $policyViolation = true;
            $violationReason = "Claim amount (₹" . number_format((float) $validated['amount'], 2) . ") exceeds category policy limit of ₹" . number_format((float) $category->policy_limit_amount, 2) . ".";
        }

        $status = $request->boolean('submit_now', false) ? 'submitted' : $expense->status;

        $expense->update([
            'expense_category_id' => $validated['expense_category_id'],
            'expense_date' => $validated['expense_date'],
            'amount' => $validated['amount'],
            'tax_amount' => $validated['tax_amount'] ?? 0.00,
            'tax_rate' => $validated['tax_rate'] ?? null,
            'tax_invoice_number' => $validated['tax_invoice_number'] ?? null,
            'vendor_name' => $validated['vendor_name'] ?? null,
            'business_purpose' => $validated['business_purpose'],
            'cost_center' => $validated['cost_center'] ?? null,
            'project_name' => $validated['project_name'] ?? null,
            'payment_method' => $validated['payment_method'],
            'status' => $status,
            'policy_violation_flag' => $policyViolation,
            'violation_reason' => $violationReason,
        ]);

        return redirect()->route('expenses.show', $expense->id)->with('success', 'Expense claim updated successfully.');
    }

    /**
     * Submit draft claim
     */
    public function submit(ExpenseClaim $expense)
    {
        $user = auth()->user();
        if ($user->isEmployee() && $expense->employee_id !== $user->employee_id) {
            abort(403, 'Unauthorized.');
        }

        $expense->update([
            'status' => 'submitted',
        ]);

        return redirect()->back()->with('success', 'Expense claim submitted for approval.');
    }

    /**
     * Step 28: Manager Review & Approval
     */
    public function managerApprove(Request $request, ExpenseClaim $expense)
    {
        $user = auth()->user();
        [$canApprove, $reason] = $this->canUserApproveClaim($user, $expense);
        if (!$canApprove) {
            return back()->with('error', $reason ?: 'Unauthorized.');
        }

        $validated = $request->validate([
            'manager_comments' => 'nullable|string|max:1000',
        ]);

        $expense->update([
            'status' => 'manager_approved',
            'manager_id' => $user->id,
            'manager_approved_at' => now(),
            'manager_comments' => $validated['manager_comments'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Expense claim verified and approved.');
    }

    /**
     * Step 30: Manager Rejection
     */
    public function managerReject(Request $request, ExpenseClaim $expense)
    {
        $user = auth()->user();
        [$canApprove, $reason] = $this->canUserApproveClaim($user, $expense);
        if (!$canApprove) {
            return back()->with('error', $reason ?: 'Unauthorized.');
        }

        $validated = $request->validate([
            'manager_comments' => 'required|string|max:1000',
        ]);

        $expense->update([
            'status' => 'rejected',
            'manager_id' => $user->id,
            'manager_comments' => $validated['manager_comments'],
            'is_locked' => true,
        ]);

        return redirect()->back()->with('success', 'Expense claim rejected.');
    }

    /**
     * Step 30: Return to Employee with comments
     */
    public function returnToEmployee(Request $request, ExpenseClaim $expense)
    {
        $user = auth()->user();
        [$canApprove, $reason] = $this->canUserApproveClaim($user, $expense);
        if (!$canApprove) {
            return back()->with('error', $reason ?: 'Unauthorized.');
        }

        $validated = $request->validate([
            'comments' => 'required|string|max:1000',
        ]);

        $expense->update([
            'status' => 'returned_to_employee',
            'manager_comments' => $validated['comments'],
        ]);

        return redirect()->back()->with('success', 'Claim returned to employee for necessary corrections.');
    }

    /**
     * Alias for return route
     */
    public function returnClaim(Request $request, ExpenseClaim $expense)
    {
        return $this->returnToEmployee($request, $expense);
    }

    /**
     * Step 29: Finance Review & Approval
     */
    public function financeApprove(Request $request, ExpenseClaim $expense)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('approve-expenses-finance')) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'reimbursement_method' => 'required|in:payroll,direct_payment,accounts_payable',
            'finance_comments' => 'nullable|string|max:1000',
            'tax_amount' => 'nullable|numeric|min:0',
        ]);

        $expense->update([
            'status' => 'finance_approved',
            'finance_reviewer_id' => $user->id,
            'finance_reviewed_at' => now(),
            'reimbursement_method' => $validated['reimbursement_method'],
            'finance_comments' => $validated['finance_comments'] ?? null,
            'tax_amount' => $validated['tax_amount'] ?? $expense->tax_amount,
        ]);

        return redirect()->back()->with('success', 'Expense claim approved by finance for reimbursement.');
    }

    /**
     * Step 30: Finance Rejection
     */
    public function financeReject(Request $request, ExpenseClaim $expense)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('approve-expenses-finance')) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'finance_comments' => 'required|string|max:1000',
        ]);

        $expense->update([
            'status' => 'rejected',
            'finance_reviewer_id' => $user->id,
            'finance_comments' => $validated['finance_comments'],
            'is_locked' => true,
        ]);

        return redirect()->back()->with('success', 'Expense claim rejected by finance.');
    }

    /**
     * Step 32: Direct Payment Processing
     */
    public function processPayment(Request $request, ExpenseClaim $expense)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('approve-expenses-finance')) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'payment_reference' => 'required|string|max:255',
            'paid_at' => 'required|date',
        ]);

        $expense->update([
            'reimbursement_status' => 'paid',
            'paid_at' => $validated['paid_at'],
            'paid_by' => $user->id,
            'payment_reference' => $validated['payment_reference'],
            'is_locked' => true,
        ]);

        return redirect()->back()->with('success', 'Expense reimbursement payment recorded successfully.');
    }

    public function destroy(ExpenseClaim $expense)
    {
        $user = auth()->user();
        if ($user->isEmployee() && $expense->employee_id !== $user->employee_id) {
            abort(403, 'Unauthorized.');
        }

        if (!in_array($expense->status, ['draft', 'returned_to_employee'])) {
            return redirect()->back()->with('error', 'Cannot delete submitted or processed claims.');
        }

        if ($expense->receipt_path) {
            Storage::disk('public')->delete($expense->receipt_path);
        }

        $expense->delete();
        return redirect()->route('expenses.index')->with('success', 'Expense claim deleted successfully.');
    }
}
