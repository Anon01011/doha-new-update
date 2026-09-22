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
            $table->string('bank_name')->nullable()->after('payment_type');
            $table->string('bank_account_number')->nullable()->after('bank_name');
            $table->string('bank_code')->nullable()->after('bank_account_number'); // IFSC / SWIFT / Routing Code
            $table->string('bank_branch')->nullable()->after('bank_code');
            $table->string('iban')->nullable()->after('bank_branch');
            $table->string('upi_id')->nullable()->after('iban');
            $table->string('pan_number')->nullable()->after('upi_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'bank_name',
                'bank_account_number',
                'bank_code',
                'bank_branch',
                'iban',
                'upi_id',
                'pan_number',
            ]);
        });
    }
};
