<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RolePermissionSidebarAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Run migrations and ensure permissions exist
        $this->artisan('migrate');
    }

    public function test_shift_manager_with_company_and_roster_permissions_can_access_companies_and_rosters()
    {
        // 1. Create company & department
        $company = Company::create(['name' => 'Doha Central Branch']);
        $department = Department::create(['name' => 'Operations']);
        $company->departments()->attach($department->id);

        // 2. Create custom role shiftmanager
        $shiftManagerRole = Role::firstOrCreate(
            ['slug' => 'shiftmanager'],
            ['name' => 'Shift Manager', 'is_active' => true]
        );

        // 3. Assign permissions to role
        $permissions = Permission::whereIn('slug', [
            'view-branches',
            'manage-companies',
            'view-shift-rosters',
            'create-shift-rosters',
            'edit-shift-rosters',
            'manage-shift-rosters',
            'approve-shift-rosters',
            'view-shift-roster-management',
        ])->get();

        $shiftManagerRole->permissions()->sync($permissions->pluck('id'));

        // 4. Create employee and user with shiftmanager role
        $employee = Employee::create([
            'name' => 'Tariq Manager',
            'first_name' => 'Tariq',
            'last_name' => 'Manager',
            'email' => 'tariq.shift@test.com',
            'employee_code' => 'EMP-SM-001',
            'gender' => 'Male',
            'company_id' => $company->id,
            'department_id' => $department->id,
            'joining_date' => now()->subYear(),
            'is_active' => true,
        ]);

        $user = User::create([
            'name' => 'Tariq Manager',
            'email' => 'tariq.shift@test.com',
            'password' => bcrypt('password123'),
            'role' => 'shiftmanager',
            'employee_id' => $employee->id,
            'company_id' => $company->id,
        ]);

        $user->roles()->attach($shiftManagerRole->id);

        // 5. Verify permissions are correctly resolved
        $userPerms = $user->getAllPermissions()->pluck('slug')->toArray();
        $this->assertContains('view-branches', $userPerms);
        $this->assertContains('manage-companies', $userPerms);
        $this->assertContains('view-shift-rosters', $userPerms);
        $this->assertContains('create-shift-rosters', $userPerms);
        $this->assertContains('approve-shift-rosters', $userPerms);

        // 6. Verify HTTP access to /companies
        $response = $this->actingAs($user)->get(route('companies.index'));
        $response->assertOk();

        // 7. Verify HTTP access to /companies/{company}
        $showResponse = $this->actingAs($user)->get(route('companies.show', $company));
        $showResponse->assertOk();

        // 8. Verify HTTP access to /shift-rosters
        $rosterResponse = $this->actingAs($user)->get(route('shift-rosters.index'));
        $rosterResponse->assertOk();

        // 9. Verify HTTP access to /shift-rosters/management
        $mgmtResponse = $this->actingAs($user)->get(route('shift-rosters.management'));
        $mgmtResponse->assertOk();
    }

    public function test_plain_employee_without_permissions_is_denied_company_access()
    {
        $company = Company::create(['name' => 'Doha Central Branch']);
        $employeeRole = Role::firstOrCreate(
            ['slug' => 'employee'],
            ['name' => 'Employee', 'is_active' => true]
        );

        $employee = Employee::create([
            'name' => 'Plain Staff',
            'first_name' => 'Plain',
            'last_name' => 'Staff',
            'email' => 'plain.staff@test.com',
            'employee_code' => 'EMP-PL-001',
            'gender' => 'Male',
            'company_id' => $company->id,
            'joining_date' => now()->subYear(),
            'is_active' => true,
        ]);

        $user = User::create([
            'name' => 'Plain Staff',
            'email' => 'plain.staff@test.com',
            'password' => bcrypt('password123'),
            'role' => 'employee',
            'employee_id' => $employee->id,
            'company_id' => $company->id,
        ]);
        $user->roles()->attach($employeeRole->id);

        // Should receive 403 Forbidden on /companies
        $response = $this->actingAs($user)->get(route('companies.index'));
        $response->assertForbidden();

        // Should receive 403 Forbidden on /shift-rosters/management
        $mgmtResponse = $this->actingAs($user)->get(route('shift-rosters.management'));
        $mgmtResponse->assertForbidden();
    }

    public function test_shift_manager_with_role_shift_manager_hyphenated_slug()
    {
        $company = Company::create(['name' => 'Branch Hyphen']);

        $shiftRole = Role::firstOrCreate(
            ['slug' => 'shift-manager'],
            ['name' => 'Shift Manager Hyphen', 'is_active' => true]
        );

        $perm = Permission::where('slug', 'view-branches')->first();
        if ($perm) {
            $shiftRole->permissions()->sync([$perm->id]);
        }

        $user = User::create([
            'name' => 'Hyphen Manager',
            'email' => 'hyphen.sm@test.com',
            'password' => bcrypt('password123'),
            'role' => 'shift-manager',
            'company_id' => $company->id,
        ]);
        $user->roles()->attach($shiftRole->id);

        $response = $this->actingAs($user)->get(route('companies.index'));
        $response->assertOk();
    }

    public function test_system_default_roles_cannot_be_deleted()
    {
        $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'Super Admin', 'is_active' => true, 'is_default' => true]);
        $hrRole = Role::firstOrCreate(['slug' => 'hr'], ['name' => 'HR Manager', 'is_active' => true, 'is_default' => true]);
        $supervisorRole = Role::firstOrCreate(['slug' => 'supervisor'], ['name' => 'Supervisor', 'is_active' => true, 'is_default' => true]);
        $shiftManagerRole = Role::firstOrCreate(['slug' => 'shift-manager'], ['name' => 'Shift Roster Manager', 'is_active' => true, 'is_default' => true]);

        $adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin.guard@test.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);
        $adminUser->roles()->attach($adminRole->id);

        // Attempt deleting default roles
        foreach ([$adminRole, $hrRole, $supervisorRole, $shiftManagerRole] as $role) {
            $response = $this->actingAs($adminUser)->delete(route('roles.destroy', $role->id));
            $response->assertSessionHas('error');
            $this->assertDatabaseHas('roles', ['id' => $role->id]);
        }
    }

    public function test_user_can_create_edit_and_delete_custom_role()
    {
        $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'Super Admin', 'is_active' => true, 'is_default' => true]);
        $adminUser = User::create([
            'name' => 'Admin User 2',
            'email' => 'admin2.guard@test.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);
        $adminUser->roles()->attach($adminRole->id);

        $perm1 = Permission::where('slug', 'view-branches')->first();
        $perm2 = Permission::where('slug', 'view-shift-rosters')->first();

        // 1. Create custom role
        $createResponse = $this->actingAs($adminUser)->post(route('roles.store'), [
            'name' => 'Branch Coordinator',
            'slug' => 'branch-coordinator',
            'description' => 'Custom role for branch coordination',
            'is_active' => true,
            'permissions' => [$perm1->id, $perm2->id],
        ]);
        $createResponse->assertRedirect(route('roles.index'));

        $customRole = Role::where('slug', 'branch-coordinator')->first();
        $this->assertNotNull($customRole);
        $this->assertFalse((bool) $customRole->is_default);
        $this->assertEquals(2, $customRole->permissions()->count());

        // 2. Update custom role
        $updateResponse = $this->actingAs($adminUser)->put(route('roles.update', $customRole->id), [
            'name' => 'Senior Branch Coordinator',
            'slug' => 'senior-branch-coordinator',
            'description' => 'Updated custom role description',
            'is_active' => true,
            'permissions' => [$perm1->id],
        ]);
        $updateResponse->assertRedirect(route('roles.index'));

        $customRole->refresh();
        $this->assertEquals('Senior Branch Coordinator', $customRole->name);
        $this->assertEquals('senior-branch-coordinator', $customRole->slug);
        $this->assertEquals(1, $customRole->permissions()->count());

        // 3. Delete custom role (not assigned to any user)
        $deleteResponse = $this->actingAs($adminUser)->delete(route('roles.destroy', $customRole->id));
        $deleteResponse->assertRedirect(route('roles.index'));
        $this->assertDatabaseMissing('roles', ['id' => $customRole->id]);
    }

    public function test_custom_role_cannot_be_deleted_if_assigned_to_user()
    {
        $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'Super Admin', 'is_active' => true, 'is_default' => true]);
        $adminUser = User::create([
            'name' => 'Admin User 3',
            'email' => 'admin3.guard@test.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);
        $adminUser->roles()->attach($adminRole->id);

        // Create custom role
        $customRole = Role::create([
            'name' => 'Floor Lead',
            'slug' => 'floor-lead',
            'is_active' => true,
            'is_default' => false,
        ]);

        // Assign to user
        $staffUser = User::create([
            'name' => 'Floor Lead Staff',
            'email' => 'floor.lead@test.com',
            'password' => bcrypt('password123'),
            'role' => 'floor-lead',
        ]);
        $staffUser->roles()->attach($customRole->id);

        // Attempt deleting
        $response = $this->actingAs($adminUser)->delete(route('roles.destroy', $customRole->id));
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('roles', ['id' => $customRole->id]);
    }
}
