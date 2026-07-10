<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RoleController extends Controller
{
    // Authorization is handled by route middleware 'role:admin' in routes/web.php

    public function index()
    {
        $roles = Role::with(['permissions', 'users'])->latest()->paginate(10);
        return Inertia::render('Role/Index', [
            'roles' => $roles,
        ]);
    }

    public function create()
    {
        $permissions = Permission::where('is_active', true)->orderBy('module')->orderBy('name')->get();
        return Inertia::render('Role/Create', [
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'slug' => 'required|string|max:255|unique:roles,slug',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        if (isset($validated['permissions'])) {
            $role->assignPermissions($validated['permissions']);
        }

        return redirect()->route('roles.index')->with('success', 'Role created successfully!');
    }

    public function show(Role $role)
    {
        $role->load(['permissions', 'users']);
        return Inertia::render('Role/Show', [
            'role' => $role,
        ]);
    }

    public function edit(Role $role)
    {
        $permissions = Permission::where('is_active', true)->orderBy('module')->orderBy('name')->get();
        $role->load('permissions');
        return Inertia::render('Role/Edit', [
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }

    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'slug' => 'required|string|max:255|unique:roles,slug,' . $role->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        if (isset($validated['permissions'])) {
            $role->assignPermissions($validated['permissions']);
        }

        return redirect()->route('roles.index')->with('success', 'Role updated successfully!');
    }

    public function destroy(Role $role)
    {
        // Prevent deleting admin role
        if ($role->slug === 'admin') {
            return redirect()->back()->with('error', 'Cannot delete admin role.');
        }

        $role->delete();
        return redirect()->route('roles.index')->with('success', 'Role deleted successfully!');
    }
}
