<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Employee;
use App\Models\SalaryModificationRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalaryModificationController extends Controller
{
    /**
     * Display a listing of salary modification requests.
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        // Must have permission to view/approve salary or view salary postings
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('approve-salary-modifications') && !$user->hasPermission('view-employee-salary')) {
            abort(403, 'Unauthorized access to salary modification requests.');
        }

        $status = $request->input('status', 'pending');
        $companyId = $request->input('company_id');

        $query = SalaryModificationRequest::with([
            'employee:id,name,employee_code,company_id,designation,employee_image',
            'employee.company:id,name',
            'company:id,name',
            'requester:id,name,role',
            'reviewer:id,name',
        ])->latest();

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        // Branch scoping for non-admins
        if (!$user->isAdmin()) {
            $assignedCompanies = $user->getAssignedCompanyIds();
            if ($assignedCompanies->isNotEmpty()) {
                $query->whereIn('company_id', $assignedCompanies);
            } elseif ($user->company_id) {
                $query->where('company_id', $user->company_id);
            }
        } elseif ($companyId) {
            $query->where('company_id', $companyId);
        }

        $requests = $query->paginate(15)->withQueryString();

        $companies = Company::orderBy('name')->get(['id', 'name']);

        $pendingCountQuery = SalaryModificationRequest::where('status', 'pending');
        if (!$user->isAdmin()) {
            $assignedCompanies = $user->getAssignedCompanyIds();
            if ($assignedCompanies->isNotEmpty()) {
                $pendingCountQuery->whereIn('company_id', $assignedCompanies);
            } elseif ($user->company_id) {
                $pendingCountQuery->where('company_id', $user->company_id);
            }
        }
        $pendingCount = $pendingCountQuery->count();

        return Inertia::render('Employee/SalaryModifications/Index', [
            'requests' => $requests,
            'filters' => [
                'status' => $status,
                'company_id' => $companyId,
            ],
            'companies' => $companies,
            'pendingCount' => $pendingCount,
            'canApprove' => $user->isAdmin() || $user->isHR() || $user->hasPermission('approve-salary-modifications'),
        ]);
    }

    /**
     * Approve a salary modification request.
     */
    public function approve(Request $request, $id)
    {
        $user = auth()->user();
        $salaryRequest = SalaryModificationRequest::findOrFail($id);

        // Authorization check: must be Admin or authorized HR/approver for this employee's branch
        if (!$user->isAdmin()) {
            $hasBranchAccess = (
                $user->company_id == $salaryRequest->company_id ||
                $user->getAssignedCompanyIds()->contains((int)$salaryRequest->company_id)
            );
            $canApprove = ($user->isHR() || $user->hasPermission('approve-salary-modifications')) && $hasBranchAccess;

            if (!$canApprove) {
                abort(403, 'Unauthorized. Only Branch HR or Admin can approve this salary modification.');
            }
        }

        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $salaryRequest->applyApproval($user, $validated['notes'] ?? null);

            return back()->with('success', "Salary modification for {$salaryRequest->employee?->name} approved and applied successfully.");
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to approve request: ' . $e->getMessage());
        }
    }

    /**
     * Reject a salary modification request.
     */
    public function reject(Request $request, $id)
    {
        $user = auth()->user();
        $salaryRequest = SalaryModificationRequest::findOrFail($id);

        if (!$user->isAdmin()) {
            $hasBranchAccess = (
                $user->company_id == $salaryRequest->company_id ||
                $user->getAssignedCompanyIds()->contains((int)$salaryRequest->company_id)
            );
            $canApprove = ($user->isHR() || $user->hasPermission('approve-salary-modifications')) && $hasBranchAccess;

            if (!$canApprove) {
                abort(403, 'Unauthorized. Only Branch HR or Admin can reject this salary modification.');
            }
        }

        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $salaryRequest->applyRejection($user, $validated['notes'] ?? null);

            return back()->with('success', "Salary modification for {$salaryRequest->employee?->name} rejected.");
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to reject request: ' . $e->getMessage());
        }
    }
}

