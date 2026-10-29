<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TaskCommentNotification extends Notification
{
    use Queueable;

    public Task $task;
    public User $commenter;
    public string $commentSnippet;

    public function __construct(Task $task, User $commenter, string $comment)
    {
        $this->task = $task;
        $this->commenter = $commenter;
        $this->commentSnippet = mb_strimwidth($comment, 0, 80, '...');
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'task_id'     => $this->task->id,
            'task_title'  => $this->task->title,
            'author_id'   => $this->commenter->id,
            'author_name' => $this->commenter->name,
            'message'     => "{$this->commenter->name} commented on task '{$this->task->title}': \"{$this->commentSnippet}\"",
            'action_url'  => route('tasks.show', $this->task->id),
            'type'        => 'task_comment',
        ];
    }
}
