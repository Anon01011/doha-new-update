<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Setting;

class GrievanceSubmitted extends Notification implements ShouldQueue
{
    use Queueable;

    protected $grievance;
    protected $employeeName;

    /**
     * Create a new notification instance.
     */
    public function __construct($grievance, $employeeName)
    {
        $this->grievance = $grievance;
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
        if (Setting::get('email_notifications_enabled', '1') === '1' && !empty($notifiable->email)) {
            $channels[] = 'mail';
        }
        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Grievance Submitted')
            ->line("A new grievance has been submitted by {$this->employeeName}.")
            ->line("Subject: {$this->grievance->subject}")
            ->action('Review Grievance', route('grievances.show', $this->grievance->id))
            ->line('Please review and respond within the SLA period.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'grievance_id' => $this->grievance->id,
            'employee_name' => $this->employeeName,
            'message' => "A new grievance has been submitted by {$this->employeeName} regarding '{$this->grievance->subject}'.",
            'action_url' => route('grievances.show', $this->grievance->id),
            'type' => 'grievance_submitted'
        ];
    }
}
