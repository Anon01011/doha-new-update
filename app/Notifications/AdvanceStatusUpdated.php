<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Setting;

class AdvanceStatusUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    protected $advance;
    protected $status;

    /**
     * Create a new notification instance.
     */
    public function __construct($advance, $status)
    {
        $this->advance = $advance;
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
        $amount = number_format((float)$this->advance->amount, 2);
        $statusLabel = ucfirst($this->status);

        return (new MailMessage)
            ->subject("Salary Advance Status: {$statusLabel}")
            ->line("Your salary advance request for {$amount} has been {$this->status}.")
            ->line("Status: {$statusLabel}")
            ->action('View Advance Request', route('advances.show', $this->advance->id))
            ->line('Thank you for using our platform.');
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
            'status' => $this->status,
            'message' => "Your salary advance request for {$this->advance->amount} has been {$this->status}.",
            'action_url' => route('advances.show', $this->advance->id),
            'type' => 'advance_status_updated'
        ];
    }
}
