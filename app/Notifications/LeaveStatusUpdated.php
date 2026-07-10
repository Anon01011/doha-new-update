<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class LeaveStatusUpdated extends Notification
{
    use Queueable;

    protected $leaveRequest;
    protected $status;
    protected $message;

    /**
     * Create a new notification instance.
     */
    public function __construct($leaveRequest, $status, $message = null)
    {
        $this->leaveRequest = $leaveRequest;
        $this->status = $status;
        $this->message = $message ?: "Your leave request from {$leaveRequest->start_date} to {$leaveRequest->end_date} has been " . $status . ".";
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
            'leave_request_id' => $this->leaveRequest->id,
            'status' => $this->status,
            'message' => $this->message,
            'action_url' => route('leave-requests.show', $this->leaveRequest->id),
            'type' => 'leave_status_updated'
        ];
    }
}
