<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles and permissions first
        $this->call([
            RolePermissionSeeder::class,
            BrandingSettingsSeeder::class,
            DropdownOptionSeeder::class,
            EarthOrganicCoffeeSeeder::class,
            BranchManagementSeeder::class,
        ]);

        // Create the initial admin user as requested
        $admin = User::firstOrCreate(
            ['email' => 'admin@earth.com'],
            [
                'name' => 'EarthAdmin',
                'password' => Hash::make('password'),
                'role' => 'admin'
            ]
        );

        // Ensure the admin user has the admin role assigned
        if (!$admin->roles()->where('slug', 'admin')->exists()) {
            $adminRole = \App\Models\Role::where('slug', 'admin')->first();
            if ($adminRole) {
                $admin->assignRole($adminRole);
            }
        }

        // Create the FST DEV admin user
        $fstAdmin = User::firstOrCreate(
            ['email' => 'admin@fstdev.com'],
            [
                'name' => 'FST DEV Admin',
                'password' => Hash::make('password'),
                'role' => 'admin'
            ]
        );

        // Ensure the FST DEV admin user has the admin role assigned
        if (!$fstAdmin->roles()->where('slug', 'admin')->exists()) {
            $adminRole = \App\Models\Role::where('slug', 'admin')->first();
            if ($adminRole) {
                $fstAdmin->assignRole($adminRole);
            }
        }
        // Create the HR user
        $hrUser = User::firstOrCreate(
            ['email' => 'hr@earth.com'],
            [
                'name' => 'Human Resources Manager',
                'password' => Hash::make('password'),
                'role' => 'hr'
            ]
        );
        if (!$hrUser->roles()->where('slug', 'hr')->exists()) {
            $hrRole = \App\Models\Role::where('slug', 'hr')->first();
            if ($hrRole) {
                $hrUser->assignRole($hrRole);
            }
        }

        // Create the Manager user
        $managerUser = User::firstOrCreate(
            ['email' => 'manager@earth.com'],
            [
                'name' => 'General Manager',
                'password' => Hash::make('password'),
                'role' => 'manager'
            ]
        );
        if (!$managerUser->roles()->where('slug', 'manager')->exists()) {
            $managerRole = \App\Models\Role::where('slug', 'manager')->first();
            if ($managerRole) {
                $managerUser->assignRole($managerRole);
            }
        }

        // Create the Employee user
        $employeeUser = User::firstOrCreate(
            ['email' => 'employee@earth.com'],
            [
                'name' => 'Standard Employee',
                'password' => Hash::make('password'),
                'role' => 'employee'
            ]
        );
        if (!$employeeUser->roles()->where('slug', 'employee')->exists()) {
            $employeeRole = \App\Models\Role::where('slug', 'employee')->first();
            if ($employeeRole) {
                $employeeUser->assignRole($employeeRole);
            }
        }
    }
}
