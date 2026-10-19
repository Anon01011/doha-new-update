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
        if (Schema::hasTable('leave_types')) {
            Schema::table('leave_types', function (Blueprint $table) {
                if (!Schema::hasColumn('leave_types', 'min_notice_days')) {
                    // NULL = fall back to the global "minimum_notice_period" setting.
                    // 0    = no advance notice required for this leave type.
                    $table->integer('min_notice_days')->nullable()->after('max_days_per_year');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('leave_types')) {
            Schema::table('leave_types', function (Blueprint $table) {
                if (Schema::hasColumn('leave_types', 'min_notice_days')) {
                    $table->dropColumn('min_notice_days');
                }
            });
        }
    }
};
