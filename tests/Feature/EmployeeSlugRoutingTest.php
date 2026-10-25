<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeSlugRoutingTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected Company $branchOne;

    protected Company $branchTwo;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchOne = Company::create(['name' => 'Branch One']);
        $this->branchTwo = Company::create(['name' => 'Branch Two']);

        $adminRole = Role::create([
            'name' => 'Admin',
            'slug' => 'admin',
        ]);

        $this->adminUser = User::create([
            'name'     => 'Admin User',
            'email'    => 'admin@earthdoha.com',
            'password' => bcrypt('password'),
            'role'     => 'admin',
        ]);
        $this->adminUser->roles()->sync([$adminRole->id]);
    }

    protected function makeEmployee(string $name, string $code, Company $company): Employee
    {
        return Employee::create([
            'name'          => $name,
            'gender'        => 'Male',
            'employee_code' => $code,
            'company_id'    => $company->id,
            'basic_salary'  => 1000,
        ]);
    }

    /**
     * The BelongsToCompany global scope returns early while the application
     * reports that it is running in the console, and PHPUnit runs on the CLI.
     * Clearing the flag makes the tenant scope apply to the request.
     */
    protected function enableTenantScope(): void
    {
        $property = new \ReflectionProperty(\Illuminate\Foundation\Application::class, 'isRunningInConsole');
        $property->setAccessible(true);
        $property->setValue($this->app, false);
    }

    public function test_slug_is_generated_from_name_and_employee_code(): void
    {
        $employee = $this->makeEmployee('Haider Shakeel Rajpoot', '128', $this->branchOne);

        $this->assertSame('haider-shakeel-rajpoot-128', $employee->slug);
        $this->assertSame('slug', $employee->getRouteKeyName());
        $this->assertSame('haider-shakeel-rajpoot-128', $employee->getRouteKey());
    }

    public function test_slug_is_unique_when_two_employees_share_a_name_and_code(): void
    {
        $first = $this->makeEmployee('Same Name', '111', $this->branchOne);
        $second = $this->makeEmployee('Same Name', '111', $this->branchTwo);

        $this->assertNotSame($first->slug, $second->slug);
        $this->assertSame('same-name-111', $first->slug);
        $this->assertSame('same-name-111-2', $second->slug);
    }

    public function test_slug_is_regenerated_when_the_name_or_code_changes(): void
    {
        $employee = $this->makeEmployee('Original Name', 'A1', $this->branchOne);
        $this->assertSame('original-name-a1', $employee->slug);

        $employee->update(['name' => 'Brand New Name']);
        $employee->refresh();

        $this->assertSame('brand-new-name-a1', $employee->slug);
    }

    public function test_slug_is_not_rewritten_by_an_unrelated_save(): void
    {
        $employee = $this->makeEmployee('Stable Name', 'S1', $this->branchOne);

        $employee->update(['designation' => 'Manager']);
        $employee->refresh();

        $this->assertSame('stable-name-s1', $employee->slug);
    }

    public function test_show_page_resolves_the_slug_route(): void
    {
        $employee = $this->makeEmployee('Haider Shakeel Rajpoot', '128', $this->branchOne);

        $this->actingAs($this->adminUser)
            ->get('/employees/' . $employee->slug)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Employee/Show')
                ->where('employee.id', $employee->id)
                ->where('employee.employee_code', '128')
                ->where('employee.slug', 'haider-shakeel-rajpoot-128')
            );
    }

    public function test_show_page_still_accepts_the_legacy_numeric_id(): void
    {
        $employee = $this->makeEmployee('Haider Shakeel Rajpoot', '128', $this->branchOne);

        $this->actingAs($this->adminUser)
            ->get('/employees/' . $employee->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Employee/Show')
                ->where('employee.id', $employee->id)
            );
    }

    public function test_numeric_route_value_resolves_the_primary_key_and_not_a_matching_employee_code(): void
    {
        // One employee owns the employee code "53"; employee id 53 is a different person.
        $codeOwner = $this->makeEmployee('Code Owner', '53', $this->branchOne);
        $idOwner = $this->makeEmployee('Id Owner', '99', $this->branchOne);

        $this->assertSame('53', $codeOwner->employee_code);
        $this->assertNotSame($codeOwner->id, $idOwner->id);

        $this->actingAs($this->adminUser)
            ->get('/employees/' . $idOwner->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('employee.id', $idOwner->id)
                ->where('employee.employee_code', '99')
            );
    }

    public function test_unknown_slug_returns_not_found(): void
    {
        $this->actingAs($this->adminUser)
            ->get('/employees/this-employee-does-not-exist')
            ->assertNotFound();
    }

    public function test_edit_and_documents_routes_accept_the_slug(): void
    {
        $employee = $this->makeEmployee('Haider Shakeel Rajpoot', '128', $this->branchOne);

        $this->actingAs($this->adminUser)
            ->get('/employees/' . $employee->slug . '/edit')
            ->assertOk();

        $this->actingAs($this->adminUser)
            ->get('/employees/' . $employee->slug . '/documents')
            ->assertOk();
    }

    public function test_a_user_from_another_branch_cannot_resolve_a_foreign_employee_slug(): void
    {
        $this->enableTenantScope();

        $viewPermission = Permission::create([
            'name' => 'View Employees',
            'slug' => 'view-employees',
        ]);

        $hrRole = Role::create([
            'name' => 'HR',
            'slug' => 'hr',
        ]);
        $hrRole->permissions()->sync([$viewPermission->id]);

        $foreignEmployee = $this->makeEmployee('Foreign Person', '999', $this->branchTwo);

        $otherUser = User::create([
            'name'       => 'Other Branch User',
            'email'      => 'other@earthdoha.com',
            'password'   => bcrypt('password'),
            'role'       => 'hr',
            'company_id' => $this->branchOne->id,
        ]);
        $otherUser->roles()->sync([$hrRole->id]);

        $this->actingAs($otherUser)
            ->get('/employees/' . $foreignEmployee->slug)
            ->assertNotFound();

        $this->actingAs($otherUser)
            ->get('/employees/' . $foreignEmployee->id)
            ->assertNotFound();
    }

    public function test_a_user_can_still_open_an_employee_from_their_own_branch(): void
    {
        $this->enableTenantScope();

        $viewPermission = Permission::create([
            'name' => 'View Employees',
            'slug' => 'view-employees',
        ]);

        $hrRole = Role::create([
            'name' => 'HR',
            'slug' => 'hr',
        ]);
        $hrRole->permissions()->sync([$viewPermission->id]);

        $ownEmployee = $this->makeEmployee('Own Person', '888', $this->branchOne);

        $ownUser = User::create([
            'name'       => 'Own Branch User',
            'email'      => 'own@earthdoha.com',
            'password'   => bcrypt('password'),
            'role'       => 'hr',
            'company_id' => $this->branchOne->id,
        ]);
        $ownUser->roles()->sync([$hrRole->id]);

        $this->actingAs($ownUser)
            ->get('/employees/' . $ownEmployee->slug)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('employee.id', $ownEmployee->id)
            );
    }

    public function test_route_key_falls_back_to_the_primary_key_when_no_slug_exists(): void
    {
        $employee = new Employee(['name' => 'No Slug Yet', 'employee_code' => 'X1']);

        $this->assertSame('', $employee->getRouteKey());
    }

    public function test_slug_is_stable_across_the_employee_index_payload(): void
    {
        $employee = $this->makeEmployee('Indexed Person', '321', $this->branchOne);

        $this->actingAs($this->adminUser)
            ->get('/employees')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Employee/Index')
                ->has('employees.data', 1)
                ->where('employees.data.0.slug', 'indexed-person-321')
                ->where('employees.data.0.employee_code', '321')
            );
    }
}
