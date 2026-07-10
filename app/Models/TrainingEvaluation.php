<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingEvaluation extends Model
{
    protected $fillable = [
        'training_assignment_id',
        'employee_id',
        'training_id',
        'company_id',
        'rating',
        'content_quality',
        'trainer_effectiveness',
        'relevance',
        'would_recommend',
        'feedback_text',
        'suggestions',
        'submitted_at',
    ];

    protected $casts = [
        'rating' => 'integer',
        'content_quality' => 'integer',
        'trainer_effectiveness' => 'integer',
        'relevance' => 'integer',
        'would_recommend' => 'boolean',
        'submitted_at' => 'datetime',
    ];

    public function trainingAssignment()
    {
        return $this->belongsTo(TrainingAssignment::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function training()
    {
        return $this->belongsTo(Training::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function getAverageRatingAttribute()
    {
        return round(($this->rating + $this->content_quality + $this->trainer_effectiveness + $this->relevance) / 4, 2);
    }
}
