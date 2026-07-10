<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\LeaveRequest;
use App\Models\SalaryPosting;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\TrainingAssignment;
use App\Models\Grievance;
use App\Models\Loan;
use App\Models\Advance;
use App\Models\ShiftRoster;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class EmployeeDashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        if (!$user->employee_id) {
            Auth::logout();
            return redirect()->route('login')->with('error', 'No employee profile linked to your account. Please contact admin.');
        }

        $employee = Employee::with(['company', 'department'])->find($user->employee_id);

        if (!$employee) {
            Auth::logout();
            return redirect()->route('login')->with('error', 'Employee profile not found.');
        }

        if (!$employee->is_active) {
            Auth::logout();
            return redirect()->route('login')->with('error', 'Your account is inactive. Please contact HR.');
        }

        // Get current week start
        $today = Carbon::today();
        $weekStart = $today->copy()->startOfWeek();
        $weekEnd = $today->copy()->endOfWeek();

        // Attendance stats
        $totalAttendance = EmployeeAttendance::where('employee_id', $employee->id)->count();
        $thisMonthAttendance = EmployeeAttendance::where('employee_id', $employee->id)
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->count();
        $recentAttendance = EmployeeAttendance::where('employee_id', $employee->id)
            ->orderBy('date', 'desc')
            ->take(5)
            ->get();

        // Leave stats
        $totalLeaveRequests = LeaveRequest::where('employee_id', $employee->id)->count();
        $pendingLeaveRequests = LeaveRequest::where('employee_id', $employee->id)
            ->where('status', 'pending')
            ->count();
        $approvedLeaveRequests = LeaveRequest::where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->count();
        $recentLeaveRequests = LeaveRequest::with('leaveType')
            ->where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Salary stats
        $totalSalaryPostings = SalaryPosting::where('employee_id', $employee->id)->count();
        $currentMonthSalary = SalaryPosting::where('employee_id', $employee->id)
            ->where('month', now()->month)
            ->where('year', now()->year)
            ->first();
        $recentSalaryPostings = SalaryPosting::where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Task stats
        $assignedTasks = TaskAssignment::where('employee_id', $employee->id)
            ->with('task')
            ->get();
        $totalTasks = $assignedTasks->count();
        $pendingTasks = $assignedTasks->where('task.status', 'pending')->count();
        $inProgressTasks = $assignedTasks->where('task.status', 'in_progress')->count();
        $recentTasks = $assignedTasks->sortByDesc('created_at')->take(5)->values();

        // Training stats
        $totalTrainings = TrainingAssignment::where('employee_id', $employee->id)->count();
        $upcomingTrainings = TrainingAssignment::with('training')
            ->where('employee_id', $employee->id)
            ->whereHas('training', function ($q) {
                $q->where('start_date', '>=', now()->toDateString());
            })
            ->count();
        $recentTrainings = TrainingAssignment::with('training')
            ->where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Grievance stats
        $totalGrievances = Grievance::where('employee_id', $employee->id)->count();
        $openGrievances = Grievance::where('employee_id', $employee->id)
            ->whereIn('status', ['submitted', 'under_review'])
            ->count();
        $recentGrievances = Grievance::where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Loan & Advance stats
        $totalLoans = Loan::where('employee_id', $employee->id)->count();
        $activeLoans = Loan::where('employee_id', $employee->id)
            ->whereIn('status', ['approved', 'disbursed'])
            ->count();
        $totalAdvances = Advance::where('employee_id', $employee->id)->count();
        $pendingAdvances = Advance::where('employee_id', $employee->id)
            ->where('status', 'pending')
            ->count();

        // This week's shifts
        $thisWeekShifts = ShiftRoster::where('employee_id', $employee->id)
            ->whereBetween('week_start', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->orderBy('day')
            ->get();

        // Attendance for last 30 days summary
        $attendanceSummary = $employee->getAttendanceSummary(now()->month, now()->year);

        // Leave Balances
        $leaveBalances = \App\Models\LeaveBalance::with('leaveType')
            ->where('employee_id', $employee->id)
            ->where('year', now()->year)
            ->get();

        // Warning Letters
        $warningLetters = \App\Models\WarningLetter::where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // My Evaluations
        $myEvaluations = \App\Models\EmployeeEvaluation::where('employee_id', $employee->id)
            ->with('evaluator')
            ->orderBy('created_at', 'desc')
            ->take(3)
            ->get();

        // Today's Holiday
        $todayHoliday = \App\Models\Holiday::where('start_date', '<=', now()->toDateString())
            ->where('end_date', '>=', now()->toDateString())
            ->first();

        return Inertia::render('Employee/Dashboard', [
            'employee' => $employee,
            // Attendance
            'totalAttendance' => $totalAttendance,
            'thisMonthAttendance' => $thisMonthAttendance,
            'recentAttendance' => $recentAttendance,
            'attendanceSummary' => $attendanceSummary,
            // Leave
            'totalLeaveRequests' => $totalLeaveRequests,
            'pendingLeaveRequests' => $pendingLeaveRequests,
            'approvedLeaveRequests' => $approvedLeaveRequests,
            'recentLeaveRequests' => $recentLeaveRequests,
            'leaveBalances' => $leaveBalances,
            // Salary
            'totalSalaryPostings' => $totalSalaryPostings,
            'currentMonthSalary' => $currentMonthSalary,
            'recentSalaryPostings' => $recentSalaryPostings,
            // Tasks
            'totalTasks' => $totalTasks,
            'pendingTasks' => $pendingTasks,
            'inProgressTasks' => $inProgressTasks,
            'recentTasks' => $recentTasks,
            // Training
            'totalTrainings' => $totalTrainings,
            'upcomingTrainings' => $upcomingTrainings,
            'recentTrainings' => $recentTrainings,
            // Grievance
            'totalGrievances' => $totalGrievances,
            'openGrievances' => $openGrievances,
            'recentGrievances' => $recentGrievances,
            // Loans & Advances
            'totalLoans' => $totalLoans,
            'activeLoans' => $activeLoans,
            'totalAdvances' => $totalAdvances,
            'pendingAdvances' => $pendingAdvances,
            // Shifts
            'thisWeekShifts' => $thisWeekShifts,
            'weekStart' => $weekStart->toDateString(),
            'weekEnd' => $weekEnd->toDateString(),
            'warningLetters' => $warningLetters,
            'myEvaluations' => $myEvaluations,
            'todayHoliday' => $todayHoliday,
        ]);
    }

    public function updatePhoto(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user = auth()->user();
        if (!$user->employee_id) {
            return back()->with('error', 'No employee profile linked.');
        }

        $employee = Employee::find($user->employee_id);

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($employee->employee_image) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($employee->employee_image);
            }

            $path = $request->file('image')->store('user_images', 'public');
            $employee->update(['employee_image' => $path]);
            $user->update(['image' => $path]);

            return back()->with('message', 'Profile photo updated successfully.');
        }

        return back()->with('error', 'Failed to upload photo.');
    }
}
