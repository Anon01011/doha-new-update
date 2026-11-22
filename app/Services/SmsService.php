<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    /**
     * Send an SMS message using the configured provider (Twilio, Vonage/Nexmo, InfoBip, or Custom HTTP API).
     */
    public static function send(string $mobile, string $message, ?int $companyId = null, string $context = 'SMS'): bool
    {
        $cleanMobile = preg_replace('/[^\d+]/', '', trim($mobile));
        if (empty($cleanMobile)) {
            Log::warning("[{$context}] Cannot send SMS: Mobile number is empty or invalid.");
            return false;
        }

        $smsProvider = Setting::get('sms_provider', 'custom', $companyId);

        try {
            switch ($smsProvider) {
                case 'twilio':
                    $sid   = Setting::get('twilio_sid', null, $companyId);
                    $token = Setting::get('twilio_token', null, $companyId);
                    $from  = Setting::get('twilio_sms_from', Setting::get('twilio_from', null, $companyId), $companyId);

                    if (!$sid || !$token || !$from) {
                        Log::warning("[{$context}] Twilio SMS credentials incomplete for company {$companyId}");
                        return false;
                    }

                    $response = Http::withBasicAuth($sid, $token)
                        ->asForm()
                        ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                            'From' => $from,
                            'To'   => $cleanMobile,
                            'Body' => $message,
                        ]);

                    if ($response->successful()) {
                        Log::info("[{$context}] Twilio SMS sent to {$cleanMobile}");
                        return true;
                    }

                    Log::error("[{$context}] Twilio SMS failed for {$cleanMobile}: " . $response->body());
                    return false;

                case 'vonage':
                    $apiKey    = Setting::get('vonage_api_key', null, $companyId);
                    $apiSecret = Setting::get('vonage_api_secret', null, $companyId);
                    $from      = Setting::get('vonage_from', 'HRMS', $companyId);

                    if (!$apiKey || !$apiSecret) {
                        Log::warning("[{$context}] Vonage SMS credentials incomplete for company {$companyId}");
                        return false;
                    }

                    $response = Http::post('https://rest.nexmo.com/sms/json', [
                        'api_key'    => $apiKey,
                        'api_secret' => $apiSecret,
                        'to'         => $cleanMobile,
                        'from'       => $from,
                        'text'       => $message,
                    ]);

                    if ($response->successful()) {
                        Log::info("[{$context}] Vonage SMS sent to {$cleanMobile}");
                        return true;
                    }

                    Log::error("[{$context}] Vonage SMS failed for {$cleanMobile}: " . $response->body());
                    return false;

                case 'infobip':
                    $baseUrl = Setting::get('infobip_base_url', null, $companyId);
                    $apiKey  = Setting::get('infobip_api_key', null, $companyId);
                    $from    = Setting::get('infobip_sms_from', 'HRMS', $companyId);

                    if (!$baseUrl || !$apiKey) {
                        Log::warning("[{$context}] InfoBip SMS credentials incomplete for company {$companyId}");
                        return false;
                    }

                    $url = rtrim($baseUrl, '/') . '/sms/2/text/advanced';
                    $response = Http::withHeaders([
                        'Authorization' => 'App ' . $apiKey,
                        'Content-Type'  => 'application/json',
                    ])->post($url, [
                        'messages' => [
                            [
                                'from'         => $from,
                                'destinations' => [['to' => $cleanMobile]],
                                'text'         => $message,
                            ],
                        ],
                    ]);

                    if ($response->successful()) {
                        Log::info("[{$context}] InfoBip SMS sent to {$cleanMobile}");
                        return true;
                    }

                    Log::error("[{$context}] InfoBip SMS failed for {$cleanMobile}: " . $response->body());
                    return false;

                default: // Custom HTTP API
                    $smsUrl    = Setting::get('sms_api_url', null, $companyId);
                    $smsToken  = Setting::get('sms_api_token', null, $companyId);
                    $smsSender = Setting::get('sms_sender_id', null, $companyId);

                    if (!$smsUrl || !$smsToken) {
                        Log::info("[{$context}] Custom SMS API not configured for company {$companyId}, skipping.");
                        return false;
                    }

                    $response = Http::withHeaders([
                        'Authorization' => 'Bearer ' . $smsToken,
                        'Content-Type'  => 'application/json',
                    ])->post($smsUrl, [
                        'to'      => $cleanMobile,
                        'from'    => $smsSender,
                        'message' => $message,
                    ]);

                    if ($response->successful()) {
                        Log::info("[{$context}] Custom SMS sent to {$cleanMobile}");
                        return true;
                    }

                    Log::error("[{$context}] Custom SMS failed for {$cleanMobile}: " . $response->body());
                    return false;
            }
        } catch (\Exception $e) {
            Log::error("[{$context}] SMS dispatch exception for {$cleanMobile}: " . $e->getMessage());
            return false;
        }
    }
}
