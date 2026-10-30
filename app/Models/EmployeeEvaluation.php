<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;

class EmployeeEvaluation extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'reference_no',
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
     * The "booted" method of the model.
     */
    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->reference_no)) {
                $year = $model->year ?? date('Y');
                $month = str_pad((string)($model->month ?? date('n')), 2, '0', STR_PAD_LEFT);
                $random = strtoupper(\Illuminate\Support\Str::random(6));
                $model->reference_no = "EVA-{$year}{$month}-{$random}";
            }
        });
    }

    /**
     * Use reference_no in URLs instead of exposing sequential primary key IDs.
     */
    public function getRouteKeyName()
    {
        return 'reference_no';
    }

    public function getRouteKey()
    {
        return $this->reference_no ?: (string)$this->getKey();
    }

    /**
     * Resolve the route binding from either reference_no or legacy numeric ID.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        return $this->withoutGlobalScope('company')
            ->where(function ($query) use ($value) {
                $query->where('reference_no', $value)
                      ->orWhere('id', $value);
            })
            ->first() ?? abort(404);
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
