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

            // If user is linked to an employee profile, validate it
            if ($user->employee_id) {
                $employee = \App\Models\Employee::find($user->employee_id);

                // SECURITY FIX #10: Handle orphaned sessions where employee was deleted.
                // Without this check, a user with a deleted employee profile would pass
                // through all middleware unchecked, with a dangling employee_id.
                if (!$employee) {
                    Auth::logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                    \Illuminate\Support\Facades\Log::warning('CheckEmployeeStatus: Forced logout of user #' . $user->id . ' — linked employee #' . $user->employee_id . ' no longer exists.');
                    return redirect()->route('login')->with('error', 'Your employee account was not found. Please contact HR.');
                }

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

        return $next($request);
    }
}
