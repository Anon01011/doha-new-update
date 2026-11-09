<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;
use App\Models\User;

class Grievance extends Model
{
    use Auditable, \App\Traits\BelongsToCompany;
    protected $fillable = [
        'employee_id',
        'company_id',
        'category',
        'priority',
        'subject',
        'description',
        'status',
        'submitted_date',
        'assigned_to',
        'resolved_date',
        'resolution_notes',
        'resolution_action',
        'is_confidential',
        'is_anonymous',
        'attachments',
    ];

    protected $casts = [
        'submitted_date' => 'date:Y-m-d',
        'resolved_date' => 'date:Y-m-d',
        'is_confidential' => 'boolean',
        'is_anonymous' => 'boolean',
        'attachments' => 'array',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function responses()
    {
        return $this->hasMany(GrievanceResponse::class);
    }

    public function warningLetters()
    {
        return $this->hasMany(WarningLetter::class)->orderBy('created_at', 'desc');
    }

    /**
     * Resolve route binding without the BelongsToCompany global scope so that
     * authorized users (e.g. reporting managers or employees) can access the record.
     * The controller performs authorization after resolution.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        return $this->withoutGlobalScope('company')
            ->where($field ?? $this->getRouteKeyName(), $value)
            ->firstOrFail();
    }
}


