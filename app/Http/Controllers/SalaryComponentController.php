<?php

namespace App\Http\Controllers;

use App\Models\SalaryComponent;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalaryComponentController extends Controller
{
    /**
     * Get the authenticated user's company_id
     */
    private function getUserCompanyId()
    {
        $user = auth()->user();
        return $user && $user->employee_id && $user->employee
            ? $user->employee->company_id
            : null;
    }

    public function index()
    {
        $companyId = $this->getUserCompanyId();

        $query = SalaryComponent::query();

        // Filter by company_id for multi-tenancy
        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        $components = $query->latest()->paginate(10);

        return Inertia::render('SalaryComponent/Index', [
            'components' => $components,
        ]);
    }

    public function create()
    {
        // Only admin and HR can create salary components
        $user = auth()->user();
        if (!in_array($user->role, ['admin', 'hr'])) {
            abort(403, 'Unauthorized. Only admin and HR can create salary components.');
        }

        return Inertia::render('SalaryComponent/Create');
    }

    public function store(Request $request)
    {
        // Only admin and HR can create salary components
        $user = auth()->user();
        if (!in_array($user->role, ['admin', 'hr'])) {
            abort(403, 'Unauthorized. Only admin and HR can create salary components.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:allowance,deduction',
            'value_type' => 'required|in:flat,percentage',
            'is_taxable' => 'boolean',
            'default_amount' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Add company_id to the validated data
        $companyId = $this->getUserCompanyId();
        $validated['company_id'] = $companyId;

        SalaryComponent::create($validated);
        return redirect()->route('salary-components.index')->with('success', 'Salary component created successfully!');
    }

    public function show(SalaryComponent $salaryComponent)
    {
        // Authorization check: ensure user can only view their company's components
        $companyId = $this->getUserCompanyId();
        if ($companyId && $salaryComponent->company_id != $companyId) {
            abort(403, 'Unauthorized. You can only view salary components from your company.');
        }

        return Inertia::render('SalaryComponent/Show', [
            'component' => $salaryComponent,
        ]);
    }

    public function edit(SalaryComponent $salaryComponent)
    {
        // Authorization check: ensure user can only edit their company's components
        $companyId = $this->getUserCompanyId();
        if ($companyId && $salaryComponent->company_id != $companyId) {
            abort(403, 'Unauthorized. You can only edit salary components from your company.');
        }

        return Inertia::render('SalaryComponent/Edit', [
            'component' => $salaryComponent,
        ]);
    }

    public function update(Request $request, SalaryComponent $salaryComponent)
    {
        // Authorization check: ensure user can only update their company's components
        $companyId = $this->getUserCompanyId();
        if ($companyId && $salaryComponent->company_id != $companyId) {
            abort(403, 'Unauthorized. You can only update salary components from your company.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:allowance,deduction',
            'value_type' => 'required|in:flat,percentage',
            'is_taxable' => 'boolean',
            'default_amount' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Prevent changing company_id
        unset($validated['company_id']);

        $salaryComponent->update($validated);
        return redirect()->route('salary-components.show', $salaryComponent)->with('success', 'Salary component updated successfully!');
    }

    public function destroy(SalaryComponent $salaryComponent)
    {
        // Only admin can delete salary components
        $user = auth()->user();
        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized. Only admin can delete salary components.');
        }

        // Authorization check: ensure user can only delete their company's components
        $companyId = $this->getUserCompanyId();
        if ($companyId && $salaryComponent->company_id != $companyId) {
            abort(403, 'Unauthorized. You can only delete salary components from your company.');
        }

        $salaryComponent->delete();
        return redirect()->route('salary-components.index')->with('success', 'Salary component deleted successfully!');
    }
}
