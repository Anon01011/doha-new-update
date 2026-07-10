<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeaveType extends Model
{
    protected $fillable = [
        'name',
        'code',
        'company_id',
        'max_days_per_year',
        'carry_forward_allowed',
        'carry_forward_max_days',
        'requires_approval',
        'is_paid',
        'description',
        'is_active',
    ];

    protected $casts = [
        'max_days_per_year' => 'integer',
        'carry_forward_allowed' => 'boolean',
        'carry_forward_max_days' => 'integer',
        'requires_approval' => 'boolean',
        'is_paid' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function leaveBalances()
    {
        return $this->hasMany(LeaveBalance::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    protected static function booted()
    {
        static::addGlobalScope('company', function ($query) {
            $user = auth()->user();
            if ($user) {
                $companyId = $user->company_id;
                if (!$companyId && $user->employee_id && $user->employee) {
                    $companyId = $user->employee->company_id;
                }

                if ($companyId) {
                    // Allow leave types belonging to the user's company OR global leave types (null company_id)
                    $query->where(function ($q) use ($companyId) {
                        $q->where('leave_types.company_id', $companyId)
                            ->orWhereNull('leave_types.company_id');
                    });
                }
            }
        });
    }
}
