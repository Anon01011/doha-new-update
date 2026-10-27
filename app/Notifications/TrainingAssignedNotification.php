<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

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
        return ['database'];
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
