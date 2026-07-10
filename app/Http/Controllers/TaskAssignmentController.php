<?php

namespace App\Http\Controllers;

use App\Models\TaskAssignment;
use App\Models\Task;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaskAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $taskId = $request->query('task_id');
        $status = $request->query('status');

        $query = TaskAssignment::with(['task', 'employee', 'assigner']);

        // Multi-tenancy scoping
        $user = auth()->user();
        if ($user->role !== 'admin' && $user->employee_id) {
            $query->whereHas('employee', function ($q) use ($user) {
                $q->where('company_id', $user->employee->company_id);
            });
        } elseif ($user->role === 'admin' && $request->has('company_id')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('company_id', $request->company_id);
            });
        }

        $assignments = $query->latest()->paginate(10);

        return Inertia::render('Task/Assignments', [
            'assignments' => $assignments,
            'taskId' => $taskId,
            'status' => $status,
            'userRole' => $user->role,
        ]);
    }

    public function create(Request $request)
    {
        $user = auth()->user();
        $taskId = $request->query('task_id');
        $tasksQuery = Task::query();
        $employeesQuery = Employee::query();
        $branches = $user->role === 'admin' ? \App\Models\Company::orderBy('name')->get(['id', 'name']) : [];

        if ($user->role !== 'admin' && $user->employee_id) {
            $tasksQuery->where('branch_id', $user->employee->company_id);
            $employeesQuery->where('company_id', $user->employee->company_id);
        }

        $tasks = $tasksQuery->orderBy('title')->get(['id', 'title', 'project_id', 'branch_id']);
        $employees = $employeesQuery->orderBy('name')->get(['id', 'name', 'employee_code', 'company_id', 'designation', 'employee_image']);

        return Inertia::render('Task/Assign', [
            'tasks' => $tasks,
            'employees' => $employees,
            'branches' => $branches,
            'selectedTaskId' => $taskId,
            'userRole' => $user->role,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'exists:employees,id',
            'remarks' => 'nullable|string',
        ]);

        $user = auth()->user();
        $task = Task::with('project.members')->findOrFail($validated['task_id']);

        // Multi-tenancy check
        if ($user->role !== 'admin' && $user->employee_id && $task->branch_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access to this task.');
        }

        $assignedCount = 0;
        $errors = [];

        foreach ($validated['employee_ids'] as $employeeId) {
            // Check if already assigned
            $exists = TaskAssignment::where('task_id', $task->id)
                ->where('employee_id', $employeeId)
                ->exists();

            if ($exists) {
                $employeeName = Employee::find($employeeId)->name ?? 'Employee';
                $errors[] = "$employeeName is already assigned to this task.";
                continue;
            }

            // Check or Auto-Add project membership
            if ($task->project_id) {
                $isMember = $task->project->members->contains('employee_id', $employeeId);

                if (!$isMember) {
                    // Auto-add to project
                    \App\Models\ProjectMember::create([
                        'project_id' => $task->project_id,
                        'employee_id' => $employeeId,
                        'role' => 'member',
                        'assigned_date' => now(),
                    ]);
                    // Refresh relation if needed for subsequent checks, but local var $isMember is just for this check
                    // We don't need to refresh $task->project->members for the next iteration unless we re-fetch, 
                    // but simple create is enough.
                }
            }

            $assignment = TaskAssignment::create([
                'task_id' => $validated['task_id'],
                'employee_id' => $employeeId,
                'assigned_by' => auth()->id(),
                'assigned_date' => now()->toDateString(),
                'status' => 'pending',
                'progress_percentage' => 0,
                'remarks' => $validated['remarks'] ?? null,
            ]);

            $assignedCount++;

            // Notify employee
            $employee = Employee::find($employeeId);
            if ($employee && $employee->user) {
                try {
                    $employee->user->notify(new \App\Notifications\TaskAssigned($task));
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Notification failed for user {$employee->id}: " . $e->getMessage());
                }
            }
        }

        if (count($errors) > 0) {
            $message = "$assignedCount employees assigned. Errors: " . implode(' ', $errors);
            return redirect()->route('task-assignments.index', ['task_id' => $validated['task_id']])
                ->with($assignedCount > 0 ? 'warning' : 'error', $message);
        }

        return redirect()->route('task-assignments.index', ['task_id' => $validated['task_id']])
            ->with('success', 'Task assignments created successfully and employees notified!');
    }

    public function update(Request $request, TaskAssignment $assignment)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,in_progress,completed,cancelled',
            'progress_percentage' => 'nullable|integer|min:0|max:100',
            'remarks' => 'nullable|string',
        ]);

        $user = auth()->user();
        if ($user->role !== 'admin' && $user->employee_id && $assignment->employee->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access.');
        }

        if ($validated['status'] === 'completed' && !$assignment->completed_date) {
            $validated['completed_date'] = now()->toDateString();
            $validated['progress_percentage'] = 100;
        }

        $assignment->update($validated);

        return redirect()->back()->with('success', 'Assignment updated successfully!');
    }

    public function destroy(TaskAssignment $assignment)
    {
        $user = auth()->user();
        if ($user->role !== 'admin' && $user->employee_id && $assignment->employee->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access.');
        }

        $assignment->delete();
        return redirect()->back()->with('success', 'Assignment deleted successfully!');
    }
}
