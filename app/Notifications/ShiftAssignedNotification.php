<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Setting;

class ShiftAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $startDate;
    protected $endDate;
    protected $shiftName;
    protected $shiftTime;

    public function __construct(?string $startDate = null, ?string $endDate = null, ?string $shiftName = null, ?string $shiftTime = null)
    {
        $this->startDate = $startDate ?: now()->toDateString();
        $this->endDate   = $endDate ?: $this->startDate;
        $this->shiftName = $shiftName;
        $this->shiftTime = $shiftTime;
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
        $timingDetail = $this->shiftName
            ? " ({$this->shiftName}" . ($this->shiftTime ? " — {$this->shiftTime}" : '') . ')'
            : '';
        return (new MailMessage)
            ->subject('Shift Roster Assigned')
            ->line("Your shift roster has been assigned for the period {$this->startDate} to {$this->endDate}{$timingDetail}.")
            ->action('View Roster', route('shift-rosters.index'))
            ->line('Please review your schedule and contact your manager with any concerns.');
    }

    public function toArray(object $notifiable): array
    {
        $timingDetail = $this->shiftName ? " ({$this->shiftName}" . ($this->shiftTime ? " - {$this->shiftTime}" : "") . ")" : "";
        return [
            'title'      => 'Shift Roster Assigned',
            'message'    => "Your roster has been created and assigned for period {$this->startDate} to {$this->endDate}{$timingDetail}.",
            'action_url' => route('shift-rosters.index'),
            'type'       => 'shift_roster_created',
            'start_date' => $this->startDate,
            'end_date'   => $this->endDate,
        ];
    }
}
