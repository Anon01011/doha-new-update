<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Company;
use App\Models\Employee;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class BranchManagementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = [
            'Doha Main Branch',
            'Al Rayyan Branch',
            'Lusail Waterfront',
            'The Pearl Outlet'
        ];

        $managerRole = Role::where('slug', 'manager')->first();
        $hrRole = Role::where('slug', 'hr')->first();
        $employeeRole = Role::where('slug', 'employee')->first();

        foreach ($branches as $branchName) {
            // 1. Create Branch (Company)
            $branch = Company::updateOrCreate(
                ['name' => $branchName],
                [
                    'email' => strtolower(Str::slug($branchName)) . '@example.com',
                    'address' => 'Doha, Qatar',
                ]
            );

            // 2. Create HR for this branch
            $this->createBranchUser($branch, 'hr', 'HR Manager', $hrRole);

            // 3. Create Manager for this branch
            $this->createBranchUser($branch, 'manager', 'Branch Manager', $managerRole);

            // 4. Create some Employees for this branch
            for ($i = 1; $i <= 3; $i++) {
                $this->createBranchUser($branch, "employee{$i}", "Staff Member {$i}", $employeeRole);
            }
        }
    }

    private function createBranchUser($branch, $prefix, $roleName, $roleModel)
    {
        $slug = Str::slug($branch->name);
        $email = "{$prefix}.{$slug}@example.com";
        $code = strtoupper(substr($prefix, 0, 1)) . rand(1000, 9999);

        // Create Employee record
        $employee = Employee::updateOrCreate(
            ['email' => $email],
            [
                'name' => "{$branch->name} {$roleName}",
                'employee_code' => $code,
                'company_id' => $branch->id,
                'designation' => $roleName,
                'gender' => 'Male',
                'joined_date' => now()->subMonths(rand(1, 12)),
                'manual_status' => 'active',
            ]
        );

        // Create User account
        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $employee->name,
                'password' => Hash::make('password'),
                'role' => $roleModel->slug, // Legacy role field
                'employee_id' => $employee->id,
                'company_id' => $branch->id,
                'email_verified_at' => now(),
            ]
        );

        // Assign Role (RBAC)
        if (!$user->roles()->where('role_id', $roleModel->id)->exists()) {
            $user->roles()->attach($roleModel->id);
        }

        return $user;
    }
}
