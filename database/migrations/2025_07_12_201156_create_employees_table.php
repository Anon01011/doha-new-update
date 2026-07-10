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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('employee_code');
            $table->string('gender');
            $table->string('religion')->nullable();
            $table->date('dob')->nullable();
            $table->string('mobile')->nullable();
            $table->string('email')->nullable();
            $table->string('designation')->nullable();
            $table->string('nationality')->nullable();
            $table->string('sponsor')->nullable();
            $table->unsignedBigInteger('company_id')->nullable();
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('set null');
            $table->string('location')->nullable();
            $table->string('department')->nullable();
            $table->date('joined_date')->nullable();
            $table->date('rejoined_date')->nullable();
            $table->string('shift')->nullable();
            $table->string('visa_type')->nullable();
            $table->string('visa_designation')->nullable();
            $table->string('employee_category')->nullable();
            $table->string('contract_duration')->nullable();
            $table->string('exit_status')->nullable();
            $table->string('payment_type')->nullable();
            $table->string('leave_status')->nullable();
            $table->string('reported_to')->nullable();
            $table->string('employee_image')->nullable();
            $table->string('manual_status')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
