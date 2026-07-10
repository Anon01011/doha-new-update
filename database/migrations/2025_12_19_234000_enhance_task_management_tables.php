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
        // Enhance tasks table
        Schema::table('tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('tasks', 'project_id')) {
                $table->foreignId('project_id')->after('id')->nullable()->constrained('projects')->onDelete('set null');
            }
            if (!Schema::hasColumn('tasks', 'parent_id')) {
                $table->foreignId('parent_id')->after('project_id')->nullable()->constrained('tasks')->onDelete('cascade');
            }
            if (!Schema::hasColumn('tasks', 'is_recurring')) {
                $table->boolean('is_recurring')->default(false)->after('status');
            }
            if (!Schema::hasColumn('tasks', 'recurrence_pattern')) {
                $table->string('recurrence_pattern')->nullable()->after('is_recurring');
            }
            if (!Schema::hasColumn('tasks', 'estimated_hours')) {
                $table->decimal('estimated_hours', 8, 2)->nullable()->after('due_date');
            }
            if (!Schema::hasColumn('tasks', 'is_blocked')) {
                $table->boolean('is_blocked')->default(false)->after('status');
            }
            if (!Schema::hasColumn('tasks', 'blocked_reason')) {
                $table->text('blocked_reason')->nullable()->after('is_blocked');
            }
        });

        // Enhance task_assignments table
        Schema::table('task_assignments', function (Blueprint $table) {
            if (!Schema::hasColumn('task_assignments', 'acceptance_status')) {
                $table->enum('acceptance_status', ['pending', 'accepted', 'rejected'])->default('pending')->after('status');
            }
            if (!Schema::hasColumn('task_assignments', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('acceptance_status');
            }
            if (!Schema::hasColumn('task_assignments', 'extension_request_date')) {
                $table->date('extension_request_date')->nullable()->after('completed_date');
            }
            if (!Schema::hasColumn('task_assignments', 'extension_reason')) {
                $table->text('extension_reason')->nullable()->after('extension_request_date');
            }
        });

        // Create task_timers table
        Schema::create('task_timers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_assignment_id')->constrained('task_assignments')->onDelete('cascade');
            $table->timestamp('start_time')->nullable();
            $table->timestamp('end_time')->nullable();
            $table->integer('duration_minutes')->default(0);
            $table->boolean('manual_entry')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Create task_checklists table
        Schema::create('task_checklists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->string('item_text');
            $table->boolean('is_completed')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_checklists');
        Schema::dropIfExists('task_timers');

        Schema::table('task_assignments', function (Blueprint $table) {
            $table->dropColumn(['acceptance_status', 'rejection_reason', 'extension_request_date', 'extension_reason']);
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['project_id', 'parent_id', 'is_recurring', 'recurrence_pattern', 'estimated_hours', 'is_blocked', 'blocked_reason']);
        });
    }
};
