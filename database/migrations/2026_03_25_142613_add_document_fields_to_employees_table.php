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
        Schema::table('employees', function (Blueprint $table) {
            $table->string('food_handler_file_path')->nullable();
            $table->date('food_handler_expiry_date')->nullable();
            $table->string('health_card_number')->nullable();
            $table->date('health_card_expiry_date')->nullable();
            $table->date('contract_issue_date')->nullable();
            $table->date('contract_expiry_date')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'food_handler_file_path',
                'food_handler_expiry_date',
                'health_card_number',
                'health_card_expiry_date',
                'contract_issue_date',
                'contract_expiry_date',
            ]);
        });
    }
};
