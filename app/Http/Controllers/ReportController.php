<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\Advance;
use App\Models\LeaveRequest;
use App\Models\SalaryPosting;
use App\Models\Loan;
use App\Models\Training;
use App\Models\Task;
use App\Models\Grievance;
use App\Models\EmployeeEvaluation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use App\Models\Setting;
use App\Models\Company;
use App\Services\WeeklyOffService;

class ReportController extends Controller
{
    public function index()
    {
        return Inertia::render('Reports/Index');
    }

    public function attendance(Request $request)
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->endOfMonth()->toDateString());
        $companyId = $request->query('company_id');
        $employeeId = $request->query('employee_id');

        $user = auth()->user();
        $query = EmployeeAttendance::with(['employee', 'company'])
            ->whereBetween('date', [$startDate, $endDate]);

        $companyIds = [];
        if ($user->role !== 'admin' && $user->employee_id) {
            $companyId = $user->employee->company_id;
            $companyIds = [$companyId];
            $query->where('company_id', $companyId);
        } elseif (!empty($companyId) && $user->role === 'admin') {
            $companyIds = is_array($companyId) ? $companyId : explode(',', $companyId);
            $companyIds = array_filter($companyIds);
            if (!empty($companyIds)) {
                $query->whereIn('company_id', $companyIds);
            }
        }

        if ($employeeId) {
            $employeeIds = is_array($employeeId) ? $employeeId : explode(',', $employeeId);
            $employeeIds = array_filter($employeeIds);
            if (!empty($employeeIds)) {
                $query->whereIn('employee_id', $employeeIds);
            }
        }

        $attendances = $query->orderBy('date')->get();

        // Calculate summary (including weekly off)
        $summary = [
            'total_days'      => $attendances->count(),
            'present'         => $attendances->whereIn('attendance', ['Present', 'Late'])->count(),
            'absent'          => $attendances->where('attendance', 'Absent')->count(),
            'leave'           => $attendances->whereIn('attendance', ['Leave', 'Sick Leave', 'Annual Leave'])->count(),
            'weekly_off'      => $attendances->where('attendance', 'Weekly Off')->count(),
            'half_day'        => $attendances->where('attendance', 'Half Day')->count(),
            'total_hours'     => $attendances->sum('hours_worked'),
            'total_ot_hours'  => $attendances->sum('ot'),
            'total_ot_amount' => $attendances->sum('ot_amt'),
        ];

        return Inertia::render('Reports/Attendance', [
            'attendances' => $attendances,
            'summary'     => $summary,
            'startDate'   => $startDate,
            'endDate'     => $endDate,
            'companyId'   => $companyId,
            'employeeId'  => $employeeId,
            'companies'   => $user->role === 'admin' ? Company::orderBy('name')->get(['id', 'name']) : [],
            'employees'   => !empty($companyIds) 
                ? Employee::whereIn('company_id', $companyIds)->orderBy('name')->get(['id', 'name', 'company_id']) 
                : ($user->role === 'admin' 
                    ? [] 
                    : Employee::where('company_id', $user->employee->company_id)->orderBy('name')->get(['id', 'name', 'company_id'])
                ),
            'settings'    => [
                'standard_working_hours' => Setting::get('standard_working_hours', 9, !empty($companyIds) ? reset($companyIds) : null)
            ],
        ]);
    }

    public function leave(Request $request)
    {
        $startDate = $request->query('start_date', now()->startOfYear()->toDateString());
        $endDate = $request->query('end_date', now()->endOfYear()->toDateString());
        $status = $request->query('status');
        $leaveTypeId = $request->query('leave_type_id');

        $user = auth()->user();
        $query = LeaveRequest::with(['employee', 'leaveType'])
            ->whereBetween('start_date', [$startDate, $endDate]);

        if ($user->role !== 'admin' && $user->employee_id) {
            $query->whereHas('employee', function ($q) use ($user) {
                $q->where('company_id', $user->employee->company_id);
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($leaveTypeId) {
            $query->where('leave_type_id', $leaveTypeId);
        }

        $leaveRequests = $query->orderBy('start_date')->get();

        $summary = [
            'total_requests' => $leaveRequests->count(),
            'pending' => $leaveRequests->where('status', 'pending')->count(),
            'approved' => $leaveRequests->where('status', 'approved')->count(),
            'rejected' => $leaveRequests->where('status', 'rejected')->count(),
            'total_days' => $leaveRequests->sum('days_requested'),
        ];

        return Inertia::render('Reports/Leave', [
            'leaveRequests' => $leaveRequests,
            'summary' => $summary,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'status' => $status,
            'leaveTypeId' => $leaveTypeId,
            'leaveTypes' => \App\Models\LeaveType::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function salary(Request $request)
    {
        $month = $request->query('month');
        $year = $request->query('year', now()->year);
        $companyId = $request->query('company_id');
        $employeeId = $request->query('employee_id');

        $user = auth()->user();
        $query = SalaryPosting::with(['employee'])
            ->where('year', $year);

        $months = [];
        if ($month) {
            $months = is_array($month) ? $month : explode(',', $month);
            $months = array_filter(array_map('intval', $months));
        } else {
            $months = [now()->month];
        }

        if (!empty($months)) {
            $query->whereIn('month', $months);
        }

        $companyIds = [];
        if ($user->role !== 'admin' && $user->employee_id) {
            $companyId = $user->employee->company_id;
            $companyIds = [$companyId];
            $query->whereHas('employee', function ($q) use ($companyId) {
                $q->where('company_id', $companyId);
            });
        } elseif (!empty($companyId) && $user->role === 'admin') {
            $companyIds = is_array($companyId) ? $companyId : explode(',', $companyId);
            $companyIds = array_filter($companyIds);
            if (!empty($companyIds)) {
                $query->whereHas('employee', function ($q) use ($companyIds) {
                    $q->whereIn('company_id', $companyIds);
                });
            }
        }

        if ($employeeId) {
            $employeeIds = is_array($employeeId) ? $employeeId : explode(',', $employeeId);
            $employeeIds = array_filter($employeeIds);
            if (!empty($employeeIds)) {
                $query->whereIn('employee_id', $employeeIds);
            }
        }

        $salaryPostings = $query->orderBy('employee_id')->get();

        $summary = [
            'total_employees' => $salaryPostings->count(),
            'total_basic' => $salaryPostings->sum('basic_salary'),
            'total_allowances' => $salaryPostings->sum(function ($posting) {
                return is_array($posting->allowances) ? array_sum($posting->allowances) : 0;
            }),
            'total_deductions' => $salaryPostings->sum(function ($posting) {
                return is_array($posting->deductions) ? array_sum($posting->deductions) : 0;
            }),
            'total_net_salary' => $salaryPostings->sum('net_salary'),
        ];

        return Inertia::render('Reports/Salary', [
            'salaryPostings' => $salaryPostings,
            'summary' => $summary,
            'month' => $months,
            'year' => $year,
            'companyId' => $companyId,
            'employeeId' => $employeeId,
            'companies' => $user->role === 'admin' ? Company::orderBy('name')->get(['id', 'name']) : [],
            'employees' => !empty($companyIds) 
                ? Employee::whereIn('company_id', $companyIds)->orderBy('name')->get(['id', 'name', 'company_id']) 
                : ($user->role === 'admin' 
                    ? [] 
                    : Employee::where('company_id', $user->employee->company_id)->orderBy('name')->get(['id', 'name', 'company_id'])
                ),
        ]);
    }

    public function loan(Request $request)
    {
        $status = $request->query('status');
        $loanType = $request->query('loan_type');
        $companyId = $request->query('company_id');
        $employeeId = $request->query('employee_id');

        $user = auth()->user();
        $query = Loan::with(['employee']);

        $companyIds = [];
        if ($user->role !== 'admin' && $user->employee_id) {
            $companyId = $user->employee->company_id;
            $companyIds = [$companyId];
            $query->whereHas('employee', function ($q) use ($companyId) {
                $q->where('company_id', $companyId);
            });
        } elseif (!empty($companyId) && $user->role === 'admin') {
            $companyIds = is_array($companyId) ? $companyId : explode(',', $companyId);
            $companyIds = array_filter($companyIds);
            if (!empty($companyIds)) {
                $query->whereHas('employee', function ($q) use ($companyIds) {
                    $q->whereIn('company_id', $companyIds);
                });
            }
        }

        if ($employeeId) {
            $employeeIds = is_array($employeeId) ? $employeeId : explode(',', $employeeId);
            $employeeIds = array_filter($employeeIds);
            if (!empty($employeeIds)) {
                $query->whereIn('employee_id', $employeeIds);
            }
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($loanType) {
            $query->where('loan_type', $loanType);
        }

        $loans = $query->latest()->get();

        $summary = [
            'total_loans' => $loans->count(),
            'pending' => $loans->where('status', 'pending')->count(),
            'approved' => $loans->where('status', 'approved')->count(),
            'disbursed' => $loans->where('status', 'disbursed')->count(),
            'completed' => $loans->where('status', 'completed')->count(),
            'total_amount' => $loans->sum('amount'),
            'total_outstanding' => $loans->whereIn('status', ['approved', 'disbursed'])->sum('amount'),
        ];

        return Inertia::render('Reports/Loan', [
            'loans' => $loans,
            'summary' => $summary,
            'status' => $status,
            'loanType' => $loanType,
            'companyId' => $companyId,
            'employeeId' => $employeeId,
            'companies' => $user->role === 'admin' ? Company::orderBy('name')->get(['id', 'name']) : [],
            'employees' => !empty($companyIds) 
                ? Employee::whereIn('company_id', $companyIds)->orderBy('name')->get(['id', 'name', 'company_id']) 
                : ($user->role === 'admin' 
                    ? [] 
                    : Employee::where('company_id', $user->employee->company_id)->orderBy('name')->get(['id', 'name', 'company_id'])
                ),
        ]);
    }

    public function training(Request $request)
    {
        $status = $request->query('status');
        $category = $request->query('category');

        $user = auth()->user();
        $query = Training::with(['creator', 'assignments']);

        if ($user->role !== 'admin' && $user->employee_id) {
            $query->where('company_id', $user->employee->company_id);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($category) {
            $query->where('category', $category);
        }

        $trainings = $query->latest()->get();

        $summary = [
            'total_trainings' => $trainings->count(),
            'scheduled' => $trainings->where('status', 'scheduled')->count(),
            'ongoing' => $trainings->where('status', 'ongoing')->count(),
            'completed' => $trainings->where('status', 'completed')->count(),
            'total_participants' => $trainings->sum(function ($training) {
                return $training->assignments->count();
            }),
        ];

        return Inertia::render('Reports/Training', [
            'trainings' => $trainings,
            'summary' => $summary,
            'status' => $status,
            'category' => $category,
        ]);
    }

    public function task(Request $request)
    {
        $status = $request->query('status');
        $priority = $request->query('priority');

        $user = auth()->user();
        $query = Task::with(['creator', 'assignments']);

        if ($user->role !== 'admin' && $user->employee_id) {
            $query->where('branch_id', $user->employee->company_id);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($priority) {
            $query->where('priority', $priority);
        }

        $tasks = $query->latest()->get();

        $summary = [
            'total_tasks' => $tasks->count(),
            'pending' => $tasks->where('status', 'pending')->count(),
            'in_progress' => $tasks->where('status', 'in_progress')->count(),
            'completed' => $tasks->where('status', 'completed')->count(),
            'cancelled' => $tasks->where('status', 'cancelled')->count(),
        ];

        return Inertia::render('Reports/Task', [
            'tasks' => $tasks,
            'summary' => $summary,
            'status' => $status,
            'priority' => $priority,
        ]);
    }

    public function grievance(Request $request)
    {
        $status = $request->query('status');
        $priority = $request->query('priority');

        $user = auth()->user();
        $query = Grievance::with(['employee']);

        if ($user->role !== 'admin' && $user->employee_id) {
            $query->whereHas('employee', function ($q) use ($user) {
                $q->where('company_id', $user->employee->company_id);
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($priority) {
            $query->where('priority', $priority);
        }

        $grievances = $query->latest()->get();

        $summary = [
            'total_grievances' => $grievances->count(),
            'submitted' => $grievances->where('status', 'submitted')->count(),
            'under_review' => $grievances->where('status', 'under_review')->count(),
            'resolved' => $grievances->where('status', 'resolved')->count(),
            'closed' => $grievances->where('status', 'closed')->count(),
        ];

        return Inertia::render('Reports/Grievance', [
            'grievances' => $grievances,
            'summary' => $summary,
            'status' => $status,
            'priority' => $priority,
        ]);
    }

    public function evaluation(Request $request)
    {
        $month = $request->query('month', now()->month);
        $year = $request->query('year', now()->year);
        $companyId = $request->query('company_id');

        $user = auth()->user();
        $query = EmployeeEvaluation::with(['employee', 'evaluator'])
            ->where('month', $month)
            ->where('year', $year);

        if ($user->role !== 'admin' && $user->employee_id) {
            $companyId = $user->employee->company_id;
            $query->whereHas('employee', function ($q) use ($companyId) {
                $q->where('company_id', $companyId);
            });
        } elseif (!empty($companyId) && $user->role === 'admin') {
            $companyIds = is_array($companyId) ? $companyId : explode(',', $companyId);
            $companyIds = array_filter($companyIds);
            if (!empty($companyIds)) {
                $query->whereHas('employee', function ($q) use ($companyIds) {
                    $q->whereIn('company_id', $companyIds);
                });
            }
        }

        $evaluations = $query->orderBy('overall_score', 'desc')->get();

        $summary = [
            'total_evaluations' => $evaluations->count(),
            'avg_score' => $evaluations->avg('overall_score') ?: 0,
            'top_performers' => $evaluations->where('overall_score', '>=', 80)->count(), // Changed to 80% scale
            'low_performers' => $evaluations->where('overall_score', '<', 50)->count(),  // Changed to 50% scale
            'dept_averages' => $evaluations->groupBy('employee.department.name')->map(function ($items) {
                return $items->avg('overall_score');
            })->toArray()
        ];

        return Inertia::render('Reports/Evaluation', [
            'evaluations' => $evaluations->map(function($ev) {
                return [
                    'id' => $ev->id,
                    'overall_score' => $ev->overall_score,
                    'criteria_scores' => $ev->criteria_scores,
                    'comments' => $ev->comments,
                    'created_at' => $ev->created_at,
                    'employee' => $ev->employee ? [
                        'name' => $ev->employee->name,
                        'employee_code' => $ev->employee->employee_code,
                        'department' => $ev->employee->department ? $ev->employee->department->name : 'N/A'
                    ] : null,
                    'evaluator' => $ev->evaluator ? ['name' => $ev->evaluator->name] : null
                ];
            }),
            'summary' => $summary,
            'month' => (int)$month,
            'year' => (int)$year,
            'companyId' => $companyId,
            'companies' => $user->role === 'admin' ? Company::orderBy('name')->get(['id', 'name']) : [],
        ]);
    }

    public function advance(Request $request)
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->endOfMonth()->toDateString());
        $status = $request->query('status');

        $user = auth()->user();
        $query = Advance::with(['employee'])
            ->whereBetween('request_date', [$startDate, $endDate]);

        if ($user->role !== 'admin' && $user->employee_id) {
            $query->whereHas('employee', function ($q) use ($user) {
                $q->where('company_id', $user->employee->company_id);
            });
        }

        if ($status) { $query->where('status', $status); }

        $advances = $query->latest()->get();

        $summary = [
            'total_count' => $advances->count(),
            'total_amount' => $advances->sum('amount'),
            'pending' => $advances->where('status', 'pending')->count(),
            'approved' => $advances->where('status', 'approved')->count(),
            'repaid' => $advances->where('status', 'repaid')->count(),
        ];

        return Inertia::render('Reports/Advance', [
            'advances' => $advances,
            'summary' => $summary,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'status' => $status,
        ]);
    }

    // --- Export Methods ---

    private function getReportSettings()
    {
        return Setting::pluck('value', 'key')->toArray();
    }

    public function attendanceExportPdf(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $companyId = $request->query('company_id');
        $employeeId = $request->query('employee_id');
        $reportType = $request->query('report_type', 'detail');

        $user = auth()->user();
        $query = EmployeeAttendance::with(['employee', 'company'])
            ->whereBetween('date', [$startDate, $endDate]);

        if ($user->role !== 'admin' && $user->employee_id) {
            $query->where('company_id', $user->employee->company_id);
        } elseif (!empty($companyId) && $user->role === 'admin') {
            $companyIds = is_array($companyId) ? $companyId : explode(',', $companyId);
            $companyIds = array_filter($companyIds);
            if (!empty($companyIds)) {
                $query->whereIn('company_id', $companyIds);
            }
        }

        if ($employeeId) {
            $employeeIds = is_array($employeeId) ? $employeeId : explode(',', $employeeId);
            $employeeIds = array_filter($employeeIds);
            if (!empty($employeeIds)) {
                $query->whereIn('employee_id', $employeeIds);
            }
        }

        $attendances = $query->orderBy('date')->get();
        
        $summary = [
            'total_days'      => $attendances->count(),
            'present'         => $attendances->whereIn('attendance', ['Present', 'Late'])->count(),
            'absent'          => $attendances->where('attendance', 'Absent')->count(),
            'leave'           => $attendances->whereIn('attendance', ['Leave', 'Sick Leave', 'Annual Leave'])->count(),
            'weekly_off'      => $attendances->where('attendance', 'Weekly Off')->count(),
            'half_day'        => $attendances->where('attendance', 'Half Day')->count(),
            'total_hours'     => $attendances->sum('hours_worked'),
            'total_ot_hours'  => $attendances->sum('ot'),
            'total_ot_amount' => $attendances->sum('ot_amt'),
        ];

        $pdf = Pdf::loadView('reports.attendance', [
            'attendances' => $attendances,
            'summary' => $summary,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'reportType' => $reportType,
            'settings' => $this->getReportSettings()
        ]);

        return $pdf->download($reportType . '_report_' . now()->format('YmdHis') . '.pdf');
    }

    public function attendanceExportExcel(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $companyId = $request->query('company_id');
        $employeeId = $request->query('employee_id');
        $reportType = $request->query('report_type', 'detail');

        $user = auth()->user();
        $query = EmployeeAttendance::with(['employee.department', 'company'])
            ->whereBetween('date', [$startDate, $endDate]);

        if ($user->role !== 'admin' && $user->employee_id) {
            $query->where('company_id', $user->employee->company_id);
        } elseif (!empty($companyId) && $user->role === 'admin') {
            $companyIds = is_array($companyId) ? $companyId : explode(',', $companyId);
            $companyIds = array_filter($companyIds);
            if (!empty($companyIds)) {
                $query->whereIn('company_id', $companyIds);
            }
        }

        if ($employeeId) {
            $employeeIds = is_array($employeeId) ? $employeeId : explode(',', $employeeId);
            $employeeIds = array_filter($employeeIds);
            if (!empty($employeeIds)) {
                $query->whereIn('employee_id', $employeeIds);
            }
        }

        $attendances = $query->orderBy('date')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        if ($reportType === 'summary') {
            $sheet->setTitle('Attendance Summary Report');
            $headers = ['Employee ID', 'Employee Name', 'Company', 'Department', 'Total Days', 'Present', 'Incomplete', 'Absent', 'Leave', 'Weekly Off', 'Total Work Hours', 'Total OT Hours'];
            foreach ($headers as $key => $header) {
                $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($key + 1);
                $sheet->setCellValue($colLetter . '1', $header);
                $sheet->getStyle($colLetter . '1')->getFont()->setBold(true);
            }

            // Group by employee
            $grouped = $attendances->groupBy('employee_id');
            $row = 2;
            foreach ($grouped as $empId => $empAttendances) {
                $first = $empAttendances->first();
                
                $present = 0;
                $incomplete = 0;
                $absent = 0;
                $leave = 0;
                $weeklyOff = 0;

                foreach ($empAttendances as $a) {
                    $rawStatus = $a->attendance;
                    if (stripos($rawStatus, 'leave') !== false) {
                        $leave++;
                    } elseif (stripos($rawStatus, 'off') !== false || stripos($rawStatus, 'weekly') !== false) {
                        $weeklyOff++;
                    } else {
                        $std = $a->normal_hours ?: Setting::get('standard_working_hours', 9, $a->company_id);
                        $worked = $a->hours_worked ?: 0;
                        if ($worked > 0 && $worked < $std) {
                            $incomplete++;
                        } elseif ($worked >= $std) {
                            $present++;
                        } else {
                            $absent++;
                        }
                    }
                }

                $workHours = $empAttendances->sum('hours_worked');
                $otHours = $empAttendances->sum('ot');

                $sheet->setCellValue('A' . $row, $first->employee->employee_code ?? '-');
                $sheet->setCellValue('B' . $row, $first->employee->name);
                $sheet->setCellValue('C' . $row, $first->company->name ?? '-');
                $sheet->setCellValue('D' . $row, $first->employee->department->name ?? '-');
                $sheet->setCellValue('E' . $row, $empAttendances->count());
                $sheet->setCellValue('F' . $row, $present);
                $sheet->setCellValue('G' . $row, $incomplete);
                $sheet->setCellValue('H' . $row, $absent);
                $sheet->setCellValue('I' . $row, $leave);
                $sheet->setCellValue('J' . $row, $weeklyOff);
                $sheet->setCellValue('K' . $row, $workHours);
                $sheet->setCellValue('L' . $row, $otHours);
                $row++;
            }
        } elseif ($reportType === 'overtime') {
            $sheet->setTitle('Overtime Report');
            $headers = ['Date', 'Employee ID', 'Employee Name', 'Company', 'Normal Hours', 'Actual Hours', 'OT Hours', 'OT Rate', 'OT Amount'];
            foreach ($headers as $key => $header) {
                $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($key + 1);
                $sheet->setCellValue($colLetter . '1', $header);
                $sheet->getStyle($colLetter . '1')->getFont()->setBold(true);
            }

            $row = 2;
            foreach ($attendances->where('ot', '>', 0) as $attendance) {
                $sheet->setCellValue('A' . $row, $attendance->date);
                $sheet->setCellValue('B' . $row, $attendance->employee->employee_code ?? '-');
                $sheet->setCellValue('C' . $row, $attendance->employee->name);
                $sheet->setCellValue('D' . $row, $attendance->company->name);
                $sheet->setCellValue('E' . $row, $attendance->normal_hours ?: 8);
                $sheet->setCellValue('F' . $row, $attendance->hours_worked);
                $sheet->setCellValue('G' . $row, $attendance->ot);
                $sheet->setCellValue('H' . $row, Setting::get('overtime_rate_multiplier', 1.5, $attendance->company_id));
                $sheet->setCellValue('I' . $row, $attendance->ot_amt);
                $row++;
            }
        } else {
            $sheet->setTitle('Attendance Detail Report');
            $headers = [
                'Date',
                'Day',
                'shift hours eg branch hours',
                'Employee ID',
                'Employee Name',
                'branch',
                'Department',
                'Hours Worked',
                'OT Hours',
                'check in',
                'check out',
                'Total hours',
                'break hours',
                'overtime',
                'incomplete h',
                'Status'
            ];
            foreach ($headers as $key => $header) {
                $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($key + 1);
                $sheet->setCellValue($colLetter . '1', $header);
                $sheet->getStyle($colLetter . '1')->getFont()->setBold(true);
            }

            $row = 2;
            foreach ($attendances as $attendance) {
                $dayOfWeek = strtoupper(Carbon::parse($attendance->date)->format('l'));
                $stdHours = $attendance->normal_hours ?: Setting::get('standard_working_hours', 9, $attendance->company_id);
                $workedHours = floatval($attendance->hours_worked ?: 0);
                $otHours = floatval($attendance->ot ?: 0);

                $totalHours = 0;
                if ($attendance->from_time && $attendance->to_time) {
                    $from = Carbon::parse($attendance->from_time);
                    $to = Carbon::parse($attendance->to_time);
                    $totalHours = round($to->diffInMinutes($from) / 60, 2);
                }

                $breakHours = round(($attendance->total_break_minutes ?: 0) / 60, 2);
                $incompleteHours = $workedHours < $stdHours ? round($stdHours - $workedHours, 2) : 0;

                // Status mapping
                $rawStatus = $attendance->attendance;
                $statusDisplay = $rawStatus;
                if (stripos($rawStatus, 'leave') !== false) {
                    $statusDisplay = 'Leave';
                } elseif (stripos($rawStatus, 'off') !== false || stripos($rawStatus, 'weekly') !== false) {
                    $statusDisplay = 'Weekoff';
                } else {
                    if ($workedHours > 0 && $workedHours < $stdHours) {
                        $statusDisplay = 'Incomplete';
                    } elseif ($workedHours >= $stdHours) {
                        $statusDisplay = 'Present';
                    } else {
                        $statusDisplay = $rawStatus ?: 'Absent';
                    }
                }

                $sheet->setCellValue('A' . $row, $attendance->date);
                $sheet->setCellValue('B' . $row, $dayOfWeek);
                $sheet->setCellValue('C' . $row, floatval($stdHours));
                $sheet->setCellValue('D' . $row, $attendance->employee->employee_code ?? '-');
                $sheet->setCellValue('E' . $row, $attendance->employee->name);
                $sheet->setCellValue('F' . $row, $attendance->company->name ?? '-');
                $sheet->setCellValue('G' . $row, $attendance->employee->department->name ?? '-');
                $sheet->setCellValue('H' . $row, $workedHours);
                $sheet->setCellValue('I' . $row, $otHours);
                $sheet->setCellValue('J' . $row, $attendance->from_time ?: '');
                $sheet->setCellValue('K' . $row, $attendance->to_time ?: '');
                $sheet->setCellValue('L' . $row, $totalHours ?: '');
                $sheet->setCellValue('M' . $row, $breakHours ?: '');
                $sheet->setCellValue('N' . $row, $otHours ?: '');
                $sheet->setCellValue('O' . $row, $incompleteHours ?: '');
                $sheet->setCellValue('P' . $row, $statusDisplay);
                $row++;
            }
        }

        $writer = new Xlsx($spreadsheet);
        $fileName = $reportType . '_report_' . now()->format('YmdHis') . '.xlsx';
        
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="'. $fileName .'"');
        $writer->save('php://output');
        exit;
    }

    public function leaveExportPdf(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $status = $request->query('status');
        $leaveTypeId = $request->query('leave_type_id');

        $user = auth()->user();
        $query = LeaveRequest::with(['employee', 'leaveType'])
            ->whereBetween('start_date', [$startDate, $endDate]);

        if ($user->role !== 'admin' && $user->employee_id) {
            $query->whereHas('employee', function ($q) use ($user) {
                $q->where('company_id', $user->employee->company_id);
            });
        }

        if ($status) { $query->where('status', $status); }
        if ($leaveTypeId) { $query->where('leave_type_id', $leaveTypeId); }

        $leaveRequests = $query->orderBy('start_date')->get();

        $summary = [
            'total_requests' => $leaveRequests->count(),
            'pending' => $leaveRequests->where('status', 'pending')->count(),
            'approved' => $leaveRequests->where('status', 'approved')->count(),
            'rejected' => $leaveRequests->where('status', 'rejected')->count(),
            'total_days' => $leaveRequests->sum('days_requested'),
        ];

        $pdf = Pdf::loadView('reports.leave', [
            'leaveRequests' => $leaveRequests,
            'summary' => $summary,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'settings' => $this->getReportSettings()
        ]);

        return $pdf->download('leave_report_' . now()->format('YmdHis') . '.pdf');
    }

    public function leaveExportExcel(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $status = $request->query('status');
        $leaveTypeId = $request->query('leave_type_id');

        $user = auth()->user();
        $query = LeaveRequest::with(['employee', 'leaveType'])
            ->whereBetween('start_date', [$startDate, $endDate]);

        if ($user->role !== 'admin' && $user->employee_id) {
            $query->whereHas('employee', function ($q) use ($user) {
                $q->where('company_id', $user->employee->company_id);
            });
        }

        if ($status) { $query->where('status', $status); }
        if ($leaveTypeId) { $query->where('leave_type_id', $leaveTypeId); }

        $leaveRequests = $query->orderBy('start_date')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Leave Report');

        $headers = ['Employee', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason'];
        foreach ($headers as $key => $header) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($key + 1);
            $sheet->setCellValue($colLetter . '1', $header);
            $sheet->getStyle($colLetter . '1')->getFont()->setBold(true);
        }

        $row = 2;
        foreach ($leaveRequests as $req) {
            $sheet->setCellValue('A' . $row, $req->employee->name);
            $sheet->setCellValue('B' . $row, $req->leaveType->name);
            $sheet->setCellValue('C' . $row, $req->start_date);
            $sheet->setCellValue('D' . $row, $req->end_date);
            $sheet->setCellValue('E' . $row, $req->days_requested);
            $sheet->setCellValue('F' . $row, ucfirst($req->status));
            $sheet->setCellValue('G' . $row, $req->reason);
            $row++;
        }

        $writer = new Xlsx($spreadsheet);
        $fileName = 'leave_report_' . now()->format('YmdHis') . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="'. $fileName .'"');
        $writer->save('php://output');
        exit;
    }
    public function salaryExportPdf(Request $request)
    {
        $month = $request->query('month');
        $year = $request->query('year');
        $companyId = $request->query('company_id');
        $employeeId = $request->query('employee_id');

        $user = auth()->user();
        $query = SalaryPosting::with(['employee'])
            ->where('year', $year);

        $months = [];
        if ($month) {
            $months = is_array($month) ? $month : explode(',', $month);
            $months = array_filter(array_map('intval', $months));
        }
        if (!empty($months)) {
            $query->whereIn('month', $months);
        }

        if ($user->role !== 'admin' && $user->employee_id) {
            $companyId = $user->employee->company_id;
            $query->whereHas('employee', function ($q) use ($companyId) {
                $q->where('company_id', $companyId);
            });
        } elseif (!empty($companyId) && $user->role === 'admin') {
            $companyIds = is_array($companyId) ? $companyId : explode(',', $companyId);
            $companyIds = array_filter($companyIds);
            if (!empty($companyIds)) {
                $query->whereHas('employee', function ($q) use ($companyIds) {
                    $q->whereIn('company_id', $companyIds);
                });
            }
        }

        if ($employeeId) {
            $employeeIds = is_array($employeeId) ? $employeeId : explode(',', $employeeId);
            $employeeIds = array_filter($employeeIds);
            if (!empty($employeeIds)) {
                $query->whereIn('employee_id', $employeeIds);
            }
        }

        $salaryPostings = $query->orderBy('employee_id')->get();

        $summary = [
            'total_employees' => $salaryPostings->count(),
            'total_basic' => $salaryPostings->sum('basic_salary'),
            'total_allowances' => $salaryPostings->sum(function ($posting) {
                return is_array($posting->allowances) ? array_sum($posting->allowances) : 0;
            }),
            'total_deductions' => $salaryPostings->sum(function ($posting) {
                return is_array($posting->deductions) ? array_sum($posting->deductions) : 0;
            }),
            'total_net_salary' => $salaryPostings->sum('net_salary'),
        ];

        $monthNames = [];
        $monthsArray = [
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April', 5 => 'May', 6 => 'June',
            7 => 'July', 8 => 'August', 9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December'
        ];
        foreach ($months as $m) {
            if (isset($monthsArray[$m])) {
                $monthNames[] = $monthsArray[$m];
            }
        }
        $monthLabel = implode(', ', $monthNames);

        $pdf = Pdf::loadView('reports.salary', [
            'salaryPostings' => $salaryPostings,
            'summary' => $summary,
            'month' => $monthLabel ?: 'All',
            'year' => $year,
            'settings' => $this->getReportSettings()
        ]);

        return $pdf->download('salary_report_' . $year . '_' . implode('_', $months) . '.pdf');
    }

    public function salaryExportExcel(Request $request)
    {
        $month = $request->query('month');
        $year = $request->query('year');
        $companyId = $request->query('company_id');
        $employeeId = $request->query('employee_id');

        $user = auth()->user();
        $query = SalaryPosting::with(['employee'])
            ->where('year', $year);

        $months = [];
        if ($month) {
            $months = is_array($month) ? $month : explode(',', $month);
            $months = array_filter(array_map('intval', $months));
        }
        if (!empty($months)) {
            $query->whereIn('month', $months);
        }

        if ($user->role !== 'admin' && $user->employee_id) {
            $companyId = $user->employee->company_id;
            $query->whereHas('employee', function ($q) use ($companyId) {
                $q->where('company_id', $companyId);
            });
        } elseif (!empty($companyId) && $user->role === 'admin') {
            $companyIds = is_array($companyId) ? $companyId : explode(',', $companyId);
            $companyIds = array_filter($companyIds);
            if (!empty($companyIds)) {
                $query->whereHas('employee', function ($q) use ($companyIds) {
                    $q->whereIn('company_id', $companyIds);
                });
            }
        }

        if ($employeeId) {
            $employeeIds = is_array($employeeId) ? $employeeId : explode(',', $employeeId);
            $employeeIds = array_filter($employeeIds);
            if (!empty($employeeIds)) {
                $query->whereIn('employee_id', $employeeIds);
            }
        }

        $salaryPostings = $query->orderBy('employee_id')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Salary Report');

        $headers = ['Employee ID', 'Employee Name', 'Basic Salary', 'Allowances', 'Deductions', 'Net Salary'];
        foreach ($headers as $key => $header) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($key + 1);
            $sheet->setCellValue($colLetter . '1', $header);
            $sheet->getStyle($colLetter . '1')->getFont()->setBold(true);
        }

        $row = 2;
        foreach ($salaryPostings as $post) {
            $allowances = is_array($post->allowances) ? array_sum($post->allowances) : 0;
            $deductions = is_array($post->deductions) ? array_sum($post->deductions) : 0;
            
            $sheet->setCellValue('A' . $row, $post->employee->employee_code ?? '-');
            $sheet->setCellValue('B' . $row, $post->employee->name);
            $sheet->setCellValue('C' . $row, $post->basic_salary);
            $sheet->setCellValue('D' . $row, $allowances);
            $sheet->setCellValue('E' . $row, $deductions);
            $sheet->setCellValue('F' . $row, $post->net_salary);
            $row++;
        }

        $writer = new Xlsx($spreadsheet);
        $fileName = 'salary_report_' . $year . '_' . implode('_', $months) . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="'. $fileName .'"');
        $writer->save('php://output');
        exit;
    }
    public function loanExportPdf(Request $request)
    {
        $status = $request->query('status');
        $loanType = $request->query('loan_type');
        $companyId = $request->query('company_id');
        $employeeId = $request->query('employee_id');

        $user = auth()->user();
        $query = Loan::with(['employee']);

        if ($user->role !== 'admin' && $user->employee_id) {
            $companyId = $user->employee->company_id;
            $query->whereHas('employee', function ($q) use ($companyId) {
                $q->where('company_id', $companyId);
            });
        } elseif (!empty($companyId) && $user->role === 'admin') {
            $companyIds = is_array($companyId) ? $companyId : explode(',', $companyId);
            $companyIds = array_filter($companyIds);
            if (!empty($companyIds)) {
                $query->whereHas('employee', function ($q) use ($companyIds) {
                    $q->whereIn('company_id', $companyIds);
                });
            }
        }

        if ($employeeId) {
            $employeeIds = is_array($employeeId) ? $employeeId : explode(',', $employeeId);
            $employeeIds = array_filter($employeeIds);
            if (!empty($employeeIds)) {
                $query->whereIn('employee_id', $employeeIds);
            }
        }

        if ($status) { $query->where('status', $status); }
        if ($loanType) { $query->where('loan_type', $loanType); }

        $loans = $query->latest()->get();

        $summary = [
            'total_loans' => $loans->count(),
            'pending' => $loans->where('status', 'pending')->count(),
            'approved' => $loans->where('status', 'approved')->count(),
            'disbursed' => $loans->where('status', 'disbursed')->count(),
            'completed' => $loans->where('status', 'completed')->count(),
            'total_amount' => $loans->sum('amount'),
            'total_outstanding' => $loans->whereIn('status', ['approved', 'disbursed'])->sum('amount'),
        ];

        $pdf = Pdf::loadView('reports.loan', [
            'loans' => $loans,
            'summary' => $summary,
            'settings' => $this->getReportSettings()
        ]);

        return $pdf->download('loan_report_' . now()->format('YmdHis') . '.pdf');
    }

    public function loanExportExcel(Request $request)
    {
        $status = $request->query('status');
        $loanType = $request->query('loan_type');
        $companyId = $request->query('company_id');
        $employeeId = $request->query('employee_id');

        $user = auth()->user();
        $query = Loan::with(['employee']);

        if ($user->role !== 'admin' && $user->employee_id) {
            $companyId = $user->employee->company_id;
            $query->whereHas('employee', function ($q) use ($companyId) {
                $q->where('company_id', $companyId);
            });
        } elseif (!empty($companyId) && $user->role === 'admin') {
            $companyIds = is_array($companyId) ? $companyId : explode(',', $companyId);
            $companyIds = array_filter($companyIds);
            if (!empty($companyIds)) {
                $query->whereHas('employee', function ($q) use ($companyIds) {
                    $q->whereIn('company_id', $companyIds);
                });
            }
        }

        if ($employeeId) {
            $employeeIds = is_array($employeeId) ? $employeeId : explode(',', $employeeId);
            $employeeIds = array_filter($employeeIds);
            if (!empty($employeeIds)) {
                $query->whereIn('employee_id', $employeeIds);
            }
        }

        if ($status) { $query->where('status', $status); }
        if ($loanType) { $query->where('loan_type', $loanType); }

        $loans = $query->latest()->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Loan Report');

        $headers = ['Employee', 'Loan Type', 'Amount', 'Interest', 'Total Payable', 'Total Paid', 'Status', 'Applied Date'];
        foreach ($headers as $key => $header) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($key + 1);
            $sheet->setCellValue($colLetter . '1', $header);
            $sheet->getStyle($colLetter . '1')->getFont()->setBold(true);
        }

        $row = 2;
        foreach ($loans as $loan) {
            $sheet->setCellValue('A' . $row, $loan->employee->name);
            $sheet->setCellValue('B' . $row, ucfirst($loan->loan_type));
            $sheet->setCellValue('C' . $row, $loan->amount);
            $sheet->setCellValue('D' . $row, $loan->interest_amount);
            $sheet->setCellValue('E' . $row, $loan->total_payable);
            $sheet->setCellValue('F' . $row, $loan->total_paid);
            $sheet->setCellValue('G' . $row, ucfirst($loan->status));
            $sheet->setCellValue('H' . $row, $loan->created_at->toDateString());
            $row++;
        }

        $writer = new Xlsx($spreadsheet);
        $fileName = 'loan_report_' . now()->format('YmdHis') . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="'. $fileName .'"');
        $writer->save('php://output');
        exit;
    }
    public function trainingExportPdf(Request $request)
    {
        $status = $request->query('status');
        $category = $request->query('category');

        $user = auth()->user();
        $query = Training::with(['creator', 'assignments']);

        if ($user->role !== 'admin' && $user->employee_id) {
            $query->where('company_id', $user->employee->company_id);
        }

        if ($status) { $query->where('status', $status); }
        if ($category) { $query->where('category', $category); }

        $trainings = $query->latest()->get();

        $summary = [
            'total_trainings' => $trainings->count(),
            'scheduled' => $trainings->where('status', 'scheduled')->count(),
            'ongoing' => $trainings->where('status', 'ongoing')->count(),
            'completed' => $trainings->where('status', 'completed')->count(),
            'total_participants' => $trainings->sum(function ($training) {
                return $training->assignments->count();
            }),
        ];

        $pdf = Pdf::loadView('reports.training', [
            'trainings' => $trainings,
            'summary' => $summary,
            'settings' => $this->getReportSettings()
        ]);

        return $pdf->download('training_report_' . now()->format('YmdHis') . '.pdf');
    }

    public function trainingExportExcel(Request $request)
    {
        $status = $request->query('status');
        $category = $request->query('category');

        $user = auth()->user();
        $query = Training::with(['creator', 'assignments']);

        if ($user->role !== 'admin' && $user->employee_id) {
            $query->where('company_id', $user->employee->company_id);
        }

        if ($status) { $query->where('status', $status); }
        if ($category) { $query->where('category', $category); }

        $trainings = $query->latest()->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Training Report');

        $headers = ['Title', 'Category', 'Trainer', 'Start Date', 'End Date', 'Participants', 'Status'];
        foreach ($headers as $key => $header) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($key + 1);
            $sheet->setCellValue($colLetter . '1', $header);
            $sheet->getStyle($colLetter . '1')->getFont()->setBold(true);
        }

        $row = 2;
        foreach ($trainings as $tr) {
            $sheet->setCellValue('A' . $row, $tr->title);
            $sheet->setCellValue('B' . $row, $tr->category);
            $sheet->setCellValue('C' . $row, $tr->trainer_name);
            $sheet->setCellValue('D' . $row, $tr->start_date);
            $sheet->setCellValue('E' . $row, $tr->end_date);
            $sheet->setCellValue('F' . $row, $tr->assignments->count());
            $sheet->setCellValue('G' . $row, ucfirst($tr->status));
            $row++;
        }

        $writer = new Xlsx($spreadsheet);
        $fileName = 'training_report_' . now()->format('YmdHis') . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="'. $fileName .'"');
        $writer->save('php://output');
        exit;
    }
    public function taskExportPdf(Request $request)
    {
        $status = $request->query('status');
        $priority = $request->query('priority');

        $user = auth()->user();
        $query = Task::with(['creator', 'assignments']);

        if ($user->role !== 'admin' && $user->employee_id) {
            $query->where('branch_id', $user->employee->company_id);
        }

        if ($status) { $query->where('status', $status); }
        if ($priority) { $query->where('priority', $priority); }

        $tasks = $query->latest()->get();

        $summary = [
            'total_tasks' => $tasks->count(),
            'pending' => $tasks->where('status', 'pending')->count(),
            'in_progress' => $tasks->where('status', 'in_progress')->count(),
            'completed' => $tasks->where('status', 'completed')->count(),
            'cancelled' => $tasks->where('status', 'cancelled')->count(),
        ];

        $pdf = Pdf::loadView('reports.task', [
            'tasks' => $tasks,
            'summary' => $summary,
            'settings' => $this->getReportSettings()
        ]);

        return $pdf->download('task_report_' . now()->format('YmdHis') . '.pdf');
    }

    public function taskExportExcel(Request $request)
    {
        $status = $request->query('status');
        $priority = $request->query('priority');

        $user = auth()->user();
        $query = Task::with(['creator', 'assignments']);

        if ($user->role !== 'admin' && $user->employee_id) {
            $query->where('branch_id', $user->employee->company_id);
        }

        if ($status) { $query->where('status', $status); }
        if ($priority) { $query->where('priority', $priority); }

        $tasks = $query->latest()->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Task Report');

        $headers = ['Title', 'Priority', 'Due Date', 'Progress', 'Assignments', 'Status'];
        foreach ($headers as $key => $header) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($key + 1);
            $sheet->setCellValue($colLetter . '1', $header);
            $sheet->getStyle($colLetter . '1')->getFont()->setBold(true);
        }

        $row = 2;
        foreach ($tasks as $task) {
            $sheet->setCellValue('A' . $row, $task->title);
            $sheet->setCellValue('B' . $row, ucfirst($task->priority));
            $sheet->setCellValue('C' . $row, $task->due_date);
            $sheet->setCellValue('D' . $row, $task->progress . '%');
            $sheet->setCellValue('E' . $row, $task->assignments->count());
            $sheet->setCellValue('F' . $row, str_replace('_', ' ', ucfirst($task->status)));
            $row++;
        }

        $writer = new Xlsx($spreadsheet);
        $fileName = 'task_report_' . now()->format('YmdHis') . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="'. $fileName .'"');
        $writer->save('php://output');
        exit;
    }
    public function grievanceExportPdf(Request $request)
    {
        $status = $request->query('status');
        $priority = $request->query('priority');

        $user = auth()->user();
        $query = Grievance::with(['employee']);

        if ($user->role !== 'admin' && $user->employee_id) {
            $query->whereHas('employee', function ($q) use ($user) {
                $q->where('company_id', $user->employee->company_id);
            });
        }

        if ($status) { $query->where('status', $status); }
        if ($priority) { $query->where('priority', $priority); }

        $grievances = $query->latest()->get();

        $summary = [
            'total_grievances' => $grievances->count(),
            'submitted' => $grievances->where('status', 'submitted')->count(),
            'under_review' => $grievances->where('status', 'under_review')->count(),
            'resolved' => $grievances->where('status', 'resolved')->count(),
            'closed' => $grievances->where('status', 'closed')->count(),
        ];

        $pdf = Pdf::loadView('reports.grievance', [
            'grievances' => $grievances,
            'summary' => $summary,
            'settings' => $this->getReportSettings()
        ]);

        return $pdf->download('grievance_report_' . now()->format('YmdHis') . '.pdf');
    }

    public function grievanceExportExcel(Request $request)
    {
        $status = $request->query('status');
        $priority = $request->query('priority');

        $user = auth()->user();
        $query = Grievance::with(['employee']);

        if ($user->role !== 'admin' && $user->employee_id) {
            $query->whereHas('employee', function ($q) use ($user) {
                $q->where('company_id', $user->employee->company_id);
            });
        }

        if ($status) { $query->where('status', $status); }
        if ($priority) { $query->where('priority', $priority); }

        $grievances = $query->latest()->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Grievance Report');

        $headers = ['Employee', 'Subject', 'Priority', 'Status', 'Date Filed'];
        foreach ($headers as $key => $header) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($key + 1);
            $sheet->setCellValue($colLetter . '1', $header);
            $sheet->getStyle($colLetter . '1')->getFont()->setBold(true);
        }

        $row = 2;
        foreach ($grievances as $gr) {
            $sheet->setCellValue('A' . $row, $gr->employee->name);
            $sheet->setCellValue('B' . $row, $gr->subject);
            $sheet->setCellValue('C' . $row, ucfirst($gr->priority));
            $sheet->setCellValue('D' . $row, str_replace('_', ' ', ucfirst($gr->status)));
            $sheet->setCellValue('E' . $row, $gr->created_at->toDateString());
            $row++;
        }

        $writer = new Xlsx($spreadsheet);
        $fileName = 'grievance_report_' . now()->format('YmdHis') . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="'. $fileName .'"');
        $writer->save('php://output');
        exit;
    }

    public function evaluationExportPdf(Request $request)
    {
        $month = $request->query('month');
        $year = $request->query('year');
        $companyId = $request->query('company_id');

        $user = auth()->user();
        $query = EmployeeEvaluation::with(['employee', 'evaluator'])
            ->where('month', $month)
            ->where('year', $year);

        if ($user->role !== 'admin' && $user->employee_id) {
            $companyId = $user->employee->company_id;
            $query->whereHas('employee', function ($q) use ($companyId) {
                $q->where('company_id', $companyId);
            });
        } elseif (!empty($companyId) && $user->role === 'admin') {
            $companyIds = is_array($companyId) ? $companyId : explode(',', $companyId);
            $companyIds = array_filter($companyIds);
            if (!empty($companyIds)) {
                $query->whereHas('employee', function ($q) use ($companyIds) {
                    $q->whereIn('company_id', $companyIds);
                });
            }
        }

        $evaluations = $query->orderBy('overall_score', 'desc')->get()->map(function($ev) {
            return [
                'overall_score' => $ev->overall_score,
                'criteria_scores' => $ev->criteria_scores,
                'comments' => $ev->comments,
                'employee' => [
                    'name' => $ev->employee->name,
                    'department' => $ev->employee->department ? $ev->employee->department->name : 'N/A'
                ]
            ];
        });

        $summary = [
            'total_evaluations' => $evaluations->count(),
            'avg_score' => $evaluations->avg('overall_score') ?: 0,
        ];

        $pdf = Pdf::loadView('reports.evaluation', [
            'evaluations' => $evaluations,
            'summary' => $summary,
            'month' => $month,
            'year' => $year,
            'settings' => $this->getReportSettings()
        ]);

        return $pdf->download('evaluation_report_' . $year . '_' . $month . '.pdf');
    }

    public function evaluationExportExcel(Request $request)
    {
        $month = $request->query('month');
        $year = $request->query('year');
        $companyId = $request->query('company_id');

        $user = auth()->user();
        $query = EmployeeEvaluation::with(['employee', 'evaluator'])
            ->where('month', $month)
            ->where('year', $year);

        if ($user->role !== 'admin' && $user->employee_id) {
            $companyId = $user->employee->company_id;
            $query->whereHas('employee', function ($q) use ($companyId) {
                $q->where('company_id', $companyId);
            });
        } elseif (!empty($companyId) && $user->role === 'admin') {
            $companyIds = is_array($companyId) ? $companyId : explode(',', $companyId);
            $companyIds = array_filter($companyIds);
            if (!empty($companyIds)) {
                $query->whereHas('employee', function ($q) use ($companyIds) {
                    $q->whereIn('company_id', $companyIds);
                });
            }
        }

        $evaluations = $query->orderBy('overall_score', 'desc')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Evaluation Report');

        $headers = ['Employee', 'Evaluator', 'Overall Score', 'Comments', 'Date'];
        foreach ($headers as $key => $header) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($key + 1);
            $sheet->setCellValue($colLetter . '1', $header);
            $sheet->getStyle($colLetter . '1')->getFont()->setBold(true);
        }

        $row = 2;
        foreach ($evaluations as $ev) {
            $sheet->setCellValue('A' . $row, $ev->employee->name);
            $sheet->setCellValue('B' . $row, $ev->evaluator->name);
            $sheet->setCellValue('C' . $row, $ev->overall_score);
            $sheet->setCellValue('D' . $row, $ev->comments);
            $sheet->setCellValue('E' . $row, $ev->created_at->toDateString());
            $row++;
        }

        $writer = new Xlsx($spreadsheet);
        $fileName = 'evaluation_report_' . $year . '_' . $month . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="'. $fileName .'"');
        $writer->save('php://output');
        exit;
    }

    public function advanceExportPdf(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $status = $request->query('status');

        $user = auth()->user();
        $query = Advance::with(['employee'])
            ->whereBetween('request_date', [$startDate, $endDate]);

        if ($user->role !== 'admin' && $user->employee_id) {
            $query->whereHas('employee', function ($q) use ($user) {
                $q->where('company_id', $user->employee->company_id);
            });
        }

        if ($status) { $query->where('status', $status); }

        $advances = $query->latest()->get();

        $summary = [
            'total_count' => $advances->count(),
            'total_amount' => $advances->sum('amount'),
        ];

        $pdf = Pdf::loadView('reports.advance', [
            'advances' => $advances,
            'summary' => $summary,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'settings' => $this->getReportSettings()
        ]);

        return $pdf->download('advance_report_' . now()->format('YmdHis') . '.pdf');
    }

    public function advanceExportExcel(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $status = $request->query('status');

        $user = auth()->user();
        $query = Advance::with(['employee'])
            ->whereBetween('request_date', [$startDate, $endDate]);

        if ($user->role !== 'admin' && $user->employee_id) {
            $query->whereHas('employee', function ($q) use ($user) {
                $q->where('company_id', $user->employee->company_id);
            });
        }

        if ($status) { $query->where('status', $status); }

        $advances = $query->latest()->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Advance Report');

        $headers = ['Employee', 'Amount', 'Date', 'Purpose', 'Status', 'Repayment Date'];
        foreach ($headers as $key => $header) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($key + 1);
            $sheet->setCellValue($colLetter . '1', $header);
            $sheet->getStyle($colLetter . '1')->getFont()->setBold(true);
        }

        $row = 2;
        foreach ($advances as $adv) {
            $sheet->setCellValue('A' . $row, $adv->employee->name);
            $sheet->setCellValue('B' . $row, $adv->amount);
            $sheet->setCellValue('C' . $row, $adv->request_date->toDateString());
            $sheet->setCellValue('D' . $row, $adv->purpose);
            $sheet->setCellValue('E' . $row, ucfirst($adv->status));
            $sheet->setCellValue('F' . $row, $adv->repayment_date ? $adv->repayment_date->toDateString() : '-');
            $row++;
        }

        $writer = new Xlsx($spreadsheet);
        $fileName = 'advance_report_' . now()->format('YmdHis') . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="'. $fileName .'"');
        $writer->save('php://output');
        exit;
    }
}
