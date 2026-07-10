<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Company;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use App\Models\Role;
use Carbon\Carbon;

class CompanyStructureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create a Branch (Company)
        $branch = Company::updateOrCreate(
            ['name' => 'Doha Central Branch'],
            [
                'address' => '123 Main Street, Doha',
                'phone' => '+974 1234 5678',
                'email' => 'doha@earth.com',
                'website' => 'www.earth-doha.com',
            ]
        );

        // Fetch Roles
        $hrRole = Role::where('slug', 'hr')->first();
        $managerRole = Role::where('slug', 'manager')->first();
        $employeeRole = Role::where('slug', 'employee')->first();

        // 2. Create HR Manager for the Branch
        $hrEmployee = Employee::create([
            'name' => 'Sara HR Manager',
            'gender' => 'Female',
            'employee_code' => Employee::generateCode($branch->id),
            'company_id' => $branch->id,
            'joined_date' => Carbon::now()->subMonths(12),
            'designation' => 'HR Manager',
            'manual_status' => 'active',
            'email' => 'sara.hr@earth.com',
        ]);

        $hrUser = User::updateOrCreate(
            ['email' => 'sara.hr@earth.com'],
            [
                'name' => $hrEmployee->name,
                'password' => Hash::make('password'),
                'role' => 'hr',
                'employee_id' => $hrEmployee->id,
            ]
        );
        $hrUser->assignRole($hrRole);

        // 3. Create Departments for the Branch
        $itDepartment = Department::updateOrCreate(
            ['name' => 'IT Department', 'company_id' => $branch->id],
            ['status' => 'active']
        );

        $salesDepartment = Department::updateOrCreate(
            ['name' => 'Sales Department', 'company_id' => $branch->id],
            ['status' => 'active']
        );

        // 4. Create IT Manager and Employee
        $itManager = Employee::create([
            'name' => 'John IT Manager',
            'gender' => 'Male',
            'employee_code' => Employee::generateCode($branch->id),
            'company_id' => $branch->id,
            'department_id' => $itDepartment->id,
            'joined_date' => Carbon::now()->subMonths(24),
            'designation' => 'IT Manager',
            'manual_status' => 'active',
            'email' => 'john.it@earth.com',
        ]);

        $itManagerUser = User::updateOrCreate(
            ['email' => 'john.it@earth.com'],
            [
                'name' => $itManager->name,
                'password' => Hash::make('password'),
                'role' => 'manager',
                'employee_id' => $itManager->id,
            ]
        );
        $itManagerUser->assignRole($managerRole);

        $itEmployee = Employee::create([
            'name' => 'Mike IT Staff',
            'gender' => 'Male',
            'employee_code' => Employee::generateCode($branch->id),
            'company_id' => $branch->id,
            'department_id' => $itDepartment->id,
            'reported_to' => $itManager->id,
            'joined_date' => Carbon::now()->subMonths(6),
            'designation' => 'Software Developer',
            'manual_status' => 'active',
            'email' => 'mike.it@earth.com',
        ]);

        $itEmployeeUser = User::updateOrCreate(
            ['email' => 'mike.it@earth.com'],
            [
                'name' => $itEmployee->name,
                'password' => Hash::make('password'),
                'role' => 'employee',
                'employee_id' => $itEmployee->id,
            ]
        );
        $itEmployeeUser->assignRole($employeeRole);

        // 5. Create Sales Manager and Employee
        $salesManager = Employee::create([
            'name' => 'Alice Sales Manager',
            'gender' => 'Female',
            'employee_code' => Employee::generateCode($branch->id),
            'company_id' => $branch->id,
            'department_id' => $salesDepartment->id,
            'joined_date' => Carbon::now()->subMonths(18),
            'designation' => 'Sales Manager',
            'manual_status' => 'active',
            'email' => 'alice.sales@earth.com',
        ]);

        $salesManagerUser = User::updateOrCreate(
            ['email' => 'alice.sales@earth.com'],
            [
                'name' => $salesManager->name,
                'password' => Hash::make('password'),
                'role' => 'manager',
                'employee_id' => $salesManager->id,
            ]
        );
        $salesManagerUser->assignRole($managerRole);

        $salesEmployee = Employee::create([
            'name' => 'Bob Sales Exec',
            'gender' => 'Male',
            'employee_code' => Employee::generateCode($branch->id),
            'company_id' => $branch->id,
            'department_id' => $salesDepartment->id,
            'reported_to' => $salesManager->id,
            'joined_date' => Carbon::now()->subMonths(2),
            'designation' => 'Sales Executive',
            'manual_status' => 'active',
            'email' => 'bob.sales@earth.com',
        ]);

        $salesEmployeeUser = User::updateOrCreate(
            ['email' => 'bob.sales@earth.com'],
            [
                'name' => $salesEmployee->name,
                'password' => Hash::make('password'),
                'role' => 'employee',
                'employee_id' => $salesEmployee->id,
            ]
        );
        $salesEmployeeUser->assignRole($employeeRole);

        $this->command->info('Company Structure with branch, departments, HR, managers and employees seeded successfully.');
    }
}
