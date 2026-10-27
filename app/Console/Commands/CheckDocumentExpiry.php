<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\EmployeeDocument;
use App\Models\Setting;
use App\Services\NotificationService;
use App\Notifications\DocumentExpiringNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class CheckDocumentExpiry extends Command
{
    protected $signature = 'documents:check-expiry';
    protected $description = 'Check for expired and expiring employee documents using company-configured alert thresholds';

    public function handle()
    {
        $this->info('Starting document expiry check...');

        $now = Carbon::now();

        // ── 1. Mark expired documents ─────────────────────────────────────────
        $expiredDocs = EmployeeDocument::with('employee')
            ->whereNotNull('expiry_date')
            ->where('is_expired', false)
            ->whereDate('expiry_date', '<', $now->toDateString())
            ->get();

        $expiredCount = 0;
        foreach ($expiredDocs as $doc) {
            $doc->update(['is_expired' => true]);
            $expiredCount++;

            // Auto-archive if enabled in Document Settings
            $companyId = $doc->employee->company_id ?? $doc->company_id;
            $autoArchive = (bool) Setting::get('auto_archive_expired', false, $companyId);
            if ($autoArchive && Schema::hasColumn('employee_documents', 'status')) {
                $doc->update(['status' => 'archived']);
            }
        }
        $this->info("Marked {$expiredCount} documents as expired.");

        // ── 2. Scan expiring documents ─────────────────────────────────────────
        $documents = EmployeeDocument::with(['employee.company', 'employee.user', 'documentType'])
            ->whereNotNull('expiry_date')
            ->where('is_expired', false)
            ->whereDate('expiry_date', '>=', $now->toDateString())
            ->get();

        $notificationsSent = 0;

        foreach ($documents as $document) {
            $employee = $document->employee;
            if (!$employee || $employee->manual_status === 'inactive') {
                continue;
            }

            $companyId = $employee->company_id ?? $document->company_id;

            // Retrieve company/module alert days from Document Settings
            $firstAlertDays = (int) ($document->documentType->alert_days_before_expiry ?? Setting::get('expiry_notification_days', 30, $companyId));
            $secondAlertDays = (int) Setting::get('second_reminder_days', 7, $companyId);

            $daysUntilExpiry = (int) $now->diffInDays(Carbon::parse($document->expiry_date), false);

            // Trigger notification only at configured milestones (e.g. 30 days, 7 days, or 0 days)
            $isMilestone = ($daysUntilExpiry === $firstAlertDays) ||
                           ($daysUntilExpiry === $secondAlertDays) ||
                           ($daysUntilExpiry === 0);

            // Deduplication safety check: don't notify if already notified today for this document
            $alreadyNotifiedToday = false;
            if ($employee->user) {
                $alreadyNotifiedToday = $employee->user->notifications()
                    ->where('type', DocumentExpiringNotification::class)
                    ->where('created_at', '>=', $now->copy()->startOfDay())
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '$.document_id')) = ?", [(string) $document->id])
                    ->exists();
            }

            if ($isMilestone && !$alreadyNotifiedToday) {
                try {
                    $notification = new DocumentExpiringNotification($document);

                    // Notify employee directly if portal user exists
                    if ($employee->user) {
                        $employee->user->notify($notification);
                        $notificationsSent++;
                    }

                    // Multi-tenant safe: notify only HR & Admins of this employee's company
                    NotificationService::notifyHrAndAdmins($notification, $companyId);
                    $this->info("Expiry alert sent for [{$document->document_name}] of {$employee->name} (Expires in {$daysUntilExpiry} days)");
                } catch (\Throwable $e) {
                    Log::error("Failed to send document expiry notification for doc {$document->id}: " . $e->getMessage());
                }
            }
        }

        $this->info("Document expiry check completed! Sent {$notificationsSent} notifications.");
        return self::SUCCESS;
    }
}
