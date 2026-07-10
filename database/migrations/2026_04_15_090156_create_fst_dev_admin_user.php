<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Role;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@fstdev.com'],
            [
                'name' => 'FST DEV Admin',
                'password' => Hash::make('FstDev@2026'), 
                'role' => 'admin'
            ]
        );

        // Ensure the admin user has the admin role assigned
        if (!$admin->roles()->where('slug', 'admin')->exists()) {
            $adminRole = Role::where('slug', 'admin')->first();
            if ($adminRole) {
                // If standard roles table, usually assignRole is method from spatie permissions or similar, 
                // but let's check how DatabaseSeeder does it. 
                // DatabaseSeeder does $admin->assignRole($adminRole); 
                if (method_exists($admin, 'assignRole')) {
                    $admin->assignRole($adminRole);
                } else {
                    $admin->roles()->attach($adminRole->id);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $user = User::where('email', 'admin@fstdev.com')->first();
        if ($user) {
            if (method_exists($user, 'roles')) {
                $user->roles()->detach();
            }
            $user->delete();
        }
    }
};
