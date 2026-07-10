<?php

namespace App\Http\Controllers;

use App\Models\EmployeeDocument;
use App\Models\Employee;
use App\Models\DocumentType;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class EmployeeDocumentController extends Controller
{
    public function index(Employee $employee)
    {
        $user = auth()->user();

        // Check authorization
        if ($user->role === 'employee' && $user->employee_id != $employee->id) {
            abort(403, 'Unauthorized access.');
        }

        // Branch isolation check
        if ($user->role !== 'admin' && $user->employee_id && $employee->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access to this employee\'s documents.');
        }

        $documents = EmployeeDocument::where('employee_id', $employee->id)
            ->with(['documentType', 'uploader'])
            ->latest()
            ->get();

        $documentTypes = DocumentType::where('is_active', true)->orderBy('name')->get();

        $companyId = $employee->company_id;
        $settings = [
            'max_file_size_mb' => Setting::get('max_file_size_mb', 10, $companyId),
            'allowed_file_types' => Setting::get('allowed_file_types', 'pdf,jpg,jpeg,png,doc,docx', $companyId),
        ];

        return Inertia::render('Employee/Documents', [
            'employee' => $employee,
            'documents' => $documents,
            'documentTypes' => $documentTypes,
            'userRole' => $user->role,
            'settings' => $settings,
        ]);
    }

    public function store(Request $request, Employee $employee)
    {
        $user = auth()->user();

        // Only admin, hr, manager can upload documents
        if (!in_array($user->role, ['admin', 'hr', 'manager'])) {
            abort(403, 'Unauthorized.');
        }

        // Manager/HR from different branch check
        if ($user->role !== 'admin' && $user->employee_id && $employee->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access.');
        }

        $companyId = $employee->company_id;
        $maxSizeMb = Setting::get('max_file_size_mb', 10, $companyId);
        $maxSizeKb = $maxSizeMb * 1024;
        $allowedTypes = Setting::get('allowed_file_types', 'pdf,jpg,jpeg,png,doc,docx', $companyId);

        $validated = $request->validate([
            'document_type_id' => 'nullable|exists:document_types,id',
            'document_name' => 'required|string|max:255',
            'file' => "required|file|max:{$maxSizeKb}|mimes:{$allowedTypes}",
            'issue_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after:issue_date',
            'notes' => 'nullable|string',
        ]);

        // Store file
        $file = $request->file('file');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('employee_documents/' . $employee->id, $fileName, 'public');

        EmployeeDocument::create([
            'employee_id' => $employee->id,
            'document_type_id' => $validated['document_type_id'] ?? null,
            'document_name' => $validated['document_name'],
            'file_path' => $filePath,
            'file_type' => $file->getClientOriginalExtension(),
            'file_size' => $file->getSize(),
            'issue_date' => $validated['issue_date'] ?? null,
            'expiry_date' => $validated['expiry_date'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'uploaded_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Document uploaded successfully!');
    }

    public function download(EmployeeDocument $document)
    {
        $user = auth()->user();

        // Check authorization
        if ($user->role === 'employee' && $user->employee_id != $document->employee_id) {
            abort(403, 'Unauthorized access.');
        }

        // Branch isolation check
        if ($user->role !== 'admin' && $user->employee_id && $document->employee->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access.');
        }

        return response()->download(storage_path('app/public/' . $document->file_path), $document->document_name . '.' . $document->file_type);
    }

    public function destroy(EmployeeDocument $document)
    {
        $user = auth()->user();

        // Only admin, hr can delete documents
        if (!in_array($user->role, ['admin', 'hr'])) {
            abort(403, 'Unauthorized.');
        }

        // Branch isolation check
        if ($user->role !== 'admin' && $user->employee_id && $document->employee->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access.');
        }

        // Check retention policy
        $companyId = $document->employee->company_id;
        $retentionYears = Setting::get('retention_period_years', 0, $companyId);

        if ($retentionYears > 0) {
            $retentionDate = $document->created_at->addYears($retentionYears);
            if (now()->lessThan($retentionDate)) {
                return back()->with('error', "Document cannot be deleted. Retention policy requires keeping this document until {$retentionDate->toDateString()}.");
            }
        }

        // Delete file from storage
        Storage::disk('public')->delete($document->file_path);

        $document->delete();

        return redirect()->back()->with('success', 'Document deleted successfully!');
    }

    public function expiring(Request $request)
    {
        $user = auth()->user();

        // Only admin, hr, manager can view expiring documents
        if (!in_array($user->role, ['admin', 'hr', 'manager'])) {
            abort(403, 'Unauthorized.');
        }

        $companyId = $user->employee_id ? $user->employee->company_id : null;
        $defaultDays = Setting::get('expiry_notification_days', 30, $companyId);
        $days = (int) $request->query('days', $defaultDays);

        $query = EmployeeDocument::with(['employee', 'documentType'])
            ->whereNotNull('expiry_date')
            ->where('is_expired', false)
            ->whereDate('expiry_date', '<=', now()->addDays($days))
            ->whereDate('expiry_date', '>=', now());

        // Multi-tenancy scoping
        if ($user->role !== 'admin' && $user->employee_id) {
            $query->whereHas('employee', function ($q) use ($user) {
                $q->where('company_id', $user->employee->company_id);
            });
        } elseif ($user->role === 'admin' && $request->has('company_id')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('company_id', $request->company_id);
            });
        }

        $expiringDocuments = $query->orderBy('expiry_date')->get();

        return Inertia::render('Documents/Expiring', [
            'expiringDocuments' => $expiringDocuments,
            'days' => $days,
        ]);
    }
}
