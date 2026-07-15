<?php

namespace App\Jobs;

use App\Models\Employee;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendLoanSmsNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $employee;
    protected $companyId;
    protected $mobile;
    protected $message;
    protected $type;

    /**
     * Create a new job instance.
     */
    public function __construct(Employee $employee, $companyId, string $mobile, string $message, string $type)
    {
        $this->employee = $employee;
        $this->companyId = $companyId;
        $this->mobile = $mobile;
        $this->message = $message;
        $this->type = $type;
    }

    /**
     * Execute the job.
     */
    public function handle()
    {
        $smsUrl    = Setting::get('sms_api_url', null, $this->companyId);
        $smsToken  = Setting::get('sms_api_token', null, $this->companyId);
        $smsSender = Setting::get('sms_sender_id', null, $this->companyId);

        if (!$smsUrl || !$smsToken) {
            Log::info('Loan SMS not configured, skipping.', ['employee' => $this->employee->name, 'type' => $this->type]);
            return;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $smsToken,
                'Content-Type'  => 'application/json',
            ])->post($smsUrl, [
                'to'      => $this->mobile,
                'from'    => $smsSender,
                'message' => $this->message,
            ]);

            if ($response->successful()) {
                Log::info("Loan SMS sent to {$this->employee->name} ({$this->type})");
            } else {
                Log::error("Loan SMS failed for {$this->employee->name}: " . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('Loan SMS exception: ' . $e->getMessage());
            throw $e;
        }
    }
}
