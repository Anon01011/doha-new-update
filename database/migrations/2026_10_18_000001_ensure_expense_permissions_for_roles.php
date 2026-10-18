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
            ['name' => 'View Expenses', 'slug' => 'view-expenses', 'module' => 'expense', 'description' => 'Can view expense claims'],
            ['name' => 'Create Expenses', 'slug' => 'create-expenses', 'module' => 'expense', 'description' => 'Can submit expense claims'],
            ['name' => 'Approve Expenses (Manager)', 'slug' => 'approve-expenses-manager', 'module' => 'expense', 'description' => 'Can approve or reject expense claims as reporting manager'],
            ['name' => 'Approve Expenses (Finance)', 'slug' => 'approve-expenses-finance', 'module' => 'expense', 'description' => 'Can review, approve tax coding, and process payments as finance'],
            ['name' => 'Manage Expense Categories', 'slug' => 'manage-expense-categories', 'module' => 'expense', 'description' => 'Can manage expense categories and policy limits'],
            ['name' => 'View Expense Reports', 'slug' => 'view-expense-reports', 'module' => 'report', 'description' => 'Can view expense analytics and reports'],
        ];

        $permissionIds = [];
        foreach ($permissions as $permData) {
            $perm = Permission::firstOrCreate(
                ['slug' => $permData['slug']],
                [
                    'name' => $permData['name'],
                    'module' => $permData['module'],
                    'description' => $permData['description'],
                    'is_active' => true,
                ]
            );
            $permissionIds[$permData['slug']] = $perm->id;
        }

        // Assign to Employee Role
        $employeeRole = Role::where('slug', 'employee')->first();
        if ($employeeRole) {
            $employeePermSlugs = ['view-expenses', 'create-expenses'];
            foreach ($employeePermSlugs as $slug) {
                if (isset($permissionIds[$slug]) && !$employeeRole->permissions()->where('permissions.id', $permissionIds[$slug])->exists()) {
                    $employeeRole->permissions()->attach($permissionIds[$slug]);
                }
            }
        }

        // Assign to Manager Role
        $managerRole = Role::where('slug', 'manager')->first();
        if ($managerRole) {
            $managerPermSlugs = ['view-expenses', 'create-expenses', 'approve-expenses-manager', 'view-expense-reports'];
            foreach ($managerPermSlugs as $slug) {
                if (isset($permissionIds[$slug]) && !$managerRole->permissions()->where('permissions.id', $permissionIds[$slug])->exists()) {
                    $managerRole->permissions()->attach($permissionIds[$slug]);
                }
            }
        }

        // Assign to HR Role
        $hrRole = Role::where('slug', 'hr')->first();
        if ($hrRole) {
            $hrPermSlugs = ['view-expenses', 'create-expenses', 'approve-expenses-manager', 'view-expense-reports', 'manage-expense-categories'];
            foreach ($hrPermSlugs as $slug) {
                if (isset($permissionIds[$slug]) && !$hrRole->permissions()->where('permissions.id', $permissionIds[$slug])->exists()) {
                    $hrRole->permissions()->attach($permissionIds[$slug]);
                }
            }
        }

        // Assign to Finance Role
        $financeRole = Role::where('slug', 'finance')->first();
        if ($financeRole) {
            $financePermSlugs = ['view-expenses', 'approve-expenses-finance', 'manage-expense-categories', 'view-expense-reports'];
            foreach ($financePermSlugs as $slug) {
                if (isset($permissionIds[$slug]) && !$financeRole->permissions()->where('permissions.id', $permissionIds[$slug])->exists()) {
                    $financeRole->permissions()->attach($permissionIds[$slug]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op to avoid breaking role configuration
    }
};
