<?php

namespace App\Http\Controllers;

use App\Models\TrainingSessionAttendance;
use App\Models\TrainingSession;
use App\Models\TrainingAssignment;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TrainingSessionAttendanceController extends Controller
{
    public function index(Request $request, TrainingSession $session)
    {
        $user = auth()->user();

        // Ensure user belongs to same company as session
        if ($user->role !== 'admin' && $user->employee_id && $session->training->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access to session in another branch.');
        }

        $attendance = TrainingSessionAttendance::with('employee')
            ->where('training_session_id', $session->id)
            ->get();

        // Get all assigned employees for this training to show in the list
        $assignedEmployees = TrainingAssignment::with('employee')
            ->where('training_id', $session->training_id)
            ->where('status', '!=', 'cancelled')
            ->get()
            ->pluck('employee')
            ->unique('id')
            ->values();

        return Inertia::render('Training/SessionAttendance', [
            'session' => $session->load('training'),
            'attendance' => $attendance,
            'assignedEmployees' => $assignedEmployees,
        ]);
    }

    public function store(Request $request, TrainingSession $session)
    {
        $user = auth()->user();
        if ($user->role === 'employee') {
            abort(403, 'Unauthorized. Only admins, HR, or managers can mark attendance.');
        }

        if ($user->role !== 'admin' && $user->employee_id && $session->training->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access to session in another branch.');
        }

        $validated = $request->validate([
            'attendance' => 'required|array',
            'attendance.*.employee_id' => 'required|exists:employees,id',
            'attendance.*.status' => 'required|in:present,absent,late,excused',
            'attendance.*.notes' => 'nullable|string',
        ]);

        $companyId = $session->training->company_id;
        $currentUserId = auth()->id();

        foreach ($validated['attendance'] as $record) {
            TrainingSessionAttendance::updateOrCreate(
                [
                    'training_session_id' => $session->id,
                    'employee_id' => $record['employee_id'],
                ],
                [
                    'company_id' => $companyId,
                    'attendance_status' => $record['status'],
                    'notes' => $record['notes'] ?? null,
                    'marked_by' => $currentUserId,
                    'check_in_time' => ($record['status'] === 'present' || $record['status'] === 'late') ? now() : null,
                ]
            );

            // Update progress for employee
            $this->updateEmployeeProgress($session->training_id, $record['employee_id']);
        }

        return redirect()->back()->with('success', 'Attendance marked successfully!');
    }

    private function updateEmployeeProgress($trainingId, $employeeId)
    {
        $assignment = TrainingAssignment::where('training_id', $trainingId)
            ->where('employee_id', $employeeId)
            ->first();

        if ($assignment) {
            // Count total sessions and attended sessions
            $totalSessions = TrainingSession::where('training_id', $trainingId)->count();

            // Avoid division by zero
            if ($totalSessions === 0)
                return;

            $attendedSessions = TrainingSessionAttendance::whereHas('trainingSession', function ($q) use ($trainingId) {
                $q->where('training_id', $trainingId);
            })
                ->where('employee_id', $employeeId)
                ->whereIn('attendance_status', ['present', 'late'])
                ->count();

            $progressPercentage = min(100, round(($attendedSessions / $totalSessions) * 100, 2));

            // Determine status based on progress
            $status = $assignment->status;
            if ($progressPercentage == 100 && $status !== 'completed') {
                // Optionally auto-complete or waiting for final evaluation
                // $status = 'completed'; 
            } elseif ($progressPercentage > 0 && $status === 'assigned') {
                $status = 'in_progress';
            }

            $assignment->update([
                'sessions_total' => $totalSessions,
                'sessions_attended' => $attendedSessions,
                'progress_percentage' => $progressPercentage,
                'status' => $status,
                'last_activity_at' => now(),
            ]);
        }
    }
}
