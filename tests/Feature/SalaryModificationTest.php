<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SalaryModificationRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class SalaryModificationTest extends TestCase
{
    use DatabaseTransactions;

    private Company $companyA;
    private Company $companyB;
    private Employee $targetEmployee;
    private User $admin;
    private User $branchHr;
    private User $otherBranchHr;
    private User $manager;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);

        $this->companyA = Company::firstOrCreate(
            ['slug' => 'branch-a'],
            ['name' => 'Branch A', 'is_active' => true]
        );

        $this->companyB = Company::firstOrCreate(
            ['slug' => 'branch-b'],
            ['name' => 'Branch B', 'is_active' => true]
        );

        $viewPerm = Permission::firstOrCreate(
            ['slug' => 'view-employees'],
            ['name' => 'View Employees', 'module' => 'employee', 'is_active' => true]
        );
        $editPerm = Permission::firstOrCreate(
            ['slug' => 'edit-employees'],
            ['name' => 'Edit Employees', 'module' => 'employee', 'is_active' => true]
        );
        $viewSalaryPerm = Permission::firstOrCreate(
            ['slug' => 'view-employee-salary'],
            ['name' => 'View Employee Salary', 'module' => 'employee', 'is_active' => true]
        );
        $editSalaryPerm = Permission::firstOrCreate(
            ['slug' => 'edit-employee-salary'],
            ['name' => 'Edit Employee Salary', 'module' => 'employee', 'is_active' => true]
        );
        $approveSalaryPerm = Permission::firstOrCreate(
            ['slug' => 'approve-salary-modifications'],
            ['name' => 'Approve Salary Modifications', 'module' => 'employee', 'is_active' => true]
        );

        // Branch A Employee
        $this->targetEmployee = Employee::create([
            'name' => 'Test Employee',
            'employee_code' => 'EMP-' . uniqid(),
            'gender' => 'Male',
            'company_id' => $this->companyA->id,
            'basic_salary' => 5000.00,
            'payment_type' => 'Bank Transfer',
            'status' => 'Active',
        ]);

        // Branch HR (Branch A)
        $this->branchHr = User::factory()->create([
            'company_id' => $this->companyA->id,
            'role' => 'hr',
        ]);
        $this->branchHr->permissions()->sync([
            $viewPerm->id, $editPerm->id, $viewSalaryPerm->id, $editSalaryPerm->id, $approveSalaryPerm->id
        ]);

        // Other Branch HR (Branch B)
        $this->otherBranchHr = User::factory()->create([
            'company_id' => $this->companyB->id,
            'role' => 'hr',
        ]);
        $this->otherBranchHr->permissions()->sync([
            $viewPerm->id, $editPerm->id, $viewSalaryPerm->id, $editSalaryPerm->id
        ]);

        // Cross-branch Manager (Branch B, but has edit salary permission)
        $this->manager = User::factory()->create([
            'company_id' => $this->companyB->id,
            'role' => 'manager',
        ]);
        $this->manager->permissions()->sync([
            $viewPerm->id, $editPerm->id, $viewSalaryPerm->id, $editSalaryPerm->id
        ]);

        // Admin
        $this->admin = User::factory()->create([
            'company_id' => $this->companyA->id,
            'role' => 'admin',
        ]);
        $this->admin->permissions()->sync([
            $viewPerm->id, $editPerm->id, $viewSalaryPerm->id, $editSalaryPerm->id, $approveSalaryPerm->id
        ]);
    }

    public function test_manager_salary_edit_creates_pending_modification_request(): void
    {
        $response = $this->actingAs($this->manager)->put(route('employees.update', $this->targetEmployee->id), [
            'name' => 'Test Employee Updated',
            'company_id' => $this->companyA->id,
            'gender' => 'Male',
            'status' => 'Active',
            'basic_salary' => 7500.00,
            'payment_type' => 'Bank Transfer',
        ]);

        // Live employee name should update, but basic_salary should remain 5000
        $this->targetEmployee->refresh();
        $this->assertEquals('Test Employee Updated', $this->targetEmployee->name);
        $this->assertEquals(5000.00, (float)$this->targetEmployee->basic_salary);

        // A pending modification request must exist
        $request = SalaryModificationRequest::where('employee_id', $this->targetEmployee->id)
            ->where('status', 'pending')
            ->first();

        $this->assertNotNull($request);
        $this->assertEquals(5000.00, (float)$request->current_basic_salary);
        $this->assertEquals(7500.00, (float)$request->proposed_basic_salary);
        $this->assertEquals($this->manager->id, $request->requested_by);
    }

    public function test_branch_hr_can_approve_salary_modification(): void
    {
        $salaryRequest = SalaryModificationRequest::create([
            'employee_id' => $this->targetEmployee->id,
            'company_id' => $this->companyA->id,
            'requested_by' => $this->manager->id,
            'current_basic_salary' => 5000.00,
            'proposed_basic_salary' => 8000.00,
            'current_payment_type' => 'Bank Transfer',
            'proposed_payment_type' => 'Bank Transfer',
            'status' => 'pending',
            'reason' => 'Annual Increment',
        ]);

        $response = $this->actingAs($this->branchHr)->post(
            route('salary-modifications.approve', $salaryRequest->id),
            ['notes' => 'Approved as per review']
        );

        $response->assertSessionHas('success');

        $salaryRequest->refresh();
        $this->assertEquals('approved', $salaryRequest->status);
        $this->assertEquals($this->branchHr->id, $salaryRequest->reviewed_by);

        $this->targetEmployee->refresh();
        $this->assertEquals(8000.00, (float)$this->targetEmployee->basic_salary);
    }

    public function test_branch_hr_can_reject_salary_modification(): void
    {
        $salaryRequest = SalaryModificationRequest::create([
            'employee_id' => $this->targetEmployee->id,
            'company_id' => $this->companyA->id,
            'requested_by' => $this->manager->id,
            'current_basic_salary' => 5000.00,
            'proposed_basic_salary' => 9000.00,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->branchHr)->post(
            route('salary-modifications.reject', $salaryRequest->id),
            ['notes' => 'Budget constraints']
        );

        $response->assertSessionHas('success');

        $salaryRequest->refresh();
        $this->assertEquals('rejected', $salaryRequest->status);

        $this->targetEmployee->refresh();
        $this->assertEquals(5000.00, (float)$this->targetEmployee->basic_salary);
    }

    public function test_unauthorized_branch_hr_cannot_approve_request_for_different_branch(): void
    {
        $salaryRequest = SalaryModificationRequest::create([
            'employee_id' => $this->targetEmployee->id,
            'company_id' => $this->companyA->id,
            'requested_by' => $this->manager->id,
            'current_basic_salary' => 5000.00,
            'proposed_basic_salary' => 8000.00,
            'status' => 'pending',
        ]);

        // Branch B HR tries to approve Branch A employee's salary
        $response = $this->actingAs($this->otherBranchHr)->post(
            route('salary-modifications.approve', $salaryRequest->id),
            ['notes' => 'Attempted approval']
        );

        $response->assertStatus(403);

        $salaryRequest->refresh();
        $this->assertEquals('pending', $salaryRequest->status);
    }

    public function test_admin_salary_edit_creates_pending_modification_request(): void
    {
        $response = $this->actingAs($this->admin)->put(route('employees.update', $this->targetEmployee->id), [
            'name' => 'Admin Updated Name',
            'company_id' => $this->companyA->id,
            'gender' => 'Male',
            'status' => 'Active',
            'basic_salary' => 8800.00,
            'payment_type' => 'Bank Transfer',
        ]);

        // Live employee name updates, but salary must NOT update immediately
        $this->targetEmployee->refresh();
        $this->assertEquals('Admin Updated Name', $this->targetEmployee->name);
        $this->assertEquals(5000.00, (float)$this->targetEmployee->basic_salary);

        // A pending modification request must exist awaiting Branch HR approval
        $request = SalaryModificationRequest::where('employee_id', $this->targetEmployee->id)
            ->where('status', 'pending')
            ->first();

        $this->assertNotNull($request);
        $this->assertEquals(8800.00, (float)$request->proposed_basic_salary);
        $this->assertEquals($this->admin->id, $request->requested_by);
    }

    public function test_same_branch_hr_salary_edit_applies_directly_without_approval(): void
    {
        $response = $this->actingAs($this->branchHr)->put(route('employees.update', $this->targetEmployee->id), [
            'name' => 'HR Updated Name',
            'company_id' => $this->companyA->id,
            'gender' => 'Male',
            'status' => 'Active',
            'basic_salary' => 7200.00,
            'payment_type' => 'Bank Transfer',
        ]);

        // Same branch HR edit applies directly
        $this->targetEmployee->refresh();
        $this->assertEquals('HR Updated Name', $this->targetEmployee->name);
        $this->assertEquals(7200.00, (float)$this->targetEmployee->basic_salary);

        // No pending request created
        $request = SalaryModificationRequest::where('employee_id', $this->targetEmployee->id)
            ->where('status', 'pending')
            ->first();

        $this->assertNull($request);
    }

    public function test_admin_cannot_approve_salary_modification_request(): void
    {
        $salaryRequest = SalaryModificationRequest::create([
            'employee_id' => $this->targetEmployee->id,
            'company_id' => $this->companyA->id,
            'requested_by' => $this->admin->id,
            'current_basic_salary' => 5000.00,
            'proposed_basic_salary' => 9500.00,
            'status' => 'pending',
        ]);

        // Admin cannot approve; only Branch HR can approve
        $response = $this->actingAs($this->admin)->post(
            route('salary-modifications.approve', $salaryRequest->id),
            ['notes' => 'Admin override attempt']
        );

        $response->assertStatus(403);

        $salaryRequest->refresh();
        $this->assertEquals('pending', $salaryRequest->status);

        // Now Branch HR approves it
        $hrResponse = $this->actingAs($this->branchHr)->post(
            route('salary-modifications.approve', $salaryRequest->id),
            ['notes' => 'Branch HR approved']
        );
        $hrResponse->assertSessionHas('success');

        $salaryRequest->refresh();
        $this->assertEquals('approved', $salaryRequest->status);

        $this->targetEmployee->refresh();
        $this->assertEquals(9500.00, (float)$this->targetEmployee->basic_salary);
    }

    public function test_user_without_approve_permission_cannot_access_approvals_page(): void
    {
        $this->manager->permissions()->detach(Permission::where('slug', 'approve-salary-modifications')->pluck('id'));

        $response = $this->actingAs($this->manager)->get(route('salary-modifications.index'));
        $response->assertStatus(403);
    }

    public function test_admin_viewing_show_page_sees_disabled_approve_button_and_reason(): void
    {
        SalaryModificationRequest::create([
            'employee_id' => $this->targetEmployee->id,
            'company_id' => $this->companyA->id,
            'requested_by' => $this->admin->id,
            'current_basic_salary' => 5000.00,
            'proposed_basic_salary' => 9500.00,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)->get(route('employees.show', $this->targetEmployee->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
            $page->component('Employee/Show')
                ->where('can_approve_salary', false)
                ->has('approve_disabled_reason')
        );
    }

    public function test_non_hr_user_with_approve_permission_and_branch_access_can_approve(): void
    {
        $approveSalaryPerm = Permission::where('slug', 'approve-salary-modifications')->first();
        $viewSalaryPerm = Permission::where('slug', 'view-employee-salary')->first();

        // A "payroll officer" with same branch (companyA) and approve perm but NOT an HR role
        $payrollOfficer = User::factory()->create([
            'company_id' => $this->companyA->id,
            'role' => 'manager',  // not 'hr'
        ]);
        $payrollOfficer->permissions()->sync([
            $viewSalaryPerm->id,
            $approveSalaryPerm->id,
        ]);

        $salaryRequest = SalaryModificationRequest::create([
            'employee_id' => $this->targetEmployee->id,
            'company_id' => $this->companyA->id,
            'requested_by' => $this->admin->id,
            'current_basic_salary' => 5000.00,
            'proposed_basic_salary' => 9000.00,
            'current_payment_type' => 'Bank Transfer',
            'proposed_payment_type' => 'Bank Transfer',
            'status' => 'pending',
            'reason' => 'Test increment',
        ]);

        $response = $this->actingAs($payrollOfficer)->post(
            route('salary-modifications.approve', $salaryRequest->id),
            ['notes' => 'Approved by payroll officer']
        );

        $response->assertSessionHas('success');

        $salaryRequest->refresh();
        $this->assertEquals('approved', $salaryRequest->status);
        $this->assertEquals($payrollOfficer->id, $salaryRequest->reviewed_by);

        $this->targetEmployee->refresh();
        $this->assertEquals(9000.00, (float) $this->targetEmployee->basic_salary);
    }

    public function test_show_page_returns_can_approve_true_for_non_hr_user_with_approve_permission(): void
    {
        $approveSalaryPerm = Permission::where('slug', 'approve-salary-modifications')->first();
        $viewSalaryPerm = Permission::where('slug', 'view-employee-salary')->first();

        $payrollOfficer = User::factory()->create([
            'company_id' => $this->companyA->id,
            'role' => 'manager',
        ]);
        $payrollOfficer->permissions()->sync([
            $viewSalaryPerm->id,
            $approveSalaryPerm->id,
        ]);

        SalaryModificationRequest::create([
            'employee_id' => $this->targetEmployee->id,
            'company_id' => $this->companyA->id,
            'requested_by' => $this->admin->id,
            'current_basic_salary' => 5000.00,
            'proposed_basic_salary' => 8500.00,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($payrollOfficer)->get(route('employees.show', $this->targetEmployee->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
            $page->component('Employee/Show')
                ->where('can_approve_salary', true)
                ->where('approve_disabled_reason', null)
        );
    }
}
