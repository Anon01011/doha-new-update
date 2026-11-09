<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Setting;

class WarningLetterIssued extends Notification implements ShouldQueue
{
    use Queueable;

    protected $warningLetter;

    /**
     * Create a new notification instance.
     */
    public function __construct($warningLetter)
    {
        $this->warningLetter = $warningLetter;
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
        $typeLabel = ucwords(str_replace('_', ' ', $this->warningLetter->type));
        return (new MailMessage)
            ->subject("Warning Letter Issued: {$typeLabel}")
            ->line("A formal warning letter has been issued to you.")
            ->line("Type: {$typeLabel}")
            ->line("Subject: {$this->warningLetter->subject}")
            ->action('View Warning Letter', route('warning-letters.show', $this->warningLetter->id))
            ->line('Please acknowledge receipt and take necessary corrective action.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'warning_letter_id' => $this->warningLetter->id,
            'warning_type' => $this->warningLetter->type,
            'message' => "A formal warning letter ({$this->warningLetter->type}) has been issued to you: {$this->warningLetter->subject}",
            'action_url' => route('warning-letters.show', $this->warningLetter->id),
            'type' => 'warning_letter_issued'
        ];
    }
}
