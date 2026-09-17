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
        Schema::create('expense_claims', function (Blueprint $table) {
            $table->id();
            $table->string('claim_number')->unique();
            $table->unsignedBigInteger('company_id')->nullable()->index();
            $table->unsignedBigInteger('employee_id')->index();
            $table->unsignedBigInteger('department_id')->nullable()->index();
            $table->unsignedBigInteger('expense_category_id')->index();
            $table->date('expense_date');
            $table->decimal('amount', 12, 2)->comment('Amount in INR');
            $table->decimal('tax_amount', 12, 2)->default(0.00)->comment('Tax amount in INR');
            $table->decimal('tax_rate', 5, 2)->nullable();
            $table->string('tax_invoice_number')->nullable();
            $table->string('vendor_name')->nullable();
            $table->text('business_purpose');
            $table->string('cost_center')->nullable();
            $table->string('project_name')->nullable();
            $table->enum('payment_method', ['cash', 'personal_card', 'corporate_card', 'bank_transfer', 'upi'])->default('personal_card');
            $table->string('receipt_path')->nullable();
            
            // Workflow status
            $table->enum('status', [
                'draft',
                'submitted',
                'manager_approved',
                'finance_approved',
                'rejected',
                'returned_to_employee',
                'paid'
            ])->default('draft')->index();

            // Manager Review (Step 28 & 30)
            $table->unsignedBigInteger('manager_id')->nullable()->index();
            $table->timestamp('manager_approved_at')->nullable();
            $table->text('manager_comments')->nullable();

            // Finance Review (Step 29 & 30)
            $table->unsignedBigInteger('finance_reviewer_id')->nullable()->index();
            $table->timestamp('finance_reviewed_at')->nullable();
            $table->text('finance_comments')->nullable();

            // Reimbursement & Payment (Step 31, 32 & 33)
            $table->enum('reimbursement_method', ['payroll', 'direct_payment', 'accounts_payable'])->default('payroll');
            $table->enum('reimbursement_status', ['pending', 'included_in_payroll', 'paid'])->default('pending')->index();
            $table->unsignedBigInteger('salary_posting_id')->nullable()->index();
            $table->timestamp('paid_at')->nullable();
            $table->unsignedBigInteger('paid_by')->nullable();
            $table->string('payment_reference')->nullable();

            // Exception & Policy Violations (Step 27)
            $table->boolean('policy_violation_flag')->default(false);
            $table->text('violation_reason')->nullable();
            $table->boolean('is_locked')->default(false);

            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
            $table->foreign('expense_category_id')->references('id')->on('expense_categories')->onDelete('restrict');
            $table->foreign('manager_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('finance_reviewer_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('paid_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('salary_posting_id')->references('id')->on('salary_postings')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expense_claims');
    }
};
