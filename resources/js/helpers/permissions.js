/**
 * Permission helper functions for frontend
 */

/**
 * Check if user has a specific permission
 * @param {Object} user - User object from auth
 * @param {string} permission - Permission slug to check
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
    if (!user || !permission) return false;
    if (user.role === 'admin') return true; // Admin has all permissions
    if (!user.permissions || !Array.isArray(user.permissions)) return false;
    return user.permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object from auth
 * @param {string[]} permissions - Array of permission slugs
 * @returns {boolean}
 */
export function hasAnyPermission(user, permissions) {
    if (!user || !permissions || permissions.length === 0) return true;
    if (user.role === 'admin') return true;
    if (!user.permissions || !Array.isArray(user.permissions)) return false;
    return permissions.some(perm => user.permissions.includes(perm));
}

/**
 * Check if user has all of the specified permissions
 * @param {Object} user - User object from auth
 * @param {string[]} permissions - Array of permission slugs
 * @returns {boolean}
 */
export function hasAllPermissions(user, permissions) {
    if (!user || !permissions || permissions.length === 0) return true;
    if (user.role === 'admin') return true;
    if (!user.permissions || !Array.isArray(user.permissions)) return false;
    return permissions.every(perm => user.permissions.includes(perm));
}

/**
 * Check if user has a specific role
 * @param {Object} user - User object from auth
 * @param {string|string[]} roles - Role slug(s) to check
 * @returns {boolean}
 */
export function hasRole(user, roles) {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    if (roleArray.length === 0) return true;
    
    // Check legacy role field
    if (roleArray.includes(user.role)) return true;
    
    // Check roles relationship
    if (user.roles && Array.isArray(user.roles)) {
        return user.roles.some(role => roleArray.includes(role.slug));
    }
    
    return false;
}

