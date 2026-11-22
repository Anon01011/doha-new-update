<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
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
        if (!$request->filled('slug') && $request->filled('name')) {
            $request->merge([
                'slug' => Str::slug($request->name),
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'slug' => 'required|string|max:255|unique:roles,slug',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'is_default' => false,
        ]);

        if (isset($validated['permissions'])) {
            $role->assignPermissions($validated['permissions']);
        }

        return redirect()->route('roles.index')->with('success', 'Custom role created successfully!');
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
        if ($role->slug === 'admin' && !auth()->user()->isAdmin()) {
            abort(403, 'Unauthorized. Only administrators can edit the admin role.');
        }

        $permissions = Permission::where('is_active', true)->orderBy('module')->orderBy('name')->get();
        $role->load('permissions');
        return Inertia::render('Role/Edit', [
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }

    public function update(Request $request, Role $role)
    {
        if ($role->slug === 'admin' && !auth()->user()->isAdmin()) {
            abort(403, 'Unauthorized. Only administrators can edit the admin role.');
        }

        $isDefault = $role->isDefault();

        if (!$isDefault && !$request->filled('slug') && $request->filled('name')) {
            $request->merge([
                'slug' => Str::slug($request->name),
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'slug' => $isDefault ? 'nullable|string' : 'required|string|max:255|unique:roles,slug,' . $role->id,
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ];

        // Only allow changing slug for custom roles to prevent breaking system integrations
        if (!$isDefault && !empty($validated['slug'])) {
            $updateData['slug'] = $validated['slug'];
        }

        $role->update($updateData);

        if (isset($validated['permissions'])) {
            $role->assignPermissions($validated['permissions']);
        }

        return redirect()->route('roles.index')->with('success', 'Role updated successfully!');
    }

    public function destroy(Role $role)
    {
        if ($role->slug === 'admin' && !auth()->user()->isAdmin()) {
            abort(403, 'Unauthorized. Only administrators can delete the admin role.');
        }

        // Prevent deleting default system roles
        if ($role->isDefault() || in_array($role->slug, Role::DEFAULT_ROLES)) {
            return redirect()->back()->with('error', 'Cannot delete default system role (' . $role->name . '). Default roles are protected.');
        }

        // Prevent deleting roles currently assigned to users
        $userCount = $role->users()->count();
        if ($userCount > 0) {
            return redirect()->back()->with('error', 'Cannot delete role because it is currently assigned to ' . $userCount . ' user(s). Please reassign them first.');
        }

        $role->delete();
        return redirect()->route('roles.index')->with('success', 'Custom role deleted successfully!');
    }
}
