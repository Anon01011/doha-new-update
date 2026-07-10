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
        $timezone = config('app.timezone');

        if ($user) {
            $companyId = $user->employee && $user->employee->company_id ? $user->employee->company_id : null;

            // Try to get per-company timezone
            if ($companyId) {
                $companyTimezone = Setting::get('app_timezone', null, $companyId);
                if ($companyTimezone) {
                    $timezone = $companyTimezone;
                }
            } else {
                // Try to get global database setting
                $globalTimezone = Setting::get('app_timezone');
                if ($globalTimezone) {
                    $timezone = $globalTimezone;
                }
            }
        }

        if ($timezone) {
            date_default_timezone_set($timezone);
            Config::set('app.timezone', $timezone);
        }

        return $next($request);
    }
}
