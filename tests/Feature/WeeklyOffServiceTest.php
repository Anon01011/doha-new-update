<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\EmployeeWeeklyOff;
use App\Services\WeeklyOffService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WeeklyOffServiceTest extends TestCase
{
    use RefreshDatabase;

    protected WeeklyOffService $weeklyOffService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->weeklyOffService = app(WeeklyOffService::class);
    }

    public function test_fallback_to_branch_weekly_off_when_no_staff_off_exists()
    {
        // Create branch with Friday and Saturday as weekly offs
        $branch = Company::create([
            'name' => 'Test Branch',
            'weekly_off_days' => ['Friday', 'Saturday'],
        ]);

        $employee = Employee::create([
            'name' => 'John Doe',
            'gender' => 'Male',
            'company_id' => $branch->id,
            'employee_code' => 'EMP001',
        ]);

        // Query date: July 8, 2026 (Wednesday) - not a weekly off
        $this->assertFalse($this->weeklyOffService->isWeeklyOff($employee, '2026-07-08'));

        // July 10, 2026 (Friday) - should be weekly off
        $this->assertTrue($this->weeklyOffService->isWeeklyOff($employee, '2026-07-10'));

        // July 11, 2026 (Saturday) - should be weekly off
        $this->assertTrue($this->weeklyOffService->isWeeklyOff($employee, '2026-07-11'));
    }

    public function test_staff_wise_weekly_off_with_effective_date()
    {
        $branch = Company::create([
            'name' => 'Test Branch',
            'weekly_off_days' => ['Friday', 'Saturday'],
        ]);

        $employee = Employee::create([
            'name' => 'John Doe',
            'gender' => 'Male',
            'company_id' => $branch->id,
            'employee_code' => 'EMP001',
        ]);

        // Staff weekly off: Sunday, effective July 5, 2026
        EmployeeWeeklyOff::create([
            'employee_id' => $employee->id,
            'weekly_off_day' => 'Sunday',
            'effective_date' => '2026-07-05',
        ]);

        // July 3, 2026 (Friday) - Before effective date: should still fall back to branch weekly off (Friday)
        $this->assertTrue($this->weeklyOffService->isWeeklyOff($employee, '2026-07-03'));
        // July 5, 2026 (Sunday) - On effective date: should be weekly off (Sunday)
        $this->assertTrue($this->weeklyOffService->isWeeklyOff($employee, '2026-07-05'));
        // July 10, 2026 (Friday) - After effective date: should NOT be weekly off anymore (since overridden by staff-wise Sunday)
        $this->assertFalse($this->weeklyOffService->isWeeklyOff($employee, '2026-07-10'));
    }

    public function test_multiple_staff_wise_weekly_offs_over_time()
    {
        $branch = Company::create([
            'name' => 'Test Branch',
            'weekly_off_days' => ['Friday'],
        ]);

        $employee = Employee::create([
            'name' => 'John Doe',
            'gender' => 'Male',
            'company_id' => $branch->id,
            'employee_code' => 'EMP001',
        ]);

        // Sunday, effective July 1, 2026
        EmployeeWeeklyOff::create([
            'employee_id' => $employee->id,
            'weekly_off_day' => 'Sunday',
            'effective_date' => '2026-07-01',
        ]);

        // Monday, effective July 15, 2026
        EmployeeWeeklyOff::create([
            'employee_id' => $employee->id,
            'weekly_off_day' => 'Monday',
            'effective_date' => '2026-07-15',
        ]);

        // July 5, 2026 (Sunday) - falls in the first period: should be Sunday
        $this->assertTrue($this->weeklyOffService->isWeeklyOff($employee, '2026-07-05'));
        // July 6, 2026 (Monday) - falls in the first period: should NOT be weekly off
        $this->assertFalse($this->weeklyOffService->isWeeklyOff($employee, '2026-07-06'));

        // July 20, 2026 (Monday) - falls in the second period: should be Monday
        $this->assertTrue($this->weeklyOffService->isWeeklyOff($employee, '2026-07-20'));
        // July 19, 2026 (Sunday) - falls in the second period: should NOT be weekly off anymore
        $this->assertFalse($this->weeklyOffService->isWeeklyOff($employee, '2026-07-19'));
    }
}
