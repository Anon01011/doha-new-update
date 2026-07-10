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
            if (!Schema::hasColumn('leave_requests', 'manager_id')) {
                $table->unsignedBigInteger('manager_id')->nullable()->after('rejection_reason');
                $table->foreign('manager_id')->references('id')->on('employees')->onDelete('set null');
            }
            
            if (!Schema::hasColumn('leave_requests', 'manager_approval_status')) {
                $table->string('manager_approval_status')->default('pending')->after('manager_id');
            }
            
            if (!Schema::hasColumn('leave_requests', 'hr_approval_status')) {
                $table->string('hr_approval_status')->default('pending')->after('manager_approval_status');
            }
            
            if (!Schema::hasColumn('leave_requests', 'manager_approved_at')) {
                $table->timestamp('manager_approved_at')->nullable()->after('hr_approval_status');
            }
            
            if (!Schema::hasColumn('leave_requests', 'rejection_reason_manager')) {
                $table->text('rejection_reason_manager')->nullable()->after('manager_approved_at');
            }
            
            if (!Schema::hasColumn('leave_requests', 'rejection_reason_hr')) {
                $table->text('rejection_reason_hr')->nullable()->after('rejection_reason_manager');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropForeign(['manager_id']);
            $table->dropColumn([
                'manager_id',
                'manager_approval_status',
                'hr_approval_status',
                'manager_approved_at',
                'rejection_reason_manager',
                'rejection_reason_hr'
            ]);
        });
    }
};
