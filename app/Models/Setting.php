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
        'department_id',
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
     * Get the department that owns the setting.
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Scope a query to only include global settings.
     */
    public function scopeGlobal($query)
    {
        return $query->whereNull('company_id')->whereNull('department_id');
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
     * Helper method to get a setting value by key with Department -> Company/Branch -> Global hierarchy.
     */
    public static function get($key, $default = null, $companyId = null, $departmentId = null)
    {
        $cKey = $companyId ?: '0';
        $dKey = $departmentId ?: '0';
        $cacheKey = "settings_{$cKey}_{$dKey}_{$key}";

        return Cache::remember($cacheKey, now()->addHours(24), function () use ($key, $companyId, $departmentId, $default) {
            // 1. Department-specific setting
            if ($departmentId !== null) {
                $query = static::where('key', $key)->where('department_id', $departmentId);
                if ($companyId !== null) {
                    $query->where(function ($q) use ($companyId) {
                        $q->where('company_id', $companyId)->orWhereNull('company_id');
                    });
                }
                $setting = $query->first();
                if ($setting) {
                    return $setting->getValue();
                }
            }

            // 2. Company / Branch-specific setting
            if ($companyId !== null) {
                $setting = static::where('key', $key)
                    ->where('company_id', $companyId)
                    ->whereNull('department_id')
                    ->first();
                
                if ($setting) {
                    return $setting->getValue();
                }
            }

            // 3. Global fallback setting
            $globalSetting = static::where('key', $key)
                ->whereNull('company_id')
                ->whereNull('department_id')
                ->first();

            return $globalSetting ? $globalSetting->getValue() : $default;
        });
    }

    /**
     * Helper method to set a setting value by key for specific Company/Branch or Department.
     */
    public static function set($key, $value, $category = null, $type = 'string', $companyId = null, $departmentId = null)
    {
        $setting = static::updateOrCreate(
            [
                'key' => $key,
                'company_id' => $companyId,
                'department_id' => $departmentId,
            ],
            [
                'category' => $category,
                'type' => $type,
            ]
        );

        $setting->setValue($value);
        $setting->save();

        // Clear settings cache on save
        Cache::forget("settings_" . ($companyId ?: '0') . "_" . ($departmentId ?: '0') . "_{$key}");
        Cache::forget("settings_0_0_{$key}");

        return $setting;
    }
}

