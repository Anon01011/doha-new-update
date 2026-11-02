<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Setting;

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
        $amount = number_format((float)($this->claim->total_amount ?? $this->claim->amount ?? 0), 2);

        return (new MailMessage)
            ->subject($this->title)
            ->line($this->message)
            ->line("Claim Number: " . ($this->claim->claim_number ?? 'N/A'))
            ->line("Amount: {$amount}")
            ->action('View Expense Claim', route('expenses.show', $this->claim))
            ->line('Thank you for using our platform.');
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
            'action_url' => route('expenses.show', $this->claim),
            'type'       => $this->type,
        ];
    }
}
