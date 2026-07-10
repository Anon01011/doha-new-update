<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\EmployeeWeeklyOff;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class WeeklyOffService
{
    /**
     * Get the resolved weekly off day names for a specific employee on a given date.
     * Priority: Staff-wise weekly off (with effective_date <= $date) > Branch weekly_off_days
     * Returns an array of day names e.g. ['Friday', 'Saturday']
     * Uses already-loaded 'weeklyOffs' relation if present (avoids extra DB hit).
     */
    public function getWeeklyOffDaysForEmployee(Employee $employee, $date): array
    {
        $date = Carbon::parse($date);
        $dateStr = $date->toDateString();

        // 1. Check staff-wise weekly off — use loaded relation if available
        if ($employee->relationLoaded('weeklyOffs')) {
            $staffOff = $employee->weeklyOffs
                ->filter(fn($w) => $w->effective_date && $w->effective_date->toDateString() <= $dateStr)
                ->sortByDesc(fn($w) => $w->effective_date->toDateString())
                ->first();
        } else {
            $staffOff = EmployeeWeeklyOff::where('employee_id', $employee->id)
                ->whereDate('effective_date', '<=', $dateStr)
                ->orderBy('effective_date', 'desc')
                ->first();
        }

        if ($staffOff) {
            return [$staffOff->weekly_off_day];
        }

        // 2. Fallback: branch-level weekly_off_days
        $company = $employee->relationLoaded('company') ? $employee->company : $employee->load('company')->company;
        if ($company && !empty($company->weekly_off_days) && is_array($company->weekly_off_days)) {
            return $company->weekly_off_days;
        }

        return [];
    }

    /**
     * Check whether a specific date is a weekly off for the given employee.
     */
    public function isWeeklyOff(Employee $employee, $date): bool
    {
        $date = Carbon::parse($date);
        $dayName = $date->format('l'); // e.g. "Friday"

        return in_array($dayName, $this->getWeeklyOffDaysForEmployee($employee, $date));
    }

    /**
     * Build a bulk map of weekly off days for many employees.
     * Returns [employee_id => ['days' => ['Friday', 'Saturday']]]
     * Efficient: loads all staff weekly offs in ONE query, then falls back per-employee.
     *
     * @param Collection $employees — must be eager-loaded with ['weeklyOffs', 'company']
     * @param Carbon $referenceDate  — used to resolve effective weekly offs
     */
    public function buildWeeklyOffMap(Collection $employees, Carbon $referenceDate = null): array
    {
        $map = [];

        // Pre-load all staff weekly offs in one query (no date constraint here so we can resolve dynamically for any date in the period)
        $employeeIds = $employees->pluck('id')->toArray();
        $staffOffs = EmployeeWeeklyOff::whereIn('employee_id', $employeeIds)
            ->orderBy('effective_date', 'desc')
            ->get()
            ->groupBy('employee_id');

        foreach ($employees as $employee) {
            $map[$employee->id] = [
                'staff_offs' => isset($staffOffs[$employee->id]) ? $staffOffs[$employee->id]->toArray() : [],
                'branch_offs' => $employee->company && !empty($employee->company->weekly_off_days) && is_array($employee->company->weekly_off_days)
                    ? $employee->company->weekly_off_days
                    : []
            ];
        }

        return $map;
    }

    /**
     * Check whether a given date falls on a weekly off for the given employee,
     * using a pre-built map (for performance in loops).
     */
    public function isWeeklyOffFromMap(int $employeeId, $date, array $weeklyOffMap): bool
    {
        if (!isset($weeklyOffMap[$employeeId])) {
            return false;
        }

        $dateStr = Carbon::parse($date)->toDateString();
        $dayName = Carbon::parse($date)->format('l');

        // 1. Find the active staff weekly off for this specific date
        $staffOffs = $weeklyOffMap[$employeeId]['staff_offs'] ?? [];
        $activeOff = null;
        foreach ($staffOffs as $off) {
            $effDate = is_string($off['effective_date']) ? substr($off['effective_date'], 0, 10) : $off['effective_date']->toDateString();
            if ($effDate <= $dateStr) {
                $activeOff = $off;
                break;
            }
        }

        if ($activeOff) {
            return $activeOff['weekly_off_day'] === $dayName;
        }

        // 2. Fallback to branch-level weekly off days
        return in_array($dayName, $weeklyOffMap[$employeeId]['branch_offs'] ?? []);
    }

    /**
     * Count weekly off days within a date range for a specific employee.
     * Used in payroll to exclude off days from absent deduction.
     * Caches resolved off-days for the month to avoid re-querying per day.
     */
    public function countWeeklyOffDaysInRange(Employee $employee, Carbon $startDate, Carbon $endDate): int
    {
        $count = 0;
        $current = $startDate->copy();

        while ($current->lte($endDate)) {
            if ($this->isWeeklyOff($employee, $current)) {
                $count++;
            }
            $current->addDay();
        }

        return $count;
    }
}
