<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    /**
     * Fields that should NEVER appear in audit logs.
     * Override $auditExclude in the model to add model-specific sensitive fields.
     */
    protected static array $globalAuditExclude = [
        'password',
        'remember_token',
        'email_verified_at',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    public static function bootAuditable()
    {
        static::created(function ($model) {
            self::auditEvent('created', $model);
        });

        static::updated(function ($model) {
            self::auditEvent('updated', $model);
        });

        static::deleted(function ($model) {
            self::auditEvent('deleted', $model);
        });
    }

    /**
     * Strip sensitive fields from attribute arrays before logging.
     */
    protected static function stripSensitiveFields(array $attributes, $model): array
    {
        $exclude = array_merge(
            static::$globalAuditExclude,
            property_exists($model, 'auditExclude') ? $model->auditExclude : []
        );

        foreach ($exclude as $field) {
            if (isset($attributes[$field])) {
                $attributes[$field] = '[REDACTED]';
            }
        }

        return $attributes;
    }

    protected static function auditEvent($event, $model)
    {
        $oldValues = null;
        $newValues = null;

        if ($event === 'created') {
            $newValues = static::stripSensitiveFields($model->getAttributes(), $model);
        } elseif ($event === 'updated') {
            $oldValues = static::stripSensitiveFields($model->getOriginal(), $model);
            $newValues = static::stripSensitiveFields($model->getAttributes(), $model);
        } elseif ($event === 'deleted') {
            $oldValues = static::stripSensitiveFields($model->getOriginal(), $model);
        }

        // Safely get company_id without triggering relationships on unauthenticated requests
        $companyId = $model->company_id ?? $model->branch_id ?? null;
        if (!$companyId && Auth::hasUser()) {
            $user = Auth::user();
            $companyId = $user->company_id ?? null;
        }

        AuditLog::create([
            'user_id'        => Auth::id(),
            'company_id'     => $companyId,
            'event'          => $event,
            'auditable_type' => get_class($model),
            'auditable_id'   => $model->id,
            'old_values'     => $oldValues,
            'new_values'     => $newValues,
            'ip_address'     => request()->ip(),
            'user_agent'     => request()->userAgent(),
        ]);
    }
}

