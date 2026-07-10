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
        Schema::table('holidays', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropUnique(['company_id', 'holiday_date', 'name']);
            $table->date('start_date')->after('name')->nullable();
            $table->date('end_date')->after('start_date')->nullable();
        });

        DB::table('holidays')->update([
            'start_date' => DB::raw('holiday_date'),
            'end_date' => DB::raw('holiday_date'),
        ]);

        Schema::table('holidays', function (Blueprint $table) {
            $table->date('start_date')->nullable(false)->change();
            $table->date('end_date')->nullable(false)->change();
            $table->dropColumn('holiday_date');
            $table->unique(['company_id', 'start_date', 'end_date', 'name']);
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('holidays', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropUnique(['company_id', 'start_date', 'end_date', 'name']);
            $table->date('holiday_date')->after('name')->nullable();
        });

        DB::table('holidays')->update([
            'holiday_date' => DB::raw('start_date'),
        ]);

        Schema::table('holidays', function (Blueprint $table) {
            $table->date('holiday_date')->nullable(false)->change();
            $table->dropColumn(['start_date', 'end_date']);
            $table->unique(['company_id', 'holiday_date', 'name']);
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
        });
    }
};
