<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the remaining employee columns that the application code depends on
 * but that were never created in the database:
 *
 *  - marital_status      : shown on the employee profile page (Employee/Show)
 *                          and selectable on the create and edit forms. It is
 *                          backed by the "Marital Status" dropdown category.
 *  - health_card_file_path : uploaded health card document. The profile page
 *                          already reads this attribute, but only the health
 *                          card number and expiry date existed in the schema.
 *
 * Both columns are nullable so existing employees are not affected, and both
 * are guarded with Schema::hasColumn() so the migration is safe to re-run on
 * a partially migrated database.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $missingMaritalStatus = ! Schema::hasColumn('employees', 'marital_status');
        $missingHealthCardFile = ! Schema::hasColumn('employees', 'health_card_file_path');

        if (! $missingMaritalStatus && ! $missingHealthCardFile) {
            return;
        }

        Schema::table('employees', function (Blueprint $table) use (
            $missingMaritalStatus,
            $missingHealthCardFile
        ) {
            if ($missingMaritalStatus) {
                $table->string('marital_status', 50)->nullable()->after('nationality');
            }

            if ($missingHealthCardFile) {
                $table->string('health_card_file_path')->nullable()->after('health_card_expiry_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasColumn('employees', 'marital_status')) {
                $table->dropColumn('marital_status');
            }
            if (Schema::hasColumn('employees', 'health_card_file_path')) {
                $table->dropColumn('health_card_file_path');
            }
        });
    }
};
