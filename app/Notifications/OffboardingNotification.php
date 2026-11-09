<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Setting;

class OffboardingNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $offboarding;
    protected $title;
    protected $message;
    protected $type;

    public function __construct($offboarding, string $title, string $message, string $type = 'offboarding_status_updated')
    {
        $this->offboarding = $offboarding;
        $this->title       = $title;
        $this->message     = $message;
        $this->type        = $type;
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
            ->action('View Offboarding', route('offboarding.index'))
            ->line('Please complete all required offboarding steps.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'offboarding_id' => $this->offboarding->id,
            'title'          => $this->title,
            'message'        => $this->message,
            'action_url'     => route('offboarding.index'),
            'type'           => $this->type,
        ];
    }
}
