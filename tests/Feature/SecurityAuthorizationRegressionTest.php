<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeEvaluation;
use App\Models\ExpenseCategory;
use App\Models\ExpenseClaim;
use App\Models\OffboardingRequest;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression tests for the security audit findings.
 *
 * Each test asserts the *opposite* of the previously proven exploit: the
 * unauthorised actor must now be rejected with 403, and the protected record
 * must remain unchanged.
 *
 * @see security_audit_report.md (CRITICAL-01, CRITICAL-02, HIGH-01..HIGH-04)
 */
class SecurityAuthorizationRegressionTest extends TestCase
{
    use RefreshDatabase;

    protected Company $company;

    protected ExpenseCategory $expenseCategory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Main Branch']);

        // ── Roles ──────────────────────────────────────────────────────────
        foreach (['admin' => 'Administrator', 'hr' => 'HR', 'manager' => 'Manager', 'employee' => 'Employee'] as $slug => $name) {
            Role::create(['name' => $name, 'slug' => $slug, 'is_active' => true]);
        }

        // ── Expense category (required FK on expense_claims) ──────────────
        $this->expenseCategory = ExpenseCategory::create([
            'company_id' => $this->company->id,
            'name' => 'Travel',
            'code' => 'TRV',
            'policy_limit_amount' => 1000,
            'requires_receipt' => true,
            'is_tax_deductible' => false,
            'is_active' => true,
        ]);

