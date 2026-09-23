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
        Schema::table('departments', function (Blueprint $table) {
            if (!Schema::hasColumn('departments', 'standard_working_hours')) {
                $table->decimal('standard_working_hours', 4, 2)->nullable()->after('status');
            }
            if (!Schema::hasColumn('departments', 'working_days_per_month')) {
                $table->unsignedSmallInteger('working_days_per_month')->nullable()->after('standard_working_hours');
            }
            if (!Schema::hasColumn('departments', 'opening_time')) {
                $table->string('opening_time', 10)->nullable()->after('working_days_per_month');
            }
            if (!Schema::hasColumn('departments', 'closing_time')) {
                $table->string('closing_time', 10)->nullable()->after('opening_time');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $cols = ['standard_working_hours', 'working_days_per_month', 'opening_time', 'closing_time'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('departments', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
