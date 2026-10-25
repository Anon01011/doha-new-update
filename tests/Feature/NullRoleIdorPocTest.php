<?php

namespace Tests\Feature;

use App\Models\Advance;
use App\Models\Company;
use App\Models\Employee;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Proof-of-concept for the "NULL role bypasses ownership checks" defect.
 */
class NullRoleIdorPocTest extends TestCase
{
    use RefreshDatabase;

    private function makeCompany(): Company
    {
        return Company::create(['name' => 'Poc Branch ' . uniqid(), 'code' => strtoupper(substr(md5(uniqid()), 0, 6))]);
    }

    private function makeNullRoleUser(Employee $employee): User
    {
        return User::create([
            'name'        => $employee->name,
            'email'       => uniqid() . '@example.test',
            'password'    => bcrypt('Passw0rd!'),
            'role'        => null,
            'employee_id' => $employee->id,
            'company_id'  => $employee->company_id,
        ]);
    }

    private function makeEmployee(Company $company, string $name): Employee
    {
        return Employee::create([
            'name'          => $name,
            'employee_code' => strtoupper(substr(md5(uniqid()), 0, 10)),
            'company_id'    => $company->id,
            'email'         => uniqid() . '@example.test',
            'gender'        => 'male',
        ]);
    }

    public function test_null_role_user_can_view_another_employees_loan(): void
    {
        $company = $this->makeCompany();
        $attackerEmp = $this->makeEmployee($company, 'Attacker');
        $victimEmp   = $this->makeEmployee($company, 'Victim');
        $attacker = $this->makeNullRoleUser($attackerEmp);

        $loan = Loan::create([
            'employee_id'   => $victimEmp->id,
            'company_id'    => $company->id,
            'loan_type'     => 'Personal',
            'amount'        => 5000,
            'tenure_months' => 12,
            'start_date'    => now()->toDateString(),
            'monthly_installment' => 500,
            'status'        => 'pending',
        ]);

        $this->actingAs($attacker)->get("/loans/{$loan->id}")->assertForbidden();
    }

    public function test_null_role_user_can_view_another_employees_advance(): void
    {
        $company = $this->makeCompany();
        $attackerEmp = $this->makeEmployee($company, 'Attacker');
        $victimEmp   = $this->makeEmployee($company, 'Victim');
        $attacker = $this->makeNullRoleUser($attackerEmp);

        $advance = Advance::create([
            'employee_id'  => $victimEmp->id,
            'company_id'   => $company->id,
            'amount'       => 2500,
            'request_date' => now()->toDateString(),
            'status'       => 'pending',
        ]);

        $this->actingAs($attacker)->get("/advances/{$advance->id}")->assertForbidden();
    }

    public function test_null_role_user_can_delete_another_employees_pending_advance(): void
    {
        $company = $this->makeCompany();
        $attackerEmp = $this->makeEmployee($company, 'Attacker');
        $victimEmp   = $this->makeEmployee($company, 'Victim');
        $attacker = $this->makeNullRoleUser($attackerEmp);

        $advance = Advance::create([
            'employee_id'  => $victimEmp->id,
            'company_id'   => $company->id,
            'amount'       => 2500,
            'request_date' => now()->toDateString(),
            'status'       => 'pending',
        ]);

        $this->actingAs($attacker)->delete("/advances/{$advance->id}")->assertForbidden();
        $this->assertDatabaseHas('advances', ['id' => $advance->id]);
    }
}
