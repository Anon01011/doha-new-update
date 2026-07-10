<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Company;
use App\Models\Setting;
use App\Models\Employee;
use App\Models\ProjectMember;
use App\Models\TaskAssignment;
use Illuminate\Http\Request;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $query = Project::with('branch', 'creator');



        if (!$user->isAdmin() && !$user->hasPermission('view-projects')) {
            $query->whereHas('members', function ($q) use ($user) {
                $q->where('employee_id', $user->employee_id);
            });
        }

        $projects = $query->latest()->get();

        $leadProjectIds = [];
        if ($user && $user->employee_id) {
            $leadProjectIds = ProjectMember::where('employee_id', $user->employee_id)
                ->where('role', 'lead')
                ->pluck('project_id')
                ->toArray();
        }

        return Inertia::render('Project/Index', [
            'projects' => $projects,
            'userRole' => $user ? $user->role : 'guest',
            'leadProjectIds' => $leadProjectIds,
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->hasPermission('create-projects')) {
            abort(403, 'Unauthorized.');
        }

        $companyId = ($user && $user->employee_id) ? $user->employee->company_id : null;

        $branches = Company::all(['id', 'name']);
        $employees = Employee::orderBy('name')->get(['id', 'name', 'company_id', 'employee_image']);
        $settings = [
            'default_visibility' => Setting::get('default_project_visibility', 'public', $companyId),
            'budget_tracking' => Setting::get('budget_tracking_enabled', true, $companyId),
            'default_role' => Setting::get('default_project_member_role', 'member', $companyId),
        ];

        return Inertia::render('Project/Create', [
            'branches' => $branches,
            'employees' => $employees,
            'settings' => $settings,
        ]);
    }

    public function store(StoreProjectRequest $request)
    {
        $validated = $request->validated();
        $validated['created_by'] = Auth::id();

        $project = Project::create($validated);

        if ($request->has('members')) {
            foreach ($request->members as $member) {
                $project->members()->create([
                    'employee_id' => $member['employee_id'],
                    'role' => $member['role'],
                    'assigned_date' => now(),
                ]);
                
                $this->notifyEmployee($member['employee_id'], new \App\Notifications\ProjectAssigned($project, $member['role']));
            }
        }

        return redirect()->route('projects.index')->with('success', 'Project created successfully!');
    }

    public function show(Project $project)
    {
        $user = Auth::user();
        
        // BelongsToCompany handles branch isolation.
        // We only check if an employee who isn't a member is trying to see a private project
        // (Assuming visibility logic is needed, but for now we follow existing member-only check if non-admin)
        if (!$user->isAdmin() && !$user->hasPermission('view-projects')) {
             $isMember = $project->members()->where('employee_id', $user->employee_id)->exists();
             if (!$isMember) {
                  abort(403, 'Unauthorized access to this project.');
             }
        }

        $project->load(['branch', 'creator', 'tasks.assignments.employee', 'members.employee']);
        $projectMemberRole = null;
        if ($user && $user->employee_id) {
            $member = ProjectMember::where('project_id', $project->id)
                ->where('employee_id', $user->employee_id)
                ->first();
            if ($member) {
                $projectMemberRole = $member->role;
            }
        }

        return Inertia::render('Project/Show', [
            'project' => $project,
            'userRole' => $user ? $user->role : 'guest',
            'projectMemberRole' => $projectMemberRole,
            'budgetSettings' => [
                'enabled' => Setting::get('budget_tracking_enabled', false, $project->branch_id),
                'threshold' => Setting::get('budget_alert_threshold', 80, $project->branch_id),
            ],
        ]);
    }

    public function edit(Project $project)
    {
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-projects')) {
             // Check if lead
             $isProjectLead = ProjectMember::where('project_id', $project->id)
                ->where('employee_id', $user->employee_id)
                ->where('role', 'lead')
                ->exists();
             if (!$isProjectLead) {
                  abort(403, 'Unauthorized.');
             }
        }

        // BelongsToCompany handles branch isolation.

        $branches = Company::all(['id', 'name']);
        $employees = \App\Models\Employee::orderBy('name')->get(['id', 'name', 'company_id', 'employee_image']);
        $project->load('members');

        $companyId = $user->employee_id ? $user->employee->company_id : $project->branch_id;
        $settings = [
            'budget_tracking' => Setting::get('budget_tracking_enabled', true, $companyId),
        ];

        return Inertia::render('Project/Edit', [
            'project' => $project,
            'branches' => $branches,
            'employees' => $employees,
            'settings' => $settings,
        ]);
    }

    public function update(UpdateProjectRequest $request, Project $project)
    {
        $user = Auth::user();
        $validated = $request->validated();
 
        if (!$user->isAdmin() && !$user->hasPermission('manage-projects')) {
             $isProjectLead = ProjectMember::where('project_id', $project->id)
                ->where('employee_id', $user->employee_id)
                ->where('role', 'lead')
                ->exists();
             if (!$isProjectLead) {
                  abort(403, 'Unauthorized.');
             }
        }

        // Check if completion requires all tasks to be completed
        if ($validated['status'] === 'completed') {
            $companyId = $user->employee_id ? $user->employee->company_id : $project->branch_id;
            $requiresAllTasks = Setting::get('completion_requires_all_tasks', false, $companyId);
            if ($requiresAllTasks) {
                $hasIncompleteTasks = $project->tasks()->where('status', '!=', 'completed')->exists();
                if ($hasIncompleteTasks) {
                    return back()->with('error', 'All tasks must be completed before marking the project as completed.');
                }
            }
        }

        $project->update($validated);

        if ($request->has('members')) {
            $newMembersData = collect($request->members);
            $newEmployeeIds = $newMembersData->pluck('employee_id')->toArray();

            // 1. Identify members to be removed
            $currentMemberIds = $project->members()->pluck('employee_id')->toArray();
            $removedEmployeeIds = array_diff($currentMemberIds, $newEmployeeIds);

            if (!empty($removedEmployeeIds)) {
                // Cancel active tasks for these employees in this project
                $activeAssignments = TaskAssignment::whereIn('employee_id', $removedEmployeeIds)
                    ->whereHas('task', function ($q) use ($project) {
                        $q->where('project_id', $project->id)
                            ->whereIn('status', ['pending', 'in_progress']);
                    })
                    ->get();

                /** @var \App\Models\TaskAssignment $assignment */
                foreach ($activeAssignments as $assignment) {
                    // Check if assignment status allows cancellation
                    if ($assignment->status !== 'completed' && $assignment->status !== 'cancelled') {
                        $assignment->update([
                            'status' => 'cancelled',
                            'acceptance_status' => 'rejected', // Treated as revoked
                            'remarks' => $assignment->remarks . ' [System: Auto-cancelled due to project removal]'
                        ]);
                        // Log or Notify if needed
                    }
                }

                // Delete project members
                $project->members()->whereIn('employee_id', $removedEmployeeIds)->delete();
            }

            // 2. Add or Update members
            foreach ($newMembersData as $memberData) {
                // Check if exists
                $existingMember = $project->members()->where('employee_id', $memberData['employee_id'])->first();

                if ($existingMember) {
                    // Update role if changed
                    if ($existingMember->role !== $memberData['role']) {
                        $existingMember->update(['role' => $memberData['role']]);
                    }
                } else {
                    // Create new
                    $project->members()->create([
                        'employee_id' => $memberData['employee_id'],
                        'role' => $memberData['role'],
                        'assigned_date' => now(),
                    ]);

                    $this->notifyEmployee($memberData['employee_id'], new \App\Notifications\ProjectAssigned($project, $memberData['role']));
                }
            }
        }

        return redirect()->route('projects.index')->with('success', 'Project updated successfully!');
    }

    public function destroy(Project $project)
    {
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-projects')) {
            abort(403, 'Unauthorized access.');
        }

        $project->delete();
        return redirect()->route('projects.index')->with('success', 'Project deleted successfully!');
    }
    /**
     * Helper to notify employee
     */
    private function notifyEmployee($employeeId, $notification)
    {
        $employee = Employee::find($employeeId);
        if ($employee && $employee->user) {
            try {
                $employee->user->notify($notification);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Notification failed: ' . $e->getMessage());
            }
        }
    }
}
