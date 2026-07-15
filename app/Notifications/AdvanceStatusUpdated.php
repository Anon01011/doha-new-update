<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

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
            'status' => $this->status,
            'message' => "Your salary advance request for {$this->advance->amount} has been {$this->status}.",
            'action_url' => route('advances.show', $this->advance->id),
            'type' => 'advance_status_updated'
        ];
    }
}
