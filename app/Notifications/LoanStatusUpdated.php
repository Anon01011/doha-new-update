<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class LoanStatusUpdated extends Notification
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
        return ['database'];
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
