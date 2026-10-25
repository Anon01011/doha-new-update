<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Security fix (HIGH-04): `employee_documents` had no tenant column and no
 * tenant scope, so employee identity documents (passport, QID, visa, contract)
 * were reachable across companies whenever the acting user had no linked
 * employee profile.
 *
 * The column is added, backfilled from the owning employee's company, and the
 * `BelongsToCompany` scope is applied to the model.
 */
return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('employee_documents', 'company_id')) {
            Schema::table('employee_documents', function (Blueprint $table) {
                $table->foreignId('company_id')->nullable()->after('employee_id')
                    ->constrained('companies')->nullOnDelete();
            });
        }

        // Backfill from the owning employee so existing rows keep their tenant.
        // A correlated sub-select is used because Laravel's query builder cannot
        // bind a sub-query as a value inside `update()`. The expression is valid
        // on both MySQL and SQLite.
        DB::table('employee_documents')
            ->whereNull('company_id')
            ->update([
                'company_id' => DB::raw(
                    '(SELECT e.company_id FROM employees e WHERE e.id = employee_documents.employee_id LIMIT 1)'
                ),
            ]);

        Schema::table('employee_documents', function (Blueprint $table) {
            $table->index('company_id');
        });
    }

    public function down(): void
    {
        Schema::table('employee_documents', function (Blueprint $table) {
            $table->dropIndex(['company_id']);
            $table->dropConstrainedForeignId('company_id');
        });
    }
};