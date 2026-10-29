<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\AttendanceEventNotification;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class EmployeeAttendanceNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected Company $company;
    protected Department $department;
    protected User $adminUser;
    protected User $hrUser;
    protected User $managerUser;
    protected User $employeeUser;
    protected Employee $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Main Branch']);
        $this->department = Department::create(['name' => 'Engineering', 'company_id' => $this->company->id]);

        $adminRole = Role::create(['name' => 'Admin', 'slug' => 'admin']);
        $hrRole = Role::create(['name' => 'HR', 'slug' => 'hr']);
        $managerRole = Role::create(['name' => 'Manager', 'slug' => 'manager']);

        // Admin User (Global)
        $this->adminUser = User::create([
            'name' => 'Global Admin',
            'email' => 'admin@test.com',
            'password' => bcrypt('Password123!'),
            'role' => 'admin',
        ]);
        $this->adminUser->roles()->sync([$adminRole->id]);

        // HR User (Branch Scoped)
        $this->hrUser = User::create([
            'name' => 'Branch HR',
            'email' => 'hr@test.com',
            'password' => bcrypt('Password123!'),
            'role' => 'hr',
            'company_id' => $this->company->id,
        ]);
        $this->hrUser->roles()->sync([$hrRole->id]);

        // Manager Employee & User
        $managerEmp = Employee::create([
            'name' => 'Department Manager',
            'gender' => 'Male',
            'employee_code' => 'MGR001',
            'company_id' => $this->company->id,
            'department_id' => $this->department->id,
            'basic_salary' => 5000,
        ]);
        $this->managerUser = User::create([
            'name' => 'Department Manager User',
            'email' => 'manager@test.com',
            'password' => bcrypt('Password123!'),
            'role' => 'manager',
            'company_id' => $this->company->id,
            'employee_id' => $managerEmp->id,
        ]);
        $this->managerUser->roles()->sync([$managerRole->id]);

        // Employee
        $this->employee = Employee::create([
            'name' => 'John Doe',
            'gender' => 'Male',
            'employee_code' => 'EMP100',
            'company_id' => $this->company->id,
            'department_id' => $this->department->id,
            'reports_to_id' => $managerEmp->id,
            'basic_salary' => 3000,
        ]);

        $this->employeeUser = User::create([
            'name' => 'John Doe User',
            'email' => 'john@test.com',
            'password' => bcrypt('Password123!'),
            'role' => 'employee',
            'company_id' => $this->company->id,
            'employee_id' => $this->employee->id,
        ]);

        Setting::set('standard_working_hours', 8, 'Payroll', 'number', $this->company->id);
    }

    public function test_clock_in_dispatches_realtime_notifications_to_admin_hr_and_manager(): void
    {
        $response = $this->actingAs($this->employeeUser)
            ->post(route('employee-attendances.clockIn'));

        $response->assertSessionHas('success');

        // Check database notifications for Admin
        $adminNotifications = $this->adminUser->notifications;
        $this->assertCount(1, $adminNotifications);
        $this->assertEquals('Employee Clock In', $adminNotifications->first()->data['title']);
        $this->assertEquals('attendance_event', $adminNotifications->first()->data['type']);
        $this->assertStringContainsString('John Doe clocked in', $adminNotifications->first()->data['message']);

        // Check database notifications for HR
        $hrNotifications = $this->hrUser->notifications;
        $this->assertCount(1, $hrNotifications);
        $this->assertEquals('Employee Clock In', $hrNotifications->first()->data['title']);

        // Check database notifications for Manager
        $managerNotifications = $this->managerUser->notifications;
        $this->assertCount(1, $managerNotifications);
        $this->assertEquals('Employee Clock In', $managerNotifications->first()->data['title']);

        // Employee should NOT be notified of their own clock-in
        $this->assertCount(0, $this->employeeUser->notifications);
    }

    public function test_clock_out_dispatches_realtime_notifications(): void
    {
        // First clock in
        $this->actingAs($this->employeeUser)
            ->post(route('employee-attendances.clockIn'));

        // Clear initial clock-in notifications
        $this->adminUser->notifications()->delete();
        $this->hrUser->notifications()->delete();
        $this->managerUser->notifications()->delete();

        // Now clock out
        $response = $this->actingAs($this->employeeUser)
            ->post(route('employee-attendances.clockOut'));

        $response->assertSessionHas('success');

        // Verify Admin received Clock Out notification
        $adminNotifications = $this->adminUser->fresh()->notifications;
        $this->assertCount(1, $adminNotifications);
        $this->assertEquals('Employee Clock Out', $adminNotifications->first()->data['title']);
        $this->assertStringContainsString('John Doe clocked out', $adminNotifications->first()->data['message']);

        // Verify HR received it
        $hrNotifications = $this->hrUser->fresh()->notifications;
        $this->assertCount(1, $hrNotifications);
        $this->assertEquals('Employee Clock Out', $hrNotifications->first()->data['title']);

        // Verify Manager received it
        $managerNotifications = $this->managerUser->fresh()->notifications;
        $this->assertCount(1, $managerNotifications);
        $this->assertEquals('Employee Clock Out', $managerNotifications->first()->data['title']);
    }

    public function test_start_and_end_break_dispatches_realtime_notifications(): void
    {
        // Clock in first
        $this->actingAs($this->employeeUser)
            ->post(route('employee-attendances.clockIn'));

        $this->adminUser->notifications()->delete();

        // Start Break
        $startResponse = $this->actingAs($this->employeeUser)
            ->post(route('employee-attendances.startBreak'));

        $startResponse->assertSessionHas('success');

        $adminNotifications = $this->adminUser->fresh()->notifications;
        $this->assertCount(1, $adminNotifications);
        $this->assertEquals('Employee Break Started', $adminNotifications->first()->data['title']);
        $this->assertStringContainsString('started a break', $adminNotifications->first()->data['message']);

        // End Break
        $this->adminUser->notifications()->delete();

        $endResponse = $this->actingAs($this->employeeUser)
            ->post(route('employee-attendances.endBreak'));

        $endResponse->assertSessionHas('success');

        $adminNotifications = $this->adminUser->fresh()->notifications;
        $this->assertCount(1, $adminNotifications);
        $this->assertEquals('Employee Break Ended', $adminNotifications->first()->data['title']);
        $this->assertStringContainsString('resumed work from break', $adminNotifications->first()->data['message']);
    }
}
