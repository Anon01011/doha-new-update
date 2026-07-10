<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeAttendance extends Model
{
    use \App\Traits\BelongsToCompany;

    protected $fillable = [
        'employee_id',
        'company_id',
        'shift_id',
        'date',
        'from_time',
        'to_time',
        'hours_worked',
        'normal_hours',
        'ot',
        'ot_amt',
        'attendance',
        'is_paid',
        'reason',
        'current_break_start',
        'total_break_minutes',
        'break_history',
        'punches',
    ];

    protected $casts = [
        'break_history' => 'array',
        'current_break_start' => 'datetime',
        'punches' => 'array',
    ];

    /**
     * Calculate worked hours from punches JSON.
     */
    public function calculateFlexibleHours()
    {
        $punches = $this->punches ?: [];
        $totalMinutes = 0;
        $inTime = null;

        foreach ($punches as $punch) {
            if ($punch['type'] === 'in') {
                $inTime = \Carbon\Carbon::parse($punch['time']);
            } elseif ($punch['type'] === 'out' && $inTime) {
                $outTime = \Carbon\Carbon::parse($punch['time']);
                $totalMinutes += abs($outTime->timestamp - $inTime->timestamp) / 60;
                $inTime = null;
            }
        }

        return round($totalMinutes / 60, 2);
    }

    /**
     * Calculate break minutes from punches JSON.
     */
    public function calculateFlexibleBreaks()
    {
        $punches = $this->punches ?: [];
        $totalMinutes = 0;
        $outTime = null;

        foreach ($punches as $punch) {
            if ($punch['type'] === 'out') {
                $outTime = \Carbon\Carbon::parse($punch['time']);
            } elseif ($punch['type'] === 'in' && $outTime) {
                $inTime = \Carbon\Carbon::parse($punch['time']);
                $totalMinutes += abs($inTime->timestamp - $outTime->timestamp) / 60;
                $outTime = null;
            }
        }

        return round($totalMinutes);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function shift()
    {
        return $this->belongsTo(ShiftRoster::class, 'shift_id');
    }
}
