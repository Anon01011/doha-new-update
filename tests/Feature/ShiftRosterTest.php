<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\ShiftRoster;
use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Inertia\Testing\AssertableInertia as Assert;

class ShiftRosterTest extends TestCase
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
    }

    public function test_admin_default_view_returns_all_branches_initially()
    {
        $response = $this->actingAs($this->adminUser)
            ->get(route('shift-rosters.index'));

        $response->assertStatus(200);

        // Verify Inertia returns all employees and company_id is null/empty
        $response->assertInertia(fn (Assert $page) => $page
            ->component('ShiftRoster/Index')
            ->where('company_id', null)
            ->has('employees', 2)
        );
    }

    public function test_admin_with_selected_branch_filters_correct_employees()
    {
        // Request for Branch One
        $response = $this->actingAs($this->adminUser)
            ->get(route('shift-rosters.index', ['company_id' => $this->branch1->id]));

        $response->assertStatus(200);

        // Verify Inertia filters to Branch One's employee
        $response->assertInertia(fn (Assert $page) => $page
            ->component('ShiftRoster/Index')
            ->where('company_id', (string) $this->branch1->id)
            ->has('employees', 1)
            ->where('employees.0.id', $this->emp1->id)
        );
    }

    public function test_employee_default_view_automatically_restricts_to_own_branch()
    {
        $response = $this->actingAs($this->employeeUser)
            ->get(route('shift-rosters.index'));

        $response->assertStatus(200);

        // Verify company_id is restricted to branch1 and only returns employeeUser's employee row (emp1)
        $response->assertInertia(fn (Assert $page) => $page
            ->component('ShiftRoster/Index')
            ->where('company_id', $this->branch1->id)
            ->has('employees', 1)
            ->where('employees.0.id', $this->emp1->id)
        );
    }

    public function test_custom_shift_manager_role_can_access_and_create_shifts()
    {
        // Create custom shift-manager role and assign permissions
        $shiftManagerRole = Role::create([
            'name' => 'Shift Manager',
            'slug' => 'shift-manager',
            'is_active' => true,
        ]);

        $perm1 = \App\Models\Permission::create([
            'name' => 'View Shift Rosters',
            'slug' => 'view-shift-rosters',
            'module' => 'shift-roster',
            'is_active' => true,
        ]);
        $perm2 = \App\Models\Permission::create([
            'name' => 'Create Shift Rosters',
            'slug' => 'create-shift-rosters',
            'module' => 'shift-roster',
            'is_active' => true,
        ]);
        $perm3 = \App\Models\Permission::create([
            'name' => 'Manage Shift Rosters',
            'slug' => 'manage-shift-rosters',
            'module' => 'shift-roster',
            'is_active' => true,
        ]);

        $shiftManagerRole->permissions()->sync([$perm1->id, $perm2->id, $perm3->id]);

        // Create shift manager user
        $shiftManagerUser = User::create([
            'name' => 'Shift Manager User',
            'email' => 'shiftmanager@earthdoha.com',
            'password' => bcrypt('password'),
            'role' => 'shift-manager',
            'employee_id' => $this->emp1->id,
            'company_id' => $this->branch1->id,
        ]);
        $shiftManagerUser->roles()->sync([$shiftManagerRole->id]);

        // 1. Shift Manager can access index
        $indexResponse = $this->actingAs($shiftManagerUser)
            ->get(route('shift-rosters.index'));
        $indexResponse->assertStatus(200);

        // 2. Shift Manager can access create form
        $createFormResponse = $this->actingAs($shiftManagerUser)
            ->get(route('shift-rosters.create'));
        $createFormResponse->assertStatus(200);

        // 3. Shift Manager can create shift via createShift
        $createShiftResponse = $this->actingAs($shiftManagerUser)
            ->post(route('shift-rosters.createShift'), [
                'employee_id' => $this->emp1->id,
                'company_id' => $this->branch1->id,
                'week_start' => '2026-09-21',
                'day' => 'Monday',
                'shift_time' => '8:00 AM - 5:00 PM',
                'shift_type' => 'Morning',
                'designation' => 'Lead Stylist',
                'notes' => 'Test Shift',
            ]);

        $createShiftResponse->assertSessionHasNoErrors();
        $this->assertDatabaseHas('shift_rosters', [
            'employee_id' => $this->emp1->id,
            'company_id' => $this->branch1->id,
            'day' => 'Monday',
            'shift_time' => '8:00 AM - 5:00 PM',
        ]);
    }
}
