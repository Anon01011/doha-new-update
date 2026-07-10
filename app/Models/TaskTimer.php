<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaskTimer extends Model
{
    protected $fillable = [
        'task_assignment_id',
        'start_time',
        'end_time',
        'duration_minutes',
        'manual_entry',
        'notes',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'manual_entry' => 'boolean',
    ];

    public function assignment()
    {
        return $this->belongsTo(TaskAssignment::class, 'task_assignment_id');
    }
}
