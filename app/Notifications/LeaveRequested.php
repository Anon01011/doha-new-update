<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class LeaveRequested extends Notification
{
    use Queueable;

    protected $leaveRequest;
    protected $employeeName;

    /**
     * Create a new notification instance.
     */
    public function __construct($leaveRequest, $employeeName)
    {
        $this->leaveRequest = $leaveRequest;
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
            'leave_request_id' => $this->leaveRequest->id,
            'employee_name' => $this->employeeName,
            'message' => "{$this->employeeName} has submitted a new leave request for {$this->leaveRequest->days_requested} days.",
            'action_url' => route('leave-requests.show', $this->leaveRequest->id),
            'type' => 'leave_requested'
        ];
    }
}
