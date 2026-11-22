<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Role;
use App\Models\Permission;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('roles', 'is_default')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->boolean('is_default')->default(false)->after('is_active');
            });
        }

        // Define system default roles
        $defaultRoles = [
            [
                'name' => 'Super Admin',
                'slug' => 'admin',
                'description' => 'Full unrestricted system access across all modules and settings.',
                'is_active' => true,
                'is_default' => true,
            ],
            [
                'name' => 'HR Manager',
                'slug' => 'hr',
                'description' => 'Human resource management, employee profiles, attendance, leaves, and organizational branches.',
                'is_active' => true,
                'is_default' => true,
            ],
            [
                'name' => 'Manager',
                'slug' => 'manager',
                'description' => 'Departmental leadership, employee performance, attendance review, and roster management.',
                'is_active' => true,
                'is_default' => true,
            ],
            [
                'name' => 'Supervisor',
                'slug' => 'supervisor',
                'description' => 'Front-line supervision, team shift coordination, live attendance monitoring, and task assignments.',
                'is_active' => true,
                'is_default' => true,
            ],
            [
                'name' => 'Shift Roster Manager',
                'slug' => 'shift-manager',
                'description' => 'Specialized role for shift roster scheduling, approvals, branch duty assignments, and timing configurations.',
                'is_active' => true,
                'is_default' => true,
            ],
            [
                'name' => 'Employee',
                'slug' => 'employee',
                'description' => 'Standard employee self-service access to own attendance, shift schedules, leaves, and payslips.',
                'is_active' => true,
                'is_default' => true,
            ],
        ];

        foreach ($defaultRoles as $roleData) {
            $role = Role::where('slug', $roleData['slug'])->first();
            if ($role) {
                $role->update([
                    'is_default' => true,
                    'is_active' => true,
                    'description' => $role->description ?: $roleData['description'],
                ]);
            } else {
                $role = Role::create($roleData);
            }

            // Assign standard permissions to Supervisor if newly created or missing
            if ($role->slug === 'supervisor') {
                $supervisorPerms = Permission::whereIn('slug', [
                    'view-employees',
                    'view-attendance',
                    'view-live-attendance',
                    'view-shift-rosters',
                    'create-shift-rosters',
                    'edit-shift-rosters',
                    'manage-shift-rosters',
                    'view-shift-roster-management',
                    'view-branches',
                    'view-departments',
                    'view-leave-requests',
                    'approve-leave-requests',
                ])->pluck('id')->toArray();
                if (!empty($supervisorPerms)) {
                    $role->permissions()->syncWithoutDetaching($supervisorPerms);
                }
            }

            // Assign standard permissions to Shift Manager
            if ($role->slug === 'shift-manager') {
                $shiftPerms = Permission::whereIn('slug', [
                    'view-shift-rosters',
                    'create-shift-rosters',
                    'edit-shift-rosters',
                    'manage-shift-rosters',
                    'approve-shift-rosters',
                    'view-shift-roster-management',
                    'view-branches',
                    'manage-companies',
                    'view-companies',
                    'view-departments',
                ])->pluck('id')->toArray();
                if (!empty($shiftPerms)) {
                    $role->permissions()->syncWithoutDetaching($shiftPerms);
                }
            }
        }

        // Also mark shiftmanager (alias) as default if it exists
        Role::whereIn('slug', ['shiftmanager', 'shift_manager', 'super-admin'])->update(['is_default' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('roles', 'is_default')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->dropColumn('is_default');
            });
        }
    }
};
