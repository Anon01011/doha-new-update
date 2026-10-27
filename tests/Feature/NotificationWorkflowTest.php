<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_notification_service_resolves_employee_user()
    {
        $company = Company::first() ?: Company::create(['name' => 'Test Company', 'code' => 'TC01']);
        $employee = Employee::create([
            'name' => 'Notification Test Emp',
            'employee_code' => 'NTE-' . rand(1000, 9999),
            'email' => 'notif_test_' . rand(1000, 9999) . '@example.com',
            'company_id' => $company->id,
            'gender' => 'male',
            'basic_salary' => 5000,
            'joined_date' => now()->toDateString(),
        ]);

        $user = User::create([
            'name' => 'Notification User',
            'email' => 'notif_user_' . rand(1000, 9999) . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'employee',
            'employee_id' => $employee->id,
            'company_id' => $company->id,
        ]);

        $resolvedUser = NotificationService::getUserForEmployee($employee->id);
        $this->assertNotNull($resolvedUser);
        $this->assertEquals($user->id, $resolvedUser->id);
    }

    public function test_notification_service_resolves_reporting_manager()
    {
        $company = Company::first() ?: Company::create(['name' => 'Test Company', 'code' => 'TC02']);
        
        $manager = Employee::create([
            'name' => 'Manager Emp',
            'employee_code' => 'MGR-' . rand(1000, 9999),
            'email' => 'mgr_' . rand(1000, 9999) . '@example.com',
            'company_id' => $company->id,
            'gender' => 'male',
            'basic_salary' => 8000,
            'joined_date' => now()->toDateString(),
        ]);

        $managerUser = User::create([
            'name' => 'Manager User',
            'email' => 'mgr_user_' . rand(1000, 9999) . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'manager',
            'employee_id' => $manager->id,
            'company_id' => $company->id,
        ]);

        $subordinate = Employee::create([
            'name' => 'Subordinate Emp',
            'employee_code' => 'SUB-' . rand(1000, 9999),
            'email' => 'sub_' . rand(1000, 9999) . '@example.com',
            'company_id' => $company->id,
            'gender' => 'male',
            'reports_to_id' => $manager->id,
            'basic_salary' => 4000,
            'joined_date' => now()->toDateString(),
        ]);

        $resolvedManager = NotificationService::getReportingManagerUser($subordinate->id);
        $this->assertNotNull($resolvedManager);
        $this->assertEquals($managerUser->id, $resolvedManager->id);
    }

    public function test_notification_index_accessible_by_authenticated_user()
    {
        $user = User::first();
        if (!$user) {
            $user = User::create([
                'name' => 'Test User',
                'email' => 'test_user_' . rand(1000, 9999) . '@example.com',
                'password' => bcrypt('password'),
                'role' => 'admin',
            ]);
        }

        $response = $this->actingAs($user)->get(route('notifications.index'));
        $response->assertStatus(200);
    }
}
