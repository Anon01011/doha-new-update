<?php

namespace App\Http\Controllers;

use App\Models\TrainingSession;
use App\Models\Training;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TrainingSessionController extends Controller
{
    public function store(Request $request, Training $training)
    {
        $user = auth()->user();
        if ($user->role === 'employee') {
            abort(403, 'Unauthorized access.');
        }

        if ($user->role !== 'admin' && $user->employee_id && $training->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access to another branch.');
        }

        $validated = $request->validate([
            'session_date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'location' => 'nullable|string|max:255',
        ]);

        $training->sessions()->create($validated);

        return redirect()->back()->with('success', 'Session added successfully!');
    }

    public function update(Request $request, TrainingSession $session)
    {
        $user = auth()->user();
        if ($user->role === 'employee') {
            abort(403, 'Unauthorized access.');
        }

        if ($user->role !== 'admin' && $user->employee_id && $session->training->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access to another branch.');
        }

        $validated = $request->validate([
            'session_date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'location' => 'nullable|string|max:255',
        ]);

        $session->update($validated);

        return redirect()->back()->with('success', 'Session updated successfully!');
    }

    public function destroy(TrainingSession $session)
    {
        $user = auth()->user();
        if ($user->role === 'employee') {
            abort(403, 'Unauthorized access.');
        }

        if ($user->role !== 'admin' && $user->employee_id && $session->training->company_id != $user->employee->company_id) {
            abort(403, 'Unauthorized access to another branch.');
        }

        $session->delete();

        return redirect()->back()->with('success', 'Session deleted successfully!');
    }
}
