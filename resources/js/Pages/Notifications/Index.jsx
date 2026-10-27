import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    FiBell,
    FiCheck,
    FiCheckCircle,
    FiClock,
    FiExternalLink,
    FiFilter,
    FiInbox,
    FiSearch,
    FiTrash2,
    FiAward,
    FiCalendar,
    FiDollarSign,
    FiFileText,
    FiAlertCircle,
    FiBriefcase,
} from 'react-icons/fi';

export default function Index({ notifications, filters = {}, stats = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const currentFilter = filters.filter || 'all';

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route('notifications.index'),
            { filter: currentFilter, search },
            { preserveState: true }
        );
    };

    const handleFilterChange = (filter) => {
        router.get(
            route('notifications.index'),
            { filter, search },
            { preserveState: true }
        );
    };

    const markAsRead = (id) => {
        router.post(route('notifications.markAsRead', id), {}, { preserveScroll: true });
    };

    const markAllAsRead = () => {
        router.post(route('notifications.markAllAsRead'), {}, { preserveScroll: true });
    };

    const clearRead = () => {
        if (confirm('Are you sure you want to clear all read notifications?')) {
            router.post(route('notifications.clearRead'), {}, { preserveScroll: true });
        }
    };

    const deleteNotification = (id) => {
        router.delete(route('notifications.destroy', id), { preserveScroll: true });
    };

    const getIconAndStyle = (type) => {
        switch (type) {
            case 'task_assigned':
            case 'task_comment':
                return {
                    icon: <FiFileText className="w-5 h-5 text-teal-600" />,
                    bg: 'bg-teal-50 border-teal-100',
                };
            case 'salary_generated':
            case 'salary_approved':
                return {
                    icon: <FiDollarSign className="w-5 h-5 text-emerald-600" />,
                    bg: 'bg-emerald-50 border-emerald-100',
                };
            case 'leave_requested':
            case 'leave_status_updated':
                return {
                    icon: <FiCalendar className="w-5 h-5 text-purple-600" />,
                    bg: 'bg-purple-50 border-purple-100',
                };
            case 'shift_roster_created':
            case 'shift_roster_approved':
                return {
                    icon: <FiClock className="w-5 h-5 text-sky-600" />,
                    bg: 'bg-sky-50 border-sky-100',
                };
            case 'appraisal_initiated':
            case 'appraisal_approved':
                return {
                    icon: <FiAward className="w-5 h-5 text-indigo-600" />,
                    bg: 'bg-indigo-50 border-indigo-100',
                };
            case 'loan_requested':
            case 'loan_status_updated':
            case 'advance_requested':
            case 'advance_status_updated':
                return {
                    icon: <FiDollarSign className="w-5 h-5 text-amber-600" />,
                    bg: 'bg-amber-50 border-amber-100',
                };
            case 'grievance_submitted':
            case 'grievance_status_updated':
                return {
                    icon: <FiAlertCircle className="w-5 h-5 text-rose-600" />,
                    bg: 'bg-rose-50 border-rose-100',
                };
            default:
                return {
                    icon: <FiBell className="w-5 h-5 text-slate-600" />,
                    bg: 'bg-slate-100 border-slate-200',
                };
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="System Notifications Hub" />

            <div className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
                                <FiBell className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                    Notification Center
                                </h1>
                                <p className="text-xs text-slate-500 font-medium">
                                    Official workflow directives, real-time alerts & approvals
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {stats.unread > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all shadow-xs"
                            >
                                <FiCheckCircle className="w-4 h-4" />
                                Mark All as Read
                            </button>
                        )}
                        <button
                            onClick={clearRead}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                        >
                            <FiTrash2 className="w-4 h-4 text-slate-500" />
                            Clear Read
                        </button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Tabs */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => handleFilterChange('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                currentFilter === 'all'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            All ({stats.total || 0})
                        </button>
                        <button
                            onClick={() => handleFilterChange('unread')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                currentFilter === 'unread'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Unread
                            {stats.unread > 0 && (
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                    currentFilter === 'unread' ? 'bg-white text-indigo-600' : 'bg-indigo-100 text-indigo-700'
                                }`}>
                                    {stats.unread}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="relative w-full sm:w-72">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search alerts & messages..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </form>
                </div>

                {/* Notifications List */}
                <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden divide-y divide-slate-100">
                    {notifications?.data && notifications.data.length > 0 ? (
                        notifications.data.map((item) => {
                            const { icon, bg } = getIconAndStyle(item.data?.type);
                            return (
                                <div
                                    key={item.id}
                                    className={`p-4 sm:p-5 transition-colors flex flex-col sm:flex-row items-start justify-between gap-4 ${
                                        item.is_unread ? 'bg-indigo-50/20' : 'hover:bg-slate-50/70'
                                    }`}
                                >
                                    <div className="flex items-start gap-3.5 min-w-0">
                                        <div className={`p-2.5 rounded-xl border shrink-0 ${bg}`}>
                                            {icon}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                    {item.data?.type?.replace(/_/g, ' ') || 'Notice'}
                                                </span>
                                                {item.is_unread && (
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white">
                                                        New
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-slate-400">
                                                    • {item.created_at}
                                                </span>
                                            </div>
                                            {item.data?.title && (
                                                <h3 className="text-sm font-bold text-slate-900 mb-0.5">
                                                    {item.data.title}
                                                </h3>
                                            )}
                                            <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                                                {item.data?.message}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto justify-end pt-2 sm:pt-0">
                                        {item.data?.action_url && (
                                            <Link
                                                href={item.data.action_url}
                                                onClick={() => item.is_unread && markAsRead(item.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-[11px] font-bold shadow-xs transition-all"
                                            >
                                                <span>View</span>
                                                <FiExternalLink className="w-3 h-3" />
                                            </Link>
                                        )}
                                        {item.is_unread && (
                                            <button
                                                onClick={() => markAsRead(item.id)}
                                                title="Mark as read"
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                            >
                                                <FiCheck className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(item.id)}
                                            title="Delete notification"
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-16 text-center">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                <FiInbox className="w-7 h-7" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-700">No Notifications Found</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                You are all caught up! New directives, approvals, and reminders will appear here in real time.
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {notifications?.links && notifications.links.length > 3 && (
                    <div className="mt-6 flex justify-center">
                        <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-xs">
                            {notifications.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        link.active
                                            ? 'bg-slate-900 text-white'
                                            : link.url
                                            ? 'text-slate-600 hover:bg-slate-100'
                                            : 'text-slate-300 pointer-events-none'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
