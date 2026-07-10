<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaskUpdate extends Model
{
    protected $fillable = [
        'task_id',
        'employee_id',
        'update_text',
        'attachments',
        'update_date',
    ];

    protected $casts = [
        'attachments' => 'array',
        'update_date' => 'datetime',
    ];

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}


