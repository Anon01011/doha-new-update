<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Get all unique (company_id, department) pairs from employees
        $departments = DB::table('employees')
            ->select('company_id', 'department')
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->distinct()
            ->get();

        // 2. Insert into departments table if not exists
        foreach ($departments as $dept) {
            if (!DB::table('departments')->where('name', $dept->department)->where('company_id', $dept->company_id)->exists()) {
                DB::table('departments')->insert([
                    'name' => $dept->department,
                    'company_id' => $dept->company_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 3. Update employees with department_id
        $allDepartments = DB::table('departments')->get();
        $employees = DB::table('employees')->whereNotNull('department')->where('department', '!=', '')->get();
        foreach ($employees as $emp) {
            $dept = $allDepartments->first(function ($d) use ($emp) {
                return $d->name === $emp->department && $d->company_id == $emp->company_id;
            });
            if ($dept) {
                DB::table('employees')->where('id', $emp->id)->update(['department_id' => $dept->id]);
            }
        }
    }

    public function down(): void
    {
        // This migration is not reversible
    }
}; 