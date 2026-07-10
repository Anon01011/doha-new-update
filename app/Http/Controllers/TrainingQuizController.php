<?php

namespace App\Http\Controllers;

use App\Models\Training;
use App\Models\TrainingQuiz;
use App\Models\TrainingQuizQuestion;
use App\Models\TrainingQuizAttempt;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class TrainingQuizController extends Controller
{
    /**
     * Store a newly created quiz in storage.
     */
    public function store(Request $request, Training $training)
    {
        $user = auth()->user();
        if ($user->role !== 'admin' && $user->employee_id && $training->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'passing_score' => 'required|integer|min:1|max:100',
            'time_limit_minutes' => 'nullable|integer|min:1',
            'questions' => 'required|array|min:1',
            'questions.*.question_text' => 'required|string',
            'questions.*.question_type' => 'required|in:multiple_choice,true_false',
            'questions.*.options' => 'nullable|array',
            'questions.*.correct_answer' => 'required|string',
            'questions.*.points' => 'required|integer|min:1',
        ]);

        DB::transaction(function () use ($training, $validated) {
            // Create Quiz
            $quiz = TrainingQuiz::create([
                'training_id' => $training->id,
                'title' => $validated['title'],
                'passing_score' => $validated['passing_score'],
                'time_limit_minutes' => $validated['time_limit_minutes'],
            ]);

            // Create Questions
            foreach ($validated['questions'] as $q) {
                TrainingQuizQuestion::create([
                    'training_quiz_id' => $quiz->id,
                    'question_text' => $q['question_text'],
                    'question_type' => $q['question_type'],
                    'options' => $q['options'],
                    'correct_answer' => $q['correct_answer'],
                    'points' => $q['points'],
                ]);
            }
        });

        return back()->with('success', 'Quiz created successfully.');
    }

    /**
     * Submit a quiz attempt.
     */
    public function submit(Request $request, TrainingQuiz $quiz)
    {
        $user = auth()->user();
        $employee = $user->employee;

        if ($user->role !== 'admin' && $employee && $quiz->training->company_id != $employee->company_id) {
            abort(403, 'Unauthorized access.');
        }

        if (!$employee) {
            abort(403, 'Employee profile required.');
        }

        $validated = $request->validate([
            'answers' => 'required|array',
        ]);

        $assignment = \App\Models\TrainingAssignment::where('training_id', $quiz->training_id)
            ->where('employee_id', $employee->id)
            ->firstOrFail();

        // Calculate Score
        $score = 0;
        $totalPoints = 0;
        $questions = $quiz->questions;

        foreach ($questions as $question) {
            $totalPoints += $question->points;
            $userAnswer = $validated['answers'][$question->id] ?? null;

            if ($userAnswer === $question->correct_answer) {
                $score += $question->points;
            }
        }

        $percentage = $totalPoints > 0 ? ($score / $totalPoints) * 100 : 0;
        $isPassed = $percentage >= $quiz->passing_score;

        // Store Attempt
        TrainingQuizAttempt::create([
            'training_quiz_id' => $quiz->id,
            'training_assignment_id' => $assignment->id,
            'employee_id' => $employee->id,
            'score_achieved' => $percentage,
            'is_passed' => $isPassed,
            'answers' => $validated['answers'],
            'completed_at' => now(),
        ]);

        // Update Assignment Progress (Quiz is part of it now?)
        // For now, let's just save the quiz result. 
        // We might want to trigger `recalculateProgress` here if we update that logic.
        $assignment->recalculateProgress();

        return back()->with('success', 'Quiz submitted. Score: ' . round($percentage) . '%');
    }

    /**
     * Delete the specified quiz.
     */
    public function destroy(TrainingQuiz $quiz)
    {
        $user = auth()->user();
        if ($user->role !== 'admin' && $user->employee_id && $quiz->training->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access.');
        }
        $quiz->delete();
        return back()->with('success', 'Quiz deleted successfully.');
    }
}
