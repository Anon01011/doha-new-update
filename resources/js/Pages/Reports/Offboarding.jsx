import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    FiArrowLeft, FiDownload, FiFileText, FiFilter,
    FiTrendingUp, FiPieChart, FiUsers, FiTag, FiBriefcase,
    FiAlertTriangle, FiCheckCircle, FiDollarSign, FiCalendar,
    FiClock, FiShield, FiBarChart2, FiUserMinus, FiStar, FiPrinter,
    FiEye, FiCheck, FiX, FiActivity
} from 'react-icons/fi';

export default function OffboardingReport({
    requests = [],
    upcoming = [],
    summary = {},
    byReason = {},
    monthlyTrend = [],
    pendingTasksByRole = {},
    avgRatings = {},
    year,
    status,
    reason,
    companies = [],
    companyId = '',
}) {
    const [selectedYear, setSelectedYear] = useState(year || new Date().getFullYear());
    const [selectedStatus, setSelectedStatus] = useState(status || '');
    const [selectedReason, setSelectedReason] = useState(reason || '');
    const [selectedCompany, setSelectedCompany] = useState(companyId || '');
    const [activeTab, setActiveTab] = useState('all'); // all, upcoming, reasons, tasks, exit_interviews, trend

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('reports.offboarding'), {
            year: selectedYear,
            status: selectedStatus,
            reason: selectedReason,
            company_id: selectedCompany,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        const params = new URLSearchParams({
            year: selectedYear,
            status: selectedStatus,
            reason: selectedReason,
            company_id: selectedCompany,
        });
        window.open(`${route('reports.offboarding.export.excel')}?${params.toString()}`, '_blank');
    };

    const tabs = [
        { id: 'all', label: `All Requests (${requests.length})`, icon: FiFileText },
        { id: 'upcoming', label: `Upcoming (30 Days) (${upcoming.length})`, icon: FiClock },
        { id: 'reasons', label: 'Reason Analysis', icon: FiPieChart },
        { id: 'tasks', label: 'Department Clearance', icon: FiShield },
        { id: 'exit_interviews', label: 'Exit Feedback & Ratings', icon: FiStar },
        { id: 'trend', label: 'Turnover Trend', icon: FiTrendingUp },
    ];

    const getReasonBadge = (r) => {
        const badges = {
            resignation: 'bg-amber-50 text-amber-700 border-amber-200',
            retirement: 'bg-purple-50 text-purple-700 border-purple-200',
            termination: 'bg-rose-50 text-rose-700 border-rose-200',
            contract_completion: 'bg-blue-50 text-blue-700 border-blue-200',
            redundancy: 'bg-orange-50 text-orange-700 border-orange-200',
            mutual_separation: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            absconding: 'bg-red-50 text-red-700 border-red-200',
            other: 'bg-slate-50 text-slate-700 border-slate-200',
        };
        return badges[r] || 'bg-slate-50 text-slate-700 border-slate-200';
    };

    const getStatusBadge = (s) => {
        const badges = {
            draft: 'bg-slate-100 text-slate-600',
            pending_approval: 'bg-amber-100 text-amber-700',
            approved: 'bg-blue-100 text-blue-700',
            in_progress: 'bg-indigo-100 text-indigo-700',
            clearance_pending: 'bg-purple-100 text-purple-700',
            exit_interview_pending: 'bg-yellow-100 text-yellow-800',
            settlement_pending: 'bg-cyan-100 text-cyan-800',
            completed: 'bg-emerald-100 text-emerald-700',
            cancelled: 'bg-rose-100 text-rose-700',
        };
        return badges[s] || 'bg-slate-100 text-slate-600';
    };

    const reasonLabels = {
        resignation: 'Resignation',
        retirement: 'Retirement',
        termination: 'Termination',
        contract_completion: 'Contract Completion',
        redundancy: 'Redundancy',
        mutual_separation: 'Mutual Separation',
        absconding: 'Absconding',
        other: 'Other',
    };

    const formatINR = (val) => {
        return '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    };

    const renderRatingStars = (rating) => {
        const r = Number(rating || 0);
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                        key={star}
                        className={`w-3.5 h-3.5 ${star <= Math.round(r) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                            }`}
                    />
                ))}
                <span className="text-xs font-medium text-slate-700 ml-1">{r ? r.toFixed(1) : 'N/A'}</span>
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Offboarding & Separation Reports" />

            {/* In-Page Header */}
            <div className="w-full bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('reports.index')}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Employee Separation & Offboarding Analytics</h1>
                            <p className="text-xs text-slate-500 font-normal mt-0.5">Comprehensive audit reports across separations, clearance workflows, turnover rates, and exit interviews</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportExcel}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                        >
                            <FiDownload className="w-3.5 h-3.5" />
                            Export Excel
                        </button>
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                        >
                            <FiPrinter className="w-3.5 h-3.5" />
                            Print Report
                        </button>
                        <Link
                            href={route('offboarding.index')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                        >
                            <FiUserMinus className="w-3.5 h-3.5" />
                            Offboarding Desk
                        </Link>
                    </div>
                </div>
            </div>

            <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Total Separations</span>
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <FiUserMinus className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 text-2xl font-bold text-slate-800">{summary.total || 0}</div>
                        <div className="text-[11px] text-slate-400 mt-1">Calendar Year {selectedYear}</div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Pending Approvals</span>
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                <FiClock className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 text-2xl font-bold text-amber-600">{summary.pending_approval || 0}</div>
                        <div className="text-[11px] text-slate-400 mt-1">Awaiting HR/Manager</div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">In-Progress Clearance</span>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <FiActivity className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 text-2xl font-bold text-blue-600">{summary.in_progress || 0}</div>
                        <div className="text-[11px] text-slate-400 mt-1">Active clearance pipeline</div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Upcoming (30d)</span>
                            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                                <FiCalendar className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 text-2xl font-bold text-rose-600">{summary.upcoming_30 || 0}</div>
                        <div className="text-[11px] text-slate-400 mt-1">Last working day soon</div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Completed Records</span>
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <FiCheckCircle className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 text-2xl font-bold text-emerald-600">{summary.completed || 0}</div>
                        <div className="text-[11px] text-slate-400 mt-1">Settled & Closed</div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Rehire Eligible</span>
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <FiStar className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 text-2xl font-bold text-purple-600">
                            {summary.rehire_eligible || 0} / {summary.exit_interviews || 0}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                            {summary.exit_interviews ? Math.round((summary.rehire_eligible / summary.exit_interviews) * 100) : 0}% positive exit
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Year</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full text-xs rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                {[...Array(5)].map((_, i) => {
                                    const y = new Date().getFullYear() - 2 + i;
                                    return <option key={y} value={y}>{y}</option>;
                                })}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full text-xs rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending_approval">Pending Approval</option>
                                <option value="approved">Approved</option>
                                <option value="in_progress">In Progress</option>
                                <option value="clearance_pending">Clearance Pending</option>
                                <option value="exit_interview_pending">Exit Interview Pending</option>
                                <option value="settlement_pending">Settlement Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Reason</label>
                            <select
                                value={selectedReason}
                                onChange={(e) => setSelectedReason(e.target.value)}
                                className="w-full text-xs rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">All Reasons</option>
                                <option value="resignation">Resignation</option>
                                <option value="retirement">Retirement</option>
                                <option value="termination">Termination</option>
                                <option value="contract_completion">Contract Completion</option>
                                <option value="redundancy">Redundancy</option>
                                <option value="mutual_separation">Mutual Separation</option>
                                <option value="absconding">Absconding</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {companies.length > 0 && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Company / Company</label>
                                <select
                                    value={selectedCompany}
                                    onChange={(e) => setSelectedCompany(e.target.value)}
                                    className="w-full text-xs rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">All Companys</option>
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                            >
                                <FiFilter className="w-3.5 h-3.5" />
                                Apply Filters
                            </button>
                        </div>
                    </form>
                </div>

                {/* Tabs Header */}
                <div className="border-b border-slate-200">
                    <nav className="flex space-x-2 overflow-x-auto pb-1" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                                            ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-sm border-x border-slate-200'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content: All Requests */}
                {activeTab === 'all' && (
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">Master Separation Register</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Showing all separation requests matching criteria</p>
                            </div>
                            <span className="text-xs font-medium text-slate-500">{requests.length} records</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                                    <tr>
                                        <th className="p-3.5">Employee</th>
                                        <th className="p-3.5">Company / Dept</th>
                                        <th className="p-3.5">Reason</th>
                                        <th className="p-3.5">Proposed LWD</th>
                                        <th className="p-3.5">Actual LWD</th>
                                        <th className="p-3.5">Notice Period</th>
                                        <th className="p-3.5">Clearance Progress</th>
                                        <th className="p-3.5">Status</th>
                                        <th className="p-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {requests.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="p-8 text-center text-slate-400">
                                                No offboarding records found for the selected filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        requests.map((r) => {
                                            const totalTasks = r.tasks?.length || 0;
                                            const completedTasks = r.tasks?.filter((t) => t.status === 'completed').length || 0;
                                            const pct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

                                            return (
                                                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="p-3.5">
                                                        <div className="font-semibold text-slate-800">
                                                            {r.employee?.name || (r.employee ? `${r.employee.first_name || ''} ${r.employee.last_name || ''}`.trim() : 'N/A')}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400">{r.employee?.employee_code || `#${r.employee_id}`}</div>
                                                    </td>
                                                    <td className="p-3.5 text-slate-600">
                                                        <div>{r.employee?.company?.name || '—'}</div>
                                                        <div className="text-[11px] text-slate-400">{r.employee?.department?.name || '—'}</div>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${getReasonBadge(r.separation_reason)}`}>
                                                            {reasonLabels[r.separation_reason] || r.separation_reason}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-slate-700 font-medium">
                                                        {r.proposed_last_working_day ? new Date(r.proposed_last_working_day).toLocaleDateString('en-GB') : '—'}
                                                    </td>
                                                    <td className="p-3.5 text-slate-600">
                                                        {r.actual_last_working_day ? new Date(r.actual_last_working_day).toLocaleDateString('en-GB') : '—'}
                                                    </td>
                                                    <td className="p-3.5 text-slate-600">
                                                        {r.notice_period_days || 0} days
                                                        {r.notice_pay_applicable && (
                                                            <span className="block text-[10px] text-indigo-600 font-medium">Notice Pay ₹</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3.5">
                                                        <div className="w-24">
                                                            <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                                                                <span>{completedTasks}/{totalTasks}</span>
                                                                <span>{pct}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                                <div
                                                                    className={`h-1.5 rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${getStatusBadge(r.status)}`}>
                                                            {r.status.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-right">
                                                        <Link
                                                            href={route('offboarding.show', r.request_number || r.id)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded text-xs transition-colors"
                                                        >
                                                            <FiEye className="w-3.5 h-3.5" />
                                                            View
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab Content: Upcoming Separations (Next 30 Days) */}
                {activeTab === 'upcoming' && (
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-rose-50/30">
                            <div>
                                <h3 className="text-sm font-semibold text-rose-800">Critical: Separations in Next 30 Days</h3>
                                <p className="text-xs text-rose-600 mt-0.5">Employees whose proposed last working day is approaching soon</p>
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">
                                {upcoming.length} Critical
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                                    <tr>
                                        <th className="p-3.5">Employee</th>
                                        <th className="p-3.5">Company / Dept</th>
                                        <th className="p-3.5">Proposed Last Day</th>
                                        <th className="p-3.5">Reason</th>
                                        <th className="p-3.5">Pending Tasks</th>
                                        <th className="p-3.5">Exit Interview</th>
                                        <th className="p-3.5">Status</th>
                                        <th className="p-3.5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {upcoming.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="p-8 text-center text-slate-400">
                                                No separations scheduled in the next 30 days.
                                            </td>
                                        </tr>
                                    ) : (
                                        upcoming.map((r) => {
                                            const pendingCount = r.tasks?.filter((t) => t.status === 'pending').length || 0;
                                            return (
                                                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="p-3.5">
                                                        <div className="font-semibold text-slate-800">
                                                            {r.employee?.name || (r.employee ? `${r.employee.first_name || ''} ${r.employee.last_name || ''}`.trim() : 'N/A')}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400">{r.employee?.employee_code}</div>
                                                    </td>
                                                    <td className="p-3.5 text-slate-600">
                                                        <div>{r.employee?.company?.name || '—'}</div>
                                                        <div className="text-[11px] text-slate-400">{r.employee?.department?.name || '—'}</div>
                                                    </td>
                                                    <td className="p-3.5 font-bold text-rose-600">
                                                        {r.proposed_last_working_day ? new Date(r.proposed_last_working_day).toLocaleDateString('en-GB') : '—'}
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${getReasonBadge(r.separation_reason)}`}>
                                                            {reasonLabels[r.separation_reason] || r.separation_reason}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5">
                                                        {pendingCount > 0 ? (
                                                            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                                <FiAlertTriangle className="w-3 h-3" />
                                                                {pendingCount} Pending
                                                            </span>
                                                        ) : (
                                                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                                                                <FiCheck className="w-3 h-3" /> All Done
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3.5">
                                                        {r.exitInterview ? (
                                                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                                                                <FiCheck className="w-3 h-3" /> Completed
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">Not Conducted</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${getStatusBadge(r.status)}`}>
                                                            {r.status.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-right">
                                                        <Link
                                                            href={route('offboarding.show', r.request_number || r.id)}
                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold rounded text-xs transition-colors"
                                                        >
                                                            Take Action
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab Content: Reason Analysis */}
                {activeTab === 'reasons' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-800 mb-1">Separation Reasons Distribution</h3>
                            <p className="text-xs text-slate-500 mb-4">Breakdown of attrition causes during {selectedYear}</p>

                            <div className="space-y-3">
                                {Object.entries(byReason).map(([rsn, cnt]) => {
                                    const total = summary.total || 1;
                                    const pct = Math.round((cnt / total) * 100);
                                    return (
                                        <div key={rsn} className="space-y-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-medium text-slate-700 capitalize flex items-center gap-1.5">
                                                    <span className={`w-2 h-2 rounded-full ${getReasonBadge(rsn).split(' ')[0]}`} />
                                                    {reasonLabels[rsn] || rsn}
                                                </span>
                                                <span className="font-semibold text-slate-800">{cnt} ({pct}%)</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                {Object.keys(byReason).length === 0 && (
                                    <p className="text-xs text-slate-400 py-6 text-center">No reason data available.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-800 mb-1">HR Attrition Insights</h3>
                            <p className="text-xs text-slate-500 mb-4">Actionable observations for retention & operations</p>

                            <div className="space-y-3 text-xs">
                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                    <div className="font-semibold text-amber-800 flex items-center gap-1.5 mb-1">
                                        <FiAlertTriangle className="w-4 h-4" />
                                        Primary Reason: {Object.keys(byReason)[0] ? reasonLabels[Object.keys(byReason)[0]] : 'N/A'}
                                    </div>
                                    <p className="text-amber-700 leading-relaxed">
                                        The largest contributor to separations is {Object.keys(byReason)[0] ? reasonLabels[Object.keys(byReason)[0]] : 'N/A'} accounting for {summary.total ? Math.round(((Object.values(byReason)[0] || 0) / summary.total) * 100) : 0}% of all exits.
                                    </p>
                                </div>

                                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                                    <div className="font-semibold text-indigo-800 flex items-center gap-1.5 mb-1">
                                        <FiStar className="w-4 h-4" />
                                        Exit Feedback Summary
                                    </div>
                                    <p className="text-indigo-700 leading-relaxed">
                                        Average job satisfaction across completed interviews is {avgRatings.job_satisfaction ? Number(avgRatings.job_satisfaction).toFixed(1) : 'N/A'} / 5.0.
                                    </p>
                                </div>

                                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                                    <div className="font-semibold text-emerald-800 flex items-center gap-1.5 mb-1">
                                        <FiCheckCircle className="w-4 h-4" />
                                        Rehire Eligibility Rate
                                    </div>
                                    <p className="text-emerald-700 leading-relaxed">
                                        {summary.exit_interviews ? Math.round((summary.rehire_eligible / summary.exit_interviews) * 100) : 0}% of separated employees are marked as eligible for rehire.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Content: Department Clearance Tasks */}
                {activeTab === 'tasks' && (
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
                        <h3 className="text-sm font-semibold text-slate-800 mb-1">Pending Clearance Tasks by Department Role</h3>
                        <p className="text-xs text-slate-500 mb-6">Real-time bottleneck overview across HR, IT, Admin, Finance, Security, and Payroll</p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                            {['hr', 'manager', 'it', 'admin', 'finance', 'payroll', 'security'].map((role) => {
                                const cnt = pendingTasksByRole[role] || 0;
                                return (
                                    <div
                                        key={role}
                                        className={`p-4 rounded-xl border transition-all ${cnt > 0 ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50/50 border-slate-200'
                                            }`}
                                    >
                                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                                            {role}
                                        </div>
                                        <div className={`text-2xl font-bold ${cnt > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                            {cnt}
                                        </div>
                                        <div className="text-[11px] text-slate-400 mt-1">
                                            {cnt > 0 ? 'Pending action' : 'Clear'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Tab Content: Exit Feedback & Ratings */}
                {activeTab === 'exit_interviews' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                                <span className="text-xs font-medium text-slate-500">Job Satisfaction</span>
                                <div className="mt-2">{renderRatingStars(avgRatings.job_satisfaction)}</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                                <span className="text-xs font-medium text-slate-500">Management</span>
                                <div className="mt-2">{renderRatingStars(avgRatings.management)}</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                                <span className="text-xs font-medium text-slate-500">Work Environment</span>
                                <div className="mt-2">{renderRatingStars(avgRatings.work_environment)}</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                                <span className="text-xs font-medium text-slate-500">Compensation</span>
                                <div className="mt-2">{renderRatingStars(avgRatings.compensation)}</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                                <span className="text-xs font-medium text-slate-500">Growth Opportunities</span>
                                <div className="mt-2">{renderRatingStars(avgRatings.growth_opportunity)}</div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800">Exit Interview Feedback Log</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Direct insights and suggestions from exiting employees</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                                        <tr>
                                            <th className="p-3.5">Employee</th>
                                            <th className="p-3.5">Reason for Leaving</th>
                                            <th className="p-3.5">Ratings (Avg)</th>
                                            <th className="p-3.5">Improvement Suggestions</th>
                                            <th className="p-3.5">Rehire Eligible</th>
                                            <th className="p-3.5">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {requests.filter((r) => r.exitInterview).length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="p-8 text-center text-slate-400">
                                                    No exit interviews submitted yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            requests.filter((r) => r.exitInterview).map((r) => {
                                                const ei = r.exitInterview;
                                                const avg = (
                                                    ((ei.job_satisfaction_rating || 0) +
                                                        (ei.management_rating || 0) +
                                                        (ei.work_environment_rating || 0) +
                                                        (ei.compensation_rating || 0) +
                                                        (ei.growth_opportunity_rating || 0)) / 5
                                                ).toFixed(1);

                                                return (
                                                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                                                        <td className="p-3.5 font-semibold text-slate-800">
                                                            {r.employee?.name || (r.employee ? `${r.employee.first_name || ''} ${r.employee.last_name || ''}`.trim() : 'N/A')}
                                                        </td>
                                                        <td className="p-3.5 text-slate-700 max-w-xs truncate">
                                                            {ei.reason_for_leaving || '—'}
                                                        </td>
                                                        <td className="p-3.5">
                                                            {renderRatingStars(avg)}
                                                        </td>
                                                        <td className="p-3.5 text-slate-600 max-w-xs truncate">
                                                            {ei.improvement_suggestions || '—'}
                                                        </td>
                                                        <td className="p-3.5">
                                                            {ei.rehire_eligible ? (
                                                                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">
                                                                    <FiCheck className="w-3 h-3" /> Yes
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-rose-200">
                                                                    <FiX className="w-3 h-3" /> No
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-3.5 text-slate-500">
                                                            {ei.conducted_at ? new Date(ei.conducted_at).toLocaleDateString('en-GB') : '—'}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Content: Monthly Turnover Trend */}
                {activeTab === 'trend' && (
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
                        <h3 className="text-sm font-semibold text-slate-800 mb-1">Monthly Separation & Turnover Trend ({selectedYear})</h3>
                        <p className="text-xs text-slate-500 mb-6">Total separations vs completed closures by month</p>

                        <div className="overflow-x-auto">
                            <div className="grid grid-cols-12 gap-2 min-w-[700px]">
                                {monthlyTrend.map((m) => {
                                    const maxVal = Math.max(...monthlyTrend.map((t) => t.total), 5);
                                    const heightPct = Math.round((m.total / maxVal) * 100);

                                    return (
                                        <div key={m.month} className="flex flex-col items-center">
                                            <div className="text-[11px] font-semibold text-slate-700 mb-1">{m.total}</div>
                                            <div className="w-full bg-slate-100 rounded-t-lg h-36 flex flex-col justify-end p-1">
                                                <div
                                                    className="w-full bg-indigo-500 rounded-t transition-all duration-500"
                                                    style={{ height: `${heightPct}%` }}
                                                />
                                            </div>
                                            <div className="text-xs font-semibold text-slate-600 mt-2">{m.month_name}</div>
                                            <div className="text-[10px] text-emerald-600 font-medium">{m.completed} closed</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
