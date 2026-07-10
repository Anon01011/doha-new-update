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
        Schema::dropIfExists('training_quiz_questions');
        Schema::create('training_quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_quiz_id')->constrained('training_quizzes')->onDelete('cascade');
            $table->text('question_text');
            $table->enum('question_type', ['multiple_choice', 'true_false'])->default('multiple_choice');
            $table->json('options')->nullable(); // ["Option A", "Option B", ...]
            $table->string('correct_answer'); // Index of option or "true"/"false"
            $table->integer('points')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('training_quiz_questions');
    }
};
