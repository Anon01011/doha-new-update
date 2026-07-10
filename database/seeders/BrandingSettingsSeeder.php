<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class BrandingSettingsSeeder extends Seeder
{
    public function run()
    {
        $brandingSettings = [
            [
                'key' => 'app_name',
                'value' => 'Employee Management System',
                'category' => 'branding',
                'type' => 'string',
                'description' => 'Application name displayed across the system',
                'is_public' => true,
            ],
            [
                'key' => 'app_logo',
                'value' => null,
                'category' => 'branding',
                'type' => 'string',
                'description' => 'Path to application logo image',
                'is_public' => true,
            ],
            [
                'key' => 'favicon',
                'value' => null,
                'category' => 'branding',
                'type' => 'string',
                'description' => 'Path to favicon image',
                'is_public' => true,
            ],
        ];

        foreach ($brandingSettings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
