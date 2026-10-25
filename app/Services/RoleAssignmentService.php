<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;

/**
 * Centralises the rules for who may assign which role.
 *
 * Security fix for the privilege-escalation finding in the security audit:
 * previously the `role` field was taken verbatim from the request and granted
 * to the target user, so any account holding only `create-employees` or
 * `edit-employees` could mint an `admin` (or self-escalate to one).
 *
 * The policy is:
 *  - Admins (and holders of the `manage-roles` permission) may assign any
 *    active role.
 *  - Everyone else may only assign a non-privileged role, and may never assign
 *    a role to themselves.
 *  - A request that tries to grant a privileged role without the necessary
 *    authority is rejected outright (403) rather than silently downgraded, so
 *    the caller gets explicit feedback instead of a misleading success.
 */
class RoleAssignmentService
{
    /**
     * Role slugs that grant administrative or elevated authority.
     * A user without role-management rights must never be able to grant these.
     */
    public const PRIVILEGED_ROLES = ['admin', 'super_admin', 'superadmin'];

    /**
     * Roles that may be granted by a user who only holds employee-management
     * permissions (i.e. the everyday HR duty). Everything else needs the
     * role-management permission.
     */
    public const ASSIGNABLE_BY_STAFF = ['employee', 'manager', 'hr', 'payroll', 'accountant', 'auditor'];

    /**
     * Determine whether the acting user is allowed to manage roles at all.
     */
    public static function canManageRoles(?User $actor): bool
    {
        if (!$actor) {
            return false;
        }

        if ($actor->isAdmin()) {
            return true;
        }

        return $actor->hasPermission('manage-roles');
    }

    /**
     * Determine whether the acting user may grant the given role slug.
     */
    public static function canAssignRole(?User $actor, ?string $roleSlug): bool
    {
        if (!$actor || !$roleSlug) {
            return false;
        }

        if (self::canManageRoles($actor)) {
            return true;
        }

        // A non role-manager may never grant a privileged role.
        if (in_array(strtolower($roleSlug), self::PRIVILEGED_ROLES, true)) {
            return false;
        }

        return in_array(strtolower($roleSlug), self::ASSIGNABLE_BY_STAFF, true);
    }

    /**
     * Resolve the role the request is asking for and enforce the policy.
     *
     * @param  mixed  $request
     * @param  \App\Models\User|null  $actor       The acting (authenticated) user.
     * @param  \App\Models\User|null  $targetUser  The user whose role is being set.
     * @return string  The role slug that may safely be applied.
     *
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException 403 when the
     *         actor is not permitted to grant the requested role.
     */
    public static function resolveRequestedRole($request, ?User $actor, ?User $targetUser = null, ?string $currentRoleSlug = null): string
    {
        $requested = $request->input('role');

        if (empty($requested)) {
            // No role was submitted. On an update the existing role is kept; on a
            // create the default role applies.
            return $currentRoleSlug ?: self::defaultRoleSlug();
        }

        // Look the role up by slug (the request rule already guarantees it exists).
        $role = Role::where('slug', $requested)
            ->orWhere('id', $requested)
            ->orWhere('name', $requested)
            ->first();

        if (!$role) {
            abort(403, 'The selected role is not available.');
        }

        // Nobody may change their own role, regardless of their permissions.
        // This blocks the self-escalation path entirely.
        if ($targetUser && $actor && (int) $targetUser->id === (int) $actor->id) {
            if (strtolower($role->slug) !== strtolower((string) $currentRoleSlug)) {
                abort(403, 'You cannot change your own role.');
            }
        }

        // Keeping the role a record already has is not an escalation, so it stays
        // permitted. Only *changing* to a role the actor may not grant is refused.
        $isUnchanged = $currentRoleSlug !== null
            && strtolower($role->slug) === strtolower($currentRoleSlug);

        if (!$isUnchanged && !self::canAssignRole($actor, $role->slug)) {
            abort(403, 'You are not authorized to assign the "' . $role->name . '" role.');
        }

        return $role->slug;
    }

    /**
     * The role applied when the request does not specify one.
     */
    public static function defaultRoleSlug(): string
    {
        $default = Role::where('slug', 'employee')->where('is_active', true)->first();

        return $default ? $default->slug : 'employee';
    }

    /**
     * Apply a role to a user, keeping the legacy `role` column and the
     * `user_roles` pivot in sync.
     */
    public static function applyRole(User $user, string $roleSlug): void
    {
        $role = Role::where('slug', $roleSlug)->first();

        $user->forceFill(['role' => $roleSlug])->saveQuietly();

        if ($role) {
            $user->roles()->sync([$role->id]);
        } else {
            $user->roles()->detach();
        }
    }
}