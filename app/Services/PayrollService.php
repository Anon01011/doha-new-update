<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\Holiday;
use App\Models\Setting;
use Carbon\Carbon;

class PayrollService
{
    protected WeeklyOffService $weeklyOffService;

    public function __construct(WeeklyOffService $weeklyOffService)
    {
        $this->weeklyOffService = $weeklyOffService;
    }

    public function calculateMonthlyPayroll($employeeId, $month, $year)
    {
        $employee = Employee::with(['salaryStructures.component', 'weeklyOffs', 'company'])
            ->findOrFail($employeeId);

        $companyId = $employee->company_id;

        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        // 1. Basic Salary — guard against null/0
        $basicSalary = (float) ($employee->basic_salary ?? 0);

        // 2. Allowances & Deductions from Salary Structure
        $allowances = [];
        $deductions = [];

        foreach ($employee->salaryStructures as $structure) {
            $component = $structure->component;

            $calculatedAmount = $structure->value_type === 'percentage'
                ? ($basicSalary * ($structure->amount / 100))
                : $structure->amount;

            if ($component->type === 'allowance') {
                $allowances[$component->name] = $calculatedAmount;
            } elseif ($component->type === 'deduction') {
                $deductions[$component->name] = $calculatedAmount;
            }
        }

        // 3. Count Weekly Off Days for this employee in this month
        $weeklyOffDaysCount = $this->weeklyOffService->countWeeklyOffDaysInRange(
            $employee, $startDate, $endDate
        );

        // 4. Count Holidays for this company in this month
        // Holiday model uses start_date/end_date (may span multiple days)
        $holidayCount = 0;
        $holidayDates = [];
        if ($employee->company_id) {
            $holidays = Holiday::where('company_id', $employee->company_id)
                ->where('start_date', '<=', $endDate->toDateString())
                ->where('end_date', '>=', $startDate->toDateString())
                ->get();

            foreach ($holidays as $holiday) {
                $hStart = max(Carbon::parse($holiday->start_date)->toDateString(), $startDate->toDateString());
                $hEnd   = min(Carbon::parse($holiday->end_date)->toDateString(),   $endDate->toDateString());
                $holidayCount += Carbon::parse($hStart)->diffInDays(Carbon::parse($hEnd)) + 1;

                $hCurrent = Carbon::parse($hStart);
                $hEndCarbon = Carbon::parse($hEnd);
                while ($hCurrent->lte($hEndCarbon)) {
                    $holidayDates[$hCurrent->toDateString()] = true;
                    $hCurrent->addDay();
                }
            }
        }

        // 5. Attendance Based Calculations
        $attendances = EmployeeAttendance::with('shift')->where('employee_id', $employeeId)
            ->whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
            ->get();

        $totalOtHours = 0;
        $overtimeAmount = 0;
        $totalAbsentDays = 0;

        $summary = [
            'present'     => 0,
            'absent'      => 0,
            'leave'       => 0,
            'weekly_off'  => 0,
            'half_day'    => 0,
        ];

        // Index attendance records by date for quick lookup
        $attendanceByDate = $attendances->keyBy(fn($a) => $a->date instanceof Carbon
            ? $a->date->toDateString()
            : (string) $a->date
        );

        $hourlyRate = $this->getHourlyRate($employee);

        // Iterate every calendar day in the month
        // Resolve off-days once (for the start of the month) — valid for a full payroll month
        $resolvedOffDayNames = $this->weeklyOffService->getWeeklyOffDaysForEmployee($employee, $startDate);
        $current = $startDate->copy();
        while ($current->lte($endDate)) {
            $dateStr = $current->toDateString();
            $attendance = $attendanceByDate[$dateStr] ?? null;

            // Weekly off takes highest priority (resolved from staff/branch)
            $isWeeklyOffDay = in_array($current->format('l'), $resolvedOffDayNames);

            if ($isWeeklyOffDay) {
                $summary['weekly_off']++;
            }

            $dailyOtHours = 0;
            if ($attendance) {
                $dailyOtHours = $attendance->ot ?? 0;
                $totalOtHours += $dailyOtHours;

                if (!$isWeeklyOffDay) {
                    $status = $attendance->attendance ?? '';
                    if ($status === 'Absent') {
                        $totalAbsentDays++;
                        $summary['absent']++;
                    } elseif ($status === 'Half Day') {
                        $totalAbsentDays += 0.5;
                        $summary['absent'] += 0.5;
                        $summary['present'] += 0.5;
                        $summary['half_day']++;
                    } elseif (in_array($status, ['Present', 'Late'])) {
                        $summary['present']++;
                    } elseif (in_array($status, ['Leave', 'Sick Leave', 'Annual Leave'])) {
                        $summary['leave']++;
                    } elseif ($status === 'Weekly Off') {
                        $summary['weekly_off']++;
                    }
                }
            } else {
                if (!$isWeeklyOffDay) {
                    if ($current->lte(now())) {
                        $totalAbsentDays++;
                        $summary['absent']++;
                    }
                }
            }

            // Calculate overtime for this day if hours exist
            if ($dailyOtHours > 0) {
                $otMode = Setting::get('overtime_calculation_mode', 'base_salary', $companyId);
                
                if ($otMode === 'none' || $otMode === 'no_overtime') {
                    $multiplier = 0;
                    $baseOtRate = 0;
                } else {
                    $isHoliday = isset($holidayDates[$dateStr]);
                    
                    // Resolve shift type
                    $shiftType = 'Day';
                    if ($attendance && $attendance->shift) {
                        $shiftType = $attendance->shift->shift_type;
                    } else {
                        $roster = \App\Models\ShiftRoster::where('employee_id', $employeeId)
                            ->where('day', $current->format('l'))
                            ->where('week_start', '<=', $dateStr)
                            ->orderBy('week_start', 'desc')
                            ->first();
                        if ($roster) {
                            $shiftType = $roster->shift_type;
                        }
                    }

                    // Resolve base OT rate based on calculation mode
                    if ($otMode === 'fixed') {
                        $baseOtRate = (float) Setting::get('payroll_overtime_rate', 0, $companyId);
                    } else {
                        $baseOtRate = $hourlyRate;
                    }

                    // Determine multiplier from payroll settings
                    if ($isHoliday) {
                        $multiplier = (float) Setting::get('overtime_holiday_multiplier', 2.25, $companyId);
                    } elseif ($shiftType === 'Night') {
                        $multiplier = (float) Setting::get('overtime_night_multiplier', 1.50, $companyId);
                    } else {
                        $multiplier = (float) Setting::get('overtime_day_multiplier', 1.25, $companyId);
                    }
                }

                // Apply "No Overtime" rules
                $isNoOvertime = $employee->no_overtime || ($attendance && $attendance->no_overtime);
                if (!$isNoOvertime) {
                    $overtimeAmount += $dailyOtHours * ($baseOtRate * $multiplier);
                }
            }

            $current->addDay();
        }

        // 6. Rates
        $companyId = $employee->company_id;
        $otRate = $this->getOvertimeRate($employee); // Kept for backward compatibility
        $daysPerMonth = Setting::get('default_working_days_per_month', 30, $companyId);

        // True working days = calendar days - weekly offs - holidays
        $calendarDays = $startDate->daysInMonth;
        $workingDays = max(1, $calendarDays - $weeklyOffDaysCount - $holidayCount);

        // Use configured daysPerMonth for daily rate unless not set
        $effectiveDaysPerMonth = $daysPerMonth > 0 ? $daysPerMonth : $workingDays;
        $dailyRate = $basicSalary / $effectiveDaysPerMonth;

        // Absent Deduction — weekly off days are excluded (never counted above)
        $absentDeduction = $totalAbsentDays * $dailyRate;

        $totalAllowances = array_sum($allowances);
        $totalDeductions = array_sum($deductions);

        // 7. Loan Deductions
        $loanDeduction = $employee->getLoanDeduction($month, $year);
        if ($loanDeduction > 0) {
            $deductions['Loan Repayment'] = $loanDeduction;
            $totalDeductions += $loanDeduction;
        }

        // 8. Advance Deductions
        $advanceDeduction = $employee->getAdvanceDeduction($month, $year);
        if ($advanceDeduction > 0) {
            $deductions['Advance Repayment'] = $advanceDeduction;
            $totalDeductions += $advanceDeduction;
        }

        $netSalary = $basicSalary + $totalAllowances + $overtimeAmount - $totalDeductions - $absentDeduction;

        return [
            'basic_salary'           => round($basicSalary, 2),
            'allowances'             => $allowances,
            'deductions'             => $deductions,
            'overtime_hours'         => $totalOtHours,
            'hourly_rate'            => round($hourlyRate, 2),
            'overtime_rate'          => round($otRate, 2),
            'overtime_amount'        => round($overtimeAmount, 2),
            'absent_days'            => $totalAbsentDays,
            'leave_deduction'        => round($absentDeduction, 2),
            'net_salary'             => round(max(0, $netSalary), 2),
            'attendance_summary'     => $summary,
            'weekly_off_days'        => $weeklyOffDaysCount,
            'holiday_days'           => $holidayCount,
            'working_days_in_month'  => $workingDays,
            'calendar_days'          => $calendarDays,
        ];
    }

