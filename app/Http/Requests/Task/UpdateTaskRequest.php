<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateTaskRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = Auth::user();
        $task = $this->route('task');

        // Project Lead check
        $isProjectLead = false;
        if ($task->project_id && $user && $user->role === 'employee' && $user->employee_id) {
            $isProjectLead = \App\Models\ProjectMember::where('project_id', $task->project_id)
                ->where('employee_id', $user->employee_id)
                ->where('role', 'lead')
                ->exists();
        }

        if ($user && $user->role === 'employee' && !$isProjectLead) {
            return false;
        }

        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'project_id' => 'nullable|exists:projects,id',
            'parent_id' => 'nullable|exists:tasks,id',
            'branch_id' => 'required_without:project_id|exists:companies,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,medium,high,urgent',
            'status' => 'required|in:pending,in_progress,completed,cancelled',
            'due_date' => 'required|date',
            'estimated_hours' => 'nullable|numeric',
            'category' => 'nullable|string|max:255',
            'tags' => 'nullable|array',
            'is_blocked' => 'nullable|boolean',
            'blocked_reason' => 'nullable|string',
            'is_recurring' => 'nullable|boolean',
            'recurrence_pattern' => 'nullable|string',
            'assigned_employee_ids' => 'nullable|array',
            'assigned_employee_ids.*' => 'exists:employees,id',
        ];
    }
}
