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
        return ['database'];
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
