<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\PinLoginRequest;
use App\Http\Requests\Auth\SetupPinRequest;
use App\Models\UserTrustedDevice;
use App\Services\DeviceSecurityService;
use App\Services\PinAuthenticationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class PinLoginController extends Controller
{
    public function __construct(
        protected PinAuthenticationService $pinAuthService,
        protected DeviceSecurityService $deviceSecurityService
    ) {}

    /**
     * Display the PIN login view.
     */
    public function create(Request $request): Response
    {
        $device = $this->deviceSecurityService->resolveDeviceFromRequest($request);
        $user = $device?->user;

        $userData = null;
        if ($user && $user->hasPinConfigured()) {
            // Mask email for privacy (e.g., j***n@domain.com)
            $emailParts = explode('@', $user->email);
            $namePart = $emailParts[0];
            $domain = $emailParts[1] ?? '';
            $maskedEmail = strlen($namePart) > 2
                ? substr($namePart, 0, 1) . str_repeat('*', max(1, strlen($namePart) - 2)) . substr($namePart, -1) . '@' . $domain
                : $namePart . '@' . $domain;

            $userData = [
                'name'         => $user->name,
                'email_masked' => $maskedEmail,
                'role'         => strtoupper($user->role ?? 'EMPLOYEE'),
                'image'        => $user->image ? asset('storage/' . $user->image) : null,
                'device_name'  => $device->device_name,
            ];
        }

        return Inertia::render('Auth/PinLogin', [
            'user'         => $userData,
            'hasDevice'    => $userData !== null,
            'isLocked'     => $user ? $user->isPinLocked() : false,
            'lockSeconds'  => $user ? $user->pinLockRemainingSeconds() : 0,
            'status'       => session('status'),
        ]);
    }

    /**
     * Authenticate the user via 6-digit PIN (from trusted device or with employee ID/email).
     */
    public function store(PinLoginRequest $request): SymfonyResponse
    {
        $device = $this->deviceSecurityService->resolveDeviceFromRequest($request);
        $user = $device?->user;

        $newDeviceCookie = null;

        // If no trusted device cookie was present, resolve user by submitted identifier
        if (!$user) {
            $identifier = trim((string) $request->input('login_identifier', ''));
            if ($identifier === '') {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'login_identifier' => ['Please enter your email or employee code.'],
                ]);
            }

            // Search by user email
            $user = \App\Models\User::where('email', $identifier)->first();

            // Search by employee code if not found by email
            if (!$user) {
                $employee = \App\Models\Employee::where('employee_code', $identifier)->first();
                if ($employee) {
                    $user = \App\Models\User::where('employee_id', $employee->id)
                        ->orWhere('email', $employee->email)
                        ->first();
                }
            }

            if (!$user || !$user->isPinEligible() || !$user->hasPinConfigured()) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'login_identifier' => ['Invalid credentials or PIN authentication is not configured for this account.'],
                ]);
            }
        }

        // Perform secure PIN verification with lockout checks and security alert dispatch
        $this->pinAuthService->verifyPin($user, $request->pin, $request->ip(), $request->userAgent());

        // Authenticate user into web guard
        Auth::guard('web')->login($user, true);

        // Touch device usage or register current browser as trusted device
        if ($device) {
            $device->touchUsage($request->ip(), $request->userAgent());
        } else {
            $registration = $this->deviceSecurityService->registerDevice($user, $request);
            $newDeviceCookie = $registration['cookie'];
        }

        // Regenerate session to prevent session fixation
        $request->session()->regenerate();

        $response = Inertia::location(route('dashboard', absolute: false));
        if ($newDeviceCookie) {
            $response->headers->setCookie($newDeviceCookie);
        }

        return $response;
    }

    /**
     * Configure or change PIN for authenticated user.
     */
    public function setup(SetupPinRequest $request): SymfonyResponse
    {
        $user = $request->user();

        if (!$user->isPinEligible()) {
            abort(403, 'Your account role is not eligible for PIN authentication.');
        }

        $this->pinAuthService->setPin($user, $request->pin);

        $response = back()->with('status', 'Your 6-digit PIN has been successfully configured.');

        // Optionally register current device as a trusted device
        if ($request->boolean('register_device', true)) {
            $registration = $this->deviceSecurityService->registerDevice(
                $user,
                $request,
                $request->input('device_name')
            );
            $response->withCookie($registration['cookie']);
        }

        return $response;
    }

    /**
     * Dismiss PIN setup modal for the current session.
     */
    public function skipSetup(Request $request): SymfonyResponse
    {
        $request->session()->put('pin_setup_dismissed', true);
        return back();
    }

    /**
     * Disable/remove PIN for authenticated user.
     */
    public function disable(Request $request): SymfonyResponse
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
        ]);

        $user = $request->user();
        $this->pinAuthService->disablePin($user);
        $this->deviceSecurityService->revokeAllUserDevices($user);

        $cookie = $this->deviceSecurityService->createRevocationCookie();

        return back()
            ->withCookie($cookie)
            ->with('status', 'PIN authentication and all trusted devices have been disabled.');
    }

    /**
     * Revoke a specific trusted device.
     */
    public function revokeDevice(Request $request, int|string $id): SymfonyResponse
    {
        $user = $request->user();
        $device = $user->trustedDevices()->where('id', $id)->firstOrFail();

        $this->deviceSecurityService->revokeDevice($device);

        $response = back()->with('status', 'Device registration has been revoked.');

        // If the current browser is using this revoked token, purge the cookie
        $currentToken = $request->cookie(DeviceSecurityService::COOKIE_NAME);
        if ($currentToken && $device->device_token_hash === $this->deviceSecurityService->hashToken($currentToken)) {
            $response->withCookie($this->deviceSecurityService->createRevocationCookie());
        }

        return $response;
    }

    /**
     * Lightweight check if the client possesses a valid trusted device cookie.
     */
    public function checkDevice(Request $request)
    {
        $device = $this->deviceSecurityService->resolveDeviceFromRequest($request);

        if (!$device || !$device->user->hasPinConfigured()) {
            return response()->json([
                'has_trusted_device' => false,
            ]);
        }

        return response()->json([
            'has_trusted_device' => true,
            'user_name'          => $device->user->name,
            'device_name'        => $device->device_name,
        ]);
    }
}

