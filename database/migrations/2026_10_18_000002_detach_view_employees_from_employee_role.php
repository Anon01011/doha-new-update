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
        $employeeRole = Role::where('slug', 'employee')->first();
        $viewEmployeesPerm = Permission::where('slug', 'view-employees')->first();

        if ($employeeRole && $viewEmployeesPerm) {
            $employeeRole->permissions()->detach($viewEmployeesPerm->id);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op
    }
};
