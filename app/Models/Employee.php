<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;
use Illuminate\Support\Str;

class Employee extends Model
{
    use Auditable, \App\Traits\BelongsToCompany;




    protected $appends = ['is_active', 'joining_date'];

    protected $fillable = [
        'name',
        'employee_code',
        'slug',
        'is_code_edited',
        'no_overtime',
        'gender',
        'dob',
        'mobile',
        'email',
        'role',
        'designation',
        'nationality',
        'marital_status',
        'sponsor',
        'company_id',
        'location',
        'department_id',
        'joined_date',
        'rejoined_date',
        'shift',
        'visa_type',
        'visa_designation',
        'employee_category',
        'contract_duration',
        'exit_status',
        'payment_type',
        'bank_name',
        'bank_account_number',
        'bank_code',
        'bank_branch',
        'iban',
        'upi_id',
        'pan_number',
        'aadhar_number',
        'aadhar_file_path',
        'pan_file_path',
        'education_doc_path',
        'relieving_doc_path',
        'bank_doc_path',
        'exit_date',
        'exit_reason',
        'basic_salary',
        'leave_status',
        'reported_to',
        'reports_to_id',
        'employee_image',
        'agreement_doc',
        'resume_doc',
        'other_docs',
        'manual_status',
        'passport_number',
        'passport_expiry_date',
        'passport_file_path',
        'qid_number',
        'qid_expiry_date',
        'qid_file_path',
        'food_handler_file_path',
        'food_handler_expiry_date',
        'health_card_number',
        'health_card_expiry_date',
        'health_card_file_path',
        'contract_issue_date',
        'contract_expiry_date',
        'probation_start_date',
        'probation_end_date',
        'probation_status',
        'confirmation_date',
        'internship_start_date',
        'internship_end_date',
        'internship_status',
    ];

    protected $casts = [
        'is_code_edited' => 'boolean',
        'dob' => 'date',
        'joining_date' => 'date',
        'joined_date' => 'date',
        'rejoined_date' => 'date',
        'passport_expiry_date' => 'date',
        'qid_expiry_date' => 'date',
        'food_handler_expiry_date' => 'date',
        'health_card_expiry_date' => 'date',
        'contract_issue_date' => 'date',
        'contract_expiry_date' => 'date',
        'probation_start_date' => 'date',
        'probation_end_date' => 'date',
        'confirmation_date' => 'date',
        'internship_start_date' => 'date',
        'internship_end_date' => 'date',
    ];

    // Note: EmployeeShift model doesn't exist - using ShiftRoster instead

