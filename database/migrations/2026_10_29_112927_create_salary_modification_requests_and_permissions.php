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
        if (!Schema::hasTable('salary_modification_requests')) {
            Schema::create('salary_modification_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
                $table->foreignId('company_id')->nullable()->constrained('companies')->nullOnDelete();
                $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();

                // Salary & Payment details
                $table->decimal('current_basic_salary', 12, 2)->default(0);
                $table->decimal('proposed_basic_salary', 12, 2)->default(0);
                $table->string('current_payment_type')->nullable();
                $table->string('proposed_payment_type')->nullable();
                $table->string('current_bank_name')->nullable();
                $table->string('proposed_bank_name')->nullable();
                $table->string('current_bank_account_number')->nullable();
                $table->string('proposed_bank_account_number')->nullable();
                $table->string('current_iban')->nullable();
                $table->string('proposed_iban')->nullable();

                // Component breakdown snapshot (JSON: [{component_id, name, amount, type, value_type}])
                $table->json('current_salary_structures')->nullable();
                $table->json('proposed_salary_structures')->nullable();

                // Request status & Review
                $table->text('reason')->nullable();
                $table->string('status', 20)->default('pending')->index(); // pending, approved, rejected
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('reviewed_at')->nullable();
                $table->text('review_notes')->nullable();

                $table->timestamps();

                $table->index(['employee_id', 'status']);
                $table->index(['company_id', 'status']);
            });
        }

        // Register permissions
        $permissions = [
            [
                'slug' => 'edit-employee-salary',
                'name' => 'Edit Employee Salary',
                'module' => 'employee',
                'description' => 'Can edit employee salary details and structures in create/edit screens',
            ],
            [
                'slug' => 'approve-salary-modifications',
                'name' => 'Approve Salary Modifications',
                'module' => 'employee',
                'description' => 'Can review, approve, or reject pending employee salary modification requests',
            ],
        ];

        $createdPermIds = [];
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
            $createdPermIds[] = $perm->id;
        }

        // Assign to Admin and HR roles by default
        $roles = Role::whereIn('slug', ['admin', 'hr'])->get();
        foreach ($roles as $role) {
            $role->permissions()->syncWithoutDetaching($createdPermIds);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_modification_requests');

        $perms = Permission::whereIn('slug', ['edit-employee-salary', 'approve-salary-modifications'])->get();
        foreach ($perms as $perm) {
            $perm->roles()->detach();
            $perm->users()->detach();
            $perm->delete();
        }
    }
};
