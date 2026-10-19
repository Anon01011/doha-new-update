<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shift_rosters', function (Blueprint $table) {
            // Approval workflow columns
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending')->after('notes');
            $table->unsignedBigInteger('approved_by')->nullable()->after('status');
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->string('rejection_reason')->nullable()->after('approved_at');

            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['company_id', 'week_start', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('shift_rosters', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropIndex(['company_id', 'week_start', 'status']);
            $table->dropColumn(['status', 'approved_by', 'approved_at', 'rejection_reason']);
        });
    }
};
