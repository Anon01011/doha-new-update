<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Setting;
use Illuminate\Support\Facades\Config;
use Symfony\Component\HttpFoundation\Response;

class SetTimezone
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $companyId = $user ? ($user->company_id ?: $user->employee?->company_id) : null;
        $timezone = Setting::get('app_timezone', config('app.timezone', 'UTC'), $companyId);

        if ($timezone) {
            try {
                date_default_timezone_set($timezone);
                Config::set('app.timezone', $timezone);
            } catch (\Throwable $e) {
                // Keep default if invalid
            }
        }

        return $next($request);
    }
}
