<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Setting;

class TrainingAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $training;

    /**
     * Create a new notification instance.
     */
    public function __construct($training)
    {
        $this->training = $training;
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
            ->subject("Training Assigned: {$this->training->title}")
            ->line("You have been assigned to a new training program.")
            ->line("Training: {$this->training->title}")
            ->when($this->training->description ?? null, fn($m) => $m->line($this->training->description))
            ->action('View Training', route('training-assignments.index', ['training_id' => $this->training->id]))
            ->line('Please complete the training within the designated timeframe.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'training_id'    => $this->training->id,
            'training_title' => $this->training->title,
            'message'        => "You have been assigned to training: {$this->training->title}",
            'action_url'     => route('training-assignments.index', ['training_id' => $this->training->id]),
            'type'           => 'training_assigned',
        ];
    }
}
