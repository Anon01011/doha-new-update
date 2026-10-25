<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Proof of concept for HIGH-05 - cross tenant IDOR in
 * SalaryPostingController::store() / update().
 *
 * The controller validates `employee_id` with a GLOBAL `exists:employees,id`
 * rule, which does NOT apply the BelongsToCompany global scope. A payroll
 * manager of company A can therefore point the posting at an employee of
 * company B.
 *
 * This test asserts the SECURE behaviour (the request is rejected). It is
 * expected to FAIL on the vulnerable code and PASS once the fix is applied.
 *
 * IMPORTANT: the user in this test genuinely holds the `manage-payroll`
 * permission, so the request reaches the vulnerable code path instead of
 * being stopped by the earlier 403 permission check. A separate assertion
 * proves the permission gate is satisfied.
 */
class SalaryPostingIdorPocTest extends TestCase
{
    use RefreshDatabase;

    private function makePayrollManager(Company $company): User
    {
        $permission = Permission::create([
            'name' => 'Manage Payroll',
            'slug' => 'manage-payroll',
            'module' => 'payroll',
            'is_active' => true,
        ]);

        $role = Role::create([
            'name' => 'Payroll Manager',
            'slug' => 'payroll-manager',
            'is_active' => true,
        ]);

        $role->permissions()->attach($permission->id);

        $user = User::create([
            'name' => 'Payroll Manager',
            'email' => 'payroll.manager@example.test',
            'password' => bcrypt('Password123!'),
            'role' => 'payroll-manager',
            'company_id' => $company->id,
        ]);

        $user->roles()->attach($role->id);
        $user->refresh();

        return $user;
    }

    public function test_payroll_manager_actually_holds_the_manage_payroll_permission(): void
    {
        $companyA = Company::create(['name' => 'Company A']);
        $manager = $this->makePayrollManager($companyA);

        $this->assertTrue(
            $manager->hasPermission('manage-payroll'),
            'Precondition failed: the PoC user must hold manage-payroll, otherwise the request is stopped by the permission check and the PoC proves nothing.'
        );
        $this->assertFalse($manager->isAdmin(), 'Precondition failed: the PoC user must not be an admin.');
    }

    public function test_payroll_manager_cannot_post_salary_for_another_tenants_employee(): void
    {
        $companyA = Company::create(['name' => 'Company A']);
        $companyB = Company::create(['name' => 'Company B']);

        $ownEmployee = Employee::create([
            'name' => 'Own Employee',
            'employee_code' => 'EMP-A-1',
            'company_id' => $companyA->id,
            'is_active' => true,
            'gender' => 'Male',
            'basic_salary' => 1000.00,
        ]);

        $foreignEmployee = Employee::create([
            'name' => 'Foreign Employee',
            'employee_code' => 'EMP-B-1',
            'company_id' => $companyB->id,
            'is_active' => true,
            'gender' => 'Male',
            'basic_salary' => 1000.00,
        ]);

        $manager = $this->makePayrollManager($companyA);

        // Control: a posting for the manager's OWN employee must succeed.
        $this->actingAs($manager)->post(route('salary-postings.store'), [
            'employee_id' => $ownEmployee->id,
            'month' => 7,
            'year' => 2026,
            'basic_salary' => 1000,
        ]);

        $this->assertTrue(
            DB::table('salary_postings')->where('employee_id', $ownEmployee->id)->exists(),
            'Precondition failed: a same-tenant posting must succeed, otherwise the PoC would pass for the wrong reason.'
        );

        // The attack: post a salary for the employee of company B.
        $response = $this->actingAs($manager)->post(route('salary-postings.store'), [
            'employee_id' => $foreignEmployee->id,
            'month' => 7,
            'year' => 2026,
            'basic_salary' => 5000,
        ]);

        $createdForForeign = DB::table('salary_postings')
            ->where('employee_id', $foreignEmployee->id)
            ->where('month', 7)
            ->where('year', 2026)
            ->exists();

        $this->assertFalse(
            $createdForForeign,
            'HIGH-05 REPRODUCED: a payroll manager of company A created a salary posting for an employee of company B.'
        );

        $this->assertTrue(
            $response->status() === 403 || $response->status() === 422 || $response->isRedirect(),
            'Expected the cross-tenant request to be rejected, got HTTP ' . $response->status()
        );
    }
}
