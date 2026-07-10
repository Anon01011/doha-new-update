<?php

namespace App\Notifications;

use App\Models\EmployeeDocument;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DocumentExpiringNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $document;

    /**
     * Create a new notification instance.
     */
    public function __construct(EmployeeDocument $document)
    {
        $this->document = $document;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        $employee = $this->document->employee;
        $documentType = $this->document->documentType;
        $expiryDate = $this->document->expiry_date;
        $daysUntilExpiry = now()->diffInDays($expiryDate, false);

        return (new MailMessage)
            ->subject('Document Expiring Soon: ' . $documentType->name)
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('This is a reminder that a document is expiring soon.')
            ->line('**Employee:** ' . $employee->name . ' (' . $employee->employee_code . ')')
            ->line('**Document Type:** ' . $documentType->name)
            ->line('**Expiry Date:** ' . $expiryDate->format('d M Y'))
            ->line('**Days Until Expiry:** ' . abs($daysUntilExpiry) . ' days')
            ->action('View Employee Documents', url('/employees/' . $employee->id . '/documents'))
            ->line('Please ensure this document is renewed before it expires.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        $employee = $this->document->employee;
        $documentType = $this->document->documentType;

        return [
            'document_id' => $this->document->id,
            'employee_id' => $employee->id,
            'employee_name' => $employee->name,
            'employee_code' => $employee->employee_code,
            'document_type' => $documentType->name,
            'expiry_date' => $this->document->expiry_date->format('Y-m-d'),
            'days_until_expiry' => now()->diffInDays($this->document->expiry_date, false),
        ];
    }
}
