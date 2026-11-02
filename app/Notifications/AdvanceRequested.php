<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Setting;

class AdvanceRequested extends Notification implements ShouldQueue
{
    use Queueable;

    protected $advance;
    protected $employeeName;

    /**
     * Create a new notification instance.
     */
    public function __construct($advance, $employeeName)
    {
        $this->advance = $advance;
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
        $amount = number_format((float)$this->advance->amount, 2);

        return (new MailMessage)
            ->subject("New Salary Advance Request: {$this->employeeName}")
            ->line("A new salary advance request has been submitted by {$this->employeeName}.")
            ->line("Amount: {$amount}")
            ->line("Reason: " . ($this->advance->reason ?: 'N/A'))
            ->action('Review Advance Request', route('advances.show', $this->advance->id))
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
            'advance_id' => $this->advance->id,
            'employee_name' => $this->employeeName,
            'message' => "A new salary advance request for {$this->advance->amount} has been submitted by {$this->employeeName}.",
            'action_url' => route('advances.show', $this->advance->id),
            'type' => 'advance_requested'
        ];
    }
}
