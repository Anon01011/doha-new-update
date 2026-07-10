<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('shift_rosters', function (Blueprint $table) {
            // Composite index for fast filtering by company and date ranges
            $table->index(['company_id', 'week_start'], 'idx_company_week');

            // Index for employee-specific lookups within a company
            $table->index(['employee_id', 'company_id'], 'idx_employee_company');

            // Supporting the common lookup pattern (company + date + day)
            $table->index(['company_id', 'week_start', 'day'], 'idx_roster_lookup');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shift_rosters', function (Blueprint $table) {
            $table->dropIndex('idx_company_week');
            $table->dropIndex('idx_employee_company');
            $table->dropIndex('idx_roster_lookup');
        });
    }
};
