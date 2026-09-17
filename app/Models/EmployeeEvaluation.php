<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;

class EmployeeEvaluation extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'employee_id',
        'evaluator_id',
        'month',
        'year',
        'cycle_type',
        'status',
        'overall_score',
        'criteria_scores',
        'self_scores',
        'self_comments',
        'achievements',
        'development_needs',
        'goals',
        'peer_feedback',
        'comments',
        'increment_recommended',
        'increment_percentage',
        'promotion_recommended',
        'recommended_designation',
        'pip_required',
        'pip_notes',
        'training_recommended',
        'employee_acknowledged_at',
        'employee_acknowledgment_notes',
        'approved_by',
        'approved_at',
        'is_locked',
        'company_id',
    ];

    protected $casts = [
        'month' => 'integer',
        'year' => 'integer',
        'overall_score' => 'decimal:2',
        'criteria_scores' => 'array',
        'self_scores' => 'array',
        'goals' => 'array',
        'peer_feedback' => 'array',
        'training_recommended' => 'array',
        'increment_recommended' => 'decimal:2',
        'increment_percentage' => 'decimal:2',
        'promotion_recommended' => 'boolean',
        'pip_required' => 'boolean',
        'is_locked' => 'boolean',
        'employee_acknowledged_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Scope for approved appraisals
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope for appraisals requiring PIP
     */
    public function scopePipRequired($query)
    {
        return $query->where('pip_required', true);
    }
}
