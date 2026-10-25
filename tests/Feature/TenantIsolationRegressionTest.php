<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Tenant isolation regression suite.
 *
 * The BelongsToCompany global scope is inert inside PHPUnit because it
 * short-circuits on app()->runningInConsole(). Every test in this file forces
 * the scope ACTIVE so the assertions reflect real production web requests.
 *
 * IMPORTANT: each test contains a CONTROL assertion. The control proves the
 * request for the attacker's OWN employee succeeds, which proves the request
 * was not rejected by an unrelated gate (missing permission, missing related
 * record, wrong field name). Only when the control passes does the cross
 * tenant assertion actually prove tenant isolation.
 */
class TenantIsolationRegressionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Force the production behaviour of the tenant scope.
        putenv('APP_RUNNING_IN_CONSOLE=false');
        $_ENV['APP_RUNNING_IN_CONSOLE'] = 'false';
        $_SERVER['APP_RUNNING_IN_CONSOLE'] = 'false';

        $property = (new \ReflectionClass($this->app))->getProperty('isRunningInConsole');
        $property->setAccessible(true);
        $property->setValue($this->app, false);

        // Forcing runningInConsole() to false also disables the
        // "runningUnitTests()" short-circuit inside VerifyCsrfToken, so the
        // CSRF check has to be excluded explicitly for the forged requests to
        // reach the controller. CSRF itself is covered by a dedicated test.
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);

        // Notifications are not part of the security behaviour under test and the
        // SQLite test schema cannot store the notification payload.
        Notification::fake();
    }

    private function makeUser(Company $company, array $permissions): User
    {
        $user = User::create([
            'name' => 'Tenant Tester',
            'email' => uniqid('tt') . '@example.test',
            'password' => bcrypt('Password123!'),
            'role' => 'manager',
            'company_id' => $company->id,
        ]);

        $role = Role::create([
            'name' => 'Role ' . uniqid(),
            'slug' => 'tt-' . uniqid(),
            'is_active' => true,
        ]);

        foreach ($permissions as $name) {
            $permission = Permission::create([
                'name' => $name,
                'slug' => Str::slug($name),
                'module' => 'testing',
                'is_active' => true,
            ]);
            $role->permissions()->attach($permission->id);
        }

        $user->roles()->attach($role->id);
        $user->refresh();

        return $user;
    }

    private function makeEmployee(Company $company, string $label): Employee
    {
        return Employee::create([
            'name' => $label,
            'employee_code' => strtoupper(substr(md5($label . uniqid()), 0, 10)),
            'company_id' => $company->id,
            'is_active' => true,
            'gender' => 'Male',
            'basic_salary' => 1000.00,
        ]);
    }

    public function test_tenant_scope_is_active_in_this_test_suite(): void
    {
        $companyA = Company::create(['name' => 'CoA ' . uniqid()]);
        $companyB = Company::create(['name' => 'CoB ' . uniqid()]);

        $employeeB = $this->makeEmployee($companyB, 'Foreign ' . uniqid());
        $userA = $this->makeUser($companyA, []);

        $this->actingAs($userA);

        $this->assertFalse(app()->runningInConsole(), 'The scope must be active for this suite to be meaningful.');
        $this->assertNull(
            Employee::find($employeeB->id),
            'The tenant scope must hide employees of another company.'
        );
    }

    public function test_bulk_transfer_cannot_move_another_tenants_employee(): void
    {
        $companyA = Company::create(['name' => 'CoA ' . uniqid()]);
        $companyB = Company::create(['name' => 'CoB ' . uniqid()]);

        $ownEmployee = $this->makeEmployee($companyA, 'Own ' . uniqid());
        $foreignEmployee = $this->makeEmployee($companyB, 'Foreign ' . uniqid());

        $departmentA = Department::create(['name' => 'Dept A ' . uniqid(), 'company_id' => $companyA->id]);

        $userA = $this->makeUser($companyA, ['Edit Employees']);
        $this->actingAs($userA);

        // CONTROL: moving the attacker's OWN employee must succeed. This proves
        // the request reaches the vulnerable code and is not blocked by an
        // unrelated permission or validation gate.
        $this->post(route('employees.bulk-transfer'), [
            'employee_ids' => [$ownEmployee->id],
            'company_id' => $companyA->id,
            'department_id' => $departmentA->id,
        ]);

        $this->assertSame(
            $companyA->id,
            (int) DB::table('employees')->where('id', $ownEmployee->id)->value('company_id'),
            'CONTROL FAILED: the attacker could not even move their own employee, so the test proves nothing.'
        );

        // ATTACK: move company B's employee into company A.
        $this->post(route('employees.bulk-transfer'), [
            'employee_ids' => [$foreignEmployee->id],
            'company_id' => $companyA->id,
            'department_id' => $departmentA->id,
        ]);

        $this->assertSame(
            $companyB->id,
            (int) DB::table('employees')->where('id', $foreignEmployee->id)->value('company_id'),
            'The foreign employee must not have been transferred.'
        );
    }

    public function test_grievance_cannot_be_filed_for_another_tenants_employee(): void
    {
        $companyA = Company::create(['name' => 'CoA ' . uniqid()]);
        $companyB = Company::create(['name' => 'CoB ' . uniqid()]);

        $ownEmployee = $this->makeEmployee($companyA, 'Own ' . uniqid());
        $foreignEmployee = $this->makeEmployee($companyB, 'Foreign ' . uniqid());

        $userA = $this->makeUser($companyA, []);
        $this->actingAs($userA);

        // CONTROL: a grievance for the attacker's OWN employee must succeed.
        $this->post(route('grievances.store'), [
            'employee_id' => $ownEmployee->id,
            'category' => 'General',
            'priority' => 'low',
            'subject' => 'Control probe',
            'description' => 'Control request.',
        ]);

        $this->assertSame(
            1,
            DB::table('grievances')->where('employee_id', $ownEmployee->id)->count(),
            'CONTROL FAILED: the grievance for the own employee was not created, so the test proves nothing.'
        );

        // ATTACK: file a grievance against company B's employee.
        $this->post(route('grievances.store'), [
            'employee_id' => $foreignEmployee->id,
            'category' => 'General',
            'priority' => 'low',
            'subject' => 'Cross tenant probe',
            'description' => 'Attempt to file a grievance against a foreign employee.',
        ]);

        $this->assertSame(
            0,
            DB::table('grievances')->where('employee_id', $foreignEmployee->id)->count(),
            'A grievance must not be created against an employee of another company.'
        );
    }

    public function test_warning_letter_cannot_target_another_tenants_employee(): void
    {
        $companyA = Company::create(['name' => 'CoA ' . uniqid()]);
        $companyB = Company::create(['name' => 'CoB ' . uniqid()]);

        $ownEmployee = $this->makeEmployee($companyA, 'Own ' . uniqid());
        $foreignEmployee = $this->makeEmployee($companyB, 'Foreign ' . uniqid());

        $userA = $this->makeUser($companyA, ['Manage Warning Letters']);
        $this->actingAs($userA);

        // CONTROL
        $this->post(route('warning-letters.store'), [
            'employee_id' => $ownEmployee->id,
            'type' => 'Verbal',
            'subject' => 'Control probe',
            'content' => 'Control request.',
        ]);

        $this->assertSame(
            1,
            DB::table('warning_letters')->where('employee_id', $ownEmployee->id)->count(),
            'CONTROL FAILED: the warning letter for the own employee was not created, so the test proves nothing.'
        );

        // ATTACK
        $this->post(route('warning-letters.store'), [
            'employee_id' => $foreignEmployee->id,
            'type' => 'Verbal',
            'subject' => 'Cross tenant probe',
            'content' => 'Attempt to issue a warning letter to a foreign employee.',
        ]);

        $this->assertSame(
            0,
            DB::table('warning_letters')->where('employee_id', $foreignEmployee->id)->count(),
            'A warning letter must not be issued to an employee of another company.'
        );
    }

    public function test_loan_cannot_be_created_for_another_tenants_employee(): void
    {
        $companyA = Company::create(['name' => 'CoA ' . uniqid()]);
        $companyB = Company::create(['name' => 'CoB ' . uniqid()]);

        $ownEmployee = $this->makeEmployee($companyA, 'Own ' . uniqid());
        $foreignEmployee = $this->makeEmployee($companyB, 'Foreign ' . uniqid());

        $userA = $this->makeUser($companyA, ['Manage Loans']);
        $this->actingAs($userA);

        // CONTROL
        $this->post(route('loans.store'), [
            'employee_id' => $ownEmployee->id,
            'loan_type' => 'Personal',
            'amount' => 500,
            'tenure_months' => 3,
            'start_date' => now()->toDateString(),
        ]);

        $this->assertSame(
            1,
            DB::table('loans')->where('employee_id', $ownEmployee->id)->count(),
            'CONTROL FAILED: the loan for the own employee was not created, so the test proves nothing.'
        );

        // ATTACK
        $this->post(route('loans.store'), [
            'employee_id' => $foreignEmployee->id,
            'loan_type' => 'Personal',
            'amount' => 500,
            'tenure_months' => 3,
            'start_date' => now()->toDateString(),
        ]);

        $this->assertSame(
            0,
            DB::table('loans')->where('employee_id', $foreignEmployee->id)->count(),
            'A loan must not be created against an employee of another company.'
        );
    }

    public function test_leave_request_cannot_be_created_for_another_tenants_employee(): void
    {
        $companyA = Company::create(['name' => 'CoA ' . uniqid()]);
        $companyB = Company::create(['name' => 'CoB ' . uniqid()]);

        $ownEmployee = $this->makeEmployee($companyA, 'Own ' . uniqid());
        $foreignEmployee = $this->makeEmployee($companyB, 'Foreign ' . uniqid());

        $leaveType = LeaveType::create([
            'name' => 'Annual ' . uniqid(),
            'code' => 'ANN' . substr(uniqid(), 0, 4),
            'company_id' => $companyA->id,
            'is_active' => true,
            'max_days_per_year' => 30,
            'min_notice_days' => 0,
        ]);

        // The controller refuses a request that exceeds the available balance,
        // so a balance row has to exist for the control request to succeed.
        LeaveBalance::create([
            'employee_id' => $ownEmployee->id,
            'leave_type_id' => $leaveType->id,
            'company_id' => $companyA->id,
            'year' => now()->year,
            'total_days' => 30,
            'used_days' => 0,
            'remaining_days' => 30,
        ]);

        $userA = $this->makeUser($companyA, []);
        $this->actingAs($userA);

        // CONTROL
        $this->post(route('leave-requests.store'), [
            'employee_id' => $ownEmployee->id,
            'leave_type_id' => $leaveType->id,
            'start_date' => now()->addDay()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'reason' => 'Control probe',
        ]);

        $this->assertSame(
            1,
            DB::table('leave_requests')->where('employee_id', $ownEmployee->id)->count(),
            'CONTROL FAILED: the leave request for the own employee was not created, so the test proves nothing.'
        );

        // ATTACK
        $this->post(route('leave-requests.store'), [
            'employee_id' => $foreignEmployee->id,
            'leave_type_id' => $leaveType->id,
            'start_date' => now()->addDay()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'reason' => 'Cross tenant probe',
        ]);

        $this->assertSame(
            0,
            DB::table('leave_requests')->where('employee_id', $foreignEmployee->id)->count(),
            'A leave request must not be created for an employee of another company.'
        );
    }
}
