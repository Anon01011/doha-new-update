<?php

namespace App\Http\Controllers;

use App\Models\DropdownOption;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DropdownOptionController extends Controller
{
    private function checkPermission()
    {
        $user = auth()->user();
        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        if (!$user->isAdmin() && !$user->hasRole('admin') && !$user->hasRole('hr') && !$user->hasPermission('manage-settings')) {
            abort(403, 'Unauthorized. You do not have permission to manage dropdown options.');
        }
    }

    public function index()
    {
        $this->checkPermission();

        // Standard predefined categories to always show in settings
        $standardCategories = [
            'Gender',
            'Designation',
            'Shift',
            'Employee Category',
            'Contract Duration',
            'Visa Type',
            'Visa Designation',
            'Exit Status',
            'Payment Type',
            'Leave Status',
            'Attendance Status',
            'Loan Type',
        ];

        $options = DropdownOption::orderBy('category')
            ->orderBy('sort_order')
            ->orderBy('value')
            ->get()
            ->groupBy('category')
            ->toArray();

        // Ensure standard categories exist in groupedOptions even if empty
        foreach ($standardCategories as $cat) {
            if (!isset($options[$cat])) {
                $options[$cat] = [];
            }
        }

        ksort($options);

        return Inertia::render('Settings/DropdownOptions', [
            'groupedOptions' => $options,
            'standardCategories' => $standardCategories,
        ]);
    }

    public function store(Request $request)
    {
        $this->checkPermission();

        $validated = $request->validate([
            'category' => 'required|string|max:255',
            'value' => 'required|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['category'] = trim($validated['category']);
        $validated['value'] = trim($validated['value']);

        if (!isset($validated['sort_order']) || $validated['sort_order'] === null || $validated['sort_order'] === '') {
            $maxSort = DropdownOption::where('category', $validated['category'])->max('sort_order') ?? 0;
            $validated['sort_order'] = $maxSort + 1;
        }

        if (!isset($validated['is_active'])) {
            $validated['is_active'] = true;
        }

        DropdownOption::create($validated);

        return back()->with('success', 'Dropdown option created successfully.');
    }

    public function update(Request $request, DropdownOption $dropdownOption)
    {
        $this->checkPermission();

        $validated = $request->validate([
            'category' => 'sometimes|required|string|max:255',
            'value' => 'required|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if (isset($validated['category'])) {
            $validated['category'] = trim($validated['category']);
        }
        $validated['value'] = trim($validated['value']);

        if (array_key_exists('sort_order', $validated) && ($validated['sort_order'] === null || $validated['sort_order'] === '')) {
            $validated['sort_order'] = 0;
        }

        $dropdownOption->update($validated);

        return back()->with('success', 'Dropdown option updated successfully.');
    }

    public function destroy(DropdownOption $dropdownOption)
    {
        $this->checkPermission();

        $dropdownOption->delete();

        return back()->with('success', 'Dropdown option deleted successfully.');
    }

    // API method to get options for frontend forms
    public function getOptions()
    {
        $options = DropdownOption::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('value')
            ->get()
            ->groupBy('category')
            ->map(function ($group) {
                return $group->pluck('value')->values();
            });

        $normalizedOptions = [];
        foreach ($options as $category => $values) {
            $key = strtolower(str_replace(' ', '_', $category)) . 's'; // e.g., "Visa Type" -> "visa_types"
            if ($category === 'Gender') {
                $key = 'genders';
            } elseif ($category === 'Shift') {
                $key = 'shifts';
            }

            $normalizedOptions[$key] = $values;
        }

        return response()->json($normalizedOptions);
    }
}

