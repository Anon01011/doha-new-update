<?php

namespace App\Http\Controllers;

use App\Models\TrainingAssignment;
use App\Models\Training;
use App\Models\Employee;
use App\Models\Setting;
use App\Mail\TrainingAssignedMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class TrainingAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $trainingId = $request->query('training_id');
        $status     = $request->query('status');
        $user       = auth()->user();

        // Admin sees all assignments without any company scope
        if ($user->role === 'admin') {
            $query = TrainingAssignment::withoutGlobalScopes()
                ->with(['training', 'employee', 'assigner']);
        } else {
            $query = TrainingAssignment::with(['training', 'employee', 'assigner']);
        }

        if ($trainingId) {
            $query->where('training_id', $trainingId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        // Non-admin: scope by their own company
        if ($user->role !== 'admin' && $user->employee_id) {
            $companyId = $user->company_id
                ?? \Illuminate\Support\Facades\DB::table('employees')->where('id', $user->employee_id)->value('company_id');
            if ($companyId) {
                $query->where('company_id', $companyId);
            }
        }

        $assignments = $query->latest()->paginate(10);

        return Inertia::render('Training/Assignments', [
            'assignments' => $assignments,
            'trainingId'  => $trainingId,
            'status'      => $status,
            'userRole'    => $user->role,
        ]);
    }


    public function create(Request $request)
    {
        $user = auth()->user();
        $companyId = null;

        if ($user->role !== 'admin' && $user->employee_id) {
            $companyId = $user->employee->company_id;
        } elseif ($user->role === 'admin' && $request->has('company_id')) {
            $companyId = $request->input('company_id');
        }

        $trainingsQuery = Training::query()->orderBy('title');
        $employeesQuery = Employee::query()->orderBy('name');

        if ($companyId) {
            $trainingsQuery->where('company_id', $companyId);
            $employeesQuery->where('company_id', $companyId);
        }

        $trainings = $trainingsQuery->get(['id', 'title']);
        $employees = $employeesQuery->get(['id', 'name', 'employee_code']);

        $trainingId = $request->query('training_id');

        return Inertia::render('Training/Assign', [
            'trainings' => $trainings,
            'employees' => $employees,
            'selectedTrainingId' => $trainingId,
            'companyId' => $companyId,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'training_id' => 'required|exists:trainings,id',
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'exists:employees,id',
            'remarks' => 'nullable|string',
        ]);

        $training = Training::findOrFail($validated['training_id']);
        $companyId = $training->company_id;

        $user = auth()->user();
        if ($user->role !== 'admin' && $user->employee_id && $companyId != $user->employee->company_id) {
            abort(403, 'Unauthorized access to this training.');
        }

        // Check max participants
        if ($training->max_participants) {
            $currentCount = $training->assignments()->count();
            $newCount = count($validated['employee_ids']);
            if ($currentCount + $newCount > $training->max_participants) {
                return back()->with('error', "Cannot assign more employees. Max participants: {$training->max_participants}, Current: {$currentCount}, Trying to add: {$newCount}")->withInput();
            }
        }

        $assignments       = [];
        $assignedEmployees = [];

        foreach ($validated['employee_ids'] as $employeeId) {
            // BUGFIX: bypass BelongsToCompany global scope — without this,
            // Employee::find() returns null for valid employees when the
            // logged-in admin has no company_id, silently skipping all assignments.
            $exists = TrainingAssignment::withoutGlobalScopes()
                ->where('training_id', $validated['training_id'])
                ->where('employee_id', $employeeId)
                ->exists();

            if ($exists) continue;

            // BUGFIX: use withoutGlobalScopes() so the BelongsToCompany trait
            // does not filter out employees that belong to another company scope.
            $employee = Employee::withoutGlobalScopes()->find($employeeId);

            // Use loose == (not ===): DB may return int or string for company_id.
            // Admin can assign any employee to any training — no company restriction.
            // Non-admin: employee must belong to the same company as the training.
            $companyMatch = $user->role === 'admin'
                || is_null($companyId)
                || is_null($employee->company_id)
                || $employee->company_id == $companyId;

            if ($employee && $companyMatch) {
                $assignments[] = [
                    'training_id'         => $validated['training_id'],
                    'employee_id'         => $employeeId,
                    'company_id'          => $companyId ?? $employee->company_id,
                    'assigned_by'         => auth()->id(),
                    'assigned_date'       => now()->toDateString(),
                    'status'              => 'assigned',
                    'remarks'             => $validated['remarks'] ?? null,
                    'progress_percentage' => 0,
                    'created_at'          => now(),
                    'updated_at'          => now(),
                ];
                $assignedEmployees[] = $employee;
            }
        }

        if (!empty($assignments)) {
            TrainingAssignment::insert($assignments);

            // Send email to each newly assigned employee (queued - won't block on SMTP failure)
            $emailFailures = [];
            foreach ($assignedEmployees as $emp) {
                try {
                    $assignment = TrainingAssignment::withoutGlobalScopes()
                        ->with(['training', 'training.company', 'employee'])
                        ->where('training_id', $validated['training_id'])
                        ->where('employee_id', $emp->id)
                        ->latest()
                        ->first();

                    if (!$assignment) continue;

                    // Prefer employee's own email, fall back to user-account email
                    $email = !empty($emp->email)
                        ? $emp->email
                        : \App\Models\User::where('employee_id', $emp->id)->value('email');

                    if ($email) {
                        Mail::to($email)->queue(new TrainingAssignedMail($assignment));
                    }
                } catch (\Exception $e) {
                    $emailFailures[] = $emp->name;
                    Log::warning("Training assignment email failed for employee {$emp->id}: " . $e->getMessage());
                }
            }
        }

        $count = count($assignments);

        // If some emails failed (e.g. SMTP not configured), redirect with a warning instead of error
        if (!empty($emailFailures)) {
            return redirect()->route('training-assignments.index', ['training_id' => $validated['training_id']])
                ->with('success', "{$count} employee(s) assigned to training successfully!")
                ->with('email_warning', 'Assignment saved, but email notification could not be sent to some employees (' . implode(', ', $emailFailures) . '). Please check your Mail settings in Settings → Mail Configuration.');
        }

        return redirect()->route('training-assignments.index', ['training_id' => $validated['training_id']])
            ->with('success', "{$count} employee(s) assigned to training successfully!");
    }

    public function updateStatus(Request $request, TrainingAssignment $assignment)
    {
        $user = auth()->user();
        if ($user->role !== 'admin' && $user->employee_id && $assignment->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access.');
        }

        $companyId = $assignment->company_id;
        $passingScore = Setting::get('passing_score_percentage', 70, $companyId);
        $minAttendance = Setting::get('minimum_attendance_percentage', 0, $companyId);
        $evalRequired = Setting::get('evaluation_required', false, $companyId);

        $validated = $request->validate([
            'status' => 'required|in:assigned,in_progress,completed,cancelled',
            'score' => 'nullable|numeric|min:0|max:100',
            'feedback' => 'nullable|string',
            'certificate_issued' => 'boolean',
        ]);

        if ($validated['status'] === 'completed') {
            if (isset($validated['score']) && $validated['score'] < $passingScore) {
                return back()->with('error', "Cannot mark as completed. Score ({$validated['score']}) is below passing score ({$passingScore}).");
            }

            // Check Attendance
            if ($minAttendance > 0) {
                $totalSessions = \App\Models\TrainingSession::where('training_id', $assignment->training_id)->count();
                if ($totalSessions > 0) {
                    $attendedSessions = \App\Models\TrainingSessionAttendance::whereHas('trainingSession', function ($q) use ($assignment) {
                        $q->where('training_id', $assignment->training_id);
                    })
                        ->where('employee_id', $assignment->employee_id)
                        ->where('attendance_status', 'present')
                        ->count();

                    $attendancePct = ($attendedSessions / $totalSessions) * 100;
                    if ($attendancePct < $minAttendance) {
                        return back()->with('error', "Cannot mark as completed. Attendance ({$attendancePct}%) is below required {$minAttendance}%.");
                    }
                }
            }

            // Check Evaluation
            if ($evalRequired) {
                $evalExists = \App\Models\TrainingEvaluation::where('training_assignment_id', $assignment->id)->exists();
                if (!$evalExists) {
                    return back()->with('error', "Cannot mark as completed. Training evaluation is required.");
                }
            }
            if (!$assignment->completion_date) {
                $validated['completion_date'] = now()->toDateString();
            }

            // Auto-generate certificate if enabled
            $autoCert = Setting::get('certificate_auto_generation', false, $companyId);
            if ($autoCert && !$assignment->certificate_issued) {
                $validated['certificate_issued'] = true;
                $validated['certificate_date'] = now()->toDateString();
                $validated['certificate_number'] = 'CERT-' . strtoupper(uniqid());
            }
        }

        $assignment->update($validated);

        return redirect()->back()->with('success', 'Assignment status updated successfully!');
    }

    public function updateProgress(Request $request, TrainingAssignment $assignment)
    {
        $user = auth()->user();

        // Ensure user owns this assignment
        if ($user->role === 'employee' && $assignment->employee_id !== $user->employee_id) {
            abort(403, 'Unauthorized access.');
        }

        $validated = $request->validate([
            'progress_percentage' => 'required|integer|min:0|max:100',
            'materials_viewed' => 'nullable|array',
            'quiz_scores' => 'nullable|array',
        ]);

        $data = [
            'progress_percentage' => $validated['progress_percentage'],
            'last_activity_at' => now(),
        ];

        if (!$assignment->started_at) {
            $data['started_at'] = now();
            $data['status'] = 'in_progress';
        }

        if ($validated['progress_percentage'] == 100 && $assignment->status !== 'completed') {
            $data['status'] = 'completed';
            $data['completion_date'] = now()->toDateString();
        }

        if (isset($validated['materials_viewed'])) {
            $data['materials_viewed'] = $validated['materials_viewed'];
        }

        if (isset($validated['quiz_scores'])) {
            $data['quiz_scores'] = $validated['quiz_scores'];
        }

        $assignment->update($data);

        return response()->json(['success' => true, 'message' => 'Progress updated successfully']);
    }

    public function destroy(TrainingAssignment $assignment)
    {
        $user = auth()->user();
        if ($user->role !== 'admin' && $user->employee_id && $assignment->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access.');
        }

        $assignment->delete();
        return redirect()->back()->with('success', 'Assignment deleted successfully!');
    }
}
