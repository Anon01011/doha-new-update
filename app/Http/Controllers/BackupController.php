<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Setting;
use App\Models\Employee;
use App\Models\Company;
use App\Models\Department;
use App\Models\User;
use App\Models\Role;
use App\Models\EmployeeAttendance;
use App\Models\LeaveRequest;
use App\Models\SalaryPosting;
use App\Models\Loan;
use App\Models\DropdownOption;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use ZipArchive;

class BackupController extends Controller
{
    private $backupDir = 'backups';

    /**
     * Display the backup and restore management page
     */
    public function index()
    {
        $user = auth()->user();
        if (!$user->isAdmin()) {
            abort(403, 'Unauthorized. Only Super Admin can manage system backups.');
        }

        $backupPath = storage_path('app/' . $this->backupDir);
        if (!File::exists($backupPath)) {
            File::makeDirectory($backupPath, 0755, true);
        }

        // List existing backup files
        $backupFiles = [];
        $files = File::files($backupPath);
        foreach ($files as $file) {
            $name = $file->getFilename();
            if (in_array($file->getExtension(), ['zip', 'sql', 'json', 'xlsx'])) {
                $type = 'database';
                if ($file->getExtension() === 'zip') {
                    $type = 'full';
                } elseif ($file->getExtension() === 'xlsx') {
                    $type = 'excel';
                }

                $backupFiles[] = [
                    'name' => $name,
                    'size' => $this->formatBytes($file->getSize()),
                    'size_bytes' => $file->getSize(),
                    'type' => $type,
                    'extension' => $file->getExtension(),
                    'created_at' => date('Y-m-d H:i:s', $file->getMTime()),
                    'timestamp' => $file->getMTime(),
                ];
            }
        }

        // Sort backups by newest first
        usort($backupFiles, function ($a, $b) {
            return $b['timestamp'] - $a['timestamp'];
        });

        // Calculate statistics
        $stats = [
            'total_employees' => Employee::count(),
            'total_branches' => Company::count(),
            'total_departments' => Department::count(),
            'total_users' => User::count(),
            'total_attendances' => EmployeeAttendance::count(),
            'total_backups' => count($backupFiles),
            'media_files_count' => $this->countMediaFiles(),
            'media_size' => $this->getMediaSize(),
            'db_size' => $this->getDatabaseSize(),
            'last_backup' => count($backupFiles) > 0 ? $backupFiles[0]['created_at'] : 'Never',
        ];

        return Inertia::render('Settings/BackupSettings', [
            'backups' => $backupFiles,
            'stats' => $stats,
            'settings' => $this->getBackupSettings(),
        ]);
    }

    /**
     * Get automated backup settings from database
     */
    private function getBackupSettings()
    {
        return [
            'auto_backup_enabled' => Setting::get('auto_backup_enabled', '0') === '1',
            'backup_frequency' => Setting::get('backup_frequency', 'daily'),
            'backup_time' => Setting::get('backup_time', '02:00'),
            'backup_retention_days' => (int) Setting::get('backup_retention_days', 30),
            'include_media_files' => Setting::get('include_media_files', '1') === '1',
            'notification_email' => Setting::get('backup_notification_email', auth()->user()->email ?? ''),
        ];
    }

    /**
     * Save automated backup settings
     */
    public function updateSettings(Request $request)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $request->validate([
            'auto_backup_enabled' => 'required|boolean',
            'backup_frequency' => 'required|in:daily,weekly,monthly',
            'backup_time' => 'required|string',
            'backup_retention_days' => 'required|integer|min:1|max:365',
            'include_media_files' => 'required|boolean',
            'notification_email' => 'nullable|email',
        ]);

        Setting::set('auto_backup_enabled', $request->auto_backup_enabled ? '1' : '0', 'backup', 'boolean');
        Setting::set('backup_frequency', $request->backup_frequency, 'backup', 'string');
        Setting::set('backup_time', $request->backup_time, 'backup', 'string');
        Setting::set('backup_retention_days', (string) $request->backup_retention_days, 'backup', 'number');
        Setting::set('include_media_files', $request->include_media_files ? '1' : '0', 'backup', 'boolean');
        Setting::set('backup_notification_email', $request->notification_email ?: '', 'backup', 'string');

