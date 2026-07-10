<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $query = Department::with('companies')->withCount('employees');

        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            $query->whereHas('companies', function($q) use ($user) {
                $q->where('companies.id', $user->employee->company_id);
            });
        }

        $departments = $query->get();
        return Inertia::render('Department/Index', [
            'departments' => $departments,
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        $query = Company::orderBy('name');

        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            $query->where('id', $user->employee->company_id);
        }

        $companies = $query->get(['id', 'name']);
        return Inertia::render('Department/Create', [
            'companies' => $companies,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company_ids' => 'required|array',
            'company_ids.*' => 'exists:companies,id',
        ]);

        // Multi-tenancy check: non-admins can only assign to their own company
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            foreach ($validated['company_ids'] as $cid) {
                if ($cid != $user->employee->company_id) {
                    abort(403, 'Unauthorized access to another branch.');
                }
            }
        }

        $department = Department::create(['name' => $validated['name']]);
        $department->companies()->sync($validated['company_ids']);

        return redirect()->route('departments.index')->with('success', 'Department created successfully.');
    }

    public function show(Department $department)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            if (!$department->companies()->where('companies.id', $user->employee->company_id)->exists()) {
                abort(403, 'Unauthorized access to department in another branch.');
            }
        }

        $department->load('companies');
        // Fetch employees in the branches this department belongs to
        $companyIds = $department->companies->pluck('id');
        $employees = \App\Models\Employee::whereIn('company_id', $companyIds)->where('department_id', $department->id)->get();

        return Inertia::render('Department/Show', [
            'department' => $department,
            'employees' => $employees,
        ]);
    }

    public function edit(Department $department)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            if (!$department->companies()->where('companies.id', $user->employee->company_id)->exists()) {
                abort(403, 'Unauthorized access to department in another branch.');
            }
        }
        $department->load('companies');

        $query = Company::orderBy('name');
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            $query->where('id', $user->employee->company_id);
        }

        $companies = $query->get(['id', 'name']);
        return Inertia::render('Department/Edit', [
            'department' => $department,
            'companies' => $companies,
        ]);
    }

    public function update(Request $request, Department $department)
    {
        $user = auth()->user();
        
        // Multi-tenancy check for existing department
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            if (!$department->companies()->where('companies.id', $user->employee->company_id)->exists()) {
                abort(403, 'Unauthorized access to department in another branch.');
            }
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company_ids' => 'required|array',
            'company_ids.*' => 'exists:companies,id',
        ]);

        // Multi-tenancy check for new companies
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            foreach ($validated['company_ids'] as $cid) {
                if ($cid != $user->employee->company_id) {
                    abort(403, 'Cannot assign department to another branch.');
                }
            }
        }

        $department->update(['name' => $validated['name']]);
        $department->companies()->sync($validated['company_ids']);
        
        return redirect()->route('departments.index')->with('success', 'Department updated successfully.');
    }

    public function destroy(Department $department)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            if (!$department->companies()->where('companies.id', $user->employee->company_id)->exists()) {
                abort(403, 'Unauthorized access.');
            }
        }

        $department->delete();
        return redirect()->route('departments.index')->with('success', 'Department deleted successfully.');
    }

    public function getByBranch(Request $request)
    {
        $user = auth()->user();
        $branchId = $request->input('branch_id');

        // Multi-tenancy scoping
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            $branchId = $user->employee->company_id;
        }

        $departments = Department::whereHas('companies', function($q) use ($branchId) {
            $q->where('companies.id', $branchId);
        })->orderBy('name')->get(['departments.id', 'name']);
        
        return response()->json(['departments' => $departments]);
    }

    public function toggleStatus(Request $request, Department $department)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            if (!$department->companies()->where('companies.id', $user->employee->company_id)->exists()) {
                abort(403, 'Unauthorized access.');
            }
        }

        $validated = $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $department->update(['status' => $validated['status']]);

        return back()->with('success', 'Department status updated successfully.');
    }

    public function transferStaff(Request $request, Department $department)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            if (!$department->companies()->where('companies.id', $user->employee->company_id)->exists()) {
                abort(403, 'Unauthorized access.');
            }
        }

        $validated = $request->validate([
            'target_department_id' => 'required|exists:departments,id|different:department_id',
            'branch_id' => 'nullable|exists:companies,id', // Optional: Transfer only for a specific branch
        ]);

        $targetDepartment = Department::findOrFail($validated['target_department_id']);
        
        // Multi-tenancy check for target
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            if (!$targetDepartment->companies()->where('companies.id', $user->employee->company_id)->exists()) {
                abort(403, 'Target department must be in the same branch.');
            }
        }

        $query = \App\Models\Employee::where('department_id', $department->id);

        // Scope by branch if provided or if user is non-admin
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            $query->where('company_id', $user->employee->company_id);
        } elseif ($validated['branch_id'] ?? null) {
            $query->where('company_id', $validated['branch_id']);
        }

        $count = $query->update([
            'department_id' => $validated['target_department_id']
        ]);

        return back()->with('success', "{$count} employees transferred successfully.");
    }
}