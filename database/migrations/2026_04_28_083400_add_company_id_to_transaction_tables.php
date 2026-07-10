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
        $tables = ['leave_requests', 'advances', 'loans', 'grievances'];

        foreach ($tables as $table) {
            if (!Schema::hasColumn($table, 'company_id')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->unsignedBigInteger('company_id')->nullable()->after('employee_id');
                    $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                });

                // Populate existing records
                if (DB::getDriverName() === 'sqlite') {
                    DB::statement("UPDATE {$table} SET company_id = (SELECT company_id FROM employees WHERE employees.id = {$table}.employee_id) WHERE company_id IS NULL");
                } else {
                    DB::statement("UPDATE {$table} t 
                        INNER JOIN employees e ON t.employee_id = e.id 
                        SET t.company_id = e.company_id 
                        WHERE t.company_id IS NULL");
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['leave_requests', 'advances', 'loans', 'grievances'];

        foreach ($tables as $table) {
            if (Schema::hasColumn($table, 'company_id')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropForeign([ 'company_id' ]);
                    $table->dropColumn('company_id');
                });
            }
        }
    }
};
