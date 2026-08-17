<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Setting;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use ZipArchive;

class RunAutoBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:auto-run {--force : Force backup creation regardless of schedule}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run scheduled automated system backup (database and media) based on settings';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $force = $this->option('force');
        $enabled = Setting::get('auto_backup_enabled', '0') === '1';

        if (!$enabled && !$force) {
            $this->info('Automated backup is disabled in system settings.');
            return 0;
        }

        $includeMedia = Setting::get('include_media_files', '1') === '1';
        $retentionDays = (int) Setting::get('backup_retention_days', 30);
        $backupPath = storage_path('app/backups');

        if (!File::exists($backupPath)) {
            File::makeDirectory($backupPath, 0755, true);
        }

        $timestamp = now()->format('Ymd_His');
        $this->info("Starting automated backup [{$timestamp}]...");

        try {
            if ($includeMedia) {
                $zipFilename = "hrms_auto_backup_{$timestamp}.zip";
                $zipFullPath = $backupPath . DIRECTORY_SEPARATOR . $zipFilename;

                $zip = new ZipArchive();
                if ($zip->open($zipFullPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                    $this->error('Failed to create ZIP archive.');
                    return 1;
                }

                // Database Dump
                $sqlContent = $this->generateSqlDump();
                $zip->addFromString('database_dump.sql', $sqlContent);

                // Media Files
                $storagePublicPath = storage_path('app/public');
                if (File::exists($storagePublicPath)) {
                    $mediaFiles = File::allFiles($storagePublicPath);
                    foreach ($mediaFiles as $mediaFile) {
                        $relativePath = 'storage/' . $mediaFile->getRelativePathname();
                        $zip->addFile($mediaFile->getRealPath(), $relativePath);
                    }
                }

                $manifest = [
                    'system_name' => config('app.name', 'HRMS System'),
                    'backup_date' => now()->toDateTimeString(),
                    'backup_type' => 'Automated Full System Backup (Database + Media)',
                    'auto_generated' => true,
                ];
                $zip->addFromString('manifest.json', json_encode($manifest, JSON_PRETTY_PRINT));
                $zip->close();

                $this->info("Automated full backup created successfully: {$zipFilename}");
                Log::info("Automated full backup created: {$zipFilename}");
            } else {
                $sqlFilename = "hrms_auto_db_backup_{$timestamp}.sql";
                $sqlFullPath = $backupPath . DIRECTORY_SEPARATOR . $sqlFilename;

                $sqlContent = $this->generateSqlDump();
                File::put($sqlFullPath, $sqlContent);

                $this->info("Automated database backup created successfully: {$sqlFilename}");
                Log::info("Automated database backup created: {$sqlFilename}");
            }

            // Cleanup old backups exceeding retention days
            if ($retentionDays > 0) {
                $cutoff = now()->subDays($retentionDays)->timestamp;
                $files = File::files($backupPath);
                $deletedCount = 0;
                foreach ($files as $file) {
                    if ($file->getMTime() < $cutoff) {
                        File::delete($file->getRealPath());
                        $deletedCount++;
                    }
                }
                if ($deletedCount > 0) {
                    $this->info("Purged {$deletedCount} old backup files older than {$retentionDays} days.");
                }
            }

            return 0;
        } catch (\Exception $e) {
            $this->error('Automated backup failed: ' . $e->getMessage());
            Log::error('Automated backup failed: ' . $e->getMessage());
            return 1;
        }
    }

    private function generateSqlDump()
    {
        $tables = DB::select('SHOW TABLES');
        $dbName = DB::getDatabaseName();
        $key = 'Tables_in_' . $dbName;

        $sql = "-- HRMS Automated Database Backup\n";
        $sql .= "-- Generated: " . now()->toDateTimeString() . "\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        foreach ($tables as $tableObj) {
            $table = $tableObj->$key;
            $createTableRes = DB::select("SHOW CREATE TABLE `{$table}`");
            $createSql = $createTableRes[0]->{'Create Table'} ?? '';

            $sql .= "DROP TABLE IF EXISTS `{$table}`;\n";
            $sql .= $createSql . ";\n\n";

            $rows = DB::table($table)->get();
            if ($rows->count() > 0) {
                $sql .= "INSERT INTO `{$table}` VALUES \n";
                $rowStrings = [];
                foreach ($rows as $row) {
                    $values = [];
                    foreach ((array)$row as $val) {
                        if ($val === null) {
                            $values[] = "NULL";
                        } elseif (is_numeric($val)) {
                            $values[] = $val;
                        } else {
                            $values[] = "'" . addslashes((string)$val) . "'";
                        }
                    }
                    $rowStrings[] = "(" . implode(", ", $values) . ")";
                }
                $sql .= implode(",\n", $rowStrings) . ";\n\n";
            }
        }

        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
        return $sql;
    }
}
