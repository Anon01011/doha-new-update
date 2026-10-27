<?php

namespace App\Notifications;

use App\Models\Company;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ShiftRosterCreatedNotification extends Notification
{
    use Queueable;

    public Company $company;
    public string $weekStart;
    public int $shiftsCount;
    public string $creatorName;

    public function __construct(Company $company, string $weekStart, int $shiftsCount, string $creatorName)
    {
        $this->company = $company;
        $this->weekStart = $weekStart;
        $this->shiftsCount = $shiftsCount;
        $this->creatorName = $creatorName;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'company_id'   => $this->company->id,
            'company_name' => $this->company->name,
            'week_start'   => $this->weekStart,
            'shifts_count' => $this->shiftsCount,
            'creator'      => $this->creatorName,
            'message'      => "New Shift Roster schedule created by {$this->creatorName} for {$this->company->name} (Week: {$this->weekStart}) with {$this->shiftsCount} shifts awaiting sign-off.",
            'action_url'   => route('shift-rosters.management', [
                'company_id' => $this->company->id,
                'from_date'  => $this->weekStart,
                'status'     => 'pending',
            ]),
            'type'         => 'shift_roster_created',
        ];
    }
}
