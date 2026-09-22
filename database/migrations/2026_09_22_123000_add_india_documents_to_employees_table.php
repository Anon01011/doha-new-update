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
            $table->string('aadhar_number')->nullable()->after('pan_number');
            $table->string('aadhar_file_path')->nullable()->after('aadhar_number');
            $table->string('pan_file_path')->nullable()->after('aadhar_file_path');
            $table->string('education_doc_path')->nullable()->after('pan_file_path');
            $table->string('relieving_doc_path')->nullable()->after('education_doc_path');
            $table->string('bank_doc_path')->nullable()->after('relieving_doc_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'aadhar_number',
                'aadhar_file_path',
                'pan_file_path',
                'education_doc_path',
                'relieving_doc_path',
                'bank_doc_path',
            ]);
        });
    }
};
