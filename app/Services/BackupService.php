<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class BackupService
{
    /**
     * Ephemeral or runtime tables to exclude from database dumps.
     */
    protected const EXCLUDED_TABLES = [
        'sessions',
        'jobs',
        'job_batches',
        'failed_jobs',
        'cache',
        'cache_locks',
        'password_reset_tokens',
    ];

    /**
     * Generate raw SQL dump of all database tables (Driver & Domain Agnostic, Memory-Safe).
     */
    public static function generateSqlDump(): string
    {
        @ini_set('max_execution_time', '600');
        @ini_set('memory_limit', '512M');

        $pdo = DB::getPdo();
        $dbName = DB::getDatabaseName();

        $tables = [];
        try {
            $rawTables = DB::select('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
            foreach ($rawTables as $tableObj) {
                $arr = array_values((array)$tableObj);
                if (!empty($arr[0]) && !in_array($arr[0], self::EXCLUDED_TABLES, true)) {
                    $tables[] = $arr[0];
                }
            }
        } catch (\Exception $e) {
            $allTables = Schema::getTableListing();
            $tables = array_diff($allTables, self::EXCLUDED_TABLES);
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

    /**
     * Execute a raw SQL dump against the database from a file stream without memory exhaustion.
     */
    public static function executeSqlDumpFromFile(string $filePath): void
    {
        @ini_set('max_execution_time', '0');
        @set_time_limit(0);
        @ini_set('memory_limit', '1024M');

        $pdo = DB::getPdo();
        $pdo->exec('SET FOREIGN_KEY_CHECKS=0;');
        $pdo->exec('SET UNIQUE_CHECKS=0;');

        $handle = fopen($filePath, 'r');
        if (!$handle) {
            throw new \Exception("Cannot open SQL dump file for execution.");
        }

        $currentQuery = '';
        while (($line = fgets($handle)) !== false) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '--') || str_starts_with($trimmed, '/*')) {
                continue;
            }

            $currentQuery .= $line;

            if (str_ends_with($trimmed, ';')) {
                try {
                    $pdo->exec($currentQuery);
                } catch (\Exception $e) {
                    Log::error('SQL Restore Error: ' . $e->getMessage() . ' | Query: ' . substr($currentQuery, 0, 100));
                    fclose($handle);
                    $pdo->exec('SET FOREIGN_KEY_CHECKS=1;');
                    $pdo->exec('SET UNIQUE_CHECKS=1;');
                    throw new \Exception("Database restore failed at query: " . substr($currentQuery, 0, 100) . " - " . $e->getMessage());
                }
                $currentQuery = '';
            }
        }

        if (!empty(trim($currentQuery))) {
            try {
                $pdo->exec($currentQuery);
            } catch (\Exception $e) {
                Log::error('SQL Restore Error: ' . $e->getMessage() . ' | Query: ' . substr($currentQuery, 0, 100));
                $pdo->exec('SET FOREIGN_KEY_CHECKS=1;');
                $pdo->exec('SET UNIQUE_CHECKS=1;');
                throw new \Exception("Database restore failed at final query: " . substr($currentQuery, 0, 100) . " - " . $e->getMessage());
            }
        }

        fclose($handle);

        $pdo->exec('SET FOREIGN_KEY_CHECKS=1;');
        $pdo->exec('SET UNIQUE_CHECKS=1;');
    }
}
