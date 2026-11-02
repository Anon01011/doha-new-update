<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Setting;

class LoanRequested extends Notification implements ShouldQueue
{
    use Queueable;

    protected $loan;
    protected $employeeName;

    /**
     * Create a new notification instance.
     */
    public function __construct($loan, $employeeName)
    {
        $this->loan = $loan;
        $this->employeeName = $employeeName;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if (Setting::get('email_notifications_enabled', '1') === '1') {
            $channels[] = 'mail';
        }
        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $amount = number_format((float)$this->loan->amount, 2);
        return (new MailMessage)
            ->subject("New Loan Request: {$this->employeeName}")
            ->line("A new loan request has been submitted by {$this->employeeName}.")
            ->line("Loan Type: {$this->loan->loan_type}")
            ->line("Amount: {$amount}")
            ->line("Tenure: {$this->loan->tenure_months} months")
            ->action('View Loan Request', route('loans.show', $this->loan->id))
            ->line('Please review and take appropriate action.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'loan_id' => $this->loan->id,
            'employee_name' => $this->employeeName,
            'message' => "A new loan request for {$this->loan->amount} has been submitted by {$this->employeeName}.",
            'action_url' => route('loans.show', $this->loan->id),
            'type' => 'loan_requested'
        ];
    }
}
