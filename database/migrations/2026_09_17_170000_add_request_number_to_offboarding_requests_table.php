<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('offboarding_requests') && !Schema::hasColumn('offboarding_requests', 'request_number')) {
            Schema::table('offboarding_requests', function (Blueprint $table) {
                $table->string('request_number', 50)->nullable()->unique()->after('id');
            });

            // Backfill existing records
            $records = DB::table('offboarding_requests')->whereNull('request_number')->get(['id', 'created_at']);
            foreach ($records as $record) {
                $date = $record->created_at ? date('Ym', strtotime($record->created_at)) : date('Ym');
                $code = 'OFF-' . $date . '-' . str_pad($record->id, 4, '0', STR_PAD_LEFT);
                DB::table('offboarding_requests')->where('id', $record->id)->update(['request_number' => $code]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('offboarding_requests') && Schema::hasColumn('offboarding_requests', 'request_number')) {
            Schema::table('offboarding_requests', function (Blueprint $table) {
                $table->dropColumn('request_number');
            });
        }
    }
};
