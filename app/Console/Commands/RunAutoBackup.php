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
        return \App\Services\BackupService::generateSqlDump();
    }
}
