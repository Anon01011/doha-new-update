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

        // Restrict access: page is only visible for Admin or users who possess the approve-salary-modifications permission (or branch HR)
        if (!$user->isAdmin() && !$user->hasPermission('approve-salary-modifications') && !$user->isHR()) {
            abort(403, 'Unauthorized access to salary modification requests. Requires the approve-salary-modifications permission.');
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

        $userAssignedCompanies = $user->isAdmin() ? collect() : $user->getAssignedCompanyIds();
        $hasApprovePerm = $user->hasPermission('approve-salary-modifications', false);

        $requests->getCollection()->transform(function ($req) use ($user, $userAssignedCompanies, $hasApprovePerm) {
            $hasBranchAccess = (
                $user->company_id == $req->company_id ||
                $userAssignedCompanies->contains((int)$req->company_id)
            );
            $isBranchHR = !$user->isAdmin() && $user->isHR() && $hasBranchAccess;
            $isRequester = $req->requested_by === $user->id;

            $canApprove = false;
            $disabledReason = null;

            if ($req->status === 'pending') {
                if ($isRequester) {
                    $disabledReason = 'You submitted this request. Approval must be performed by the Branch HR.';
                } elseif ($user->isAdmin() && !$hasApprovePerm) {
                    $disabledReason = 'Admin account lacks "Approve Salary Modifications" permission.';
                } elseif ($user->isAdmin()) {
                    $disabledReason = 'Only the assigned Branch HR for this branch can approve.';
                    // Admins are always blocked — they initiate requests, Branch HR approves
                    $disabledReason = 'Only the assigned Branch HR for this branch can approve salary modifications. Admin edits are queued for Branch HR approval.';
                } elseif (!$hasBranchAccess) {
                    $disabledReason = 'Only the Branch HR for this branch can approve.';
                } elseif (!$isBranchHR && !$hasApprovePerm) {
                    $disabledReason = 'Role lacks "Approve Salary Modifications" permission.';
                } else {
                    // isBranchHR  OR  (has approve perm + branch access)
                    $canApprove = true;
                }
            }

            $req->can_approve = $canApprove;
            $req->disabled_reason = $disabledReason;
            return $req;
        });

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
            'canApprove' => !$user->isAdmin() && ($user->isHR() || $user->hasPermission('approve-salary-modifications', false)),
        ]);
    }

    /**
     * Approve a salary modification request.
     */
    public function approve(Request $request, $id)
    {
        $user = auth()->user();
        $salaryRequest = SalaryModificationRequest::findOrFail($id);

        // Requester cannot approve their own request
        if ($salaryRequest->requested_by === $user->id) {
            abort(403, 'Unauthorized. You cannot approve your own salary modification request. Approval must be performed by the Branch HR.');
        }

        // Authorization check: only authorized Branch HR for this employee's branch can approve
        $hasBranchAccess = (
            $user->company_id == $salaryRequest->company_id ||
            $user->getAssignedCompanyIds()->contains((int)$salaryRequest->company_id)
        );
        $isBranchHR = !$user->isAdmin() && $user->isHR() && $hasBranchAccess;
        $canApprove = $isBranchHR || (!$user->isAdmin() && $hasBranchAccess && $user->hasPermission('approve-salary-modifications'));

        if (!$canApprove) {
            abort(403, 'Unauthorized. Only Branch HR for this employee\'s branch can approve this salary modification.');
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

        if ($salaryRequest->requested_by === $user->id) {
            abort(403, 'Unauthorized. You cannot reject your own salary modification request. Action must be performed by the Branch HR.');
        }

        $hasBranchAccess = (
            $user->company_id == $salaryRequest->company_id ||
            $user->getAssignedCompanyIds()->contains((int)$salaryRequest->company_id)
        );
        $isBranchHR = !$user->isAdmin() && $user->isHR() && $hasBranchAccess;
        $canApprove = $isBranchHR || (!$user->isAdmin() && $hasBranchAccess && $user->hasPermission('approve-salary-modifications'));

        if (!$canApprove) {
            abort(403, 'Unauthorized. Only Branch HR for this employee\'s branch can reject this salary modification.');
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

