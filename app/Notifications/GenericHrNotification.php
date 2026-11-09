<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Setting;

/**
 * Generic reusable notification for HR/Admin operational alerts.
 * Used for: contract expiry, probation end, internship end, document alerts, etc.
 */
class GenericHrNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected string $title;
    protected string $message;
    protected string $actionUrl;
    protected string $type;

    public function __construct(string $title, string $message, string $actionUrl = '#', string $type = 'hr_alert')
    {
        $this->title     = $title;
        $this->message   = $message;
        $this->actionUrl = $actionUrl;
        $this->type      = $type;
    }

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
            ->subject($this->title)
            ->line($this->message)
            ->action('View Details', $this->actionUrl !== '#' ? $this->actionUrl : url('/'))
            ->line('This is an automated HR system alert.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title'      => $this->title,
            'message'    => $this->message,
            'action_url' => $this->actionUrl,
            'type'       => $this->type,
        ];
    }
}
