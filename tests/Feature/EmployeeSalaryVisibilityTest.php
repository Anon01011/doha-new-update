<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class EmployeeSalaryVisibilityTest extends TestCase
{
    use DatabaseTransactions;

    private Company $company;
    private Employee $targetEmployee;
    private Permission $viewEmployeesPerm;
    private Permission $viewSalaryPerm;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::firstOrCreate(
            ['slug' => 'test-corp'],
            ['name' => 'Test Corp', 'is_active' => true]
        );

        $this->viewEmployeesPerm = Permission::firstOrCreate(
            ['slug' => 'view-employees'],
            ['name' => 'View Employees', 'module' => 'employee', 'is_active' => true]
        );

        $this->viewSalaryPerm = Permission::firstOrCreate(
            ['slug' => 'view-employee-salary'],
            ['name' => 'View Employee Salary', 'module' => 'employee', 'is_active' => true]
        );

        $this->targetEmployee = Employee::create([
            'name' => 'John Doe',
            'employee_code' => 'EMP-' . uniqid(),
            'gender' => 'Male',
            'company_id' => $this->company->id,
            'basic_salary' => 5000.00,
            'status' => 'Active',
        ]);
    }

    public function test_admin_with_salary_permission_can_see_salary(): void
    {
        $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'Administrator', 'is_active' => true]);
        $adminRole->permissions()->syncWithoutDetaching([$this->viewSalaryPerm->id]);

        $adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin_' . uniqid() . '@example.test',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);
        $adminUser->roles()->syncWithoutDetaching([$adminRole->id]);

        $response = $this->actingAs($adminUser)->get(route('employees.show', $this->targetEmployee));

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
            $page->component('Employee/Show')
                ->where('can_see_salary', true)
                ->has('employee.basic_salary')
        );
    }

    public function test_admin_without_salary_permission_cannot_see_salary(): void
    {
        $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'Administrator', 'is_active' => true]);
        $adminRole->permissions()->detach($this->viewSalaryPerm->id);

        $adminUser = User::create([
            'name' => 'Admin User Without Salary Perm',
            'email' => 'admin_no_sal_' . uniqid() . '@example.test',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);
        $adminUser->roles()->syncWithoutDetaching([$adminRole->id]);

        $response = $this->actingAs($adminUser)->get(route('employees.show', $this->targetEmployee));

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
            $page->component('Employee/Show')
                ->where('can_see_salary', false)
                ->missing('employee.basic_salary')
        );
    }

    public function test_hr_role_with_permission_can_see_employee_salary(): void
    {
        $hrRole = Role::firstOrCreate(['slug' => 'hr'], ['name' => 'Human Resources', 'is_active' => true]);
        $hrRole->permissions()->syncWithoutDetaching([$this->viewEmployeesPerm->id, $this->viewSalaryPerm->id]);

        $hrUser = User::create([
            'name' => 'HR User',
            'email' => 'hr_' . uniqid() . '@example.test',
            'password' => bcrypt('password'),
            'role' => 'hr',
            'company_id' => $this->company->id,
        ]);
        $hrUser->roles()->syncWithoutDetaching([$hrRole->id]);

        $response = $this->actingAs($hrUser)->get(route('employees.show', $this->targetEmployee));

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
            $page->component('Employee/Show')
                ->where('can_see_salary', true)
                ->has('employee.basic_salary')
        );
    }

    public function test_hr_role_without_permission_cannot_see_employee_salary(): void
    {
        $hrRole = Role::firstOrCreate(['slug' => 'hr'], ['name' => 'Human Resources', 'is_active' => true]);
        $hrRole->permissions()->syncWithoutDetaching([$this->viewEmployeesPerm->id]);
        $hrRole->permissions()->detach($this->viewSalaryPerm->id);

        $hrUser = User::create([
            'name' => 'HR User Without Salary Perm',
            'email' => 'hr_no_sal_' . uniqid() . '@example.test',
            'password' => bcrypt('password'),
            'role' => 'hr',
            'company_id' => $this->company->id,
        ]);
        $hrUser->roles()->syncWithoutDetaching([$hrRole->id]);

        $response = $this->actingAs($hrUser)->get(route('employees.show', $this->targetEmployee));

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
            $page->component('Employee/Show')
                ->where('can_see_salary', false)
                ->missing('employee.basic_salary')
        );
    }

    public function test_manager_without_salary_permission_cannot_see_salary(): void
    {
        $mgrRole = Role::firstOrCreate(['slug' => 'manager'], ['name' => 'Manager', 'is_active' => true]);
        $mgrRole->permissions()->syncWithoutDetaching([$this->viewEmployeesPerm->id]);
        $mgrRole->permissions()->detach($this->viewSalaryPerm->id);

        $mgrUser = User::create([
            'name' => 'Manager User',
            'email' => 'mgr_' . uniqid() . '@example.test',
            'password' => bcrypt('password'),
            'role' => 'manager',
            'company_id' => $this->company->id,
        ]);
        $mgrUser->roles()->syncWithoutDetaching([$mgrRole->id]);

        $response = $this->actingAs($mgrUser)->get(route('employees.show', $this->targetEmployee));

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
            $page->component('Employee/Show')
                ->where('can_see_salary', false)
                ->missing('employee.basic_salary')
        );
    }

    public function test_manager_with_salary_permission_can_see_salary(): void
    {
        $mgrRole = Role::firstOrCreate(['slug' => 'manager'], ['name' => 'Manager', 'is_active' => true]);
        $mgrRole->permissions()->syncWithoutDetaching([$this->viewEmployeesPerm->id, $this->viewSalaryPerm->id]);

        $mgrUser = User::create([
            'name' => 'Manager User',
            'email' => 'mgr_' . uniqid() . '@example.test',
            'password' => bcrypt('password'),
            'role' => 'manager',
            'company_id' => $this->company->id,
        ]);
        $mgrUser->roles()->syncWithoutDetaching([$mgrRole->id]);

        $response = $this->actingAs($mgrUser)->get(route('employees.show', $this->targetEmployee));

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
            $page->component('Employee/Show')
                ->where('can_see_salary', true)
                ->has('employee.basic_salary')
        );
    }
}
