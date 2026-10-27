<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ShiftAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $startDate;
    protected $endDate;
    protected $shiftName;
    protected $shiftTime;

    public function __construct(string $startDate, string $endDate, ?string $shiftName = null, ?string $shiftTime = null)
    {
        $this->startDate = $startDate;
        $this->endDate   = $endDate;
        $this->shiftName = $shiftName;
        $this->shiftTime = $shiftTime;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
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
