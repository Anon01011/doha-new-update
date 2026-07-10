<?php

namespace App\Http\Controllers;

use App\Models\Training;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class TrainingController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $status = $request->query('status');
        $search = $request->query('search');
        $query = Training::with('creator', 'assignments.employee');

        // BelongsToCompany handles branch isolation.

        if (!$user->isAdmin() && !$user->hasPermission('view-trainings')) {
             // Employees see only their assigned trainings
             $query->whereHas('assignments', function($q) use ($user) {
                 $q->where('employee_id', $user->employee_id);
             });
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('trainer_name', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        $trainings = $query->latest()->paginate(10);

        // Get companies for admin filter
        $companies = [];
        if ($user->role === 'admin') {
            $companies = \App\Models\Company::select('id', 'name')->get();
        }

        return Inertia::render('Training/Index', [
            'trainings' => $trainings,
            'status' => $status,
            'search' => $search,
            'userRole' => $user->role,
            'companies' => $companies,
            'filters' => $request->only(['search', 'status', 'company_id']),
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-trainings')) {
            abort(403, 'Unauthorized access.');
        }

        $companies = $user->role === 'admin' ? \App\Models\Company::select('id', 'name')->get() : [];
        $categories = \App\Models\TrainingCategory::active()->get();

        return Inertia::render('Training/Create', [
            'companies' => $companies,
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-trainings')) {
            abort(403, 'Unauthorized access.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|max:255',
            'duration_hours' => 'required|numeric|gt:0',
            'trainer_name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'max_participants' => 'nullable|integer|min:1',
            'company_id' => 'required|exists:companies,id',
        ]);

        $validated['status'] = 'scheduled';
        $validated['created_by'] = Auth::id();

        // BelongsToCompany handles isolation during creation if company_id is provided.
        // If not provided, it will use current user's company_id via trait boot.

        Training::create($validated);
        return redirect()->route('trainings.index')->with('success', 'Training created successfully!');
    }

    public function show(Training $training)
    {
        $user = Auth::user();

        // BelongsToCompany handles branch isolation.

        if (!$user->isAdmin() && !$user->hasPermission('view-trainings')) {
            $isAssigned = $training->assignments()->where('employee_id', $user->employee_id)->exists();
            if (!$isAssigned) {
                abort(403, 'Unauthorized access.');
            }
        }

        // Load relationships including Quiz
        $training->load(['creator', 'assignments.employee', 'sessions.attendance', 'materials', 'certificates', 'evaluations', 'quiz.questions']);

        // Calculate progress for current user if employee
        $userProgress = null;
        $quizAttempt = null;

        if ($user->employee_id) {
            $assignment = $training->assignments()->where('employee_id', $user->employee_id)->first();
            $userProgress = $assignment ? [
                'id' => $assignment->id,
                'progress_percentage' => $assignment->progress_percentage,
                'status' => $assignment->status,
                'certificate_issued' => $assignment->certificate_issued,
                'certificate_id' => $assignment->certificate?->id,
            ] : null;

            // Load user's attempt for the quiz if exists
            if ($training->quiz) {
                $quizAttempt = $training->quiz->attempts()
                    ->where('employee_id', $user->employee_id)
                    ->latest()
                    ->first();
            }
        }

        $companyId = $training->company_id;
        $settings = [
            'passing_score_percentage' => \App\Models\Setting::get('passing_score_percentage', 70, $companyId),
            'certificate_auto_generation' => \App\Models\Setting::get('certificate_auto_generation', false, $companyId),
        ];

        return Inertia::render('Training/Show', [
            'training' => $training,
            'userRole' => $user->role,
            'userProgress' => $userProgress,
            'quizAttempt' => $quizAttempt,
            'settings' => $settings,
        ]);
    }

    public function edit(Training $training)
    {
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-trainings')) {
            abort(403, 'Unauthorized access.');
        }

        $companies = $user->role === 'admin' ? \App\Models\Company::select('id', 'name')->get() : [];
        $categories = \App\Models\TrainingCategory::active()->get();

        return Inertia::render('Training/Edit', [
            'training' => $training,
            'companies' => $companies,
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, Training $training)
    {
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-trainings')) {
            abort(403, 'Unauthorized access.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|max:255',
            'duration_hours' => 'required|numeric|gt:0',
            'trainer_name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'max_participants' => 'nullable|integer|min:1',
            'status' => 'required|in:scheduled,ongoing,completed,cancelled',
        ]);

        $training->update($validated);
        return redirect()->route('trainings.show', $training)->with('success', 'Training updated successfully!');
    }

    public function destroy(Training $training)
    {
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-trainings')) {
            abort(403, 'Unauthorized access.');
        }
        $training->delete();
        return redirect()->route('trainings.index')->with('success', 'Training deleted successfully!');
    }
}
