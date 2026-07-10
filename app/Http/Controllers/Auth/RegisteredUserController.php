<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'nullable|string|in:admin,employee,hr,manager',
        ]);

        $role = $request->role ?? 'employee'; // Default to employee if not provided

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $role,
        ]);

        // If it's an employee role, create an Employee profile and link it
        if ($role === 'employee') {
            $company = \App\Models\Company::first(); // Assign to first company as default for new registrations

            $employee = \App\Models\Employee::create([
                'name' => $request->name,
                'email' => $request->email,
                'employee_code' => \App\Models\Employee::generateCode($company?->id),
                'gender' => 'Male', // Default gender for quick registration
                'company_id' => $company?->id,
                'manual_status' => 'waiting',
                'joined_date' => now(),
            ]);

            $user->update([
                'employee_id' => $employee->id,
            ]);

            // Assign role using the relationship as well
            $user->assignRole('employee');
        }

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
