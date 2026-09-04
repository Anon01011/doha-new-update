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
        // 1. Clean up empty strings to NULL so unique index works properly on nullable fields
        DB::table('employees')->where('mobile', '')->update(['mobile' => null]);
        DB::table('employees')->where('email', '')->update(['email' => null]);
        DB::table('employees')->where('qid_number', '')->update(['qid_number' => null]);
        if (Schema::hasColumn('employees', 'passport_number')) {
            DB::table('employees')->where('passport_number', '')->update(['passport_number' => null]);
        }

        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'is_code_edited')) {
                $table->boolean('is_code_edited')->default(false)->after('employee_code');
            }

            // Add unique indexes if not already unique
            $table->unique('mobile', 'employees_mobile_unique');
            $table->unique('email', 'employees_email_unique');
            $table->unique('qid_number', 'employees_qid_number_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropUnique('employees_mobile_unique');
            $table->dropUnique('employees_email_unique');
            $table->dropUnique('employees_qid_number_unique');
            if (Schema::hasColumn('employees', 'is_code_edited')) {
                $table->dropColumn('is_code_edited');
            }
        });
    }
};
