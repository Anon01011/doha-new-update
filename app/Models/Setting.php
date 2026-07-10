<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'category',
        'type',
        'company_id',
        'description',
        'is_public',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    /**
     * Get the company that owns the setting.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Scope a query to only include global settings.
     */
    public function scopeGlobal($query)
    {
        return $query->whereNull('company_id');
    }

    /**
     * Scope a query to only include settings for a specific company.
     */
    public function scopeForCompany($query, $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    /**
     * Scope a query to only include settings in a specific category.
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Get the typed value of the setting.
     */
    public function getValue()
    {
        return match ($this->type) {
            'number' => is_numeric($this->value) ? $this->value : 0,
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($this->value, true),
            default => $this->value,
        };
    }

    /**
     * Set the value with automatic type handling.
     */
    public function setValue($value)
    {
        $this->value = match ($this->type) {
            'json' => json_encode($value),
            'boolean' => $value ? '1' : '0',
            default => (string) $value,
        };

        return $this;
    }

    /**
     * Helper method to get a setting value by key.
     */
    public static function get($key, $default = null, $companyId = null)
    {
        $cacheKey = $companyId ? "settings_{$companyId}_{$key}" : "settings_global_{$key}";

        return Cache::remember($cacheKey, now()->addHours(24), function () use ($key, $companyId, $default) {
            // First, try to find company-specific setting
            if ($companyId !== null) {
                $setting = static::where('key', $key)
                    ->where('company_id', $companyId)
                    ->first();
                
                if ($setting) {
                    return $setting->getValue();
                }
            }

            // Fallback to global setting
            $globalSetting = static::where('key', $key)
                ->whereNull('company_id')
                ->first();

            return $globalSetting ? $globalSetting->getValue() : $default;
        });
    }

    /**
     * Helper method to set a setting value by key.
     */
    public static function set($key, $value, $category = null, $type = 'string', $companyId = null)
    {
        $setting = static::updateOrCreate(
            [
                'key' => $key,
                'company_id' => $companyId,
            ],
            [
                'category' => $category,
                'type' => $type,
            ]
        );

        $setting->setValue($value);
        $setting->save();

        // Invalidate Cache
        $cacheKey = $companyId ? "settings_{$companyId}_{$key}" : "settings_global_{$key}";
        Cache::forget($cacheKey);

        // If setting a global value, we need to invalidate the cache for all companies
        // because they might have cached the global fallback.
        if ($companyId === null) {
            $companyIds = \App\Models\Company::pluck('id');
            foreach ($companyIds as $cId) {
                Cache::forget("settings_{$cId}_{$key}");
            }
        }

        return $setting;
    }
}
