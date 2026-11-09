<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Setting;

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
        $channels = ['database'];
        if (Setting::get('email_notifications_enabled', '1') === '1' && !empty($notifiable->email)) {
            $channels[] = 'mail';
        }
        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $roleLabel = ucfirst($this->role);
        return (new MailMessage)
            ->subject("Project Assigned: {$this->project->name}")
            ->line("You have been assigned to the project \"{$this->project->name}\" as {$roleLabel}.")
            ->action('View Project', route('projects.show', $this->project->id))
            ->line('Please review the project details and get started.');
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
