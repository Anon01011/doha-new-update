<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class AttendanceEventNotification extends Notification
{
    use Queueable;

    protected string $eventTitle;
    protected string $message;
    protected ?string $date;
    protected string $eventType;
    protected ?string $actionUrl;

    public function __construct(
        string $eventTitle,
        string $message,
        ?string $date = null,
        string $eventType = 'attendance_event',
        ?string $actionUrl = null
    ) {
        $this->eventTitle = $eventTitle;
        $this->message    = $message;
        $this->date       = $date ?: now()->toDateString();
        $this->eventType  = $eventType;
        $this->actionUrl  = $actionUrl;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $defaultUrl = route('employee-attendances.index', ['date' => $this->date]);
        if (method_exists($notifiable, 'isAdmin') && !$notifiable->isAdmin() && !in_array($notifiable->role ?? '', ['admin', 'hr', 'manager'])) {
            $defaultUrl = route('employee.dashboard');
        }

        return [
            'title'      => $this->eventTitle,
            'message'    => $this->message,
            'date'       => $this->date,
            'action_url' => $this->actionUrl ?: $defaultUrl,
            'type'       => $this->eventType,
        ];
    }
}

