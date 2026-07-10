<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
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

    protected static function auditEvent($event, $model)
    {
        $oldValues = null;
        $newValues = null;

        if ($event === 'created') {
            $newValues = $model->getAttributes();
        } elseif ($event === 'updated') {
            $oldValues = $model->getOriginal();
            $newValues = $model->getAttributes();
        } elseif ($event === 'deleted') {
            $oldValues = $model->getOriginal();
        }

        $companyId = $model->company_id ?? $model->branch_id ?? (Auth::user()->company_id ?? (Auth::user()->employee->company_id ?? null));

        AuditLog::create([
            'user_id' => Auth::id(),
            'company_id' => $companyId,
            'event' => $event,
            'auditable_type' => get_class($model),
            'auditable_id' => $model->id,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
