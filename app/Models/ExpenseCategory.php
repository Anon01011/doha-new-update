<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;

class ExpenseCategory extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'code',
        'description',
        'policy_limit_amount',
        'requires_receipt',
        'is_tax_deductible',
        'is_active',
    ];

    protected $casts = [
        'policy_limit_amount' => 'decimal:2',
        'requires_receipt' => 'boolean',
        'is_tax_deductible' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function claims()
    {
        return $this->hasMany(ExpenseClaim::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailableFor($query, $companyId = null)
    {
        return $query->where(function ($q) use ($companyId) {
            if ($companyId) {
                $q->where('company_id', $companyId)->orWhereNull('company_id');
            } else {
                $q->whereNull('company_id')->orWhereNotNull('company_id');
            }
        });
    }
}
