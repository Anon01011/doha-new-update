<?php

namespace App\Jobs;

use App\Models\Employee;
use App\Models\Company;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendRosterSmsNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $employee;
    protected $company;
    protected $employeeRoster;
    protected $dateRange;

    /**
     * Create a new job instance.
     */
    public function __construct(Employee $employee, Company $company, array $employeeRoster, string $dateRange)
    {
        $this->employee = $employee;
        $this->company = $company;
        $this->employeeRoster = $employeeRoster;
        $this->dateRange = $dateRange;
    }

    /**
     * Execute the job.
     */
    public function handle()
    {
        try {
            $companyId = $this->company->id;
            $mobile = $this->employee->mobile;

            if (empty($mobile)) {
                Log::info("SendRosterSmsNotification: Employee {$this->employee->name} has no mobile number.");
                return;
            }

            // Build SMS message body
            $smsMessage = "Hi {$this->employee->name},\nYour shift roster for {$this->dateRange} at {$this->company->name}:\n";
            foreach ($this->employeeRoster as $shift) {
                $shiftDay = $shift['day'] ?? '';
                $shiftDate = $shift['date'] ?? '';
                $shiftTime = $shift['shift_time'] ?? '';
                $designation = !empty($shift['designation']) ? " ({$shift['designation']})" : '';
                $smsMessage .= "- {$shiftDay} ({$shiftDate}): {$shiftTime}{$designation}\n";
            }
            $smsMessage .= "Please arrive on time. Contact HR for queries.";

            $smsProvider = Setting::get('sms_provider', 'custom', $companyId);

            switch ($smsProvider) {
                case 'twilio':
                    $sid   = Setting::get('twilio_sid', null, $companyId);
                    $token = Setting::get('twilio_token', null, $companyId);
                    $from  = Setting::get('twilio_sms_from', Setting::get('twilio_from', null, $companyId), $companyId);

                    if (!$sid || !$token || !$from) {
                        Log::warning("Twilio SMS credentials incomplete for company {$companyId}");
                        return;
                    }

                    $response = Http::withBasicAuth($sid, $token)
                        ->asForm()
                        ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                            'From' => $from,
                            'To'   => $mobile,
                            'Body' => $smsMessage,
                        ]);

                    if ($response->successful()) {
                        Log::info("Roster Twilio SMS sent to {$this->employee->name} ({$mobile})");
                    } else {
                        Log::error("Roster Twilio SMS failed for {$this->employee->name}: " . $response->body());
                    }
                    break;

                case 'vonage':
                    $apiKey    = Setting::get('vonage_api_key', null, $companyId);
                    $apiSecret = Setting::get('vonage_api_secret', null, $companyId);
                    $from      = Setting::get('vonage_from', 'HR', $companyId);

                    if (!$apiKey || !$apiSecret) {
                        Log::warning("Vonage SMS credentials incomplete for company {$companyId}");
                        return;
                    }

                    $response = Http::post('https://rest.nexmo.com/sms/json', [
                        'api_key'    => $apiKey,
                        'api_secret' => $apiSecret,
                        'to'         => $mobile,
                        'from'       => $from,
                        'text'       => $smsMessage,
                    ]);

                    if ($response->successful()) {
                        Log::info("Roster Vonage SMS sent to {$this->employee->name} ({$mobile})");
                    } else {
                        Log::error("Roster Vonage SMS failed for {$this->employee->name}: " . $response->body());
                    }
                    break;

                default: // Custom HTTP API
                    $smsUrl    = Setting::get('sms_api_url', null, $companyId);
                    $smsToken  = Setting::get('sms_api_token', null, $companyId);
                    $smsSender = Setting::get('sms_sender_id', null, $companyId);

                    if (!$smsUrl || !$smsToken) {
                        Log::info("Custom SMS API not configured for company {$companyId}, skipping.");
                        return;
                    }

                    $headers = [
                        'Authorization' => 'Bearer ' . $smsToken,
                        'Content-Type'  => 'application/json',
                    ];

                    $response = Http::withHeaders($headers)->post($smsUrl, [
                        'to'      => $mobile,
                        'from'    => $smsSender,
                        'message' => $smsMessage,
                    ]);

                    if ($response->successful()) {
                        Log::info("Roster Custom SMS sent to {$this->employee->name} ({$mobile})");
                    } else {
                        Log::error("Roster Custom SMS failed for {$this->employee->name}: " . $response->body());
                    }
                    break;
            }
        } catch (\Exception $e) {
            Log::error('SendRosterSmsNotification exception: ' . $e->getMessage());
        }
    }
}
