<?php

namespace App\Notifications;

use App\Models\Company;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

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
        $channels = ['database'];
        if (Setting::get('email_notifications_enabled', '1') === '1' && !empty($notifiable->email)) {
            $channels[] = 'mail';
        }
        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("New Shift Roster Created — {$this->company->name} (Week: {$this->weekStart})")
            ->line("A new shift roster has been created by {$this->creatorName} for {$this->company->name}.")
            ->line("Week Starting: {$this->weekStart} | Total Shifts: {$this->shiftsCount}")
            ->action('Review Roster', route('shift-rosters.management', [
                'company_id' => $this->company->id,
                'from_date'  => $this->weekStart,
                'status'     => 'pending',
            ]))
            ->line('Please review and approve or reject the roster.');
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
