<?php

namespace App\Http\Controllers;

use App\Models\DocumentType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DocumentTypeController extends Controller
{
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

        $validated = $request->validate([
            'name' => 'required|string|max:255',
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

        $validated = $request->validate([
            'name' => 'required|string|max:255',
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

        $documentType->delete();

        return redirect()->back()->with('success', 'Document type deleted successfully!');
    }
}
