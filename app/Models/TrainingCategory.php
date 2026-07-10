<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingCategory extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'description',
        'color_code',
        'icon',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function trainings()
    {
        return $this->hasMany(Training::class, 'category', 'name');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
