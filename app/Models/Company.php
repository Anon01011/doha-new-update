<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// This model represents a Branch (formerly Company)
class Company extends Model
{
    use \App\Traits\BelongsToCompany;
    protected $fillable = [
        'name',
        'address',
        'phone',
        'email',
        'website',
        'weekly_off_days',
    ];

    protected $casts = [
        'weekly_off_days' => 'array',
    ];

    // Note: EmployeeShift model doesn't exist - using ShiftRoster instead
    // public function employeeShifts()
    // {
    //     return $this->hasMany(EmployeeShift::class);
    // }

    public function shiftRosters()
    {
        return $this->hasMany(ShiftRoster::class);
    }

    public function employees()
    {
        return $this->hasMany(\App\Models\Employee::class, 'company_id');
    }

    public function departments()
    {
        return $this->belongsToMany(\App\Models\Department::class, 'company_department');
    }
}
