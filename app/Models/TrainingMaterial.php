<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingMaterial extends Model
{
    protected $fillable = [
        'training_id',
        'company_id',
        'title',
        'description',
        'file_path',
        'file_type',
        'file_size',
        'is_mandatory',
        'order',
        'uploaded_by',
    ];

    protected $casts = [
        'is_mandatory' => 'boolean',
        'file_size' => 'integer',
    ];

    public function training()
    {
        return $this->belongsTo(Training::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
