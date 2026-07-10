<?php

namespace App\Http\Controllers;

use App\Models\DropdownOption;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DropdownOptionController extends Controller
{
    public function index()
    {
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Unauthorized.');
        }

        $options = DropdownOption::orderBy('category')
            ->orderBy('sort_order')
            ->get()
            ->groupBy('category');

        return Inertia::render('Settings/DropdownOptions', [
            'groupedOptions' => $options,
        ]);
    }

    public function store(Request $request)
    {
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'category' => 'required|string|max:255',
            'value' => 'required|string|max:255',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        DropdownOption::create($validated);

        return back()->with('success', 'Option created successfully.');
    }

    public function update(Request $request, DropdownOption $dropdownOption)
    {
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'value' => 'required|string|max:255',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $dropdownOption->update($validated);

        return back()->with('success', 'Option updated successfully.');
    }

    public function destroy(DropdownOption $dropdownOption)
    {
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Unauthorized.');
        }

        $dropdownOption->delete();

        return back()->with('success', 'Option deleted successfully.');
    }

    // API method to get options for frontend forms
    public function getOptions()
    {
        $options = DropdownOption::where('is_active', true)
            ->where('category', '!=', 'Gender')
            ->orderBy('sort_order')
            ->get()
            ->groupBy('category')
            ->map(function ($group) {
                return $group->pluck('value');
            });

        // Map database categories to frontend keys if necessary
        // For now, we'll assume the seeder keys match what the frontend expects
        // But we might need to normalize keys (e.g., "Visa Type" -> "visa_types")

        $normalizedOptions = [];
        foreach ($options as $category => $values) {
            $key = strtolower(str_replace(' ', '_', $category)) . 's'; // e.g., "Visa Type" -> "visa_types"
            // Handle special cases if any
            if ($category === 'Gender')
                $key = 'genders';
            if ($category === 'Shift')
                $key = 'shifts';

            $normalizedOptions[$key] = $values;
        }

        return response()->json($normalizedOptions);
    }
}
