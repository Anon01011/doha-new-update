<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\User;
use App\Models\Role;
use App\Models\EmployeeAttendance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Inertia\Testing\AssertableInertia as Assert;

class EmployeeAttendanceTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $employeeUser;
    protected Company $branch1;
    protected Company $branch2;
    protected Employee $emp1;
    protected Employee $emp2;

    protected function setUp(): void
    {
        parent::setUp();

        // Create branches
        $this->branch1 = Company::create(['name' => 'Branch One']);
        $this->branch2 = Company::create(['name' => 'Branch Two']);

        // Create Admin role
        $adminRole = Role::create([
            'name' => 'Admin',
            'slug' => 'admin',
        ]);

        // Create Admin User
        $this->adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin@earthdoha.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);
        $this->adminUser->roles()->sync([$adminRole->id]);

        // Create Employee 1 (Branch 1)
        $this->emp1 = Employee::create([
            'name' => 'Employee One',
            'gender' => 'Male',
            'employee_code' => 'EMP001',
            'company_id' => $this->branch1->id,
            'basic_salary' => 1000,
        ]);

        // Create Employee 2 (Branch 2)
        $this->emp2 = Employee::create([
            'name' => 'Employee Two',
            'gender' => 'Female',
            'employee_code' => 'EMP002',
            'company_id' => $this->branch2->id,
            'basic_salary' => 1000,
        ]);

        // Create Employee User linked to Employee 1
        $this->employeeUser = User::create([
            'name' => 'Regular Employee',
            'email' => 'employee@earthdoha.com',
            'password' => bcrypt('password'),
            'role' => 'employee',
            'employee_id' => $this->emp1->id,
        ]);

        // Create standard_working_hours setting for Branch 1
        \App\Models\Setting::set('standard_working_hours', 8, 'Payroll', 'number', $this->branch1->id);
    }

    public function test_admin_default_view_returns_all_branches_initially()
    {
        $response = $this->actingAs($this->adminUser)
            ->get(route('employee-attendances.index'));

        $response->assertStatus(200);

        // Verify Inertia returns all employees (paginated structure) and initialCompanyId is null
        $response->assertInertia(fn (Assert $page) => $page
            ->component('EmployeeAttendance/Index')
            ->where('initialCompanyId', null)
            ->has('employees.data', 2)
        );
    }

    public function test_admin_with_selected_branch_filters_correct_employees()
    {
        // Request for Branch One
        $response = $this->actingAs($this->adminUser)
            ->get(route('employee-attendances.index', ['company_id' => $this->branch1->id]));

        $response->assertStatus(200);

        // Verify Inertia filters to Branch One's employee
        $response->assertInertia(fn (Assert $page) => $page
            ->component('EmployeeAttendance/Index')
            ->where('initialCompanyId', (string) $this->branch1->id)
            ->has('employees.data', 1)
            ->where('employees.data.0.id', $this->emp1->id)
        );
    }

    public function test_employee_default_view_automatically_restricts_to_own_branch()
    {
        $response = $this->actingAs($this->employeeUser)
            ->get(route('employee-attendances.index'));

        $response->assertStatus(200);

        // Verify restricted to employee component and company_id is restricted to branch1
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Employee/Attendance')
            ->where('initialCompanyId', $this->branch1->id)
            ->has('employees.data', 1)
            ->where('employees.data.0.id', $this->emp1->id)
        );
    }

    public function test_multiple_punches_flexible_timetable_calculation()
    {
        $attendance = EmployeeAttendance::create([
            'employee_id' => $this->emp1->id,
            'company_id' => $this->branch1->id,
            'date' => '2026-07-08',
            'from_time' => '09:30',
            'to_time' => '21:15',
            'normal_hours' => 8,
            'attendance' => 'Present',
            'punches' => [
                ['type' => 'in', 'time' => '2026-07-08 09:30:00'],
                ['type' => 'out', 'time' => '2026-07-08 12:30:00'], // 3 hours
                ['type' => 'in', 'time' => '2026-07-08 13:15:00'],
                ['type' => 'out', 'time' => '2026-07-08 17:00:00'], // 3.75 hours
                ['type' => 'in', 'time' => '2026-07-08 19:00:00'],
                ['type' => 'out', 'time' => '2026-07-08 21:15:00'], // 2.25 hours
            ]
        ]);

        $this->assertEquals(9.00, $attendance->calculateFlexibleHours());
        $this->assertEquals(165, $attendance->calculateFlexibleBreaks());
    }

    public function test_clock_in_out_flow_records_multiple_punches_and_calculates_ot()
    {
        // First Clock In at 09:30
        \Carbon\Carbon::setTestNow('2026-07-08 09:30:00');
        $response = $this->actingAs($this->employeeUser)
            ->post(route('employee-attendances.clockIn'));
        $response->assertSessionHas('success');

        $attendance = EmployeeAttendance::where('employee_id', $this->emp1->id)->first();
        $this->assertNotNull($attendance);
        $this->assertCount(1, $attendance->punches);
        $this->assertEquals('in', $attendance->punches[0]['type']);

        // First Clock Out at 12:30
        \Carbon\Carbon::setTestNow('2026-07-08 12:30:00');
        $response = $this->actingAs($this->employeeUser)
            ->post(route('employee-attendances.clockOut'));
        $response->assertSessionHas('success');

        $attendance->refresh();
        $this->assertCount(2, $attendance->punches);
        $this->assertEquals('out', $attendance->punches[1]['type']);
        $this->assertEquals(3.0, $attendance->hours_worked);

        // Second Clock In at 13:15
        \Carbon\Carbon::setTestNow('2026-07-08 13:15:00');
        $response = $this->actingAs($this->employeeUser)
            ->post(route('employee-attendances.clockIn'));
        $response->assertSessionHas('success');

        $attendance->refresh();
        $this->assertCount(3, $attendance->punches);
        $this->assertEquals('in', $attendance->punches[2]['type']);

        // Second Clock Out at 19:15 (Total working sessions: 3h + 6h = 9h)
        \Carbon\Carbon::setTestNow('2026-07-08 19:15:00');
        $response = $this->actingAs($this->employeeUser)
            ->post(route('employee-attendances.clockOut'));
        $response->assertSessionHas('success');

        $attendance->refresh();
        $this->assertCount(4, $attendance->punches);
        $this->assertEquals('out', $attendance->punches[3]['type']);
        $this->assertEquals(9.0, $attendance->hours_worked);
        $this->assertEquals(1.0, $attendance->ot); // 9h - 8h normal = 1h OT
        $this->assertEquals(45, $attendance->total_break_minutes); // 12:30 to 13:15 is 45 mins break
    }
}
