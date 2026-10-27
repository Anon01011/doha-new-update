<?php

namespace App\Notifications;

use App\Models\EmployeeEvaluation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppraisalInitiatedNotification extends Notification
{
    use Queueable;

    public EmployeeEvaluation $evaluation;

    public function __construct(EmployeeEvaluation $evaluation)
    {
        $this->evaluation = $evaluation;
    }

    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if (!empty($notifiable->email)) {
            $channels[] = 'mail';
        }
        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $monthName = date('F', mktime(0, 0, 0, (int)$this->evaluation->month, 10));
        return (new MailMessage)
            ->subject("Performance Appraisal Initiated - {$monthName} {$this->evaluation->year}")
            ->greeting("Hello {$notifiable->name},")
            ->line("A new performance appraisal cycle ({$this->evaluation->cycle_type}) for {$monthName} {$this->evaluation->year} has been initiated for you.")
            ->line("Please log in to your dashboard to review the evaluation criteria and submit your self-assessment.")
            ->action('Complete Self-Assessment', route('evaluations.show', $this->evaluation->id))
            ->line('Thank you for your continuous dedication and contributions!');
    }

    public function toArray(object $notifiable): array
    {
        $monthName = date('F', mktime(0, 0, 0, (int)$this->evaluation->month, 10));
        return [
            'evaluation_id' => $this->evaluation->id,
            'month'         => $this->evaluation->month,
            'year'          => $this->evaluation->year,
            'cycle_type'    => $this->evaluation->cycle_type,
            'message'       => "Performance appraisal cycle for {$monthName} {$this->evaluation->year} has been initiated. Please submit your self-assessment.",
            'action_url'    => route('evaluations.show', $this->evaluation->id),
            'type'          => 'appraisal_initiated',
        ];
    }
}
