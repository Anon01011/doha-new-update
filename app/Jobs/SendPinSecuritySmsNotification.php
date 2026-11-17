<?php

namespace App\Jobs;

use App\Models\Company;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendPinSecuritySmsNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public User $user;
    public ?Company $company;
    public string $mobile;
    public string $ipAddress;
    public string $time;
    public bool $isLocked;

    /**
     * Create a new job instance.
     */
    public function __construct(
        User $user,
        ?Company $company,
        string $mobile,
        string $ipAddress,
        string $time,
        bool $isLocked = false
    ) {
        $this->user = $user;
        $this->company = $company;
        $this->mobile = $mobile;
        $this->ipAddress = $ipAddress;
        $this->time = $time;
        $this->isLocked = $isLocked;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $companyId = $this->company?->id ?: $this->user->employee?->company_id;
            $appName   = Setting::get('app_name', config('app.name'), $companyId);

            $message = "Security Alert: An unsuccessful PIN login was detected on your {$appName} account from IP {$this->ipAddress} at {$this->time}.";
            if ($this->isLocked) {
                $message .= " Your PIN has been locked for 15 mins.";
            }
            $message .= " If this wasn't you, sign in with your password and secure your account immediately.";

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
                            'To'   => $this->mobile,
                            'Body' => $message,
                        ]);

                    if ($response->successful()) {
                        Log::info("PIN failure Twilio SMS sent to user {$this->user->id} ({$this->mobile})");
                    } else {
                        Log::error("PIN failure Twilio SMS failed for user {$this->user->id}: " . $response->body());
                    }
                    break;

                case 'vonage':
                    $apiKey    = Setting::get('vonage_api_key', null, $companyId);
                    $apiSecret = Setting::get('vonage_api_secret', null, $companyId);
                    $from      = Setting::get('vonage_from', 'HRMS-SEC', $companyId);

                    if (!$apiKey || !$apiSecret) {
                        Log::warning("Vonage SMS credentials incomplete for company {$companyId}");
                        return;
                    }

                    $response = Http::post('https://rest.nexmo.com/sms/json', [
                        'api_key'    => $apiKey,
                        'api_secret' => $apiSecret,
                        'to'         => $this->mobile,
                        'from'       => $from,
                        'text'       => $message,
                    ]);

                    if ($response->successful()) {
                        Log::info("PIN failure Vonage SMS sent to user {$this->user->id} ({$this->mobile})");
                    } else {
                        Log::error("PIN failure Vonage SMS failed for user {$this->user->id}: " . $response->body());
                    }
                    break;

                case 'infobip':
                    $baseUrl = Setting::get('infobip_base_url', null, $companyId);
                    $apiKey  = Setting::get('infobip_api_key', null, $companyId);
                    $from    = Setting::get('infobip_sms_from', 'HRMS', $companyId);

                    if (!$baseUrl || !$apiKey) {
                        Log::warning("InfoBip SMS credentials incomplete for company {$companyId}");
                        return;
                    }

                    $url = rtrim($baseUrl, '/') . '/sms/2/text/advanced';
                    $response = Http::withHeaders([
                        'Authorization' => 'App ' . $apiKey,
                        'Content-Type'  => 'application/json',
                    ])->post($url, [
                        'messages' => [
                            [
                                'from'         => $from,
                                'destinations' => [['to' => $this->mobile]],
                                'text'         => $message,
                            ],
                        ],
                    ]);

                    if ($response->successful()) {
                        Log::info("PIN failure InfoBip SMS sent to user {$this->user->id} ({$this->mobile})");
                    } else {
                        Log::error("PIN failure InfoBip SMS failed for user {$this->user->id}: " . $response->body());
                    }
                    break;

                default: // Custom HTTP API
                    $smsUrl    = Setting::get('sms_api_url', null, $companyId);
                    $smsToken  = Setting::get('sms_api_token', null, $companyId);
                    $smsSender = Setting::get('sms_sender_id', null, $companyId);

                    if (!$smsUrl || !$smsToken) {
                        Log::info("Custom SMS API not configured for company {$companyId}, skipping PIN alert SMS.");
                        return;
                    }

                    $response = Http::withHeaders([
                        'Authorization' => 'Bearer ' . $smsToken,
                        'Content-Type'  => 'application/json',
                    ])->post($smsUrl, [
                        'to'      => $this->mobile,
                        'from'    => $smsSender,
                        'message' => $message,
                    ]);

                    if ($response->successful()) {
                        Log::info("PIN failure Custom SMS sent to user {$this->user->id} ({$this->mobile})");
                    } else {
                        Log::error("PIN failure Custom SMS failed for user {$this->user->id}: " . $response->body());
                    }
                    break;
            }
        } catch (\Throwable $e) {
            Log::error("PIN failure SMS exception for user {$this->user->id}: " . $e->getMessage());
        }
    }
}

