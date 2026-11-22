<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Permission;
use App\Models\Role;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $permissions = [
            // Company & Branch permissions
            ['name' => 'View Branches', 'slug' => 'view-branches', 'module' => 'company', 'description' => 'Can view branches list'],
            ['name' => 'Manage Branches', 'slug' => 'manage-branches', 'module' => 'company', 'description' => 'Can create, edit and delete branches'],
            ['name' => 'View Companies', 'slug' => 'view-companies', 'module' => 'company', 'description' => 'Can view companies list'],
            ['name' => 'Manage Companies', 'slug' => 'manage-companies', 'module' => 'company', 'description' => 'Can manage companies/branches'],
            ['name' => 'View Departments', 'slug' => 'view-departments', 'module' => 'company', 'description' => 'Can view departments'],
            ['name' => 'Manage Departments', 'slug' => 'manage-departments', 'module' => 'company', 'description' => 'Can manage departments'],

            // Shift Roster permissions
            ['name' => 'View Shift Rosters', 'slug' => 'view-shift-rosters', 'module' => 'shift-roster', 'description' => 'Can view shift rosters'],
            ['name' => 'Create Shift Rosters', 'slug' => 'create-shift-rosters', 'module' => 'shift-roster', 'description' => 'Can create shift rosters'],
            ['name' => 'Edit Shift Rosters', 'slug' => 'edit-shift-rosters', 'module' => 'shift-roster', 'description' => 'Can edit shift rosters'],
            ['name' => 'Delete Shift Rosters', 'slug' => 'delete-shift-rosters', 'module' => 'shift-roster', 'description' => 'Can delete shift rosters'],
            ['name' => 'Manage Shift Rosters', 'slug' => 'manage-shift-rosters', 'module' => 'shift-roster', 'description' => 'Can manage shift rosters (bulk operations, export, email)'],
            ['name' => 'Approve Shift Rosters', 'slug' => 'approve-shift-rosters', 'module' => 'shift-roster', 'description' => 'Can approve or reject shift rosters'],
            ['name' => 'View Shift Roster Management', 'slug' => 'view-shift-roster-management', 'module' => 'shift-roster', 'description' => 'Can view shift roster management, approval status overview, and schedule audit details'],
        ];

        $permissionModels = [];
        foreach ($permissions as $p) {
            $perm = Permission::firstOrCreate(
                ['slug' => $p['slug']],
                [
                    'name' => $p['name'],
                    'module' => $p['module'],
                    'description' => $p['description'],
                    'is_active' => true,
                ]
            );
            $permissionModels[$p['slug']] = $perm->id;
        }

        // Attach to Admin role
        $adminRole = Role::where('slug', 'admin')->first();
        if ($adminRole) {
            foreach ($permissionModels as $permId) {
                if (!$adminRole->permissions()->where('permissions.id', $permId)->exists()) {
                    $adminRole->permissions()->attach($permId);
                }
            }
        }

        // Attach to HR role
        $hrRole = Role::where('slug', 'hr')->first();
        if ($hrRole) {
            $hrSlugs = [
                'view-branches', 'manage-branches', 'view-companies', 'manage-companies',
                'view-departments', 'manage-departments',
                'view-shift-rosters', 'create-shift-rosters', 'edit-shift-rosters', 'delete-shift-rosters',
                'manage-shift-rosters', 'approve-shift-rosters', 'view-shift-roster-management',
            ];
            foreach ($hrSlugs as $slug) {
                if (isset($permissionModels[$slug]) && !$hrRole->permissions()->where('permissions.id', $permissionModels[$slug])->exists()) {
                    $hrRole->permissions()->attach($permissionModels[$slug]);
                }
            }
        }

        // Attach to Manager role
        $managerRole = Role::where('slug', 'manager')->first();
        if ($managerRole) {
            $managerSlugs = [
                'view-branches', 'view-companies', 'view-departments',
                'view-shift-rosters', 'create-shift-rosters', 'edit-shift-rosters',
                'manage-shift-rosters', 'approve-shift-rosters', 'view-shift-roster-management',
            ];
            foreach ($managerSlugs as $slug) {
                if (isset($permissionModels[$slug]) && !$managerRole->permissions()->where('permissions.id', $permissionModels[$slug])->exists()) {
                    $managerRole->permissions()->attach($permissionModels[$slug]);
                }
            }
        }

        // Attach to any Shift Manager role variant (shiftmanager, shift-manager, shift_manager)
        $shiftRoles = Role::whereIn('slug', ['shift-manager', 'shiftmanager', 'shift_manager'])->get();
        foreach ($shiftRoles as $shiftRole) {
            $shiftSlugs = [
                'view-branches', 'view-companies', 'manage-companies',
                'view-shift-rosters', 'create-shift-rosters', 'edit-shift-rosters',
                'manage-shift-rosters', 'approve-shift-rosters', 'view-shift-roster-management',
            ];
            foreach ($shiftSlugs as $slug) {
                if (isset($permissionModels[$slug]) && !$shiftRole->permissions()->where('permissions.id', $permissionModels[$slug])->exists()) {
                    $shiftRole->permissions()->attach($permissionModels[$slug]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Keep permissions intact on rollback to avoid disrupting live role configs
    }
};
