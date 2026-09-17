<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OffboardingExitInterview extends Model
{
    use HasFactory;

    protected $fillable = [
        'offboarding_request_id',
        'employee_id',
        'conducted_by',
        'reason_for_leaving',
        'job_satisfaction_rating',
        'management_rating',
        'work_environment_rating',
        'compensation_rating',
        'growth_opportunity_rating',
        'best_part_of_job',
        'improvement_suggestions',
        'additional_comments',
        'rehire_eligible',
        'conducted_at',
    ];

    protected $casts = [
        'job_satisfaction_rating'    => 'integer',
        'management_rating'          => 'integer',
        'work_environment_rating'    => 'integer',
        'compensation_rating'        => 'integer',
        'growth_opportunity_rating'  => 'integer',
        'rehire_eligible'            => 'boolean',
        'conducted_at'               => 'datetime',
    ];

    // ─── Relationships ───────────────────────────────────────────────────────────

    public function offboardingRequest(): BelongsTo
    {
        return $this->belongsTo(OffboardingRequest::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function conductor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'conducted_by');
    }

    // ─── Accessors ───────────────────────────────────────────────────────────────

    public function getAvgRatingAttribute(): float
    {
        $ratings = array_filter([
            $this->job_satisfaction_rating,
            $this->management_rating,
            $this->work_environment_rating,
            $this->compensation_rating,
            $this->growth_opportunity_rating,
        ]);

        if (empty($ratings)) {
            return 0.0;
        }

        return round(array_sum($ratings) / count($ratings), 2);
    }
}
