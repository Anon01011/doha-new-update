<?php

namespace App\Console\Commands;

use App\Models\Advance;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\LoanInstallment;
use App\Notifications\GenericHrNotification;
use App\Notifications\LoanStatusUpdated;
use App\Notifications\AdvanceStatusUpdated;
use App\Notifications\LeaveRequested;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendWorkflowReminders extends Command
{
    protected $signature   = 'reminders:send';
    protected $description = 'Send automated reminders: loan installments, advances, pending leaves, contract/probation/internship/document expiries';

    public function handle(): int
    {
        $today    = Carbon::today();
        $in3Days  = Carbon::today()->addDays(3);
        $in7Days  = Carbon::today()->addDays(7);
        $in14Days = Carbon::today()->addDays(14);
        $in30Days = Carbon::today()->addDays(30);

        $this->info("Starting scheduled workflow reminders for {$today->toDateString()}...");

        // ── 1. Loan Installments (due today or in 3 days) ────────────────────────
        $installments = LoanInstallment::with(['loan.employee'])
            ->whereIn('due_date', [$today->toDateString(), $in3Days->toDateString()])
            ->where('status', 'pending')
            ->get();

        $instCount = 0;
        foreach ($installments as $installment) {
            $loan = $installment->loan;
            if (!$loan?->employee_id) continue;
            try {
                NotificationService::notifyEmployee(
                    $loan->employee_id,
                    new LoanStatusUpdated($loan, 'pending')
                );
                $instCount++;
            } catch (\Throwable $e) {
                Log::error('Loan installment reminder failed: ' . $e->getMessage());
            }
        }
        $this->info("Processed {$instCount} upcoming loan installment reminders.");

        // ── 2. Advance Repayments (due today or in 3 days) ───────────────────────
        $advances = Advance::with('employee')
            ->where('status', 'approved')
            ->whereNull('repaid_at')
            ->whereIn('repayment_date', [$today->toDateString(), $in3Days->toDateString()])
            ->get();

        $advCount = 0;
        foreach ($advances as $advance) {
            try {
                NotificationService::notifyEmployee(
                    $advance->employee_id,
                    new AdvanceStatusUpdated($advance, 'approved')
                );
                $advCount++;
            } catch (\Throwable $e) {
                Log::error('Advance repayment reminder failed: ' . $e->getMessage());
            }
        }
        $this->info("Processed {$advCount} upcoming advance repayment reminders.");

        // ── 3. Stale Pending Leave Approvals (> 48 hours) ────────────────────────
        $staleLeaves = LeaveRequest::with(['employee'])
            ->where('status', 'pending')
            ->where('created_at', '<=', now()->subHours(48))
            ->get();

        $leaveCount = 0;
        foreach ($staleLeaves as $leave) {
            if (!$leave->employee) continue;
            try {
                NotificationService::notifyApprovers(
                    $leave->employee,
                    new LeaveRequested($leave, $leave->employee->name),
                    null,
                    'approve-leaves'
                );
                $leaveCount++;
            } catch (\Throwable $e) {
                Log::error('Leave approval reminder failed: ' . $e->getMessage());
            }
        }
        $this->info("Processed {$leaveCount} pending leave approval reminders.");

        // ── 4. Contract Expiry (7 / 14 / 30 days ahead) ─────────────────────────
        $contractWindows = [
            $in7Days->toDateString()  => '7 days',
            $in14Days->toDateString() => '14 days',
            $in30Days->toDateString() => '30 days',
        ];

        $contractCount = 0;
        foreach ($contractWindows as $date => $label) {
            Employee::whereNotNull('contract_expiry_date')
                ->whereDate('contract_expiry_date', $date)
                ->where('manual_status', '!=', 'inactive')
                ->get()
                ->each(function (Employee $employee) use ($date, $label, &$contractCount) {
                    try {
                        NotificationService::notifyHrAndAdmins(
                            new GenericHrNotification(
                                "Contract Expiring in {$label}",
                                "Employee {$employee->name} ({$employee->employee_code}) contract expires on {$date}. Please review and renew or initiate offboarding.",
                                route('employees.show', $employee->id),
                                'contract_expiry'
                            ),
                            $employee->company_id
                        );
                        $contractCount++;
                    } catch (\Throwable $e) {
                        Log::error('Contract expiry reminder failed: ' . $e->getMessage());
                    }
                });
        }
        $this->info("Processed {$contractCount} contract expiry reminders.");

        // ── 5. Probation End (7 days ahead, not yet confirmed) ───────────────────
        $probationCount = 0;
        Employee::whereNotNull('probation_end_date')
            ->whereDate('probation_end_date', $in7Days->toDateString())
            ->where('manual_status', '!=', 'inactive')
            ->whereNull('confirmation_date')
            ->get()
            ->each(function (Employee $employee) use (&$probationCount) {
                try {
                    NotificationService::notifyHrAndAdmins(
                        new GenericHrNotification(
                            'Probation Period Ending Soon',
                            "Employee {$employee->name} ({$employee->employee_code}) probation ends on {$employee->probation_end_date}. Please confirm employment or extend probation.",
                            route('employees.show', $employee->id),
                            'probation_ending'
                        ),
                        $employee->company_id
                    );
                    $probationCount++;
                } catch (\Throwable $e) {
                    Log::error('Probation ending reminder failed: ' . $e->getMessage());
                }
            });
        $this->info("Processed {$probationCount} probation ending reminders.");

        // ── 6. Internship End (7 days ahead) ─────────────────────────────────────
        $internCount = 0;
        Employee::whereNotNull('internship_end_date')
            ->whereDate('internship_end_date', $in7Days->toDateString())
            ->where('manual_status', '!=', 'inactive')
            ->get()
            ->each(function (Employee $employee) use (&$internCount) {
                try {
                    NotificationService::notifyHrAndAdmins(
                        new GenericHrNotification(
                            'Internship Period Ending Soon',
                            "Intern {$employee->name} ({$employee->employee_code}) internship ends on {$employee->internship_end_date}. Please confirm next steps.",
                            route('employees.show', $employee->id),
                            'internship_ending'
                        ),
                        $employee->company_id
                    );
                    $internCount++;
                } catch (\Throwable $e) {
                    Log::error('Internship ending reminder failed: ' . $e->getMessage());
                }
            });
        $this->info("Processed {$internCount} internship ending reminders.");

        // ── 7. Food Handler / Health Card Expiry (14 days) ───────────────────────
        $docCount = 0;
        Employee::where(function ($q) use ($in14Days) {
                $q->whereDate('food_handler_expiry_date', $in14Days->toDateString())
                  ->orWhereDate('health_card_expiry_date', $in14Days->toDateString());
            })
            ->where('manual_status', '!=', 'inactive')
            ->get()
            ->each(function (Employee $employee) use ($in14Days, &$docCount) {
                $items = [];
                if ($employee->food_handler_expiry_date &&
                    Carbon::parse($employee->food_handler_expiry_date)->toDateString() === $in14Days->toDateString()) {
                    $items[] = 'Food Handler Certificate';
                }
                if ($employee->health_card_expiry_date &&
                    Carbon::parse($employee->health_card_expiry_date)->toDateString() === $in14Days->toDateString()) {
                    $items[] = 'Health Card';
                }
                if (empty($items)) return;

                try {
                    NotificationService::notifyHrAndAdmins(
                        new GenericHrNotification(
                            'Document Expiring in 14 Days',
                            "Employee {$employee->name} ({$employee->employee_code}): " . implode(', ', $items) . " expiring on {$in14Days->toDateString()}. Please arrange renewal.",
                            route('employees.show', $employee->id),
                            'document_expiry'
                        ),
                        $employee->company_id
                    );
                    $docCount++;
                } catch (\Throwable $e) {
                    Log::error('Document expiry reminder failed: ' . $e->getMessage());
                }
            });
        $this->info("Processed {$docCount} document expiry reminders.");

        $this->info('Scheduled workflow reminders completed successfully.');
        return self::SUCCESS;
    }
}
