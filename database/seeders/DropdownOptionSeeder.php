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
            'Designation' => [
                'Owner / Founder',
                'Chief Operating Officer',
                'Founder / CEO',
                'General Manager',
                'HR Manager',
                'HR Executive',
                'Branch Manager',
                'Operations Manager',
                'Senior Stylist',
                'Hair Stylist',
                'Beautician',
                'Nail Artist',
                'Makeup Artist',
                'Massage Therapist',
                'Receptionist / Front Desk',
                'Accountant',
                'Sales Executive',
                'Helper / Cleaner',
            ],
            'Executive Reporting' => [
                'Chief Operating Officer',
                'Owner / Founder',
                'Founder / CEO',
            ],
            'Visa Type' => ['Work Visa', 'Visit Visa', 'Family Visa', 'Business Visa'],
            'Visa Designation' => ['Manager', 'Engineer', 'Technician', 'Laborer', 'Driver', 'Accountant', 'Sales'],
            'Employee Category' => ['Permanent', 'Contract', 'Probation', 'Intern'],
            'Contract Duration' => ['1 Year', '2 Years', '3 Years', '5 Years', 'Unlimited'],
            'Exit Status' => ['Resigned', 'Terminated', 'End of Contract', 'Absconded'],
            'Payment Type' => ['Bank Transfer', 'Cash', 'Cheque'],
            'Leave Status' => ['Available', 'On Leave', 'Unpaid Leave'],
            'Shift' => ['Morning', 'Evening', 'Night', 'General'],
            'Attendance Status' => ['Present', 'Absent', 'Half Day', 'Late', 'On Leave'],
            'Loan Type' => ['Personal Loan', 'Emergency Loan', 'Salary Advance', 'Travel Loan'],
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
