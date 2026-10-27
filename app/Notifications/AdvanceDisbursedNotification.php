<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

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
        return ['database'];
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
