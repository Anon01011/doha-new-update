<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OffboardingTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'offboarding_request_id',
        'assigned_to',
        'assigned_role',
        'task_title',
        'task_description',
        'task_type',
        'status',
        'due_date',
        'completed_at',
        'completion_notes',
        'sort_order',
    ];

    protected $casts = [
        'due_date'     => 'date',
        'completed_at' => 'datetime',
        'sort_order'   => 'integer',
    ];

    // ─── Relationships ───────────────────────────────────────────────────────────

    public function offboardingRequest(): BelongsTo
    {
        return $this->belongsTo(OffboardingRequest::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────────

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeByRole($query, string $role)
    {
        return $query->where('assigned_role', $role);
    }
}
