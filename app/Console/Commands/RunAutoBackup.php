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
        @ini_set('max_execution_time', '0');
        @set_time_limit(0);
        @ini_set('memory_limit', '1024M');
        @ignore_user_abort(true);

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

                // Database Dump to disk first
                $tempSqlPath = storage_path('app/temp_auto_dump_' . $timestamp . '.sql');
                $sqlContent = $this->generateSqlDump();
                File::put($tempSqlPath, $sqlContent);
                $zip->addFile($tempSqlPath, 'database_dump.sql');

                // Media Files with Fast STORE
                $storagePublicPath = storage_path('app/public');
                if (File::exists($storagePublicPath)) {
                    $mediaFiles = File::allFiles($storagePublicPath);
                    foreach ($mediaFiles as $mediaFile) {
                        $relativePath = 'storage/' . $mediaFile->getRelativePathname();
                        $zip->addFile($mediaFile->getRealPath(), $relativePath);
                        $zip->setCompressionName($relativePath, ZipArchive::CM_STORE);
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

                if (File::exists($tempSqlPath)) {
                    File::delete($tempSqlPath);
                }

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

            // Cleanup only automated backups exceeding retention days (never delete manual backups)
            if ($retentionDays > 0) {
                $cutoff = now()->subDays($retentionDays)->timestamp;
                $files = File::files($backupPath);
                $deletedCount = 0;
                foreach ($files as $file) {
                    $filename = $file->getFilename();
                    if (str_starts_with($filename, 'hrms_auto_') && $file->getMTime() < $cutoff) {
                        File::delete($file->getRealPath());
                        $deletedCount++;
                    }
                }
                if ($deletedCount > 0) {
                    $this->info("Purged {$deletedCount} old auto-backup files older than {$retentionDays} days.");
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
        $pdo = DB::getPdo();
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

        $sql = "-- ========================================================\n";
        $sql .= "-- HRMS Enterprise Complete Automated Database Backup\n";
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
}
