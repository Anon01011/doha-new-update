<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employee_attendances', function (Blueprint $table) {
            $table->index('date', 'idx_attendance_date');
            $table->index(['company_id', 'date'], 'idx_attendance_company_date');
            $table->index(['employee_id', 'date'], 'idx_attendance_employee_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_attendances', function (Blueprint $table) {
            $table->dropIndex('idx_attendance_date');
            $table->dropIndex('idx_attendance_company_date');
            $table->dropIndex('idx_attendance_employee_date');
        });
    }
};
