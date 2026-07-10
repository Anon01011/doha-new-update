<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PassportQidDocumentTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            [
                'name' => 'Passport',
                'category' => 'Identity',
                'requires_expiry' => true,
                'is_mandatory' => true,
                'alert_days_before_expiry' => 30,
            ],
            [
                'name' => 'QID',
                'category' => 'Identity',
                'requires_expiry' => true,
                'is_mandatory' => true,
                'alert_days_before_expiry' => 30,
            ],
        ];

        foreach ($types as $type) {
            \App\Models\DocumentType::firstOrCreate(
                ['name' => $type['name']],
                $type
            );
        }
    }
}
