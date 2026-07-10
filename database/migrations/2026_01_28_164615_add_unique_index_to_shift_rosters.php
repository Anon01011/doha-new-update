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
            // Unique index for upsert support and data integrity
            $table->unique(['employee_id', 'week_start', 'day'], 'uniq_shift_roster');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shift_rosters', function (Blueprint $table) {
            $table->dropUnique('uniq_shift_roster');
        });
    }
};
