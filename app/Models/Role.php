<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    public const DEFAULT_ROLES = [
        'admin',
        'super-admin',
        'hr',
        'manager',
        'supervisor',
        'shift-manager',
        'shiftmanager',
        'shift_manager',
        'employee',
    ];

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_active',
        'is_default',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_default' => 'boolean',
    ];

    /**
     * Check if role is a built-in system default role.
     */
    public function isDefault(): bool
    {
        return (bool) $this->is_default || in_array($this->slug, self::DEFAULT_ROLES);
    }

    /**
     * Accessor to always treat predefined system roles as default.
     */
    public function getIsDefaultAttribute($value): bool
    {
        return (bool) $value || in_array($this->slug, self::DEFAULT_ROLES);
    }

    /**
     * Get the users that have this role.
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'user_roles');
    }

    /**
     * Get the permissions for this role.
     */
    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permissions');
    }

    /**
     * Check if role has a specific permission.
     */
    public function hasPermission($permission)
    {
        // Load permissions if not already loaded
        if (!$this->relationLoaded('permissions')) {
            $this->load('permissions');
        }
        
        if (is_string($permission)) {
            return $this->permissions->contains('slug', $permission);
        }
        return $this->permissions->contains('id', $permission);
    }

    /**
     * Assign permissions to role.
     */
    public function assignPermissions(array $permissionIds)
    {
        $this->permissions()->sync($permissionIds);
    }
}
