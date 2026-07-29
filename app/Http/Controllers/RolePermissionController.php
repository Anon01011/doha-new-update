<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RolePermissionController extends Controller
{
    // Authorization is handled by route middleware 'permission:manage-roles' in routes/web.php

    /**
     * Resolve user by ID bypassing BelongsToCompany global scope.
     * Without this, route model binding returns 404 when the target user
     * belongs to a different company or has no company_id.
     */
    private function resolveUser(int $userId): User
    {
        $user = User::withoutGlobalScopes()->find($userId);
        if (!$user) {
            abort(404, 'User not found.');
        }
        return $user;
    }

    public function assignRoleToUser(Request $request, $userId)
    {
        $user = $this->resolveUser((int) $userId);

        $validated = $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $role = Role::findOrFail($validated['role_id']);
        if ($role->slug === 'admin' && !auth()->user()->isAdmin()) {
            abort(403, 'Unauthorized. Only administrators can assign the admin role.');
        }

        $user->assignRole($role);

        return redirect()->back()->with('success', 'Role assigned successfully!');
    }

    public function removeRoleFromUser(Request $request, $userId, $roleId)
    {
        $user = $this->resolveUser((int) $userId);
        $role = Role::findOrFail($roleId);

        if ($role->slug === 'admin' && !auth()->user()->isAdmin()) {
            abort(403, 'Unauthorized. Only administrators can remove the admin role.');
        }

        $user->removeRole($role->id);

        return redirect()->back()->with('success', 'Role removed successfully!');
    }

    public function assignPermissionToUser(Request $request, $userId)
    {
        $user = $this->resolveUser((int) $userId);

        $validated = $request->validate([
            'permission_id' => 'required|exists:permissions,id',
        ]);

        $user->assignPermission($validated['permission_id']);

        return redirect()->back()->with('success', 'Permission assigned successfully!');
    }

    public function removePermissionFromUser(Request $request, $userId, $permissionId)
    {
        $user = $this->resolveUser((int) $userId);
        $permission = Permission::findOrFail($permissionId);

        $user->removePermission($permission->id);

        return redirect()->back()->with('success', 'Permission removed successfully!');
    }

    public function assignPermissionToRole(Request $request, Role $role)
    {
        $validated = $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $role->assignPermissions($validated['permission_ids']);

        return redirect()->back()->with('success', 'Permissions assigned to role successfully!');
    }
}
