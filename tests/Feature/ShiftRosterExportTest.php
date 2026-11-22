<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Role;
use App\Models\ShiftRoster;
use App\Models\User;
use App\Services\ShiftRosterExportService;
use App\Services\ShiftRosterNotificationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShiftRosterExportTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Company $company;
    protected Employee $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Admin', 'is_active' => true, 'is_default' => true]
        );

        $this->company = Company::create(['name' => 'Doha HQ']);

        $this->admin = User::create([
            'name' => 'Admin',
            'email' => 'admin_export@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);
        $this->admin->roles()->sync([$adminRole->id]);

        $this->employee = Employee::create([
            'name' => 'John Doe',
            'gender' => 'Male',
            'employee_code' => 'EMP-TEST-99',
            'company_id' => $this->company->id,
            'basic_salary' => 2000,
        ]);
    }

    public function test_day_offset_calculation()
    {
        $this->assertSame(0, ShiftRosterNotificationService::getDayOffset('Monday'));
        $this->assertSame(2, ShiftRosterNotificationService::getDayOffset('Wednesday'));
        $this->assertSame(6, ShiftRosterNotificationService::getDayOffset('Sunday'));
        $this->assertSame(0, ShiftRosterNotificationService::getDayOffset('InvalidDay'));
    }

    public function test_export_week_endpoint_streams_excel_download()
    {
        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY)->format('Y-m-d');

        ShiftRoster::create([
            'company_id' => $this->company->id,
            'employee_id' => $this->employee->id,
            'week_start' => $weekStart,
            'day' => 'Monday',
            'shift_time' => '08:00 - 16:00',
            'shift_type' => 'Morning',
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->admin)->get(route('shift-rosters.exportWeek', [
            'week_start' => $weekStart,
            'company_id' => $this->company->id,
        ]));

        $response->assertStatus(200);
        $this->assertTrue(str_contains(
            $response->headers->get('content-type', ''),
            'spreadsheetml.sheet'
        ));
    }

    public function test_dispatch_notifications_returns_gracefully_when_no_channels_enabled()
    {
        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY)->format('Y-m-d');

        \App\Models\Setting::set('roster_send_email', '0', $this->company->id);
        \App\Models\Setting::set('roster_send_whatsapp', '0', $this->company->id);
        \App\Models\Setting::set('roster_send_sms', '0', $this->company->id);

        $result = ShiftRosterNotificationService::dispatchRosterNotifications($this->company, $weekStart);

        $this->assertFalse($result['dispatched']);
        $this->assertSame(0, $result['recipients_count']);
    }
}
