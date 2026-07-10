<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }
        // Convert existing text values to valid JSON before changing column type
        // Rows that already have a JSON array string will work fine
        // Rows with null stay null
        DB::statement("ALTER TABLE companies MODIFY COLUMN weekly_off_days JSON NULL");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }
        DB::statement("ALTER TABLE companies MODIFY COLUMN weekly_off_days TEXT NULL");
    }
};
