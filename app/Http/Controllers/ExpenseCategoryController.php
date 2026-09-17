<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpenseCategoryController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('manage-expense-categories')) {
            abort(403, 'Unauthorized.');
        }

        $query = ExpenseCategory::with('company');

        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            $query->where(function($q) use ($user) {
                $q->where('company_id', $user->employee->company_id)
                  ->orWhereNull('company_id');
            });
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $categories = $query->orderBy('name')->get();
        $companies = $user->isAdmin() ? Company::orderBy('name')->get(['id', 'name']) : [];

        return Inertia::render('Expenses/Categories/Index', [
            'categories' => $categories,
            'companies' => $companies,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('manage-expense-categories')) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50',
            'description' => 'nullable|string|max:1000',
            'policy_limit_amount' => 'nullable|numeric|min:0',
            'requires_receipt' => 'boolean',
            'is_tax_deductible' => 'boolean',
            'is_active' => 'boolean',
            'company_id' => 'nullable|exists:companies,id',
        ]);

        $companyId = $user->isAdmin() ? ($validated['company_id'] ?? null) : ($user->employee ? $user->employee->company_id : null);

        ExpenseCategory::create(array_merge($validated, [
            'company_id' => $companyId,
        ]));

        return redirect()->back()->with('success', 'Expense category created successfully.');
    }

    public function update(Request $request, ExpenseCategory $category)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('manage-expense-categories')) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50',
            'description' => 'nullable|string|max:1000',
            'policy_limit_amount' => 'nullable|numeric|min:0',
            'requires_receipt' => 'boolean',
            'is_tax_deductible' => 'boolean',
            'is_active' => 'boolean',
            'company_id' => 'nullable|exists:companies,id',
        ]);

        $category->update($validated);

        return redirect()->back()->with('success', 'Expense category updated successfully.');
    }

    public function destroy(ExpenseCategory $category)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('manage-expense-categories')) {
            abort(403, 'Unauthorized.');
        }

        if ($category->claims()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete category that has existing expense claims. You can deactivate it instead.');
        }

        $category->delete();
        return redirect()->back()->with('success', 'Expense category deleted.');
    }
}