        return back()->with('success', 'Backup settings updated successfully!');
    }

    /**
     * Create an instant backup (Full ZIP or Database Only)
     */
    public function create(Request $request)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        @ini_set('max_execution_time', '0');
        @set_time_limit(0);
        @ini_set('memory_limit', '1024M');
        @ignore_user_abort(true); // Guarantee ZIP creation finishes writing even if client disconnects

        $scope = $request->input('scope', 'full'); // 'full' or 'db_only'
        $backupPath = storage_path('app/' . $this->backupDir);
        if (!File::exists($backupPath)) {
            File::makeDirectory($backupPath, 0755, true);
        }

        $timestamp = now()->format('Ymd_His');

        try {
            if ($scope === 'full') {
                $zipFilename = "hrms_full_backup_{$timestamp}.zip";
                $zipFullPath = $backupPath . DIRECTORY_SEPARATOR . $zipFilename;

                $zip = new ZipArchive();
                if ($zip->open($zipFullPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                    return back()->withErrors(['error' => 'Could not create ZIP backup archive.']);
                }

                // 1. Generate SQL Dump to disk and add to ZIP
                $tempSqlPath = storage_path('app/temp_dump_' . $timestamp . '.sql');
                $sqlContent = $this->generateSqlDump();
                File::put($tempSqlPath, $sqlContent);
                $zip->addFile($tempSqlPath, 'database_dump.sql');

                // 2. Add all public storage media files (employee photos, documents, IDs) with fast STORE method
                $storagePublicPath = storage_path('app/public');
                if (File::exists($storagePublicPath)) {
                    $mediaFiles = File::allFiles($storagePublicPath);
                    foreach ($mediaFiles as $mediaFile) {
                        $relativePath = 'storage/' . $mediaFile->getRelativePathname();
                        $zip->addFile($mediaFile->getRealPath(), $relativePath);
                        $zip->setCompressionName($relativePath, ZipArchive::CM_STORE); // Fast uncompressed addition for already compressed images/PDFs
                    }
                }

                // 3. Add System Metadata Manifest
                $manifest = [
                    'system_name' => config('app.name', 'HRMS System'),
                    'backup_date' => now()->toDateTimeString(),
                    'backup_type' => 'Full System Backup (Database + Media)',
                    'total_employees' => Employee::count(),
                    'total_branches' => Company::count(),
                    'total_departments' => Department::count(),
                    'total_users' => User::count(),
                    'created_by' => auth()->user()->name . ' (' . auth()->user()->email . ')',
                ];
                $zip->addFromString('manifest.json', json_encode($manifest, JSON_PRETTY_PRINT));

                // Finalize and close ZIP
                $closeSuccess = $zip->close();

                // Clean up temporary SQL file
                if (File::exists($tempSqlPath)) {
                    File::delete($tempSqlPath);
                }

                if (!$closeSuccess || !File::exists($zipFullPath) || filesize($zipFullPath) === 0) {
                    return back()->withErrors(['error' => 'Failed to finalize ZIP backup file properly.']);
                }

                return back()->with('success', "Full system backup created successfully: {$zipFilename}");
            } else {
                // Database Only SQL Backup
                $sqlFilename = "hrms_db_backup_{$timestamp}.sql";
                $sqlFullPath = $backupPath . DIRECTORY_SEPARATOR . $sqlFilename;

                $sqlContent = $this->generateSqlDump();
                File::put($sqlFullPath, $sqlContent);

                return back()->with('success', "Database backup created successfully: {$sqlFilename}");
            }
        } catch (\Exception $e) {
            Log::error('Backup creation failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Backup creation failed: ' . $e->getMessage()]);
        }
    }

    /**
     * Download an existing backup file using chunked binary stream without timeouts
     */
    public function download($filename)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $safeName = basename($filename);
        $filePath = storage_path('app/' . $this->backupDir . '/' . $safeName);

        if (!File::exists($filePath)) {
            abort(404, 'Backup file not found.');
        }

        $fileSize = filesize($filePath);
        $mimeType = str_ends_with($safeName, '.zip') ? 'application/zip' : 'application/octet-stream';

        return response()->streamDownload(function () use ($filePath) {
            @ini_set('max_execution_time', '0');
            @set_time_limit(0);
            @ini_set('memory_limit', '512M');

            while (ob_get_level()) {
                ob_end_clean();
            }

            $handle = fopen($filePath, 'rb');
            if ($handle) {
                while (!feof($handle)) {
                    echo fread($handle, 1024 * 1024); // 1MB buffer
                    flush();
                }
                fclose($handle);
            }
        }, $safeName, [
            'Content-Type' => $mimeType,
            'Content-Length' => (string) $fileSize,
            'Content-Disposition' => 'attachment; filename="' . $safeName . '"',
            'Content-Transfer-Encoding' => 'binary',
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * Delete an existing backup file
     */
    public function destroy($filename)
    {
        if (!auth()->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $safeName = basename($filename);
        $filePath = storage_path('app/' . $this->backupDir . '/' . $safeName);

        if (File::exists($filePath)) {
            File::delete($filePath);
            return back()->with('success', "Backup {$safeName} deleted successfully.");
        }

        return back()->withErrors(['error' => 'Backup file not found.']);
    }

    /**
     * Restore system from an uploaded backup file (.zip, .sql, .json)
     */
    public function restore(Request $request)
    {
        @ini_set('max_execution_time', '600');
        @ini_set('memory_limit', '512M');
        @set_time_limit(600);

        if (!auth()->user()->isAdmin()) {
            abort(403, 'Unauthorized. Only Super Admin can restore backups.');
        }

        $request->validate([
            'backup_file' => 'required|file|max:204800', // 200MB max
        ]);

        $file = $request->file('backup_file');
        $ext = strtolower($file->getClientOriginalExtension());
        $realPath = $file->getRealPath();

        // Remember active user email to ensure session re-authentication if necessary
        $currentAdminEmail = auth()->user()->email;

        try {
            if ($ext === 'zip') {
                $zip = new ZipArchive();
                if ($zip->open($realPath) !== true) {
                    return back()->withErrors(['error' => 'Invalid or corrupted ZIP archive.']);
                }

                $extractPath = storage_path('app/temp_restore_' . time());
                $zip->extractTo($extractPath);
                $zip->close();

                // 1. Restore Database
                $sqlPath = $extractPath . '/database_dump.sql';
                $jsonPath = $extractPath . '/hrms_data.json';

                if (File::exists($sqlPath)) {
                    $sql = File::get($sqlPath);
                    $this->executeSqlDump($sql);
                } elseif (File::exists($jsonPath)) {
                    $jsonData = json_decode(File::get($jsonPath), true);
                    $this->restoreFromJson($jsonData);
                }

                // 2. Restore Media Files
                $storageExtractPath = $extractPath . '/storage';
                if (File::exists($storageExtractPath)) {
                    $targetStoragePath = storage_path('app/public');
                    if (!File::exists($targetStoragePath)) {
                        File::makeDirectory($targetStoragePath, 0755, true);
                    }
                    File::copyDirectory($storageExtractPath, $targetStoragePath);
                }

                // Cleanup temp folder
                File::deleteDirectory($extractPath);

                // Re-link public storage and clear cache for cross-domain portability
                try {
                    \Illuminate\Support\Facades\Artisan::call('storage:link');
                } catch (\Exception $e) {}

                try {
                    \Illuminate\Support\Facades\Artisan::call('cache:clear');
                    \Illuminate\Support\Facades\Artisan::call('config:clear');
                    \Illuminate\Support\Facades\Artisan::call('view:clear');
                } catch (\Exception $e) {}

                // Re-authenticate user if needed
                if (!auth()->check()) {
                    $admin = User::where('email', $currentAdminEmail)->first();
                    if ($admin) {
                        auth()->login($admin);
                    }
                }

                return back()->with('success', 'Full system backup restored successfully! All database records, salon branches, and media files have been restored.');
            } elseif ($ext === 'sql') {
                $sql = File::get($realPath);
                $this->executeSqlDump($sql);

                try {
                    \Illuminate\Support\Facades\Artisan::call('cache:clear');
                } catch (\Exception $e) {}

                return back()->with('success', 'Database restored successfully from SQL file.');
            } elseif ($ext === 'json') {
                $jsonData = json_decode(File::get($realPath), true);
                if (!$jsonData) {
                    return back()->withErrors(['error' => 'Invalid JSON structure.']);
                }
                $this->restoreFromJson($jsonData);

                try {
                    \Illuminate\Support\Facades\Artisan::call('cache:clear');
                } catch (\Exception $e) {}

                return back()->with('success', 'Database records restored successfully from JSON backup.');
            } else {
                return back()->withErrors(['error' => 'Unsupported backup file format. Please upload a .zip, .sql, or .json file.']);
            }
        } catch (\Exception $e) {
            Log::error('Restore failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'System restore failed: ' . $e->getMessage()]);
        }
    }

    /**
     * Export complete multi-sheet Excel workbook with all HRMS modules
     */
    public function exportAllExcel()
    {
        @ini_set('max_execution_time', '600');
        @ini_set('memory_limit', '512M');

        if (!auth()->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $spreadsheet = new Spreadsheet();
        $spreadsheet->removeSheetByIndex(0); // Remove default blank sheet

        // Styling definitions
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11, 'name' => 'Segoe UI'],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1E293B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['bottom' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => '0F172A']]],
        ];

        $cellStyle = [
            'font' => ['size' => 10, 'name' => 'Segoe UI', 'color' => ['rgb' => '334155']],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E2E8F0']]],
        ];

        // 1. Employees Sheet
        $empSheet = $spreadsheet->createSheet();
        $empSheet->setTitle('Employees');
        $empCols = [
            'Employee Code', 'Full Name', 'Branch / Salon', 'Department', 'Designation', 'System Role',
            'Mobile', 'Email', 'Gender', 'DOB', 'Nationality', 'Sponsor', 'Basic Salary', 'Reported To',
            'Joined Date', 'Shift', 'Visa Type', 'Visa Designation', 'Status', 'Passport Number', 'QID Number'
        ];
        $this->fillStyledSheet($empSheet, $empCols, Employee::with(['company', 'department', 'user.roles'])->orderBy('name')->get()->map(function ($e) {
            return [
                $e->employee_code, $e->name, $e->company ? $e->company->name : '', $e->department ? $e->department->name : '',
                $e->designation, $e->user && $e->user->roles->first() ? $e->user->roles->first()->name : ($e->user ? $e->user->role : ''),
                $e->mobile, $e->email, $e->gender, $e->dob ? (is_string($e->dob) ? $e->dob : $e->dob->format('Y-m-d')) : '',
                $e->nationality, $e->sponsor, (float)($e->basic_salary ?: 0), $e->reported_to,
                $e->joined_date ? (is_string($e->joined_date) ? $e->joined_date : $e->joined_date->format('Y-m-d')) : '',
                $e->shift, $e->visa_type, $e->visa_designation, $e->manual_status ?: ($e->is_active ? 'active' : 'inactive'),
                $e->passport_number, $e->qid_number
            ];
        })->toArray(), $headerStyle, $cellStyle);

        // 2. Salons / Branches Sheet
        $compSheet = $spreadsheet->createSheet();
        $compSheet->setTitle('Salons & Branches');
        $compCols = ['ID', 'Salon / Branch Name', 'Email', 'Phone', 'Address', 'Status', 'Created At'];
        $this->fillStyledSheet($compSheet, $compCols, Company::orderBy('name')->get()->map(function ($c) {
            return [$c->id, $c->name, $c->email, $c->phone, $c->address, $c->status ?? 'active', $c->created_at ? $c->created_at->format('Y-m-d') : ''];
        })->toArray(), $headerStyle, $cellStyle);

        // 3. Departments Sheet
        $deptSheet = $spreadsheet->createSheet();
        $deptSheet->setTitle('Departments');
        $deptCols = ['ID', 'Department Name', 'Branch / Salon', 'Status', 'Created At'];
        $this->fillStyledSheet($deptSheet, $deptCols, Department::with('company')->orderBy('name')->get()->map(function ($d) {
            return [$d->id, $d->name, $d->company ? $d->company->name : '', $d->status ?? 'active', $d->created_at ? $d->created_at->format('Y-m-d') : ''];
        })->toArray(), $headerStyle, $cellStyle);

        // 4. Users Sheet
        $userSheet = $spreadsheet->createSheet();
        $userSheet->setTitle('System Users');
        $userCols = ['ID', 'Full Name', 'Email', 'Role', 'Branch / Salon', 'Created At'];
        $this->fillStyledSheet($userSheet, $userCols, User::with(['company', 'roles'])->orderBy('name')->get()->map(function ($u) {
            return [$u->id, $u->name, $u->email, $u->roles->first() ? $u->roles->first()->name : $u->role, $u->company ? $u->company->name : '', $u->created_at ? $u->created_at->format('Y-m-d') : ''];
        })->toArray(), $headerStyle, $cellStyle);

        // 5. Leave Requests Sheet
        $leaveSheet = $spreadsheet->createSheet();
        $leaveSheet->setTitle('Leave Requests');
        $leaveCols = ['ID', 'Employee Code', 'Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason'];
        $this->fillStyledSheet($leaveSheet, $leaveCols, LeaveRequest::with(['employee', 'leaveType'])->latest()->take(1000)->get()->map(function ($l) {
            return [
                $l->id, $l->employee ? $l->employee->employee_code : '', $l->employee ? $l->employee->name : '',
                $l->leaveType ? $l->leaveType->name : '', (string)$l->start_date, (string)$l->end_date,
                (float)($l->total_days ?: 1), $l->status, $l->reason
            ];
        })->toArray(), $headerStyle, $cellStyle);

        // 6. Salary Postings Sheet
        $salarySheet = $spreadsheet->createSheet();
        $salarySheet->setTitle('Payroll Postings');
        $salaryCols = ['ID', 'Employee Code', 'Employee Name', 'Month / Year', 'Basic Salary', 'Total Allowances', 'Total Deductions', 'Net Salary', 'Status'];
        $this->fillStyledSheet($salarySheet, $salaryCols, SalaryPosting::with('employee')->latest()->take(1000)->get()->map(function ($s) {
            return [
                $s->id, $s->employee ? $s->employee->employee_code : '', $s->employee ? $s->employee->name : '',
                $s->month . '/' . $s->year, (float)($s->basic_salary ?: 0), (float)($s->total_allowance ?: 0),
                (float)($s->total_deduction ?: 0), (float)($s->net_salary ?: 0), $s->status
            ];
        })->toArray(), $headerStyle, $cellStyle);

        // 7. Dropdown Options Sheet
        $optSheet = $spreadsheet->createSheet();
        $optSheet->setTitle('Dropdown Options');
        $optCols = ['ID', 'Category', 'Value', 'Sort Order', 'Is Active'];
        $this->fillStyledSheet($optSheet, $optCols, DropdownOption::orderBy('category')->orderBy('sort_order')->get()->map(function ($o) {
            return [$o->id, $o->category, $o->value, $o->sort_order, $o->is_active ? 'Yes' : 'No'];
        })->toArray(), $headerStyle, $cellStyle);

        $filename = "hrms_complete_data_workbook_" . now()->format('Ymd_His') . ".xlsx";

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
            'Pragma' => 'public',
        ]);
    }

    /**
     * Helper to fill and style a worksheet
     */
    private function fillStyledSheet($sheet, array $columns, array $rows, array $headerStyle, array $cellStyle)
    {
        $sheet->getRowDimension(1)->setRowHeight(30);
        foreach ($columns as $idx => $colName) {
            $colLetter = Coordinate::stringFromColumnIndex($idx + 1);
            $sheet->setCellValue($colLetter . '1', $colName);
        }

        $lastColLetter = Coordinate::stringFromColumnIndex(count($columns));
        $sheet->getStyle("A1:{$lastColLetter}1")->applyFromArray($headerStyle);

        $rowNum = 2;
        foreach ($rows as $row) {
            $sheet->getRowDimension($rowNum)->setRowHeight(22);
            foreach ($row as $cIdx => $val) {
                $cLetter = Coordinate::stringFromColumnIndex($cIdx + 1);
                $sheet->setCellValue($cLetter . $rowNum, $val);
            }

            $bgColor = ($rowNum % 2 === 0) ? 'FFFFFF' : 'F8FAFC';
            $sheet->getStyle("A{$rowNum}:{$lastColLetter}{$rowNum}")->applyFromArray(array_merge($cellStyle, [
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bgColor]],
            ]));

            $rowNum++;
        }

        foreach (range(1, count($columns)) as $colIdx) {
            $colLetter = Coordinate::stringFromColumnIndex($colIdx);
            $sheet->getColumnDimension($colLetter)->setAutoSize(true);
        }

        $sheet->freezePane('A2');
    }

    /**
     * Generate raw SQL dump of all database tables (Driver & Domain Agnostic, Memory-Safe)
     */
    private function generateSqlDump()
    {
        @ini_set('max_execution_time', '600');
        @ini_set('memory_limit', '512M');

        $pdo = DB::getPdo();
        $dbName = DB::getDatabaseName();

        // Discover tables dynamically and exclude ephemeral runtime tables
        $excluded = ['sessions', 'jobs', 'job_batches', 'failed_jobs', 'cache', 'cache_locks', 'password_reset_tokens'];
        $tables = [];
        try {
            $rawTables = DB::select('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
            foreach ($rawTables as $tableObj) {
                $arr = array_values((array)$tableObj);
                if (!empty($arr[0]) && !in_array($arr[0], $excluded)) {
                    $tables[] = $arr[0];
                }
            }
        } catch (\Exception $e) {
            $allTables = \Illuminate\Support\Facades\Schema::getTableListing();
            $tables = array_diff($allTables, $excluded);
        }

        $sql = "-- ========================================================\n";
        $sql .= "-- HRMS Enterprise Complete Database Backup\n";
        $sql .= "-- Generated: " . now()->toDateTimeString() . "\n";
        $sql .= "-- Database: {$dbName}\n";
        $sql .= "-- ========================================================\n\n";
        $sql .= "/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;\n";
        $sql .= "/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;\n";
        $sql .= "/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;\n";
        $sql .= "/*!40101 SET NAMES utf8mb4 */;\n";
        $sql .= "/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;\n";
        $sql .= "/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;\n";
        $sql .= "/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;\n";
        $sql .= "/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;\n\n";

        foreach ($tables as $table) {
            // Get Create Table query
            try {
                $createTableRes = DB::select("SHOW CREATE TABLE `{$table}`");
                $createSql = $createTableRes[0]->{'Create Table'} ?? '';
            } catch (\Exception $e) {
                continue;
            }

            $sql .= "-- --------------------------------------------------------\n";
            $sql .= "-- Table structure for table `{$table}`\n";
            $sql .= "-- --------------------------------------------------------\n";
            $safeCreateSql = preg_replace('/^CREATE TABLE\s+/i', 'CREATE TABLE IF NOT EXISTS ', $createSql);
            $sql .= $safeCreateSql . ";\n\n";

            // Chunked table data dump to conserve memory
            $count = DB::table($table)->count();
            if ($count > 0) {
                $sql .= "-- Dumping data for table `{$table}`\n";
                $sql .= "LOCK TABLES `{$table}` WRITE;\n";
                $sql .= "/*!40000 ALTER TABLE `{$table}` DISABLE KEYS */;\n";

                DB::table($table)->orderByRaw('1')->chunk(500, function ($rows) use (&$sql, $table, $pdo) {
                    if ($rows->count() > 0) {
                        $sql .= "REPLACE INTO `{$table}` VALUES \n";
                        $rowStrings = [];
                        foreach ($rows as $row) {
                            $values = [];
                            foreach ((array)$row as $val) {
                                if ($val === null) {
                                    $values[] = "NULL";
                                } elseif (is_bool($val)) {
                                    $values[] = $val ? '1' : '0';
                                } elseif (is_int($val) || is_float($val)) {
                                    $values[] = (string)$val;
                                } else {
                                    $values[] = $pdo->quote((string)$val);
                                }
                            }
                            $rowStrings[] = "(" . implode(", ", $values) . ")";
                        }
                        $sql .= implode(",\n", $rowStrings) . ";\n";
                    }
                });

                $sql .= "/*!40000 ALTER TABLE `{$table}` ENABLE KEYS */;\n";
                $sql .= "UNLOCK TABLES;\n\n";
            }
        }

        $sql .= "/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;\n";
        $sql .= "/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;\n";
        $sql .= "/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;\n";
        $sql .= "/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;\n";
        $sql .= "/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;\n";
        $sql .= "/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;\n";
        $sql .= "/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;\n";

        return $sql;
    }

    /**
     * Generate JSON export of all database tables
     */
    private function generateAllTablesJson()
    {
        $dbName = DB::getDatabaseName();

        $excluded = ['sessions', 'jobs', 'job_batches', 'failed_jobs', 'cache', 'cache_locks', 'password_reset_tokens'];
        $tables = [];
        try {
            $rawTables = DB::select('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
            foreach ($rawTables as $tableObj) {
                $arr = array_values((array)$tableObj);
                if (!empty($arr[0]) && !in_array($arr[0], $excluded)) {
                    $tables[] = $arr[0];
                }
            }
        } catch (\Exception $e) {
            $allTables = \Illuminate\Support\Facades\Schema::getTableListing();
            $tables = array_diff($allTables, $excluded);
        }

        $data = [
            'metadata' => [
                'generated_at' => now()->toDateTimeString(),
                'database' => $dbName,
                'version' => '1.0',
            ],
            'tables' => [],
        ];

        foreach ($tables as $table) {
            $data['tables'][$table] = DB::table($table)->get()->toArray();
        }

        return $data;
    }

    /**
     * Execute a raw SQL dump against the database safely by splitting queries
     */
    private function executeSqlDump(string $sql)
    {
        @ini_set('max_execution_time', '600');
        @ini_set('memory_limit', '512M');
        @set_time_limit(600);

        $pdo = DB::getPdo();
        $pdo->exec('SET FOREIGN_KEY_CHECKS=0;');
        $pdo->exec('SET UNIQUE_CHECKS=0;');

        // Split queries by semicolon + newline or delimiter
        $queries = preg_split('/;\s*(\r\n|\n)/', $sql);
        foreach ($queries as $query) {
            $trimmed = trim($query);
            if (!empty($trimmed) && !str_starts_with($trimmed, '--') && !str_starts_with($trimmed, '/*')) {
                try {
                    $pdo->exec($trimmed);
                } catch (\Exception $e) {
                    Log::warning('SQL Restore statement notice: ' . $e->getMessage() . ' on query: ' . substr($trimmed, 0, 80));
                }
            }
        }

        $pdo->exec('SET FOREIGN_KEY_CHECKS=1;');
        $pdo->exec('SET UNIQUE_CHECKS=1;');
    }

    /**
     * Restore database from JSON data
     */
    private function restoreFromJson(array $jsonData)
    {
        if (empty($jsonData['tables'])) {
            throw new \Exception('No table data found in JSON file.');
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::beginTransaction();

        try {
            foreach ($jsonData['tables'] as $table => $rows) {
                if (empty($rows)) continue;

                // Truncate table before inserting
                DB::table($table)->truncate();

                // Chunked batch insertion
                $chunks = array_chunk($rows, 100);
                foreach ($chunks as $chunk) {
                    $insertRows = array_map(function ($row) {
                        return (array)$row;
                    }, $chunk);
                    DB::table($table)->insert($insertRows);
                }
            }

            DB::commit();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        } catch (\Exception $e) {
            DB::rollBack();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            throw $e;
        }
    }

    /**
     * Helpers for file sizes & system stats
     */
    private function countMediaFiles()
    {
        $publicStorage = storage_path('app/public');
        if (!File::exists($publicStorage)) return 0;
        return count(File::allFiles($publicStorage));
    }

    private function getMediaSize()
    {
        $publicStorage = storage_path('app/public');
        if (!File::exists($publicStorage)) return '0 MB';
        $bytes = 0;
        foreach (File::allFiles($publicStorage) as $f) {
            $bytes += $f->getSize();
        }
        return $this->formatBytes($bytes);
    }

    private function getDatabaseSize()
    {
        try {
            $dbName = DB::getDatabaseName();
            $res = DB::select("SELECT SUM(data_length + index_length) AS size FROM information_schema.TABLES WHERE table_schema = ?", [$dbName]);
            $bytes = $res[0]->size ?? 0;
            return $this->formatBytes($bytes);
        } catch (\Exception $e) {
            return 'N/A';
        }
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
