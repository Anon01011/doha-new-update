<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Setting;

class GrievanceStatusUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    protected $grievance;
    protected $status;
    protected $message;

    /**
     * Create a new notification instance.
     */
    public function __construct($grievance, $status, $message = null)
    {
        $this->grievance = $grievance;
        $this->status = $status;
        $this->message = $message ?: "Your grievance regarding '{$grievance->subject}' has been " . str_replace('_', ' ', $status) . ".";
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
        $statusLabel = ucwords(str_replace('_', ' ', $this->status));
        return (new MailMessage)
            ->subject("Grievance Update: {$statusLabel}")
            ->line("Your grievance regarding \"{$this->grievance->subject}\" has been updated.")
            ->line("New Status: {$statusLabel}")
            ->when($this->message, fn($m) => $m->line($this->message))
            ->action('View Grievance', route('grievances.show', $this->grievance->id))
            ->line('If you need further assistance, please contact HR.');
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
            'status' => $this->status,
            'message' => $this->message,
            'action_url' => route('grievances.show', $this->grievance->id),
            'type' => 'grievance_status_updated'
        ];
    }
}
