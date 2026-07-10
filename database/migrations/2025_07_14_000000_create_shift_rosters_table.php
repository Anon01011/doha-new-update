<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shift_rosters', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('company_id');
            $table->date('week_start'); // e.g. 2024-09-01
            $table->enum('day', ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']);
            $table->string('shift_time'); // e.g. "6 AM to 3 PM (BAR)"
            $table->string('shift_type')->nullable(); // e.g. Morning, Evening, Event/Mid, etc.
            $table->string('designation')->nullable();
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_rosters');
    }
}; 