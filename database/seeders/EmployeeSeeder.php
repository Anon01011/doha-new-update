<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\User;
use App\Models\Company;
use App\Models\Department;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure we have a company (Branch)
        $company = Company::firstOrCreate(
            ['name' => 'Main Branch']
        );

        // Ensure we have a department
        $department = Department::firstOrCreate(
            ['name' => 'Operations'],
            ['company_id' => $company->id]
        );

        // Create the Employee record
        $employee = Employee::updateOrCreate(
            ['employee_code' => 'EMP001'],
            [
                'name' => 'John Doe',
                'email' => 'john.doe@example.com',
                'gender' => 'Male',
                'designation' => 'Senior Staff',
                'company_id' => $company->id,
                'department_id' => $department->id,
                'joined_date' => now()->subYear(),
                'basic_salary' => 3500,
                'payment_type' => 'Bank Transfer',
                'visa_type' => 'Work Permit',
                'employee_category' => 'Full-time',
            ]
        );

        // Create or update the User record and link to Employee
        $user = User::updateOrCreate(
            ['email' => 'employee@example.com'],
            [
                'name' => 'John Doe',
                'password' => Hash::make('password'),
                'role' => 'employee',
                'employee_id' => $employee->id,
            ]
        );

        // Assign the employee role if it exists
        $employeeRole = Role::where('slug', 'employee')->first();
        if ($employeeRole && !$user->roles()->where('role_id', $employeeRole->id)->exists()) {
            $user->roles()->attach($employeeRole->id);
        }
    }
}
