<?php

namespace App\Jobs;

use App\Models\Employee;
use App\Models\Company;
use App\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendWhatsAppRosterNotification implements ShouldQueue
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
            $waService = new WhatsAppService();
            $waService->sendRosterNotification($this->employee, $this->company, $this->employeeRoster, $this->dateRange);
        } catch (\Exception $e) {
            Log::error('SendWhatsAppRosterNotification job failed: ' . $e->getMessage());
            throw $e;
        }
    }
}
