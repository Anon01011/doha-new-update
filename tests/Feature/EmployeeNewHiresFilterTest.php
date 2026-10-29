<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Employee;
use App\Models\Company;
use App\Models\Department;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class EmployeeNewHiresFilterTest extends TestCase
{
    use DatabaseTransactions;

    protected User $adminUser;
    protected Company $company;
    protected Department $department;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'Admin', 'is_active' => true]);
        $viewPerm = Permission::firstOrCreate(['slug' => 'view-employees'], ['name' => 'View Employees', 'is_active' => true]);
        $adminRole->permissions()->syncWithoutDetaching([$viewPerm->id]);

        $this->company = Company::create([
            'name' => 'Test Branch ' . uniqid(),
            'slug' => 'test-branch-' . uniqid(),
            'is_active' => true,
        ]);

        $this->department = Department::create([
            'name' => 'Test Dept ' . uniqid(),
            'company_id' => $this->company->id,
            'is_active' => true,
        ]);

        $adminEmp = Employee::create([
            'name' => 'Admin Emp',
            'employee_code' => 'ADM-' . uniqid(),
            'email' => 'admin.' . uniqid() . '@example.com',
            'company_id' => $this->company->id,
            'department_id' => $this->department->id,
            'designation' => 'Administrator',
            'role' => 'admin',
            'gender' => 'Male',
        ]);

        $this->adminUser = User::create([
            'name' => 'Admin User',
            'email' => $adminEmp->email,
            'password' => bcrypt('password'),
            'company_id' => $this->company->id,
            'employee_id' => $adminEmp->id,
            'role' => 'admin',
        ]);
        $this->adminUser->roles()->sync([$adminRole->id]);
    }

    public function test_new_hires_count_and_filter_within_last_3_months()
    {
        $this->actingAs($this->adminUser);

        // 1. Employee joined 1 month ago (within 3 months -> should be counted & included in filter)
        $newHire = Employee::create([
            'name' => 'Recent Joinee',
            'employee_code' => 'REC-' . uniqid(),
            'email' => 'recent.' . uniqid() . '@example.com',
            'company_id' => $this->company->id,
            'department_id' => $this->department->id,
            'joined_date' => now()->subMonth()->toDateString(),
            'role' => 'employee',
            'gender' => 'Male',
        ]);

        // 2. Employee joined 6 months ago (older than 3 months -> should NOT be included in new hires filter)
        $oldHire = Employee::create([
            'name' => 'Old Joinee',
            'employee_code' => 'OLD-' . uniqid(),
            'email' => 'old.' . uniqid() . '@example.com',
            'company_id' => $this->company->id,
            'department_id' => $this->department->id,
            'joined_date' => now()->subMonths(6)->toDateString(),
            'role' => 'employee',
            'gender' => 'Female',
        ]);

        // Request index page without filter
        $response = $this->get(route('employees.index'));
        $response->assertStatus(200);

        $stats = $response->viewData('page')['props']['stats'];
        $this->assertGreaterThanOrEqual(1, $stats['new_hires']);

        // Request index page with filter=new_hires
        $filteredResponse = $this->get(route('employees.index', ['filter' => 'new_hires']));
        $filteredResponse->assertStatus(200);

        $pageProps = $filteredResponse->viewData('page')['props'];
        $employeeIds = collect($pageProps['employees']['data'])->pluck('id');

        $this->assertTrue($employeeIds->contains($newHire->id), 'New hire joined within 3 months must be included in filter');
        $this->assertFalse($employeeIds->contains($oldHire->id), 'Old hire joined 6 months ago must not be included in new_hires filter');
    }
}

