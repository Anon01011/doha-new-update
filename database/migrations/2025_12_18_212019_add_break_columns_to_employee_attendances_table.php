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
        Schema::table('employee_attendances', function (Blueprint $table) {
            $table->timestamp('current_break_start')->nullable()->after('to_time');
            $table->integer('total_break_minutes')->default(0)->after('current_break_start');
            $table->json('break_history')->nullable()->after('total_break_minutes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_attendances', function (Blueprint $table) {
            $table->dropColumn(['current_break_start', 'total_break_minutes', 'break_history']);
        });
    }
};
