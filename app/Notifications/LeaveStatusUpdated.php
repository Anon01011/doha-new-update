<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Setting;

class LeaveStatusUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    protected $leaveRequest;
    protected $status;
    protected $message;

    /**
     * Create a new notification instance.
     */
    public function __construct($leaveRequest, $status, $message = null)
    {
        $this->leaveRequest = $leaveRequest;
        $this->status = $status;
        $this->message = $message ?: "Your leave request from {$leaveRequest->start_date} to {$leaveRequest->end_date} has been " . $status . ".";
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if (Setting::get('email_notifications_enabled', '1') === '1') {
            $channels[] = 'mail';
        }
        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $statusLabel = ucfirst($this->status);

        return (new MailMessage)
            ->subject("Leave Request Update: {$statusLabel}")
            ->line($this->message)
            ->line("Status: {$statusLabel}")
            ->line("Days: {$this->leaveRequest->days_requested} day(s)")
            ->action('View Leave Request', route('leave-requests.show', $this->leaveRequest->id))
            ->line('Thank you for using our platform.');
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
            'status' => $this->status,
            'message' => $this->message,
            'action_url' => route('leave-requests.show', $this->leaveRequest->id),
            'type' => 'leave_status_updated'
        ];
    }
}
