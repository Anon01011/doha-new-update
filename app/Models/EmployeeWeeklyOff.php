<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeWeeklyOff extends Model
{
    protected $table = 'employee_weekly_offs';

    protected $fillable = [
        'employee_id',
        'weekly_off_day',
        'effective_date',
    ];

    protected $casts = [
        'effective_date' => 'date:Y-m-d',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
