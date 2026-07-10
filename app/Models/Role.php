<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

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
