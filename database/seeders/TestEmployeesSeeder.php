<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Employee;
use App\Models\Department;
use App\Models\Company;

class TestEmployeesSeeder extends Seeder
{
    public function run()
    {
        // Ensure Company 1 exists
        $company = Company::find(1);
        if (!$company) {
            $company = Company::create([
                'id' => 1,
                'name' => 'Main Branch',
                'company_code' => 'MB001',
                'status' => 'active',
            ]);
        }

        // Ensure Department 1 exists
        $department = Department::find(1);
        if (!$department) {
            $department = Department::create([
                'id' => 1,
                'name' => 'Main Department',
                'company_id' => $company->id,
            ]);
        }

        // Create 5 dummy employees for Department 1
        for ($i = 1; $i <= 5; $i++) {
            Employee::updateOrCreate(
                ['employee_code' => 'TEST-EMP00' . $i],
                [
                    'name' => 'Test Employee ' . $i,
                    'email' => 'test' . $i . '@example.com',
                    'gender' => $i % 2 === 0 ? 'Female' : 'Male',
                    'department_id' => $department->id,
                    'company_id' => $company->id,
                    'designation' => 'Company Specialist',
                    'mobile' => '987654321' . $i,
                    'nationality' => 'Indian',
                    'joined_date' => now()->subMonths(12 - $i),
                    'basic_salary' => 25000 + ($i * 2000),
                    'manual_status' => 'active',
                    'payment_type' => 'Bank Transfer',
                ]
            );
        }
    }
}
