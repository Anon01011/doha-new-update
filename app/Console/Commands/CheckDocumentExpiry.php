<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\EmployeeDocument;
use Carbon\Carbon;

class CheckDocumentExpiry extends Command
{
    protected $signature = 'documents:check-expiry';
    protected $description = 'Check for expired and expiring documents';

    public function handle()
    {
        $this->info('Checking document expiry...');

        // Mark expired documents
        $expiredCount = EmployeeDocument::whereNotNull('expiry_date')
            ->where('is_expired', false)
            ->whereDate('expiry_date', '<', Carbon::now())
            ->update(['is_expired' => true]);

        $this->info("Marked {$expiredCount} documents as expired.");

        // Find expiring documents (within alert period)
        $expiringDocuments = EmployeeDocument::with(['employee', 'documentType'])
            ->whereNotNull('expiry_date')
            ->where('is_expired', false)
            ->get()
            ->filter(function ($document) {
                return $document->is_expiring_soon;
            });

        $this->info("Found {$expiringDocuments->count()} documents expiring soon.");

        // Send notifications for expiring documents
        $notificationsSent = 0;
        foreach ($expiringDocuments as $document) {
            $employee = $document->employee;

            if ($employee && $employee->user) {
                // Notify the employee
                $employee->user->notify(new \App\Notifications\DocumentExpiringNotification($document));
                $notificationsSent++;

                $this->info("Notification sent to {$employee->name} for {$document->documentType->name}");
            }

            // Also notify HR and Admin users
            $hrAdminUsers = \App\Models\User::whereIn('role', ['hr', 'admin'])->get();
            foreach ($hrAdminUsers as $hrUser) {
                $hrUser->notify(new \App\Notifications\DocumentExpiringNotification($document));
            }
        }

        $this->info("Sent {$notificationsSent} notifications for expiring documents.");
        $this->info('Document expiry check completed!');

        return 0;
    }
}
