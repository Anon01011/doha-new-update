<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the employee columns that the application code already depends on but
 * that were never created in the database:
 *
 *  - reports_to_id : self referencing FK used by Employee::manager() and
 *                    Employee::subordinates(). Referencing a missing column
 *                    made EmployeeController@destroy fail with
 *                    "Unknown column 'employees.reports_to_id'".
 *  - exit_date     : separation date written by the offboarding completion
 *                    and profile unlock flows.
 *  - exit_reason   : separation reason written by the same flows.
 *
 * The legacy `reported_to` column stores the manager NAME as free text. It is
 * kept for backwards compatibility and used to backfill the new foreign key.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->addMissingColumns();
        $this->backfillReportsToId();
        $this->addForeignKey();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('employees', 'reports_to_id')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->dropForeign(['reports_to_id']);
                $table->dropColumn('reports_to_id');
            });
        }

        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasColumn('employees', 'exit_date')) {
                $table->dropColumn('exit_date');
            }
            if (Schema::hasColumn('employees', 'exit_reason')) {
                $table->dropColumn('exit_reason');
            }
        });
    }

    /**
     * Create the columns that are missing from the employees table.
     */
    private function addMissingColumns(): void
    {
        $missingReportsTo = ! Schema::hasColumn('employees', 'reports_to_id');
        $missingExitDate = ! Schema::hasColumn('employees', 'exit_date');
        $missingExitReason = ! Schema::hasColumn('employees', 'exit_reason');

        if (! $missingReportsTo && ! $missingExitDate && ! $missingExitReason) {
            return;
        }

        Schema::table('employees', function (Blueprint $table) use (
            $missingReportsTo,
            $missingExitDate,
            $missingExitReason
        ) {
            if ($missingReportsTo) {
                $table->unsignedBigInteger('reports_to_id')->nullable()->after('reported_to');
            }
            if ($missingExitDate) {
                $table->date('exit_date')->nullable()->after('exit_status');
            }
            if ($missingExitReason) {
                $table->string('exit_reason')->nullable()->after('exit_date');
            }
        });
    }

    /**
     * Populate reports_to_id from the legacy reported_to manager name.
     *
     * The lookup is case insensitive and trims surrounding whitespace. Rows
     * whose manager name cannot be resolved to a unique employee are left
     * with a NULL reports_to_id so that no relationship is invented.
     */
    private function backfillReportsToId(): void
    {
        if (! Schema::hasColumn('employees', 'reports_to_id')) {
            return;
        }

        $managers = DB::table('employees')
            ->whereNotNull('name')
            ->select('id', 'name')
            ->get();

        // Upper-cased name => id. Duplicate names are dropped so that an
        // ambiguous name never resolves to an arbitrary employee.
        $nameToId = [];
        $duplicates = [];
        foreach ($managers as $manager) {
            $key = mb_strtoupper(trim((string) $manager->name));
            if ($key === '') {
                continue;
            }
            if (array_key_exists($key, $nameToId)) {
                $duplicates[$key] = true;
                continue;
            }
            $nameToId[$key] = $manager->id;
        }
        foreach (array_keys($duplicates) as $key) {
            unset($nameToId[$key]);
        }

        if ($nameToId === []) {
            return;
        }

        $updated = 0;
        $unresolved = [];

        DB::table('employees')
            ->select('id', 'reported_to')
            ->whereNotNull('reported_to')
            ->where('reported_to', '!=', '')
            ->orderBy('id')
            ->chunk(200, function ($employees) use ($nameToId, &$updated, &$unresolved) {
                foreach ($employees as $employee) {
                    $key = mb_strtoupper(trim((string) $employee->reported_to));

                    if (! array_key_exists($key, $nameToId)) {
                        $unresolved[] = $employee->reported_to;
                        continue;
                    }

                    $managerId = $nameToId[$key];

                    // Never let an employee report to themselves.
                    if ((int) $managerId === (int) $employee->id) {
                        $unresolved[] = $employee->reported_to;
                        continue;
                    }

                    DB::table('employees')
                        ->where('id', $employee->id)
                        ->update(['reports_to_id' => $managerId]);
                    $updated++;
                }
            });

        Log::info('Backfilled employees.reports_to_id from employees.reported_to', [
            'updated'    => $updated,
            'unresolved' => count($unresolved),
        ]);
    }

    /**
     * Attach the self referencing foreign key and the lookup index.
     */
    private function addForeignKey(): void
    {
        if (! Schema::hasColumn('employees', 'reports_to_id')) {
            return;
        }

        $hasIndex = $this->hasIndex('employees', 'employees_reports_to_id_foreign');
        $hasColumnIndex = $this->hasIndex('employees', 'employees_reports_to_id_index');

        if (! $hasIndex && ! $hasColumnIndex) {
            Schema::table('employees', function (Blueprint $table) {
                $table->index('reports_to_id', 'employees_reports_to_id_index');
            });
        }

        if (! $hasIndex) {
            Schema::table('employees', function (Blueprint $table) {
                $table->foreign('reports_to_id')
                    ->references('id')
                    ->on('employees')
                    ->onDelete('set null');
            });
        }
    }

    /**
     * Driver agnostic index lookup (MySQL / SQLite).
     */
    private function hasIndex(string $table, string $indexName): bool
    {
        if (DB::getDriverName() === 'sqlite') {
            foreach (DB::select("PRAGMA index_list('{$table}')") as $index) {
                if (($index->name ?? '') === $indexName) {
                    return true;
                }
            }
            return false;
        }

        return ! empty(DB::select("SHOW KEYS FROM `{$table}` WHERE Key_name = ?", [$indexName]));
    }
};
