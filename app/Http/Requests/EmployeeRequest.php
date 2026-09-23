<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Employee;

class EmployeeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization is handled in the controller or middleware
        return true;
    }

    protected function prepareForValidation(): void
    {
        $companyIds = $this->input('company_ids');
        $companyId = $this->input('company_id');

        if (!empty($companyIds) && is_array($companyIds)) {
            $companyId = $companyIds[0] ?? null;
        } elseif (!empty($companyId) && empty($companyIds)) {
            $companyIds = [(int) $companyId];
        }

        $departmentIds = $this->input('department_ids');
        $departmentId = $this->input('department_id');

        if (!empty($departmentIds) && is_array($departmentIds)) {
            $departmentId = $departmentIds[0] ?? null;
        } elseif (!empty($departmentId) && empty($departmentIds)) {
            $departmentIds = [(int) $departmentId];
        }

        $this->merge([
            'company_id' => $companyId,
            'company_ids' => $companyIds,
            'department_id' => $departmentId,
            'department_ids' => $departmentIds,
        ]);
    }

    public function rules(): array
    {
        $employeeId = $this->route('employee') ? $this->route('employee')->id : null;

        return [
            'name' => 'required|string|max:255',
            'employee_code' => [
                'nullable', // Can be null if auto-generated
                'string',
                'max:255',
                Rule::unique('employees', 'employee_code')->ignore($employeeId),
            ],
            'gender' => 'required|in:Male,Female',
            'dob' => 'nullable|date',
            'mobile' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('employees', 'mobile')->ignore($employeeId)->whereNotNull('mobile'),
            ],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('employees', 'email')->ignore($employeeId)->whereNotNull('email'),
            ],
            'designation' => 'nullable|string|max:255',
            'nationality' => 'nullable|string|max:255',
            'sponsor' => 'nullable|string|max:255',
            'company_id' => 'nullable|exists:companies,id',
            'company_ids' => 'nullable|array',
            'company_ids.*' => 'exists:companies,id',
            'location' => 'nullable|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'department_ids' => 'nullable|array',
            'department_ids.*' => 'exists:departments,id',
            'joined_date' => 'nullable|date',
            'rejoined_date' => 'nullable|date',
            'shift' => 'nullable|string|max:255',
            'visa_type' => 'nullable|string|max:255',
            'visa_designation' => 'nullable|string|max:255',
            'employee_category' => 'nullable|string|max:255',
            'contract_duration' => 'nullable|string|max:255',
            'exit_status' => 'nullable|string|max:255',
            'payment_type' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'bank_account_number' => 'nullable|string|max:255',
            'bank_code' => 'nullable|string|max:255',
            'bank_branch' => 'nullable|string|max:255',
            'iban' => 'nullable|string|max:255',
            'upi_id' => 'nullable|string|max:255',
            'pan_number' => 'nullable|string|max:255',
            'leave_status' => 'nullable|string|max:255',
            'reported_to' => 'nullable|string|max:255',
            'employee_image' => 'nullable|file|image|mimes:jpg,jpeg,png,webp,gif|max:10240',
            'manual_status' => 'nullable|in:active,inactive,waiting',
            'role' => 'nullable|string|exists:roles,slug',
            'password' => 'nullable|string|min:8|confirmed',
            'basic_salary' => 'nullable|numeric|min:0',
            'agreement_doc' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'resume_doc' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'other_docs' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'passport_number' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('employees', 'passport_number')->ignore($employeeId)->whereNotNull('passport_number'),
            ],
            'passport_expiry_date' => 'nullable|date',
            'passport_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'qid_number' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('employees', 'qid_number')->ignore($employeeId)->whereNotNull('qid_number'),
            ],
            'qid_expiry_date' => 'nullable|date',
            'qid_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'aadhar_number' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('employees', 'aadhar_number')->ignore($employeeId)->whereNotNull('aadhar_number'),
            ],
            'aadhar_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'pan_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'education_doc' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'relieving_doc' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'bank_doc' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'salary_structures' => 'nullable|array',
            'salary_structures.*.component_id' => 'required|exists:salary_components,id',
            'salary_structures.*.amount' => 'required|numeric|min:0',
            'food_handler_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'food_handler_expiry_date' => 'nullable|date',
            'health_card_number' => 'nullable|string|max:255',
            'health_card_expiry_date' => 'nullable|date',
            'contract_issue_date' => 'nullable|date',
            'contract_expiry_date' => 'nullable|date',
            'weekly_offs' => 'nullable|array',
            'weekly_offs.*.weekly_off_day' => 'required|string|in:Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
            'weekly_offs.*.effective_date' => 'required|date',
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'employee_code.unique' => 'This employee code is already in use by another employee.',
            'mobile.unique' => 'This mobile / phone number is already registered for another employee.',
            'email.unique' => 'This email address is already in use by another employee.',
            'qid_number.unique' => 'This QID / Document ID is already registered for another employee.',
            'passport_number.unique' => 'This passport number is already registered for another employee.',
        ];
    }
}
