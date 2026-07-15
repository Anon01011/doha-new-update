<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class GrievanceSubmitted extends Notification implements ShouldQueue
{
    use Queueable;

    protected $grievance;
    protected $employeeName;

    /**
     * Create a new notification instance.
     */
    public function __construct($grievance, $employeeName)
    {
        $this->grievance = $grievance;
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
            'grievance_id' => $this->grievance->id,
            'employee_name' => $this->employeeName,
            'message' => "A new grievance has been submitted by {$this->employeeName} regarding '{$this->grievance->subject}'.",
            'action_url' => route('grievances.show', $this->grievance->id),
            'type' => 'grievance_submitted'
        ];
    }
}
