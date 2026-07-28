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
        Schema::table('employees', function (Blueprint $table) {
            $table->boolean('no_overtime')->default(false)->after('basic_salary');
        });

        Schema::table('employee_attendances', function (Blueprint $table) {
            $table->boolean('no_overtime')->default(false)->after('ot_amt');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('no_overtime');
        });

        Schema::table('employee_attendances', function (Blueprint $table) {
            $table->dropColumn('no_overtime');
        });
    }
};
