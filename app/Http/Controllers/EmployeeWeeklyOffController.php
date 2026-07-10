<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeWeeklyOff;
use Illuminate\Http\Request;
use Carbon\Carbon;

class EmployeeWeeklyOffController extends Controller
{
    private array $validDays = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];

    /**
     * List all weekly off records for a given employee.
     */
    public function index(Employee $employee)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('edit-employees')) {
            abort(403, 'Unauthorized.');
        }

        $employee->load(['weeklyOffs', 'company']);

        return response()->json([
            'employee'   => $employee->only(['id', 'name', 'employee_code']),
            'weekly_offs' => $employee->weeklyOffs,
            'branch_weekly_off_days' => $employee->company->weekly_off_days ?? [],
        ]);
    }

    /**
     * Store a new staff-wise weekly off record.
     */
    public function store(Request $request, Employee $employee)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('edit-employees')) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'weekly_off_day' => 'required|string|in:' . implode(',', $this->validDays),
            'effective_date' => 'required|date',
        ]);

        // Prevent duplicate: same day + same effective_date for this employee
        $existing = EmployeeWeeklyOff::where('employee_id', $employee->id)
            ->where('weekly_off_day', $validated['weekly_off_day'])
            ->where('effective_date', $validated['effective_date'])
            ->first();

        if ($existing) {
            return back()->withErrors(['weekly_off_day' => 'A weekly off record for this day and date already exists.']);
        }

        EmployeeWeeklyOff::create([
            'employee_id'    => $employee->id,
            'weekly_off_day' => $validated['weekly_off_day'],
            'effective_date' => $validated['effective_date'],
        ]);

        return back()->with('success', 'Weekly off configured successfully.');
    }

    /**
     * Update an existing weekly off record.
     */
    public function update(Request $request, Employee $employee, EmployeeWeeklyOff $weeklyOff)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('edit-employees')) {
            abort(403, 'Unauthorized.');
        }

        if ((int) $weeklyOff->employee_id !== (int) $employee->id) {
            abort(403, 'Record does not belong to this employee.');
        }

        $validated = $request->validate([
            'weekly_off_day' => 'required|string|in:' . implode(',', $this->validDays),
            'effective_date' => 'required|date',
        ]);

        $weeklyOff->update($validated);

        return back()->with('success', 'Weekly off updated successfully.');
    }

    /**
     * Delete a weekly off record.
     */
    public function destroy(Employee $employee, EmployeeWeeklyOff $weeklyOff)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('edit-employees')) {
            abort(403, 'Unauthorized.');
        }

        if ((int) $weeklyOff->employee_id !== (int) $employee->id) {
            abort(403, 'Record does not belong to this employee.');
        }

        $weeklyOff->delete();

        return back()->with('success', 'Weekly off record removed.');
    }
}
