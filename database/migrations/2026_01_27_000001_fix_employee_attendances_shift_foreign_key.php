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
            // Drop old foreign key to 'shifts' table
            $table->dropForeign(['shift_id']);

            // Add new foreign key to 'shift_rosters' table
            $table->foreign('shift_id')
                ->references('id')
                ->on('shift_rosters')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_attendances', function (Blueprint $table) {
            // Drop foreign key to 'shift_rosters'
            $table->dropForeign(['shift_id']);

            // Restore old foreign key to 'shifts' table
            $table->foreign('shift_id')
                ->references('id')
                ->on('shifts')
                ->onDelete('set null');
        });
    }
};
