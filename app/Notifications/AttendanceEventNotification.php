<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class AttendanceEventNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $eventTitle;
    protected $message;
    protected $date;
    protected $eventType;

    public function __construct(string $eventTitle, string $message, ?string $date = null, string $eventType = 'attendance_updated')
    {
        $this->eventTitle = $eventTitle;
        $this->message    = $message;
        $this->date       = $date ?: now()->toDateString();
        $this->eventType  = $eventType;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title'      => $this->eventTitle,
            'message'    => $this->message,
            'date'       => $this->date,
            'action_url' => route('employee.dashboard'),
            'type'       => $this->eventType,
        ];
    }
}
