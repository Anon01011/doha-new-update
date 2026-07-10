<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        // Only admin can view audit logs
        $user = auth()->user();
        if ($user->role !== 'admin' && !$user->hasPermission('view-audit-logs')) {
            abort(403, 'Unauthorized. You do not have permission to view audit logs.');
        }

        $query = AuditLog::with('user');

        // Filters
        if ($request->has('event') && $request->event) {
            $query->where('event', $request->event);
        }

        if ($request->has('auditable_type') && $request->auditable_type) {
            $query->where('auditable_type', $request->auditable_type);
        }

        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('auditable_type', 'like', "%{$search}%")
                    ->orWhere('event', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $auditLogs = $query->latest()->paginate(20);

        // Get unique model types for filter
        $modelTypes = AuditLog::select('auditable_type')
            ->distinct()
            ->pluck('auditable_type')
            ->map(function ($type) {
                return [
                    'value' => $type,
                    'label' => class_basename($type),
                ];
            });

        // Get users for filter
        $users = \App\Models\User::orderBy('name')->get(['id', 'name', 'email']);

        return Inertia::render('AuditLogs/Index', [
            'auditLogs' => $auditLogs,
            'modelTypes' => $modelTypes,
            'users' => $users,
            'filters' => $request->only(['event', 'auditable_type', 'user_id', 'start_date', 'end_date', 'search']),
        ]);
    }

    public function show(AuditLog $auditLog)
    {
        // Only admin can view audit logs
        $user = auth()->user();
        if ($user->role !== 'admin' && !$user->hasPermission('view-audit-logs')) {
            abort(403, 'Unauthorized. You do not have permission to view audit logs.');
        }

        $auditLog->load('user', 'auditable');

        return Inertia::render('AuditLogs/Show', [
            'auditLog' => $auditLog,
        ]);
    }
}
