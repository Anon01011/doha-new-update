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
        Schema::table('salary_components', function (Blueprint $table) {
            $table->string('value_type')->default('flat')->after('type')->comment('flat or percentage');
        });

        Schema::table('employee_salary_structures', function (Blueprint $table) {
            $table->string('value_type')->default('flat')->after('component_id')->comment('flat or percentage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_salary_structures', function (Blueprint $table) {
            $table->dropColumn('value_type');
        });

        Schema::table('salary_components', function (Blueprint $table) {
            $table->dropColumn('value_type');
        });
    }
};
