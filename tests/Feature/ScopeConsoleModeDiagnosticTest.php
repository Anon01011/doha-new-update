<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScopeConsoleModeDiagnosticTest extends TestCase
{
    use RefreshDatabase;

    public function test_scope_behaviour_in_test_environment(): void
    {
        fwrite(STDERR, "\n=== DIAGNOSTIC ===\n");
        fwrite(STDERR, 'runningInConsole(): ' . var_export(app()->runningInConsole(), true) . "\n");
        fwrite(STDERR, 'PHP_SAPI: ' . PHP_SAPI . "\n");

        $companyA = Company::create(['name' => 'CoA ' . uniqid()]);
        $companyB = Company::create(['name' => 'CoB ' . uniqid()]);

        $employeeB = Employee::create([
            'name' => 'Foreign Person',
            'employee_code' => 'FB' . uniqid(),
            'company_id' => $companyB->id,
            'is_active' => true,
            'gender' => 'Male',
            'basic_salary' => 1000.00,
        ]);

        $userA = User::create([
            'name' => 'Manager A',
            'email' => 'mgr' . uniqid() . '@example.test',
            'password' => bcrypt('Password123!'),
            'role' => 'hr',
            'company_id' => $companyA->id,
        ]);

        $this->actingAs($userA);

        fwrite(STDERR, 'Auth::hasUser(): ' . var_export(\Illuminate\Support\Facades\Auth::hasUser(), true) . "\n");
        fwrite(STDERR, 'user->isAdmin(): ' . var_export($userA->isAdmin(), true) . "\n");

        $found = Employee::find($employeeB->id);
        fwrite(STDERR, 'Employee::find(foreign id) => ' . ($found ? 'RETURNED (scope NOT applied)' : 'null (scope applied)') . "\n");

        fwrite(STDERR, 'Employee::count() => ' . Employee::count() . "\n");
        fwrite(STDERR, 'DB raw employees count => ' . \Illuminate\Support\Facades\DB::table('employees')->count() . "\n");

        fwrite(STDERR, "=== END DIAGNOSTIC ===\n");

        $this->assertTrue(true);
    }
}
