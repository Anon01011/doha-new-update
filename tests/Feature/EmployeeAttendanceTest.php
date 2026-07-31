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

    public function test_import_and_export_matching_template()
    {
        // 1. Test template download
        $response = $this->actingAs($this->adminUser)
            ->get(route('employee-attendances.template'));
        $response->assertStatus(200);
        $content = $response->streamedContent();
        $this->assertStringContainsString('Full Name', $content);
        $this->assertStringContainsString('ID', $content);
        $this->assertStringContainsString('Clock-In Time', $content);
        $this->assertStringContainsString('Absent Duration', $content);

        // 2. Test export actual data
        // Create an attendance record
        EmployeeAttendance::create([
            'employee_id' => $this->emp1->id,
            'company_id' => $this->branch1->id,
            'date' => '2026-07-01',
            'from_time' => '16:15',
            'to_time' => '01:58',
            'hours_worked' => 9.72,
            'normal_hours' => 9.00,
            'ot' => 0.72,
            'attendance' => 'Present',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->get(route('employee-attendances.template', [
                'company_id' => $this->branch1->id,
                'week_start' => '2026-06-29', // Monday of the week containing 2026-07-01
                'export_data' => true
            ]));
        $response->assertStatus(200);
        $content = $response->streamedContent();
        
        // Verify CSV content format (with double quotes for values with spaces)
        $this->assertStringContainsString('"Employee One",EMP001,2026-07-01,16:15,01:58,09:43,00:00,00:43,--', $content);

        // 3. Test importing attendance CSV
        $csvData = "Full Name,ID,Date,Clock-In Time,Clock-Out Time,Worked Hours,Absent Duration,Overtime Duration,Leave Type\n" .
                   "Employee One,EMP001,2026-07-02,08:00,17:00,09:00,00:00,00:00,--\n" .
                   "Employee One,EMP001,2026-07-03,--,--,00:00,09:00,00:00,Casual Leave\n";

        // Write temp CSV file
        $tempFile = tempnam(sys_get_temp_dir(), 'att');
        file_put_contents($tempFile, $csvData);

        $uploadedFile = new \Illuminate\Http\UploadedFile(
            $tempFile,
            'attendance_import.csv',
            'text/csv',
            null,
            true
        );

        $response = $this->actingAs($this->adminUser)
            ->post(route('employee-attendances.import'), [
                'file' => $uploadedFile,
            ]);

        $response->assertSessionHas('success');

        // Check imported records
        $att1 = EmployeeAttendance::where('employee_id', $this->emp1->id)->where('date', '2026-07-02')->first();
        $this->assertNotNull($att1);
        $this->assertEquals('Present', $att1->attendance);
        $this->assertEquals(9.00, $att1->hours_worked);

        $att2 = EmployeeAttendance::where('employee_id', $this->emp1->id)->where('date', '2026-07-03')->first();
        $this->assertNotNull($att2);
        $this->assertEquals('Leave', $att2->attendance);
        $this->assertEquals(0, $att2->hours_worked);

        unlink($tempFile);
    }
}
