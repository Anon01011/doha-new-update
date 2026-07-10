<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingQuizAttempt extends Model
{
    protected $fillable = [
        'training_quiz_id',
        'training_assignment_id',
        'employee_id',
        'score_achieved',
        'is_passed',
        'answers',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'answers' => 'array',
        'score_achieved' => 'decimal:2',
        'is_passed' => 'boolean',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function quiz()
    {
        return $this->belongsTo(TrainingQuiz::class, 'training_quiz_id');
    }

    public function assignment()
    {
        return $this->belongsTo(TrainingAssignment::class, 'training_assignment_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
