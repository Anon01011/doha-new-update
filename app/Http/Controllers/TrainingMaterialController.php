<?php

namespace App\Http\Controllers;

use App\Models\TrainingMaterial;
use App\Models\Training;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Response;

class TrainingMaterialController extends Controller
{
    public function store(Request $request, Training $training)
    {
        $user = auth()->user();
        if ($user->role !== 'admin' && $user->employee_id && $training->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access.');
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'file' => 'required|file|max:10240', // 10MB max
            'is_mandatory' => 'boolean',
        ]);

        $file = $request->file('file');
        $path = $file->store('training-materials', 'public');

        TrainingMaterial::create([
            'training_id' => $training->id,
            'company_id' => $training->company_id,
            'title' => $request->title,
            'description' => $request->description,
            'file_path' => $path,
            'file_type' => $file->getClientOriginalExtension(),
            'file_size' => $file->getSize(),
            'is_mandatory' => $request->is_mandatory ?? false,
            'uploaded_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Material uploaded successfully!');
    }

    public function download(TrainingMaterial $material)
    {
        // Check access
        $user = auth()->user();

        if ($user->role !== 'admin' && $user->employee_id && $material->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access.');
        }

        if ($user->role === 'employee') {
            // Record view/download for progress tracking
            $this->recordMaterialView($material, $user->employee_id);
        }

        if (!Storage::disk('public')->exists($material->file_path)) {
            abort(404, 'File not found.');
        }

        return Storage::disk('public')->download($material->file_path, $material->title . '.' . $material->file_type);
    }

    public function destroy(TrainingMaterial $material)
    {
        $user = auth()->user();
        if ($user->role !== 'admin' && $user->employee_id && $material->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access.');
        }

        if ($user->role === 'employee') {
            abort(403, 'Unauthorized access.');
        }

        if (Storage::disk('public')->exists($material->file_path)) {
            Storage::disk('public')->delete($material->file_path);
        }

        $material->delete();

        return redirect()->back()->with('success', 'Material deleted successfully!');
    }

    private function recordMaterialView($material, $employeeId)
    {
        $assignment = \App\Models\TrainingAssignment::where('training_id', $material->training_id)
            ->where('employee_id', $employeeId)
            ->first();

        if ($assignment) {
            $viewed = $assignment->materials_viewed ?? [];
            if (!in_array($material->id, $viewed)) {
                $viewed[] = $material->id;
                $assignment->materials_viewed = $viewed; // Set attribute directly
                $assignment->save(); // Save to persist materials_viewed before recalculating

                $assignment->recalculateProgress();
            }
        }
    }
}
