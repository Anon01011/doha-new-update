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
        Schema::dropIfExists('training_quiz_attempts');
        Schema::create('training_quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_quiz_id')->constrained('training_quizzes')->onDelete('cascade');
            $table->foreignId('training_assignment_id')->constrained('training_assignments')->onDelete('cascade');
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->decimal('score_achieved', 5, 2); // Percentage
            $table->boolean('is_passed');
            $table->json('answers')->nullable(); // Store user answers
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('training_quiz_attempts');
    }
};
