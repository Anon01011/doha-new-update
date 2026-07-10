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
            $table->string('agreement_doc')->nullable()->after('employee_image');
            $table->string('resume_doc')->nullable()->after('agreement_doc');
            $table->string('other_docs')->nullable()->after('resume_doc');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['agreement_doc', 'resume_doc', 'other_docs']);
        });
    }
};
