<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class TaskAssignment extends Model
{
    protected $fillable = [
        'task_id',
        'employee_id',
        'assigned_by',
        'assigned_date',
        'status',
        'acceptance_status',
        'rejection_reason',
        'completed_date',
        'extension_request_date',
        'extension_reason',
        'progress_percentage',
        'remarks',
    ];

    protected $casts = [
        'assigned_date' => 'date',
        'completed_date' => 'date',
        'extension_request_date' => 'date',
        'progress_percentage' => 'integer',
    ];

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function assigner()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function timers()
    {
        return $this->hasMany(TaskTimer::class);
    }
}


