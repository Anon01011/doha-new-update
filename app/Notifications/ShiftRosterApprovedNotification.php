<?php

namespace App\Notifications;

use App\Models\Company;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ShiftRosterApprovedNotification extends Notification
{
    use Queueable;

    public string $weekStart;
    public string $companyName;

    public function __construct(string $weekStart, string $companyName)
    {
        $this->weekStart = $weekStart;
        $this->companyName = $companyName;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $start = Carbon::parse($this->weekStart);
        $end = $start->copy()->addDays(6);
        $formattedRange = $start->format('M d') . ' - ' . $end->format('M d, Y');

        return [
            'week_start'   => $this->weekStart,
            'company_name' => $this->companyName,
            'message'      => "Your shift roster schedule for {$formattedRange} ({$this->companyName}) has been approved and published.",
            'action_url'   => route('shift-rosters.index', ['week_start' => $this->weekStart]),
            'type'         => 'shift_roster_approved',
        ];
    }
}
