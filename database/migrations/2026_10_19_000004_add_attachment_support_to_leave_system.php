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
        if (Schema::hasTable('leave_types')) {
            Schema::table('leave_types', function (Blueprint $table) {
                if (!Schema::hasColumn('leave_types', 'requires_attachment')) {
                    $table->boolean('requires_attachment')->default(false)->after('requires_approval');
                }
            });
        }

        if (Schema::hasTable('leave_requests')) {
            Schema::table('leave_requests', function (Blueprint $table) {
                if (!Schema::hasColumn('leave_requests', 'attachment')) {
                    $table->string('attachment')->nullable()->after('reason');
                }
                if (!Schema::hasColumn('leave_requests', 'attachment_original_name')) {
                    $table->string('attachment_original_name')->nullable()->after('attachment');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('leave_types')) {
            Schema::table('leave_types', function (Blueprint $table) {
                if (Schema::hasColumn('leave_types', 'requires_attachment')) {
                    $table->dropColumn('requires_attachment');
                }
            });
        }

        if (Schema::hasTable('leave_requests')) {
            Schema::table('leave_requests', function (Blueprint $table) {
                if (Schema::hasColumn('leave_requests', 'attachment')) {
                    $table->dropColumn('attachment');
                }
                if (Schema::hasColumn('leave_requests', 'attachment_original_name')) {
                    $table->dropColumn('attachment_original_name');
                }
            });
        }
    }
};
