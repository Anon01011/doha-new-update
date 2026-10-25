<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Verifies the BelongsToCompany tenant scope behaviour when it is ACTIVE
 * (i.e. the way it behaves in a real web request).
 *
 * The scope short-circuits on `app()->runningInConsole()`, so inside PHPUnit
 * it is inert. Laravel resolves that flag from the APP_RUNNING_IN_CONSOLE
 * environment variable (see Illuminate\Foundation\Application::runningInConsole)
 * and caches it on the application instance, so the test sets the variable
 * and clears the cached value to force the production behaviour.
 */
class ScopeProductionBehaviourTest extends TestCase
{
    use RefreshDatabase;

    public function test_scope_filters_employee_when_active(): void
    {
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

        $this->forceScopeActive();

        $found = Employee::find($employeeB->id);

        fwrite(STDERR, "\n=== PRODUCTION SCOPE BEHAVIOUR ===\n");
        fwrite(STDERR, 'runningInConsole(): ' . var_export(app()->runningInConsole(), true) . "\n");
        fwrite(STDERR, 'Employee::find(foreign id) with scope ACTIVE => '
            . ($found ? 'RETURNED (scope NOT filtering!)' : 'null (scope filtering correctly)') . "\n");
        fwrite(STDERR, 'Employee::count() => ' . Employee::count() . "\n");
        fwrite(STDERR, 'DB raw employees count => ' . DB::table('employees')->count() . "\n");
        fwrite(STDERR, "=== END ===\n");

        $this->assertNull(
            $found,
            'With the scope active the foreign employee must not be resolvable.'
        );
    }

    /**
     * Make app()->runningInConsole() report false for the duration of the test.
     *
     * Laravel reads the flag from APP_RUNNING_IN_CONSOLE and caches it on the
     * application instance, so the variable has to be set and the cached value
     * cleared for the production behaviour to be observed.
     */
    private function forceScopeActive(): void
    {
        putenv('APP_RUNNING_IN_CONSOLE=false');
        $_ENV['APP_RUNNING_IN_CONSOLE'] = 'false';
        $_SERVER['APP_RUNNING_IN_CONSOLE'] = 'false';

        $reflection = new \ReflectionClass($this->app);
        $property = $reflection->getProperty('isRunningInConsole');
        $property->setAccessible(true);
        $property->setValue($this->app, false);
    }
}
