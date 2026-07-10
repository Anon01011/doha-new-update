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
        Schema::table('employees', function (Blueprint $table) {
            $table->string('passport_number')->nullable()->after('manual_status');
            $table->date('passport_expiry_date')->nullable()->after('passport_number');
            $table->string('passport_file_path')->nullable()->after('passport_expiry_date');
            $table->string('qid_number')->nullable()->after('passport_file_path');
            $table->date('qid_expiry_date')->nullable()->after('qid_number');
            $table->string('qid_file_path')->nullable()->after('qid_expiry_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'passport_number',
                'passport_expiry_date',
                'passport_file_path',
                'qid_number',
                'qid_expiry_date',
                'qid_file_path',
            ]);
        });
    }
};
