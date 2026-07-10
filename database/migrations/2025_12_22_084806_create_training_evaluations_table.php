<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('training_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_assignment_id')->constrained('training_assignments')->onDelete('cascade');
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('training_id')->constrained('trainings')->onDelete('cascade');
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->integer('rating')->default(0); // 1-5
            $table->integer('content_quality')->default(0); // 1-5
            $table->integer('trainer_effectiveness')->default(0); // 1-5
            $table->integer('relevance')->default(0); // 1-5
            $table->boolean('would_recommend')->default(false);
            $table->text('feedback_text')->nullable();
            $table->text('suggestions')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->index(['training_id', 'employee_id']);
            $table->index('company_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('training_evaluations');
    }
};
