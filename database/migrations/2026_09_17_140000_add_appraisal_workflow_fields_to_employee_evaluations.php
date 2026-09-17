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
        Schema::table('employee_evaluations', function (Blueprint $table) {
            $table->string('cycle_type')->default('monthly')->after('year'); // monthly, quarterly, half_yearly, annual, probation
            $table->string('status')->default('draft')->after('cycle_type'); // draft, self_assessment, manager_review, calibration, acknowledged, approved, closed
            
            // Employee Self Assessment
            $table->json('self_scores')->nullable()->after('criteria_scores');
            $table->text('self_comments')->nullable()->after('self_scores');
            $table->text('achievements')->nullable()->after('self_comments');
            $table->text('development_needs')->nullable()->after('achievements');
            
            // Peer/360 feedback and goals
            $table->json('goals')->nullable()->after('development_needs');
            $table->json('peer_feedback')->nullable()->after('goals');
            
            // Action Recommendations (Increments in INR, Promotions, PIP, Training)
            $table->decimal('increment_recommended', 10, 2)->nullable()->after('peer_feedback');
            $table->decimal('increment_percentage', 5, 2)->nullable()->after('increment_recommended');
            $table->boolean('promotion_recommended')->default(false)->after('increment_percentage');
            $table->string('recommended_designation')->nullable()->after('promotion_recommended');
            $table->boolean('pip_required')->default(false)->after('recommended_designation');
            $table->text('pip_notes')->nullable()->after('pip_required');
            $table->json('training_recommended')->nullable()->after('pip_notes');
            
            // Acknowledgment & Closure
            $table->timestamp('employee_acknowledged_at')->nullable()->after('training_recommended');
            $table->text('employee_acknowledgment_notes')->nullable()->after('employee_acknowledged_at');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete()->after('employee_acknowledgment_notes');
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->boolean('is_locked')->default(false)->after('approved_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_evaluations', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn([
                'cycle_type',
                'status',
                'self_scores',
                'self_comments',
                'achievements',
                'development_needs',
                'goals',
                'peer_feedback',
                'increment_recommended',
                'increment_percentage',
                'promotion_recommended',
                'recommended_designation',
                'pip_required',
                'pip_notes',
                'training_recommended',
                'employee_acknowledged_at',
                'employee_acknowledgment_notes',
                'approved_by',
                'approved_at',
                'is_locked',
            ]);
        });
    }
};
