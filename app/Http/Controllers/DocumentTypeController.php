<?php

namespace App\Http\Controllers;

use App\Models\DocumentType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DocumentTypeController extends Controller
{
    private array $systemDefaults = [
        'passport', 'qid', 'qatar id', 'aadhar card', 'aadhar', 'pan card', 'pan',
        'resume', 'cv', 'employment contract', 'signed contract', 'agreement',
        'education certificate', 'relieving certificate', 'bank passbook',
        'health card', 'food handler certificate'
    ];

    public function index()
    {
        $documentTypes = DocumentType::orderBy('category')->orderBy('name')->get();

        return Inertia::render('DocumentTypes/Index', [
            'documentTypes' => $documentTypes,
        ]);
    }

    public function store(Request $request)
    {
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Unauthorized.');
        }

        $normalizedName = strtolower(trim($request->input('name', '')));

        // Check if exact or case-insensitive name already exists
        $exists = DocumentType::whereRaw('LOWER(TRIM(name)) = ?', [$normalizedName])->exists();
        if ($exists) {
            return back()->withErrors(['name' => 'A document type with this name already exists. Duplicate document types are not allowed.']);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('document_types', 'name')
            ],
            'category' => 'required|string|max:255',
            'requires_expiry' => 'boolean',
            'is_mandatory' => 'boolean',
            'is_active' => 'boolean',
            'alert_days_before_expiry' => 'required|integer|min:1|max:365',
        ]);

        DocumentType::create($validated);

        return redirect()->back()->with('success', 'Document type created successfully!');
    }

    public function update(Request $request, DocumentType $documentType)
    {
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Unauthorized.');
        }

        $normalizedName = strtolower(trim($request->input('name', '')));

        // Check if renaming causes collision with another document type
        $exists = DocumentType::where('id', '!=', $documentType->id)
            ->whereRaw('LOWER(TRIM(name)) = ?', [$normalizedName])
            ->exists();

        if ($exists) {
            return back()->withErrors(['name' => 'Another document type with this name already exists.']);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('document_types', 'name')->ignore($documentType->id)
            ],
            'category' => 'required|string|max:255',
            'requires_expiry' => 'boolean',
            'is_mandatory' => 'boolean',
            'is_active' => 'boolean',
            'alert_days_before_expiry' => 'required|integer|min:1|max:365',
        ]);

        $documentType->update($validated);

        return redirect()->back()->with('success', 'Document type updated successfully!');
    }

    public function destroy(DocumentType $documentType)
    {
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Unauthorized.');
        }

        $normalized = strtolower(trim($documentType->name));
        if (in_array($normalized, $this->systemDefaults)) {
            return back()->withErrors(['error' => 'System default document types cannot be deleted.']);
        }

        if ($documentType->documents()->count() > 0) {
            return back()->withErrors(['error' => 'Cannot delete document type because it is linked to existing employee documents. Deactivate it instead.']);
        }

        $documentType->delete();

        return redirect()->back()->with('success', 'Document type deleted successfully!');
    }
}
