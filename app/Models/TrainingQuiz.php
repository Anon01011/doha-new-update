<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingQuiz extends Model
{
    protected $fillable = [
        'training_id',
        'title',
        'description',
        'passing_score',
        'time_limit_minutes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'passing_score' => 'integer',
        'time_limit_minutes' => 'integer',
    ];

    public function training()
    {
        return $this->belongsTo(Training::class);
    }

    public function questions()
    {
        return $this->hasMany(TrainingQuizQuestion::class);
    }

    public function attempts()
    {
        return $this->hasMany(TrainingQuizAttempt::class);
    }
}
