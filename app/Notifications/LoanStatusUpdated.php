<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Setting;

class LoanStatusUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    protected $loan;
    protected $status;

    /**
     * Create a new notification instance.
     */
    public function __construct($loan, $status)
    {
        $this->loan   = $loan;
        $this->status = $status;
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
        $statusLabel = ucfirst(str_replace('_', ' ', $this->status));

        $messages = [
            'pending'          => "Your loan request for {$amount} has been submitted and is pending review.",
            'approved'         => "Great news! Your loan request of {$amount} has been approved.",
            'disbursed'        => "Your loan of {$amount} has been disbursed. Repayments will begin as scheduled.",
            'rejected'         => "Your loan request for {$amount} has been rejected. Please contact HR for details.",
            'completed'        => "Congratulations! Your loan of {$amount} has been fully repaid.",
            'installment_paid' => "Your loan installment has been successfully marked as paid.",
        ];

        $detailMessage = $messages[$this->status] ?? "Your loan status has been updated to {$statusLabel}.";

        return (new MailMessage)
            ->subject("Loan Status Update: {$statusLabel}")
            ->line($detailMessage)
            ->line("Loan Type: {$this->loan->loan_type}")
            ->line("Amount: {$amount}")
            ->line("Status: {$statusLabel}")
            ->action('View Loan Details', route('loans.show', $this->loan->id))
            ->line('Thank you for using our platform.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $amount = number_format($this->loan->amount, 2);

        $messages = [
            'pending'           => "Your loan request for {$amount} has been submitted and is pending review.",
            'approved'          => "Great news! Your loan of {$amount} has been approved.",
            'disbursed'         => "Your loan of {$amount} has been disbursed. Repayments will begin as scheduled.",
            'rejected'          => "Your loan request for {$amount} has been rejected. Please contact HR for details.",
            'completed'         => "Congratulations! Your loan of {$amount} has been fully repaid.",
            'installment_paid'  => "Your loan installment has been successfully marked as paid. Check your loan details for the updated schedule.",
        ];

        return [
            'loan_id'    => $this->loan->id,
            'loan_type'  => $this->loan->loan_type,
            'amount'     => $this->loan->amount,
            'status'     => $this->status,
            'message'    => $messages[$this->status] ?? "Your loan status has been updated to {$this->status}.",
            'action_url' => route('loans.show', $this->loan->id),
            'type'       => 'loan_status_updated',
        ];
    }
}
