<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, \App\Traits\BelongsToCompany;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'employee_id',
        'company_id',
        'image',
        'dashboard_settings',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'dashboard_settings' => 'array',
        ];
    }

    /**
     * Get the employee associated with the user.
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get all permissions for the user (through roles and direct).
     */
    public function getAllPermissions()
    {
        $permissions = $this->permissions;

        foreach ($this->roles as $role) {
            $permissions = $permissions->merge($role->permissions);
        }

        return $permissions->unique('id');
    }

    /**
     * Get the roles that belong to the user.
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    /**
     * Get the permissions that belong to the user directly.
     */
    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'user_permissions');
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole($role)
    {
        // Check legacy role field first for backward compatibility
        if ($this->role === $role) {
            return true;
        }

        // Load roles if not already loaded
        if (!$this->relationLoaded('roles')) {
            $this->load('roles');
        }

        // Check roles relationship
        if (is_string($role)) {
            return $this->roles->contains('slug', $role);
        }
        return $this->roles->contains('id', $role);
    }

    /**
     * Check if user is admin.
     */
    public function isAdmin()
    {
        return $this->role === 'admin' || $this->hasRole('admin');
    }

    /**
     * Check if user is HR.
     */
    public function isHR()
    {
        return $this->role === 'hr' || $this->hasRole('hr');
    }

    /**
     * Check if user is manager.
     */
    public function isManager()
    {
        return $this->role === 'manager' || $this->hasRole('manager');
    }

    /**
     * Check if user has a specific permission.
     */
    public function hasPermission($permission)
    {
        // Admin has all permissions
        if ($this->isAdmin()) {
            return true;
        }

        // Load relationships if not already loaded
        if (!$this->relationLoaded('permissions')) {
            $this->load('permissions');
        }
        if (!$this->relationLoaded('roles')) {
            $this->load('roles');
        }

        // Check direct permissions
        $hasDirectPermission = is_string($permission)
            ? $this->permissions->contains('slug', $permission)
            : $this->permissions->contains('id', $permission);

        if ($hasDirectPermission) {
            return true;
        }

        // Check permissions through roles
        foreach ($this->roles as $role) {
            if ($role->hasPermission($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Assign role to user.
     */
    public function assignRole($role)
    {
        if (is_numeric($role)) {
            $role = Role::find($role);
        } elseif (is_string($role)) {
            $role = Role::where('slug', $role)->first();
        }

        if ($role && !$this->roles()->where('roles.id', $role->id)->exists()) {
            $this->roles()->attach($role->id);
        }
    }

    /**
     * Remove role from user.
     */
    public function removeRole($role)
    {
        if (is_numeric($role)) {
            $role = Role::find($role);
        } elseif (is_string($role)) {
            $role = Role::where('slug', $role)->first();
        }

        if ($role) {
            $this->roles()->detach($role->id);
        }
    }

    /**
     * Assign permission to user.
     */
    public function assignPermission($permission)
    {
        if (is_numeric($permission)) {
            $permission = Permission::find($permission);
        } elseif (is_string($permission)) {
            $permission = Permission::where('slug', $permission)->first();
        }

        if ($permission && !$this->permissions()->where('permissions.id', $permission->id)->exists()) {
            $this->permissions()->attach($permission->id);
        }
    }

    /**
     * Remove permission from user.
     */
    public function removePermission($permission)
    {
        if (is_numeric($permission)) {
            $permission = Permission::find($permission);
        } elseif (is_string($permission)) {
            $permission = Permission::where('slug', $permission)->first();
        }

        if ($permission) {
            $this->permissions()->detach($permission->id);
        }
    }

    /**
     * Send the password reset notification.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new \App\Notifications\Auth\ResetPasswordNotification($token));
    }

    /**
     * Check if user is employee.
     */
    public function isEmployee()
    {
        return $this->role === 'employee' || $this->hasRole('employee');
    }
}
