<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingSession extends Model
{
    protected $fillable = [
        'training_id',
        'session_date',
        'start_time',
        'end_time',
        'location',
        'instructor',
        'attendance_taken',
    ];

    protected $casts = [
        'session_date' => 'date',
        'attendance_taken' => 'boolean',
    ];

    public function training()
    {
        return $this->belongsTo(Training::class);
    }

    public function attendance()
    {
        return $this->hasMany(TrainingSessionAttendance::class, 'training_session_id');
    }
}


