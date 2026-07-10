<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;
use App\Models\User;

class Loan extends Model
{
    use Auditable, \App\Traits\BelongsToCompany;
    protected $fillable = [
        'employee_id',
        'company_id',
        'loan_type',
        'amount',
        'interest_rate',
        'tenure_months',
        'monthly_installment',
        'start_date',
        'status',
        'approved_by',
        'approved_at',
        'disbursed_at',
        'completed_at',
        'purpose',
        'remarks',
        'repayment_method',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'tenure_months' => 'integer',
        'monthly_installment' => 'decimal:2',
        'start_date' => 'date',
        'approved_at' => 'datetime',
        'disbursed_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function installments()
    {
        return $this->hasMany(LoanInstallment::class);
    }
}


