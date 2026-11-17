<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('pin_hash')->nullable()->after('password');
            $table->timestamp('pin_set_at')->nullable()->after('pin_hash');
            $table->unsignedTinyInteger('pin_failed_attempts')->default(0)->after('pin_set_at');
            $table->timestamp('pin_locked_until')->nullable()->after('pin_failed_attempts');
            $table->boolean('pin_enabled')->default(false)->after('pin_locked_until');
        });

        Schema::create('user_trusted_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->unsignedBigInteger('company_id')->nullable()->index();
            $table->string('device_token_hash', 64)->unique();
            $table->string('device_name', 191);
            $table->string('device_type', 50)->default('desktop');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at');
            $table->timestamp('revoked_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['user_id', 'is_active'], 'idx_user_trusted_devices_user');
            $table->index(['device_token_hash', 'is_active'], 'idx_user_trusted_devices_lookup');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_trusted_devices');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'pin_hash',
                'pin_set_at',
                'pin_failed_attempts',
                'pin_locked_until',
                'pin_enabled',
            ]);
        });
    }
};

