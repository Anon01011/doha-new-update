<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\User;
use App\Models\Role;
use App\Models\EmployeeAttendance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected Company $branch;
    protected Employee $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Company::create(['name' => 'Test Branch']);

        // Create Admin role
        $adminRole = Role::create([
            'name' => 'Admin',
            'slug' => 'admin',
        ]);

        $this->adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin@earthdoha.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);
        $this->adminUser->roles()->sync([$adminRole->id]);

        $this->employee = Employee::create([
            'name' => 'Test Employee',
            'gender' => 'Male',
            'employee_code' => 'EMP001',
            'company_id' => $this->branch->id,
            'basic_salary' => 1000,
        ]);

        // Create some attendance records
        EmployeeAttendance::create([
            'employee_id' => $this->employee->id,
            'company_id' => $this->branch->id,
            'date' => '2026-07-01',
            'from_time' => '09:00',
            'to_time' => '17:00',
            'hours_worked' => 8.0,
            'normal_hours' => 8.0,
            'ot' => 0.0,
            'attendance' => 'Present',
        ]);

        EmployeeAttendance::create([
            'employee_id' => $this->employee->id,
            'company_id' => $this->branch->id,
            'date' => '2026-07-02',
            'from_time' => '09:00',
            'to_time' => '19:00',
            'hours_worked' => 10.0,
            'normal_hours' => 8.0,
            'ot' => 2.0,
            'ot_amt' => 3.0,
            'attendance' => 'Present',
        ]);
    }

    public function test_admin_can_access_reports_index_and_attendance_report()
    {
        $response = $this->actingAs($this->adminUser)
            ->get(route('reports.index'));
        $response->assertStatus(200);

        $response = $this->actingAs($this->adminUser)
            ->get(route('reports.attendance'));
        $response->assertStatus(200);
    }

    public function test_admin_can_export_pdf_reports_by_type()
    {
        // Detail report PDF
        $response = $this->actingAs($this->adminUser)
            ->get(route('reports.attendance.export.pdf', [
                'start_date' => '2026-07-01',
                'end_date' => '2026-07-31',
                'report_type' => 'detail'
            ]));
        $response->assertStatus(200);
        $response->assertHeader('Content-Disposition', 'attachment; filename="detail_report_' . now()->format('YmdHis') . '.pdf"');

        // Summary report PDF
        $response = $this->actingAs($this->adminUser)
            ->get(route('reports.attendance.export.pdf', [
                'start_date' => '2026-07-01',
                'end_date' => '2026-07-31',
                'report_type' => 'summary'
            ]));
        $response->assertStatus(200);
        $response->assertHeader('Content-Disposition', 'attachment; filename="summary_report_' . now()->format('YmdHis') . '.pdf"');

        // Overtime report PDF
        $response = $this->actingAs($this->adminUser)
            ->get(route('reports.attendance.export.pdf', [
                'start_date' => '2026-07-01',
                'end_date' => '2026-07-31',
                'report_type' => 'overtime'
            ]));
        $response->assertStatus(200);
        $response->assertHeader('Content-Disposition', 'attachment; filename="overtime_report_' . now()->format('YmdHis') . '.pdf"');
    }

    public function test_admin_can_export_excel_reports_by_type()
    {
        // Detail report Excel
        $response = $this->actingAs($this->adminUser)
            ->get(route('reports.attendance.export.excel', [
                'start_date' => '2026-07-01',
                'end_date' => '2026-07-31',
                'report_type' => 'detail'
            ]));
        $response->assertStatus(200);
        $response->assertHeader('Content-Disposition', 'attachment; filename="detail_report_' . now()->format('YmdHis') . '.xlsx"');

        // Summary report Excel
        $response = $this->actingAs($this->adminUser)
            ->get(route('reports.attendance.export.excel', [
                'start_date' => '2026-07-01',
                'end_date' => '2026-07-31',
                'report_type' => 'summary'
            ]));
        $response->assertStatus(200);
        $response->assertHeader('Content-Disposition', 'attachment; filename="summary_report_' . now()->format('YmdHis') . '.xlsx"');

        // Overtime report Excel
        $response = $this->actingAs($this->adminUser)
            ->get(route('reports.attendance.export.excel', [
                'start_date' => '2026-07-01',
                'end_date' => '2026-07-31',
                'report_type' => 'overtime'
            ]));
        $response->assertStatus(200);
        $response->assertHeader('Content-Disposition', 'attachment; filename="overtime_report_' . now()->format('YmdHis') . '.xlsx"');
    }
}
