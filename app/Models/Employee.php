<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;
use Illuminate\Support\Str;

class Employee extends Model
{
    use Auditable, \App\Traits\BelongsToCompany;




    protected $appends = ['is_active'];

    protected $fillable = [
        'name',
        'employee_code',
        'gender',
        'dob',
        'mobile',
        'email',
        'designation',
        'nationality',
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
        'contract_issue_date',
        'contract_expiry_date',
    ];

    protected $casts = [
        'joining_date' => 'date',
        'joined_date' => 'date',
        'rejoined_date' => 'date',
        'passport_expiry_date' => 'date',
        'qid_expiry_date' => 'date',
        'food_handler_expiry_date' => 'date',
        'health_card_expiry_date' => 'date',
        'contract_issue_date' => 'date',
        'contract_expiry_date' => 'date',
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

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->where('manual_status', 'active')
                ->orWhere(function ($q2) {
                    $q2->whereNull('manual_status')
                        ->whereNotIn('exit_status', ['Abscond', 'Terminated', 'Resigned', 'End of Contract']);
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

    public function evaluations()
    {
        return $this->hasMany(EmployeeEvaluation::class);
    }

    public function grievances()
    {
        return $this->hasMany(Grievance::class);
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
     * Generate a unique employee code.
     */
    public static function generateCode($companyId = null)
    {
        $prefix = \App\Models\Setting::get('employee_code_prefix', 'EMP', $companyId);
        $date = date('Ymd');
        do {
            $code = $prefix . $date . '-' . strtoupper(Str::random(6));
        } while (self::where('employee_code', $code)->exists());

        return $code;
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
