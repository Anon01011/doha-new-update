<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Setting;
use App\Models\ShiftRoster;
use App\Mail\EmployeeRosterMail;
use App\Jobs\SendWhatsAppRosterNotification;
use App\Jobs\SendRosterSmsNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ShiftRosterNotificationService
{
    /**
     * Map day name to 0-based offset from Monday.
     */
    public static function getDayOffset(string $day): int
    {
        $days = [
            'Monday' => 0,
            'Tuesday' => 1,
            'Wednesday' => 2,
            'Thursday' => 3,
            'Friday' => 4,
            'Saturday' => 5,
            'Sunday' => 6,
        ];

        return $days[$day] ?? 0;
    }

    /**
     * Automatically dispatch approved roster notifications across enabled channels (Email, WhatsApp, SMS).
     */
    public static function dispatchRosterNotifications(Company $company, string $weekStart, ?int $departmentId = null): array
    {
        try {
            $companyId = $company->id;

            $sendEmail    = Setting::get('roster_send_email', true, $companyId);
            $sendWhatsapp = Setting::get('roster_send_whatsapp', false, $companyId);
            $sendSms      = Setting::get('roster_send_sms', false, $companyId);

            $enabledChannels = [];
            if ($sendEmail) $enabledChannels[] = 'Email';
            if ($sendWhatsapp) $enabledChannels[] = 'WhatsApp';
            if ($sendSms) $enabledChannels[] = 'SMS';

            if (empty($enabledChannels)) {
                Log::info("dispatchRosterNotifications: No notification channels enabled for company {$companyId}");
                return ['dispatched' => false, 'channels' => [], 'recipients_count' => 0];
            }

            $startDate = Carbon::parse($weekStart);
            $endDate   = $startDate->copy()->addDays(6);
            $dateRange = $startDate->format('M d, Y') . ' - ' . $endDate->format('M d, Y');

            $query = ShiftRoster::where('company_id', $companyId)
                ->where('week_start', $weekStart)
                ->where('status', 'approved');

            if ($departmentId) {
                $deptEmployeeIds = Employee::where('department_id', $departmentId)->pluck('id');
                $query->whereIn('employee_id', $deptEmployeeIds);
            }

            $rosters = $query->get();

            if ($rosters->isEmpty()) {
                return ['dispatched' => false, 'channels' => $enabledChannels, 'recipients_count' => 0];
            }

            $employeeIds = $rosters->pluck('employee_id')->unique();
            $employees = Employee::whereIn('id', $employeeIds)->get();

            $dispatchedCount = 0;

            foreach ($employees as $employee) {
                $employeeRoster = $rosters->where('employee_id', $employee->id)->map(function ($r) {
                    return [
                        'day'         => $r->day,
                        'date'        => Carbon::parse($r->week_start)->addDays(self::getDayOffset($r->day))->format('M d, Y'),
                        'shift_time'  => $r->shift_time,
                        'shift_type'  => $r->shift_type,
                        'designation' => $r->designation,
                        'notes'       => $r->notes,
                    ];
                })->values()->toArray();

                if (empty($employeeRoster)) {
                    continue;
                }

                $sentToEmployee = false;

                // 1. Email Channel
                if ($sendEmail && !empty($employee->email)) {
                    if (config('mail.default') === 'sendmail' && !function_exists('proc_open')) {
                        Log::warning("proc_open is disabled on this server; skipping email dispatch for {$employee->name}.");
                    } else {
                        try {
                            Mail::to($employee->email)->queue(new EmployeeRosterMail($employee, $company, $employeeRoster, $dateRange));
                            $sentToEmployee = true;
                        } catch (\Throwable $e) {
                            Log::warning("Failed to queue email for {$employee->name}: " . $e->getMessage());
                        }
                    }
                }

                // 2. WhatsApp Channel
                if ($sendWhatsapp && !empty($employee->mobile)) {
                    try {
                        SendWhatsAppRosterNotification::dispatch($employee, $company, $employeeRoster, $dateRange);
                        $sentToEmployee = true;
                    } catch (\Throwable $e) {
                        Log::error("Failed to dispatch WhatsApp for {$employee->name}: " . $e->getMessage());
                    }
                }

                // 3. SMS Channel
                if ($sendSms && !empty($employee->mobile)) {
                    try {
                        SendRosterSmsNotification::dispatch($employee, $company, $employeeRoster, $dateRange);
                        $sentToEmployee = true;
                    } catch (\Throwable $e) {
                        Log::error("Failed to dispatch SMS for {$employee->name}: " . $e->getMessage());
                    }
                }

                if ($sentToEmployee) {
                    $dispatchedCount++;
                }
            }

            Log::info("Automatic roster notifications dispatched for week {$weekStart}", [
                'company_id'       => $companyId,
                'channels'         => $enabledChannels,
                'recipients_count' => $dispatchedCount,
            ]);

            return [
                'dispatched'       => $dispatchedCount > 0,
                'channels'         => $enabledChannels,
                'recipients_count' => $dispatchedCount,
            ];
        } catch (\Throwable $e) {
            Log::error('dispatchRosterNotifications error: ' . $e->getMessage());
            return ['dispatched' => false, 'channels' => [], 'recipients_count' => 0];
        }
    }
}
