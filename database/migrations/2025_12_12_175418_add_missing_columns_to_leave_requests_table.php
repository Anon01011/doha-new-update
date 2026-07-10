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
        Schema::table('leave_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('leave_requests', 'rejected_by')) {
                $table->unsignedBigInteger('rejected_by')->nullable()->after('rejection_reason');
                $table->foreign('rejected_by')->references('id')->on('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('leave_requests', 'rejected_at')) {
                $table->timestamp('rejected_at')->nullable()->after('rejected_by');
            }
            // Note: days_requested type change requires doctrine/dbal package
            // If not installed, this will be handled by model casting
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            if (Schema::hasColumn('leave_requests', 'rejected_by')) {
                $table->dropForeign(['rejected_by']);
                $table->dropColumn('rejected_by');
            }
            if (Schema::hasColumn('leave_requests', 'rejected_at')) {
                $table->dropColumn('rejected_at');
            }
        });
    }
};
