<?php

namespace App\Helpers;

use App\Models\Setting;
use Carbon\Carbon;

class TimeHelper
{
    /**
     * Return a Carbon instance for "now" in the application's configured
     * timezone. Reads the `app_timezone` setting from the settings table
     * (company-scoped when $companyId is provided), falling back to
     * config('app.timezone'), then UTC.
     *
     * Usage:
     *   TimeHelper::now($employee->company_id)->format('h:i A')
     *   TimeHelper::now()->format('h:i A')
     */
    public static function now(?int $companyId = null): Carbon
    {
        $tz = Setting::get('app_timezone', config('app.timezone', 'UTC'), $companyId);

        // Validate the timezone string — fall back to UTC if invalid
        try {
            return Carbon::now($tz);
        } catch (\Exception $e) {
            return Carbon::now('UTC');
        }
    }

    /**
     * Convert a Carbon/datetime instance to the configured app timezone.
     * Useful for formatting stored datetime values (e.g. $toTime from DB).
     *
     * Usage:
     *   TimeHelper::inTz($toTime, $employee->company_id)->format('h:i A')
     */
    public static function inTz($dt, ?int $companyId = null): Carbon
    {
        $tz = Setting::get('app_timezone', config('app.timezone', 'UTC'), $companyId);

        $carbon = $dt instanceof Carbon ? $dt : Carbon::parse($dt);

        try {
            return $carbon->setTimezone($tz);
        } catch (\Exception $e) {
            return $carbon->setTimezone('UTC');
        }
    }
}
