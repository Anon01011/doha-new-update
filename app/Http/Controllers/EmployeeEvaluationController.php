<?php

namespace App\Http\Controllers;

use App\Models\EmployeeEvaluation;
use App\Models\Employee;
use App\Models\Company;
use App\Models\Department;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeEvaluationController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        if (!$user->isEmployee() && !$user->isAdmin() && !$user->hasPermission('view-evaluations')) {
            abort(403, 'Unauthorized.');
        }

        $query = EmployeeEvaluation::with(['employee.company', 'employee.department', 'evaluator', 'approver']);

        if ($user->isEmployee()) {
            $query->where('employee_id', $user->employee_id);
        } elseif (!$user->isAdmin() && !$user->isHR() && $user->employee_id && $user->employee) {
            $query->where('company_id', $user->employee->company_id);
        }

        if ($request->filled('company_id') && ($user->isAdmin() || $user->isHR())) {
            $query->where('company_id', $request->input('company_id'));
        }

        if ($request->filled('department_id')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('department_id', $request->input('department_id'));
            });
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('employee_code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'approved') {
                $query->where('status', 'approved');
            } elseif ($status === 'pending') {
                $query->whereIn('status', ['draft', 'self_assessment', 'manager_review', 'calibration']);
            } elseif ($status === 'pip') {
                $query->where('pip_required', true);
            } else {
                $query->where('status', $status);
            }
        }

        if ($request->filled('cycle_type')) {
            $query->where('cycle_type', $request->input('cycle_type'));
        }

        if ($request->filled('year')) {
            $query->where('year', $request->input('year'));
        }

        $summary = [
            'total' => (clone $query)->count(),
            'approved' => (clone $query)->where('status', 'approved')->count(),
            'pending_self' => (clone $query)->where('status', 'self_assessment')->count(),
            'pending_manager' => (clone $query)->where('status', 'manager_review')->count(),
            'pip_count' => (clone $query)->where('pip_required', true)->count(),
            'avg_score' => round((clone $query)->avg('overall_score') ?: 0, 1),
        ];

        $evaluations = $query->latest()->paginate(10)->withQueryString();
        $companies = ($user->isAdmin() || $user->isHR()) ? Company::orderBy('name')->get(['id', 'name']) : collect();
        $departments = Department::orderBy('name')->get(['id', 'name', 'company_id']);

        return Inertia::render('Evaluation/Index', [
            'evaluations' => $evaluations,
            'summary' => $summary,
            'companies' => $companies,
            'departments' => $departments,
            'filters' => $request->only(['search', 'status', 'cycle_type', 'year', 'company_id', 'department_id']),
            'userRole' => $user->role,
            'userEmployeeId' => $user->employee_id,
        ]);
    }

    public function show(EmployeeEvaluation $evaluation)
    {
        $user = auth()->user();
        $evaluation->load(['employee.company', 'employee.department', 'evaluator', 'approver']);

        // Authorization
        if ($user->isEmployee() && $evaluation->employee_id !== $user->employee_id) {
            abort(403, 'Unauthorized.');
        }

        if (!$user->isEmployee() && !$user->isAdmin() && !$user->hasPermission('view-evaluations')) {
            abort(403, 'Unauthorized.');
        }

        // Branch isolation for managers
        if (!$user->isAdmin() && !$user->isHR() && $user->employee_id && $user->employee && !$user->isEmployee()) {
            if ($evaluation->company_id != $user->employee->company_id) {
                abort(403, 'Unauthorized.');
            }
        }

        // Load historical evaluations for employee trajectory
        $historicalEvaluations = EmployeeEvaluation::where('employee_id', $evaluation->employee_id)
            ->where('id', '!=', $evaluation->id)
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->take(5)
            ->get(['id', 'month', 'year', 'cycle_type', 'overall_score', 'status', 'increment_recommended', 'promotion_recommended']);

        return Inertia::render('Evaluation/Show', [
            'evaluation' => $evaluation,
            'historicalEvaluations' => $historicalEvaluations,
            'criteria' => $this->getEvaluationCriteria(),
            'userRole' => $user->role,
            'userEmployeeId' => $user->employee_id,
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('create-evaluations')) {
            abort(403, 'Unauthorized.');
        }

        $companyId = $user->employee ? $user->employee->company_id : null;
        $employeesQuery = Employee::query()->active();
        $compQuery = Company::orderBy('name');
        $deptQuery = Department::with('companies:id')->orderBy('name');

        if ($companyId) {
            $employeesQuery->where('company_id', $companyId);
            $compQuery->where('id', $companyId);
            $deptQuery->where(function ($q) use ($companyId) {
                $q->where('company_id', $companyId)
                  ->orWhereHas('companies', function ($sub) use ($companyId) {
                      $sub->where('companies.id', $companyId);
                  });
            });
        }

        $employees = $employeesQuery->get(['id', 'name', 'employee_code', 'employee_image', 'company_id', 'department_id', 'designation', 'basic_salary']);

        return Inertia::render('Evaluation/Create', [
            'employees' => $employees,
            'branches' => $compQuery->get(['id', 'name']),
            'departments' => $deptQuery->get(['departments.id', 'name', 'departments.company_id']),
            'criteria' => $this->getEvaluationCriteria(),
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('create-evaluations')) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required',
            'year' => 'required|integer',
            'cycle_type' => 'nullable|in:monthly,quarterly,half_yearly,annual,probation',
            'status' => 'nullable|in:draft,self_assessment,manager_review,calibration,acknowledged,approved',
            'criteria_scores' => 'nullable|array',
            'self_scores' => 'nullable|array',
            'self_comments' => 'nullable|string',
            'achievements' => 'nullable|string',
            'development_needs' => 'nullable|string',
            'goals' => 'nullable|array',
            'comments' => 'nullable|string',
            'increment_recommended' => 'nullable|numeric|min:0',
            'increment_percentage' => 'nullable|numeric|min:0|max:100',
            'promotion_recommended' => 'nullable|boolean',
            'recommended_designation' => 'nullable|string',
            'pip_required' => 'nullable|boolean',
            'pip_notes' => 'nullable|string',
            'training_recommended' => 'nullable|array',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);

        if (!$user->isAdmin() && !$user->isHR() && $user->employee_id && $user->employee) {
            if ($employee->company_id != $user->employee->company_id) {
                abort(403, 'Unauthorized access to another branch.');
            }
        }

        $monthValue = $validated['month'];
        if (is_string($monthValue) && !is_numeric($monthValue)) {
            $monthValue = date('n', strtotime($monthValue));
        }

        // Calculate score from criteria_scores if provided
        $overallScore = 0;
        if (!empty($validated['criteria_scores'])) {
            $scores = array_filter(array_values($validated['criteria_scores']));
            $average = count($scores) > 0 ? array_sum($scores) / count($scores) : 0;
            $overallScore = round(($average / 4) * 100, 2);
        }

        // Auto flag PIP if overall score is below 50%
        $pipRequired = $validated['pip_required'] ?? ($overallScore > 0 && $overallScore < 50);

        EmployeeEvaluation::create([
            'employee_id' => $validated['employee_id'],
            'evaluator_id' => $user->id,
            'company_id' => $employee->company_id,
            'month' => (int)$monthValue,
            'year' => $validated['year'],
            'cycle_type' => $validated['cycle_type'] ?? 'monthly',
            'status' => $validated['status'] ?? 'manager_review',
            'overall_score' => $overallScore,
            'criteria_scores' => $validated['criteria_scores'] ?? [],
            'self_scores' => $validated['self_scores'] ?? [],
            'self_comments' => $validated['self_comments'] ?? null,
            'achievements' => $validated['achievements'] ?? null,
            'development_needs' => $validated['development_needs'] ?? null,
            'goals' => $validated['goals'] ?? [],
            'comments' => $validated['comments'] ?? null,
            'increment_recommended' => $validated['increment_recommended'] ?? null,
            'increment_percentage' => $validated['increment_percentage'] ?? null,
            'promotion_recommended' => $validated['promotion_recommended'] ?? false,
            'recommended_designation' => $validated['recommended_designation'] ?? null,
            'pip_required' => $pipRequired,
            'pip_notes' => $validated['pip_notes'] ?? null,
            'training_recommended' => $validated['training_recommended'] ?? [],
        ]);

        return redirect()->route('evaluations.index')->with('success', 'Performance appraisal cycle initiated successfully.');
    }

    public function edit(EmployeeEvaluation $evaluation)
    {
        $user = auth()->user();
        $evaluation->load(['employee.company', 'employee.department', 'evaluator']);

        if ($evaluation->is_locked) {
            return redirect()->route('evaluations.show', $evaluation)->with('error', 'This appraisal is locked and cannot be edited.');
        }

        if ($user->isEmployee() && $evaluation->employee_id !== $user->employee_id) {
            abort(403, 'Unauthorized.');
        }

        $companyId = $user->employee ? $user->employee->company_id : null;
        $employeesQuery = Employee::query()->active();
        $compQuery = Company::orderBy('name');
        $deptQuery = Department::with('companies:id')->orderBy('name');

        if ($companyId) {
            $employeesQuery->where('company_id', $companyId);
            $compQuery->where('id', $companyId);
            $deptQuery->where(function ($q) use ($companyId) {
                $q->where('company_id', $companyId)
                  ->orWhereHas('companies', function ($sub) use ($companyId) {
                      $sub->where('companies.id', $companyId);
                  });
            });
        }

        $employees = $employeesQuery->get(['id', 'name', 'employee_code', 'employee_image', 'company_id', 'department_id', 'designation', 'basic_salary']);

        return Inertia::render('Evaluation/Edit', [
            'evaluation' => $evaluation,
            'employees' => $employees,
            'branches' => $compQuery->get(['id', 'name']),
            'departments' => $deptQuery->get(['departments.id', 'name', 'departments.company_id']),
            'criteria' => $this->getEvaluationCriteria(),
        ]);
    }

    public function update(Request $request, EmployeeEvaluation $evaluation)
    {
        $user = auth()->user();

        if ($evaluation->is_locked) {
            return redirect()->back()->with('error', 'This evaluation is finalized and locked.');
        }

        $validated = $request->validate([
            'criteria_scores' => 'nullable|array',
            'self_scores' => 'nullable|array',
            'self_comments' => 'nullable|string',
            'achievements' => 'nullable|string',
            'development_needs' => 'nullable|string',
            'goals' => 'nullable|array',
            'comments' => 'nullable|string',
            'increment_recommended' => 'nullable|numeric|min:0',
            'increment_percentage' => 'nullable|numeric|min:0|max:100',
            'promotion_recommended' => 'nullable|boolean',
            'recommended_designation' => 'nullable|string',
            'pip_required' => 'nullable|boolean',
            'pip_notes' => 'nullable|string',
            'training_recommended' => 'nullable|array',
            'status' => 'nullable|string',
        ]);

        $overallScore = $evaluation->overall_score;
        if (!empty($validated['criteria_scores'])) {
            $scores = array_filter(array_values($validated['criteria_scores']));
            $average = count($scores) > 0 ? array_sum($scores) / count($scores) : 0;
            $overallScore = round(($average / 4) * 100, 2);
        }

        $pipRequired = $validated['pip_required'] ?? ($overallScore > 0 && $overallScore < 50);

        $evaluation->update(array_merge($validated, [
            'overall_score' => $overallScore,
            'pip_required' => $pipRequired,
        ]));

        return redirect()->route('evaluations.show', $evaluation)->with('success', 'Performance evaluation updated successfully.');
    }

    /**
     * Submit Employee Self-Assessment (Step 15)
     */
    public function submitSelfAssessment(Request $request, EmployeeEvaluation $evaluation)
    {
        $user = auth()->user();
        if ($evaluation->employee_id !== $user->employee_id && !$user->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'self_scores' => 'required|array',
            'self_comments' => 'nullable|string',
            'achievements' => 'nullable|string',
            'development_needs' => 'nullable|string',
        ]);

        $evaluation->update([
            'self_scores' => $validated['self_scores'],
            'self_comments' => $validated['self_comments'] ?? null,
            'achievements' => $validated['achievements'] ?? null,
            'development_needs' => $validated['development_needs'] ?? null,
            'status' => 'manager_review',
        ]);

        return redirect()->back()->with('success', 'Self-assessment submitted successfully! Your manager will now review.');
    }

    /**
     * Employee Acknowledgment & Sign-off (Step 20)
     */
    public function acknowledge(Request $request, EmployeeEvaluation $evaluation)
    {
        $user = auth()->user();
        if ($evaluation->employee_id !== $user->employee_id && !$user->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'employee_acknowledgment_notes' => 'nullable|string',
        ]);

        $evaluation->update([
            'employee_acknowledged_at' => now(),
            'employee_acknowledgment_notes' => $validated['employee_acknowledgment_notes'] ?? null,
            'status' => 'acknowledged',
        ]);

        return redirect()->back()->with('success', 'Performance appraisal acknowledged and signed successfully.');
    }

    /**
     * Final Approval, Action Linkage & Locking (Steps 21 & 22)
     */
    public function approveAndClose(Request $request, EmployeeEvaluation $evaluation)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('create-evaluations')) {
            abort(403, 'Unauthorized. Only HR or Admin can approve and close appraisals.');
        }

        $applyIncrement = $request->boolean('apply_increment', true);
        $applyPromotion = $request->boolean('apply_promotion', true);

        // Execute Increment to Employee Basic Salary in INR if approved
        if ($applyIncrement && ($evaluation->increment_recommended > 0 || $evaluation->increment_percentage > 0)) {
            $employee = $evaluation->employee;
            if ($employee) {
                $currentBasic = (float)$employee->basic_salary;
                $incrementAmt = $evaluation->increment_recommended ?: ($currentBasic * ($evaluation->increment_percentage / 100));
                $newBasic = $currentBasic + $incrementAmt;

                $employee->update([
                    'basic_salary' => round($newBasic, 2),
                ]);
            }
        }

        // Execute Promotion to new designation if approved
        if ($applyPromotion && $evaluation->promotion_recommended && $evaluation->recommended_designation) {
            $employee = $evaluation->employee;
            if ($employee) {
                $employee->update([
                    'designation' => $evaluation->recommended_designation,
                ]);
            }
        }

        $evaluation->update([
            'status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
            'is_locked' => true,
        ]);

        return redirect()->back()->with('success', 'Performance appraisal approved, outcomes linked, and record locked.');
    }

    public function destroy(EmployeeEvaluation $evaluation)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('create-evaluations')) {
            abort(403, 'Unauthorized.');
        }

        if ($evaluation->is_locked) {
            return redirect()->back()->with('error', 'Cannot delete a finalized, locked appraisal.');
        }

        $evaluation->delete();
        return redirect()->route('evaluations.index')->with('success', 'Evaluation record deleted successfully.');
    }

    private function getEvaluationCriteria()
    {
        return [
            // Attitude & Professionalism
            'Service Quality',
            'Communication Skills',
            'Cleanliness',
            'Teamwork',
            'Leadership',
            'Professional Behavior',
            'Work Under Pressure',

            // Responsibility & Compliance
            'Attendance Punctuality',
            'Accuracy in Cash Handling',
            'Following Company Procedures',
            'Accountability for Transactions',
            'Work on Deadline',
            'Willingness to take more responsibility',
            'Open to feedback',

            // Competency & Technical Skills
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
