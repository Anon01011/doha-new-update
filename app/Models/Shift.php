<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    protected $fillable = [
        'name',
    ];

    // Note: EmployeeShift model doesn't exist - relationship removed
    // public function employeeShifts()
    // {
    //     return $this->hasMany(EmployeeShift::class);
    // }
    
    public function attendances()
    {
        return $this->hasMany(EmployeeAttendance::class);
    }
}
