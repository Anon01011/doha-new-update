<?php

namespace App\Http\Controllers;

use App\Models\Grievance;
use App\Models\Employee;
use App\Models\User;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GrievanceController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');
        $priority = $request->query('priority');
        $search = $request->query('search');
        $query = Grievance::with('employee', 'assignee');

        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('view-grievances')) {
             // Default behavior for employees is to see their own
        }

        // Global multi-tenancy scope handles branch isolation automatically.

        // Role-based filtering (additional to global scope)
        if ($user->isEmployee() && $user->employee_id) {
            // Employees can only see their own grievances
            $query->where('employee_id', $user->employee_id);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhereHas('employee', function ($emp) use ($search) {
                        $emp->where('name', 'like', "%{$search}%")
                            ->orWhere('employee_code', 'like', "%{$search}%");
                    });
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($priority) {
            $query->where('priority', $priority);
        }

        $grievances = $query->latest()->paginate(10);

        // Calculate SLA status
        $grievances->getCollection()->transform(function ($grievance) {
            if ($grievance->status !== 'resolved' && $grievance->status !== 'closed') {
                $companyId = $grievance->company_id;
                $slaHours = Setting::get('response_sla_hours', 24, $companyId);
                $deadline = $grievance->created_at->addHours($slaHours);

                $grievance->sla_deadline = $deadline;
                $grievance->is_overdue = now()->greaterThan($deadline);
            }
            return $grievance;
        });

        return Inertia::render('Grievance/Index', [
            'grievances' => $grievances,
            'status' => $status,
            'priority' => $priority,
            'search' => $search,
            'userRole' => $user->role,
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('create-grievances')) {
             // Employees can usually create for themselves
        }

        // Role-based employee selection (Global scope handles branch isolation)
        if ($user->isEmployee() && $user->employee_id) {
            $employees = Employee::where('id', $user->employee_id)->get(['id', 'name', 'employee_code', 'employee_image', 'designation']);
        } else {
            $employees = Employee::orderBy('name')->get(['id', 'name', 'employee_code', 'employee_image', 'designation']);
        }

        $companyId = $user->employee_id ? $user->employee->company_id : null;
        $settings = [
            'anonymous_allowed' => Setting::get('anonymous_submission_allowed', false, $companyId),
            'require_evidence' => Setting::get('require_evidence_attachment', false, $companyId),
        ];

        return Inertia::render('Grievance/Create', [
            'employees' => $employees,
            'userRole' => $user->role,
            'settings' => $settings,
            'authEmployeeId' => $user->employee_id,
            'categories' => Setting::get('grievance_categories', ['Harassment', 'Pay & Benefits', 'Work Conditions', 'Discrimination', 'Interpersonal Conflict', 'Other'], $companyId),
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $employee = Employee::findOrFail($request->employee_id);
        $companyId = $employee->company_id;

        $requireEvidence = Setting::get('require_evidence_attachment', false, $companyId);
        $anonymousAllowed = Setting::get('anonymous_submission_allowed', false, $companyId);

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'category' => 'required|string|max:255',
            'priority' => 'required|in:low,medium,high,urgent',
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'is_confidential' => 'boolean',
            'is_anonymous' => 'boolean',
            'attachments' => ($requireEvidence ? 'required|' : 'nullable|') . 'array',
            'attachments.*' => 'file|max:10240', // 10MB max per file
        ]);

        $validated['company_id'] = $employee->company_id;

        if ($validated['is_anonymous'] && !$anonymousAllowed) {
            return back()->with('error', 'Anonymous submission is not allowed by system settings.');
        }

        // BelongsToCompany handles multi-tenancy for managers/admins.
        if ($user->isEmployee() && $user->employee_id && $validated['employee_id'] != $user->employee_id) {
             abort(403, 'You can only create grievances for yourself.');
        }

        // Handle file uploads
        $attachmentPaths = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('grievances', 'public');
                $attachmentPaths[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'size' => $file->getSize(),
                    'type' => $file->getClientMimeType(),
                ];
            }
        }

        $validated['attachments'] = $attachmentPaths;
        $validated['status'] = 'submitted';
        $validated['submitted_date'] = now()->toDateString();

        $grievance = Grievance::create($validated);
        
        // Notify Admins or branch HR
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            $admin->notify(new \App\Notifications\GrievanceSubmitted($grievance, $employee->name));
        }

        return redirect()->route('grievances.index')->with('success', 'Grievance submitted successfully!');
    }

    public function show(Grievance $grievance)
    {
        $user = auth()->user();
        if ($user->isEmployee() && $grievance->employee_id != $user->employee_id) {
            abort(403, 'Unauthorized access.');
        }

        // BelongsToCompany handles branch isolation.

        $grievance->load('employee', 'assignee', 'responses.responder', 'warningLetters.sender');

        // Calculate SLA for single view
        if ($grievance->status !== 'resolved' && $grievance->status !== 'closed') {
            $companyId = $grievance->company_id;
            $slaHours = Setting::get('response_sla_hours', 24, $companyId);
            $deadline = $grievance->created_at->addHours($slaHours);

            $grievance->sla_deadline = $deadline;
            $grievance->is_overdue = now()->greaterThan($deadline);
            $grievance->escalation_enabled = Setting::get('escalation_enabled', false, $companyId);
        }

        $users = User::orderBy('name')->get(['id', 'name', 'email']);

        return Inertia::render('Grievance/Show', [
            'grievance' => $grievance,
            'users' => $users,
            'userRole' => $user->role,
            'warningTypes' => Setting::get('warning_letter_types', ['Warning', 'Strict Warning', 'Show Cause', 'Termination'], $grievance->employee->company_id),
        ]);
    }

    public function edit(Grievance $grievance)
    {
        $user = auth()->user();
        if ($user->isEmployee()) {
            abort(403, 'Employees are not permitted to edit grievances once submitted.');
        }

        if (!$user->isAdmin() && !$user->hasPermission('manage-grievances')) {
            abort(403, 'Unauthorized access.');
        }

        // BelongsToCompany handles branch isolation.

        $employees = Employee::orderBy('name')->get(['id', 'name', 'employee_code']);
        $users = User::orderBy('name')->get(['id', 'name', 'email']);

        return Inertia::render('Grievance/Edit', [
            'grievance' => $grievance,
            'employees' => $employees,
            'users' => $users,
            'userRole' => $user->role,
            'categories' => Setting::get('grievance_categories', ['Harassment', 'Pay & Benefits', 'Work Conditions', 'Discrimination', 'Interpersonal Conflict', 'Other'], $grievance->employee->company_id),
        ]);
    }

    public function update(Request $request, Grievance $grievance)
    {
        $user = auth()->user();

        if ($user->isEmployee()) {
            abort(403, 'Employees are not permitted to update grievances.');
        }

        if (!$user->isAdmin() && !$user->hasPermission('manage-grievances')) {
            abort(403, 'Unauthorized access.');
        }

        // Admin, HR, Manager can update all fields
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'category' => 'required|string|max:255',
            'priority' => 'required|in:low,medium,high,urgent',
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'status' => 'required|in:submitted,under_review,resolved,closed',
            'assigned_to' => 'nullable|exists:users,id',
            'resolution_notes' => 'nullable|string',
            'resolution_action' => 'nullable|string',
            'is_confidential' => 'boolean',
            'attachments' => 'nullable|array',
        ]);

        if ($validated['status'] === 'resolved' && !$grievance->resolved_date) {
            $validated['resolved_date'] = now()->toDateString();
        }

        $oldAssignee = $grievance->assigned_to;
        $grievance->update($validated);

        // Notify Employee if status changed
        if ($grievance->wasChanged('status')) {
            $this->notifyEmployee($grievance->employee_id, new \App\Notifications\GrievanceStatusUpdated($grievance, $grievance->status));
        }

        // Notify Assignee if changed
        if ($grievance->wasChanged('assigned_to') && $grievance->assigned_to) {
            $this->notifyUser($grievance->assigned_to, new \App\Notifications\GrievanceStatusUpdated($grievance, 'assigned to you', "You have been assigned to investigate grievance regarding '{$grievance->subject}'."));
        }

        return redirect()->route('grievances.show', $grievance)->with('success', 'Grievance updated successfully!');
    }

    public function destroy(Grievance $grievance)
    {
        $user = auth()->user();

        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('manage-grievances')) {
            abort(403, 'Unauthorized access.');
        }

        $grievance->delete();
        return redirect()->route('grievances.index')->with('success', 'Grievance deleted successfully!');
    }
    /**
     * Helper to notify user
     */
    private function notifyUser($userId, $notification)
    {
        $user = User::find($userId);
        if ($user) {
            try {
                $user->notify($notification);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Notification failed: ' . $e->getMessage());
            }
        }
    }

    /**
     * Helper to notify employee
     */
    private function notifyEmployee($employeeId, $notification)
    {
        $employee = Employee::find($employeeId);
        if ($employee && $employee->user) {
            $this->notifyUser($employee->user->id, $notification);
        }
    }
}
