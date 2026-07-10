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
        Schema::table('leave_types', function (Blueprint $table) {
            $table->foreignId('company_id')->after('id')->nullable()->constrained('companies')->onDelete('cascade');

            // Drop old unique constraint if it exists
            $table->dropUnique(['code']);

            // Add new composite unique constraint
            $table->unique(['company_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::table('leave_types', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropColumn('company_id');
            $table->dropUnique(['company_id', 'code']);
            $table->unique('code');
        });
    }
};
