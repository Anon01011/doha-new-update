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
        // Add company_id to trainings table
        if (!Schema::hasColumn('trainings', 'company_id')) {
            Schema::table('trainings', function (Blueprint $table) {
                $table->foreignId('company_id')->nullable()->after('id')->constrained('companies')->onDelete('cascade');
                $table->index(['company_id', 'status', 'created_at'], 'idx_trainings_company_status');
            });
        }

        // Add company_id to training_assignments table
        if (!Schema::hasColumn('training_assignments', 'company_id')) {
            Schema::table('training_assignments', function (Blueprint $table) {
                $table->foreignId('company_id')->nullable()->after('id')->constrained('companies')->onDelete('cascade');
                $table->index(['company_id', 'employee_id', 'status'], 'idx_assignments_company_employee');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trainings', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropIndex('idx_trainings_company_status');
            $table->dropColumn('company_id');
        });

        Schema::table('training_assignments', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropIndex('idx_assignments_company_employee');
            $table->dropColumn('company_id');
        });
    }
};
