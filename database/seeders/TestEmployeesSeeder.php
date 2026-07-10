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
            Employee::create([
                'name' => 'Test Employee ' . $i,
                'first_name' => 'Test',
                'last_name' => 'Employee ' . $i,
                'employee_code' => 'EMP00' . $i,
                'email' => 'test' . $i . '@example.com',
                'department_id' => $department->id,
                'company_id' => $company->id,
                'designation' => 'Software Engineer',
                'mobile' => '123456789' . $i,
                'nationality' => 'Qatari',
                'joining_date' => now(),
                'status' => 'active',
                'manual_status' => 'active',
            ]);
        }
    }
}
