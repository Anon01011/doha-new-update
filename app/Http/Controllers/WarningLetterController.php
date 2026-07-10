<?php

namespace App\Http\Controllers;

use App\Models\WarningLetter;
use App\Models\Employee;
use App\Models\Grievance;
use App\Mail\WarningLetterMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class WarningLetterController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = WarningLetter::with(['employee', 'sender', 'grievance']);

        // BelongsToCompany handles branch isolation.

        if (!$user->isAdmin() && !$user->hasPermission('view-warning-letters')) {
            // Employees see only their own
            $query->where('employee_id', $user->employee_id);
        }

        // Search and filters
        $search = $request->query('search');
        $type = $request->query('type');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%")
                    ->orWhereHas('employee', function ($emp) use ($search) {
                        $emp->where('name', 'like', "%{$search}%")
                            ->orWhere('employee_code', 'like', "%{$search}%");
                    });
            });
        }

        if ($type) {
            $query->where('type', $type);
        }

        $warningLetters = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('WarningLetters/Index', [
            'warningLetters' => $warningLetters,
            'filters' => [
                'search' => $search,
                'type' => $type,
            ],
            'userRole' => $user->role,
        ]);
    }

    public function show(WarningLetter $warningLetter)
    {
        $user = Auth::user();

        // BelongsToCompany handles branch isolation.
        if (!$user->isAdmin() && !$user->hasPermission('view-warning-letters')) {
             if ($warningLetter->employee_id != $user->employee_id) {
                  abort(403, 'Unauthorized.');
             }
        }

        $warningLetter->load(['employee', 'sender', 'grievance']);

        return Inertia::render('WarningLetters/Show', [
            'warningLetter' => $warningLetter,
            'userRole' => $user->role,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->hasPermission('manage-warning-letters')) {
            abort(403, 'Unauthorized access.');
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'grievance_id' => 'nullable|exists:grievances,id',
            'type' => 'required|string',
            'subject' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);

        // BelongsToCompany handles isolation check during save/query.

        $warningLetter = WarningLetter::create([
            'company_id' => $employee->company_id,
            'employee_id' => $validated['employee_id'],
            'grievance_id' => $validated['grievance_id'] ?? null,
            'type' => $validated['type'],
            'subject' => $validated['subject'],
            'content' => $validated['content'],
            'sent_by' => $user->id,
            'sent_at' => now(),
        ]);

        // Send Email
        if ($employee->email) {
            try {
                Mail::to($employee->email)->send(new WarningLetterMail($warningLetter));
            } catch (\Exception $e) {
                \Log::error('Failed to send warning letter email: ' . $e->getMessage());
            }
        }

        // Send Database Notification
        $this->notifyEmployee($employee->id, new \App\Notifications\WarningLetterIssued($warningLetter));

        return back()->with('success', 'Warning letter sent successfully.');
    }
    /**
     * Helper to notify employee
     */
    private function notifyEmployee($employeeId, $notification)
    {
        $employee = Employee::find($employeeId);
        if ($employee && $employee->user) {
            try {
                $employee->user->notify($notification);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Notification failed: ' . $e->getMessage());
            }
        }
    }
}
