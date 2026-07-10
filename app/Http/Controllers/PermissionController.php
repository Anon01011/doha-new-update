<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PermissionController extends Controller
{
    // Authorization is handled by route middleware 'role:admin' in routes/web.php

    public function index(Request $request)
    {
        $module = $request->query('module');
        
        $query = Permission::with(['roles', 'users'])->orderBy('module')->orderBy('name');
        
        if ($module) {
            $query->where('module', $module);
        }
        
        $permissions = $query->paginate(50);
        $modules = Permission::distinct()->pluck('module')->filter()->sort()->values();
        
        // Get permission counts per module
        $moduleCounts = Permission::select('module', DB::raw('count(*) as count'))
            ->groupBy('module')
            ->pluck('count', 'module')
            ->toArray();
        
        return Inertia::render('Permission/Index', [
            'permissions' => $permissions,
            'modules' => $modules,
            'selectedModule' => $module,
            'moduleCounts' => $moduleCounts,
        ]);
    }

    public function create()
    {
        $modules = Permission::distinct()->pluck('module')->filter()->sort()->values();
        return Inertia::render('Permission/Create', [
            'modules' => $modules,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:permissions,slug',
            'module' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        Permission::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'module' => $validated['module'] ?? null,
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('permissions.index')->with('success', 'Permission created successfully!');
    }

    public function show(Permission $permission)
    {
        $permission->load(['roles', 'users']);
        return Inertia::render('Permission/Show', [
            'permission' => $permission,
        ]);
    }

    public function edit(Permission $permission)
    {
        $modules = Permission::distinct()->pluck('module')->filter()->sort()->values();
        return Inertia::render('Permission/Edit', [
            'permission' => $permission,
            'modules' => $modules,
        ]);
    }

    public function update(Request $request, Permission $permission)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:permissions,slug,' . $permission->id,
            'module' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $permission->update($validated);

        return redirect()->route('permissions.index')->with('success', 'Permission updated successfully!');
    }

    public function destroy(Permission $permission)
    {
        $permission->delete();
        return redirect()->route('permissions.index')->with('success', 'Permission deleted successfully!');
    }
}
