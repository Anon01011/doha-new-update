<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TrainingCategory;
use App\Models\Company;

class TrainingCategorySeeder extends Seeder
{
    public function run()
    {
        $categories = [
            ['name' => 'Technical Skills', 'description' => 'Training related to technical job functions.', 'color_code' => '#3B82F6'],
            ['name' => 'Soft Skills', 'description' => 'Communication, leadership, and interpersonal skills.', 'color_code' => '#10B981'],
            ['name' => 'Compliance', 'description' => 'Mandatory legal and safety training.', 'color_code' => '#EF4444'],
            ['name' => 'Onboarding', 'description' => 'New employee orientation and setup.', 'color_code' => '#F59E0B'],
            ['name' => 'Product Knowledge', 'description' => 'Deep dives into company products and services.', 'color_code' => '#8B5CF6'],
        ];

        // Get all companies to seed categories for each
        $companies = Company::all();

        if ($companies->isEmpty()) {
            // Fallback if no companies exist yet (though unlikely in a running app)
            foreach ($categories as $category) {
                TrainingCategory::create(array_merge($category, [
                    'company_id' => 1, // Default or placeholder
                    'is_active' => true,
                ]));
            }
        } else {
            foreach ($companies as $company) {
                foreach ($categories as $category) {
                    TrainingCategory::firstOrCreate(
                        [
                            'name' => $category['name'],
                            'company_id' => $company->id
                        ],
                        array_merge($category, [
                            'is_active' => true,
                        ])
                    );
                }
            }
        }
    }
}
