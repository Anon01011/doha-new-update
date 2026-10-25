<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * Resolves which tenant owns a file that lives on the public disk so the
 * `/storage/{path}` route can enforce tenant isolation instead of serving
 * every uploaded document to every logged-in user.
 *
 * Why this exists
 * ---------------
 * Uploaded employee documents, salary slips, expense receipts, leave
 * attachments and training certificates are confidential. Before this
 * service the storage route only checked "is the user authenticated?", which
 * meant any authenticated employee could read another company's files simply
 * by guessing the random file name.
 *
 * Design notes
 * ------------
 * The mapping is an explicit allowlist of (table, path columns, tenant column)
 * tuples rather than a reflection over every column in the database:
 *
 *  - the set of tables to consult is decided by the top level directory of
 *    the requested path, so a request for `expense_receipts/x.jpg` never has
 *    to look at the employee tables and vice versa;
 *  - the reviewable surface of the check stays obvious; and
 *  - a table that stores a JSON encoded list of paths is handled explicitly.
 *
 * Tables that do not carry a `company_id` / `branch_id` of their own are
 * resolved through their parent record (for example `task_comments` belongs
 * to a task, and a task belongs to a branch).
 */
class StoredFileAccessService
{
    /**
     * Path columns on the `employees` table that point at an uploaded file.
     */
    private const EMPLOYEE_FILE_COLUMNS = [
        'employee_image',
        'agreement_doc',
        'resume_doc',
        'other_docs',
        'passport_file_path',
        'qid_file_path',
        'food_handler_file_path',
        'aadhar_file_path',
        'health_card_file_path',
        'pan_file_path',
        'education_doc_path',
        'relieving_doc_path',
        'bank_doc_path',
    ];

    /**
     * Directory on the public disk => ownership rules.
     *
     * Each rule is: [table, path columns, tenant column, parent table,
     * parent foreign key, parent tenant column].
     *
     * A null tenant column means the ownership is resolved through the
     * parent record instead.
     */
    private const PATH_OWNERSHIP = [
        'employee-images' => [
            ['employees', self::EMPLOYEE_FILE_COLUMNS, 'company_id', null, null, null],
        ],
        'employee-docs' => [
            ['employees', self::EMPLOYEE_FILE_COLUMNS, 'company_id', null, null, null],
        ],
        'employee_documents' => [
            ['employee_documents', ['file_path'], 'company_id', null, null, null],
        ],
        'user_images' => [
            ['users', ['image'], 'company_id', null, null, null],
            ['employees', self::EMPLOYEE_FILE_COLUMNS, 'company_id', null, null, null],
        ],
        'expense_receipts' => [
            ['expense_claims', ['receipt_path'], 'company_id', null, null, null],
        ],
        'leave-attachments' => [
            ['leave_requests', ['attachment'], 'company_id', null, null, null],
        ],
        'grievances' => [
            ['grievances', ['attachments'], 'company_id', null, null, null],
            ['grievance_responses', ['attachments'], null, 'grievances', 'grievance_id', 'company_id'],
        ],
        'task_attachments' => [
            ['task_comments', ['file_path'], null, 'tasks', 'task_id', 'branch_id'],
            ['task_updates', ['attachments'], null, 'tasks', 'task_id', 'branch_id'],
        ],
        'offboarding' => [
            ['offboarding_requests', ['supporting_document'], null, 'employees', 'employee_id', 'company_id'],
        ],
        'training-materials' => [
            ['training_materials', ['file_path'], 'company_id', null, null, null],
        ],
        'training_certificates' => [
            ['training_certificates', ['certificate_file_path'], 'company_id', null, null, null],
        ],
    ];

    /**
     * Directories whose content may be served without a session.
     *
     * Only branding images live here, and only the ones that are explicitly
     * flagged as public in the `settings` table (see `isPublicPath()`).
     */
    public const PUBLIC_DIRECTORIES = ['branding'];