    public function shiftRosters()
    {
        return $this->hasMany(ShiftRoster::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function companies()
    {
        return $this->belongsToMany(Company::class, 'employee_company')->withTimestamps();
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function departments()
    {
        return $this->belongsToMany(Department::class, 'employee_department')->withTimestamps();
    }

    /**
     * Keep the slug in sync with the name and employee code.
     *
     * The slug is the public identifier used in employee URLs, so it must
     * always reflect the current name + code. This is hooked into the model
     * so every write path (controller, seeder, console) is covered.
     */
    // =========================================================================
    // Employee Lifecycle Helpers
    // =========================================================================

    public static function defaultProbationMonths(): int
    {
        static $cached = null;
        if ($cached !== null) return $cached;
        try {
            $setting = \App\Models\Setting::where('key', 'probation_duration_months')->first();
            $val = $setting ? (int) $setting->value : 3;
            $cached = ($val > 0) ? $val : 3;
        } catch (\Exception $e) { $cached = 3; }
        return $cached;
    }

    public function getProbationLifecycle(): array
    {
        if ($this->employee_category !== 'Probation') return ['status' => 'not_applicable'];
        $startDate = $this->probation_start_date ?? $this->joined_date;
        if (!$startDate) return ['status' => 'not_applicable', 'label' => 'No start date'];
        $months = self::defaultProbationMonths();
        $endDate = $this->probation_end_date ?? $startDate->copy()->addMonths($months);
        $now = now()->startOfDay();
        $daysRemaining = (int) $now->diffInDays($endDate, false);
        if ($this->confirmation_date) {
            return ['status' => 'confirmed', 'label' => 'Confirmed', 'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(), 'confirmed_date' => $this->confirmation_date->toDateString(),
                'days_remaining' => null, 'is_overdue' => false];
        }
        if ($this->probation_status === 'extended') {
            return ['status' => 'extended', 'label' => 'Probation Extended', 'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(), 'days_remaining' => max(0, $daysRemaining), 'is_overdue' => $daysRemaining < 0];
        }
        if ($daysRemaining < 0) {
            return ['status' => 'overdue', 'label' => 'Probation Overdue (Confirmation Pending)', 'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(), 'days_remaining' => abs($daysRemaining), 'is_overdue' => true];
        }
        if ($daysRemaining <= 15) {
            return ['status' => 'ending_soon', 'label' => 'Probation Ending Soon', 'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(), 'days_remaining' => $daysRemaining, 'is_overdue' => false];
        }
        return ['status' => 'in_progress', 'label' => 'Probation In Progress', 'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(), 'days_remaining' => $daysRemaining, 'is_overdue' => false];
    }

    public function getInternshipLifecycle(): array
    {
        if ($this->employee_category !== 'Intern') return ['status' => 'not_applicable'];
        $startDate = $this->internship_start_date ?? $this->joined_date;
        $endDate   = $this->internship_end_date;
        if (!$startDate) return ['status' => 'not_applicable', 'label' => 'No start date'];
        if ($this->internship_status === 'completed') {
            return ['status' => 'completed', 'label' => 'Internship Completed',
                'start_date' => $startDate->toDateString(), 'end_date' => $endDate?->toDateString()];
        }
        $now = now()->startOfDay();
        if ($endDate) {
            $daysRemaining = (int) $now->diffInDays($endDate, false);
            if ($daysRemaining < 0) {
                return ['status' => 'overdue', 'label' => 'Internship Ended (Action Pending)',
                    'start_date' => $startDate->toDateString(), 'end_date' => $endDate->toDateString(),
                    'days_remaining' => abs($daysRemaining), 'is_overdue' => true];
            }
            if ($daysRemaining <= 15) {
                return ['status' => 'ending_soon', 'label' => 'Internship Ending Soon',
                    'start_date' => $startDate->toDateString(), 'end_date' => $endDate->toDateString(),
                    'days_remaining' => $daysRemaining, 'is_overdue' => false];
            }
        }
        return ['status' => 'in_progress', 'label' => 'Internship In Progress', 'start_date' => $startDate->toDateString(),
            'end_date' => $endDate?->toDateString(),
            'days_remaining' => $endDate ? (int) $now->diffInDays($endDate, false) : null, 'is_overdue' => false];
    }

    public function getContractLifecycle(): array
    {
        if ($this->employee_category === 'Permanent') return ['status' => 'permanent', 'label' => 'Permanent Employee'];
        if ($this->employee_category !== 'Contract') return ['status' => 'not_applicable'];
        $expiryDate = $this->contract_expiry_date;
        if (!$expiryDate) return ['status' => 'no_expiry', 'label' => 'No Expiry Date Set'];
        $now = now()->startOfDay();
        $daysRemaining = (int) $now->diffInDays($expiryDate, false);
        if ($daysRemaining < 0) {
            return ['status' => 'expired', 'label' => 'Contract Expired', 'end_date' => $expiryDate->toDateString(),
                'days_remaining' => abs($daysRemaining), 'is_overdue' => true];
        }
        if ($daysRemaining <= 30) {
            return ['status' => 'expiring_soon', 'label' => 'Contract Expiring Soon', 'end_date' => $expiryDate->toDateString(),
                'days_remaining' => $daysRemaining, 'is_overdue' => false];
        }
        return ['status' => 'active', 'label' => 'Contract Active', 'end_date' => $expiryDate->toDateString(),
            'days_remaining' => $daysRemaining, 'is_overdue' => false];
    }

    protected static function booted(): void
    {
        static::saving(function (Employee $employee) {
            $attributes = $employee->getAttributes();

            // A partially loaded model (e.g. Employee::select('id', 'name'))
            // does not carry the name, employee code or slug, so the slug
            // cannot be rebuilt safely. Writing one here would overwrite the
            // stored slug with an incorrect value.
            $canRebuild = array_key_exists('name', $attributes)
                && array_key_exists('employee_code', $attributes);

            if (! $canRebuild) {
                return;
            }

            $slugMissing = ! array_key_exists('slug', $attributes)
                || $employee->slug === null
                || $employee->slug === '';

            // Only rebuild when the slug is absent or when one of its source
            // fields actually changed, so unrelated saves keep the URL stable.
            if (! $slugMissing && ! $employee->isDirty(['name', 'employee_code'])) {
                return;
            }

            $employee->slug = $employee->generateSlug();
        });
    }

    /**
     * Build the URL slug for this employee: {name-slug}-{employee-code-slug}.
     *
     * Example: "Haider Shakeel Rajpoot" + code "128"
     *          => "haider-shakeel-rajpoot-128"
     *
     * A numeric suffix is appended only if the slug is already taken, which
     * keeps the value unique without exposing the primary key.
     */
    public function generateSlug(): string
    {
        $nameSlug = Str::slug((string) $this->name);
        $codeSlug = Str::slug((string) $this->employee_code);

        if ($nameSlug === '') {
            $nameSlug = 'employee';
        }

        $base = $codeSlug === '' ? $nameSlug : $nameSlug . '-' . $codeSlug;

        $slug = $base;
        $suffix = 1;

        while (self::withoutGlobalScopes()
            ->where('slug', $slug)
            ->where('id', '!=', $this->getKey())
            ->exists()) {
            $slug = $base . '-' . (++$suffix);
        }

        return $slug;
    }

    /**
     * Employees are addressed by their slug in URLs, e.g.
     * /employees/haider-shakeel-rajpoot-128
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * Fall back to the primary key when no slug has been generated yet.
     */
    public function getRouteKey(): string
    {
        return $this->slug ?: (string) $this->getKey();
    }

    /**
     * Resolve an employee from either its slug or its primary key.
     *
     * The lookup conditions are grouped inside a nested where so the whole
     * resolution stays intersected with the BelongsToCompany tenant scope.
     * An ungrouped `where(...)->orWhere(...)` would place the OR branch
     * outside the tenant predicate and could expose a cross-tenant record.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        $value = (string) $value;

        $employee = $this->where(function ($query) use ($value) {
            $query->where('slug', $value);

            if (ctype_digit($value)) {
                $query->orWhere('id', (int) $value);
            }
        })->first();

        return $employee ?? abort(404);
    }

    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->where('manual_status', 'active')
                ->orWhere(function ($q2) {
                    $q2->whereNull('manual_status')
                        ->where(function ($q3) {
                            // `exit_status` is NULL for most records, and
                            // whereNotIn alone would drop those rows entirely
                            // (SQL three-valued logic), disagreeing with
                            // getIsActiveAttribute(). Match NULL explicitly.
                            $q3->whereNull('exit_status')
                                ->orWhereNotIn('exit_status', ['Abscond', 'Terminated', 'Resigned', 'End of Contract']);
                        });
                });
        });
    }

    /**
     * Employees who were added to the system but have not been onboarded yet.
     *
     * Onboarding is considered complete once the joining date has been
     * recorded. Records that have already exited are excluded because they
     * will never be onboarded. The legacy `manual_status = waiting` flag is
     * also honoured so existing pending records keep showing up.
     *
     * NOTE: `whereNotIn` alone would silently drop every row whose
     * `exit_status` is NULL (SQL three-valued logic), which is the majority of
     * records here, so the NULL case must be matched explicitly.
     */
    public function scopePendingOnboarding($query)
    {
        return $query->where(function ($q) {
            $q->where('manual_status', 'waiting')
                ->orWhere(function ($q2) {
                    $q2->whereNull('joined_date')
                        ->where(function ($q3) {
                            $q3->whereNull('exit_status')
                                ->orWhereNotIn('exit_status', ['Abscond', 'Terminated', 'Resigned', 'End of Contract']);
                        });
                });
        });
    }

    public function scopeInactive($query)
    {
        return $query->where(function ($q) {
            $q->where('manual_status', 'inactive')
                ->orWhereIn('exit_status', ['Abscond', 'Terminated', 'Resigned', 'End of Contract']);
        });
    }

    public function getIsActiveAttribute()
    {
        if ($this->manual_status !== null) {
            return $this->manual_status === 'active';
        }

        return !in_array($this->exit_status, ['Abscond', 'Terminated', 'Resigned', 'End of Contract']);
    }

    public function getJoiningDateAttribute()
    {
        return $this->attributes['joined_date'] ?? null;
    }

    /**
     * Dynamic current leave status (e.g. "On Leave (Sick Leave)" or "Available").
     */
    public function getCurrentLeaveStatusAttribute(): string
    {
        $today = now()->toDateString();
        $activeLeave = $this->leaveRequests()
            ->where('status', 'approved')
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->with('leaveType')
            ->first();

        if ($activeLeave) {
            $typeName = $activeLeave->leaveType?->name ?? 'Leave';
            return "On Leave ({$typeName})";
        }

        return $this->attributes['leave_status'] ?: 'Available';
    }

    /**
     * Dynamic current shift based on approved ShiftRoster for today.
     */
    public function getCurrentShiftAttribute(): string
    {
        $today = now();
        $weekStart = $today->copy()->startOfWeek(\Carbon\Carbon::MONDAY)->toDateString();
        $dayName = $today->format('l');

        $todayRoster = $this->shiftRosters()
            ->where('week_start', $weekStart)
            ->where('day', $dayName)
            ->where('status', 'approved')
            ->first();

        if ($todayRoster) {
            $details = $todayRoster->shift_time;
            if ($todayRoster->shift_type && $todayRoster->shift_type !== $todayRoster->shift_time) {
                $details .= " ({$todayRoster->shift_type})";
            }
            return $details;
        }

        return $this->attributes['shift'] ?: 'Not Scheduled';
    }

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function leaveBalances()
    {
        return $this->hasMany(LeaveBalance::class);
    }

    public function salaryPostings()
    {
        return $this->hasMany(SalaryPosting::class);
    }

    public function evaluations()
    {
        return $this->hasMany(EmployeeEvaluation::class)->latest();
    }

    public function salaryStructures()
    {
        return $this->hasMany(EmployeeSalaryStructure::class);
    }

    public function loans()
    {
        return $this->hasMany(Loan::class);
    }

    public function advances()
    {
        return $this->hasMany(Advance::class);
    }

    public function trainingAssignments()
    {
        return $this->hasMany(TrainingAssignment::class);
    }

    public function taskAssignments()
    {
        return $this->hasMany(TaskAssignment::class);
    }

    public function expenseClaims()
    {
        return $this->hasMany(ExpenseClaim::class);
    }

    public function grievances()
    {
        return $this->hasMany(Grievance::class);
    }

    public function offboardingRequests()
    {
        return $this->hasMany(OffboardingRequest::class);
    }

    public function activeOffboarding()
    {
        return $this->hasOne(OffboardingRequest::class)->whereNotIn('status', ['completed', 'cancelled'])->latest();
    }

    public function documents()
    {
        return $this->hasMany(EmployeeDocument::class);
    }

    public function warningLetters()
    {
        return $this->hasMany(WarningLetter::class);
    }

    public function projectMembers()
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function manager()
    {
        return $this->belongsTo(Employee::class, 'reports_to_id');
    }

    public function subordinates()
    {
        return $this->hasMany(Employee::class, 'reports_to_id');
    }

    /**
     * Get the user account associated with the employee.
     */
    public function user()
    {
        return $this->hasOne(\App\Models\User::class);
    }

    /**
     * Get employee attendances for this employee.
     */
    public function attendances()
    {
        return $this->hasMany(EmployeeAttendance::class);
    }

    public function getSalaryStructure()
    {
        return $this->salaryStructures()
            ->with('component')
            ->where(function ($query) {
                $query->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', now());
            })
            ->get();
    }

    public function getAttendanceSummary($month, $year)
    {
        $startDate = \Carbon\Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $attendances = $this->attendances()
            ->whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
            ->get();

        return [
            'present' => $attendances->where('attendance', 'Present')->count(),
            'absent' => $attendances->where('attendance', 'Absent')->count(),
            'leave' => $attendances->where('attendance', 'Leave')->count(),
            'sick_leave' => $attendances->where('attendance', 'Sick Leave')->count(),
            'unpaid_days' => $attendances->where('is_paid', false)->count(),
            'total_ot_hours' => $attendances->sum('ot'),
            'total_ot_amount' => $attendances->sum('ot_amt'),
            'total_hours_worked' => $attendances->sum('hours_worked'),
        ];
    }

    public function getLoanDeduction($month, $year)
    {
        $startDate = \Carbon\Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        return \App\Models\LoanInstallment::whereHas('loan', function ($query) {
            $query->where('employee_id', $this->id)
                  ->where('repayment_method', 'salary_deduction');
        })
            ->whereBetween('due_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->where('status', '!=', 'paid')
            ->sum('amount');
    }

    public function getAdvanceDeduction($month, $year)
    {
        $startDate = \Carbon\Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        return \App\Models\Advance::where('employee_id', $this->id)
            ->whereBetween('repayment_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->where('status', 'approved')
            ->whereNull('repaid_at')
            ->sum('amount');
    }

    /**
     * Number of random digits appended to the configured prefix.
     */
    public const CODE_RANDOM_DIGITS = 8;

    /**
     * Generate a unique employee code.
     *
     * Format: <PREFIX><8 random digits>  e.g. EMP48392017
     *
     * - The prefix comes from the tenant's `employee_code_prefix` setting and
     *   falls back to "EMP" when it is missing or blank.
     * - The body is exactly 8 numeric digits, zero padded, produced with
     *   random_int() so it is drawn from a cryptographically secure source.
     * - No date component is included.
     * - The uniqueness loop below guarantees the code is not already taken.
     */
    public static function generateCode($companyId = null): string
    {
        $prefix = self::codePrefix($companyId);

        $existingCodes = self::withoutGlobalScopes()
            ->whereNotNull('employee_code')
            ->pluck('employee_code');

        $maxPrefixNumber = 0;
        $maxPureNumber = 0;
        $hasPrefixCodes = false;

        foreach ($existingCodes as $code) {
            $codeStr = trim((string) $code);
            if ($codeStr === '') {
                continue;
            }

            if ($prefix !== '' && str_starts_with($codeStr, $prefix)) {
                $suffix = substr($codeStr, strlen($prefix));
                if (ctype_digit($suffix)) {
                    $hasPrefixCodes = true;
                    $num = (int) $suffix;
                    if ($num > $maxPrefixNumber) {
                        $maxPrefixNumber = $num;
                    }
                }
            } elseif (ctype_digit($codeStr)) {
                $num = (int) $codeStr;
                if ($num > $maxPureNumber) {
                    $maxPureNumber = $num;
                }
            }
        }

        $baseNumber = $hasPrefixCodes ? $maxPrefixNumber : $maxPureNumber;
        $nextNumber = $baseNumber + 1;

        do {
            $padLength = max(3, strlen((string) $nextNumber));
            $numberPart = str_pad((string) $nextNumber, $padLength, '0', STR_PAD_LEFT);
            $candidate = $prefix . $numberPart;

            $exists = self::withoutGlobalScopes()
                ->where('employee_code', $candidate)
                ->exists();

            if (! $exists) {
                return $candidate;
            }

            $nextNumber++;
        } while (true);
    }

    /**
     * Resolve the configured employee code prefix for a company.
     * Allows letters, digits, and symbols (-, :, _, /).
     */
    public static function codePrefix($companyId = null): string
    {
        $prefix = \App\Models\Setting::get('employee_code_prefix', 'EMP', $companyId);

        $prefix = strtoupper(trim((string) $prefix));
        $prefix = preg_replace('/[^A-Za-z0-9\-_:\/]/', '', $prefix);

        return $prefix !== '' ? $prefix : 'EMP';
    }

    /**
     * A non-persisted preview of the code that would be generated.
     */
    public static function codePreview($companyId = null): string
    {
        return self::generateCode($companyId);
    }

    public function weeklyOffs()
    {
        return $this->hasMany(EmployeeWeeklyOff::class)->orderBy('effective_date', 'desc');
    }

    public function getWeeklyOffForDate($date)
    {
        $date = \Carbon\Carbon::parse($date);
        
        // 1. Check if employee has a staff-wise weekly off configured on or before this date
        $staffOff = $this->weeklyOffs()
            ->whereDate('effective_date', '<=', $date->toDateString())
            ->orderBy('effective_date', 'desc')
            ->first();
            
        if ($staffOff) {
            return [$staffOff->weekly_off_day];
        }
        
        // 2. Fallback to branch-wise weekly off days
        if ($this->company && is_array($this->company->weekly_off_days)) {
            return $this->company->weekly_off_days;
        }
        
        return [];
    }

    public function isWeeklyOffDate($date)
    {
        $date = \Carbon\Carbon::parse($date);
        $dayName = $date->format('l'); // e.g. "Sunday"
        
        $offDays = $this->getWeeklyOffForDate($date);
        
        return in_array($dayName, $offDays);
    }
}
