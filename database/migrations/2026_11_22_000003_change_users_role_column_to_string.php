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
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            // MySQL: Change ENUM('admin','hr','manager','employee') to VARCHAR(100) to allow custom roles and slugs
            DB::statement("ALTER TABLE `users` MODIFY `role` VARCHAR(100) NULL DEFAULT 'employee'");
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role', 100)->default('employee')->nullable()->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE `users` MODIFY `role` ENUM('admin', 'hr', 'manager', 'employee') NULL DEFAULT 'employee'");
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role', 50)->default('employee')->nullable()->change();
            });
        }
    }
};
