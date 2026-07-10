<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AdvanceRequested extends Notification
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
            'advance_id' => $this->advance->id,
            'employee_name' => $this->employeeName,
            'message' => "A new salary advance request for {$this->advance->amount} has been submitted by {$this->employeeName}.",
            'action_url' => route('advances.show', $this->advance->id),
            'type' => 'advance_requested'
        ];
    }
}
