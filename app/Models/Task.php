<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Traits\Auditable;

use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use Auditable, SoftDeletes, \App\Traits\BelongsToCompany;
    protected $fillable = [
        'branch_id',
        'project_id',
        'parent_id',
        'title',
        'description',
        'priority',
        'status',
        'is_blocked',
        'blocked_reason',
        'is_recurring',
        'recurrence_pattern',
        'due_date',
        'estimated_hours',
        'created_by',
        'category',
        'tags',
    ];

    protected $casts = [
        'due_date' => 'date',
        'tags' => 'array',
        'is_blocked' => 'boolean',
        'is_recurring' => 'boolean',
        'estimated_hours' => 'decimal:2',
        'branch_id' => 'integer',
    ];

    public function branch()
    {
        return $this->belongsTo(Company::class, 'branch_id');
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function parent()
    {
        return $this->belongsTo(Task::class, 'parent_id');
    }

    public function subtasks()
    {
        return $this->hasMany(Task::class, 'parent_id');
    }

    public function checklists()
    {
        return $this->hasMany(TaskChecklist::class);
    }

    public function comments()
    {
        return $this->hasMany(TaskComment::class)->orderBy('created_at', 'asc');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignments()
    {
        return $this->hasMany(TaskAssignment::class);
    }

    public function updates()
    {
        return $this->hasMany(TaskUpdate::class);
    }
}


