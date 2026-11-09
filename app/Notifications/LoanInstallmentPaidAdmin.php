<?php

namespace App\Notifications;

use App\Models\Loan;
use App\Models\Employee;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class LoanInstallmentPaidAdmin extends Notification implements ShouldQueue
{
    use Queueable;

    protected Loan $loan;
    protected Employee $employee;
    protected float $installmentAmount;
    protected int $installmentNumber;

    /**
     * Create a new notification instance.
     */
    public function __construct(Loan $loan, Employee $employee, float $installmentAmount, int $installmentNumber)
    {
        $this->loan              = $loan;
        $this->employee          = $employee;
        $this->installmentAmount = $installmentAmount;
        $this->installmentNumber = $installmentNumber;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if (Setting::get('email_notifications_enabled', '1') === '1' && !empty($notifiable->email)) {
            $channels[] = 'mail';
        }
        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $amount = number_format($this->installmentAmount, 2);
        return (new MailMessage)
            ->subject("Loan Installment #{$this->installmentNumber} Paid — {$this->employee->name}")
            ->line("Installment #{$this->installmentNumber} of {$amount} has been paid by {$this->employee->name}.")
            ->line("Loan Type: {$this->loan->loan_type}")
            ->action('View Loan', route('loans.show', $this->loan->id))
            ->line('This is an automated notification for your records.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $remainingInstallments = $this->loan->installments()
            ->where('status', '!=', 'paid')
            ->count();

        return [
            'type'                  => 'loan_installment_paid',
            'loan_id'               => $this->loan->id,
            'employee_id'           => $this->employee->id,
            'employee_name'         => $this->employee->name,
            'loan_type'             => $this->loan->loan_type,
            'installment_amount'    => $this->installmentAmount,
            'installment_number'    => $this->installmentNumber,
            'remaining_installments'=> $remainingInstallments,
            'loan_status'           => $this->loan->status,
            'message'               => "Loan installment #{$this->installmentNumber} of " . number_format($this->installmentAmount, 2) . " paid by {$this->employee->name}.",
            'action_url'            => route('loans.show', $this->loan->id),
        ];
    }
}
