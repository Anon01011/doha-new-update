<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'probation_start_date')) {
                $table->date('probation_start_date')->nullable()->after('joined_date');
            }
            if (!Schema::hasColumn('employees', 'probation_end_date')) {
                $table->date('probation_end_date')->nullable()->after('probation_start_date');
            }
            if (!Schema::hasColumn('employees', 'probation_status')) {
                $table->string('probation_status', 50)->nullable()->after('probation_end_date');
            }
            if (!Schema::hasColumn('employees', 'confirmation_date')) {
                $table->date('confirmation_date')->nullable()->after('probation_status');
            }
            if (!Schema::hasColumn('employees', 'internship_start_date')) {
                $table->date('internship_start_date')->nullable()->after('confirmation_date');
            }
            if (!Schema::hasColumn('employees', 'internship_end_date')) {
                $table->date('internship_end_date')->nullable()->after('internship_start_date');
            }
            if (!Schema::hasColumn('employees', 'internship_status')) {
                $table->string('internship_status', 50)->nullable()->after('internship_end_date');
            }
        });

        // Seed probation_duration_months setting (3 months default)
        if (Schema::hasTable('settings')) {
            $existing = DB::table('settings')->where('key', 'probation_duration_months')->exists();
            if (!$existing) {
                DB::table('settings')->insert([
                    'key'         => 'probation_duration_months',
                    'value'       => '3',
                    'category'    => 'hr',
                    'type'        => 'number',
                    'description' => 'Default probation period in months (applied when creating probationary employees)',
                    'is_public'   => 0,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }
        }

        // Backfill existing Probation employees (MySQL driver only)
        if (\Illuminate\Support\Facades\DB::getDriverName() === 'mysql') {
            DB::statement("UPDATE employees SET probation_start_date = joined_date WHERE employee_category = 'Probation' AND joined_date IS NOT NULL AND probation_start_date IS NULL");
            DB::statement("UPDATE employees SET probation_end_date = DATE_ADD(joined_date, INTERVAL 3 MONTH) WHERE employee_category = 'Probation' AND joined_date IS NOT NULL AND probation_end_date IS NULL");
            DB::statement("UPDATE employees SET internship_start_date = joined_date WHERE employee_category = 'Intern' AND joined_date IS NOT NULL AND internship_start_date IS NULL");
        }
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            foreach (['probation_start_date','probation_end_date','probation_status','confirmation_date','internship_start_date','internship_end_date','internship_status'] as $col) {
                if (Schema::hasColumn('employees', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
        DB::table('settings')->where('key', 'probation_duration_months')->delete();
    }
};
