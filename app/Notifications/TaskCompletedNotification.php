<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\Employee;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

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
        $channels = ['database'];
        if (Setting::get('email_notifications_enabled', '1') === '1' && !empty($notifiable->email)) {
            $channels[] = 'mail';
        }
        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $name = $this->completedBy ? $this->completedBy->name : 'Staff';
        $mail = (new MailMessage)
            ->subject("Task Completed: {$this->task->title}")
            ->line("{$name} has marked the task \"{$this->task->title}\" as completed.")
            ->action('View Task', route('tasks.show', $this->task->id));
        if ($this->notes) {
            $mail->line("Completion Notes: {$this->notes}");
        }
        return $mail->line('Thank you for the update.');
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
