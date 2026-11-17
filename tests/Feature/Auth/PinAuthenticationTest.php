<?php

namespace Tests\Feature\Auth;

use App\Jobs\SendPinSecuritySmsNotification;
use App\Models\Company;
use App\Models\Employee;
use App\Models\Setting;
use App\Models\User;
use App\Models\UserTrustedDevice;
use App\Notifications\Auth\PinLoginFailedNotification;
use App\Services\DeviceSecurityService;
use App\Services\PinAuthenticationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class PinAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_pin_login_screen_renders_when_no_trusted_device(): void
    {
        $response = $this->get(route('login.pin'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Auth/PinLogin')
            ->where('hasDevice', false)
        );
    }

    public function test_user_can_authenticate_with_identifier_and_pin_without_preexisting_device(): void
    {
        $company = Company::create(['name' => 'Acme Corp']);
        $user = User::factory()->create([
            'email'        => 'john@example.com',
            'role'         => 'employee',
            'company_id'   => $company->id,
            'pin_hash'     => Hash::make('839174'),
            'pin_enabled'  => true,
        ]);

        $response = $this->post(route('login.pin.store'), [
            'login_identifier' => 'john@example.com',
            'pin'              => '839174',
        ]);

        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseHas('user_trusted_devices', [
            'user_id' => $user->id,
            'is_active' => 1,
        ]);
    }

    public function test_user_can_skip_pin_setup(): void
    {
        $user = User::factory()->create(['role' => 'employee']);
        $response = $this->actingAs($user)->post(route('user.pin.skip'));
        $response->assertSessionHas('pin_setup_dismissed', true);
    }

    public function test_login_page_directly_redirects_to_pin_screen_if_trusted_device_and_pin_set(): void
    {
        $company = Company::create(['name' => 'Acme Corp']);
        $user = User::factory()->create([
            'role'         => 'employee',
            'company_id'   => $company->id,
            'pin_hash'     => Hash::make('839174'),
            'pin_enabled'  => true,
        ]);

        $deviceService = app(DeviceSecurityService::class);
        $rawToken = $deviceService->generateToken();
        $tokenHash = $deviceService->hashToken($rawToken);

        UserTrustedDevice::create([
            'user_id'           => $user->id,
            'company_id'        => $company->id,
            'device_token_hash' => $tokenHash,
            'device_name'       => 'Test Office Laptop',
            'expires_at'        => now()->addDays(30),
            'is_active'         => true,
        ]);

        // Visiting /login with trusted device cookie must directly redirect to /login/pin
        $response = $this->withCookie(DeviceSecurityService::COOKIE_NAME, $rawToken)
            ->get(route('login'));

        $response->assertRedirect(route('login.pin'));

        // If mode=password is requested, stays on password login
        $passwordResponse = $this->withCookie(DeviceSecurityService::COOKIE_NAME, $rawToken)
            ->get(route('login', ['mode' => 'password']));

        $passwordResponse->assertStatus(200);
    }

    public function test_pin_complexity_validator_rejects_weak_and_sequential_pins(): void
    {
        $service = app(PinAuthenticationService::class);

        // Disallowed list
        $this->assertFalse($service->validatePinComplexity('123456')['valid']);
        $this->assertFalse($service->validatePinComplexity('000000')['valid']);
        $this->assertFalse($service->validatePinComplexity('654321')['valid']);

        // All identical
        $this->assertFalse($service->validatePinComplexity('444444')['valid']);

        // Sequential ascending/descending
        $this->assertFalse($service->validatePinComplexity('234567')['valid']);
        $this->assertFalse($service->validatePinComplexity('876543')['valid']);

        // Non-numeric or invalid length
        $this->assertFalse($service->validatePinComplexity('123a56')['valid']);
        $this->assertFalse($service->validatePinComplexity('12345')['valid']);
        $this->assertFalse($service->validatePinComplexity('1234567')['valid']);

        // Valid complex PIN
        $this->assertTrue($service->validatePinComplexity('839174')['valid']);
    }

    public function test_pin_login_screen_renders_for_valid_trusted_device(): void
    {
        $company = Company::create(['name' => 'Acme Corp']);
        $user = User::factory()->create([
            'role'         => 'employee',
            'company_id'   => $company->id,
            'pin_hash'     => Hash::make('839174'),
            'pin_enabled'  => true,
        ]);

        $deviceService = app(DeviceSecurityService::class);
        $rawToken = $deviceService->generateToken();
        $tokenHash = $deviceService->hashToken($rawToken);

        UserTrustedDevice::create([
            'user_id'           => $user->id,
            'company_id'        => $company->id,
            'device_token_hash' => $tokenHash,
            'device_name'       => 'Test Office Laptop',
            'device_type'       => 'desktop',
            'expires_at'        => now()->addDays(30),
            'is_active'         => true,
        ]);

        $response = $this->withCookie(DeviceSecurityService::COOKIE_NAME, $rawToken)
            ->get(route('login.pin'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Auth/PinLogin')
            ->where('user.name', $user->name)
            ->where('isLocked', false)
        );
    }

    public function test_user_can_setup_pin_and_register_trusted_device(): void
    {
        $company = Company::create(['name' => 'Acme Corp']);
        $user = User::factory()->create([
            'role'       => 'employee',
            'company_id' => $company->id,
        ]);

        $response = $this->actingAs($user)->post(route('user.pin.setup'), [
            'pin'              => '839174',
            'pin_confirmation' => '839174',
            'register_device'  => true,
            'device_name'      => 'Main Office Workstation',
        ]);

        $response->assertSessionHas('status');

        $user->refresh();
        $this->assertTrue($user->hasPinConfigured());
        $this->assertTrue(Hash::check('839174', $user->pin_hash));

        $this->assertDatabaseHas('user_trusted_devices', [
            'user_id'     => $user->id,
            'device_name' => 'Main Office Workstation',
            'is_active'   => 1,
        ]);
    }

    public function test_user_can_authenticate_with_pin_via_trusted_device(): void
    {
        $company = Company::create(['name' => 'Acme Corp']);
        $user = User::factory()->create([
            'role'         => 'employee',
            'company_id'   => $company->id,
            'pin_hash'     => Hash::make('839174'),
            'pin_enabled'  => true,
        ]);

        $deviceService = app(DeviceSecurityService::class);
        $rawToken = $deviceService->generateToken();
        $tokenHash = $deviceService->hashToken($rawToken);

        $device = UserTrustedDevice::create([
            'user_id'           => $user->id,
            'company_id'        => $company->id,
            'device_token_hash' => $tokenHash,
            'device_name'       => 'Test Office Laptop',
            'device_type'       => 'desktop',
            'expires_at'        => now()->addDays(30),
            'is_active'         => true,
        ]);

        $response = $this->withCookie(DeviceSecurityService::COOKIE_NAME, $rawToken)
            ->post(route('login.pin.store'), [
                'pin' => '839174',
            ]);

        $this->assertAuthenticatedAs($user);
        $device->refresh();
        $this->assertNotNull($device->last_used_at);
    }

    public function test_pin_authentication_fails_with_wrong_pin_and_records_failures(): void
    {
        $company = Company::create(['name' => 'Acme Corp']);
        $user = User::factory()->create([
            'role'         => 'employee',
            'company_id'   => $company->id,
            'pin_hash'     => Hash::make('839174'),
            'pin_enabled'  => true,
        ]);

        $deviceService = app(DeviceSecurityService::class);
        $rawToken = $deviceService->generateToken();
        $tokenHash = $deviceService->hashToken($rawToken);

        UserTrustedDevice::create([
            'user_id'           => $user->id,
            'company_id'        => $company->id,
            'device_token_hash' => $tokenHash,
            'device_name'       => 'Test Office Laptop',
            'expires_at'        => now()->addDays(30),
            'is_active'         => true,
        ]);

        $response = $this->withCookie(DeviceSecurityService::COOKIE_NAME, $rawToken)
            ->post(route('login.pin.store'), [
                'pin' => '999888',
            ]);

        $response->assertSessionHasErrors('pin');
        $this->assertGuest();

        $user->refresh();
        $this->assertEquals(1, $user->pin_failed_attempts);
    }

    public function test_account_locks_after_five_consecutive_failed_attempts(): void
    {
        $company = Company::create(['name' => 'Acme Corp']);
        $user = User::factory()->create([
            'role'                => 'employee',
            'company_id'          => $company->id,
            'pin_hash'            => Hash::make('839174'),
            'pin_enabled'         => true,
            'pin_failed_attempts' => 4,
        ]);

        $deviceService = app(DeviceSecurityService::class);
        $rawToken = $deviceService->generateToken();
        $tokenHash = $deviceService->hashToken($rawToken);

        UserTrustedDevice::create([
            'user_id'           => $user->id,
            'company_id'        => $company->id,
            'device_token_hash' => $tokenHash,
            'device_name'       => 'Test Office Laptop',
            'expires_at'        => now()->addDays(30),
            'is_active'         => true,
        ]);

        $response = $this->withCookie(DeviceSecurityService::COOKIE_NAME, $rawToken)
            ->post(route('login.pin.store'), [
                'pin' => '999888',
            ]);

        $response->assertSessionHasErrors('pin');
        $user->refresh();

        $this->assertEquals(5, $user->pin_failed_attempts);
        $this->assertTrue($user->isPinLocked());
        $this->assertGreaterThan(0, $user->pinLockRemainingSeconds());
    }

    public function test_revoked_device_cannot_use_pin_login(): void
    {
        $company = Company::create(['name' => 'Acme Corp']);
        $user = User::factory()->create([
            'role'         => 'employee',
            'company_id'   => $company->id,
            'pin_hash'     => Hash::make('839174'),
            'pin_enabled'  => true,
        ]);

        $deviceService = app(DeviceSecurityService::class);
        $rawToken = $deviceService->generateToken();
        $tokenHash = $deviceService->hashToken($rawToken);

        $device = UserTrustedDevice::create([
            'user_id'           => $user->id,
            'company_id'        => $company->id,
            'device_token_hash' => $tokenHash,
            'device_name'       => 'Revoked Laptop',
            'expires_at'        => now()->addDays(30),
            'is_active'         => false,
            'revoked_at'        => now(),
        ]);

        $response = $this->withCookie(DeviceSecurityService::COOKIE_NAME, $rawToken)
            ->from(route('login.pin'))
            ->post(route('login.pin.store'), [
                'pin' => '839174',
            ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('login_identifier');
    }

    public function test_failed_pin_attempt_sends_security_notification_email_by_default(): void
    {
        Notification::fake();

        $company = Company::create(['name' => 'Acme Corp']);
        $user = User::factory()->create([
            'email'        => 'secureuser@example.com',
            'role'         => 'employee',
            'company_id'   => $company->id,
            'pin_hash'     => Hash::make('839174'),
            'pin_enabled'  => true,
        ]);

        $this->post(route('login.pin.store'), [
            'login_identifier' => 'secureuser@example.com',
            'pin'              => '999999', // wrong pin
        ]);

        Notification::assertSentTo(
            $user,
            PinLoginFailedNotification::class,
            function (PinLoginFailedNotification $notification) use ($user) {
                $channels = $notification->via($user);
                // Mail channel should be present by default
                return in_array('mail', $channels) && in_array('database', $channels);
            }
        );
    }

    public function test_failed_pin_attempt_dispatches_sms_when_sms_alert_enabled(): void
    {
        Queue::fake();

        $company = Company::create(['name' => 'Acme Corp']);
        Setting::set('pin_failed_send_sms', '1', 'security', 'string', $company->id);

        $employee = Employee::create([
            'company_id'    => $company->id,
            'employee_code' => 'EMP-777',
            'name'          => 'Alice Smith',
            'email'         => 'alice@example.com',
            'mobile'        => '+97455512345',
            'gender'        => 'female',
            'is_active'     => true,
        ]);

        $user = User::factory()->create([
            'email'        => 'alice@example.com',
            'role'         => 'employee',
            'employee_id'  => $employee->id,
            'company_id'   => $company->id,
            'pin_hash'     => Hash::make('839174'),
            'pin_enabled'  => true,
        ]);

        $this->post(route('login.pin.store'), [
            'login_identifier' => 'alice@example.com',
            'pin'              => '111111', // wrong pin
        ]);

        Queue::assertPushed(SendPinSecuritySmsNotification::class, function ($job) use ($user) {
            return $job->user->id === $user->id && $job->mobile === '+97455512345';
        });
    }

    public function test_failed_pin_notification_omits_mail_channel_when_email_disabled_in_settings(): void
    {
        $company = Company::create(['name' => 'Acme Corp']);
        Setting::set('pin_failed_send_email', '0', 'security', 'string', $company->id);

        $user = User::factory()->create([
            'email'        => 'noemail@example.com',
            'role'         => 'employee',
            'company_id'   => $company->id,
        ]);

        $notification = new PinLoginFailedNotification('127.0.0.1', 'Mozilla', 1, false);
        $channels = $notification->via($user);

        $this->assertNotContains('mail', $channels);
        $this->assertContains('database', $channels);
    }
}
