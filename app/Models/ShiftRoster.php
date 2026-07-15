<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class ShiftRoster extends Model
{
    use \App\Traits\BelongsToCompany;

    protected $fillable = [
        'employee_id',
        'company_id',
        'week_start',
        'day',
        'shift_time',
        'shift_type',
        'designation',
        'notes',
    ];

    protected $appends = [
        'shift_duration',
    ];

    protected $casts = [
        'week_start' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the employee that owns the roster entry.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the company that owns the roster entry.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Scope to filter by company
     */
    public function scopeForCompany($query, $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    /**
     * Scope to filter by week start date
     */
    public function scopeForWeek($query, $weekStart)
    {
        return $query->where('week_start', $weekStart);
    }

    /**
     * Scope to filter by date range
     */
    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('week_start', [$startDate, $endDate]);
    }

    /**
     * Scope to filter by employee
     */
    public function scopeForEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    /**
     * Scope to filter by day of week
     */
    public function scopeForDay($query, $day)
    {
        return $query->where('day', $day);
    }

    /**
     * Get the actual date for this roster entry
     */
    public function getActualDateAttribute()
    {
        $weekStart = Carbon::parse($this->week_start);
        $dayMap = [
            'Monday' => 0,
            'Tuesday' => 1,
            'Wednesday' => 2,
            'Thursday' => 3,
            'Friday' => 4,
            'Saturday' => 5,
            'Sunday' => 6,
        ];

        $dayOffset = $dayMap[$this->day] ?? 0;
        return $weekStart->copy()->addDays($dayOffset);
    }

    /**
     * Get formatted shift time
     */
    public function getFormattedShiftTimeAttribute()
    {
        return $this->shift_time ?: 'No shift assigned';
    }

    /**
     * Check if this is a valid roster entry
     */
    public function getIsValidAttribute()
    {
        return !empty($this->shift_time) &&
            !empty($this->employee_id) &&
            !empty($this->company_id) &&
            !empty($this->week_start) &&
            !empty($this->day);
    }

    /**
     * Get the start time of the shift as a Carbon instance
     */
    public function getShiftStartTimeAttribute()
    {
        if (empty($this->shift_time)) {
            return null;
        }

        $timePattern = '/(\d{1,2}):?(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):?(\d{2})\s*(AM|PM)/i';
        if (preg_match($timePattern, $this->shift_time, $matches)) {
            $startHour = intval($matches[1]);
            $startMinute = intval($matches[2]);
            $startPeriod = strtoupper($matches[3]);

            if ($startPeriod === 'PM' && $startHour !== 12)
                $startHour += 12;
            if ($startPeriod === 'AM' && $startHour === 12)
                $startHour = 0;

            // Use explicitly configured company timezone, fallback to app default
            // This is robust for both web requests (where middleware runs) 
            // and background jobs (where middleware might not run)
            $timezone = \App\Models\Setting::get('app_timezone', config('app.timezone'), $this->company_id);

            return now($timezone)->setTime($startHour, $startMinute, 0);
        }

        return null;
    }

    /**
     * Get the end time of the shift as a Carbon instance
     */
    public function getShiftEndTimeAttribute()
    {
        if (empty($this->shift_time)) {
            return null;
        }

        $timePattern = '/(\d{1,2}):?(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):?(\d{2})\s*(AM|PM)/i';
        if (preg_match($timePattern, $this->shift_time, $matches)) {
            $startHour = intval($matches[1]);
            $startMinute = intval($matches[2]);
            $startPeriod = strtoupper($matches[3]);
            $endHour = intval($matches[4]);
            $endMinute = intval($matches[5]);
            $endPeriod = strtoupper($matches[6]);

            if ($startPeriod === 'PM' && $startHour !== 12)
                $startHour += 12;
            if ($startPeriod === 'AM' && $startHour === 12)
                $startHour = 0;
            if ($endPeriod === 'PM' && $endHour !== 12)
                $endHour += 12;
            if ($endPeriod === 'AM' && $endHour === 12)
                $endHour = 0;

            // Use explicitly configured company timezone
            $timezone = \App\Models\Setting::get('app_timezone', config('app.timezone'), $this->company_id);

            $startTime = now($timezone)->setTime($startHour, $startMinute, 0);
            $endTime = now($timezone)->setTime($endHour, $endMinute, 0);

            if ($endTime->lt($startTime)) {
                $endTime->addDay();
            }

            return $endTime;
        }

        return null;
    }

    /**
     * Get the duration of the shift (if time format allows)
     */
    public function getShiftDurationAttribute()
    {
        $startTime = $this->shift_start_time;
        $endTime = $this->shift_end_time;

        if ($startTime && $endTime) {
            return round($startTime->diffInMinutes($endTime, true) / 60, 2);
        }

        return null;
    }

    /**
     * Boot method to add model events
     */
    protected static function boot()
    {
        parent::boot();

        // Before saving, ensure data is properly formatted
        static::saving(function ($roster) {
            $roster->shift_time = trim($roster->shift_time);
            $roster->shift_type = trim($roster->shift_type) ?: null;
            $roster->designation = trim($roster->designation) ?: null;
            $roster->notes = trim($roster->notes) ?: null;
        });
    }

    /**
     * Check if this roster entry falls on the employee's weekly off day.
     * Uses WeeklyOffService: staff-wise first, then branch fallback.
     */
    public function isWeeklyOffDay(): bool
    {
        $actualDate = $this->actual_date;
        if (!$actualDate) {
            return false;
        }

        $employee = $this->relationLoaded('employee') ? $this->employee : $this->employee()->with(['weeklyOffs', 'company'])->first();
        if (!$employee) {
            return false;
        }

        return app(\App\Services\WeeklyOffService::class)->isWeeklyOff($employee, $actualDate);
    }
}