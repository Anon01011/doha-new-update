<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class OffboardingRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'request_number',
        'employee_id',
        'initiated_by',
        'manager_id',
        'hr_user_id',
        'separation_reason',
        'proposed_last_working_day',
        'actual_last_working_day',
        'notice_period_days',
        'notice_pay_applicable',
        'notice_pay_amount',
        'status',
        'manager_approved_at',
        'hr_approved_at',
        'completed_at',
        'remarks',
        'supporting_document',
        'basic_salary_till_lwd',
        'leave_encashment_amount',
        'gratuity_amount',
        'deductions_total',
        'net_settlement_amount',
        'settlement_approved',
        'settlement_approved_by',
        'settlement_approved_at',
    ];

    protected $casts = [
        'proposed_last_working_day'  => 'date',
        'actual_last_working_day'    => 'date',
        'notice_pay_applicable'      => 'boolean',
        'notice_pay_amount'          => 'float',
        'manager_approved_at'        => 'datetime',
        'hr_approved_at'             => 'datetime',
        'completed_at'               => 'datetime',
        'settlement_approved'        => 'boolean',
        'settlement_approved_at'     => 'datetime',
        'basic_salary_till_lwd'      => 'float',
        'leave_encashment_amount'    => 'float',
        'gratuity_amount'            => 'float',
        'deductions_total'           => 'float',
        'net_settlement_amount'      => 'float',
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->request_number)) {
                $model->request_number = 'OFF-' . date('Ym') . '-' . strtoupper(substr(uniqid(), -5));
            }
        });
    }

    public function getRouteKeyName()
    {
        return 'request_number';
    }

    public function getRouteKey()
    {
        return $this->request_number ?: $this->getKey();
    }

    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where('request_number', $value)
            ->orWhere('id', $value)
            ->first() ?? abort(404);
    }

    // ─── Relationships ──────────────────────────────────────────────────────────

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function initiator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function hrUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hr_user_id');
    }

    public function settlementApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'settlement_approved_by');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(OffboardingTask::class)->orderBy('sort_order');
    }

    public function exitInterview(): HasOne
    {
        return $this->hasOne(OffboardingExitInterview::class);
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->whereNotIn('status', ['completed', 'cancelled']);
    }

    public function scopePendingApproval($query)
    {
        return $query->where('status', 'pending_approval');
    }

    public function scopeByCompany($query, $companyId)
    {
        return $query->whereHas('employee', fn($q) => $q->where('company_id', $companyId));
    }

    public function scopeUpcoming($query, int $days = 30)
    {
        return $query->whereIn('status', ['approved', 'in_progress', 'clearance_pending'])
            ->whereBetween('proposed_last_working_day', [now()->toDateString(), now()->addDays($days)->toDateString()]);
    }

    // ─── Accessors ───────────────────────────────────────────────────────────────

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'draft'                    => 'Draft',
            'pending_approval'         => 'Pending Approval',
            'approved'                 => 'Approved',
            'in_progress'              => 'In Progress',
            'clearance_pending'        => 'Clearance Pending',
            'exit_interview_pending'   => 'Exit Interview Pending',
            'settlement_pending'       => 'Settlement Pending',
            'completed'                => 'Completed',
            'cancelled'                => 'Cancelled',
            default                    => ucfirst($this->status),
        };
    }

    public function getSeparationReasonLabelAttribute(): string
    {
        return match ($this->separation_reason) {
            'resignation'           => 'Resignation',
            'retirement'            => 'Retirement',
            'termination'           => 'Termination',
            'contract_completion'   => 'Contract Completion',
            'redundancy'            => 'Redundancy',
            'mutual_separation'     => 'Mutual Separation',
            'absconding'            => 'Absconding',
            'other'                 => 'Other',
            default                 => ucfirst($this->separation_reason),
        };
    }

    /**
     * Generate a default checklist of offboarding tasks.
     * Called after a request is approved.
     */
    public function generateDefaultTasks(): void
    {
        $defaults = [
            ['assigned_role' => 'manager',  'task_type' => 'knowledge_transfer',  'task_title' => 'Assign Knowledge Transfer Plan',           'sort_order' => 1],
            ['assigned_role' => 'manager',  'task_type' => 'knowledge_transfer',  'task_title' => 'Document Open Tasks & Client Handovers',   'sort_order' => 2],
            ['assigned_role' => 'hr',       'task_type' => 'document_collection', 'task_title' => 'Collect Resignation Letter / Documents',   'sort_order' => 3],
            ['assigned_role' => 'hr',       'task_type' => 'clearance',           'task_title' => 'Validate Final Attendance & Leave Balance', 'sort_order' => 4],
            ['assigned_role' => 'hr',       'task_type' => 'exit_interview',      'task_title' => 'Conduct Exit Interview',                   'sort_order' => 5],
            ['assigned_role' => 'it',       'task_type' => 'asset_return',        'task_title' => 'Collect Laptop / Company Device',          'sort_order' => 6],
            ['assigned_role' => 'it',       'task_type' => 'access_revocation',   'task_title' => 'Revoke Email & Application Access',        'sort_order' => 7],
            ['assigned_role' => 'it',       'task_type' => 'access_revocation',   'task_title' => 'Disable VPN & System Accounts',            'sort_order' => 8],
            ['assigned_role' => 'admin',    'task_type' => 'asset_return',        'task_title' => 'Collect ID Card & Access Card',            'sort_order' => 9],
            ['assigned_role' => 'admin',    'task_type' => 'asset_return',        'task_title' => 'Collect Keys, Tools & Other Assets',       'sort_order' => 10],
            ['assigned_role' => 'admin',    'task_type' => 'clearance',           'task_title' => 'Administration Clearance Sign-off',        'sort_order' => 11],
            ['assigned_role' => 'finance',  'task_type' => 'clearance',           'task_title' => 'Verify No Pending Dues / Advances',        'sort_order' => 12],
            ['assigned_role' => 'finance',  'task_type' => 'clearance',           'task_title' => 'Finance Department Clearance Sign-off',    'sort_order' => 13],
            ['assigned_role' => 'payroll',  'task_type' => 'salary_settlement',   'task_title' => 'Calculate & Process Final Settlement',     'sort_order' => 14],
            ['assigned_role' => 'payroll',  'task_type' => 'document_collection', 'task_title' => 'Generate Final Payslip & Relieving Letter', 'sort_order' => 15],
            ['assigned_role' => 'security', 'task_type' => 'access_revocation',   'task_title' => 'Revoke Physical / Building Access',        'sort_order' => 16],
        ];

        $now = now();
        $lwd = $this->proposed_last_working_day;

        foreach ($defaults as $task) {
            $this->tasks()->create([
                'assigned_role'    => $task['assigned_role'],
                'task_type'        => $task['task_type'],
                'task_title'       => $task['task_title'],
                'task_description' => null,
                'status'           => 'pending',
                'due_date'         => $lwd,
                'sort_order'       => $task['sort_order'],
            ]);
        }
    }
}
