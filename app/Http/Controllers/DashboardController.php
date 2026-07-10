<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Company;
use App\Models\ShiftRoster;
use App\Models\EmployeeAttendance;
use App\Models\User;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\SalaryPosting;
use App\Models\Loan;
use App\Models\Advance;
use App\Models\Training;
use App\Models\Task;
use App\Models\Grievance;
use App\Models\EmployeeDocument;
use App\Models\DocumentType;
use App\Models\Holiday;
use App\Models\Department;
use App\Models\EmployeeEvaluation;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Redirect employees to their own dashboard (only if they are NOT admin, HR, or manager)
        if ($user->isEmployee() && $user->employee_id && !$user->isAdmin() && !$user->isHR() && !$user->isManager()) {
            return redirect()->route('employee.dashboard');
        }

        // For admin, HR, and manager - show admin dashboard
        $isSuperAdmin = $user->isAdmin();
        $branchId = $user->employee_id && $user->employee ? $user->employee->company_id : null;

        $empQuery = Employee::query();
        $compQuery = Company::query();
        $shiftQuery = ShiftRoster::query();
        $attenQuery = class_exists(EmployeeAttendance::class) ? EmployeeAttendance::query() : null;
        $leaveQuery = LeaveRequest::query();
        $salaryQuery = SalaryPosting::query();
        $loanQuery = Loan::query();
        $advanceQuery = Advance::query();
        $taskQuery = Task::query();
        $grievanceQuery = Grievance::query();
        $docQuery = EmployeeDocument::query();
        $deptQuery = Department::query();
        $evalQuery = EmployeeEvaluation::query();

        // Apply multi-tenancy scoping if not super admin
        if (!$isSuperAdmin && $branchId) {
            $empQuery->where('company_id', $branchId);
            $compQuery->where('id', $branchId);
            $shiftQuery->where('company_id', $branchId);
            if ($attenQuery) {
                $attenQuery->where('company_id', $branchId);
            }
            $leaveQuery->whereHas('employee', fn($q) => $q->where('company_id', $branchId));
            $salaryQuery->whereHas('employee', fn($q) => $q->where('company_id', $branchId));
            $loanQuery->whereHas('employee', fn($q) => $q->where('company_id', $branchId));
            $advanceQuery->whereHas('employee', fn($q) => $q->where('company_id', $branchId));
            $taskQuery->where('branch_id', $branchId);
            $grievanceQuery->whereHas('employee', fn($q) => $q->where('company_id', $branchId));
            $docQuery->whereHas('employee', fn($q) => $q->where('company_id', $branchId));
            $deptQuery->where('company_id', $branchId);
            $evalQuery->where('company_id', $branchId);
        }

        $totalEmployees = (clone $empQuery)->count();
        $totalCompanies = (clone $compQuery)->count();
        $totalShifts = (clone $shiftQuery)->count();
        $totalAttendances = $attenQuery ? (clone $attenQuery)->count() : 0;

        $recentEmployees = (clone $empQuery)->orderBy('created_at', 'desc')->take(5)->get(['id', 'name', 'email', 'designation', 'created_at', 'company_id']);
        $recentShifts = (clone $shiftQuery)->with('employee')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get(['id', 'employee_id', 'company_id', 'shift_time', 'shift_type', 'day', 'created_at']);
        $recentAttendances = $attenQuery
            ? (clone $attenQuery)->orderBy('created_at', 'desc')->take(5)->get(['id', 'employee_id', 'date', 'created_at'])
            : collect();
        $companies = (clone $compQuery)->withCount('employees')->get(['id', 'name']);

        // Users scoping: Only see users of their own branch
        $userQuery = User::query();
        if (!$isSuperAdmin && $branchId) {
            $userQuery->whereHas('employee', fn($q) => $q->where('company_id', $branchId));
        }
        $totalUsers = (clone $userQuery)->count();
        $recentUsers = (clone $userQuery)->orderBy('created_at', 'desc')->take(5)->get(['id', 'name', 'email', 'created_at']);
        $userRoles = method_exists(User::class, 'getRoleNames') ? (clone $userQuery)->with('roles')->get()->pluck('roles')->flatten()->pluck('name')->unique()->values() : [];

        // System settings
        $systemSettings = [
            'app_name' => config('app.name'),
            'app_url' => config('app.url'),
            'timezone' => config('app.timezone'),
            'locale' => config('app.locale'),
            'mail_driver' => config('mail.default'),
            'mail_host' => config('mail.mailers.smtp.host'),
            'mail_from' => config('mail.from.address'),
        ];

        // Attendance trends for the last 7 days
        $attendanceTrends = [];
        $startDate = now()->subDays(6)->startOfDay();
        $endDate = now()->endOfDay();
        $attendanceData = $attenQuery ? (clone $attenQuery)->whereBetween('date', [$startDate, $endDate])
            ->selectRaw('date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get() : collect();
        $dates = collect(range(0, 6))->map(function ($i) use ($startDate) {
            return $startDate->copy()->addDays($i)->toDateString();
        });
        foreach ($dates as $date) {
            $record = $attendanceData->firstWhere('date', $date);
            $attendanceTrends[] = [
                'date' => $date,
                'count' => $record ? $record->count : 0,
            ];
        }

        // Active/Inactive employees in the last 30 days
        $activeEmployeeIds = $attenQuery ? (clone $attenQuery)->where('date', '>=', now()->subDays(30)->toDateString())
            ->distinct('employee_id')
            ->pluck('employee_id') : collect();
        $activeEmployeesCount = (clone $empQuery)->whereIn('id', $activeEmployeeIds)->count();
        $inactiveEmployeesCount = (clone $empQuery)->whereNotIn('id', $activeEmployeeIds)->count();

        // Currently working employees (Clocked in today but not clocked out)
        $currentlyWorking = $attenQuery ? (clone $attenQuery)->with('employee')
            ->where('date', now()->toDateString())
            ->whereNotNull('from_time')
            ->whereNull('to_time')
            ->get() : collect();

        $onBreak = $currentlyWorking->whereNotNull('current_break_start');
        $workingNow = $currentlyWorking->whereNull('current_break_start');

        // --- New Features Stats ---

        // 1. Expiring Documents (Next 30 days)
        $expiringDocuments = (clone $docQuery)->with(['employee', 'documentType'])
            ->whereNotNull('expiry_date')
            ->where('is_expired', false)
            ->whereDate('expiry_date', '<=', now()->addDays(60)) // Increased to 60 days for better visibility
            ->whereDate('expiry_date', '>=', now())
            ->orderBy('expiry_date')
            ->take(5)
            ->get();

        // 2. Upcoming Holidays (Next 3)
        // Note: Holiday model has a global scope for company_id, so no extra scoping needed here
        $upcomingHolidays = Holiday::whereDate('end_date', '>=', now())
            ->orderBy('start_date')
            ->take(3)
            ->get();

        // 3. Department Distribution
        $departmentStats = (clone $deptQuery)->withCount('employees')
            ->orderBy('employees_count', 'desc')
            ->take(5)
            ->get();

        // New Features Stats
        $totalLeaveRequests = (clone $leaveQuery)->count();
        $pendingLeaveRequests = (clone $leaveQuery)->where('status', 'pending')->count();
        $approvedLeaveRequests = (clone $leaveQuery)->where('status', 'approved')->count();
        $totalLeaveTypes = LeaveType::where('is_active', true)->count();

        $totalSalaryPostings = (clone $salaryQuery)->count();
        $currentMonthSalary = (clone $salaryQuery)->where('month', now()->month)
            ->where('year', now()->year)
            ->count();

        $totalLoans = (clone $loanQuery)->count();
        $activeLoans = (clone $loanQuery)->whereIn('status', ['approved', 'disbursed'])->count();
        $totalAdvances = (clone $advanceQuery)->count();
        $pendingAdvances = (clone $advanceQuery)->where('status', 'pending')->count();

        // Note: Training model has a global scope for company_id
        $totalTrainings = Training::count();
        $upcomingTrainings = Training::where('start_date', '>=', now()->toDateString())
            ->where('status', 'scheduled')
            ->count();

        $totalTasks = (clone $taskQuery)->count();
        $pendingTasks = (clone $taskQuery)->where('status', 'pending')->count();
        $inProgressTasks = (clone $taskQuery)->where('status', 'in_progress')->count();

        $totalGrievances = (clone $grievanceQuery)->count();
        $openGrievances = (clone $grievanceQuery)->whereIn('status', ['submitted', 'under_review'])->count();
        $resolvedGrievances = (clone $grievanceQuery)->where('status', 'resolved')->count();

        // Recent data for new features
        $recentLeaveRequests = (clone $leaveQuery)->with(['employee', 'leaveType'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get(['id', 'employee_id', 'leave_type_id', 'start_date', 'end_date', 'status', 'created_at']);

        $recentSalaryPostings = (clone $salaryQuery)->with('employee')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get(['id', 'employee_id', 'month', 'year', 'net_salary', 'status', 'created_at']);

        $recentTasks = (clone $taskQuery)->with('creator')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get(['id', 'title', 'priority', 'status', 'due_date', 'created_by', 'created_at']);

        $recentGrievances = (clone $grievanceQuery)->with('employee')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get(['id', 'employee_id', 'subject', 'priority', 'status', 'created_at']);

        // Top Performers (Based on latest evaluation)
        $topPerformers = (clone $evalQuery)->with(['employee', 'employee.user'])
            ->orderBy('overall_score', 'desc')
            ->take(5)
            ->get();

        // Debug log
        \Log::info('DashboardController@index debug', [
            'totalEmployees' => $totalEmployees,
            'totalCompanies' => $totalCompanies,
            'totalShifts' => $totalShifts,
            'totalAttendances' => $totalAttendances,
            'recentEmployees' => $recentEmployees,
            'recentShifts' => $recentShifts,
            'recentAttendances' => $recentAttendances,
            'companies' => $companies,
            'totalUsers' => $totalUsers,
            'recentUsers' => $recentUsers,
            'userRoles' => $userRoles,
            'systemSettings' => $systemSettings,
            'attendanceTrends' => $attendanceTrends,
            'activeEmployees' => $activeEmployeesCount,
            'inactiveEmployees' => $inactiveEmployeesCount,
        ]);

        // TEMP: Return as JSON for debugging
        if (request()->has('debug')) {
            return response()->json([
                'totalEmployees' => $totalEmployees,
                'totalCompanies' => $totalCompanies,
                'totalShifts' => $totalShifts,
                'totalAttendances' => $totalAttendances,
                'recentEmployees' => $recentEmployees,
                'recentShifts' => $recentShifts,
                'recentAttendances' => $recentAttendances,
                'companies' => $companies,
                'totalUsers' => $totalUsers,
                'recentUsers' => $recentUsers,
                'userRoles' => $userRoles,
                'systemSettings' => $systemSettings,
                'attendanceTrends' => $attendanceTrends,
                'activeEmployees' => $activeEmployeesCount,
                'inactiveEmployees' => $inactiveEmployeesCount,
            ]);
        }

        return Inertia::render('Dashboard', [
            'totalEmployees' => $totalEmployees,
            'totalCompanies' => $totalCompanies,
            'totalShifts' => $totalShifts,
            'totalAttendances' => $totalAttendances,
            'recentEmployees' => $recentEmployees,
            'recentShifts' => $recentShifts,
            'recentAttendances' => $recentAttendances,
            'companies' => $companies,
            'totalUsers' => $totalUsers,
            'recentUsers' => $recentUsers,
            'userRoles' => $userRoles,
            'systemSettings' => $systemSettings,
            'attendanceTrends' => $attendanceTrends,
            'activeEmployees' => $activeEmployeesCount,
            'inactiveEmployees' => $inactiveEmployeesCount,
            'currentlyWorking' => $currentlyWorking,
            'workingNowCount' => $workingNow->count(),
            'onBreakCount' => $onBreak->count(),
            // Leave Management Stats
            'totalLeaveRequests' => $totalLeaveRequests,
            'pendingLeaveRequests' => $pendingLeaveRequests,
            'approvedLeaveRequests' => $approvedLeaveRequests,
            'totalLeaveTypes' => $totalLeaveTypes,
            'recentLeaveRequests' => $recentLeaveRequests,
            // Salary Stats
            'totalSalaryPostings' => $totalSalaryPostings,
            'currentMonthSalary' => $currentMonthSalary,
            'recentSalaryPostings' => $recentSalaryPostings,
            // Loans & Advance Stats
            'totalLoans' => $totalLoans,
            'activeLoans' => $activeLoans,
            'totalAdvances' => $totalAdvances,
            'pendingAdvances' => $pendingAdvances,
            // Training Stats
            'totalTrainings' => $totalTrainings,
            'upcomingTrainings' => $upcomingTrainings,
            // Task Stats
            'totalTasks' => $totalTasks,
            'pendingTasks' => $pendingTasks,
            'inProgressTasks' => $inProgressTasks,
            'recentTasks' => $recentTasks,
            // Grievance Stats
            'totalGrievances' => $totalGrievances,
            'openGrievances' => $openGrievances,
            'resolvedGrievances' => $resolvedGrievances,
            'recentGrievances' => $recentGrievances,
            'dashboardSettings' => $user->dashboard_settings,
            'expiringDocuments' => $expiringDocuments,
            'upcomingHolidays' => $upcomingHolidays,
            'departmentStats' => $departmentStats,
            'topPerformers' => $topPerformers,
        ]);
    }
}