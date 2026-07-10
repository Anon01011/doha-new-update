<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\Employee;
use App\Models\Company;
use App\Models\DropdownOption;
use App\Models\Setting;
use App\Models\User;
use App\Mail\LoanNotificationMail;
use App\Notifications\LoanInstallmentPaidAdmin;
use App\Notifications\LoanStatusUpdated;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LoanController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');
        $search = $request->query('search');
        $query = Loan::with('employee');

        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('view-loans')) {
             // Default behavior for employees is to see their own
        }

        // Global multi-tenancy scope handles branch isolation automatically.

        // Role-based filtering (additional to global scope)
        if ($user->isEmployee() && $user->employee_id) {
            // Employees see only their own loans
            $query->where('employee_id', $user->employee_id);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('loan_type', 'like', "%{$search}%")
                    ->orWhere('purpose', 'like', "%{$search}%")
                    ->orWhereHas('employee', function ($emp) use ($search) {
                        $emp->where('name', 'like', "%{$search}%")
                            ->orWhere('employee_code', 'like', "%{$search}%");
                    });
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        $loans = $query->latest()->paginate(10);
        return Inertia::render('Loan/Index', [
            'loans' => $loans,
            'status' => $status,
            'search' => $search,
            'userRole' => $user->role,
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('create-loans')) {
             // Employees can usually create for themselves
        }

        // Role-based employee selection (Global scope handles branch isolation)
        $empQuery = Employee::query()->orderBy('name');

        if ($user->isEmployee() && $user->employee_id) {
            $empQuery->where('id', $user->employee_id);
        }

        $employees = $empQuery->get(['id', 'name', 'employee_code', 'employee_image', 'designation']);

        $loanTypes = DropdownOption::where('category', 'Loan Type')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->pluck('value');

        return Inertia::render('Loan/Create', [
            'employees' => $employees,
            'loanTypes' => $loanTypes,
            'userRole' => $user->role,
            'authEmployeeId' => $user->employee_id,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'loan_type' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'interest_rate' => 'nullable|numeric|min:0|max:100',
            'tenure_months' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'purpose' => 'nullable|string',
            'remarks' => 'nullable|string',
            'repayment_method' => 'nullable|string|in:salary_deduction,manual',
        ]);

        // Employees can only create loans for themselves.
        // BelongsToCompany handles multi-tenancy for managers/admins.
        if ($user->isEmployee() && $user->employee_id) {
            $validated['employee_id'] = $user->employee_id;
            $validated['interest_rate'] = 0; // Default interest 0 for employee requests
        } else {
            $validated['interest_rate'] = $validated['interest_rate'] ?? 0;
        }

        // Check Loan Limits
        $employee = Employee::findOrFail($validated['employee_id']);
        $companyId = $employee->company_id;
        $maxAmount = Setting::get('max_loan_amount', 0, $companyId);
        $maxActiveLoans = Setting::get('maximum_active_loans', 0, $companyId);

        if ($maxAmount > 0 && $validated['amount'] > $maxAmount) {
            return back()->with('error', "Loan amount exceeds the maximum limit of {$maxAmount}.");
        }

        if ($maxActiveLoans > 0) {
            $activeLoans = Loan::where('employee_id', $validated['employee_id'])
                ->whereIn('status', ['pending', 'approved', 'disbursed'])
                ->count();
            if ($activeLoans >= $maxActiveLoans) {
                return back()->with('error', "Employee has reached the maximum active loans limit of {$maxActiveLoans}.");
            }
        }

        // Calculate monthly installment
        $principal = $validated['amount'];
        $rate = ($validated['interest_rate'] ?? 0) / 100 / 12; // Monthly interest rate
        $months = $validated['tenure_months'];

        if ($rate > 0) {
            $monthlyInstallment = ($principal * $rate * pow(1 + $rate, $months)) / (pow(1 + $rate, $months) - 1);
        } else {
            $monthlyInstallment = $principal / $months;
        }

        $validated['monthly_installment'] = round($monthlyInstallment, 2);
        $validated['repayment_method'] = $validated['repayment_method'] ?? 'salary_deduction';
        $validated['status'] = 'pending';

        $loan = Loan::create($validated);
        
        // Notify Admins
        $admins = \App\Models\User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            $admin->notify(new \App\Notifications\LoanRequested($loan, $employee->name));
        }

        return redirect()->route('loans.index')->with('success', 'Loan request created successfully!');
    }

    public function show(Loan $loan)
    {
        $user = auth()->user();
        if ($user->role === 'employee' && $loan->employee_id != $user->employee_id) {
            abort(403, 'Unauthorized access.');
        }

        $loan->load('employee', 'approver', 'installments');
        return Inertia::render('Loan/Show', [
            'loan' => $loan,
            'userRole' => $user->role,
        ]);
    }

    public function edit(Loan $loan)
    {
        $user = auth()->user();
        if ($user->isEmployee()) {
            if ($loan->employee_id != $user->employee_id) {
                abort(403, 'Unauthorized access.');
            }
            if ($loan->status !== 'pending') {
                abort(403, 'You cannot edit a loan request that is already processed.');
            }
        }

        $empQuery = Employee::query()->orderBy('name');
        if ($user->isEmployee() && $user->employee_id) {
            $empQuery->where('id', $loan->employee_id);
        }
        $employees = $empQuery->get(['id', 'name', 'employee_code']);
        $loanTypes = DropdownOption::where('category', 'Loan Type')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->pluck('value');

        return Inertia::render('Loan/Edit', [
            'loan' => $loan,
            'employees' => $employees,
            'loanTypes' => $loanTypes,
            'userRole' => $user->role,
        ]);
    }

    public function update(Request $request, Loan $loan)
    {
        $user = auth()->user();
        if ($user->isEmployee()) {
            if ($loan->employee_id != $user->employee_id) {
                abort(403, 'Unauthorized access.');
            }
            if ($loan->status !== 'pending') {
                abort(403, 'You cannot update a loan request that is already processed.');
            }
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'loan_type' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'interest_rate' => 'required|numeric|min:0|max:100',
            'tenure_months' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'purpose' => 'nullable|string',
            'remarks' => 'nullable|string',
            'repayment_method' => 'nullable|string|in:salary_deduction,manual',
        ]);

        // Recalculate monthly installment if amount, rate, or tenure changed
        if (
            $loan->amount != $validated['amount'] ||
            $loan->interest_rate != ($validated['interest_rate'] ?? 0) ||
            $loan->tenure_months != $validated['tenure_months']
        ) {

            $principal = $validated['amount'];
            $rate = ($validated['interest_rate'] ?? 0) / 100 / 12;
            $months = $validated['tenure_months'];

            if ($rate > 0) {
                $monthlyInstallment = ($principal * $rate * pow(1 + $rate, $months)) / (pow(1 + $rate, $months) - 1);
            } else {
                $monthlyInstallment = $principal / $months;
            }

            $validated['monthly_installment'] = round($monthlyInstallment, 2);
        }

        $loan->update($validated);
        return redirect()->route('loans.show', $loan)->with('success', 'Loan updated successfully!');
    }

    public function destroy(Loan $loan)
    {
        $user = auth()->user();
        if ($user->role === 'employee') {
            if ($loan->employee_id != $user->employee_id) {
                abort(403, 'Unauthorized access.');
            }
            if ($loan->status !== 'pending') {
                abort(403, 'You cannot delete a loan request that is already processed.');
            }
        }

        $loan->delete();
        return redirect()->route('loans.index')->with('success', 'Loan deleted successfully!');
    }

    public function approve(Request $request, Loan $loan)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('approve-loans')) {
            abort(403, 'Unauthorized. Only admin and HR (or those with permission) can approve loans.');
        }

        $loan->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        // Generate installments
        $this->generateInstallments($loan);

        $this->notifyEmployee($loan->employee_id, new \App\Notifications\LoanStatusUpdated($loan, 'approved'));

        return redirect()->back()->with('success', 'Loan approved and installments generated!');
    }

    public function disburse(Request $request, Loan $loan)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('disburse-loans')) {
            abort(403, 'Unauthorized. Only admin and HR (or those with permission) can disburse loans.');
        }

        if ($loan->status !== 'approved') {
            return redirect()->back()->with('error', 'Loan must be approved before disbursement.');
        }

        $loan->update([
            'status'       => 'disbursed',
            'disbursed_at' => now(),
        ]);

        $loan->refresh();
        $employee = Employee::with('company')->find($loan->employee_id);
        $company  = $employee?->company ?? Company::find($employee?->company_id);

        // -- Notify employee via Laravel notification (database) --
        $this->notifyEmployee($loan->employee_id, new LoanStatusUpdated($loan, 'disbursed'));

        if ($employee && $company) {
            $sendEmail    = Setting::get('loan_send_email', true, $company->id);
            $sendWhatsapp = Setting::get('loan_send_whatsapp', false, $company->id);

            // -- Email --
            try {
                if ($sendEmail && !empty($employee->email)) {
                    Mail::to($employee->email)->queue(
                        new LoanNotificationMail($employee, $loan, $company, 'disbursed')
                    );
                }
            } catch (\Exception $e) {
                Log::error('Loan disburse email failed: ' . $e->getMessage());
            }

            // -- WhatsApp --
            try {
                if ($sendWhatsapp && !empty($employee->mobile)) {
                    $waService = new WhatsAppService();
                    $waService->sendLoanNotification($employee, $company, $loan, 'disbursed');
                }
            } catch (\Exception $e) {
                Log::error('Loan disburse WhatsApp failed: ' . $e->getMessage());
            }

            // -- SMS (always checks loan_send_sms internally) --
            try {
                $this->sendLoanSms($employee, $company, $loan, 'disbursed');
            } catch (\Exception $e) {
                Log::error('Loan disburse SMS failed: ' . $e->getMessage());
            }
        }

        return redirect()->back()->with('success', 'Loan disbursed successfully!');
    }

    public function reject(Request $request, Loan $loan)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('approve-loans')) {
            abort(403, 'Unauthorized. Only admin and HR (or those with permission) can reject loans.');
        }

        $loan->update([
            'status' => 'rejected',
            'remarks' => $request->remarks ? $loan->remarks . "\nRejection Reason: " . $request->remarks : $loan->remarks,
        ]);

        $this->notifyEmployee($loan->employee_id, new \App\Notifications\LoanStatusUpdated($loan, 'rejected'));

        return redirect()->back()->with('success', 'Loan request rejected.');
    }

    public function generateInstallments(Loan $loan)
    {
        // Delete existing installments if any
        $loan->installments()->delete();

        $installments = [];
        $startDate = \Carbon\Carbon::parse($loan->start_date);
        $totalExpected = round($loan->monthly_installment * $loan->tenure_months, 2);
        $cumulative = 0;

        for ($i = 1; $i <= $loan->tenure_months; $i++) {
            $dueDate = $startDate->copy()->addMonths($i);
            $amount = $loan->monthly_installment;

            // Adjust last installment to match total expected exactly
            if ($i == $loan->tenure_months) {
                $amount = round($totalExpected - $cumulative, 2);
            }

            $installments[] = [
                'loan_id' => $loan->id,
                'installment_number' => $i,
                'due_date' => $dueDate->toDateString(),
                'amount' => $amount,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $cumulative += $amount;
        }

    \App\Models\LoanInstallment::insert($installments);
    }

    public function payInstallment(\App\Models\LoanInstallment $installment)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('disburse-loans')) {
            abort(403, 'Unauthorized. Only admin and HR (or those with permission) can mark installments as paid.');
        }

        $isLate = now()->startOfDay()->gt(\Carbon\Carbon::parse($installment->due_date));
        $installment->update([
            'status'      => 'paid',
            'paid_amount' => $installment->amount,
            'paid_date'   => now(),
            'remarks'     => $isLate
                ? ($installment->remarks ? $installment->remarks . ' (Late Payment)' : 'Late Payment')
                : $installment->remarks,
        ]);

        $loan     = $installment->loan;
        $loan->refresh();
        $employee = Employee::with('company')->find($loan->employee_id);
        $company  = $employee?->company ?? Company::find($employee?->company_id);

        // Check if all installments are paid to complete the loan
        $allPaid = $loan->installments()->where('status', '!=', 'paid')->count() === 0;
        if ($allPaid) {
            $loan->update(['status' => 'completed']);
            $loan->refresh();
            $this->notifyEmployee($loan->employee_id, new LoanStatusUpdated($loan, 'completed'));

            if ($employee && $company) {
                $sendEmail    = Setting::get('loan_send_email', true, $company->id);
                $sendWhatsapp = Setting::get('loan_send_whatsapp', false, $company->id);

                try {
                    if ($sendEmail && !empty($employee->email)) {
                        Mail::to($employee->email)->queue(
                            new LoanNotificationMail($employee, $loan, $company, 'completed', (float) $installment->amount)
                        );
                    }
                } catch (\Exception $e) {
                    Log::error('Loan completed email failed: ' . $e->getMessage());
                }

                try {
                    if ($sendWhatsapp && !empty($employee->mobile)) {
                        $waService = new WhatsAppService();
                        $waService->sendLoanNotification($employee, $company, $loan, 'completed', (float) $installment->amount);
                    }
                } catch (\Exception $e) {
                    Log::error('Loan completed WhatsApp failed: ' . $e->getMessage());
                }

                try {
                    $this->sendLoanSms($employee, $company, $loan, 'completed', (float) $installment->amount);
                } catch (\Exception $e) {
                    Log::error('Loan completed SMS failed: ' . $e->getMessage());
                }
            }
        } else {
            // Installment paid notification to employee
            $this->notifyEmployee($loan->employee_id, new LoanStatusUpdated($loan, 'installment_paid'));

            if ($employee && $company) {
                $sendEmail    = Setting::get('loan_send_email', true, $company->id);
                $sendWhatsapp = Setting::get('loan_send_whatsapp', false, $company->id);

                try {
                    if ($sendEmail && !empty($employee->email)) {
                        Mail::to($employee->email)->queue(
                            new LoanNotificationMail($employee, $loan, $company, 'installment_paid', (float) $installment->amount)
                        );
                    }
                } catch (\Exception $e) {
                    Log::error('Loan installment email failed: ' . $e->getMessage());
                }

                try {
                    if ($sendWhatsapp && !empty($employee->mobile)) {
                        $waService = new WhatsAppService();
                        $waService->sendLoanNotification($employee, $company, $loan, 'installment_paid', (float) $installment->amount);
                    }
                } catch (\Exception $e) {
                    Log::error('Loan installment WhatsApp failed: ' . $e->getMessage());
                }

                try {
                    $this->sendLoanSms($employee, $company, $loan, 'installment_paid', (float) $installment->amount);
                } catch (\Exception $e) {
                    Log::error('Loan installment SMS failed: ' . $e->getMessage());
                }
            }
        }

        // -- Dashboard notification to matching HR/Admin/Managers in same branch/dept --
        if ($employee) {
            try {
                $adminNotification = new LoanInstallmentPaidAdmin(
                    $loan,
                    $employee,
                    (float) $installment->amount,
                    $installment->installment_number
                );

                // Find admins in the same company (branch)
                $adminUsers = User::where('company_id', $employee->company_id)
                    ->whereIn('role', ['admin', 'hr', 'manager', 'hr manager', 'super admin', 'system admin'])
                    ->get();

                // Also check users whose employee record is in same company + department
                $deptEmployeeIds = Employee::where('company_id', $employee->company_id)
                    ->where('department_id', $employee->department_id)
                    ->pluck('id');

                $deptAdminUsers = User::whereIn('employee_id', $deptEmployeeIds)
                    ->whereIn('role', ['admin', 'hr', 'manager', 'hr manager', 'super admin', 'system admin'])
                    ->get();

                $allAdmins = $adminUsers->merge($deptAdminUsers)->unique('id');

                foreach ($allAdmins as $adminUser) {
                    try {
                        $adminUser->notify($adminNotification);
                    } catch (\Exception $e) {
                        Log::error('Admin loan notification failed for user ' . $adminUser->id . ': ' . $e->getMessage());
                    }
                }
            } catch (\Exception $e) {
                Log::error('Loan admin dashboard notification failed: ' . $e->getMessage());
            }
        }

        return redirect()->back()->with('success', 'Installment marked as paid.');
    }
    /**
     * Helper to notify user
     */
    private function notifyUser($userId, $notification)
    {
        $user = User::find($userId);
        if ($user) {
            try {
                $user->notify($notification);
            } catch (\Exception $e) {
                Log::error('Notification failed: ' . $e->getMessage());
            }
        }
    }

    /**
     * Helper to notify employee
     */
    private function notifyEmployee($employeeId, $notification)
    {
        $employee = Employee::find($employeeId);
        if ($employee && $employee->user) {
            $this->notifyUser($employee->user->id, $notification);
        }
    }

    /**
     * Send a simple SMS notification for loan events.
     * Reads SMS credentials from Settings (same pattern as the roster SMS).
     */
    private function sendLoanSms($employee, $company, $loan, string $type, float $installmentAmount = 0): void
    {
        $companyId = $company->id;
        $sendSms   = Setting::get('loan_send_sms', false, $companyId);
        if (!$sendSms || empty($employee->mobile)) {
            return;
        }

        $mobile = preg_replace('/[^0-9]/', '', $employee->mobile);
        if (empty($mobile)) return;

        $amount  = number_format($loan->amount, 2);
        $instAmt = number_format($installmentAmount, 2);

        switch ($type) {
            case 'disbursed':
                $message = "Dear {$employee->name}, your loan of {$amount} has been disbursed by {$company->name}. Contact HR for details.";
                break;
            case 'installment_paid':
                $message = "Dear {$employee->name}, your loan installment of {$instAmt} has been paid on " . now()->format('d M Y') . ". Contact HR for details.";
                break;
            case 'completed':
                $message = "Congratulations {$employee->name}! Your loan of {$amount} with {$company->name} is now fully repaid. Thank you!";
                break;
            default:
                $message = "Dear {$employee->name}, your loan status has been updated. Contact HR for details.";
        }

        $smsUrl    = Setting::get('sms_api_url', null, $companyId);
        $smsToken  = Setting::get('sms_api_token', null, $companyId);
        $smsSender = Setting::get('sms_sender_id', null, $companyId);

        if (!$smsUrl || !$smsToken) {
            Log::info('Loan SMS not configured, skipping.', ['employee' => $employee->name, 'type' => $type]);
            return;
        }

        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'Bearer ' . $smsToken,
                'Content-Type'  => 'application/json',
            ])->post($smsUrl, [
                'to'      => $mobile,
                'from'    => $smsSender,
                'message' => $message,
            ]);

            if ($response->successful()) {
                Log::info("Loan SMS sent to {$employee->name} ({$type})");
            } else {
                Log::error("Loan SMS failed for {$employee->name}: " . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('Loan SMS exception: ' . $e->getMessage());
        }
    }
}
