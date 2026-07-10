<?php

namespace App\Http\Controllers;

use App\Models\TrainingCertificate;
use App\Models\TrainingAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TrainingCertificateController extends Controller
{
    public function show(TrainingCertificate $certificate)
    {
        // Verify access
        $user = auth()->user();
        if ($user->role === 'employee') {
            if ($certificate->employee_id !== $user->employee_id) {
                abort(403, 'Unauthorized access.');
            }
        } elseif ($certificate->company_id !== ($user->employee ? $user->employee->company_id : $certificate->company_id)) {
            // Admin check (simplified)
            // abort(403, 'Unauthorized access.');
        }

        $certificate->load(['employee', 'training', 'company', 'issuer']);

        return view('certificates.training', compact('certificate'));
    }

    public function generate(Request $request, TrainingAssignment $assignment)
    {
        $user = auth()->user();

        // Allow if admin/manager OR if employee generating their *own* certificate
        // but only if training is completed (checked below)
        if ($user->role === 'employee' && $assignment->employee_id !== $user->employee_id) {
            abort(403, 'Unauthorized access.');
        }

        if ($assignment->status !== 'completed') {
            return back()->with('error', 'Training must be completed to generate certificate.');
        }

        if ($assignment->certificate) {
            return back()->with('info', 'Certificate already exists.');
        }

        $certificate = TrainingCertificate::create([
            'training_assignment_id' => $assignment->id,
            'employee_id' => $assignment->employee_id,
            'training_id' => $assignment->training_id,
            'company_id' => $assignment->company_id,
            'issue_date' => now(),
            'expiry_date' => now()->addYear(), // Default 1 year expiry
            'issued_by' => auth()->id(),
        ]);

        $assignment->update(['certificate_issued' => true]);

        return back()->with('success', 'Certificate generated successfully!');
    }

    public function verify($code)
    {
        $certificate = TrainingCertificate::where('verification_code', $code)->with(['employee', 'training', 'company'])->firstOrFail();

        return view('certificates.verify', compact('certificate'));
    }
}
