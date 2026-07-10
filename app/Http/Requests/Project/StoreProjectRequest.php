<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreProjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = Auth::user();
        if ($user && $user->role === 'employee') {
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
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:active,completed,on_hold,cancelled',
            'visibility' => 'required|in:public,private',
            'budget' => 'nullable|numeric|min:0',
            'priority' => 'required|in:low,medium,high,urgent',
            'category' => 'nullable|string|max:255',
            'tags' => 'nullable|array',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'branch_id' => 'nullable|exists:companies,id',
            'members' => 'nullable|array',
            'members.*.employee_id' => 'required|exists:employees,id',
            'members.*.role' => 'required|string|in:lead,member,viewer',
        ];
    }
}
