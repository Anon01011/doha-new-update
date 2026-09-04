<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Clean up empty strings or whitespace-only values to NULL
        foreach (['mobile', 'email', 'qid_number', 'passport_number'] as $column) {
            if (Schema::hasColumn('employees', $column)) {
                DB::table('employees')
                    ->whereRaw("TRIM(COALESCE({$column}, '')) = ''")
                    ->update([$column => null]);
            }
        }

        // 2. Deduplicate existing duplicate non-null records before applying UNIQUE constraint
        // (Keep the earliest employee record with lowest ID, set subsequent duplicate values to NULL)
        foreach (['mobile', 'email', 'qid_number'] as $column) {
            if (Schema::hasColumn('employees', $column)) {
                $duplicates = DB::table('employees')
                    ->select($column)
                    ->whereNotNull($column)
                    ->groupBy($column)
                    ->havingRaw('COUNT(*) > 1')
                    ->pluck($column);

                foreach ($duplicates as $duplicateVal) {
                    $empIds = DB::table('employees')
                        ->where($column, $duplicateVal)
                        ->orderBy('id', 'asc')
                        ->pluck('id')
                        ->toArray();

                    if (count($empIds) > 1) {
                        $idsToNullify = array_slice($empIds, 1);
                        DB::table('employees')
                            ->whereIn('id', $idsToNullify)
                            ->update([$column => null]);

                        Log::warning("Migration deduplication on employees.{$column}: Kept employee ID {$empIds[0]}, set duplicate value '{$duplicateVal}' to null on employee IDs: " . implode(', ', $idsToNullify));
                    }
                }
            }
        }

        // 3. Add is_code_edited column if missing
        if (!Schema::hasColumn('employees', 'is_code_edited')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->boolean('is_code_edited')->default(false)->after('employee_code');
            });
        }

        // 4. Safely create unique indexes if they don't already exist
        $hasIndex = function ($table, $indexName) {
            $indexes = DB::select("SHOW KEYS FROM `{$table}` WHERE Key_name = ?", [$indexName]);
            return !empty($indexes);
        };

        if (!$hasIndex('employees', 'employees_mobile_unique')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->unique('mobile', 'employees_mobile_unique');
            });
        }

        if (!$hasIndex('employees', 'employees_email_unique')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->unique('email', 'employees_email_unique');
            });
        }

        if (!$hasIndex('employees', 'employees_qid_number_unique')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->unique('qid_number', 'employees_qid_number_unique');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $hasIndex = function ($table, $indexName) {
            $indexes = DB::select("SHOW KEYS FROM `{$table}` WHERE Key_name = ?", [$indexName]);
            return !empty($indexes);
        };

        Schema::table('employees', function (Blueprint $table) use ($hasIndex) {
            if ($hasIndex('employees', 'employees_mobile_unique')) {
                $table->dropUnique('employees_mobile_unique');
            }
            if ($hasIndex('employees', 'employees_email_unique')) {
                $table->dropUnique('employees_email_unique');
            }
            if ($hasIndex('employees', 'employees_qid_number_unique')) {
                $table->dropUnique('employees_qid_number_unique');
            }
            if (Schema::hasColumn('employees', 'is_code_edited')) {
                $table->dropColumn('is_code_edited');
            }
        });
    }
};
