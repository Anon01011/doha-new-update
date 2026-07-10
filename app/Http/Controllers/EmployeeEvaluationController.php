<?php

namespace App\Http\Controllers;

use App\Models\EmployeeEvaluation;
use App\Models\Employee;
use App\Models\Company;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeEvaluationController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        if (!$user->employee_id && $user->role !== 'admin') {
            abort(403, 'Unauthorized.');
        }

        $query = EmployeeEvaluation::with(['employee.company', 'employee.department', 'evaluator']);

        if ($user->role === 'employee') {
            $query->where('employee_id', $user->employee_id);
        } elseif (!$user->isAdmin() && $user->role !== 'hr' && $user->employee_id && $user->employee) {
            $query->where('company_id', $user->employee->company_id);
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->whereHas('employee', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('employee_code', 'like', "%{$search}%");
            });
        }

        if ($request->has('status')) {
            $status = $request->input('status');
            if ($status === 'approved') {
                $query->where('overall_score', '>=', 70);
            } elseif ($status === 'pending') {
                $query->where('overall_score', '<', 70);
            }
        }

        $evaluations = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Evaluation/Index', [
            'evaluations' => $evaluations,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function show(EmployeeEvaluation $evaluation)
    {
        $user = auth()->user();
        $evaluation->load(['employee.company', 'employee.department', 'evaluator']);

        // Authorization
        if ($user->role === 'employee' && $evaluation->employee_id !== $user->employee_id) {
            abort(403, 'Unauthorized.');
        }

        if (!$user->isAdmin() && $user->role !== 'hr' && $user->employee_id && $user->employee) {
            if ($evaluation->company_id != $user->employee->company_id) {
                abort(403, 'Unauthorized.');
            }
        }

        return Inertia::render('Evaluation/Show', [
            'evaluation' => $evaluation,
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        // Only managers, HR, Admin can create evaluations
        if (!in_array($user->role, ['admin', 'hr', 'manager'])) {
            abort(403, 'Unauthorized.');
        }

        $companyId = $user->employee ? $user->employee->company_id : null;

        $employeesQuery = Employee::query()->active();

        $compQuery = Company::orderBy('name');
        $deptQuery = Department::orderBy('name');

        if ($companyId) {
            $employeesQuery->where('company_id', $companyId);
            $compQuery->where('id', $companyId);
            $deptQuery->where('company_id', $companyId);
        }

        $employees = $employeesQuery->get(['id', 'name', 'employee_image', 'company_id', 'department_id']);

        return Inertia::render('Evaluation/Create', [
            'employees' => $employees,
            'branches' => $compQuery->get(['id', 'name']),
            'departments' => $deptQuery->get(['id', 'name', 'company_id']),
            'criteria' => $this->getEvaluationCriteria(),
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if (!in_array($user->role, ['admin', 'hr', 'manager'])) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required',
            'year' => 'required|integer',
            'criteria_scores' => 'required|array',
            'comments' => 'nullable|string',
        ]);

        // Calculate overall score (simple average converted to percentage)
        $scores = array_values($validated['criteria_scores']);
        $average = count($scores) > 0 ? array_sum($scores) / count($scores) : 0;

        // Convert 1-4 scale to 0-100 percentage
        $overallScore = round(($average / 4) * 100);

        $employee = Employee::findOrFail($validated['employee_id']);

        // Multi-tenancy check
        if (!$user->isAdmin() && $user->role !== 'hr' && $user->employee_id && $user->employee) {
            if ($employee->company_id != $user->employee->company_id) {
                abort(403, 'Unauthorized access to another branch.');
            }
        }

        // Convert month name to integer if it's a string
        $monthValue = $validated['month'];
        if (is_string($monthValue) && !is_numeric($monthValue)) {
            $monthValue = date('n', strtotime($monthValue));
        }

        EmployeeEvaluation::create([
            'employee_id' => $validated['employee_id'],
            'evaluator_id' => $user->id,
            'company_id' => $employee->company_id,
            'month' => (int)$monthValue,
            'year' => $validated['year'],
            'overall_score' => $overallScore,
            'criteria_scores' => $validated['criteria_scores'],
            'comments' => $validated['comments'],
        ]);

        return redirect()->route('evaluations.index')->with('success', 'Evaluation submitted successfully.');
    }

    public function edit(EmployeeEvaluation $evaluation)
    {
        $user = auth()->user();
        $evaluation->load(['employee.company', 'employee.department', 'evaluator']);

        // Authorization
        if ($user->role === 'employee') {
            abort(403, 'Employees cannot edit evaluations.');
        }

        if (!in_array($user->role, ['admin', 'hr', 'manager'])) {
            abort(403, 'Unauthorized.');
        }

        if (!$user->isAdmin() && $user->role !== 'hr' && $user->employee_id && $user->employee) {
            if ($evaluation->company_id != $user->employee->company_id) {
                abort(403, 'Unauthorized access to another branch.');
            }
        }

        $companyId = $user->employee ? $user->employee->company_id : null;
        $employeesQuery = Employee::query()->active();

        $compQuery = Company::orderBy('name');
        $deptQuery = Department::orderBy('name');

        if ($companyId) {
            $employeesQuery->where('company_id', $companyId);
            $compQuery->where('id', $companyId);
            $deptQuery->where('company_id', $companyId);
        }

        $employees = $employeesQuery->get(['id', 'name', 'employee_image', 'company_id', 'department_id']);

        return Inertia::render('Evaluation/Edit', [
            'evaluation' => $evaluation,
            'employees' => $employees,
            'branches' => $compQuery->get(['id', 'name']),
            'departments' => $deptQuery->get(['id', 'name', 'company_id']),
            'criteria' => $this->getEvaluationCriteria(),
        ]);
    }

    public function update(Request $request, EmployeeEvaluation $evaluation)
    {
        $user = auth()->user();
        if (!in_array($user->role, ['admin', 'hr', 'manager'])) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required',
            'year' => 'required|integer',
            'criteria_scores' => 'required|array',
            'comments' => 'nullable|string',
        ]);

        // Calculate overall score (simple average converted to percentage)
        $scores = array_values($validated['criteria_scores']);
        $average = count($scores) > 0 ? array_sum($scores) / count($scores) : 0;

        // Convert 1-4 scale to 0-100 percentage
        $overallScore = round(($average / 4) * 100);

        $employee = Employee::findOrFail($validated['employee_id']);

        // Multi-tenancy check
        if (!$user->isAdmin() && $user->role !== 'hr' && $user->employee_id && $user->employee) {
            if ($employee->company_id != $user->employee->company_id) {
                abort(403, 'Unauthorized access to another branch.');
            }
        }

        // Convert month name to integer if it's a string
        $monthValue = $validated['month'];
        if (is_string($monthValue) && !is_numeric($monthValue)) {
            $monthValue = date('n', strtotime($monthValue));
        }

        $evaluation->update([
            'employee_id' => $validated['employee_id'],
            'month' => (int)$monthValue,
            'year' => $validated['year'],
            'overall_score' => $overallScore,
            'criteria_scores' => $validated['criteria_scores'],
            'comments' => $validated['comments'],
        ]);

        return redirect()->route('evaluations.index')->with('success', 'Evaluation updated successfully.');
    }

    public function destroy(EmployeeEvaluation $evaluation)
    {
        $user = auth()->user();
        if ($user->role !== 'admin' && $user->role !== 'hr') {
            abort(403, 'Only admins and HR can delete evaluations.');
        }

        $evaluation->delete();

        return redirect()->route('evaluations.index')->with('success', 'Evaluation deleted successfully.');
    }

    private function getEvaluationCriteria()
    {
        return [
            // Attitude
            'Service Quality',
            'Communication Skills',
            'Cleanliness',
            'Teamwork',
            'Leadership',
            'Professional Behavior',
            'Work Under Pressure',
            
            // Responsibility
            'Attendance Punctuality',
            'Accuracy in Cash Handling',
            'Following Company Procedures',
            'Accountability for Transactions',
            'Work on Deadline',
            'Willingness to take more responsibility',
            'Open to feedback',
            
            // Competency
            'Creativity',
            'Speed & Efficiency at Checkout',
            'Accuracy in Transactions',
            'Product Knowledge',
            'Handling Customer Complaints',
            'Use of POS System',
            'Productivity',
            'Initiative',
            'Effective Problem Solving',
        ];
    }
}
