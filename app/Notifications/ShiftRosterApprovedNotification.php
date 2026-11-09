<?php

namespace App\Notifications;

use App\Models\Company;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

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
        $channels = ['database'];
        if (Setting::get('email_notifications_enabled', '1') === '1' && !empty($notifiable->email)) {
            $channels[] = 'mail';
        }
        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $start = Carbon::parse($this->weekStart);
        $end = $start->copy()->addDays(6);
        $formattedRange = $start->format('M d') . ' - ' . $end->format('M d, Y');

        return (new MailMessage)
            ->subject("Shift Roster Approved — {$formattedRange}")
            ->line("Your shift roster for the week of {$formattedRange} ({$this->companyName}) has been approved and published.")
            ->action('View Roster', route('shift-rosters.index', ['week_start' => $this->weekStart]))
            ->line('Please review your schedule for the week.');
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
