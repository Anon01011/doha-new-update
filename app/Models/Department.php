<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use \App\Traits\BelongsToCompany;

    protected $fillable = [
        'name',
        'company_id',
        'status',
        'standard_working_hours',
        'working_days_per_month',
        'opening_time',
        'closing_time',
    ];

    protected $casts = [
        'standard_working_hours' => 'float',
        'working_days_per_month' => 'integer',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function companies()
    {
        return $this->belongsToMany(Company::class, 'company_department');
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    /**
     * Resolve effective daily working hours for this department.
     */
    public function getWorkingHours($companyId = null): float
    {
        if ($this->standard_working_hours && (float) $this->standard_working_hours > 0) {
            return (float) $this->standard_working_hours;
        }

        $cId = $companyId ?: $this->company_id;
        $settingHours = \App\Models\Setting::get('standard_working_hours', null, $cId, $this->id);
        if ($settingHours !== null && (float) $settingHours > 0) {
            return (float) $settingHours;
        }

        $payrollHours = \App\Models\Setting::get('default_working_hours_per_day', null, $cId, $this->id);
        if ($payrollHours !== null && (float) $payrollHours > 0) {
            return (float) $payrollHours;
        }

        return 8.0;
    }

    /**
     * Resolve effective working days per month for this department.
     */
    public function getWorkingDaysPerMonth($companyId = null): int
    {
        if ($this->working_days_per_month && (int) $this->working_days_per_month > 0) {
            return (int) $this->working_days_per_month;
        }

        $cId = $companyId ?: $this->company_id;
        return (int) \App\Models\Setting::get('default_working_days_per_month', 30, $cId, $this->id);
    }
}