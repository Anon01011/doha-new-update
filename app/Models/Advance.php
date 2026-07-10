<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;
use App\Models\User;

class Advance extends Model
{
    use Auditable, \App\Traits\BelongsToCompany;
    protected $fillable = [
        'employee_id',
        'company_id',
        'amount',
        'request_date',
        'purpose',
        'status',
        'approved_by',
        'approved_at',
        'repayment_date',
        'repaid_amount',
        'repaid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'request_date' => 'date',
        'approved_at' => 'datetime',
        'repayment_date' => 'date',
        'repaid_amount' => 'decimal:2',
        'repaid_at' => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}


