<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ExpenseClaimNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $claim;
    protected $title;
    protected $message;
    protected $type;

    /**
     * Create a new notification instance.
     */
    public function __construct($claim, string $title, string $message, string $type = 'expense_claim_updated')
    {
        $this->claim   = $claim;
        $this->title   = $title;
        $this->message = $message;
        $this->type    = $type;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'claim_id'   => $this->claim->id,
            'title'      => $this->title,
            'message'    => $this->message,
            'action_url' => route('expenses.show', $this->claim->id),
            'type'       => $this->type,
        ];
    }
}