    /**
     * Calculate hourly rate based on employee basic salary.
     */
    public function getHourlyRate(Employee $employee): float
    {
        $companyId = $employee->company_id;
        $daysPerMonth = (int) Setting::get('default_working_days_per_month', 30, $companyId);
        if ($daysPerMonth <= 0) {
            $daysPerMonth = 30;
        }
        $workHoursPerDay = (int) Setting::get('default_working_hours_per_day', 8, $companyId);
        if ($workHoursPerDay <= 0) {
            $workHoursPerDay = 8;
        }

        $basicSalary = (float) $employee->basic_salary;
        $dailyRate = $basicSalary / $daysPerMonth;
        return $dailyRate / $workHoursPerDay;
    }

    /**
     * Get overtime hourly rate based on overtime calculation mode in payroll settings.
     */
    public function getOvertimeRate(Employee $employee): float
    {
        $companyId = $employee->company_id;
        $otMode = Setting::get('overtime_calculation_mode', 'base_salary', $companyId);

        if ($otMode === 'none' || $otMode === 'no_overtime') {
            return 0.0;
        }

        if ($otMode === 'fixed') {
            $baseOtRate = (float) Setting::get('payroll_overtime_rate', 0, $companyId);
        } else {
            $baseOtRate = $this->getHourlyRate($employee);
        }

        $multiplier = (float) Setting::get('overtime_day_multiplier', 1.25, $companyId);
        return $baseOtRate * $multiplier;
    }
}
