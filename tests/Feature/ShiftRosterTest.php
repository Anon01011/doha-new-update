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

        // Create Admin role if not existing
        $adminRole = Role::firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Admin', 'is_active' => true, 'is_default' => true]
        );

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

        // Verify Inertia defaults company_id to first company and filters employees accordingly
        $response->assertInertia(fn (Assert $page) => $page
            ->component('ShiftRoster/Index')
            ->where('company_id', $this->branch1->id)
            ->has('employees', 1)
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
        $shiftManagerRole = Role::firstOrCreate(
            ['slug' => 'shift-manager'],
            ['name' => 'Shift Manager', 'is_active' => true]
        );

        $perm1 = \App\Models\Permission::firstOrCreate(['slug' => 'view-shift-rosters'], [
            'name' => 'View Shift Rosters',
            'module' => 'shift-roster',
            'is_active' => true,
        ]);
        $perm2 = \App\Models\Permission::firstOrCreate(['slug' => 'create-shift-rosters'], [
            'name' => 'Create Shift Rosters',
            'module' => 'shift-roster',
            'is_active' => true,
        ]);
        $perm3 = \App\Models\Permission::firstOrCreate(['slug' => 'manage-shift-rosters'], [
            'name' => 'Manage Shift Rosters',
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

    public function test_get_shift_templates_respects_settings_configured_times()
    {
        $controller = app(\App\Http\Controllers\ShiftRosterController::class);

        // 1. Default templates when no settings are set
        $templates = $controller->getShiftTemplates($this->branch1->id);
        $this->assertArrayHasKey('morning', $templates);
        $this->assertArrayHasKey('evening', $templates);
        $this->assertArrayHasKey('night', $templates);
        $this->assertArrayHasKey('full_day', $templates);
        $this->assertArrayHasKey('half_day', $templates);
        $this->assertArrayHasKey('custom', $templates);
        $this->assertEquals('6:00 AM - 2:00 PM', $templates['morning']['time']);

        // 2. Configure custom morning shift start and end times
        \App\Models\Setting::set('shift_morning_start', '07:30', 'attendance', 'string', $this->branch1->id);
        \App\Models\Setting::set('shift_morning_end', '16:00', 'attendance', 'string', $this->branch1->id);

        $customTemplates = $controller->getShiftTemplates($this->branch1->id);
        $this->assertEquals('7:30 AM - 4:00 PM', $customTemplates['morning']['time']);
        $this->assertEquals('07:30', $customTemplates['morning']['start_time']);
        $this->assertEquals('16:00', $customTemplates['morning']['end_time']);
    }

    public function test_shift_roster_index_returns_json_on_ajax_wants_json_request()
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson(route('shift-rosters.index', [
                'company_id' => $this->branch1->id,
            ]));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'companies',
            'departments',
            'employees',
            'rosters',
            'week_start',
            'company_id',
            'shiftTemplates',
            'shiftTypes',
        ]);
        $this->assertEquals($this->branch1->id, $response->json('company_id'));
        $this->assertCount(1, $response->json('employees'));
    }

    public function test_shift_roster_create_returns_json_for_dynamic_runtime_loading()
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson(route('shift-rosters.create', [
                'company' => $this->branch1->id,
            ]));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'companies',
            'departments',
            'employees',
            'shiftTemplates',
            'selectedCompany',
            'shiftTypes',
            'approvedLeaves',
        ]);
        $this->assertEquals($this->branch1->id, $response->json('selectedCompany'));
    }

    public function test_update_attendance_settings_persists_custom_shift_times()
    {
        $response = $this->actingAs($this->adminUser)
            ->post(route('settings.attendance.update'), [
                'shift_morning_start'  => '07:00',
                'shift_morning_end'    => '15:00',
                'shift_evening_start'  => '15:00',
                'shift_evening_end'    => '23:00',
                'shift_night_start'    => '23:00',
                'shift_night_end'      => '07:00',
                'shift_full_day_start' => '09:00',
                'shift_full_day_end'   => '18:00',
                'shift_half_day_start' => '09:00',
                'shift_half_day_end'   => '13:00',
            ]);

        $response->assertSessionHas('success');
        $this->assertEquals('07:00', \App\Models\Setting::get('shift_morning_start', '06:00'));
        $this->assertEquals('15:00', \App\Models\Setting::get('shift_morning_end', '14:00'));
        $this->assertEquals('09:00', \App\Models\Setting::get('shift_full_day_start', '08:00'));
    }

    public function test_shift_roster_create_and_index_return_inertia_response_for_inertia_requests()
    {
        // 1. Visit to create page returns Inertia component (never plain JSON)
        $createResponse = $this->actingAs($this->adminUser)
            ->get(route('shift-rosters.create'));

        $createResponse->assertStatus(200);
        $createResponse->assertInertia(fn (Assert $page) => $page
            ->component('ShiftRoster/Create')
            ->has('companies')
            ->has('departments')
        );

        // 2. Visit to index page returns Inertia component
        $indexResponse = $this->actingAs($this->adminUser)
            ->get(route('shift-rosters.index'));

        $indexResponse->assertStatus(200);
        $indexResponse->assertInertia(fn (Assert $page) => $page
            ->component('ShiftRoster/Index')
            ->has('companies')
        );
    }
}
