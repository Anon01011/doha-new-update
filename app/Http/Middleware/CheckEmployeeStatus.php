<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class CheckEmployeeStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();

            // If user is an employee, check if their employee profile is active
            if ($user->employee_id) {
                $employee = \App\Models\Employee::find($user->employee_id);

                if ($employee) {
                    if ($employee->manual_status === 'waiting') {
                        Auth::logout();
                        $request->session()->invalidate();
                        $request->session()->regenerateToken();
                        return redirect()->route('login')->with('error', 'Your registration is pending approval. Please wait for an administrator to activate your account.');
                    }

                    if (!$employee->is_active) {
                        Auth::logout();
                        $request->session()->invalidate();
                        $request->session()->regenerateToken();
                        return redirect()->route('login')->with('error', 'Your employee account is inactive. Please contact HR.');
                    }
                }
            }
        }

        return $next($request);
    }
}
