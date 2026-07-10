<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentType extends Model
{
    protected $fillable = [
        'name',
        'category',
        'requires_expiry',
        'is_mandatory',
        'is_active',
        'alert_days_before_expiry',
    ];

    protected $casts = [
        'requires_expiry' => 'boolean',
        'is_mandatory' => 'boolean',
        'is_active' => 'boolean',
        'alert_days_before_expiry' => 'integer',
    ];

    public function documents()
    {
        return $this->hasMany(EmployeeDocument::class);
    }
}
