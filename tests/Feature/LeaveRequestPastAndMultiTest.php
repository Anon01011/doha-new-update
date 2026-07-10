<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use App\Models\Role;
use App\Models\Setting;
use App\Models\LeaveBalance;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveRequestPastAndMultiTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $employeeUser;
    protected Company $branch;
    protected LeaveType $leaveType;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a branch
        $this->branch = Company::create([
            'name' => 'Earth Doha HQ',
        ]);

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

        // Create an Employee User
        $this->employeeUser = User::create([
            'name' => 'Regular Employee',
            'email' => 'employee@earthdoha.com',
            'password' => bcrypt('password'),
            'role' => 'employee',
        ]);

        // Create a Leave Type
        $this->leaveType = LeaveType::create([
            'name' => 'Annual Leave',
            'code' => 'AL',
            'max_days_per_year' => 30,
            'is_paid' => true,
            'is_active' => true,
            'company_id' => $this->branch->id,
        ]);
    }

    public function test_admin_can_create_leave_for_past_date_bypassing_notice_period()
    {
        // Set minimum notice period setting to 5 days
        Setting::create([
            'key' => 'minimum_notice_period',
            'value' => '5',
            'company_id' => $this->branch->id,
        ]);

        $employee = Employee::create([
            'name' => 'Employee One',
            'gender' => 'Male',
            'employee_code' => 'EMP001',
            'company_id' => $this->branch->id,
            'basic_salary' => 1000,
        ]);

        // Leave Balance
        LeaveBalance::create([
            'employee_id' => $employee->id,
            'leave_type_id' => $this->leaveType->id,
            'year' => 2026,
            'total_days' => 30,
            'used_days' => 0,
            'remaining_days' => 30,
            'carry_forward_days' => 0,
        ]);

        // Past Date (e.g. 5 days ago)
        $pastStartDate = Carbon::now()->subDays(5)->toDateString();
        $pastEndDate = Carbon::now()->subDays(4)->toDateString();

        $response = $this->actingAs($this->adminUser)
            ->post(route('leave-requests.store'), [
                'employee_ids' => [$employee->id],
                'leave_type_id' => $this->leaveType->id,
                'start_date' => $pastStartDate,
                'end_date' => $pastEndDate,
                'reason' => 'Sick in the past',
            ]);

        $response->assertRedirect(route('leave-requests.index'));
        $response->assertSessionHas('success');

        // Check that leave request is created and approved directly
        $this->assertDatabaseHas('leave_requests', [
            'employee_id' => $employee->id,
            'start_date' => $pastStartDate . ' 00:00:00',
            'end_date' => $pastEndDate . ' 00:00:00',
            'status' => 'approved',
        ]);
    }

    public function test_admin_can_create_leave_for_multiple_employees_in_one_go()
    {
        $emp1 = Employee::create([
            'name' => 'Emp One',
            'gender' => 'Male',
            'employee_code' => 'EMP001',
            'company_id' => $this->branch->id,
            'basic_salary' => 1000,
        ]);

        $emp2 = Employee::create([
            'name' => 'Emp Two',
            'gender' => 'Female',
            'employee_code' => 'EMP002',
            'company_id' => $this->branch->id,
            'basic_salary' => 1000,
        ]);

        $startDate = Carbon::now()->addDays(10)->toDateString();
        $endDate = Carbon::now()->addDays(12)->toDateString();

        $response = $this->actingAs($this->adminUser)
            ->post(route('leave-requests.store'), [
                'employee_ids' => [$emp1->id, $emp2->id],
                'leave_type_id' => $this->leaveType->id,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'reason' => 'Group training leave',
            ]);

        $response->assertRedirect(route('leave-requests.index'));
        $response->assertSessionHas('success');

        // Check both leave requests exist
        $this->assertDatabaseHas('leave_requests', [
            'employee_id' => $emp1->id,
            'start_date' => $startDate . ' 00:00:00',
            'end_date' => $endDate . ' 00:00:00',
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('leave_requests', [
            'employee_id' => $emp2->id,
            'start_date' => $startDate . ' 00:00:00',
            'end_date' => $endDate . ' 00:00:00',
            'status' => 'approved',
        ]);
    }

    public function test_transaction_rolls_back_entirely_if_any_selected_employee_has_overlap()
    {
        $emp1 = Employee::create([
            'name' => 'Emp One',
            'gender' => 'Male',
            'employee_code' => 'EMP001',
            'company_id' => $this->branch->id,
            'basic_salary' => 1000,
        ]);

        $emp2 = Employee::create([
            'name' => 'Emp Two',
            'gender' => 'Female',
            'employee_code' => 'EMP002',
            'company_id' => $this->branch->id,
            'basic_salary' => 1000,
        ]);

        $startDate = Carbon::now()->addDays(10)->toDateString();
        $endDate = Carbon::now()->addDays(12)->toDateString();

        // Create an pre-existing overlapping leave for Emp Two
        LeaveRequest::create([
            'employee_id' => $emp2->id,
            'leave_type_id' => $this->leaveType->id,
            'start_date' => $startDate . ' 00:00:00',
            'end_date' => $endDate . ' 00:00:00',
            'reason' => 'Existing leave',
            'status' => 'approved',
            'company_id' => $this->branch->id,
            'days_requested' => 3,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->from(route('leave-requests.create'))
            ->post(route('leave-requests.store'), [
                'employee_ids' => [$emp1->id, $emp2->id],
                'leave_type_id' => $this->leaveType->id,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'reason' => 'Group leave with overlap',
            ]);

        $response->assertRedirect(route('leave-requests.create'));
        $response->assertSessionHas('error');

        // Confirm Emp One did NOT get the leave request created (entire transaction rolled back)
        $this->assertDatabaseMissing('leave_requests', [
            'employee_id' => $emp1->id,
            'start_date' => $startDate . ' 00:00:00',
            'end_date' => $endDate . ' 00:00:00',
            'reason' => 'Group leave with overlap',
        ]);
    }

    public function test_admin_can_bulk_approve_multiple_pending_leaves()
    {
        $employee = Employee::create([
            'name' => 'Emp One',
            'gender' => 'Male',
            'employee_code' => 'EMP001',
            'company_id' => $this->branch->id,
            'basic_salary' => 1000,
        ]);

        $req1 = LeaveRequest::create([
            'employee_id' => $employee->id,
            'leave_type_id' => $this->leaveType->id,
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-03',
            'status' => 'pending',
            'manager_approval_status' => 'approved',
            'hr_approval_status' => 'pending',
            'company_id' => $this->branch->id,
            'days_requested' => 3,
            'reason' => 'Vacation',
        ]);

        $req2 = LeaveRequest::create([
            'employee_id' => $employee->id,
            'leave_type_id' => $this->leaveType->id,
            'start_date' => '2026-08-10',
            'end_date' => '2026-08-12',
            'status' => 'pending',
            'manager_approval_status' => 'approved',
            'hr_approval_status' => 'pending',
            'company_id' => $this->branch->id,
            'days_requested' => 3,
            'reason' => 'Vacation 2',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->post(route('leave-requests.bulk-approve'), [
                'ids' => [$req1->id, $req2->id],
            ]);

        $response->assertSessionHas('success');
        
        $this->assertEquals('approved', $req1->fresh()->status);
        $this->assertEquals('approved', $req2->fresh()->status);
    }

    public function test_admin_can_bulk_reject_multiple_pending_leaves()
    {
        $employee = Employee::create([
            'name' => 'Emp One',
            'gender' => 'Male',
            'employee_code' => 'EMP001',
            'company_id' => $this->branch->id,
            'basic_salary' => 1000,
        ]);

        $req1 = LeaveRequest::create([
            'employee_id' => $employee->id,
            'leave_type_id' => $this->leaveType->id,
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-03',
            'status' => 'pending',
            'manager_approval_status' => 'approved',
            'hr_approval_status' => 'pending',
            'company_id' => $this->branch->id,
            'days_requested' => 3,
            'reason' => 'Vacation',
        ]);

        $req2 = LeaveRequest::create([
            'employee_id' => $employee->id,
            'leave_type_id' => $this->leaveType->id,
            'start_date' => '2026-08-10',
            'end_date' => '2026-08-12',
            'status' => 'pending',
            'manager_approval_status' => 'approved',
            'hr_approval_status' => 'pending',
            'company_id' => $this->branch->id,
            'days_requested' => 3,
            'reason' => 'Vacation 2',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->post(route('leave-requests.bulk-reject'), [
                'ids' => [$req1->id, $req2->id],
                'rejection_reason' => 'Not allowed',
            ]);

        $response->assertSessionHas('success');
        
        $this->assertEquals('rejected', $req1->fresh()->status);
        $this->assertEquals('rejected', $req2->fresh()->status);
        $this->assertEquals('Not allowed', $req1->fresh()->rejection_reason);
    }

    public function test_regular_employee_cannot_bulk_approve_leaves()
    {
        $response = $this->actingAs($this->employeeUser)
            ->post(route('leave-requests.bulk-approve'), [
                'ids' => [1, 2],
            ]);

        $response->assertStatus(403);
    }
}
