<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Add a stable, human-readable slug to employees so that show pages can be
     * addressed as /employees/{name-slug}-{employee-code} instead of the bare
     * primary key. The primary key remains a valid route segment (see
     * Employee::resolveRouteBinding()), so existing links keep working.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('employees', 'slug')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->string('slug')->nullable()->after('employee_code');
            });
        }

        // Index for lookups by slug. Schema::hasIndex() is driver aware, so this
        // stays safe to re-run on MySQL, PostgreSQL and SQLite alike.
        $indexName = 'employees_slug_index';

        if (! Schema::hasIndex('employees', $indexName)) {
            Schema::table('employees', function (Blueprint $table) use ($indexName) {
                $table->index('slug', $indexName);
            });
        }

        $this->backfillSlugs();
    }

    /**
     * Populate the slug column for every employee.
     *
     * Slug format: {name-slug}-{employee-code-slug}
     * e.g. "Haider Shakeel Rajpoot" + code "128" => "haider-shakeel-rajpoot-128"
     *
     * A numeric suffix is appended only when needed to guarantee uniqueness.
     */
    private function backfillSlugs(): void
    {
        $employees = DB::table('employees')->select(['id', 'name', 'employee_code'])->get();

        $used = [];
        foreach ($employees as $employee) {
            $base = $this->buildSlug($employee->name, $employee->employee_code);
            $slug = $base;
            $suffix = 1;

            while (isset($used[$slug])) {
                $slug = $base . '-' . (++$suffix);
            }

            $used[$slug] = true;

            DB::table('employees')->where('id', $employee->id)->update(['slug' => $slug]);
        }
    }

    private function buildSlug(?string $name, ?string $code): string
    {
        $nameSlug = Str::slug((string) $name);
        $codeSlug = Str::slug((string) $code);

        if ($nameSlug === '') {
            $nameSlug = 'employee';
        }

        if ($codeSlug === '') {
            return $nameSlug;
        }

        return $nameSlug . '-' . $codeSlug;
    }

    public function down(): void
    {
        if (! Schema::hasColumn('employees', 'slug')) {
            return;
        }

        if (Schema::hasIndex('employees', 'employees_slug_index')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->dropIndex('employees_slug_index');
            });
        }

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
