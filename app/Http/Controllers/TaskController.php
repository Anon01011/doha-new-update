<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Employee;
use App\Models\Setting;
use Illuminate\Http\Request;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');
        $priority = $request->query('priority');
        $search = $request->query('search');
        $projectId = $request->query('project_id');

        $query = Task::with(['creator', 'assignments.employee', 'project', 'subtasks']);

        $user = Auth::user();
        if (!$user->isAdmin() && !$user->hasPermission('view-tasks')) {
            // Employees see tasks assigned to them OR tasks in projects they are members of
            $query->where(function ($q) use ($user) {
                $q->whereHas('assignments', function ($sq) use ($user) {
                    $sq->where('employee_id', $user->employee_id);
                })->orWhereHas('project.members', function ($sq) use ($user) {
                    $sq->where('employee_id', $user->employee_id);
                });
            });
        }

        // BelongsToCompany handles branch isolation.

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($priority) {
            $query->where('priority', $priority);
        }

        if ($projectId) {
            $query->where('project_id', $projectId);
        }

        $tasks = $query->latest()->paginate(10);

        $projectsQuery = \App\Models\Project::query();
        if ($user && !$user->isAdmin() && !$user->hasPermission('view-tasks')) {
            $projectsQuery->whereHas('members', function ($q) use ($user) {
                $q->where('employee_id', $user->employee_id);
            });
        }
        $projects = $projectsQuery->get(['id', 'name']);

        $leadProjectIds = [];
        if ($user && $user->role === 'employee' && $user->employee_id) {
            $leadProjectIds = \App\Models\ProjectMember::where('employee_id', $user->employee_id)
                ->where('role', 'lead')
                ->pluck('project_id')
                ->toArray();
        }

        return Inertia::render('Task/Index', [
            'tasks' => $tasks,
            'projects' => $projects,
            'status' => $status,
            'priority' => $priority,
            'search' => $search,
            'projectId' => $projectId,
            'userRole' => $user ? $user->role : 'guest',
            'leadProjectIds' => $leadProjectIds,
        ]);
    }

    public function create(Request $request)
    {
        $user = Auth::user();
        $projectId = $request->query('project_id');

        if (!$user->isAdmin() && !$user->hasPermission('create-tasks')) {
             // Check if project lead
             $isProjectLead = false;
             if ($projectId && $user->employee_id) {
                 $isProjectLead = \App\Models\ProjectMember::where('project_id', $projectId)
                    ->where('employee_id', $user->employee_id)
                    ->where('role', 'lead')
                    ->exists();
             }
             if (!$isProjectLead) {
                  abort(403, 'Unauthorized.');
             }
        }

        // BelongsToCompany handles isolation.
        $branches = \App\Models\Company::all(['id', 'name']);
        $employees = \App\Models\Employee::all(['id', 'name', 'company_id', 'employee_image']);
        $projects = \App\Models\Project::all(['id', 'name', 'branch_id']);
        $parentTasks = Task::whereNull('parent_id')->get(['id', 'title']);

        $companyId = $user->employee_id ? $user->employee->company_id : null;
        $settings = [
            'default_priority' => Setting::get('default_task_priority', 'medium', $companyId),
            'mail_configured' => $this->isMailConfigured(),
        ];

        return Inertia::render('Task/Create', [
            'branches' => $branches,
            'employees' => $employees,
            'projects' => $projects,
            'parentTasks' => $parentTasks,
            'selectedProjectId' => $request->query('project_id'),
            'selectedParentId' => $request->query('parent_id'),
            'settings' => $settings,
        ]);
    }

    public function store(StoreTaskRequest $request)
    {
        $validated = $request->validated();

        // Authorization is handled by StoreTaskRequest

        // Branch ID is already handled/validated, but let's double check preference
        if ($request->project_id) {
            $project = \App\Models\Project::find($request->project_id);
            $validated['branch_id'] = $project ? $project->branch_id : null;
        } elseif ($request->branch_id) {
            $validated['branch_id'] = $request->branch_id;
        } else {
            $user = Auth::user();
            if ($user->employee_id) {
                $validated['branch_id'] = $user->employee->company_id;
            }
        }

        $validated['status'] = 'pending';
        $validated['created_by'] = Auth::id();

        $task = Task::create($validated);

        // Handle assignments
        if ($request->has('assigned_employee_ids')) {
            $taskId = $task->id;
            $newEmployeeIds = $request->assigned_employee_ids;

            \Illuminate\Support\Facades\DB::transaction(function () use ($task, $newEmployeeIds) {
                // Helper to check membership efficiently
                $projectId = $task->project_id;
                $projectMembers = $projectId ? \App\Models\ProjectMember::where('project_id', $projectId)->pluck('employee_id')->toArray() : [];

                foreach ($newEmployeeIds as $employeeId) {
                    // Check if already assigned (shouldn't happen in create, but good practice)
                    $exists = \App\Models\TaskAssignment::where('task_id', $task->id)
                        ->where('employee_id', $employeeId)
                        ->exists();

                    if ($exists)
                        continue;

                    // Check project membership and Auto-Add if missing
                    if ($projectId && !in_array($employeeId, $projectMembers)) {
                        \App\Models\ProjectMember::create([
                            'project_id' => $projectId,
                            'employee_id' => $employeeId,
                            'role' => 'member',
                            'assigned_date' => now(),
                        ]);
                        $projectMembers[] = $employeeId;
                    }

                    \App\Models\TaskAssignment::create([
                        'task_id' => $task->id,
                        'employee_id' => $employeeId,
                        'assigned_by' => Auth::id(),
                        'assigned_date' => now(),
                        'acceptance_status' => 'pending',
                    ]);

                    // Send notification
                    $this->notifyEmployee($employeeId, new \App\Notifications\TaskAssigned($task));
                }
            });
        }

        return redirect()->route('tasks.index')->with('success', 'Task created successfully!');
    }

    /**
     * Helper to notify employee
     */
    private function notifyEmployee($employeeId, $notification)
    {
        $employee = \App\Models\Employee::find($employeeId);
        if ($employee && $employee->user) {
            try {
                $employee->user->notify($notification);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Notification failed: ' . $e->getMessage());
            }
        }
    }

    /**
     * Check if mail is configured
     */
    private function isMailConfigured()
    {
        return config('mail.mailers.smtp.host') && 
               config('mail.mailers.smtp.host') !== '127.0.0.1' && 
               config('mail.mailers.smtp.username');
    }

    public function show(Task $task)
    {
        $user = Auth::user();
        
        // BelongsToCompany handles branch isolation.
        if (!$user->isAdmin() && !$user->hasPermission('view-tasks')) {
            $isAssigned = $task->assignments()->where('employee_id', $user->employee_id)->exists();
            $isProjectMember = $task->project && $task->project->members()->where('employee_id', $user->employee_id)->exists();
            if (!$isAssigned && !$isProjectMember) {
                abort(403, 'Unauthorized access.');
            }
        }

        $task->load([
            'creator',
            'assignments.employee',
            'assignments.timers',
            'updates.employee',
            'project',
            'checklists',
            'subtasks'
        ]);

        $projectMemberRole = null;
        if ($user && $user->role === 'employee' && $user->employee_id && $task->project_id) {
            $member = \App\Models\ProjectMember::where('project_id', $task->project_id)
                ->where('employee_id', $user->employee_id)
                ->first();
            if ($member) {
                $projectMemberRole = $member->role;
            }
        }

        $companyId = $user->employee_id ? $user->employee->company_id : $task->branch_id;
        $settings = [
            'allow_rejection' => Setting::get('allow_task_rejection', true, $companyId),
        ];

        return Inertia::render('Task/Show', [
            'task' => $task,
            'userRole' => $user ? $user->role : 'guest',
            'projectMemberRole' => $projectMemberRole,
            'settings' => $settings,
        ]);
    }

    public function edit(Task $task)
    {
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-tasks')) {
             // Check if lead
             $isProjectLead = false;
             if ($task->project_id && $user->employee_id) {
                 $isProjectLead = \App\Models\ProjectMember::where('project_id', $task->project_id)
                    ->where('employee_id', $user->employee_id)
                    ->where('role', 'lead')
                    ->exists();
             }
             if (!$isProjectLead) {
                  abort(403, 'Unauthorized.');
             }
        }

        // BelongsToCompany handles branch isolation.
        $branches = \App\Models\Company::all(['id', 'name']);
        $employees = \App\Models\Employee::all(['id', 'name', 'company_id', 'employee_image']);
        $projects = \App\Models\Project::all(['id', 'name', 'branch_id']);
        $parentTasks = Task::whereNull('parent_id')
            ->where('id', '!=', $task->id)
            ->get(['id', 'title']);

        $task->load('assignments');

        return Inertia::render('Task/Edit', [
            'task' => $task,
            'branches' => $branches,
            'employees' => $employees,
            'projects' => $projects,
            'parentTasks' => $parentTasks,
            'userRole' => $user->role,
        ]);
    }

    public function update(UpdateTaskRequest $request, Task $task)
    {
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-tasks')) {
             $isProjectLead = false;
             if ($task->project_id && $user->employee_id) {
                 $isProjectLead = \App\Models\ProjectMember::where('project_id', $task->project_id)
                    ->where('employee_id', $user->employee_id)
                    ->where('role', 'lead')
                    ->exists();
             }
             if (!$isProjectLead) {
                  abort(403, 'Unauthorized.');
             }
        }

        $validated = $request->validated();

        // Authorization is handled by UpdateTaskRequest

        // Update branch_id if project changes or branch is explicitly set
        if ($request->has('project_id') && $request->project_id != $task->project_id) {
            if ($request->project_id) {
                $project = \App\Models\Project::find($request->project_id);
                $validated['branch_id'] = $project ? $project->branch_id : null;
            } else {
                $validated['branch_id'] = $request->branch_id;
            }
        } elseif (!$request->project_id && $request->has('branch_id')) {
            $validated['branch_id'] = $request->branch_id;
        }

        $task->update($validated);

        // Handle assignments sync
        if ($request->has('assigned_employee_ids')) {
            $newEmployeeIds = $request->assigned_employee_ids;

            \Illuminate\Support\Facades\DB::transaction(function () use ($task, $newEmployeeIds) {
                // 1. Identify assignments to remove
                $assignmentsToRemove = $task->assignments()->whereNotIn('employee_id', $newEmployeeIds)->get();
                $skippedRemovalCount = 0;

                foreach ($assignmentsToRemove as $assignment) {
                    // Check if safe to delete
                    $hasStarted = $assignment->status !== 'pending' && $assignment->status !== 'cancelled';
                    $hasTimers = $assignment->timers()->exists();
                    $hasProgress = $assignment->progress_percentage > 0;

                    if ($hasStarted || $hasTimers || $hasProgress) {
                        $assignment->update([
                            'status' => 'cancelled',
                            'acceptance_status' => 'rejected', // or 'revoked'
                            'rejection_reason' => 'Assignment removed by manager'
                        ]);
                        // $skippedRemovalCount++; // Count if needed for warning, but maybe just log
                    } else {
                        $assignment->delete();
                    }
                }

                // 2. Identify new assignments to add
                // Helper to check membership efficiently
                $projectId = $task->project_id;
                $projectMembers = $projectId ? \App\Models\ProjectMember::where('project_id', $projectId)->pluck('employee_id')->toArray() : [];

                foreach ($newEmployeeIds as $employeeId) {
                    // Check if already exists (might have been kept)
                    $existingAssignment = \App\Models\TaskAssignment::where('task_id', $task->id)
                        ->where('employee_id', $employeeId)
                        ->first();

                    if ($existingAssignment) {
                        // If it was cancelled, reactivate it
                        if ($existingAssignment->status === 'cancelled') {
                            $existingAssignment->update(['status' => 'pending', 'acceptance_status' => 'pending']);
                            // Maybe notify again?
                        }
                        continue;
                    }

                    // Check project membership and Auto-Add if missing
                    if ($projectId && !in_array($employeeId, $projectMembers)) {
                        // Auto-add to project
                        \App\Models\ProjectMember::create([
                            'project_id' => $projectId,
                            'employee_id' => $employeeId,
                            'role' => 'member', // Default role
                            'assigned_date' => now(),
                        ]);
                        // Update local list to avoid query spam (though loop is usually small)
                        $projectMembers[] = $employeeId;
                    }

                    $assignment = \App\Models\TaskAssignment::create([
                        'task_id' => $task->id,
                        'employee_id' => $employeeId,
                        'assigned_by' => Auth::id(),
                        'assigned_date' => now(),
                        'acceptance_status' => 'pending',
                    ]);

                    // Send notification
                    $this->notifyEmployee($employeeId, new \App\Notifications\TaskAssigned($task));
                }
            });

            return redirect()->route('tasks.show', $task)->with('success', 'Task updated successfully!');
        }

        return redirect()->route('tasks.show', $task)->with('success', 'Task updated successfully!');
    }

    public function destroy(Task $task)
    {
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-tasks')) {
             $isProjectLead = false;
             if ($task->project_id && $user->employee_id) {
                 $isProjectLead = \App\Models\ProjectMember::where('project_id', $task->project_id)
                    ->where('employee_id', $user->employee_id)
                    ->where('role', 'lead')
                    ->exists();
             }
             if (!$isProjectLead) {
                  abort(403, 'Unauthorized.');
             }
        }

        // Soft Delete (handled by Model trait)
        $task->delete();
        return redirect()->route('tasks.index')->with('success', 'Task deleted successfully!');
    }

    public function acceptTask(Request $request, Task $task)
    {
        $user = Auth::user();
        $assignment = $task->assignments()->where('employee_id', $user->employee_id)->firstOrFail();

        $assignment->update([
            'acceptance_status' => 'accepted',
            'status' => 'in_progress'
        ]);

        return back()->with('success', 'Task accepted successfully!');
    }

    public function rejectTask(Request $request, Task $task)
    {
        $user = Auth::user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        $allowRejection = Setting::get('allow_task_rejection', true, $companyId);
        if (!$allowRejection) {
            return back()->with('error', 'Task rejection is not allowed by system settings.');
        }

        $request->validate(['rejection_reason' => 'required|string']);
        $assignment = $task->assignments()->where('employee_id', $user->employee_id)->firstOrFail();

        $assignment->update([
            'acceptance_status' => 'rejected',
            'rejection_reason' => $request->rejection_reason,
            'status' => 'cancelled'
        ]);

        return back()->with('success', 'Task rejected.');
    }

    public function blockTask(Request $request, Task $task)
    {
        $request->validate(['blocked_reason' => 'required|string']);
        $task->update([
            'is_blocked' => true,
            'blocked_reason' => $request->blocked_reason
        ]);

        return back()->with('success', 'Task marked as blocked.');
    }

    public function unblockTask(Task $task)
    {
        $task->update([
            'is_blocked' => false,
            'blocked_reason' => null
        ]);

        return back()->with('success', 'Task unblocked.');
    }

    public function startTimer(Request $request, Task $task)
    {
        $user = Auth::user();
        $assignment = $task->assignments()->where('employee_id', $user->employee_id)->firstOrFail();

        // Stop any running timers for this user
        \App\Models\TaskTimer::whereHas('assignment', function ($q) use ($user) {
            $q->where('employee_id', $user->employee_id);
        })->whereNull('end_time')->update(['end_time' => now()]);

        // Auto-update status
        if ($assignment->status === 'pending' || $assignment->status === 'cancelled') {
            $assignment->update([
                'status' => 'in_progress',
                'acceptance_status' => 'accepted' // Assume starting work implies acceptance
            ]);
        }

        \App\Models\TaskTimer::create([
            'task_assignment_id' => $assignment->id,
            'start_time' => now(),
        ]);

        return back()->with('success', 'Timer started.');
    }

    public function stopTimer(Request $request, Task $task)
    {
        $user = Auth::user();
        $assignment = $task->assignments()->where('employee_id', $user->employee_id)->firstOrFail();

        $timer = $assignment->timers()->whereNull('end_time')->firstOrFail();
        $endTime = now();
        $duration = $endTime->diffInMinutes($timer->start_time);

        $timer->update([
            'end_time' => $endTime,
            'duration_minutes' => $duration
        ]);

        return back()->with('success', 'Timer stopped. Duration: ' . $duration . ' mins');
    }

    public function addChecklistItem(Request $request, Task $task)
    {
        $request->validate(['item_text' => 'required|string|max:255']);
        $task->checklists()->create(['item_text' => $request->item_text]);
        return back()->with('success', 'Checklist item added.');
    }

    public function toggleChecklistItem(Request $request, \App\Models\TaskChecklist $item)
    {
        $item->update(['is_completed' => !$item->is_completed]);
        return back()->with('success', 'Checklist item updated.');
    }

    public function requestExtension(Request $request, Task $task)
    {
        $request->validate([
            'extension_request_date' => 'required|date|after:today',
            'extension_reason' => 'required|string'
        ]);

        $user = Auth::user();
        $assignment = $task->assignments()->where('employee_id', $user->employee_id)->firstOrFail();

        $assignment->update([
            'extension_request_date' => $request->extension_request_date,
            'extension_reason' => $request->extension_reason
        ]);

        return back()->with('success', 'Extension request submitted.');
    }

    public function addComment(Request $request, Task $task)
    {
        $request->validate([
            'comment' => 'required|string',
            'file' => 'nullable|file|max:10240', // 10MB max
        ]);

        $filePath = null;
        $fileName = null;

        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('task_attachments', 'public');
            $fileName = $request->file('file')->getClientOriginalName();
        }

        $task->comments()->create([
            'user_id' => Auth::id(),
            'comment' => $request->comment,
            'file_path' => $filePath,
            'file_name' => $fileName,
        ]);

        return back()->with('success', 'Comment added successfully.');
    }

    public function myTasks(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'employee' || !$user->employee_id) {
            abort(403, 'Unauthorized access.');
        }

        $status = $request->query('status');
        $priority = $request->query('priority');

        $query = Task::with([
            'creator',
            'project',
            'assignments' => function ($q) use ($user) {
                $q->where('employee_id', $user->employee_id);
            },
            'subtasks'
        ])
            ->whereHas('assignments', function ($q) use ($user) {
                $q->where('employee_id', $user->employee_id);
            });

        if ($status) {
            $query->where('status', $status);
        }

        if ($priority) {
            $query->where('priority', $priority);
        }

        $tasks = $query->latest()->paginate(10);

        return Inertia::render('Task/MyTasks', [
            'tasks' => $tasks,
            'status' => $status,
            'priority' => $priority,
        ]);
    }

    public function updateProgress(Request $request, Task $task)
    {
        $request->validate([
            'progress_percentage' => 'required|integer|min:0|max:100',
        ]);

        $user = Auth::user();
        $assignment = $task->assignments()->where('employee_id', $user->employee_id)->firstOrFail();

        $assignment->update([
            'progress_percentage' => $request->progress_percentage,
            'status' => $request->progress_percentage == 100 ? 'completed' : 'in_progress',
            'completed_date' => $request->progress_percentage == 100 ? now()->toDateString() : null,
        ]);

        return back()->with('success', 'Progress updated successfully!');
    }

    public function completeTask(Request $request, Task $task)
    {
        $user = Auth::user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        $requireNotes = Setting::get('require_completion_notes', false, $companyId);
        if ($requireNotes && empty($request->notes)) {
            return back()->with('error', 'Completion notes are required.');
        }

        $assignment = $task->assignments()->where('employee_id', $user->employee_id)->firstOrFail();

        // Check if time tracking is mandatory
        $timeTrackingMandatory = Setting::get('time_tracking_mandatory', false, $companyId);
        if ($timeTrackingMandatory) {
            $hasTimeLogged = $assignment->timers()->whereNotNull('end_time')->exists();
            if (!$hasTimeLogged) {
                return back()->with('error', 'Time tracking is mandatory. Please log some time before completing the task.');
            }
        }

        $assignment->update([
            'progress_percentage' => 100,
            'status' => 'completed',
            'completed_date' => now()->toDateString(),
        ]);

        return back()->with('success', 'Task marked as completed!');
    }
}
