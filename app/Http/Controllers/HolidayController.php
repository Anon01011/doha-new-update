<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HolidayController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('view-holidays')) {
            // Default to allowing if they are logged in, but scoped
        }

        $query = Holiday::with('company');

        if ($user->isAdmin()) {
            $query->withoutGlobalScope('company');
            if ($request->has('company_id')) {
                $query->where('company_id', $request->company_id);
            } else {
                $query->select('name', 'start_date', 'end_date', 'is_recurring', 'description')
                      ->selectRaw('MIN(id) as id')
                      ->groupBy('name', 'start_date', 'end_date', 'is_recurring', 'description');
            }
        }

        $holidays = $query->orderBy('start_date', 'asc')->paginate(10);
        $companies = $user->isAdmin() ? Company::all(['id', 'name']) : [];

        return Inertia::render('Holiday/Index', [
            'holidays' => $holidays,
            'companies' => $companies,
            'userRole' => $user->role,
            'filters' => $request->only(['company_id']),
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-holidays')) {
            abort(403, 'Unauthorized access.');
        }

        $companies = $user->isAdmin() ? Company::all(['id', 'name']) : [];

        return Inertia::render('Holiday/Create', [
            'companies' => $companies,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-holidays')) {
            abort(403, 'Unauthorized access.');
        }

        $rules = [
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_recurring' => 'boolean',
            'description' => 'nullable|string',
        ];

        if ($user->isAdmin()) {
            $rules['company_ids'] = 'required|array|min:1';
            $rules['company_ids.*'] = 'exists:companies,id';
        }

        $validated = $request->validate($rules);

        if ($user->isAdmin()) {
            foreach ($validated['company_ids'] as $companyId) {
                Holiday::create([
                    'name' => $validated['name'],
                    'start_date' => $validated['start_date'],
                    'end_date' => $validated['end_date'],
                    'is_recurring' => $validated['is_recurring'] ?? false,
                    'company_id' => $companyId,
                    'description' => $validated['description'] ?? null,
                ]);
            }
        } else {
            Holiday::create([
                'name' => $validated['name'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'is_recurring' => $validated['is_recurring'] ?? false,
                'description' => $validated['description'] ?? null,
            ]);
        }

        return redirect()->route('holidays.index')->with('success', 'Holiday(s) created successfully.');
    }

    public function edit(Holiday $holiday)
    {
        $user = auth()->user();
        if (!in_array($user->role, ['admin', 'hr', 'manager'])) {
            abort(403);
        }

        $companies = $user->role === 'admin' ? Company::all(['id', 'name']) : [];
        
        $hq = Holiday::where('name', $holiday->name)
                             ->where('start_date', $holiday->start_date)
                             ->where('end_date', $holiday->end_date);

        if ($user->isAdmin()) {
            $hq->withoutGlobalScope('company');
        }

        $holiday->company_ids = $hq->pluck('company_id')->toArray();

        return Inertia::render('Holiday/Edit', [
            'holiday' => $holiday,
            'companies' => $companies,
        ]);
    }

    public function update(Request $request, Holiday $holiday)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-holidays')) {
            abort(403, 'Unauthorized access.');
        }

        $rules = [
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_recurring' => 'boolean',
            'description' => 'nullable|string',
        ];

        if ($user->isAdmin()) {
            $rules['company_ids'] = 'required|array|min:1';
            $rules['company_ids.*'] = 'exists:companies,id';
        }

        $validated = $request->validate($rules);

        $origName = $holiday->name;
        $origStart = $holiday->start_date;
        $origEnd = $holiday->end_date;

        if ($user->isAdmin()) {
            Holiday::withoutGlobalScope('company')
                   ->where('name', $origName)
                   ->where('start_date', $origStart)
                   ->where('end_date', $origEnd)
                   ->delete();
                   
            foreach ($validated['company_ids'] as $companyId) {
                Holiday::create([
                    'name' => $validated['name'],
                    'start_date' => $validated['start_date'],
                    'end_date' => $validated['end_date'],
                    'is_recurring' => $validated['is_recurring'] ?? false,
                    'company_id' => $companyId,
                    'description' => $validated['description'] ?? null,
                ]);
            }
        } else {
            $holiday->update($validated);
        }

        return redirect()->route('holidays.index')->with('success', 'Holiday updated successfully.');
    }

    public function destroy(Holiday $holiday)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-holidays')) {
            abort(403, 'Unauthorized access.');
        }

        if ($user->isAdmin()) {
            Holiday::withoutGlobalScope('company')
                   ->where('name', $holiday->name)
                   ->where('start_date', $holiday->start_date)
                   ->where('end_date', $holiday->end_date)
                   ->delete();
        } else {
            $holiday->delete();
        }

        return redirect()->route('holidays.index')->with('success', 'Holiday deleted successfully.');
    }
}
