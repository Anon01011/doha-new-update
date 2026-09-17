<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Employee;
use App\Models\Company;
use App\Models\Department;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed core configuration and organizational tables first
        $this->call([
            RolePermissionSeeder::class,
            BrandingSettingsSeeder::class,
            DropdownOptionSeeder::class,
            EarthOrganicCoffeeSeeder::class,
            BranchManagementSeeder::class,
            TestEmployeesSeeder::class,
        ]);

        $company = Company::first() ?? Company::create([
            'name' => 'Earth Organic Main Branch',
            'phone' => '+91 98765 43210',
            'email' => 'contact@earth.com',
            'address' => '101, Prestige Tower, MG Road',
        ]);

        $hrDept = Department::firstOrCreate(
            ['name' => 'Human Resources'],
            ['company_id' => $company->id]
        );

        $opsDept = Department::firstOrCreate(
            ['name' => 'Company Operations'],
            ['company_id' => $company->id]
        );

        $finDept = Department::firstOrCreate(
            ['name' => 'Finance & Accounts'],
            ['company_id' => $company->id]
        );

        // 1. Super Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@earth.com'],
            [
                'name' => 'Earth Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'company_id' => $company->id,
            ]
        );
        $adminRole = Role::where('slug', 'admin')->first();
        if ($adminRole && !$admin->roles()->where('slug', 'admin')->exists()) {
            $admin->assignRole($adminRole);
        }

        // 2. FST DEV Admin
        $fstAdmin = User::firstOrCreate(
            ['email' => 'admin@fstdev.com'],
            [
                'name' => 'FST DEV Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'company_id' => $company->id,
            ]
        );
        if ($adminRole && !$fstAdmin->roles()->where('slug', 'admin')->exists()) {
            $fstAdmin->assignRole($adminRole);
        }

        // 3. HR Manager
        $hrEmp = Employee::updateOrCreate(
            ['employee_code' => 'EMP-HR01'],
            [
                'name' => 'Human Resources Manager',
                'email' => 'hr@earth.com',
                'gender' => 'Female',
                'designation' => 'Head of HR & Talent',
                'company_id' => $company->id,
                'department_id' => $hrDept->id,
                'joined_date' => now()->subYears(3),
                'basic_salary' => 65000,
                'payment_type' => 'Bank Transfer',
                'manual_status' => 'active',
                'mobile' => '9876543201',
                'nationality' => 'Indian',
            ]
        );
        $hrUser = User::updateOrCreate(
            ['email' => 'hr@earth.com'],
            [
                'name' => 'Human Resources Manager',
                'password' => Hash::make('password'),
                'role' => 'hr',
                'company_id' => $company->id,
                'employee_id' => $hrEmp->id,
            ]
        );
        $hrRole = Role::where('slug', 'hr')->first();
        if ($hrRole && !$hrUser->roles()->where('slug', 'hr')->exists()) {
            $hrUser->assignRole($hrRole);
        }

        // 4. Branch / General Manager
        $mgrEmp = Employee::updateOrCreate(
            ['employee_code' => 'EMP-MGR01'],
            [
                'name' => 'General Branch Manager',
                'email' => 'manager@earth.com',
                'gender' => 'Male',
                'designation' => 'General Manager',
                'company_id' => $company->id,
                'department_id' => $opsDept->id,
                'joined_date' => now()->subYears(2),
                'basic_salary' => 55000,
                'payment_type' => 'Bank Transfer',
                'manual_status' => 'active',
                'mobile' => '9876543202',
                'nationality' => 'Indian',
            ]
        );
        $managerUser = User::updateOrCreate(
            ['email' => 'manager@earth.com'],
            [
                'name' => 'General Manager',
                'password' => Hash::make('password'),
                'role' => 'manager',
                'company_id' => $company->id,
                'employee_id' => $mgrEmp->id,
            ]
        );
        $managerRole = Role::where('slug', 'manager')->first();
        if ($managerRole && !$managerUser->roles()->where('slug', 'manager')->exists()) {
            $managerUser->assignRole($managerRole);
        }

        // 5. Finance & Payroll Approver
        $finEmp = Employee::updateOrCreate(
            ['employee_code' => 'EMP-FIN01'],
            [
                'name' => 'Finance & Payroll Lead',
                'email' => 'finance@earth.com',
                'gender' => 'Female',
                'designation' => 'Finance Manager',
                'company_id' => $company->id,
                'department_id' => $finDept->id,
                'joined_date' => now()->subYears(2),
                'basic_salary' => 50000,
                'payment_type' => 'Bank Transfer',
                'manual_status' => 'active',
                'mobile' => '9876543203',
                'nationality' => 'Indian',
            ]
        );
        $financeUser = User::updateOrCreate(
            ['email' => 'finance@earth.com'],
            [
                'name' => 'Finance & Payroll Approver',
                'password' => Hash::make('password'),
                'role' => 'hr',
                'company_id' => $company->id,
                'employee_id' => $finEmp->id,
            ]
        );
        $financeRole = Role::where('slug', 'finance')->first();
        if ($financeRole && !$financeUser->roles()->where('slug', 'finance')->exists()) {
            $financeUser->assignRole($financeRole);
        }

        // 6. Senior Stylist / Staff Employee
        $staffEmp = Employee::updateOrCreate(
            ['employee_code' => 'EMP-STF01'],
            [
                'name' => 'Rahul Sharma (Senior Stylist)',
                'email' => 'employee@earth.com',
                'gender' => 'Male',
                'designation' => 'Senior Hair Stylist',
                'company_id' => $company->id,
                'department_id' => $opsDept->id,
                'joined_date' => now()->subMonths(18),
                'basic_salary' => 32000,
                'payment_type' => 'Bank Transfer',
                'manual_status' => 'active',
                'mobile' => '9876543204',
                'nationality' => 'Indian',
            ]
        );
        $employeeUser = User::updateOrCreate(
            ['email' => 'employee@earth.com'],
            [
                'name' => 'Rahul Sharma',
                'password' => Hash::make('password'),
                'role' => 'employee',
                'company_id' => $company->id,
                'employee_id' => $staffEmp->id,
            ]
        );
        $employeeRole = Role::where('slug', 'employee')->first();
        if ($employeeRole && !$employeeUser->roles()->where('slug', 'employee')->exists()) {
            $employeeUser->assignRole($employeeRole);
        }
    }
}
