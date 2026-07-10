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
        Schema::table('leave_types', function (Blueprint $table) {
            if (!Schema::hasColumn('leave_types', 'carry_forward_max_days')) {
                $table->integer('carry_forward_max_days')->nullable()->after('carry_forward_allowed');
            }
            if (!Schema::hasColumn('leave_types', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('description');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_types', function (Blueprint $table) {
            if (Schema::hasColumn('leave_types', 'carry_forward_max_days')) {
                $table->dropColumn('carry_forward_max_days');
            }
            if (Schema::hasColumn('leave_types', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });
    }
};
