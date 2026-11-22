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

            \App\Services\SmsService::send($mobile, $smsMessage, $companyId, "Roster SMS {$this->employee->name}");
        } catch (\Exception $e) {
            Log::error('SendRosterSmsNotification exception: ' . $e->getMessage());
        }
    }
}
