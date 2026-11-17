<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class SetupPinRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();
        $rules = [
            'pin'              => ['required', 'string', 'size:6', 'regex:/^[0-9]{6}$/', 'confirmed'],
            'pin_confirmation' => ['required', 'string', 'size:6'],
            'device_name'      => ['nullable', 'string', 'max:100'],
            'register_device'  => ['nullable', 'boolean'],
        ];

        // If user already has a PIN configured, require current password to change it
        if ($user && $user->hasPinConfigured()) {
            $rules['current_password'] = ['required', 'current_password'];
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'pin.required'             => 'Please enter a 6-digit PIN.',
            'pin.size'                 => 'The PIN must be exactly 6 digits.',
            'pin.regex'                => 'The PIN must consist of numbers only.',
            'pin.confirmed'            => 'The PIN confirmation does not match.',
            'current_password.required'=> 'Please enter your current account password to authorize this change.',
            'current_password.current_password' => 'The provided password is incorrect.',
        ];
    }
}

