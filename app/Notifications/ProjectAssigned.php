<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectAssigned extends Notification implements ShouldQueue
{
    use Queueable;

    protected $project;
    protected $role;

    /**
     * Create a new notification instance.
     */
    public function __construct($project, $role = 'member')
    {
        $this->project = $project;
        $this->role = $role;
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
            'project_id' => $this->project->id,
            'name' => $this->project->name,
            'role' => $this->role,
            'message' => "You have been assigned to project: {$this->project->name} as " . ucfirst($this->role),
            'action_url' => route('projects.show', $this->project->id),
            'type' => 'project_assignment'
        ];
    }
}
