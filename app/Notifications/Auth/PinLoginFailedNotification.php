<?php

namespace App\Notifications\Auth;

use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PinLoginFailedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public string $ipAddress;
    public ?string $userAgent;
    public int $failedAttempts;
    public bool $isLocked;
    public ?array $customChannels;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        string $ipAddress,
        ?string $userAgent = null,
        int $failedAttempts = 1,
        bool $isLocked = false,
        ?array $customChannels = null
    ) {
        $this->ipAddress = $ipAddress;
        $this->userAgent = $userAgent;
        $this->failedAttempts = $failedAttempts;
        $this->isLocked = $isLocked;
        $this->customChannels = $customChannels;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        if ($this->customChannels !== null) {
            return $this->customChannels;
        }

        $companyId = $notifiable->employee?->company_id ?: $notifiable->company_id;
        $channels = ['database'];

        // Email alert is enabled by default (1)
        $emailEnabled = Setting::get(
            'pin_failed_send_email',
            Setting::get('pin_failed_notify_email', '1', $companyId),
            $companyId
        ) === '1';

        if ($emailEnabled && !empty($notifiable->email)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $companyId = $notifiable->employee?->company_id ?: $notifiable->company_id;
        $appName = Setting::get('app_name', config('app.name'), $companyId);
        $statusMsg = $this->isLocked
            ? 'Account Locked (15 minutes lockout)'
            : "Attempt {$this->failedAttempts} of 5";

        return (new MailMessage)
            ->subject("[Security Alert] Unsuccessful PIN Login Attempt - {$appName}")
            ->view('emails.auth.pin_failed_attempt', [
                'user'          => $notifiable,
                'appName'       => $appName,
                'ipAddress'     => $this->ipAddress,
                'userAgent'     => $this->userAgent ?: 'Standard Web Browser',
                'time'          => now()->format('D, d M Y H:i:s T'),
                'failedAttempts'=> $this->failedAttempts,
                'isLocked'      => $this->isLocked,
                'statusMessage' => $statusMsg,
                'securityUrl'   => url(route('profile.edit')),
            ]);
    }

    /**
     * Get the array representation for in-app bell notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title'      => 'Security Alert: Failed PIN Attempt',
            'message'    => "An incorrect PIN was entered for your account from IP {$this->ipAddress}." . ($this->isLocked ? ' Account has been temporarily locked.' : ''),
            'type'       => 'security',
            'ip'         => $this->ipAddress,
            'is_locked'  => $this->isLocked,
            'time'       => now()->toIso8601String(),
            'action_url' => route('profile.edit'),
        ];
    }
}

