<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class GrievanceStatusUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    protected $grievance;
    protected $status;
    protected $message;

    /**
     * Create a new notification instance.
     */
    public function __construct($grievance, $status, $message = null)
    {
        $this->grievance = $grievance;
        $this->status = $status;
        $this->message = $message ?: "Your grievance regarding '{$grievance->subject}' has been " . str_replace('_', ' ', $status) . ".";
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
            'grievance_id' => $this->grievance->id,
            'status' => $this->status,
            'message' => $this->message,
            'action_url' => route('grievances.show', $this->grievance->id),
            'type' => 'grievance_status_updated'
        ];
    }
}
