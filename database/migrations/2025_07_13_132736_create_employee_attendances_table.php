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
        Schema::create('employee_attendances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('shift_id')->nullable();
            $table->date('date');
            $table->time('from_time')->nullable();
            $table->time('to_time')->nullable();
            $table->decimal('hours_worked', 5, 2)->nullable();
            $table->decimal('normal_hours', 5, 2)->nullable();
            $table->decimal('ot', 5, 2)->nullable();
            $table->decimal('ot_amt', 8, 2)->nullable();
            $table->string('attendance')->nullable(); // e.g. Present, Absent, Leave
            $table->string('reason')->nullable();
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('shift_id')->references('id')->on('shifts')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_attendances');
    }
};
