<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR()
            && !$user->hasPermission('view-branches')
            && !$user->hasPermission('view-companies')
            && !$user->hasPermission('manage-companies')
            && !$user->hasPermission('manage-branches')
            && !$user->hasRole('shift-manager')
            && !$user->hasRole('shiftmanager')) {
            abort(403, 'Unauthorized. You do not have permission to view branches.');
        }

        $query = Company::withCount('employees');

        $assignedCompanyIds = $user->getAssignedCompanyIds();
        if (!$user->isAdmin() && !$user->hasPermission('manage-companies') && $assignedCompanyIds->isNotEmpty()) {
            $query->whereIn('id', $assignedCompanyIds);
        }

        $companies = $query->get();
        return inertia('Company/Index', [
            'companies' => $companies,
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-companies') && !$user->hasPermission('manage-branches')) {
            abort(403, 'Only administrators can create new branches.');
        }
        return inertia('Company/Create');
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-companies') && !$user->hasPermission('manage-branches')) {
            abort(403, 'Unauthorized.');
        }
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'weekly_off_days' => 'nullable|array',
            'weekly_off_days.*' => 'string|in:Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
        ]);
        $company = Company::create($validated);
        return redirect()->route('companies.show', $company)->with('success', 'Company created successfully.');
    }

    public function show(Company $company)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR()
            && !$user->hasPermission('view-branches')
            && !$user->hasPermission('view-companies')
            && !$user->hasPermission('manage-companies')
            && !$user->hasPermission('manage-branches')
            && !$user->hasRole('shift-manager')
            && !$user->hasRole('shiftmanager')) {
            abort(403, 'Unauthorized.');
        }
        $assignedCompanyIds = $user->getAssignedCompanyIds();
        if (!$user->isAdmin() && !$user->hasPermission('manage-companies') && $assignedCompanyIds->isNotEmpty() && !$assignedCompanyIds->contains($company->id)) {
            abort(403, 'Unauthorized access.');
        }

        $departments = $company->departments()->orderBy('name')->get(['departments.id', 'name']);
        return inertia('Company/Show', [
            'company' => $company,
            'departments' => $departments,
        ]);
    }

    public function edit(Company $company)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-companies') && !$user->hasPermission('manage-branches')) {
            abort(403, 'Unauthorized.');
        }
        $assignedCompanyIds = $user->getAssignedCompanyIds();
        if (!$user->isAdmin() && !$user->hasPermission('manage-companies') && $assignedCompanyIds->isNotEmpty() && !$assignedCompanyIds->contains($company->id)) {
            abort(403, 'Unauthorized access.');
        }
        return inertia('Company/Edit', [
            'company' => $company,
        ]);
    }

    public function update(Request $request, Company $company)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-companies') && !$user->hasPermission('manage-branches')) {
            abort(403, 'Unauthorized.');
        }
        $assignedCompanyIds = $user->getAssignedCompanyIds();
        if (!$user->isAdmin() && !$user->hasPermission('manage-companies') && $assignedCompanyIds->isNotEmpty() && !$assignedCompanyIds->contains($company->id)) {
            abort(403, 'Unauthorized access.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'weekly_off_days' => 'nullable|array',
            'weekly_off_days.*' => 'string|in:Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
        ]);
        $company->update($validated);
        return redirect()->route('companies.index')->with('success', 'Branch updated successfully.');
    }

    public function destroy(Company $company)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-companies') && !$user->hasPermission('manage-branches')) {
            abort(403, 'Only administrators can delete branches.');
        }
        $company->delete();
        return redirect()->route('companies.index')->with('success', 'Branch deleted successfully.');
    }
}