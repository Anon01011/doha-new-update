<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserTrustedDevice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Cookie as SymfonyCookie;

class DeviceSecurityService
{
    public const COOKIE_NAME = 'hrms_trusted_device';
    public const EXPIRATION_DAYS = 30;

    /**
     * Generate a cryptographically secure random token.
     */
    public function generateToken(): string
    {
        return Str::random(64);
    }

    /**
     * Compute SHA-256 hash of raw token for secure database storage.
     */
    public function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    /**
     * Register a new trusted device for an authenticated user.
     *
     * @return array{device: UserTrustedDevice, cookie: SymfonyCookie, raw_token: string}
     */
    public function registerDevice(User $user, Request $request, ?string $deviceName = null): array
    {
        $rawToken = $this->generateToken();
        $tokenHash = $this->hashToken($rawToken);

        $userAgent = $request->userAgent() ?? '';
        $deviceType = $this->detectDeviceType($userAgent);
        $resolvedName = $deviceName ?: $this->detectDeviceName($userAgent);

        $device = UserTrustedDevice::create([
            'user_id'           => $user->id,
            'company_id'        => $user->company_id,
            'device_token_hash' => $tokenHash,
            'device_name'       => $resolvedName,
            'device_type'       => $deviceType,
            'ip_address'        => $request->ip(),
            'user_agent'        => $userAgent,
            'last_used_at'      => now(),
            'expires_at'        => now()->addDays(self::EXPIRATION_DAYS),
            'is_active'         => true,
        ]);

        $cookie = $this->createDeviceCookie($rawToken);

        return [
            'device'    => $device,
            'cookie'    => $cookie,
            'raw_token' => $rawToken,
        ];
    }

    /**
     * Resolve and validate a trusted device from incoming request cookie.
     */
    public function resolveDeviceFromRequest(Request $request): ?UserTrustedDevice
    {
        $token = $request->cookie(self::COOKIE_NAME);
        if (!$token || !is_string($token)) {
            return null;
        }

        $tokenHash = $this->hashToken($token);

        /** @var UserTrustedDevice|null $device */
        $device = UserTrustedDevice::where('device_token_hash', $tokenHash)
            ->valid()
            ->with(['user.employee', 'user.roles'])
            ->first();

        if (!$device || !$device->user) {
            return null;
        }

        $user = $device->user;

        // Verify user account eligibility
        if (!$user->isPinEligible()) {
            return null;
        }

        return $device;
    }

    /**
     * Create HttpOnly, Secure, SameSite=Lax cookie for the device token.
     */
    public function createDeviceCookie(string $rawToken): SymfonyCookie
    {
        $minutes = self::EXPIRATION_DAYS * 24 * 60;
        $secure = app()->environment('production') || request()->isSecure();

        return Cookie::make(
            self::COOKIE_NAME,
            $rawToken,
            $minutes,
            '/',
            null,
            $secure,
            true, // HttpOnly
            false,
            'lax' // SameSite
        );
    }

    /**
     * Create an expired cookie to purge the trusted device token from browser.
     */
    public function createRevocationCookie(): SymfonyCookie
    {
        return Cookie::forget(self::COOKIE_NAME, '/', null);
    }

    /**
     * Revoke a single trusted device.
     */
    public function revokeDevice(UserTrustedDevice $device): bool
    {
        return $device->revoke();
    }

    /**
     * Revoke all trusted devices belonging to a user.
     */
    public function revokeAllUserDevices(User $user): int
    {
        return UserTrustedDevice::where('user_id', $user->id)
            ->where('is_active', true)
            ->update([
                'is_active'  => false,
                'revoked_at' => now(),
            ]);
    }

    /**
     * Helper to detect rough device type from user agent.
     */
    protected function detectDeviceType(string $userAgent): string
    {
        $ua = strtolower($userAgent);
        if (str_contains($ua, 'mobile') || str_contains($ua, 'android') || str_contains($ua, 'iphone')) {
            return 'mobile';
        }
        if (str_contains($ua, 'tablet') || str_contains($ua, 'ipad')) {
            return 'tablet';
        }
        return 'desktop';
    }

    /**
     * Helper to formulate a friendly device name from user agent.
     */
    protected function detectDeviceName(string $userAgent): string
    {
        $platform = 'Desktop Device';
        $browser = 'Browser';

        $ua = strtolower($userAgent);
        if (str_contains($ua, 'windows')) $platform = 'Windows PC';
        elseif (str_contains($ua, 'macintosh') || str_contains($ua, 'mac os')) $platform = 'Mac';
        elseif (str_contains($ua, 'iphone')) $platform = 'iPhone';
        elseif (str_contains($ua, 'ipad')) $platform = 'iPad';
        elseif (str_contains($ua, 'android')) $platform = 'Android Device';
        elseif (str_contains($ua, 'linux')) $platform = 'Linux Workstation';

        if (str_contains($ua, 'edg')) $browser = 'Edge';
        elseif (str_contains($ua, 'chrome')) $browser = 'Chrome';
        elseif (str_contains($ua, 'safari') && !str_contains($ua, 'chrome')) $browser = 'Safari';
        elseif (str_contains($ua, 'firefox')) $browser = 'Firefox';

        return "{$platform} ({$browser})";
    }
}

