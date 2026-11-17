<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserTrustedDevice extends Model
{
    use HasFactory, \App\Traits\BelongsToCompany;

    protected $table = 'user_trusted_devices';

    protected $fillable = [
        'user_id',
        'company_id',
        'device_token_hash',
        'device_name',
        'device_type',
        'ip_address',
        'user_agent',
        'last_used_at',
        'expires_at',
        'revoked_at',
        'is_active',
    ];

    protected $hidden = [
        'device_token_hash',
    ];

    protected function casts(): array
    {
        return [
            'last_used_at' => 'datetime',
            'expires_at'   => 'datetime',
            'revoked_at'   => 'datetime',
            'is_active'    => 'boolean',
        ];
    }

    /**
     * Get the user that owns the trusted device.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the company associated with the device.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Scope a query to only include active devices.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                     ->whereNull('revoked_at');
    }

    /**
     * Scope a query to only include active, unexpired devices.
     */
    public function scopeValid($query)
    {
        return $query->active()
                     ->where('expires_at', '>', now());
    }

    /**
     * Check if the device token is currently expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at === null || $this->expires_at->isPast();
    }

    /**
     * Mark the device as revoked.
     */
    public function revoke(): bool
    {
        return $this->update([
            'is_active'  => false,
            'revoked_at' => now(),
        ]);
    }

    /**
     * Update the last used timestamp, IP, and user agent.
     */
    public function touchUsage(?string $ip = null, ?string $userAgent = null): bool
    {
        return $this->update([
            'last_used_at' => now(),
            'ip_address'   => $ip ?: $this->ip_address,
            'user_agent'   => $userAgent ?: $this->user_agent,
            // Extend expiration on active usage by 30 days
            'expires_at'   => now()->addDays(30),
        ]);
    }
}

