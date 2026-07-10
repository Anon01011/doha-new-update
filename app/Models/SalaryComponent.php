<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalaryComponent extends Model
{
    use \App\Traits\BelongsToCompany;

    protected $fillable = [
        'company_id',
        'name',
        'type',
        'value_type',
        'is_taxable',
        'default_amount',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_taxable' => 'boolean',
        'default_amount' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function employeeSalaryStructures()
    {
        return $this->hasMany(EmployeeSalaryStructure::class);
    }
}
