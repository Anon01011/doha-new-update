<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Company;
use App\Models\Employee;

class EarthOrganicCoffeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create the company
        $company = Company::firstOrCreate(
            ['name' => 'Earth Organic Coffee'],
            ['created_at' => now(), 'updated_at' => now()]
        );

        // Employee data from CSV
        $employees = [
            ['first_name' => 'RAZEL', 'last_name' => '--', 'id' => 105],
            ['first_name' => 'ELVIR', 'last_name' => '--', 'id' => 104],
            ['first_name' => 'FRANCIS', 'last_name' => '--', 'id' => 102],
            ['first_name' => 'Sangeet', 'last_name' => '--', 'id' => 101],
            ['first_name' => 'RIMON', 'last_name' => '--', 'id' => 99],
            ['first_name' => 'AMIR', 'last_name' => '--', 'id' => 98],
            ['first_name' => 'mostafa', 'last_name' => '--', 'id' => 97],
            ['first_name' => 'Genesis', 'last_name' => '--', 'id' => 96],
            ['first_name' => 'SHAKEER', 'last_name' => 'SHAIK', 'id' => 95],
            ['first_name' => 'RICKY', 'last_name' => '--', 'id' => 94],
            ['first_name' => 'ROSS', 'last_name' => 'ANN', 'id' => 93],
            ['first_name' => 'Don', 'last_name' => 'Harrie', 'id' => 92],
            ['first_name' => 'Shokat', 'last_name' => '--', 'id' => 90],
            ['first_name' => 'Rilln', 'last_name' => '--', 'id' => 89],
            ['first_name' => 'Charmaine', 'last_name' => '--', 'id' => 88],
            ['first_name' => 'Shifam', 'last_name' => '--', 'id' => 87],
            ['first_name' => 'BETTY', 'last_name' => '--', 'id' => 86],
            ['first_name' => 'Sunvi', 'last_name' => '--', 'id' => 85],
            ['first_name' => 'Rubel', 'last_name' => 'Meah', 'id' => 84],
            ['first_name' => 'Lyka', 'last_name' => '--', 'id' => 81],
            ['first_name' => 'Apple', 'last_name' => '--', 'id' => 80],
            ['first_name' => 'Rogeline', 'last_name' => '--', 'id' => 82],
            ['first_name' => 'SAHAL', 'last_name' => 'T K', 'id' => 78],
            ['first_name' => 'MD', 'last_name' => 'SOHAN', 'id' => 77],
            ['first_name' => 'ELVIRA', 'last_name' => '--', 'id' => 74],
            ['first_name' => 'ZAID', 'last_name' => 'MOHAMED', 'id' => 73],
            ['first_name' => 'Cristina', 'last_name' => '--', 'id' => 72],
            ['first_name' => 'Daryll', 'last_name' => '--', 'id' => 71],
            ['first_name' => 'Cris', 'last_name' => '--', 'id' => 70],
            ['first_name' => 'Mershid', 'last_name' => '--', 'id' => 100],
            ['first_name' => 'Sabbir', 'last_name' => '--', 'id' => 75],
            ['first_name' => 'Jepsy', 'last_name' => '--', 'id' => 68],
            ['first_name' => 'Kim', 'last_name' => '--', 'id' => 65],
            ['first_name' => 'Rasha', 'last_name' => '--', 'id' => 64],
            ['first_name' => 'Shakib', 'last_name' => '--', 'id' => 63],
            ['first_name' => 'ELMER', 'last_name' => '--', 'id' => 62],
            ['first_name' => 'michelle', 'last_name' => '--', 'id' => 61],
            ['first_name' => 'Jenzen', 'last_name' => '--', 'id' => 60],
            ['first_name' => 'Waseem', 'last_name' => '--', 'id' => 59],
            ['first_name' => 'Harvey', 'last_name' => '--', 'id' => 57],
            ['first_name' => 'Ean', 'last_name' => '--', 'id' => 56],
            ['first_name' => 'Rubelin', 'last_name' => '--', 'id' => 55],
            ['first_name' => 'MAKIL', 'last_name' => '--', 'id' => 54],
            ['first_name' => 'Abdullah', 'last_name' => '--', 'id' => 53],
            ['first_name' => 'Victoria', 'last_name' => '--', 'id' => 51],
            ['first_name' => 'Lutfur', 'last_name' => 'Rahman', 'id' => 50],
            ['first_name' => 'Fiara', 'last_name' => 'ko sara', 'id' => 49],
            ['first_name' => 'Jesalyn', 'last_name' => 'Cando', 'id' => 48],
            ['first_name' => 'Camilo', 'last_name' => '--', 'id' => 47],
            ['first_name' => 'Franklyn', 'last_name' => '--', 'id' => 46],
            ['first_name' => 'Mark', 'last_name' => 'Klent', 'id' => 44],
            ['first_name' => 'Rakib', 'last_name' => '--', 'id' => 39],
            ['first_name' => 'Rasheed', 'last_name' => 'thadathil', 'id' => 38],
            ['first_name' => 'Mojim', 'last_name' => 'Ansari', 'id' => 42],
            ['first_name' => 'Patrick', 'last_name' => '--', 'id' => 41],
            ['first_name' => 'Chandra', 'last_name' => 'Kumar', 'id' => 40],
            ['first_name' => 'hilena', 'last_name' => '--', 'id' => 37],
            ['first_name' => 'Elvin', 'last_name' => '--', 'id' => 27],
            ['first_name' => 'Rodney', 'last_name' => '--', 'id' => 36],
            ['first_name' => 'Paula', 'last_name' => '--', 'id' => 35],
            ['first_name' => 'SHEENA', 'last_name' => '--', 'id' => 32],
            ['first_name' => 'ATIK', 'last_name' => '--', 'id' => 31],
            ['first_name' => 'KASRA', 'last_name' => '--', 'id' => 33],
            ['first_name' => 'DIEGO', 'last_name' => '--', 'id' => 28],
            ['first_name' => 'Erick', 'last_name' => '--', 'id' => 34],
            ['first_name' => 'CINDY', 'last_name' => '--', 'id' => 29],
            ['first_name' => 'Mishad', 'last_name' => '--', 'id' => 26],
            ['first_name' => 'Nicole', 'last_name' => '--', 'id' => 25],
            ['first_name' => 'Shoaib', 'last_name' => '--', 'id' => 24],
            ['first_name' => 'Glenn', 'last_name' => '--', 'id' => 23],
            ['first_name' => 'Alwin', 'last_name' => '--', 'id' => 21],
            ['first_name' => 'Dennis', 'last_name' => '--', 'id' => 19],
            ['first_name' => 'Ajmal', 'last_name' => '--', 'id' => 22],
            ['first_name' => 'Miral', 'last_name' => '--', 'id' => 18],
            ['first_name' => 'PAULO', 'last_name' => '--', 'id' => 17],
            ['first_name' => 'Israrul', 'last_name' => 'khan', 'id' => 10],
            ['first_name' => 'kenneth', 'last_name' => '--', 'id' => 13],
            ['first_name' => 'Jeff', 'last_name' => '--', 'id' => 11],
            ['first_name' => 'Dencel', 'last_name' => '--', 'id' => 16],
            ['first_name' => 'Maria', 'last_name' => '--', 'id' => 14],
            ['first_name' => 'Md.', 'last_name' => 'Abul kashem', 'id' => 8],
            ['first_name' => 'Motim', 'last_name' => '--', 'id' => 3],
            ['first_name' => 'EARTH', 'last_name' => '--', 'id' => 1],
            ['first_name' => 'Kilton', 'last_name' => 'sharma', 'id' => 7],
            ['first_name' => 'Jonathan', 'last_name' => '--', 'id' => 6],
            ['first_name' => 'Rashid', 'last_name' => '--', 'id' => 5],
            ['first_name' => 'Rajib', 'last_name' => '--', 'id' => 2],
            ['first_name' => 'Jishan', 'last_name' => '--', 'id' => 106],
            ['first_name' => 'JOHIR', 'last_name' => '--', 'id' => 107],
            ['first_name' => 'ANWAR', 'last_name' => '--', 'id' => 103],
            ['first_name' => 'SHIELA', 'last_name' => '--', 'id' => 109],
        ];

        $this->command->info('Creating ' . count($employees) . ' employees for Earth Organic Coffee...');

        foreach ($employees as $empData) {
            $fullName = trim($empData['first_name'] . ' ' . ($empData['last_name'] !== '--' ? $empData['last_name'] : ''));

            Employee::firstOrCreate(
                [
                    'employee_code' => (string) $empData['id'],
                    'company_id' => $company->id
                ],
                [
                    'name' => $fullName,
                    'gender' => 'Male',
                    'department' => 'All Departments',
                    'designation' => 'Staff',
                    'joined_date' => now()->subMonths(6),
                    'payment_type' => 'Monthly',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        $this->command->info('✅ Successfully created Earth Organic Coffee company with ' . count($employees) . ' employees!');
        $this->command->info('Company ID: ' . $company->id);
    }
}