    /**
     * Determine whether the given path may be served to anonymous visitors.
     *
     * A path is public when it lives in a public directory AND the exact
     * value is referenced by a setting that has been flagged `is_public`.
     * The logo and the favicon carry that flag; the company stamp does not,
     * because a stamp is reproduced on salary slips.
     */
    public function isPublicPath(string $path): bool
    {
        $path = ltrim(str_replace('\\', '/', $path), '/');

        if ($path === '') {
            return false;
        }

        $directory = strtolower(explode('/', $path)[0]);

        if (!in_array($directory, self::PUBLIC_DIRECTORIES, true)) {
            return false;
        }

        try {
            return DB::table('settings')
                ->where('value', $path)
                ->where('is_public', true)
                ->exists();
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Resolve the company ids that may access the given stored path.
     *
     * An empty array means "no owner could be determined". The caller must
     * treat that as a denial for non-public paths, because an orphan file is
     * not evidence of authorisation.
     *
     * @param  string  $path  Path relative to the public disk root.
     * @return array<int, int>  Allowed company ids (may be empty).
     */
    public function allowedCompanyIds(string $path): array
    {
        $path = ltrim(str_replace('\\', '/', $path), '/');

        if ($path === '') {
            return [];
        }

        $directory = strtolower(explode('/', $path)[0]);

        if (!isset(self::PATH_OWNERSHIP[$directory])) {
            return [];
        }

        $owners = [];

        foreach (self::PATH_OWNERSHIP[$directory] as $rule) {
            [$table, $columns, $tenantColumn, $parentTable, $parentKey, $parentTenantColumn] = $rule;

            foreach ($this->matchingTenantIds($table, $columns, $path, $tenantColumn, $parentTable, $parentKey, $parentTenantColumn) as $id) {
                $owners[] = $id;
            }
        }

        return array_values(array_unique($owners));
    }

    /**
     * Find the tenant ids of the rows in $table whose file column holds $path.
     *
     * A column may hold a single path or a JSON / comma separated list of
     * paths (the attachment columns on grievances and task updates store a
     * JSON encoded array of file names).
     *
     * @param  array<int, string>  $columns
     * @return array<int, int>
     */
    private function matchingTenantIds(
        string $table,
        array $columns,
        string $path,
        ?string $tenantColumn,
        ?string $parentTable,
        ?string $parentKey,
        ?string $parentTenantColumn
    ): array {
        $ids = [];

        foreach ($columns as $column) {
            try {
                $rows = DB::table($table)
                    ->select('id', $column)
                    ->where($column, 'like', '%' . $this->escapeLike($path) . '%')
                    ->get();
            } catch (\Throwable $e) {
                // A table that does not exist (e.g. an optional module) must
                // not break the request; treat it as "no owner found".
                continue;
            }

            foreach ($rows as $row) {
                $value = (string) ($row->{$column} ?? '');

                if ($value === '') {
                    continue;
                }

                if (!in_array($path, $this->splitPaths($value), true)) {
                    continue;
                }

                $tenantId = $tenantColumn !== null
                    ? $this->tenantIdFor($table, $row->id, $tenantColumn)
                    : $this->parentTenantId($parentTable, $parentKey, $parentTenantColumn, $row->id);

                if ($tenantId !== null) {
                    $ids[] = $tenantId;
                }
            }
        }

        return $ids;
    }

    /**
     * The tenant id of a row that matched the path.
     */
    private function tenantIdFor(string $table, int|string $id, string $tenantColumn): ?int
    {
        try {
            $value = DB::table($table)->where('id', $id)->value($tenantColumn);
        } catch (\Throwable $e) {
            return null;
        }

        return $value === null ? null : (int) $value;
    }

    /**
     * The tenant id of the parent record of a row that matched the path.
     */
    private function parentTenantId(
        ?string $parentTable,
        ?string $parentKey,
        ?string $parentTenantColumn,
        int|string $id
    ): ?int {
        if ($parentTable === null || $parentKey === null || $parentTenantColumn === null) {
            return null;
        }

        try {
            $value = DB::table($parentTable)
                ->where($parentKey, $id)
                ->value($parentTenantColumn);
        } catch (\Throwable $e) {
            return null;
        }

        return $value === null ? null : (int) $value;
    }

    /**
     * Split a stored value into the individual paths it contains.
     *
     * @return array<int, string>
     */
    private function splitPaths(string $value): array
    {
        $trimmed = trim($value);

        // JSON array of paths.
        if (str_starts_with($trimmed, '[')) {
            $decoded = json_decode($trimmed, true);

            if (is_array($decoded)) {
                return array_values(array_filter(array_map(
                    static fn ($item) => is_string($item) ? ltrim(str_replace('\\', '/', $item), '/') : '',
                    $decoded
                )));
            }
        }

        // Comma separated list of paths.
        if (str_contains($trimmed, ',')) {
            return array_values(array_filter(array_map(
                static fn ($item) => ltrim(str_replace('\\', '/', trim($item)), '/'),
                explode(',', $trimmed)
            )));
        }

        return [ltrim(str_replace('\\', '/', $trimmed), '/')];
    }

    /**
     * Escape the LIKE wildcards in a user supplied path.
     */
    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }
}