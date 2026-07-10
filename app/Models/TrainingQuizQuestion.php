<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingQuizQuestion extends Model
{
    protected $fillable = [
        'training_quiz_id',
        'question_text',
        'question_type',
        'options',
        'correct_answer',
        'points',
    ];

    protected $casts = [
        'options' => 'array',
        'points' => 'integer',
    ];

    public function quiz()
    {
        return $this->belongsTo(TrainingQuiz::class, 'training_quiz_id');
    }
}
