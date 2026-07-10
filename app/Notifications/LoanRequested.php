<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class LoanRequested extends Notification
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
        return ['database'];
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
