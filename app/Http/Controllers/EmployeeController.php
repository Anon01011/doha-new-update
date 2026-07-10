<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Company;
use App\Models\Department;
use App\Http\Requests\EmployeeRequest;
use Illuminate\Support\Str;
use App\Models\DocumentType;
use App\Models\EmployeeDocument;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $status = $request->query('status');
        $search = $request->query('search');
        $query = Employee::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('employee_code', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%")
                    ->orWhere('designation', 'like', "%{$search}%");
            });
        }

        // Calculate stats before applying status filter
        $statsQuery = clone $query;
        $stats = [
            'total' => $statsQuery->count(),
            'active' => (clone $statsQuery)->active()->count(),
            'waiting' => (clone $statsQuery)->where('manual_status', 'waiting')->count(),
            'departments' => Department::count(),
            'this_month' => (clone $statsQuery)->whereMonth('joined_date', now()->month)
                ->whereYear('joined_date', now()->year)
                ->count(),
        ];

        if ($status === 'active') {
            $query->active();
        } elseif ($status === 'inactive') {
            $query->inactive();
        } elseif ($status === 'waiting') {
            $query->where('manual_status', 'waiting');
        }

        if ($request->has('department_id') && $request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        $employees = $query->with(['department', 'company', 'user.roles'])
            ->latest()
            ->paginate(50)
            ->withQueryString();

        $companies = Company::orderBy('name')->get(['id', 'name']);
        $departments = Department::orderBy('name')->get(['id', 'name', 'company_id']);

        return Inertia::render('Employee/Index', [
            'employees' => $employees,
            'status' => $status,
            'search' => $search,
            'stats' => $stats,
            'companies' => $companies,
            'departments' => $departments,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('create-employees')) {
            abort(403, 'Unauthorized. You do not have permission to create employees.');
        }

        $companies = Company::orderBy('name')->get(['id', 'name']);
        $departments = Department::orderBy('name')->get(['id', 'name']);
        $salaryComponents = \App\Models\SalaryComponent::where('is_active', true)->get();
        $availableRoles = Role::where('is_active', true)->get(['id', 'name', 'slug']);

        return Inertia::render('Employee/Create', [
            'companies' => $companies,
            'departments' => $departments,
            'salaryComponents' => $salaryComponents,
            'availableRoles' => $availableRoles,
            'constants' => $this->getConstants(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(EmployeeRequest $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('create-employees')) {
            abort(403, 'Unauthorized. You do not have permission to create employees.');
        }

        $validated = $request->validated();
        \Log::info('Employee store request payload:', $request->all());
        \Log::info('Employee store validated payload:', $validated);

        // Multi-tenancy check: Force company_id for non-admins
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            $validated['company_id'] = $user->employee->company_id;
        }

        // Auto-generate employee code if not provided
        if (empty($validated['employee_code'])) {
            $companyId = $validated['company_id'] ?? null;
            $validated['employee_code'] = Employee::generateCode($companyId);
        }

        // Handle file upload if present
        if ($request->hasFile('employee_image')) {
            $path = $request->file('employee_image')->store('employee-images', 'public');
            $validated['employee_image'] = $path;
        }

        if ($request->hasFile('agreement_doc')) {
            $path = $request->file('agreement_doc')->store('employee-docs', 'public');
            $validated['agreement_doc'] = $path;
        }

        if ($request->hasFile('resume_doc')) {
            $path = $request->file('resume_doc')->store('employee-docs', 'public');
            $validated['resume_doc'] = $path;
        }

        if ($request->hasFile('other_docs')) {
            $path = $request->file('other_docs')->store('employee-docs', 'public');
            $validated['other_docs'] = $path;
        }

        if ($request->hasFile('passport_file')) {
            $path = $request->file('passport_file')->store('employee-docs', 'public');
            $validated['passport_file_path'] = $path;
        }

        if ($request->hasFile('qid_file')) {
            $path = $request->file('qid_file')->store('employee-docs', 'public');
            $validated['qid_file_path'] = $path;
        }

        if ($request->hasFile('food_handler_file')) {
            $path = $request->file('food_handler_file')->store('employee-docs', 'public');
            $validated['food_handler_file_path'] = $path;
        }





        DB::beginTransaction();
        try {
            // Auto-update status based on exit status
            if (in_array($validated['exit_status'] ?? '', ['Abscond', 'Terminated', 'Resigned', 'End of Contract'])) {
                $validated['manual_status'] = 'inactive';
            }

            $employee = Employee::create($validated);

            // Sync Salary Structures
            if (isset($validated['salary_structures'])) {
                foreach ($validated['salary_structures'] as $struct) {
                    if (!empty($struct['component_id'])) {
                        $employee->salaryStructures()->create([
                            'component_id' => $struct['component_id'],
                            'amount' => $struct['amount'] ?? 0,
                            'effective_from' => now(),
                        ]);
                    }
                }
            }

            // Sync Weekly Offs
            if (isset($validated['weekly_offs'])) {
                foreach ($validated['weekly_offs'] as $off) {
                    if (!empty($off['weekly_off_day']) && !empty($off['effective_date'])) {
                        $employee->weeklyOffs()->create([
                            'weekly_off_day' => $off['weekly_off_day'],
                            'effective_date' => $off['effective_date'],
                        ]);
                    }
                }
            }

            // Handle Passport Document Creation
            if (isset($validated['passport_file_path'])) {
                $this->createIdentityDocument($employee, 'Passport', $validated['passport_file_path'], $validated['passport_expiry_date'] ?? null);
            }

            // Handle QID Document Creation
            if (isset($validated['qid_file_path'])) {
                $this->createIdentityDocument($employee, 'QID', $validated['qid_file_path'], $validated['qid_expiry_date'] ?? null);
            }

            // Handle Food Handler Document Creation
            if (isset($validated['food_handler_file_path'])) {
                $this->createIdentityDocument($employee, 'Food Handler', $validated['food_handler_file_path'], $validated['food_handler_expiry_date'] ?? null);
            }

            // Create or Sync User and Role if role is provided
            if (!empty($validated['role'])) {
                if (empty($employee->email)) {
                    throw new \Exception('Email is required when assigning a system role.');
                }

                $employeeUser = User::where('email', $employee->email)->first();
                if (!$employeeUser) {
                    $employeeUser = User::create([
                        'name' => $employee->name,
                        'email' => $employee->email,
                        'password' => \Illuminate\Support\Facades\Hash::make('password123'), // Default password
                        'role' => $validated['role'], // Legacy role field
                        'employee_id' => $employee->id,
                        'company_id' => $employee->company_id,
                    ]);
                } else {
                    $employeeUser->update([
                        'employee_id' => $employee->id,
                        'role' => $validated['role'],
                        'company_id' => $employee->company_id,
                    ]);
                }

                $role = Role::where('slug', $validated['role'])->first();
                if ($role) {
                    $employeeUser->roles()->sync([$role->id]);
                }
            }

            // Sync image to user if created
            if ($employee->employee_image && $employee->user) {
                $employee->user->update(['image' => $employee->employee_image]);
            }

            DB::commit();
            \Log::info('Employee created successfully:', ['id' => $employee->id, 'name' => $employee->name]);

            return redirect()->route('employees.index')->with('success', 'Employee created successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating employee:', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Failed to create employee: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Employee $employee)
    {
        $user = auth()->user();

        // Multi-tenancy check: BelongsToCompany handles global filtering.
        // We only need to check if an employee is trying to see someone else's record.
        if ($user->role === 'employee' && $user->employee_id !== $employee->id) {
            abort(403, 'Unauthorized access.');
        }

        $employee->load(['company', 'department', 'salaryStructures.component', 'user.roles', 'evaluations.evaluator', 'weeklyOffs']);

        // Handle department - it can be either a string or a relationship
        $departmentName = null;
        if (is_string($employee->department)) {
            $departmentName = $employee->department;
        } elseif (is_object($employee->department) && isset($employee->department->name)) {
            $departmentName = $employee->department->name;
        }

        return Inertia::render('Employee/Show', [
            'employee' => array_merge($employee->toArray(), [
                'company_name' => $employee->company ? $employee->company->name : null,
                'department_name' => $departmentName,
                'role_name' => $employee->user && $employee->user->roles->first() ? $employee->user->roles->first()->name : null,
                'role_slug' => $employee->user && $employee->user->roles->first() ? $employee->user->roles->first()->slug : null,
            ]),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Employee $employee)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('edit-employees')) {
            abort(403, 'Unauthorized. You do not have permission to edit employees.');
        }

        $employee->load(['salaryStructures.component', 'weeklyOffs']);
        $companies = Company::orderBy('name')->get(['id', 'name']);
        $departments = Department::orderBy('name')->get(['id', 'name']);
        $salaryComponents = \App\Models\SalaryComponent::where('is_active', true)->get();
        $availableRoles = Role::where('is_active', true)->get(['id', 'name', 'slug']);

        return Inertia::render('Employee/Edit', [
            'employee' => $employee,
            'companies' => $companies,
            'departments' => $departments,
            'salaryComponents' => $salaryComponents,
            'availableRoles' => $availableRoles,
            'employee_role' => $employee->user && $employee->user->roles->first() ? $employee->user->roles->first()->slug : null,
            'constants' => $this->getConstants(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(EmployeeRequest $request, Employee $employee)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('edit-employees')) {
            abort(403, 'Unauthorized. You do not have permission to edit employees.');
        }

        $validated = $request->validated();
        \Log::info('Employee update request payload:', $request->all());
        \Log::info('Employee update validated payload:', $validated);

        // Role-based field protection: Only Admin and HR can change company, department, or status
        if (!$user->isAdmin() && $user->role !== 'hr') {
            unset($validated['company_id'], $validated['department_id'], $validated['manual_status']);
        }

        // Remove file fields from validated data so they don't overwrite with null if not uploaded
        unset($validated['employee_image'], $validated['agreement_doc'], $validated['resume_doc'], $validated['other_docs'], $validated['passport_file'], $validated['qid_file'], $validated['food_handler_file']);

        // Handle file upload if present
        if ($request->hasFile('employee_image')) {
            $path = $request->file('employee_image')->store('employee-images', 'public');
            $validated['employee_image'] = $path;
        }

        if ($request->hasFile('agreement_doc')) {
            $path = $request->file('agreement_doc')->store('employee-docs', 'public');
            $validated['agreement_doc'] = $path;
        }

        if ($request->hasFile('resume_doc')) {
            $path = $request->file('resume_doc')->store('employee-docs', 'public');
            $validated['resume_doc'] = $path;
        }

        if ($request->hasFile('other_docs')) {
            $path = $request->file('other_docs')->store('employee-docs', 'public');
            $validated['other_docs'] = $path;
        }

        if ($request->hasFile('passport_file')) {
            $path = $request->file('passport_file')->store('employee-docs', 'public');
            $validated['passport_file_path'] = $path;
        }

        if ($request->hasFile('qid_file')) {
            $path = $request->file('qid_file')->store('employee-docs', 'public');
            $validated['qid_file_path'] = $path;
        }

        if ($request->hasFile('food_handler_file')) {
            $path = $request->file('food_handler_file')->store('employee-docs', 'public');
            $validated['food_handler_file_path'] = $path;
        }



        // Auto-update status based on exit status
        if (in_array($validated['exit_status'] ?? '', ['Abscond', 'Terminated', 'Resigned', 'End of Contract'])) {
            $validated['manual_status'] = 'inactive';
        }

        $employee->update($validated);

        // Sync Salary Structures
        if (isset($validated['salary_structures'])) {
            $employee->salaryStructures()->delete();
            foreach ($validated['salary_structures'] as $struct) {
                if (!empty($struct['component_id'])) {
                    $employee->salaryStructures()->create([
                        'component_id' => $struct['component_id'],
                        'amount' => $struct['amount'] ?? 0,
                        'value_type' => $struct['value_type'] ?? 'flat',
                        'effective_from' => now(),
                    ]);
                }
            }
        }

        // Sync Weekly Offs
        if (isset($validated['weekly_offs'])) {
            $employee->weeklyOffs()->delete();
            foreach ($validated['weekly_offs'] as $off) {
                if (!empty($off['weekly_off_day']) && !empty($off['effective_date'])) {
                    $employee->weeklyOffs()->create([
                        'weekly_off_day' => $off['weekly_off_day'],
                        'effective_date' => $off['effective_date'],
                    ]);
                }
            }
        }

        // Handle Passport Document Creation (only if new file uploaded)
        if (isset($validated['passport_file_path'])) {
            $this->createIdentityDocument($employee, 'Passport', $validated['passport_file_path'], $validated['passport_expiry_date'] ?? null);
        }

        // Handle QID Document Creation (only if new file uploaded)
        if (isset($validated['qid_file_path'])) {
            $this->createIdentityDocument($employee, 'QID', $validated['qid_file_path'], $validated['qid_expiry_date'] ?? null);
        }

        // Handle Food Handler Document Creation (only if new file uploaded)
        if (isset($validated['food_handler_file_path'])) {
            $this->createIdentityDocument($employee, 'Food Handler', $validated['food_handler_file_path'], $validated['food_handler_expiry_date'] ?? null);
        }

        // Create or Sync User and Role if role is provided
        if (!empty($validated['role'])) {
            if (empty($employee->email)) {
                return back()->withErrors(['role' => 'Email is required when assigning a system role.']);
            }

            $employeeUser = $employee->user ?: User::where('email', $employee->email)->first();

            if (!$employeeUser) {
                $employeeUser = User::create([
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'password' => \Illuminate\Support\Facades\Hash::make('password123'),
                    'role' => $validated['role'],
                    'employee_id' => $employee->id,
                    'company_id' => $employee->company_id,
                ]);
            } else {
                $employeeUser->update([
                    'employee_id' => $employee->id,
                    'role' => $validated['role'],
                    'email' => $employee->email, // Ensure email stays in sync if changed
                    'company_id' => $employee->company_id,
                ]);
            }

            if (!empty($validated['password'])) {
                $employeeUser->update([
                    'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
                ]);
            }

            $role = Role::where('slug', $validated['role'])->first();
            if ($role) {
                $employeeUser->roles()->sync([$role->id]);
            }
        } elseif ($employee->user) {
            // If role is set to empty, should we remove it? 
            // Usually, "No System Role" means the user account might still exist but have no roles.
            $employee->user->roles()->detach();
            $employee->user->update(['role' => null]);
        }

        if ($employee->employee_image && $employee->user) {
            $employee->user->update(['image' => $employee->employee_image]);
        }

        return redirect()->route('employees.show', $employee)->with('success', 'Employee updated successfully!');
    }

    /**
     * Approve a waiting employee.
     */
    public function approve(Employee $employee)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('edit-employees')) {
            abort(403, 'Unauthorized. You do not have permission to approve employees.');
        }

        try {
            $employee->update(['manual_status' => 'active']);
            \Log::info('Employee approved:', ['id' => $employee->id, 'name' => $employee->name, 'approved_by' => $user->id]);
            return back()->with('success', 'Employee approved successfully!');
        } catch (\Exception $e) {
            \Log::error('Error approving employee:', ['error' => $e->getMessage()]);
            return back()->with('error', 'Failed to approve employee: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Employee $employee)
    {
        // Only admin can delete employees
        $user = auth()->user();
        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized. Only admin can delete employees.');
        }

        try {
            $employee->delete();
            return redirect()->route('employees.index')->with('success', 'Employee deleted successfully!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete employee: ' . $e->getMessage()]);
        }
    }

    /**
     * Return employees for a given company_id as JSON (for AJAX)
     */
    public function getByCompany(Request $request)
    {
        $companyId = $request->input('company_id');
        $user = auth()->user();

        // Multi-tenancy scoping: If user is scoped to a branch (and not admin), they can only fetch from their branch
        if (!$user->isAdmin() && $user && $user->employee_id) {
            $companyId = $user->employee->company_id;
        }

        if (!$companyId) {
            return response()->json(['employees' => []]);
        }
        $employees = Employee::where('company_id', $companyId)->orderBy('name')->get();
        return response()->json(['employees' => $employees]);
    }

    /**
     * Return employees for a given department_id as JSON (for AJAX)
     */
    public function getByDepartment(Request $request)
    {
        $departmentId = $request->input('department_id');
        if (!$departmentId) {
            return response()->json(['employees' => []]);
        }
        $employees = Employee::where('department_id', $departmentId)
            ->active()
            ->orderBy('name')
            ->get(['id', 'name']);
        return response()->json(['employees' => $employees]);
    }

    private function getConstants()
    {
        // Fetch dynamic options
        $options = \App\Models\DropdownOption::where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->groupBy('category')
            ->map(function ($group) {
                return $group->pluck('value');
            });

        return [
            'genders' => $options['Gender'] ?? [],
            'visa_types' => $options['Visa Type'] ?? [],
            'visa_designations' => $options['Visa Designation'] ?? [],
            'employee_categories' => $options['Employee Category'] ?? [],
            'contract_durations' => $options['Contract Duration'] ?? [],
            'exit_statuses' => $options['Exit Status'] ?? [],
            'payment_types' => $options['Payment Type'] ?? [],
            'leave_statuses' => $options['Leave Status'] ?? [],
            'shifts' => $options['Shift'] ?? [],
        ];
    }



    private function createIdentityDocument($employee, $type, $path, $expiryDate)
    {
        $docType = DocumentType::where('name', $type)->first();
        if ($docType) {
            EmployeeDocument::create([
                'employee_id' => $employee->id,
                'document_type_id' => $docType->id,
                'document_name' => $type . ' - ' . ($employee->name),
                'file_path' => $path,
                'file_type' => pathinfo($path, PATHINFO_EXTENSION),
                'file_size' => Storage::disk('public')->size($path),
                'expiry_date' => $expiryDate,
                'uploaded_by' => auth()->id(),
            ]);
        }
    }

    public function bulkTransfer(Request $request)
    {
        // Only admin and HR can transfer employees
        $user = auth()->user();
        if (!in_array($user->role, ['admin', 'hr'])) {
            abort(403, 'Unauthorized. Only admin and HR can transfer employees.');
        }

        $validated = $request->validate([
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'exists:employees,id',
            'company_id' => 'required|exists:companies,id',
            'department_id' => 'required|exists:departments,id',
        ]);

        try {
            // Multi-tenancy check for target company
            if (!$user->isAdmin() && $user->employee_id && $validated['company_id'] != $user->employee->company_id) {
                abort(403, 'Unauthorized. You can only transfer employees within your own branch.');
            }

            // Verify all employees being transferred belong to the user's branch
            if (!$user->isAdmin() && $user->employee_id) {
                $unauthorizedCount = Employee::whereIn('id', $validated['employee_ids'])
                    ->where('company_id', '!=', $user->employee->company_id)
                    ->count();
                if ($unauthorizedCount > 0) {
                    abort(403, 'Unauthorized. One or more selected employees belong to another branch.');
                }
            }

            // Verify department belongs to company
            $department = Department::where('id', $validated['department_id'])
                ->where('company_id', $validated['company_id'])
                ->first();

            if (!$department) {
                return back()->withErrors(['department_id' => 'The selected department does not belong to the selected branch.']);
            }

            Employee::whereIn('id', $validated['employee_ids'])->update([
                'company_id' => $validated['company_id'],
                'department_id' => $validated['department_id'],
            ]);

            // Transfer future shift rosters to the new company
            \App\Models\ShiftRoster::whereIn('employee_id', $validated['employee_ids'])
                ->where('week_start', '>=', now()->startOfWeek()->toDateString())
                ->update(['company_id' => $validated['company_id']]);

            return back()->with('success', count($validated['employee_ids']) . ' employees transferred successfully.');
        } catch (\Exception $e) {
            \Log::error('Error generating bulk transfer:', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Failed to transfer employees: ' . $e->getMessage()]);
        }
    }
}
