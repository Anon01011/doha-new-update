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
        if ($employee->company_id) {
            $holidays = Holiday::where('company_id', $employee->company_id)
                ->where('start_date', '<=', $endDate->toDateString())
                ->where('end_date', '>=', $startDate->toDateString())
                ->get();

            foreach ($holidays as $holiday) {
                $hStart = max(Carbon::parse($holiday->start_date)->toDateString(), $startDate->toDateString());
                $hEnd   = min(Carbon::parse($holiday->end_date)->toDateString(),   $endDate->toDateString());
                $holidayCount += Carbon::parse($hStart)->diffInDays(Carbon::parse($hEnd)) + 1;
            }
        }

        // 5. Attendance Based Calculations
        $attendances = EmployeeAttendance::where('employee_id', $employeeId)
            ->whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
            ->get();

        $totalOtHours = 0;
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
                // No deduction for weekly off days — never treated as absent
            } elseif ($attendance) {
                $totalOtHours += $attendance->ot ?? 0;

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
                    // Explicit Weekly Off record (e.g. from CSV import)
                    $summary['weekly_off']++;
                }
            } else {
                // No attendance record — count as absent only for past/current days
                if ($current->lte(now())) {
                    $totalAbsentDays++;
                    $summary['absent']++;
                }
            }

            $current->addDay();
        }

        // 6. Rates
        $companyId = $employee->company_id;
        $otRateMultiplier = Setting::get('overtime_rate_multiplier', 1.5, $companyId);
        $daysPerMonth = Setting::get('default_working_days_per_month', 30, $companyId);
        $workHoursPerDay = Setting::get('default_working_hours_per_day', 8, $companyId);

        // True working days = calendar days - weekly offs - holidays
        $calendarDays = $startDate->daysInMonth;
        $workingDays = max(1, $calendarDays - $weeklyOffDaysCount - $holidayCount);

        // Use configured daysPerMonth for daily rate unless not set
        $effectiveDaysPerMonth = $daysPerMonth > 0 ? $daysPerMonth : $workingDays;
        $dailyRate = $basicSalary / $effectiveDaysPerMonth;
        $hourlyRate = $dailyRate / $workHoursPerDay;

        $overtimeAmount = $totalOtHours * $hourlyRate * $otRateMultiplier;

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
}
