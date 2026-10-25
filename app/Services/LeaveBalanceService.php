<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class LeaveBalanceService
{
    /**
     * Get or calculate and sync leave balances for an employee for a given year.
     *
     * - Annual quota allocated each year per LeaveType max_days_per_year.
     * - If carry_forward_allowed is true, any unused/remaining days from the
     *   previous year (up to carry_forward_max_days) are carried forward.
     * - Total days = annual quota + carry forward days.
     * - Used days = approved leave requests in the current year.
     * - Remaining days = total days - used days.
     */
    public static function getOrSyncBalancesForEmployee(Employee $employee, ?int $year = null): Collection
    {
        $year = $year ?: (int) now()->year;

        // Fetch applicable active leave types for this employee
        $leaveTypes = LeaveType::withoutGlobalScopes()
            ->where('is_active', true)
            ->where(function ($q) use ($employee) {
                $q->whereNull('company_id');
                if ($employee->company_id) {
                    $q->orWhere('company_id', $employee->company_id);
                }
            })
            ->get();

        $balances = collect();

        foreach ($leaveTypes as $leaveType) {
            $balances->push(self::syncBalanceForType($employee, $leaveType, $year));
        }

        return $balances;
    }

    /**
     * Sync single leave balance for employee, leave type and year.
     */
    public static function syncBalanceForType(Employee $employee, LeaveType $leaveType, int $year): LeaveBalance
    {
        $annualQuota = (float) ($leaveType->max_days_per_year ?? 0);
        $carryForwardDays = 0.0;

        // Carry forward logic: only if enabled on the leave type
        if ($leaveType->carry_forward_allowed) {
            $prevYear = $year - 1;

            // Check if previous year balance already exists
            $prevBalance = LeaveBalance::where('employee_id', $employee->id)
                ->where('leave_type_id', $leaveType->id)
                ->where('year', $prevYear)
                ->first();

            if ($prevBalance) {
                $prevRemaining = (float) $prevBalance->remaining_days;
            } else {
                // If previous balance not in DB, calculate if employee was already joined
                $joinedDate = $employee->joined_date ? Carbon::parse($employee->joined_date) : null;
                if ($joinedDate && $joinedDate->year <= $prevYear) {
                    $prevUsed = (float) LeaveRequest::where('employee_id', $employee->id)
                        ->where('leave_type_id', $leaveType->id)
                        ->whereYear('start_date', $prevYear)
                        ->where('status', 'approved')
                        ->sum('days_requested');

                    $prevRemaining = max(0.0, $annualQuota - $prevUsed);
                } else {
                    $prevRemaining = 0.0;
                }
            }

            if ($prevRemaining > 0) {
                if ($leaveType->carry_forward_max_days !== null && $leaveType->carry_forward_max_days > 0) {
                    $carryForwardDays = min($prevRemaining, (float) $leaveType->carry_forward_max_days);
                } else {
                    $carryForwardDays = $prevRemaining;
                }
            }
        }

        $totalDays = $annualQuota + $carryForwardDays;

        // Calculate actual approved used days in $year
        $usedDays = (float) LeaveRequest::where('employee_id', $employee->id)
            ->where('leave_type_id', $leaveType->id)
            ->whereYear('start_date', $year)
            ->where('status', 'approved')
            ->sum('days_requested');

        $remainingDays = max(0.0, $totalDays - $usedDays);

        $balance = LeaveBalance::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'leave_type_id' => $leaveType->id,
                'year' => $year,
            ],
            [
                'total_days' => $totalDays,
                'used_days' => $usedDays,
                'remaining_days' => $remainingDays,
                'carry_forward_days' => $carryForwardDays,
            ]
        );

        $balance->setRelation('leaveType', $leaveType);

        return $balance;
    }
}
