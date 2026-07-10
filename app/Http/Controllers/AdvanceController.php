<?php

namespace App\Http\Controllers;

use App\Models\Advance;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdvanceController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');
        $search = $request->query('search');
        $query = Advance::with('employee');

        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('view-advances')) {
             // Default behavior for employees is to see their own
        }

        // Global multi-tenancy scope handles branch isolation automatically.

        // Role-based filtering (additional to global scope)
        if ($user->isEmployee() && $user->employee_id) {
            // Employees see only their own advances
            $query->where('employee_id', $user->employee_id);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('purpose', 'like', "%{$search}%")
                    ->orWhereHas('employee', function ($emp) use ($search) {
                        $emp->where('name', 'like', "%{$search}%")
                            ->orWhere('employee_code', 'like', "%{$search}%");
                    });
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        $advances = $query->latest()->paginate(10);
        return Inertia::render('Advance/Index', [
            'advances' => $advances,
            'status' => $status,
            'search' => $search,
            'userRole' => $user->role,
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('create-advances')) {
             // Employees can usually create for themselves
        }

        // Role-based employee selection (Global scope handles branch isolation)
        $empQuery = Employee::query()->orderBy('name');
        if ($user->isEmployee() && $user->employee_id) {
            $empQuery->where('id', $user->employee_id);
        }

        $employees = $empQuery->get(['id', 'name', 'employee_code']);

        return Inertia::render('Advance/Create', [
            'employees' => $employees,
            'userRole' => $user->role,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'amount' => 'required|numeric|gt:0',
            'request_date' => 'required|date',
            'purpose' => 'nullable|string|max:1000',
            'repayment_date' => 'nullable|date|after_or_equal:request_date',
        ]);

        // Employees can only create advances for themselves.
        // BelongsToCompany handles multi-tenancy for managers/admins.
        if ($user->isEmployee() && $user->employee_id && $validated['employee_id'] != $user->employee_id) {
             abort(403, 'You can only create advances for yourself.');
        }

        $validated['status'] = 'pending';
        $advance = Advance::create($validated);

        // Notify Admins
        $admins = \App\Models\User::where('role', 'admin')->get();
        $employee = Employee::find($validated['employee_id']);
        foreach ($admins as $admin) {
            $admin->notify(new \App\Notifications\AdvanceRequested($advance, $employee->name));
        }

        return redirect()->route('advances.index')->with('success', 'Advance request created successfully!');
    }

    public function show(Advance $advance)
    {
        $user = auth()->user();
        if ($user->role === 'employee' && $advance->employee_id != $user->employee_id) {
            abort(403, 'Unauthorized access.');
        }

        $advance->load('employee', 'approver');
        return Inertia::render('Advance/Show', [
            'advance' => $advance,
            'userRole' => $user->role,
        ]);
    }

    public function edit(Advance $advance)
    {
        $user = auth()->user();
        if ($user->isEmployee()) {
            if ($advance->employee_id != $user->employee_id) {
                abort(403, 'Unauthorized access.');
            }
            if ($advance->status !== 'pending') {
                abort(403, 'You cannot edit an advance request that is already processed.');
            }
        }

        $empQuery = Employee::query()->orderBy('name');
        if ($user->isEmployee() && $user->employee_id) {
            $empQuery->where('id', $advance->employee_id);
        }
        $employees = $empQuery->get(['id', 'name', 'employee_code']);
        return Inertia::render('Advance/Edit', [
            'advance' => $advance,
            'employees' => $employees,
            'userRole' => $user->role,
        ]);
    }

    public function update(Request $request, Advance $advance)
    {
        $user = auth()->user();
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'amount' => 'required|numeric|gt:0',
            'request_date' => 'required|date',
            'purpose' => 'nullable|string|max:1000',
            'repayment_date' => 'nullable|date|after_or_equal:request_date',
        ]);

        if ($user->isEmployee()) {
            if ($advance->employee_id != $user->employee_id) {
                abort(403, 'Unauthorized access.');
            }
            if ($advance->status !== 'pending') {
                abort(403, 'You cannot update an advance request that is already processed.');
            }
        }

        $advance->update($validated);
        return redirect()->route('advances.show', $advance)->with('success', 'Advance updated successfully!');
    }

    public function destroy(Advance $advance)
    {
        $user = auth()->user();
        if ($user->role === 'employee') {
            if ($advance->employee_id != $user->employee_id) {
                abort(403, 'Unauthorized access.');
            }
            if ($advance->status !== 'pending') {
                abort(403, 'You cannot delete an advance request that is already processed.');
            }
        }

        $advance->delete();
        return redirect()->route('advances.index')->with('success', 'Advance deleted successfully!');
    }

    public function approve(Request $request, Advance $advance)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('approve-advances')) {
            abort(403, 'Unauthorized. Only admin and HR (or those with permission) can approve advances.');
        }

        $advance->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        $this->notifyEmployee($advance->employee_id, new \App\Notifications\AdvanceStatusUpdated($advance, 'approved'));

        return redirect()->back()->with('success', 'Advance approved successfully!');
    }

    public function reject(Request $request, Advance $advance)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('approve-advances')) {
            abort(403, 'Unauthorized.');
        }

        $advance->update([
            'status' => 'rejected',
            'remarks' => $request->remarks ? $advance->remarks . "\nRejection Reason: " . $request->remarks : $advance->remarks,
        ]);

        $this->notifyEmployee($advance->employee_id, new \App\Notifications\AdvanceStatusUpdated($advance, 'rejected'));

        return redirect()->back()->with('success', 'Advance request rejected.');
    }
    /**
     * Helper to notify employee
     */
    private function notifyEmployee($employeeId, $notification)
    {
        $employee = Employee::find($employeeId);
        if ($employee && $employee->user) {
            try {
                $employee->user->notify($notification);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Notification failed: ' . $e->getMessage());
            }
        }
    }
}
