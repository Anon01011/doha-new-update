<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use App\Models\Setting;

class StoreTaskRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = Auth::user();
        $projectId = $this->input('project_id');

        $isProjectLead = false;
        if ($projectId && $user && $user->role === 'employee' && $user->employee_id) {
            $isProjectLead = \App\Models\ProjectMember::where('project_id', $projectId)
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
            'due_date' => 'required|date',
            'estimated_hours' => 'nullable|numeric',
            'category' => 'nullable|string|max:255',
            'tags' => 'nullable|array',
            'is_recurring' => 'nullable|boolean',
            'recurrence_pattern' => 'nullable|string',
            'assigned_employee_ids' => 'nullable|array',
            'assigned_employee_ids.*' => 'exists:employees,id',
        ];
    }

    protected function prepareForValidation()
    {
        $user = Auth::user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        if (!$this->has('priority')) {
            $this->merge([
                'priority' => Setting::get('default_task_priority', 'medium', $companyId),
            ]);
        }
    }
}