        // ── Permissions ────────────────────────────────────────────────────
        foreach (['create-employees', 'edit-employees', 'manage-roles'] as $slug) {
            Permission::create(['name' => $slug, 'slug' => $slug, 'module' => 'employee']);
        }
    }

    /**
     * Create an employee + linked user in the given company.
     */
    protected function makeEmployee(string $name, string $email, string $role = 'employee'): Employee
    {
        $employee = Employee::create([
            'name' => $name,
            'email' => $email,
            'employee_code' => strtoupper(str_replace(' ', '', $name)) . '@' . substr(md5($email), 0, 6),
            'company_id' => $this->company->id,
            'is_active' => true,
            'gender' => 'Male',
            'basic_salary' => 1000,
        ]);

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => bcrypt('password'),
            'role' => $role,
            'employee_id' => $employee->id,
            'company_id' => $this->company->id,
        ]);

        $user->roles()->sync([Role::where('slug', $role)->value('id')]);

        $employee->setRelation('user', $user);

        return $employee;
    }

    // =====================================================================
    // CRITICAL-01 — privilege escalation via employee create/update
    // =====================================================================

    public function test_non_admin_with_create_permission_cannot_grant_admin_role_on_create()
    {
        $hrUser = $this->makeEmployee('HR Person', 'hr@example.com', 'hr');
        $hrUser->user->roles()->sync([Role::where('slug', 'hr')->value('id')]);
        $hrUser->user->permissions()->sync([Permission::where('slug', 'create-employees')->value('id')]);

        $response = $this->actingAs($hrUser->user)->post(route('employees.store'), [
            'name' => 'Malicious Admin',
            'email' => 'malicious@example.com',
            'gender' => 'Male',
            'role' => 'admin',
            'company_id' => $this->company->id,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(403);

        // The account must not have been created with an admin role.
        $created = User::where('email', 'malicious@example.com')->first();
        $this->assertNull($created, 'A rejected request must not create the account.');
    }

    public function test_non_admin_cannot_self_escalate_via_update()
    {
        $employee = $this->makeEmployee('Self Escalator', 'escalator@example.com', 'employee');
        $employee->user->roles()->sync([Role::where('slug', 'employee')->value('id')]);
        $employee->user->permissions()->sync([Permission::where('slug', 'edit-employees')->value('id')]);

        $response = $this->actingAs($employee->user)->put(route('employees.update', $employee->id), [
            'name' => $employee->name,
            'email' => $employee->email,
            'role' => 'admin',
            'company_id' => $this->company->id,
        ]);

        $response->assertStatus(403);

        $employee->refresh();
        $this->assertNotEquals('admin', $employee->user->fresh()->role, 'The user must not have been escalated to admin.');
    }

    public function test_admin_may_still_assign_admin_role()
    {
        $admin = $this->makeEmployee('Administrator', 'admin@example.com', 'admin');

        $response = $this->actingAs($admin->user)->post(route('employees.store'), [
            'name' => 'Legit Admin',
            'email' => 'legit-admin@example.com',
            'gender' => 'Male',
            'role' => 'admin',
            'company_id' => $this->company->id,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertNotNull(User::where('email', 'legit-admin@example.com')->first());
    }

    // =====================================================================
    // HIGH-01 — ExpenseClaim IDOR
    // =====================================================================

    public function test_employee_cannot_update_another_employees_expense_claim()
    {
        $attacker = $this->makeEmployee('Attacker', 'attacker@example.com', 'employee');
        $victim = $this->makeEmployee('Victim', 'victim@example.com', 'employee');

        $claim = ExpenseClaim::create([
            'claim_number' => 'EXP-0001',
            'company_id' => $this->company->id,
            'employee_id' => $victim->id,
            'expense_category_id' => $this->expenseCategory->id,
            'expense_date' => now()->toDateString(),
            'amount' => 100,
            'business_purpose' => 'Original purpose',
            'status' => 'draft',
            'is_locked' => false,
        ]);

        $response = $this->actingAs($attacker->user)->put(route('expenses.update', $claim->id), [
            'amount' => 99999,
            'business_purpose' => 'Tampered by attacker',
        ]);

        $response->assertStatus(403);

        $claim->refresh();
        $this->assertEquals(100, (float) $claim->amount, 'The claim amount must be unchanged.');
        $this->assertEquals('Original purpose', $claim->business_purpose);
    }

    public function test_employee_can_update_their_own_expense_claim()
    {
        $employee = $this->makeEmployee('Owner', 'owner@example.com', 'employee');

        $claim = ExpenseClaim::create([
            'claim_number' => 'EXP-0002',
            'company_id' => $this->company->id,
            'employee_id' => $employee->id,
            'expense_category_id' => $this->expenseCategory->id,
            'expense_date' => now()->toDateString(),
            'amount' => 100,
            'business_purpose' => 'Original purpose',
            'status' => 'draft',
            'is_locked' => false,
        ]);

        $response = $this->actingAs($employee->user)->put(route('expenses.update', $claim->id), [
            'expense_category_id' => $this->expenseCategory->id,
            'expense_date' => now()->toDateString(),
            'amount' => 150,
            'payment_method' => 'cash',
            'business_purpose' => 'Updated purpose',
        ]);

        $response->assertSessionHasNoErrors();
        $claim->refresh();
        $this->assertEquals(150, (float) $claim->amount);
    }

    // =====================================================================
    // HIGH-02 — EmployeeEvaluation IDOR
    // =====================================================================

    public function test_employee_cannot_update_another_employees_evaluation()
    {
        $attacker = $this->makeEmployee('Eval Attacker', 'evalattacker@example.com', 'employee');
        $victim = $this->makeEmployee('Eval Victim', 'evalvictim@example.com', 'employee');

        $evaluation = EmployeeEvaluation::create([
            'employee_id' => $victim->id,
            'evaluator_id' => $attacker->user->id,
            'month' => 1,
            'year' => 2026,
            'cycle_type' => 'monthly',
            'status' => 'draft',
            'overall_score' => 70,
            'comments' => 'Original comments',
            'is_locked' => false,
            'company_id' => $this->company->id,
        ]);

        $response = $this->actingAs($attacker->user)->put(route('evaluations.update', $evaluation->id), [
            'comments' => 'Injected by attacker',
            'increment_percentage' => 50,
        ]);

        $response->assertStatus(403);

        $evaluation->refresh();
        $this->assertEquals('Original comments', $evaluation->comments);
    }

    // =====================================================================
    // CRITICAL-02 / HIGH-03 — Offboarding
    // =====================================================================

    public function test_plain_employee_cannot_approve_an_offboarding_request()
    {
        $employee = $this->makeEmployee('Offboard Target', 'offboard@example.com', 'employee');
        $attacker = $this->makeEmployee('Approver Attacker', 'approver@example.com', 'employee');

        $offboarding = OffboardingRequest::create([
            'request_number' => 'OFF-0001',
            'employee_id' => $employee->id,
            'initiated_by' => $attacker->user->id,
            'status' => 'pending_approval',
            'separation_reason' => 'resignation',
            'proposed_last_working_day' => now()->addDays(30)->toDateString(),
        ]);

        $response = $this->actingAs($attacker->user)->post(route('offboarding.approve', $offboarding->id), [
            'role' => 'manager',
        ]);

        $response->assertStatus(403);

        $offboarding->refresh();
        $this->assertNotEquals($attacker->user->id, $offboarding->manager_id, 'The attacker must not be recorded as the approver.');
        $this->assertEquals('pending_approval', $offboarding->status);
    }

    public function test_plain_employee_cannot_delete_another_employees_offboarding_request()
    {
        $employee = $this->makeEmployee('Delete Target', 'deletetarget@example.com', 'employee');
        $attacker = $this->makeEmployee('Delete Attacker', 'deleteattacker@example.com', 'employee');

        $offboarding = OffboardingRequest::create([
            'request_number' => 'OFF-0002',
            'employee_id' => $employee->id,
            'initiated_by' => $attacker->user->id,
            'status' => 'draft',
            'separation_reason' => 'resignation',
            'proposed_last_working_day' => now()->addDays(30)->toDateString(),
        ]);

        $response = $this->actingAs($attacker->user)->delete(route('offboarding.destroy', $offboarding->id));

        $response->assertStatus(403);
        $this->assertDatabaseHas('offboarding_requests', ['id' => $offboarding->id]);
    }

    public function test_plain_employee_cannot_reject_an_offboarding_request()
    {
        $employee = $this->makeEmployee('Reject Target', 'rejecttarget@example.com', 'employee');
        $attacker = $this->makeEmployee('Reject Attacker', 'rejectattacker@example.com', 'employee');

        $offboarding = OffboardingRequest::create([
            'request_number' => 'OFF-0003',
            'employee_id' => $employee->id,
            'initiated_by' => $attacker->user->id,
            'status' => 'pending_approval',
            'separation_reason' => 'resignation',
            'proposed_last_working_day' => now()->addDays(30)->toDateString(),
        ]);

        $response = $this->actingAs($attacker->user)->post(route('offboarding.reject', $offboarding->id), [
            'reason' => 'Because I want to',
        ]);

        $response->assertStatus(403);
        $offboarding->refresh();
        $this->assertEquals('pending_approval', $offboarding->status);
    }

    public function test_hr_can_approve_an_offboarding_request()
    {
        $employee = $this->makeEmployee('HR Target', 'hrtarget@example.com', 'employee');
        $hr = $this->makeEmployee('HR Approver', 'hrapprover@example.com', 'hr');

        $offboarding = OffboardingRequest::create([
            'request_number' => 'OFF-0004',
            'employee_id' => $employee->id,
            'initiated_by' => $hr->user->id,
            'status' => 'pending_approval',
            'separation_reason' => 'resignation',
            'proposed_last_working_day' => now()->addDays(30)->toDateString(),
        ]);

        $response = $this->actingAs($hr->user)->post(route('offboarding.approve', $offboarding->id), [
            'role' => 'hr',
        ]);

        $response->assertSessionHasNoErrors();
        $offboarding->refresh();
        $this->assertEquals($hr->user->id, $offboarding->hr_user_id);
    }

    // =====================================================================
    // LOW-01 — EmployeeController::create() must not reference an undefined
    //            $salaryComponents variable
    // =====================================================================

    public function test_employee_create_page_renders_without_undefined_variable()
    {
        $admin = $this->makeEmployee('Creator Admin', 'creator@example.com', 'admin');

        $response = $this->actingAs($admin->user)->get(route('employees.create'));

        $response->assertStatus(200);
        $response->assertSee('salaryComponents', false);
    }
}