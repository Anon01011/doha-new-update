<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    /**
     * Display a paginated notification history center.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $filter = $request->query('filter', 'all'); // 'all' or 'unread'
        $search = $request->query('search', '');

        $query = $user->notifications();

        if ($filter === 'unread') {
            $query->whereNull('read_at');
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('data', 'like', "%{$search}%");
            });
        }

        $companyId = $user->company_id ?: $user->employee?->company_id;
        $notifications = $query->paginate(15)->through(function ($n) use ($companyId) {
            return [
                'id'         => $n->id,
                'data'       => $n->data,
                'read_at'    => $n->read_at,
                'is_unread'  => is_null($n->read_at),
                'created_at' => $n->created_at->diffForHumans(),
                'timestamp'  => \App\Helpers\TimeHelper::inTz($n->created_at, $companyId)->format('d M Y, h:i A'),
            ];
        });

        $totalCount  = $user->notifications()->count();
        $unreadCount = $user->unreadNotifications()->count();

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'filters'       => [
                'filter' => $filter,
                'search' => $search,
            ],
            'stats'         => [
                'total'  => $totalCount,
                'unread' => $unreadCount,
            ],
        ]);
    }

    /**
     * Mark an individual notification as read.
     */
    public function markAsRead(Request $request, $id)
    {
        $notification = auth()->user()->notifications()->where('id', $id)->first();
        if ($notification && is_null($notification->read_at)) {
            $notification->markAsRead();
        }
        return back();
    }

    /**
     * Mark all notifications as read for current user.
     */
    public function markAllAsRead(Request $request)
    {
        auth()->user()->unreadNotifications->markAsRead();
        return back()->with('success', 'All notifications marked as read.');
    }

    /**
     * Delete an individual notification.
     */
    public function destroy(Request $request, $id)
    {
        $notification = auth()->user()->notifications()->where('id', $id)->first();
        if ($notification) {
            $notification->delete();
        }
        return back()->with('success', 'Notification removed.');
    }

    /**
     * Clear all read notifications.
     */
    public function clearRead(Request $request)
    {
        auth()->user()->readNotifications()->delete();
        return back()->with('success', 'Read notifications cleared.');
    }

    /**
     * Real-time polling endpoint for the top app bar.
     * Lightweight JSON response with unread count, latest 15 notifications, and latest item.
     */
    public function poll(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json([
                'unreadCount' => 0,
                'notifications' => [],
                'latest' => null,
            ]);
        }

        $totalUnreadCount = $user->unreadNotifications()->count();
        $unread = $user->unreadNotifications()
            ->latest()
            ->take(15)
            ->get();

        $companyId = $user->company_id ?: $user->employee?->company_id;
        $notifications = $unread->map(fn($n) => [
            'id' => $n->id,
            'data' => $n->data,
            'created_at' => $n->created_at->diffForHumans(),
            'timestamp' => \App\Helpers\TimeHelper::inTz($n->created_at, $companyId)->format('h:i A'),
            'read_at' => $n->read_at,
        ]);

        return response()->json([
            'unreadCount' => $totalUnreadCount,
            'notifications' => $notifications,
            'latest' => $notifications->first() ?: null,
        ]);
    }
}
