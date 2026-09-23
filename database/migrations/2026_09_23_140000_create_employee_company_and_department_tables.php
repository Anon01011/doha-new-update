<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Pivot table for Employee <-> Companies (Branches)
        if (!Schema::hasTable('employee_company')) {
            Schema::create('employee_company', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
                $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
                $table->timestamps();

                $table->unique(['employee_id', 'company_id']);
            });

            // Populate from existing employees.company_id
            $employees = DB::table('employees')->whereNotNull('company_id')->get(['id', 'company_id']);
            foreach ($employees as $emp) {
                if ($emp->company_id) {
                    DB::table('employee_company')->insertOrIgnore([
                        'employee_id' => $emp->id,
                        'company_id' => $emp->company_id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        // 2. Pivot table for Employee <-> Departments
        if (!Schema::hasTable('employee_department')) {
            Schema::create('employee_department', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
                $table->foreignId('department_id')->constrained('departments')->onDelete('cascade');
                $table->timestamps();

                $table->unique(['employee_id', 'department_id']);
            });

            // Populate from existing employees.department_id
            $employees = DB::table('employees')->whereNotNull('department_id')->get(['id', 'department_id']);
            foreach ($employees as $emp) {
                if ($emp->department_id) {
                    DB::table('employee_department')->insertOrIgnore([
                        'employee_id' => $emp->id,
                        'department_id' => $emp->department_id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_department');
        Schema::dropIfExists('employee_company');
    }
};
