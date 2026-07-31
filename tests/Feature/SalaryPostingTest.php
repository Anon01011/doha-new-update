<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Company;
use App\Models\Employee;
use App\Models\SalaryPosting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalaryPostingTest extends TestCase
{
    use RefreshDatabase;

    protected $adminUser;
    protected $branch1;
    protected $emp1;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch1 = Company::create([
            'name' => 'Main Branch',
        ]);

        $this->emp1 = Employee::create([
            'name' => 'Employee One',
            'employee_code' => 'EMP001',
            'company_id' => $this->branch1->id,
            'is_active' => true,
            'gender' => 'Male',
            'basic_salary' => 1000.00,
        ]);

        $this->adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin@earthdoha.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);
    }

    public function test_salary_posting_pagination_preserves_filters()
    {
        // Create 15 employees and 15 salary posting records to trigger pagination (10 per page)
        for ($i = 1; $i <= 15; $i++) {
            $employee = Employee::create([
                'name' => 'Employee ' . $i,
                'employee_code' => 'EMP' . sprintf('%03d', $i),
                'company_id' => $this->branch1->id,
                'is_active' => true,
                'gender' => 'Male',
                'basic_salary' => 1000.00,
            ]);

            SalaryPosting::create([
                'employee_id' => $employee->id,
                'month' => 7,
                'year' => 2026,
                'net_salary' => 1000 + $i,
                'status' => 'draft',
            ]);
        }

        // Access page 2 with filters (month=7, year=2026, company_id=branch1->id)
        $response = $this->actingAs($this->adminUser)
            ->get(route('salary-postings.index', [
                'page' => 2,
                'month' => 7,
                'year' => 2026,
                'company_id' => $this->branch1->id,
            ]));

        $response->assertStatus(200);

        // Retrieve the inertia props shared with the view
        $salaryPostings = $response->original->getData()['page']['props']['salaryPostings'];

        // Verify page 2 details
        $this->assertEquals(2, $salaryPostings['current_page']);
        $this->assertEquals(15, $salaryPostings['total']);
        
        // Assert that the pagination links contain the filters
        $this->assertStringContainsString('month=7', $salaryPostings['prev_page_url']);
        $this->assertStringContainsString('year=2026', $salaryPostings['prev_page_url']);
        $this->assertStringContainsString('company_id=' . $this->branch1->id, $salaryPostings['prev_page_url']);
    }
}
