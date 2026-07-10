<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Project;
use App\Models\TaskAssignment;
use App\Models\TaskTimer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class TaskReportController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $branchId = null;

        if ($user->role !== 'admin' && $user->employee_id) {
            $branchId = $user->employee->company_id;
        } elseif ($request->has('company_id') && $user->role === 'admin') {
            $branchId = $request->input('company_id');
        }

        if ($user->role === 'employee') {
            abort(403, 'Unauthorized access.');
        }

        // Task Status Distribution
        $statusQuery = Task::query();
        if ($branchId) {
            $statusQuery->where('branch_id', $branchId);
        }
        $statusDistribution = $statusQuery->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        // Project Progress
        $projectQuery = Project::query();
        if ($branchId) {
            $projectQuery->where('branch_id', $branchId);
        }
        $projects = $projectQuery->withCount([
            'tasks',
            'tasks as completed_tasks_count' => function ($query) {
                $query->where('status', 'completed');
            }
        ])->get()->map(function ($project) {
            $project->progress = $project->tasks_count > 0
                ? round(($project->completed_tasks_count / $project->tasks_count) * 100)
                : 0;
            return $project;
        });

        // Time Spent per Employee (Top 10)
        $timeQuery = TaskAssignment::with('employee')
            ->join('task_timers', 'task_assignments.id', '=', 'task_timers.task_assignment_id');

        if ($branchId) {
            $timeQuery->whereHas('task', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        $timePerEmployee = $timeQuery->select('employee_id', DB::raw('SUM(duration_minutes) as total_minutes'))
            ->groupBy('employee_id')
            ->orderByDesc('total_minutes')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'employee_name' => $item->employee->name ?? 'Unknown',
                    'total_hours' => round($item->total_minutes / 60, 2)
                ];
            });

        // Recent Time Logs
        $logsQuery = TaskTimer::with(['assignment.task', 'assignment.employee']);
        if ($branchId) {
            $logsQuery->whereHas('assignment.task', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        $recentLogs = $logsQuery->orderByDesc('start_time')
            ->limit(10)
            ->get();

        return Inertia::render('Task/Reports', [
            'statusDistribution' => $statusDistribution,
            'projects' => $projects,
            'timePerEmployee' => $timePerEmployee,
            'recentLogs' => $recentLogs,
        ]);
    }
}
