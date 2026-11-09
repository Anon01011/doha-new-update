<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Setting;

class AdvanceDisbursedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $advance;

    public function __construct($advance)
    {
        $this->advance = $advance;
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
        $amount = number_format((float) $this->advance->amount, 2);
        return (new MailMessage)
            ->subject('Salary Advance Disbursed')
            ->line("Your requested salary advance of {$amount} has been successfully disbursed.")
            ->action('View Advance', route('advances.show', $this->advance->id))
            ->line('If you have any questions, please contact HR.');
    }

    public function toArray(object $notifiable): array
    {
        $amount = number_format($this->advance->amount, 2);
        return [
            'advance_id' => $this->advance->id,
            'title'      => 'Salary Advance Disbursed',
            'amount'     => $this->advance->amount,
            'message'    => "Your requested salary advance of {$amount} has been successfully disbursed.",
            'action_url' => route('advances.show', $this->advance->id),
            'type'       => 'advance_status_updated',
        ];
    }
}
