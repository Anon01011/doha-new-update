<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeSalaryStructure extends Model
{
    protected $fillable = [
        'employee_id',
        'component_id',
        'value_type',
        'amount',
        'effective_from',
        'effective_to',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function component()
    {
        return $this->belongsTo(SalaryComponent::class);
    }
}


