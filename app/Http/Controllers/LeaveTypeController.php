<?php

namespace App\Http\Controllers;

use App\Models\LeaveType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveTypeController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        if (!$user->can('manage-leave-types') && !$user->hasPermission('manage-leave-types')) {
            abort(403, 'Unauthorized. You do not have permission to view leave types.');
        }

        $query = LeaveType::latest();

        // Multi-tenancy scoping
        $companyId = $user->company_id;
        if (!$companyId && $user->employee_id && $user->employee) {
            $companyId = $user->employee->company_id;
        }

        if ($user->role !== 'admin' && $companyId) {
            $query->where('company_id', $companyId);
        }

        $leaveTypes = $query->paginate(10);
        return Inertia::render('LeaveType/Index', [
            'leaveTypes' => $leaveTypes,
        ]);
    }

    public function create()
    {
        // Check for permission instead of role
        $user = auth()->user();
        if (!$user->can('manage-leave-types') && !$user->hasPermission('manage-leave-types')) {
            abort(403, 'Unauthorized. You do not have permission to create leave types.');
        }

        return Inertia::render('LeaveType/Create');
    }

    public function store(Request $request)
    {
        // Check for permission instead of role
        $user = auth()->user();
        if (!$user->can('manage-leave-types') && !$user->hasPermission('manage-leave-types')) {
            abort(403, 'Unauthorized. You do not have permission to create leave types.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:leave_types,code',
            'company_id' => 'required_if:user_role,admin|exists:companies,id',
            'max_days_per_year' => 'required|integer|min:0',
            'carry_forward_allowed' => 'boolean',
            'carry_forward_max_days' => 'nullable|integer|min:0',
            'requires_approval' => 'boolean',
            'is_paid' => 'boolean',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $companyId = $user->company_id;
        if (!$companyId && $user->employee_id && $user->employee) {
            $companyId = $user->employee->company_id;
        }

        if ($companyId) {
            $validated['company_id'] = $companyId;
        }

        LeaveType::create($validated);
        return redirect()->route('leave-types.index')->with('success', 'Leave type created successfully!');
    }

    public function show(LeaveType $leaveType)
    {
        $user = auth()->user();

        // Multi-tenancy check
        $companyId = $user->company_id;
        if (!$companyId && $user->employee_id && $user->employee) {
            $companyId = $user->employee->company_id;
        }

        if ($user->role !== 'admin' && $companyId) {
            if ($leaveType->company_id != $companyId) {
                abort(403, 'Unauthorized access to leave type of another branch.');
            }
        }

        return Inertia::render('LeaveType/Show', [
            'leaveType' => $leaveType,
        ]);
    }

    public function edit(LeaveType $leaveType)
    {
        $user = auth()->user();
        if (!$user->can('manage-leave-types') && !$user->hasPermission('manage-leave-types')) {
            abort(403, 'Unauthorized. You do not have permission to edit leave types.');
        }

        // Multi-tenancy check
        $companyId = $user->company_id;
        if (!$companyId && $user->employee_id && $user->employee) {
            $companyId = $user->employee->company_id;
        }

        if ($user->role !== 'admin' && $companyId) {
            if ($leaveType->company_id != $companyId) {
                abort(403, 'Unauthorized access to leave type of another branch.');
            }
        }

        return Inertia::render('LeaveType/Edit', [
            'leaveType' => $leaveType,
        ]);
    }

    public function update(Request $request, LeaveType $leaveType)
    {
        $user = auth()->user();
        if (!$user->can('manage-leave-types') && !$user->hasPermission('manage-leave-types')) {
            abort(403, 'Unauthorized. You do not have permission to update leave types.');
        }

        // Multi-tenancy check
        $companyId = $user->company_id;
        if (!$companyId && $user->employee_id && $user->employee) {
            $companyId = $user->employee->company_id;
        }

        if ($user->role !== 'admin' && $companyId) {
            if ($leaveType->company_id != $companyId) {
                abort(403, 'Unauthorized access to leave type of another branch.');
            }
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:leave_types,code,' . $leaveType->id,
            'company_id' => 'required_if:user_role,admin|exists:companies,id',
            'max_days_per_year' => 'required|integer|min:0',
            'carry_forward_allowed' => 'boolean',
            'carry_forward_max_days' => 'nullable|integer|min:0',
            'requires_approval' => 'boolean',
            'is_paid' => 'boolean',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $companyId = $user->company_id;
        if (!$companyId && $user->employee_id && $user->employee) {
            $companyId = $user->employee->company_id;
        }

        if ($companyId) {
            $validated['company_id'] = $companyId;
        }

        $leaveType->update($validated);
        return redirect()->route('leave-types.show', $leaveType)->with('success', 'Leave type updated successfully!');
    }

    public function destroy(LeaveType $leaveType)
    {
        // Check for permission instead of role
        $user = auth()->user();
        if (!$user->can('manage-leave-types') && !$user->hasPermission('manage-leave-types')) {
            abort(403, 'Unauthorized. You do not have permission to delete leave types.');
        }

        // Multi-tenancy check
        $companyId = $user->company_id;
        if (!$companyId && $user->employee_id && $user->employee) {
            $companyId = $user->employee->company_id;
        }

        if ($user->role !== 'admin' && $companyId) {
            if ($leaveType->company_id != $companyId) {
                abort(403, 'Unauthorized access to leave type of another branch.');
            }
        }

        $leaveType->delete();
        return redirect()->route('leave-types.index')->with('success', 'Leave type deleted successfully!');
    }
}
