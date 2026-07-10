<?php

namespace App\Http\Controllers;

use App\Models\TrainingCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TrainingCategoryController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        // If it's an API request (expects JSON), return JSON for dropdowns
        if ($request->wantsJson()) {
            $categories = TrainingCategory::active()->get();
            return response()->json($categories);
        }

        // Otherwise return the management view (Admin/HR/Manager only)
        if ($user->role === 'employee') {
            abort(403, 'Unauthorized access.');
        }

        $query = TrainingCategory::query();

        // Filter by company for multi-tenancy
        if ($user->role !== 'admin' && $user->employee_id) {
            $query->where('company_id', $user->employee->company_id);
        } elseif ($user->role === 'admin' && $request->has('company_id')) {
            $query->where('company_id', $request->input('company_id'));
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");
        }

        $categories = $query->orderBy('name')->paginate(10);

        return Inertia::render('Training/Categories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search', 'company_id']),
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if ($user->role === 'employee') {
            abort(403, 'Unauthorized access.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color_code' => 'nullable|string|max:7',
        ]);

        $validated['company_id'] = ($user->role !== 'admin' && $user->employee_id) ? $user->employee->company_id : ($request->input('company_id') ?? 1);
        $validated['is_active'] = true;

        TrainingCategory::create($validated);

        return redirect()->back()->with('success', 'Category created successfully!');
    }

    public function update(Request $request, TrainingCategory $trainingCategory)
    {
        $user = auth()->user();
        if ($user->role === 'employee') {
            abort(403, 'Unauthorized access.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color_code' => 'nullable|string|max:7',
            'is_active' => 'boolean',
        ]);

        if ($user->role !== 'admin' && $user->employee_id && $trainingCategory->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access.');
        }
        $trainingCategory->update($validated);

        return redirect()->back()->with('success', 'Category updated successfully!');
    }

    public function destroy(TrainingCategory $trainingCategory)
    {
        $user = auth()->user();
        if ($user->role === 'employee') {
            abort(403, 'Unauthorized access.');
        }

        if ($user->role !== 'admin' && $user->employee_id && $trainingCategory->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access.');
        }
        $trainingCategory->delete();

        return redirect()->back()->with('success', 'Category deleted successfully!');
    }
}
