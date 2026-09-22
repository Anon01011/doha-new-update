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

        // Authorization: admin, hr, manager OR employee uploading their own document
        $isSelfEmployee = ($user->role === 'employee' && $user->employee_id == $employee->id);
        if (!in_array($user->role, ['admin', 'hr', 'manager']) && !$isSelfEmployee) {
            abort(403, 'Unauthorized to upload documents.');
        }

        // Manager/HR/Employee from different branch check
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
            'notes' => 'nullable|string|max:5000',
        ]);

        // Check if a document of this type or name already exists for this employee
        $existingDoc = null;
        if (!empty($validated['document_type_id'])) {
            $existingDoc = EmployeeDocument::where('employee_id', $employee->id)
                ->where('document_type_id', $validated['document_type_id'])
                ->first();
        }

        if (!$existingDoc && !empty($validated['document_name'])) {
            $existingDoc = EmployeeDocument::where('employee_id', $employee->id)
                ->whereRaw('LOWER(TRIM(document_name)) = ?', [strtolower(trim($validated['document_name']))])
                ->first();
        }

        // Store new file
        $file = $request->file('file');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('employee_documents/' . $employee->id, $fileName, 'public');

        try {
            if ($existingDoc) {
                // Delete previous file from disk if it exists
                if ($existingDoc->file_path && Storage::disk('public')->exists($existingDoc->file_path)) {
                    Storage::disk('public')->delete($existingDoc->file_path);
                }

                $existingDoc->update([
                    'document_type_id' => $validated['document_type_id'] ?? $existingDoc->document_type_id,
                    'document_name' => $validated['document_name'],
                    'file_path' => $filePath,
                    'file_type' => $file->getClientOriginalExtension(),
                    'file_size' => $file->getSize(),
                    'issue_date' => $validated['issue_date'] ?? $existingDoc->issue_date,
                    'expiry_date' => $validated['expiry_date'] ?? $existingDoc->expiry_date,
                    'notes' => $validated['notes'] ?? $existingDoc->notes,
                    'uploaded_by' => auth()->id(),
                ]);

                $this->syncWithEmployeeProfile($employee, $validated['document_name'], $validated['document_type_id'] ?? null, $filePath, $validated['expiry_date'] ?? null);

                return redirect()->back()->with('success', 'Existing document updated with new upload successfully!');
            } else {
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

                $this->syncWithEmployeeProfile($employee, $validated['document_name'], $validated['document_type_id'] ?? null, $filePath, $validated['expiry_date'] ?? null);

                return redirect()->back()->with('success', 'Document uploaded successfully!');
            }
        } catch (\Throwable $e) {
            if ($filePath && Storage::disk('public')->exists($filePath)) {
                Storage::disk('public')->delete($filePath);
            }
            \Log::error('Error storing employee document:', ['error' => $e->getMessage()]);
            return redirect()->back()->withErrors(['error' => 'Failed to save document record: ' . $e->getMessage()]);
        }
    }

    private function syncWithEmployeeProfile(Employee $employee, string $docName, ?int $docTypeId, string $filePath, ?string $expiryDate = null): void
    {
        $typeName = '';
        if ($docTypeId) {
            $docType = DocumentType::find($docTypeId);
            if ($docType) {
                $typeName = strtolower(trim($docType->name));
            }
        }
        $nameLower = strtolower(trim($docName));
        $identifier = $typeName ?: $nameLower;

        $updates = [];
        if (str_contains($identifier, 'aadhar')) {
            $updates['aadhar_file_path'] = $filePath;
        } elseif (str_contains($identifier, 'pan')) {
            $updates['pan_file_path'] = $filePath;
        } elseif (str_contains($identifier, 'qid') || str_contains($identifier, 'qatar id')) {
            $updates['qid_file_path'] = $filePath;
            if ($expiryDate) $updates['qid_expiry_date'] = $expiryDate;
        } elseif (str_contains($identifier, 'passport')) {
            $updates['passport_file_path'] = $filePath;
            if ($expiryDate) $updates['passport_expiry_date'] = $expiryDate;
        } elseif (str_contains($identifier, 'resume') || str_contains($identifier, 'cv')) {
            $updates['resume_doc'] = $filePath;
        } elseif (str_contains($identifier, 'contract') || str_contains($identifier, 'agreement')) {
            $updates['agreement_doc'] = $filePath;
            if ($expiryDate) $updates['contract_expiry_date'] = $expiryDate;
        } elseif (str_contains($identifier, 'education')) {
            $updates['education_doc_path'] = $filePath;
        } elseif (str_contains($identifier, 'relieving') || str_contains($identifier, 'experience')) {
            $updates['relieving_doc_path'] = $filePath;
        } elseif (str_contains($identifier, 'bank') || str_contains($identifier, 'passbook')) {
            $updates['bank_doc_path'] = $filePath;
        } elseif (str_contains($identifier, 'food') || str_contains($identifier, 'hygiene')) {
            $updates['food_handler_file_path'] = $filePath;
            if ($expiryDate) $updates['food_handler_expiry_date'] = $expiryDate;
        } elseif (str_contains($identifier, 'health')) {
            $updates['health_card_file_path'] = $filePath;
            if ($expiryDate) $updates['health_card_expiry_date'] = $expiryDate;
        }

        if (!empty($updates)) {
            $employee->update($updates);
        }
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

        // SECURITY FIX #11: Check file existence on public disk and prevent path traversal
        if (!Storage::disk('public')->exists($document->file_path)) {
            abort(404, 'Document file not found.');
        }

        $absolutePath = Storage::disk('public')->path($document->file_path);
        return response()->download($absolutePath, $document->document_name . '.' . $document->file_type);
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

        try {
            $filePath = $document->file_path;
            $document->delete();

            // Delete file from storage
            if ($filePath && Storage::disk('public')->exists($filePath)) {
                Storage::disk('public')->delete($filePath);
            }

            return redirect()->back()->with('success', 'Document deleted successfully!');
        } catch (\Throwable $e) {
            \Log::error('Error deleting employee document:', ['id' => $document->id, 'error' => $e->getMessage()]);
            return redirect()->back()->withErrors(['error' => 'Failed to delete document: ' . $e->getMessage()]);
        }
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
