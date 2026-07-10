<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->index();
            $table->text('value')->nullable();
            $table->string('category')->nullable()->index();
            $table->enum('type', ['string', 'number', 'boolean', 'json'])->default('string');
            $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('cascade');
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(false);
            $table->timestamps();

            // Unique constraint: key must be unique per company (or globally if company_id is null)
            $table->unique(['key', 'company_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
