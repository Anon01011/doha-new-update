<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;
use App\Models\Company;
use App\Models\User;
use App\Models\Task;

use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use Auditable, SoftDeletes, \App\Traits\BelongsToCompany;
    protected $fillable = [
        'name',
        'description',
        'status',
        'visibility',
        'budget',
        'priority',
        'category',
        'tags',
        'start_date',
        'end_date',
        'branch_id',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'budget' => 'decimal:2',
        'tags' => 'array',
    ];

    public function branch()
    {
        return $this->belongsTo(Company::class, 'branch_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function members()
    {
        return $this->hasMany(ProjectMember::class);
    }
}
