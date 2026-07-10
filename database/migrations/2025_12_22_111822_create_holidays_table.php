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
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->date('holiday_date');
            $table->boolean('is_recurring')->default(false);
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'holiday_date', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('holidays');
    }
};
