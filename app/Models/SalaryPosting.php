<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Traits\Auditable;

class SalaryPosting extends Model
{
    use Auditable, \App\Traits\BelongsToEmployeeBranch;
    protected $fillable = [
        'employee_id',
        'month',
        'year',
        'basic_salary',
        'allowances',
        'deductions',
        'overtime_amount',
        'leave_deduction',
        'tax',
        'net_salary',
        'status',
        'posted_by',
        'posted_at',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'month' => 'integer',
        'year' => 'integer',
        'basic_salary' => 'decimal:2',
        'allowances' => 'array',
        'deductions' => 'array',
        'overtime_amount' => 'decimal:2',
        'leave_deduction' => 'decimal:2',
        'tax' => 'decimal:2',
        'net_salary' => 'decimal:2',
        'posted_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function poster()
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}


