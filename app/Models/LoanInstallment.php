<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoanInstallment extends Model
{
    protected $fillable = [
        'loan_id',
        'installment_number',
        'due_date',
        'amount',
        'paid_amount',
        'paid_date',
        'status',
        'late_fee',
        'remarks',
    ];

    protected $casts = [
        'installment_number' => 'integer',
        'due_date' => 'date',
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'paid_date' => 'date',
        'late_fee' => 'decimal:2',
    ];

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }
}


