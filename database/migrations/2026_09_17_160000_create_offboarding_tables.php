<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Offboarding Requests (core separation record)
        Schema::create('offboarding_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('initiated_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('hr_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->enum('separation_reason', [
                'resignation',
                'retirement',
                'termination',
                'contract_completion',
                'redundancy',
                'mutual_separation',
                'absconding',
                'other',
            ])->default('resignation');

            $table->date('proposed_last_working_day');
            $table->date('actual_last_working_day')->nullable();
            $table->unsignedSmallInteger('notice_period_days')->default(0);
            $table->boolean('notice_pay_applicable')->default(false);
            $table->decimal('notice_pay_amount', 12, 2)->nullable();

            $table->enum('status', [
                'draft',
                'pending_approval',
                'approved',
                'in_progress',
                'clearance_pending',
                'exit_interview_pending',
                'settlement_pending',
                'completed',
                'cancelled',
            ])->default('draft');

            $table->timestamp('manager_approved_at')->nullable();
            $table->timestamp('hr_approved_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->text('remarks')->nullable();
            $table->string('supporting_document')->nullable();   // storage path

            // Final settlement summary (denormalized for quick reference)
            $table->decimal('basic_salary_till_lwd', 12, 2)->nullable();
            $table->decimal('leave_encashment_amount', 12, 2)->nullable();
            $table->decimal('gratuity_amount', 12, 2)->nullable();
            $table->decimal('deductions_total', 12, 2)->nullable();
            $table->decimal('net_settlement_amount', 12, 2)->nullable();
            $table->boolean('settlement_approved')->default(false);
            $table->foreignId('settlement_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('settlement_approved_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['employee_id', 'status']);
            $table->index('status');
            $table->index('proposed_last_working_day');
        });

        // 2. Offboarding Tasks (per-department checklist)
        Schema::create('offboarding_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offboarding_request_id')->constrained('offboarding_requests')->onDelete('cascade');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();

            $table->enum('assigned_role', [
                'hr', 'manager', 'it', 'admin', 'finance', 'payroll', 'security', 'other',
            ])->default('hr');

            $table->string('task_title');
            $table->text('task_description')->nullable();

            $table->enum('task_type', [
                'asset_return',
                'access_revocation',
                'document_collection',
                'knowledge_transfer',
                'clearance',
                'exit_interview',
                'salary_settlement',
                'general',
            ])->default('general');

            $table->enum('status', [
                'pending', 'in_progress', 'completed', 'skipped',
            ])->default('pending');

            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('completion_notes')->nullable();
            $table->unsignedTinyInteger('sort_order')->default(0);

            $table->timestamps();

            $table->index(['offboarding_request_id', 'status']);
            $table->index(['assigned_role', 'status']);
        });

        // 3. Exit Interview
        Schema::create('offboarding_exit_interviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offboarding_request_id')->unique()->constrained('offboarding_requests')->onDelete('cascade');
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('conducted_by')->nullable()->constrained('users')->nullOnDelete();

            $table->text('reason_for_leaving')->nullable();
            $table->unsignedTinyInteger('job_satisfaction_rating')->nullable();    // 1-5
            $table->unsignedTinyInteger('management_rating')->nullable();          // 1-5
            $table->unsignedTinyInteger('work_environment_rating')->nullable();    // 1-5
            $table->unsignedTinyInteger('compensation_rating')->nullable();        // 1-5
            $table->unsignedTinyInteger('growth_opportunity_rating')->nullable();  // 1-5

            $table->text('best_part_of_job')->nullable();
            $table->text('improvement_suggestions')->nullable();
            $table->text('additional_comments')->nullable();
            $table->boolean('rehire_eligible')->default(true);
            $table->timestamp('conducted_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offboarding_exit_interviews');
        Schema::dropIfExists('offboarding_tasks');
        Schema::dropIfExists('offboarding_requests');
    }
};
