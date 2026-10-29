<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\Employee;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TaskCompletedNotification extends Notification
{
    use Queueable;

    public Task $task;
    public ?Employee $completedBy;
    public ?string $notes;

    public function __construct(Task $task, ?Employee $completedBy = null, ?string $notes = null)
    {
        $this->task = $task;
        $this->completedBy = $completedBy;
        $this->notes = $notes;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $name = $this->completedBy ? $this->completedBy->name : 'Staff';
        return [
            'task_id'      => $this->task->id,
            'task_title'   => $this->task->title,
            'title'        => 'Task Completed',
            'message'      => "{$name} marked task '{$this->task->title}' as completed.",
            'action_url'   => route('tasks.show', $this->task->id),
            'type'         => 'task_completed',
            'completed_by' => $name,
            'company_id'   => $this->task->company_id,
            'notes'        => $this->notes,
        ];
    }
}
