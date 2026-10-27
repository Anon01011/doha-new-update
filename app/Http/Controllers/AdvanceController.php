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

        $advances = $query->latest()->paginate(10)->withQueryString();
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

        // Notify designated approvers (Reporting Manager + Branch HR/Admin)
        $employee = Employee::find($validated['employee_id']);
        if ($employee) {
            \App\Services\NotificationService::notifyApprovers(
                $employee,
                new \App\Notifications\AdvanceRequested($advance, $employee->name),
                $user->id,
                'approve-advances'
            );
        }

        return redirect()->route('advances.index')->with('success', 'Advance request created successfully!');
    }

    public function show(Advance $advance)
    {
        $user = auth()->user();

        // Default-deny: non-privileged users must own this record.
        // Using isEmployee() is insufficient because a user with role=null
        // would bypass the condition entirely (isEmployee() returns false).
        if (!$user->isAdmin() && !$user->isHR() && !$user->isManager() && !$user->hasPermission('view-advances')) {
            if ((int) $advance->employee_id !== (int) $user->employee_id) {
                abort(403, 'Unauthorized access.');
            }
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
            $validated['employee_id'] = $user->employee_id;
        } else {
            $targetEmployee = Employee::findOrFail($validated['employee_id']);
            if ($targetEmployee->company_id !== $advance->company_id) {
                return back()->withErrors(['employee_id' => 'The selected employee must belong to the same branch.'])->withInput();
            }
        }

        $advance->update($validated);
        return redirect()->route('advances.show', $advance)->with('success', 'Advance updated successfully!');
    }

    public function destroy(Advance $advance)
    {
        $user = auth()->user();

        // Default-deny: non-privileged users must own the record AND it must be pending.
        if (!$user->isAdmin() && !$user->isHR() && !$user->isManager() && !$user->hasPermission('approve-advances')) {
            if ((int) $advance->employee_id !== (int) $user->employee_id) {
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

        \App\Services\NotificationService::notifyEmployee(
            $advance->employee_id,
            new \App\Notifications\AdvanceStatusUpdated($advance, 'approved')
        );

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

        \App\Services\NotificationService::notifyEmployee(
            $advance->employee_id,
            new \App\Notifications\AdvanceStatusUpdated($advance, 'rejected')
        );

        return redirect()->back()->with('success', 'Advance request rejected.');
    }
}
