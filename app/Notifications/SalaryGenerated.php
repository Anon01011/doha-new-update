<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SalaryGenerated extends Notification implements ShouldQueue
{
    use Queueable;

    protected $salaryPosting;

    /**
     * Create a new notification instance.
     */
    public function __construct($salaryPosting)
    {
        $this->salaryPosting = $salaryPosting;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if (\App\Models\Setting::get('email_notifications_enabled', '1') === '1' && !empty($notifiable->email)) {
            $channels[] = 'mail';
        }
        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $monthName = date('F', mktime(0, 0, 0, $this->salaryPosting->month, 10));
        $year = $this->salaryPosting->year;
        $netSalary = number_format((float) $this->salaryPosting->net_salary, 2);
        return (new MailMessage)
            ->subject("Payslip Ready — {$monthName} {$year}")
            ->line("Your payslip for {$monthName} {$year} has been generated and approved.")
            ->line("Net Salary: {$netSalary}")
            ->action('View Payslip', route('salary-postings.show', $this->salaryPosting->id))
            ->line('Thank you. Please contact HR for any discrepancies.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $monthName = date('F', mktime(0, 0, 0, $this->salaryPosting->month, 10));
        return [
            'salary_posting_id' => $this->salaryPosting->id,
            'month' => $this->salaryPosting->month,
            'year' => $this->salaryPosting->year,
            'net_salary' => $this->salaryPosting->net_salary,
            'message' => "Your payslip for {$monthName} {$this->salaryPosting->year} has been generated and approved.",
            'action_url' => route('salary-postings.show', $this->salaryPosting->id),
            'type' => 'salary_generated'
        ];
    }
}
