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
        if (!Schema::hasColumn('training_assignments', 'progress_percentage')) {
            Schema::table('training_assignments', function (Blueprint $table) {
                $table->integer('progress_percentage')->default(0)->after('status');
                $table->timestamp('started_at')->nullable()->after('assigned_date');
                $table->timestamp('last_activity_at')->nullable()->after('started_at');
                $table->integer('sessions_attended')->default(0)->after('last_activity_at');
                $table->integer('sessions_total')->default(0)->after('sessions_attended');
                $table->json('quiz_scores')->nullable()->after('score');
                $table->json('materials_viewed')->nullable()->after('quiz_scores');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('training_assignments', function (Blueprint $table) {
            $table->dropColumn([
                'progress_percentage',
                'started_at',
                'last_activity_at',
                'sessions_attended',
                'sessions_total',
                'quiz_scores',
                'materials_viewed'
            ]);
        });
    }
};
