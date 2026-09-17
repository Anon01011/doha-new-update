import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    FiUserMinus, FiPlus, FiClock, FiCheckCircle, FiAlertCircle,
    FiFilter, FiCalendar, FiChevronRight, FiUsers, FiTrendingDown,
    FiSearch, FiEye, FiXCircle
} from 'react-icons/fi';

const STATUS_COLORS = {
    draft: 'bg-slate-100 text-slate-600',
    pending_approval: 'bg-amber-50 text-amber-700 border border-amber-200',
    approved: 'bg-blue-50 text-blue-700 border border-blue-200',
    in_progress: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    clearance_pending: 'bg-purple-50 text-purple-700 border border-purple-200',
    exit_interview_pending: 'bg-sky-50 text-sky-700 border border-sky-200',
    settlement_pending: 'bg-orange-50 text-orange-700 border border-orange-200',
    completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const STATUS_LABELS = {
    draft: 'Draft',
    pending_approval: 'Pending Approval',
    approved: 'Approved',
    in_progress: 'In Progress',
    clearance_pending: 'Clearance Pending',
    exit_interview_pending: 'Exit Interview',
    settlement_pending: 'Settlement Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

const REASON_LABELS = {
    resignation: 'Resignation',
    retirement: 'Retirement',
    termination: 'Termination',
    contract_completion: 'Contract Completion',
    redundancy: 'Redundancy',
    mutual_separation: 'Mutual Separation',
    absconding: 'Absconding',
    other: 'Other',
};

export default function Index({ requests, summary, companies = [], departments = [], filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [reason, setReason] = useState(filters.reason || '');
    const [company, setCompany] = useState(filters.company || filters.company_id || '');
    const [department, setDepartment] = useState(filters.department || filters.department_id || '');
    const [year, setYear] = useState(filters.year || new Date().getFullYear());

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('offboarding.index'), {
            search,
            status,
            reason,
            company_id: company,
            department_id: department,
            year
        }, { preserveState: true });
    };

    const kpis = [
        { label: 'Total Separations', value: summary.total, icon: FiUserMinus, color: 'bg-slate-100 text-slate-700' },
        { label: 'Pending Approval', value: summary.pending_approval, icon: FiClock, color: 'bg-amber-50 text-amber-700' },
        { label: 'In Progress', value: summary.in_progress, icon: FiAlertCircle, color: 'bg-indigo-50 text-indigo-700' },
        { label: 'Upcoming (30 Days)', value: summary.upcoming_30, icon: FiCalendar, color: 'bg-rose-50 text-rose-700' },
        { label: 'Completed (Month)', value: summary.completed_month, icon: FiCheckCircle, color: 'bg-emerald-50 text-emerald-700' },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Offboarding" />

            {/* In-Page Header */}
            <div className="w-full bg-white border-b border-slate-100 px-3 sm:px-6 lg:px-8 py-3.5 sm:py-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-lg sm:text-xl font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                            <FiUserMinus className="text-rose-500 shrink-0" /> Employee Offboarding
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">Manage employee separation, clearance, exit interviews & final settlements</p>
                    </div>
                    <Link
                        href={route('offboarding.create')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all w-full sm:w-auto"
                    >
                        <FiPlus className="w-4 h-4" /> Initiate Separation
                    </Link>
                </div>
            </div>

            <div className="w-full p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">

                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
                    {kpis.map((k) => (
                        <div key={k.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3.5 sm:p-4 flex items-center gap-3 min-w-0">
                            <div className={`p-2 sm:p-2.5 rounded-lg ${k.color} shrink-0`}>
                                <k.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wide font-medium truncate">{k.label}</p>
                                <p className="text-lg sm:text-2xl font-bold text-slate-800 truncate">{k.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3.5 sm:p-4">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
                        <div className="relative md:col-span-2">
                            <FiSearch className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search employee name or code…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-rose-400"
                            />
                        </div>
                        {companies.length > 0 && (
                            <select value={company} onChange={(e) => setCompany(e.target.value)} className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-rose-400">
                                <option value="">All Companys / Branches</option>
                                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        )}
                        {departments.length > 0 && (
                            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-rose-400">
                                <option value="">All Departments</option>
                                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        )}
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-rose-400">
                            <option value="">All Statuses</option>
                            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-rose-400">
                            <option value="">All Reasons</option>
                            {Object.entries(REASON_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-rose-400">
                            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button type="submit" className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-all">
                            <FiFilter className="w-3.5 h-3.5" /> Filter
                        </button>
                    </form>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                    <th className="py-3.5 px-4">Employee</th>
                                    <th className="py-3.5 px-4">Reason</th>
                                    <th className="py-3.5 px-4">Last Working Day</th>
                                    <th className="py-3.5 px-4">Tasks</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-slate-600">
                                {requests.data && requests.data.length > 0 ? requests.data.map((req) => {
                                    const completedTasks = req.tasks?.filter(t => t.status === 'completed').length || 0;
                                    const totalTasks = req.tasks?.length || 0;
                                    return (
                                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-slate-800">{req.employee?.name}</p>
                                                    {req.request_number && (
                                                        <span className="font-mono text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">
                                                            {req.request_number}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400">{req.employee?.employee_code} · {req.employee?.department?.name}</p>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                                                    {REASON_LABELS[req.separation_reason] || req.separation_reason}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-slate-700">
                                                {req.proposed_last_working_day
                                                    ? new Date(req.proposed_last_working_day).toLocaleDateString('en-IN')
                                                    : '-'}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {totalTasks > 0 ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-20 h-1.5 bg-slate-100 rounded-full">
                                                            <div
                                                                className="h-1.5 bg-emerald-400 rounded-full transition-all"
                                                                style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] text-slate-500">{completedTasks}/{totalTasks}</span>
                                                    </div>
                                                ) : <span className="text-[10px] text-slate-400">No tasks</span>}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[req.status] || 'bg-slate-100 text-slate-600'}`}>
                                                    {STATUS_LABELS[req.status] || req.status}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <Link
                                                    href={route('offboarding.show', req.request_number || req.id)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-medium bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg transition-all"
                                                >
                                                    <FiEye className="w-3 h-3" /> View
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-slate-400 text-xs">
                                            <FiUserMinus className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                                            No offboarding requests found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {requests.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                            <p className="text-[10px] text-slate-400">
                                Showing {requests.from}–{requests.to} of {requests.total}
                            </p>
                            <div className="flex gap-1">
                                {requests.links?.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        className={`px-2.5 py-1 text-[10px] rounded ${link.active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} disabled:opacity-40`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
