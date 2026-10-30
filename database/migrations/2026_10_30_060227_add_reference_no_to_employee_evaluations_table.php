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
        if (!Schema::hasColumn('employee_evaluations', 'reference_no')) {
            Schema::table('employee_evaluations', function (Blueprint $table) {
                $table->string('reference_no', 32)->nullable()->unique()->after('id');
            });
        }

        // Backfill existing rows with clean reference identifiers
        $evaluations = DB::table('employee_evaluations')->whereNull('reference_no')->get();
        foreach ($evaluations as $e) {
            $year = $e->year ?? date('Y');
            $month = str_pad((string)($e->month ?? date('n')), 2, '0', STR_PAD_LEFT);
            $random = strtoupper(substr(md5($e->id . 'eval_salt_' . time()), 0, 6));
            $ref = "EVA-{$year}{$month}-{$random}";
            DB::table('employee_evaluations')->where('id', $e->id)->update(['reference_no' => $ref]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('employee_evaluations', 'reference_no')) {
            Schema::table('employee_evaluations', function (Blueprint $table) {
                $table->dropColumn('reference_no');
            });
        }
    }
};
