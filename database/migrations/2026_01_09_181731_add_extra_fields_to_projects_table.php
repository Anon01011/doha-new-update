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
        Schema::table('projects', function (Blueprint $table) {
            $table->string('visibility')->default('public')->after('status');
            $table->decimal('budget', 15, 2)->nullable()->after('visibility');
            $table->string('priority')->default('medium')->after('budget');
            $table->string('category')->nullable()->after('priority');
            $table->json('tags')->nullable()->after('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['visibility', 'budget', 'priority', 'category', 'tags']);
        });
    }
};
