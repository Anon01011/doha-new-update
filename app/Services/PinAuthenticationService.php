<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use App\Notifications\Auth\PinLoginFailedNotification;
use App\Jobs\SendPinSecuritySmsNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PinAuthenticationService
{
    /**
     * List of commonly guessed or insecure 6-digit PINs.
     */
    protected const DISALLOWED_PINS = [
        '000000', '111111', '222222', '333333', '444444',
        '555555', '666666', '777777', '888888', '999999',
        '123456', '654321', '121212', '123123', '012345',
        '543210', '112233', '332211', '123321', '000123',
    ];

    /**
     * Validate PIN format and complexity.
     *
     * @return array{valid: bool, message: ?string}
     */
    public function validatePinComplexity(string $pin): array
    {
        if (strlen($pin) !== 6 || !ctype_digit($pin)) {
            return [
                'valid'   => false,
                'message' => 'The PIN must be exactly 6 numeric digits.',
            ];
        }

        if (in_array($pin, self::DISALLOWED_PINS, true)) {
            return [
                'valid'   => false,
                'message' => 'This PIN is too common and easily guessed. Please choose a more secure 6-digit code.',
            ];
        }

        // Reject all identical digits (e.g. 000000)
        if (count(array_unique(str_split($pin))) === 1) {
            return [
                'valid'   => false,
                'message' => 'The PIN cannot consist of all identical digits.',
            ];
        }

        // Reject strictly ascending sequences (e.g., 234567)
        $isAscending = true;
        for ($i = 0; $i < 5; $i++) {
            if ((int)$pin[$i + 1] !== ((int)$pin[$i] + 1)) {
                $isAscending = false;
                break;
            }
        }
        if ($isAscending) {
            return [
                'valid'   => false,
                'message' => 'The PIN cannot be a sequential series of numbers.',
            ];
        }

        // Reject strictly descending sequences (e.g., 765432)
        $isDescending = true;
        for ($i = 0; $i < 5; $i++) {
            if ((int)$pin[$i + 1] !== ((int)$pin[$i] - 1)) {
                $isDescending = false;
                break;
            }
        }
        if ($isDescending) {
            return [
                'valid'   => false,
                'message' => 'The PIN cannot be a sequential series of numbers.',
            ];
        }

        return ['valid' => true, 'message' => null];
    }

    /**
     * Verify user's submitted PIN against stored hash with lockout protection.
     *
     * @throws ValidationException
     */
    public function verifyPin(User $user, string $pin, ?string $ipAddress = null, ?string $userAgent = null): bool
    {
        if ($user->isPinLocked()) {
            $remaining = ceil($user->pinLockRemainingSeconds() / 60);
            throw ValidationException::withMessages([
                'pin' => ["Too many failed PIN attempts. Account locked for {$remaining} more minute(s). Please sign in with your password."],
            ]);
        }

        if (!$user->hasPinConfigured()) {
            throw ValidationException::withMessages([
                'pin' => ['PIN authentication is not configured for this account. Please sign in with your password.'],
            ]);
        }

        if (!Hash::check($pin, $user->pin_hash)) {
            $user->recordFailedPinAttempt(5, 15);

            $isLocked = $user->isPinLocked();

            // Dispatch security notification (Email by default, SMS if enabled)
            $this->notifyFailedAttempt($user, $ipAddress, $userAgent, $isLocked);

            if ($isLocked) {
                throw ValidationException::withMessages([
                    'pin' => ['Too many failed attempts. PIN authentication has been locked for 15 minutes. Please use your password.'],
                ]);
            }

            $remainingAttempts = max(0, 5 - ($user->pin_failed_attempts ?? 0));
            throw ValidationException::withMessages([
                'pin' => ["Incorrect PIN. {$remainingAttempts} attempt(s) remaining before a 15-minute lockout."],
            ]);
        }

        // Successful PIN verification
        $user->resetPinFailures();

        return true;
    }

    /**
     * Send failed PIN login security notifications via configured channels (Email / SMS).
     */
    public function notifyFailedAttempt(User $user, ?string $ipAddress = null, ?string $userAgent = null, bool $isLocked = false): void
    {
        try {
            $ip = $ipAddress ?: (request()?->ip() ?: '127.0.0.1');
            $ua = $userAgent ?: (request()?->userAgent() ?: 'Standard Web Browser');
            $companyId = $user->employee?->company_id ?: $user->company_id;

            // 1. Email notification (Enabled by default: '1')
            $emailEnabled = Setting::get(
                'pin_failed_send_email',
                Setting::get('pin_failed_notify_email', '1', $companyId),
                $companyId
            ) === '1';

            if ($emailEnabled && !empty($user->email)) {
                $user->notify(new PinLoginFailedNotification(
                    $ip,
                    $ua,
                    $user->pin_failed_attempts ?? 1,
                    $isLocked
                ));
            } else {
                // If email is explicitly turned off in settings, still record an in-app database notification
                $user->notify(new PinLoginFailedNotification(
                    $ip,
                    $ua,
                    $user->pin_failed_attempts ?? 1,
                    $isLocked,
                    ['database']
                ));
            }

            // 2. Text SMS notification (Configurable via Settings, default: '0')
            $smsEnabled = Setting::get(
                'pin_failed_send_sms',
                Setting::get('pin_failed_notify_sms', '0', $companyId),
                $companyId
            ) === '1';

            if ($smsEnabled) {
                $mobile = $user->employee?->mobile ?: ($user->phone ?? null);
                if (!empty($mobile)) {
                    SendPinSecuritySmsNotification::dispatch(
                        $user,
                        $user->employee?->company,
                        $mobile,
                        $ip,
                        now()->format('d M Y, H:i'),
                        $isLocked
                    );
                }
            }
        } catch (\Throwable $e) {
            Log::error('Failed to dispatch PIN security alert notification: ' . $e->getMessage(), [
                'user_id' => $user->id,
            ]);
        }
    }

    /**
     * Configure or update PIN for a user.
     *
     * @throws ValidationException
     */
    public function setPin(User $user, string $pin): void
    {
        $validation = $this->validatePinComplexity($pin);
        if (!$validation['valid']) {
            throw ValidationException::withMessages([
                'pin' => [$validation['message']],
            ]);
        }

        $user->update([
            'pin_hash'            => Hash::make($pin),
            'pin_set_at'          => now(),
            'pin_enabled'         => true,
            'pin_failed_attempts' => 0,
            'pin_locked_until'    => null,
        ]);
    }

    /**
     * Disable/reset PIN authentication for a user (e.g. during recovery or password change).
     */
    public function disablePin(User $user): void
    {
        $user->update([
            'pin_hash'            => null,
            'pin_set_at'          => null,
            'pin_enabled'         => false,
            'pin_failed_attempts' => 0,
            'pin_locked_until'    => null,
        ]);
    }
}

