<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;
use App\Traits\Auditable;

class ExpenseClaim extends Model
{
    use BelongsToCompany, Auditable;

    protected $fillable = [
        'claim_number',
        'company_id',
        'employee_id',
        'department_id',
        'expense_category_id',
        'expense_date',
        'amount',
        'tax_amount',
        'tax_rate',
        'tax_invoice_number',
        'vendor_name',
        'business_purpose',
        'cost_center',
        'project_name',
        'payment_method',
        'receipt_path',
        'status',
        'manager_id',
        'manager_approved_at',
        'manager_comments',
        'finance_reviewer_id',
        'finance_reviewed_at',
        'finance_comments',
        'reimbursement_method',
        'reimbursement_status',
        'salary_posting_id',
        'paid_at',
        'paid_by',
        'payment_reference',
        'policy_violation_flag',
        'violation_reason',
        'is_locked',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'policy_violation_flag' => 'boolean',
        'is_locked' => 'boolean',
        'manager_approved_at' => 'datetime',
        'finance_reviewed_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function getRouteKeyName()
    {
        return 'claim_number';
    }

    public function getRouteKey()
    {
        return $this->claim_number ?: $this->getKey();
    }

    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where('claim_number', $value)
            ->orWhere('id', $value)
            ->first() ?? abort(404);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function category()
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function financeReviewer()
    {
        return $this->belongsTo(User::class, 'finance_reviewer_id');
    }

    public function salaryPosting()
    {
        return $this->belongsTo(SalaryPosting::class);
    }

    public function payer()
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    // Scopes for workflow stages
    public function scopeSubmitted($query)
    {
        return $query->where('status', 'submitted');
    }

    public function scopeManagerApproved($query)
    {
        return $query->where('status', 'manager_approved');
    }

    public function scopeFinanceApproved($query)
    {
        return $query->where('status', 'finance_approved');
    }

    public function scopePendingReimbursement($query)
    {
        return $query->where('status', 'finance_approved')
            ->where('reimbursement_status', 'pending');
    }

    public function scopeReimbursableThroughPayroll($query)
    {
        return $query->where('status', 'finance_approved')
            ->where('reimbursement_method', 'payroll')
            ->where('reimbursement_status', 'pending');
    }

    public function scopeViolations($query)
    {
        return $query->where('policy_violation_flag', true);
    }
}
