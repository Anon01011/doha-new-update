<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;
use App\Notifications\GenericHrNotification;

class SalaryModificationRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'company_id',
        'requested_by',
        'current_basic_salary',
        'proposed_basic_salary',
        'current_payment_type',
        'proposed_payment_type',
        'current_bank_name',
        'proposed_bank_name',
        'current_bank_account_number',
        'proposed_bank_account_number',
        'current_iban',
        'proposed_iban',
        'current_salary_structures',
        'proposed_salary_structures',
        'reason',
        'status',
        'reviewed_by',
        'reviewed_at',
        'review_notes',
    ];

    protected $casts = [
        'current_basic_salary' => 'decimal:2',
        'proposed_basic_salary' => 'decimal:2',
        'current_salary_structures' => 'array',
        'proposed_salary_structures' => 'array',
        'reviewed_at' => 'datetime',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeForCompany($query, $companyId)
    {
        if (is_array($companyId)) {
            return $query->whereIn('company_id', $companyId);
        }
        return $query->where('company_id', $companyId);
    }

    /**
     * Approve the request and apply the new salary details directly to the employee.
     */
    public function applyApproval(User $reviewer, ?string $notes = null): void
    {
        if ($this->status !== 'pending') {
            throw new \DomainException('Only pending salary modification requests can be approved.');
        }

        DB::transaction(function () use ($reviewer, $notes) {
            $employee = $this->employee()->lockForUpdate()->firstOrFail();

            // Apply salary and banking fields
            $updateData = [
                'basic_salary' => $this->proposed_basic_salary,
            ];

            if ($this->proposed_payment_type !== null) {
                $updateData['payment_type'] = $this->proposed_payment_type;
            }
            if ($this->proposed_bank_name !== null) {
                $updateData['bank_name'] = $this->proposed_bank_name;
            }
            if ($this->proposed_bank_account_number !== null) {
                $updateData['bank_account_number'] = $this->proposed_bank_account_number;
            }
            if ($this->proposed_iban !== null) {
                $updateData['iban'] = $this->proposed_iban;
            }

            $employee->update($updateData);

            // Sync salary structures if present
            if (is_array($this->proposed_salary_structures)) {
                $employee->salaryStructures()->delete();
                foreach ($this->proposed_salary_structures as $struct) {
                    if (!empty($struct['component_id'])) {
                        $employee->salaryStructures()->create([
                            'component_id'   => $struct['component_id'],
                            'amount'         => $struct['amount'] ?? 0,
                            'value_type'     => $struct['value_type'] ?? 'flat',
                            'effective_from' => now(),
                        ]);
                    }
                }
            }

            $this->update([
                'status'       => 'approved',
                'reviewed_by'  => $reviewer->id,
                'reviewed_at'  => now(),
                'review_notes' => $notes,
            ]);

            // Notify requester
            if ($this->requester) {
                $this->requester->notify(new GenericHrNotification(
                    'Salary Modification Approved',
                    "Salary modification for {$employee->name} has been approved by {$reviewer->name}.",
                    route('employees.show', $employee->id),
                    'salary_approved'
                ));
            }
        });
    }

    /**
     * Reject the request.
     */
    public function applyRejection(User $reviewer, ?string $notes = null): void
    {
        if ($this->status !== 'pending') {
            throw new \DomainException('Only pending salary modification requests can be rejected.');
        }

        $this->update([
            'status'       => 'rejected',
            'reviewed_by'  => $reviewer->id,
            'reviewed_at'  => now(),
            'review_notes' => $notes,
        ]);

        $employee = $this->employee;
        if ($this->requester && $employee) {
            $this->requester->notify(new GenericHrNotification(
                'Salary Modification Rejected',
                "Salary modification for {$employee->name} was rejected by {$reviewer->name}." . ($notes ? " Reason: {$notes}" : ''),
                route('employees.show', $employee->id),
                'salary_rejected'
            ));
        }
    }
}

