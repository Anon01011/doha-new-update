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

            \App\Services\SmsService::send($this->mobile, $message, $companyId, "PIN Alert User #{$this->user->id}");
        } catch (\Throwable $e) {
            Log::error("PIN failure SMS exception for user {$this->user->id}: " . $e->getMessage());
        }
    }
}

