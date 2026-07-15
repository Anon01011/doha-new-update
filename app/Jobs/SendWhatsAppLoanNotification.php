<?php

namespace App\Jobs;

use App\Models\Employee;
use App\Models\Company;
use App\Models\Loan;
use App\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendWhatsAppLoanNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $employee;
    protected $company;
    protected $loan;
    protected $type;
    protected $installmentAmount;

    /**
     * Create a new job instance.
     */
    public function __construct(Employee $employee, Company $company, Loan $loan, string $type, float $installmentAmount = 0)
    {
        $this->employee = $employee;
        $this->company = $company;
        $this->loan = $loan;
        $this->type = $type;
        $this->installmentAmount = $installmentAmount;
    }

    /**
     * Execute the job.
     */
    public function handle()
    {
        try {
            $waService = new WhatsAppService();
            $waService->sendLoanNotification($this->employee, $this->company, $this->loan, $this->type, $this->installmentAmount);
        } catch (\Exception $e) {
            Log::error('SendWhatsAppLoanNotification job failed: ' . $e->getMessage());
            throw $e;
        }
    }
}
