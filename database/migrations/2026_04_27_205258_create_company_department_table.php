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
        Schema::create('company_department', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('department_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['company_id', 'department_id']);
        });

        // Migrate existing data
        $departments = \DB::table('departments')->get();
        foreach ($departments as $dept) {
            if ($dept->company_id) {
                \DB::table('company_department')->insert([
                    'company_id' => $dept->company_id,
                    'department_id' => $dept->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Make company_id nullable on departments table
        Schema::table('departments', function (Blueprint $table) {
            $table->unsignedBigInteger('company_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_department');
    }
};
