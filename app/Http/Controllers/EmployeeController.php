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
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('view-employees')) {
            abort(403, 'Unauthorized. You do not have permission to view employees.');
        }

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
        $deptCountQuery = Department::query();
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            $companyId = $user->employee->company_id;
            $deptCountQuery->whereHas('companies', function ($q) use ($companyId) {
                $q->where('companies.id', $companyId);
            });
        }
        $stats = [
            'total' => $statsQuery->count(),
            'active' => (clone $statsQuery)->active()->count(),
            'waiting' => (clone $statsQuery)->where('manual_status', 'waiting')->count(),
            'departments' => $deptCountQuery->count(),
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
        // Branch-scope departments for non-admin users
        $departmentsQuery = Department::with('companies:id')->orderBy('name');
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            $companyId = $user->employee->company_id;
            $departmentsQuery->whereHas('companies', function ($q) use ($companyId) {
                $q->where('companies.id', $companyId);
            });
        }
        $departments = $departmentsQuery->get(['departments.id', 'name', 'departments.company_id']);

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
        // Branch-scope departments
        $departmentsQuery = Department::orderBy('name');
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            $companyId = $user->employee->company_id;
            $departmentsQuery->whereHas('companies', function ($q) use ($companyId) {
                $q->where('companies.id', $companyId);
            });
        }
        $departments = $departmentsQuery->get(['departments.id', 'name']);
        $salaryComponents = \App\Models\SalaryComponent::where('is_active', true)->get();
        $availableRoles = Role::where('is_active', true)->get(['id', 'name', 'slug']);

        return Inertia::render('Employee/Create', [
            'companies' => $companies,
            'departments' => $departments,
            'salaryComponents' => $salaryComponents,
            'availableRoles' => $availableRoles,
            'leadershipEmployees' => $this->getLeadershipEmployees(),
            'managerEmployees' => $this->getManagerAndHrEmployees(),
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

        // Multi-tenancy check: Force company_id for non-admins
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            $validated['company_id'] = $user->employee->company_id;
        }

        // Convert empty string unique fields to null
        foreach (['mobile', 'email', 'qid_number', 'passport_number', 'health_card_number'] as $field) {
            if (array_key_exists($field, $validated) && ($validated[$field] === '' || $validated[$field] === null)) {
                $validated[$field] = null;
            }
        }

        // Auto-generate employee code if not provided
        if (empty($validated['employee_code'])) {
            $companyId = $validated['company_id'] ?? null;
            $validated['employee_code'] = Employee::generateCode($companyId);
        }

        $newUploadedFiles = [];

        // Handle file upload if present
        if ($request->hasFile('employee_image')) {
            $path = $request->file('employee_image')->store('employee-images', 'public');
            $validated['employee_image'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('agreement_doc')) {
            $path = $request->file('agreement_doc')->store('employee-docs', 'public');
            $validated['agreement_doc'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('resume_doc')) {
            $path = $request->file('resume_doc')->store('employee-docs', 'public');
            $validated['resume_doc'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('other_docs')) {
            $path = $request->file('other_docs')->store('employee-docs', 'public');
            $validated['other_docs'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('passport_file')) {
            $path = $request->file('passport_file')->store('employee-docs', 'public');
            $validated['passport_file_path'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('qid_file')) {
            $path = $request->file('qid_file')->store('employee-docs', 'public');
            $validated['qid_file_path'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('food_handler_file')) {
            $path = $request->file('food_handler_file')->store('employee-docs', 'public');
            $validated['food_handler_file_path'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('aadhar_file')) {
            $path = $request->file('aadhar_file')->store('employee-docs', 'public');
            $validated['aadhar_file_path'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('pan_file')) {
            $path = $request->file('pan_file')->store('employee-docs', 'public');
            $validated['pan_file_path'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('education_doc')) {
            $path = $request->file('education_doc')->store('employee-docs', 'public');
            $validated['education_doc_path'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('relieving_doc')) {
            $path = $request->file('relieving_doc')->store('employee-docs', 'public');
            $validated['relieving_doc_path'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('bank_doc')) {
            $path = $request->file('bank_doc')->store('employee-docs', 'public');
            $validated['bank_doc_path'] = $path;
            $newUploadedFiles[] = $path;
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
                $this->createIdentityDocument($employee, 'Passport', $validated['passport_file_path'], $validated['passport_expiry_date'] ?? null, 'Identity');
            }

            // Handle QID Document Creation
            if (isset($validated['qid_file_path'])) {
                $this->createIdentityDocument($employee, 'QID', $validated['qid_file_path'], $validated['qid_expiry_date'] ?? null, 'Identity');
            }

            // Handle Food Handler Document Creation
            if (isset($validated['food_handler_file_path'])) {
                $this->createIdentityDocument($employee, 'Food Handler', $validated['food_handler_file_path'], $validated['food_handler_expiry_date'] ?? null, 'Medical');
            }

            // Handle Aadhar Document Creation
            if (isset($validated['aadhar_file_path'])) {
                $this->createIdentityDocument($employee, 'Aadhar Card', $validated['aadhar_file_path'], null, 'Identity');
            }

            // Handle PAN Document Creation
            if (isset($validated['pan_file_path'])) {
                $this->createIdentityDocument($employee, 'PAN Card', $validated['pan_file_path'], null, 'Identity');
            }

            // Handle Education Certificate Document Creation
            if (isset($validated['education_doc_path'])) {
                $this->createIdentityDocument($employee, 'Education Certificate', $validated['education_doc_path'], null, 'Academic');
            }

            // Handle Relieving Document Creation
            if (isset($validated['relieving_doc_path'])) {
                $this->createIdentityDocument($employee, 'Relieving Document', $validated['relieving_doc_path'], null, 'Experience');
            }

            // Handle Bank Document Creation
            if (isset($validated['bank_doc_path'])) {
                $this->createIdentityDocument($employee, 'Bank Details Document', $validated['bank_doc_path'], null, 'Financial');
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
        } catch (\Throwable $e) {
            DB::rollBack();

            // Clean up newly uploaded files on failure
            foreach ($newUploadedFiles as $fPath) {
                if ($fPath && Storage::disk('public')->exists($fPath)) {
                    Storage::disk('public')->delete($fPath);
                }
            }

            \Log::error('Error creating employee:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return back()->withInput()->withErrors(['error' => 'Failed to create employee: ' . $e->getMessage()]);
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
        if ($user->isEmployee() && $user->employee_id !== $employee->id) {
            abort(403, 'Unauthorized access.');
        }

        // Non-employees with no view permission also denied
        if (!$user->isEmployee() && !$user->isAdmin() && !$user->hasPermission('view-employees')) {
            abort(403, 'Unauthorized access.');
        }

        $employee->load(['company', 'department', 'salaryStructures.component', 'user.roles', 'evaluations.evaluator', 'weeklyOffs', 'expenseClaims.category', 'documents.documentType']);

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

        $employee->load(['salaryStructures.component', 'weeklyOffs', 'user.roles']);
        $companies = Company::orderBy('name')->get(['id', 'name']);
        // Branch-scope departments
        $departmentsQuery = Department::orderBy('name');
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            $companyId = $user->employee->company_id;
            $departmentsQuery->whereHas('companies', function ($q) use ($companyId) {
                $q->where('companies.id', $companyId);
            });
        }
        $departments = $departmentsQuery->get(['departments.id', 'name']);
        $salaryComponents = \App\Models\SalaryComponent::where('is_active', true)->get();
        $availableRoles = Role::where('is_active', true)->get(['id', 'name', 'slug']);

        $employeeRole = null;
        if ($employee->user) {
            $employeeRole = $employee->user->roles->first()
                ? $employee->user->roles->first()->slug
                : $employee->user->role;
        }

        return Inertia::render('Employee/Edit', [
            'employee' => $employee,
            'canEditCode' => $user->isAdmin() && !$employee->is_code_edited,
            'companies' => $companies,
            'departments' => $departments,
            'salaryComponents' => $salaryComponents,
            'availableRoles' => $availableRoles,
            'leadershipEmployees' => $this->getLeadershipEmployees(),
            'managerEmployees' => $this->getManagerAndHrEmployees(),
            'employee_role' => $employeeRole,
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

        // Convert empty string unique fields to null
        foreach (['mobile', 'email', 'qid_number', 'passport_number', 'health_card_number'] as $field) {
            if (array_key_exists($field, $validated) && ($validated[$field] === '' || $validated[$field] === null)) {
                $validated[$field] = null;
            }
        }

        // Employee ID edit-once restriction for super admin / admin
        if ($user->isAdmin()) {
            if ($employee->is_code_edited) {
                // Already edited once by admin - cannot be modified again
                if (isset($validated['employee_code']) && $validated['employee_code'] !== $employee->employee_code) {
                    return back()->withErrors(['employee_code' => 'Employee ID has already been edited once and cannot be changed again.']);
                }
                unset($validated['employee_code']);
            } else {
                // Not edited yet - if changed, mark is_code_edited = true
                if (isset($validated['employee_code']) && $validated['employee_code'] !== $employee->employee_code) {
                    $validated['is_code_edited'] = true;
                } else {
                    unset($validated['employee_code']);
                }
            }
        } else {
            // Non-admin users cannot edit employee_code
            unset($validated['employee_code'], $validated['is_code_edited']);
        }

        // Role-based field protection: Only Admin and HR can change company, department, or status
        if (!$user->isAdmin() && !$user->isHR()) {
            unset($validated['company_id'], $validated['department_id'], $validated['manual_status']);
        }

        // Remove file fields from validated data so they don't overwrite with null if not uploaded
        unset($validated['employee_image'], $validated['agreement_doc'], $validated['resume_doc'], $validated['other_docs'], $validated['passport_file'], $validated['qid_file'], $validated['food_handler_file']);

        // Handle file upload if present
        $newUploadedFiles = [];
        $oldFilesToDelete = [];

        if ($request->hasFile('employee_image')) {
            if ($employee->employee_image) {
                $oldFilesToDelete[] = $employee->employee_image;
            }
            $path = $request->file('employee_image')->store('employee-images', 'public');
            $validated['employee_image'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('agreement_doc')) {
            if ($employee->agreement_doc) {
                $oldFilesToDelete[] = $employee->agreement_doc;
            }
            $path = $request->file('agreement_doc')->store('employee-docs', 'public');
            $validated['agreement_doc'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('resume_doc')) {
            if ($employee->resume_doc) {
                $oldFilesToDelete[] = $employee->resume_doc;
            }
            $path = $request->file('resume_doc')->store('employee-docs', 'public');
            $validated['resume_doc'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('other_docs')) {
            if ($employee->other_docs) {
                $oldFilesToDelete[] = $employee->other_docs;
            }
            $path = $request->file('other_docs')->store('employee-docs', 'public');
            $validated['other_docs'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('passport_file')) {
            if ($employee->passport_file_path) {
                $oldFilesToDelete[] = $employee->passport_file_path;
            }
            $path = $request->file('passport_file')->store('employee-docs', 'public');
            $validated['passport_file_path'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('qid_file')) {
            if ($employee->qid_file_path) {
                $oldFilesToDelete[] = $employee->qid_file_path;
            }
            $path = $request->file('qid_file')->store('employee-docs', 'public');
            $validated['qid_file_path'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('food_handler_file')) {
            if ($employee->food_handler_file_path) {
                $oldFilesToDelete[] = $employee->food_handler_file_path;
            }
            $path = $request->file('food_handler_file')->store('employee-docs', 'public');
            $validated['food_handler_file_path'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('aadhar_file')) {
            if ($employee->aadhar_file_path) {
                $oldFilesToDelete[] = $employee->aadhar_file_path;
            }
            $path = $request->file('aadhar_file')->store('employee-docs', 'public');
            $validated['aadhar_file_path'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('pan_file')) {
            if ($employee->pan_file_path) {
                $oldFilesToDelete[] = $employee->pan_file_path;
            }
            $path = $request->file('pan_file')->store('employee-docs', 'public');
            $validated['pan_file_path'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('education_doc')) {
            if ($employee->education_doc_path) {
                $oldFilesToDelete[] = $employee->education_doc_path;
            }
            $path = $request->file('education_doc')->store('employee-docs', 'public');
            $validated['education_doc_path'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('relieving_doc')) {
            if ($employee->relieving_doc_path) {
                $oldFilesToDelete[] = $employee->relieving_doc_path;
            }
            $path = $request->file('relieving_doc')->store('employee-docs', 'public');
            $validated['relieving_doc_path'] = $path;
            $newUploadedFiles[] = $path;
        }

        if ($request->hasFile('bank_doc')) {
            if ($employee->bank_doc_path) {
                $oldFilesToDelete[] = $employee->bank_doc_path;
            }
            $path = $request->file('bank_doc')->store('employee-docs', 'public');
            $validated['bank_doc_path'] = $path;
            $newUploadedFiles[] = $path;
        }

        DB::beginTransaction();
        try {
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
                $this->createIdentityDocument($employee, 'Passport', $validated['passport_file_path'], $validated['passport_expiry_date'] ?? null, 'Identity');
            }

            // Handle QID Document Creation (only if new file uploaded)
            if (isset($validated['qid_file_path'])) {
                $this->createIdentityDocument($employee, 'QID', $validated['qid_file_path'], $validated['qid_expiry_date'] ?? null, 'Identity');
            }

            // Handle Food Handler Document Creation (only if new file uploaded)
            if (isset($validated['food_handler_file_path'])) {
                $this->createIdentityDocument($employee, 'Food Handler', $validated['food_handler_file_path'], $validated['food_handler_expiry_date'] ?? null, 'Medical');
            }

            // Handle Aadhar Document Creation
            if (isset($validated['aadhar_file_path'])) {
                $this->createIdentityDocument($employee, 'Aadhar Card', $validated['aadhar_file_path'], null, 'Identity');
            }

            // Handle PAN Document Creation
            if (isset($validated['pan_file_path'])) {
                $this->createIdentityDocument($employee, 'PAN Card', $validated['pan_file_path'], null, 'Identity');
            }

            // Handle Education Certificate Document Creation
            if (isset($validated['education_doc_path'])) {
                $this->createIdentityDocument($employee, 'Education Certificate', $validated['education_doc_path'], null, 'Academic');
            }

            // Handle Relieving Document Creation
            if (isset($validated['relieving_doc_path'])) {
                $this->createIdentityDocument($employee, 'Relieving Document', $validated['relieving_doc_path'], null, 'Experience');
            }

            // Handle Bank Document Creation
            if (isset($validated['bank_doc_path'])) {
                $this->createIdentityDocument($employee, 'Bank Details Document', $validated['bank_doc_path'], null, 'Financial');
            }

            // Create or Sync User and Role if role is provided
            if (!empty($validated['role'])) {
                if (empty($employee->email)) {
                    throw new \Exception('Email is required when assigning a system role.');
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
                $employee->user->roles()->detach();
                $employee->user->update(['role' => null]);
            }

            if ($employee->employee_image && $employee->user) {
                $employee->user->update(['image' => $employee->employee_image]);
            }

            DB::commit();

            // Clean up old replaced files now that transaction succeeded
            foreach ($oldFilesToDelete as $oldFile) {
                if ($oldFile && Storage::disk('public')->exists($oldFile)) {
                    Storage::disk('public')->delete($oldFile);
                }
            }

            return redirect()->route('employees.show', $employee)->with('success', 'Employee updated successfully!');
        } catch (\Throwable $e) {
            DB::rollBack();

            // Revert newly uploaded files
            foreach ($newUploadedFiles as $newFile) {
                if ($newFile && Storage::disk('public')->exists($newFile)) {
                    Storage::disk('public')->delete($newFile);
                }
            }

            \Log::error('Error updating employee:', ['id' => $employee->id, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return back()->withInput()->withErrors(['error' => 'Failed to update employee: ' . $e->getMessage()]);
        }
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
        } catch (\Throwable $e) {
            \Log::error('Error approving employee:', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Failed to approve employee: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Employee $employee)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('delete-employees')) {
            abort(403, 'Unauthorized. You do not have permission to delete employees.');
        }

        // Check if employee has any related transactional records
        $relatedCounts = [
            'Attendance Records' => $employee->attendances()->count(),
            'Salary Postings' => $employee->salaryPostings()->count(),
            'Loans' => $employee->loans()->count(),
            'Advances' => $employee->advances()->count(),
            'Leave Requests' => $employee->leaveRequests()->count(),
            'Grievances' => $employee->grievances()->count(),
            'Warning Letters' => $employee->warningLetters()->count(),
            'Task Assignments' => $employee->taskAssignments()->count(),
            'Training Assignments' => $employee->trainingAssignments()->count(),
            'Evaluations' => $employee->evaluations()->count(),
            'Shift Rosters' => $employee->shiftRosters()->count(),
            'Uploaded Documents' => $employee->documents()->count(),
            'Project Memberships' => $employee->projectMembers()->count(),
            'Direct Reports (Subordinates)' => $employee->subordinates()->count(),
        ];

        $blockingRelations = array_filter($relatedCounts, fn($count) => $count > 0);

        if (!empty($blockingRelations)) {
            $details = collect($blockingRelations)->map(fn($count, $name) => "{$name} ({$count})")->join(', ');
            return back()->withErrors([
                'error' => "Cannot delete employee '{$employee->name}' because related records exist: {$details}. Please mark the employee as Inactive instead."
            ]);
        }

        DB::beginTransaction();
        try {
            // Delete associated stored files
            $filesToDelete = [
                $employee->employee_image,
                $employee->agreement_doc,
                $employee->resume_doc,
                $employee->other_docs,
                $employee->passport_file_path,
                $employee->qid_file_path,
                $employee->food_handler_file_path,
            ];
            foreach ($filesToDelete as $filePath) {
                if ($filePath && Storage::disk('public')->exists($filePath)) {
                    Storage::disk('public')->delete($filePath);
                }
            }

            // Remove setup data
            $employee->salaryStructures()->delete();
            $employee->weeklyOffs()->delete();
            $employee->leaveBalances()->delete();

            // Delete associated user account if one exists
            if ($employee->user) {
                $employee->user->roles()->detach();
                $employee->user->delete();
            }

            $employee->delete();
            DB::commit();

            return redirect()->route('employees.index')->with('success', 'Employee deleted successfully.');
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Error deleting employee:', ['id' => $employee->id, 'error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Failed to delete employee: ' . $e->getMessage()]);
        }
    }

    /**
     * Return employees for a given company_id as JSON (for AJAX)
     */
    public function getByCompany(Request $request)
    {
        try {
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
        } catch (\Throwable $e) {
            \Log::error('Error in getByCompany:', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to load employees.', 'employees' => []], 500);
        }
    }

    /**
     * Return employees for a given department_id & company_id as JSON (for AJAX)
     */
    public function getByDepartment(Request $request)
    {
        try {
            $departmentId = $request->input('department_id');
            $companyId = $request->input('company_id');

            $departmentEmployees = collect();
            if ($departmentId) {
                $departmentEmployees = Employee::where('department_id', $departmentId)
                    ->active()
                    ->orderBy('name')
                    ->get(['id', 'name', 'designation', 'company_id', 'department_id']);
            }

            // All active employees from the same branch/company
            $branchEmployees = collect();
            if ($companyId) {
                $branchEmployees = Employee::where('company_id', $companyId)
                    ->active()
                    ->orderBy('name')
                    ->get(['id', 'name', 'designation', 'company_id', 'department_id']);
            }

            return response()->json([
                'employees' => $departmentEmployees,
                'department_employees' => $departmentEmployees,
                'branch_employees' => $branchEmployees,
                'branch_managers' => $branchEmployees,
            ]);
        } catch (\Throwable $e) {
            \Log::error('Error in getByDepartment:', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to load branch department employees.',
                'employees' => [],
                'department_employees' => [],
                'branch_employees' => [],
                'branch_managers' => []
            ], 500);
        }
    }

    /**
     * Get real users/employees with Executive / Leadership designations (CEO, Founder, Owner, COO, Director, etc.)
     */
    private function getLeadershipEmployees()
    {
        $leadership = Employee::where(function ($q) {
            $q->where('designation', 'LIKE', '%CEO%')
              ->orWhere('designation', 'LIKE', '%Founder%')
              ->orWhere('designation', 'LIKE', '%Owner%')
              ->orWhere('designation', 'LIKE', '%COO%')
              ->orWhere('designation', 'LIKE', '%Chief Operating Officer%')
              ->orWhere('designation', 'LIKE', '%Director%')
              ->orWhere('designation', 'LIKE', '%General Manager%');
        })
        ->active()
        ->orderBy('name')
        ->get(['id', 'name', 'designation', 'company_id']);

        // Fallback: If no employee with CEO/Founder designation exists yet, include admin users
        if ($leadership->isEmpty()) {
            $adminUsers = User::where(function ($q) {
                $q->where('role', 'admin')
                  ->orWhereHas('roles', function ($rq) {
                      $rq->whereIn('slug', ['admin', 'owner', 'founder', 'ceo', 'coo']);
                  });
            })->get();

            foreach ($adminUsers as $admin) {
                $leadership->push((object)[
                    'id' => $admin->employee_id ?: ('user_' . $admin->id),
                    'name' => $admin->name,
                    'designation' => 'Founder / CEO',
                    'company_id' => null,
                ]);
            }
        }

        return $leadership;
    }

    /**
     * Get real users/employees with Manager / HR / Supervisor designations
     */
    private function getManagerAndHrEmployees()
    {
        return Employee::where(function ($q) {
            $q->where('designation', 'LIKE', '%Manager%')
              ->orWhere('designation', 'LIKE', '%HR%')
              ->orWhere('designation', 'LIKE', '%Human Resource%')
              ->orWhere('designation', 'LIKE', '%Supervisor%')
              ->orWhere('designation', 'LIKE', '%Lead%');
        })
        ->orWhereHas('user', function ($q) {
            $q->whereIn('role', ['hr', 'manager'])
              ->orWhereHas('roles', function ($rq) {
                  $rq->whereIn('slug', ['hr', 'manager', 'branch-manager']);
              });
        })
        ->active()
        ->orderBy('name')
        ->get(['id', 'name', 'designation', 'company_id', 'department_id']);
    }

    private function getConstants()
    {
        // Fetch dynamic options
        $options = \App\Models\DropdownOption::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('value')
            ->get()
            ->groupBy('category')
            ->map(function ($group) {
                return $group->pluck('value')->values()->toArray();
            });

        return [
            'genders' => !empty($options['Gender']) ? $options['Gender'] : ['Male', 'Female'],
            'designations' => !empty($options['Designation']) ? $options['Designation'] : [
                'Owner / Founder',
                'Chief Operating Officer',
                'Founder / CEO',
                'General Manager',
                'HR Manager',
                'HR Executive',
                'Branch Manager',
                'Operations Manager',
                'Department Head',
                'Supervisor / Team Lead',
                'Receptionist / Front Desk',
                'Accountant',
                'Administrative Assistant',
                'Sales Executive',
                'Office Assistant / Helper',
            ],
            'visa_types' => !empty($options['Visa Type']) ? $options['Visa Type'] : ['Work Visa', 'Visit Visa', 'Family Visa', 'Business Visa'],
            'visa_designations' => !empty($options['Visa Designation']) ? $options['Visa Designation'] : ['Manager', 'Engineer', 'Technician', 'Laborer', 'Driver', 'Accountant', 'Sales'],
            'employee_categories' => !empty($options['Employee Category']) ? $options['Employee Category'] : ['Permanent', 'Contract', 'Probation', 'Intern'],
            'contract_durations' => !empty($options['Contract Duration']) ? $options['Contract Duration'] : ['1 Year', '2 Years', '3 Years', '5 Years', 'Unlimited'],
            'exit_statuses' => !empty($options['Exit Status']) ? $options['Exit Status'] : ['Resigned', 'Terminated', 'End of Contract', 'Absconded'],
            'payment_types' => !empty($options['Payment Type']) ? $options['Payment Type'] : ['Bank Transfer', 'Cash', 'Cheque'],
            'leave_statuses' => !empty($options['Leave Status']) ? $options['Leave Status'] : ['Available', 'On Leave', 'Unpaid Leave'],
            'shifts' => !empty($options['Shift']) ? $options['Shift'] : ['Morning', 'Evening', 'Night', 'General'],
        ];
    }



    private function createIdentityDocument($employee, $type, $path, $expiryDate = null, $category = 'Identity')
    {
        $docType = DocumentType::firstOrCreate(
            ['name' => $type],
            ['category' => $category, 'is_active' => true]
        );

        EmployeeDocument::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'document_type_id' => $docType->id,
            ],
            [
                'document_name' => $type . ' - ' . ($employee->name),
                'file_path' => $path,
                'file_type' => pathinfo($path, PATHINFO_EXTENSION),
                'file_size' => Storage::disk('public')->exists($path) ? Storage::disk('public')->size($path) : 0,
                'expiry_date' => $expiryDate,
                'uploaded_by' => auth()->id(),
            ]
        );
    }

    public function bulkTransfer(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->hasPermission('edit-employees')) {
            abort(403, 'Unauthorized. You do not have permission to transfer employees.');
        }

        $validated = $request->validate([
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'exists:employees,id',
            'company_id' => 'required|exists:companies,id',
            'department_id' => 'required|exists:departments,id',
        ]);

        DB::beginTransaction();
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

            // Verify department belongs to company (supports both direct company_id and pivot)
            $department = Department::where('id', $validated['department_id'])
                ->where(function ($q) use ($validated) {
                    $q->where('company_id', $validated['company_id'])
                      ->orWhereHas('companies', function ($sub) use ($validated) {
                          $sub->where('companies.id', $validated['company_id']);
                      });
                })
                ->first();

            if (!$department) {
                DB::rollBack();
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

            DB::commit();

            return back()->with('success', count($validated['employee_ids']) . ' employees transferred successfully.');
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Error generating bulk transfer:', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Failed to transfer employees: ' . $e->getMessage()]);
        }
    }

    /**
     * Export employees to styled Excel (.xlsx) based on current filters
     */
    public function export(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('view-employees')) {
            abort(403, 'Unauthorized.');
        }

        try {
            $query = Employee::with(['company', 'department', 'user.roles']);

            // Multi-tenancy scoping
            if (!$user->isAdmin() && $user->employee_id && $user->employee) {
                $query->where('company_id', $user->employee->company_id);
            } elseif ($request->has('company_id') && $request->company_id) {
                $query->where('company_id', $request->company_id);
            }

            if ($request->has('department_id') && $request->department_id) {
                $query->where('department_id', $request->department_id);
            }

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('employee_code', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('mobile', 'like', "%{$search}%")
                        ->orWhere('designation', 'like', "%{$search}%");
                });
            }

            if ($request->has('status') && $request->status) {
                if ($request->status === 'active') {
                    $query->active();
                } elseif ($request->status === 'inactive') {
                    $query->inactive();
                } elseif ($request->status === 'waiting') {
                    $query->where('manual_status', 'waiting');
                }
            }

            $employees = $query->orderBy('name')->get();

            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Employees Directory');

            // Column definitions
            $columns = [
                'Employee Code',
                'Full Name',
                'Branch / Company',
                'Department',
                'Designation',
                'System Role',
                'Mobile',
                'Email',
                'Gender',
                'DOB',
                'Nationality',
                'Sponsor',
                'Basic Salary',
                'Reported To',
                'Joined Date',
                'Rejoined Date',
                'Shift',
                'Visa Type',
                'Visa Designation',
                'Employee Category',
                'Contract Duration',
                'Exit Status',
                'Payment Type',
                'Leave Status',
                'Status',
                'Passport Number',
                'Passport Expiry Date',
                'QID Number',
                'QID Expiry Date',
                'Health Card Number',
                'Health Card Expiry Date',
                'Contract Issue Date',
                'Contract Expiry Date',
            ];

            // Format Header Row
            $sheet->getRowDimension(1)->setRowHeight(32);
            foreach ($columns as $idx => $colName) {
                $colLetter = Coordinate::stringFromColumnIndex($idx + 1);
                $sheet->setCellValue($colLetter . '1', $colName);
            }

            $lastColLetter = Coordinate::stringFromColumnIndex(count($columns));

            // Style Header Row (Deep Slate/Indigo, Bold White, Centered)
            $sheet->getStyle("A1:{$lastColLetter}1")->applyFromArray([
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                    'size' => 11,
                    'name' => 'Segoe UI',
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '1E293B'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                    'wrapText' => false,
                ],
                'borders' => [
                    'bottom' => [
                        'borderStyle' => Border::BORDER_MEDIUM,
                        'color' => ['rgb' => '0F172A'],
                    ],
                ],
            ]);

            $fmtDate = function ($val) {
                if (!$val) return '';
                if ($val instanceof \Carbon\Carbon || $val instanceof \DateTimeInterface) {
                    return $val->format('Y-m-d');
                }
                try {
                    return \Carbon\Carbon::parse($val)->format('Y-m-d');
                } catch (\Throwable $e) {
                    return (string)$val;
                }
            };

            $rowNum = 2;
            foreach ($employees as $emp) {
                $roleName = $emp->user && $emp->user->roles && $emp->user->roles->first() 
                    ? $emp->user->roles->first()->name 
                    : ($emp->user ? ($emp->user->role ?? '') : '');

                $rowData = [
                    $emp->employee_code,
                    $emp->name,
                    $emp->company ? $emp->company->name : '',
                    $emp->department ? $emp->department->name : '',
                    $emp->designation,
                    $roleName,
                    $emp->mobile,
                    $emp->email,
                    $emp->gender,
                    $fmtDate($emp->dob),
                    $emp->nationality,
                    $emp->sponsor,
                    $emp->basic_salary ? (float)$emp->basic_salary : 0,
                    $emp->reported_to,
                    $fmtDate($emp->joined_date),
                    $fmtDate($emp->rejoined_date),
                    $emp->shift,
                    $emp->visa_type,
                    $emp->visa_designation,
                    $emp->employee_category,
                    $emp->contract_duration,
                    $emp->exit_status,
                    $emp->payment_type,
                    $emp->leave_status,
                    $emp->manual_status ?: ($emp->is_active ? 'active' : 'inactive'),
                    $emp->passport_number,
                    $fmtDate($emp->passport_expiry_date),
                    $emp->qid_number,
                    $fmtDate($emp->qid_expiry_date),
                    $emp->health_card_number,
                    $fmtDate($emp->health_card_expiry_date),
                    $fmtDate($emp->contract_issue_date),
                    $fmtDate($emp->contract_expiry_date),
                ];

                $sheet->getRowDimension($rowNum)->setRowHeight(22);
                foreach ($rowData as $cIdx => $val) {
                    $cLetter = Coordinate::stringFromColumnIndex($cIdx + 1);
                    $sheet->setCellValue($cLetter . $rowNum, $val);
                }

                // Alternating zebra row colors
                $bgColor = ($rowNum % 2 === 0) ? 'FFFFFF' : 'F8FAFC';
                $sheet->getStyle("A{$rowNum}:{$lastColLetter}{$rowNum}")->applyFromArray([
                    'font' => [
                        'size' => 10,
                        'name' => 'Segoe UI',
                        'color' => ['rgb' => '334155'],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => $bgColor],
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => 'E2E8F0'],
                        ],
                    ],
                ]);

                // Specific alignments
                $sheet->getStyle("A{$rowNum}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("I{$rowNum}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("J{$rowNum}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("M{$rowNum}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet->getStyle("M{$rowNum}")->getNumberFormat()->setFormatCode('#,##0.00');
                $sheet->getStyle("O{$rowNum}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("P{$rowNum}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("Q{$rowNum}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("Y{$rowNum}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                $rowNum++;
            }

            // Auto-fit column widths
            foreach (range(1, count($columns)) as $colIdx) {
                $colLetter = Coordinate::stringFromColumnIndex($colIdx);
                $sheet->getColumnDimension($colLetter)->setAutoSize(true);
            }

            // Freeze top header row
            $sheet->freezePane('A2');

            $filename = "employees_export_" . now()->format('Ymd_His') . ".xlsx";

            return response()->streamDownload(function () use ($spreadsheet) {
                $writer = new Xlsx($spreadsheet);
                $writer->save('php://output');
            }, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Cache-Control' => 'max-age=0',
                'Pragma' => 'public',
            ]);
        } catch (\Throwable $e) {
            \Log::error('Error exporting employees:', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Failed to export employees: ' . $e->getMessage()]);
        }
    }

    /**
     * Download styled sample Excel template for employee import
     */
    public function downloadTemplate()
    {
        try {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Template');

            $columns = [
                'Employee Code',
                'Full Name',
                'Branch / Company',
                'Department',
                'Designation',
                'System Role',
                'Mobile',
                'Email',
                'Gender',
                'DOB',
                'Nationality',
                'Sponsor',
                'Basic Salary',
                'Reported To',
                'Joined Date',
                'Shift',
                'Visa Type',
                'Visa Designation',
                'Employee Category',
                'Contract Duration',
                'Payment Type',
                'Passport Number',
                'QID Number',
            ];

            // Format Header Row
            $sheet->getRowDimension(1)->setRowHeight(32);
            foreach ($columns as $idx => $colName) {
                $colLetter = Coordinate::stringFromColumnIndex($idx + 1);
                $sheet->setCellValue($colLetter . '1', $colName);
            }

            $lastColLetter = Coordinate::stringFromColumnIndex(count($columns));

            // Style Header Row (Deep Blue/Slate, Bold White)
            $sheet->getStyle("A1:{$lastColLetter}1")->applyFromArray([
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                    'size' => 11,
                    'name' => 'Segoe UI',
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '1E293B'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
                'borders' => [
                    'bottom' => [
                        'borderStyle' => Border::BORDER_MEDIUM,
                        'color' => ['rgb' => '0F172A'],
                    ],
                ],
            ]);

            $samples = [
                [
                    'EMP-001',
                    'Jane Doe',
                    'Main Company Branch',
                    'Human Resources',
                    'HR Executive',
                    'employee',
                    '+97412345678',
                    'jane.doe@example.com',
                    'Female',
                    '1995-05-15',
                    'Qatari',
                    'Company Sponsor',
                    4500,
                    'HR Manager',
                    '2024-01-10',
                    'Morning',
                    'Work Visa',
                    'Technician',
                    'Permanent',
                    '2 Years',
                    'Bank Transfer',
                    'N12345678',
                    '29500000001',
                ],
                [
                    'EMP-002',
                    'Ahmed Ali',
                    'Main Company Branch',
                    'Management',
                    'HR Manager',
                    'hr',
                    '+97487654321',
                    'ahmed.ali@example.com',
                    'Male',
                    '1990-08-20',
                    'Qatari',
                    'Company Sponsor',
                    8000,
                    'Founder / CEO',
                    '2023-06-01',
                    'General',
                    'Work Visa',
                    'Manager',
                    'Permanent',
                    '3 Years',
                    'Bank Transfer',
                    'P87654321',
                    '29000000002',
                ]
            ];

            $rowNum = 2;
            foreach ($samples as $row) {
                $sheet->getRowDimension($rowNum)->setRowHeight(22);
                foreach ($row as $cIdx => $val) {
                    $cLetter = Coordinate::stringFromColumnIndex($cIdx + 1);
                    $sheet->setCellValue($cLetter . $rowNum, $val);
                }

                $bgColor = ($rowNum % 2 === 0) ? 'FFFFFF' : 'F8FAFC';
                $sheet->getStyle("A{$rowNum}:{$lastColLetter}{$rowNum}")->applyFromArray([
                    'font' => [
                        'size' => 10,
                        'name' => 'Segoe UI',
                        'color' => ['rgb' => '334155'],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => $bgColor],
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => 'E2E8F0'],
                        ],
                    ],
                ]);

                $sheet->getStyle("A{$rowNum}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("I{$rowNum}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("J{$rowNum}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("M{$rowNum}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet->getStyle("M{$rowNum}")->getNumberFormat()->setFormatCode('#,##0.00');
                $sheet->getStyle("O{$rowNum}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                $rowNum++;
            }

            // Auto-fit column widths
            foreach (range(1, count($columns)) as $colIdx) {
                $colLetter = Coordinate::stringFromColumnIndex($colIdx);
                $sheet->getColumnDimension($colLetter)->setAutoSize(true);
            }

            $sheet->freezePane('A2');

            $filename = "employee_import_template.xlsx";

            return response()->streamDownload(function () use ($spreadsheet) {
                $writer = new Xlsx($spreadsheet);
                $writer->save('php://output');
            }, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Cache-Control' => 'max-age=0',
                'Pragma' => 'public',
            ]);
        } catch (\Throwable $e) {
            \Log::error('Error generating template:', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Failed to download template: ' . $e->getMessage()]);
        }
    }

    /**
     * Import employees from uploaded Excel (.xlsx, .xls) or CSV file
     */
    public function import(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isHR() && !$user->hasPermission('create-employees')) {
            abort(403, 'Unauthorized. You do not have permission to import employees.');
        }

        $request->validate([
            // SECURITY: Restrict to legitimate spreadsheet/CSV MIME types only.
            // Without `mimes`, any file (e.g. PHP script) could be uploaded
            // and potentially executed if moved to a public location.
            'file' => [
                'required',
                'file',
                'max:15360', // 15 MB
                'mimes:xlsx,xls,csv,txt',
            ],
            'company_id' => 'nullable|exists:companies,id',
        ], [
            'file.mimes' => 'Only Excel (.xlsx, .xls) or CSV (.csv) files are allowed for import.',
            'file.max'   => 'Import file must not exceed 15 MB.',
        ]);

        $defaultCompanyId = $request->input('company_id');
        if (!$user->isAdmin() && $user->employee_id && $user->employee) {
            $defaultCompanyId = $user->employee->company_id;
        }

        $file = $request->file('file');
        $realPath = $file->getRealPath();

        try {
            $spreadsheet = IOFactory::load($realPath);
            $sheet = $spreadsheet->getActiveSheet();
            $allRows = $sheet->toArray(null, true, true, false);
        } catch (\Throwable $e) {
            \Log::error('Spreadsheet Load Error: ' . $e->getMessage());
            return back()->withErrors(['file' => 'Unable to read the uploaded file. Please ensure it is a valid Excel or CSV file.']);
        }

        if (empty($allRows) || count($allRows) < 2) {
            return back()->withErrors(['file' => 'The uploaded file contains no data rows.']);
        }

        // Header mapping
        $rawHeader = array_shift($allRows);
        $cleanHeader = array_map(function ($h) {
            return strtolower(trim(preg_replace('/[\x00-\x1F\x80-\xFF]/', '', (string)$h)));
        }, $rawHeader);

        $findCol = function (array $aliases) use ($cleanHeader) {
            foreach ($aliases as $alias) {
                $idx = array_search(strtolower(trim($alias)), $cleanHeader);
                if ($idx !== false) return $idx;
            }
            return false;
        };

        $colMap = [
            'code' => $findCol(['employee code', 'code', 'emp code', 'employee_code', 'id']),
            'name' => $findCol(['full name', 'name', 'employee name', 'fullname']),
            'branch' => $findCol(['branch / Company', 'branch', 'Company', 'company', 'company name']),
            'department' => $findCol(['department', 'dept', 'department name']),
            'designation' => $findCol(['designation', 'job title', 'title', 'position']),
            'role' => $findCol(['system role', 'role', 'user role']),
            'mobile' => $findCol(['mobile', 'phone', 'mobile number', 'contact']),
            'email' => $findCol(['email', 'email address', 'e-mail']),
            'gender' => $findCol(['gender', 'sex']),
            'dob' => $findCol(['dob', 'date of birth', 'birth date']),
            'nationality' => $findCol(['nationality', 'country']),
            'sponsor' => $findCol(['sponsor', 'sponsorship']),
            'basic_salary' => $findCol(['basic salary', 'salary', 'basic_salary', 'basic']),
            'reported_to' => $findCol(['reported to', 'reporting manager', 'manager', 'reports to']),
            'joined_date' => $findCol(['joined date', 'joining date', 'hire date', 'joined_date']),
            'rejoined_date' => $findCol(['rejoined date', 'rejoining date']),
            'shift' => $findCol(['shift', 'work shift']),
            'visa_type' => $findCol(['visa type', 'visa_type']),
            'visa_designation' => $findCol(['visa designation', 'visa_designation']),
            'employee_category' => $findCol(['employee category', 'category', 'type']),
            'contract_duration' => $findCol(['contract duration', 'contract_duration', 'duration']),
            'exit_status' => $findCol(['exit status', 'exit_status']),
            'payment_type' => $findCol(['payment type', 'payment_type', 'payment method']),
            'leave_status' => $findCol(['leave status', 'leave_status']),
            'status' => $findCol(['status', 'manual_status', 'active status']),
            'passport_number' => $findCol(['passport number', 'passport_number', 'passport']),
            'passport_expiry_date' => $findCol(['passport expiry date', 'passport expiry', 'passport_expiry_date']),
            'qid_number' => $findCol(['qid number', 'qid', 'qid_number', 'qatar id', 'national id']),
            'qid_expiry_date' => $findCol(['qid expiry date', 'qid expiry', 'qid_expiry_date']),
            'health_card_number' => $findCol(['health card number', 'health card', 'health_card_number']),
            'health_card_expiry_date' => $findCol(['health card expiry date', 'health_card_expiry_date']),
            'contract_issue_date' => $findCol(['contract issue date', 'contract_issue_date']),
            'contract_expiry_date' => $findCol(['contract expiry date', 'contract_expiry_date']),
        ];

        if ($colMap['name'] === false) {
            return back()->withErrors(['file' => 'File must include a "Full Name" or "Name" column header.']);
        }

        $imported = 0;
        $updated = 0;
        $rowNum = 1;

        $companies = Company::all();
        $roles = Role::where('is_active', true)->get();

        DB::beginTransaction();
        try {
            foreach ($allRows as $row) {
                $rowNum++;
                if (empty(array_filter($row, function($v) { return $v !== null && $v !== ''; }))) continue;

                $getVal = function ($key) use ($colMap, $row) {
                    if ($colMap[$key] !== false && isset($row[$colMap[$key]])) {
                        $val = $row[$colMap[$key]];
                        return is_string($val) ? trim($val) : $val;
                    }
                    return null;
                };

                $name = $getVal('name');
                if (!$name) continue;

                // Resolve company/branch
                $branchName = (string)$getVal('branch');
                $companyId = $defaultCompanyId;
                if ($branchName) {
                    $matchedCompany = $companies->first(function ($c) use ($branchName) {
                        return strcasecmp($c->name, $branchName) === 0 || (string)$c->id === $branchName;
                    });
                    if ($matchedCompany) {
                        $companyId = $matchedCompany->id;
                    }
                }

                if (!$companyId && $companies->isNotEmpty()) {
                    $companyId = $companies->first()->id;
                }

                // Resolve department
                $deptName = (string)$getVal('department');
                $departmentId = null;
                if ($deptName && $companyId) {
                    $dept = Department::where('name', $deptName)->first();
                    if (!$dept) {
                        $dept = Department::create([
                            'name' => $deptName,
                            'company_id' => $companyId,
                            'status' => 'active',
                        ]);
                    }
                    $departmentId = $dept->id;
                }

                // Resolve code
                $code = $getVal('code');
                if (empty($code)) {
                    $code = Employee::generateCode($companyId);
                }

                // Parse dates helper
                $parseDate = function ($val) {
                    if (!$val) return null;
                    try {
                        return \Carbon\Carbon::parse($val)->format('Y-m-d');
                    } catch (\Throwable $e) {
                        return null;
                    }
                };

                $data = [
                    'name' => $name,
                    'company_id' => $companyId,
                    'department_id' => $departmentId,
                    'designation' => $getVal('designation'),
                    'mobile' => $getVal('mobile') ?: null,
                    'email' => $getVal('email') ?: null,
                    'gender' => $getVal('gender'),
                    'dob' => $parseDate($getVal('dob')),
                    'nationality' => $getVal('nationality'),
                    'sponsor' => $getVal('sponsor'),
                    'basic_salary' => is_numeric($getVal('basic_salary')) ? $getVal('basic_salary') : 0,
                    'reported_to' => $getVal('reported_to'),
                    'joined_date' => $parseDate($getVal('joined_date')) ?: now()->format('Y-m-d'),
                    'rejoined_date' => $parseDate($getVal('rejoined_date')),
                    'shift' => $getVal('shift') ?: 'Morning',
                    'visa_type' => $getVal('visa_type') ?: 'Work Visa',
                    'visa_designation' => $getVal('visa_designation'),
                    'employee_category' => $getVal('employee_category') ?: 'Permanent',
                    'contract_duration' => $getVal('contract_duration') ?: '2 Years',
                    'exit_status' => $getVal('exit_status'),
                    'payment_type' => $getVal('payment_type') ?: 'Bank Transfer',
                    'leave_status' => $getVal('leave_status') ?: 'Available',
                    'manual_status' => $getVal('status') ?: 'active',
                    'passport_number' => $getVal('passport_number') ?: null,
                    'passport_expiry_date' => $parseDate($getVal('passport_expiry_date')),
                    'qid_number' => $getVal('qid_number') ?: null,
                    'qid_expiry_date' => $parseDate($getVal('qid_expiry_date')),
                    'health_card_number' => $getVal('health_card_number') ?: null,
                    'health_card_expiry_date' => $parseDate($getVal('health_card_expiry_date')),
                    'contract_issue_date' => $parseDate($getVal('contract_issue_date')),
                    'contract_expiry_date' => $parseDate($getVal('contract_expiry_date')),
                ];

                // Check existing by employee_code or email
                $existingEmployee = Employee::where('employee_code', $code)->first();
                if (!$existingEmployee && !empty($data['email'])) {
                    $existingEmployee = Employee::where('email', $data['email'])->first();
                }

                if ($existingEmployee) {
                    $existingEmployee->update($data);
                    $employee = $existingEmployee;
                    $updated++;
                } else {
                    $data['employee_code'] = $code;
                    $employee = Employee::create($data);
                    $imported++;
                }

                // Handle system role & user account creation if role and email specified
                $roleSlug = strtolower(trim((string)$getVal('role')));
                if ($employee->email && $roleSlug) {
                    $matchedRole = $roles->first(function ($r) use ($roleSlug) {
                        return strcasecmp($r->slug, $roleSlug) === 0 || strcasecmp($r->name, $roleSlug) === 0;
                    });

                    $userAccount = User::where('email', $employee->email)->first();
                    if (!$userAccount) {
                        $userAccount = User::create([
                            'name' => $employee->name,
                            'email' => $employee->email,
                            'password' => bcrypt('password123'),
                            'employee_id' => $employee->id,
                            'company_id' => $companyId,
                            'role' => $matchedRole ? $matchedRole->slug : 'employee',
                        ]);
                    } else {
                        $userAccount->update([
                            'name' => $employee->name,
                            'employee_id' => $employee->id,
                            'company_id' => $companyId,
                            'role' => $matchedRole ? $matchedRole->slug : $userAccount->role,
                        ]);
                    }

                    if ($matchedRole) {
                        $userAccount->roles()->syncWithoutDetaching([$matchedRole->id]);
                    }
                }
            }

            DB::commit();

            $msg = "Import completed successfully: {$imported} new employees created, {$updated} existing employees updated.";
            return back()->with('success', $msg);
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Employee Import error: ' . $e->getMessage());
            return back()->withErrors(['file' => 'Import failed on row ' . $rowNum . ': ' . $e->getMessage()]);
        }
    }

    /**
     * Unlock and reactivate a separated/inactive employee profile (Admin & HR only).
     */
    public function unlockProfile(Request $request, Employee $employee)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !in_array($user->role, ['admin', 'hr'])) {
            abort(403, 'Unauthorized. Only HR or Administrator can unlock an employee profile.');
        }

        DB::transaction(function () use ($employee) {
            $employee->update([
                'manual_status' => 'active',
                'exit_status'   => null,
                'exit_date'     => null,
                'exit_reason'   => null,
            ]);
        });

        return back()->with('success', "Employee {$employee->name}'s profile has been unlocked and reactivated.");
    }
}
