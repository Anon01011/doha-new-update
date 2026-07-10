<?php

namespace App\Http\Controllers;

use App\Models\TrainingEvaluation;
use App\Models\TrainingAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TrainingEvaluationController extends Controller
{
    public function store(Request $request, TrainingAssignment $assignment)
    {
        $user = auth()->user();

        if ($user->role === 'employee' && $assignment->employee_id !== $user->employee_id) {
            abort(403, 'Unauthorized access.');
        }

        if ($user->role !== 'admin' && $user->role !== 'employee' && $user->employee_id && $assignment->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access to another branch.');
        }

        if ($assignment->evaluation) {
            return back()->with('error', 'You have already submitted an evaluation for this training.');
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'content_quality' => 'required|integer|min:1|max:5',
            'trainer_effectiveness' => 'required|integer|min:1|max:5',
            'relevance' => 'required|integer|min:1|max:5',
            'would_recommend' => 'boolean',
            'feedback_text' => 'nullable|string',
            'suggestions' => 'nullable|string',
        ]);

        TrainingEvaluation::create([
            'training_assignment_id' => $assignment->id,
            'employee_id' => $assignment->employee_id,
            'training_id' => $assignment->training_id,
            'company_id' => $assignment->company_id,
            'rating' => $validated['rating'],
            'content_quality' => $validated['content_quality'],
            'trainer_effectiveness' => $validated['trainer_effectiveness'],
            'relevance' => $validated['relevance'],
            'would_recommend' => $validated['would_recommend'] ?? false,
            'feedback_text' => $validated['feedback_text'],
            'suggestions' => $validated['suggestions'],
            'submitted_at' => now(),
        ]);

        return back()->with('success', 'Evaluation submitted successfully!');
    }
}
