<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DropdownOption;

class DropdownOptionSeeder extends Seeder
{
    public function run()
    {
        $data = [
            'Gender' => ['Male', 'Female'],
            'Visa Type' => ['Work Visa', 'Visit Visa', 'Family Visa', 'Business Visa'],
            'Visa Designation' => ['Manager', 'Engineer', 'Technician', 'Laborer', 'Driver', 'Accountant', 'Sales'],
            'Employee Category' => ['Permanent', 'Contract', 'Probation', 'Intern'],
            'Contract Duration' => ['1 Year', '2 Years', '3 Years', '5 Years', 'Unlimited'],
            'Exit Status' => ['Resigned', 'Terminated', 'End of Contract', 'Absconded'],
            'Payment Type' => ['Bank Transfer', 'Cash', 'Cheque'],
            'Leave Status' => ['Available', 'On Leave', 'Unpaid Leave'],
            'Shift' => ['Morning', 'Evening', 'Night', 'General'],
        ];

        foreach ($data as $category => $values) {
            foreach ($values as $index => $value) {
                DropdownOption::firstOrCreate(
                    ['category' => $category, 'value' => $value],
                    ['sort_order' => $index + 1, 'is_active' => true]
                );
            }
        }
    }
}
