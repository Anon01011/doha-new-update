<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        $quickLoginOptions = [];
        if (config('app.env') !== 'production' || request()->has('show_demo')) {
            // Get a few of each role to ensure variety
            $hrs = \App\Models\User::with(['employee.company'])->where('role', 'hr')->take(4)->get();
            $managers = \App\Models\User::with(['employee.company'])->where('role', 'manager')->take(4)->get();
            $employees = \App\Models\User::with(['employee.company'])->where('role', 'employee')->take(8)->get();

            $quickLoginOptions = collect()
                ->merge($hrs)
                ->merge($managers)
                ->merge($employees)
                ->map(function($user) {
                    return [
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => strtoupper($user->role),
                        'branch' => $user->employee && $user->employee->company ? $user->employee->company->name : 'Main Branch',
                    ];
                })
                ->shuffle() // Mix them up
                ->values();
                
            \Illuminate\Support\Facades\Log::info('Quick Login Options Generated:', ['count' => count($quickLoginOptions)]);
        }

        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'quickLoginOptions' => $quickLoginOptions,
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): \Symfony\Component\HttpFoundation\Response
    {
        $request->authenticate();

        $request->session()->regenerate();

        return \Inertia\Inertia::location(route('dashboard', absolute: false));
    }

    public function destroy(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $user = Auth::user();
        if ($user && $user->employee_id) {
            $attendance = \App\Models\EmployeeAttendance::where('employee_id', $user->employee_id)
                ->where('date', now()->toDateString())
                ->whereNull('to_time')
                ->first();

            if ($attendance && $attendance->from_time) {
                $toTime = now();
                $fromTime = \Carbon\Carbon::parse($attendance->from_time);
                $diffInMinutes = $toTime->diffInMinutes($fromTime);
                $totalBreakMinutes = $attendance->total_break_minutes ?: 0;
                $workMinutes = $diffInMinutes - $totalBreakMinutes;
                $hoursWorked = round($workMinutes / 60, 2);
                $normalHours = $attendance->normal_hours ?: 0;
                $ot = $hoursWorked > $normalHours ? $hoursWorked - $normalHours : 0;
                $overtimeRate = env('PAYROLL_OVERTIME_RATE', 0);
                $otAmount = ($ot > 0 && $overtimeRate > 0) ? $ot * $overtimeRate : 0;

                $attendance->update([
                    'to_time' => $toTime->format('H:i'),
                    'hours_worked' => $hoursWorked,
                    'ot' => $ot,
                    'ot_amt' => $otAmount,
                    'current_break_start' => null, // Ensure break is ended if they logout while on break
                ]);
            }
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return Inertia::location('/');
    }
}
