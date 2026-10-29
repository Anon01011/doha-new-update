<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Permission;
use App\Models\Role;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $perm = Permission::firstOrCreate(
            ['slug' => 'view-employee-salary'],
            [
                'name' => 'View Employee Salary',
                'module' => 'employee',
                'description' => 'Can view employee salary details and salary tab on profile',
                'is_active' => true,
            ]
        );

        // Assign by default to HR role
        $hrRole = Role::where('slug', 'hr')->first();
        if ($hrRole && !$hrRole->permissions()->where('permissions.id', $perm->id)->exists()) {
            $hrRole->permissions()->attach($perm->id);
        }

        // Assign by default to Admin role
        $adminRole = Role::where('slug', 'admin')->first();
        if ($adminRole && !$adminRole->permissions()->where('permissions.id', $perm->id)->exists()) {
            $adminRole->permissions()->attach($perm->id);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $perm = Permission::where('slug', 'view-employee-salary')->first();
        if ($perm) {
            $perm->roles()->detach();
            $perm->users()->detach();
            $perm->delete();
        }
    }
};

