import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import Avatar from '@/Components/Avatar';
import {
    PlusIcon,
    DocumentTextIcon,
    CalendarIcon,
    SparklesIcon,
    QueueListIcon,
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    DocumentMagnifyingGlassIcon,
    ChartBarIcon,
    AcademicCapIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    ArrowDownTrayIcon,
    XMarkIcon,
    BuildingOfficeIcon,
    FunnelIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useState, useMemo, useEffect } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index({ evaluations = { data: [] }, summary = {}, companies = [], departments = [], filters = {} }) {
    const { auth } = usePage().props;
    const user = auth?.user || {};

    const [search, setSearch] = useState(filters.search || '');
    const [companyId, setCompanyId] = useState(filters.company_id || '');
    const [departmentId, setDepartmentId] = useState(filters.department_id || '');
    const [status, setStatus] = useState(filters.status || '');
    const [cycleType, setCycleType] = useState(filters.cycle_type || '');
    const [scoreFilter, setScoreFilter] = useState(filters.score_filter || '');
    const [deleteModal, setDeleteModal] = useState({ show: false, item: null });

    // Synchronize local filter state when Inertia sends updated props
    useEffect(() => {
        setSearch(filters.search || '');
        setCompanyId(filters.company_id || '');
        setDepartmentId(filters.department_id || '');
        setStatus(filters.status || '');
        setCycleType(filters.cycle_type || '');
        setScoreFilter(filters.score_filter || '');
    }, [filters.search, filters.company_id, filters.department_id, filters.status, filters.cycle_type, filters.score_filter]);

    const canCreate = user.role === 'admin' || user.role === 'hr' || (user.permissions && user.permissions.includes('create-evaluations'));
    const canEdit = user.role === 'admin' || user.role === 'hr' || user.role === 'manager' || (user.permissions && user.permissions.includes('edit-evaluations'));
    const canDelete = user.role === 'admin' || user.role === 'hr' || (user.permissions && user.permissions.includes('delete-evaluations'));

    const handleFilterChange = (overrides = {}) => {
        const payload = {
            search,
            company_id: companyId,
            department_id: departmentId,
            status,
            cycle_type: cycleType,
            score_filter: scoreFilter,
            ...overrides,
        };

        // Remove empty or undefined query keys
        Object.keys(payload).forEach((key) => {
            if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
                delete payload[key];
            }
        });

        router.get(route('evaluations.index'), payload, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        handleFilterChange({ search });
    };

    const clearAllFilters = () => {
        setSearch('');
        setCompanyId('');
        setDepartmentId('');
        setStatus('');
        setCycleType('');
        setScoreFilter('');
        router.get(route('evaluations.index'), {}, { preserveState: true, replace: true });
    };

    const hasActiveFilters = Boolean(search || companyId || departmentId || status || cycleType || scoreFilter);

    const getScoreColor = (score) => {
        const num = Number(score) || 0;
        if (num >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
        if (num >= 70) return 'text-indigo-700 bg-indigo-50 border-indigo-200';
        if (num >= 40) return 'text-amber-700 bg-amber-50 border-amber-200';
        return 'text-rose-700 bg-rose-50 border-rose-200';
    };

    const getStatusBadge = (evalStatus, isLocked) => {
        if (isLocked || evalStatus === 'approved') {
            return (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md inline-flex items-center gap-1 shadow-2xs">
                    <CheckCircleIcon className="w-3.5 h-3.5" /> Approved
                </span>
            );
        }
        if (evalStatus === 'self_assessment') {
            return (
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md inline-flex items-center gap-1 shadow-2xs">
                    <ClockIcon className="w-3.5 h-3.5" /> Self Review
                </span>
            );
        }
        if (evalStatus === 'manager_review') {
            return (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md inline-flex items-center gap-1 shadow-2xs">
                    <ClockIcon className="w-3.5 h-3.5" /> Manager Review
                </span>
            );
        }
        if (evalStatus === 'acknowledged') {
            return (
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md inline-flex items-center gap-1 shadow-2xs">
                    <CheckCircleIcon className="w-3.5 h-3.5" /> Acknowledged
                </span>
            );
        }
        return (
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md inline-block shadow-2xs capitalize">
                {evalStatus ? evalStatus.replace('_', ' ') : 'Draft'}
            </span>
        );
    };

    const getMonthName = (monthNum) => {
        if (!monthNum) return '';
        const num = parseInt(monthNum, 10);
        if (isNaN(num) || num < 1 || num > 12) return monthNum;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[num - 1];
    };

    const confirmDelete = () => {
        if (!deleteModal.item) return;
        const targetId = deleteModal.item.reference_no || deleteModal.item.id;
        router.delete(route('evaluations.destroy', targetId), {
            onSuccess: () => setDeleteModal({ show: false, item: null }),
        });
    };

    const evalList = evaluations.data || [];

    // Filter status tabs
    const statusTabs = [
        { key: '', label: 'All Reviews', count: summary?.total ?? 0 },
        { key: 'approved', label: 'Approved', count: summary?.approved ?? 0 },
        { key: 'manager_review', label: 'Manager Review', count: summary?.pending_manager ?? 0 },
        { key: 'self_assessment', label: 'Self Review', count: summary?.pending_self ?? 0 },
        { key: 'pip', label: 'Needs Support (PIP)', count: summary?.pip_count ?? 0 },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Performance Appraisals & Reviews" />

            <div className="w-full p-4 sm:p-6 lg:p-8 space-y-5">
                {/* 1. Header Section: Title & Top Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 bg-slate-900 rounded-xl shadow-lg shadow-slate-900/10 flex items-center justify-center shrink-0">
                            <DocumentMagnifyingGlassIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight truncate">
                                Performance Appraisals & Reviews
                            </h1>
                            <p className="text-xs text-slate-500 font-normal mt-0.5 truncate">
                                Track employee reviews, evaluate competency ratings, and manage salary increments.
                            </p>
                        </div>
                    </div>

                    {/* Top Action Buttons (Always Aligned Together on the Right) */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        <Link
                            href={route('reports.evaluation')}
                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 text-xs font-semibold uppercase tracking-wider shadow-2xs"
                        >
                            <ChartBarIcon className="w-4 h-4 text-slate-500" />
                            Analytics Reports
                        </Link>

                        {canCreate && (
                            <Link
                                href={route('evaluations.create')}
                                className="bg-slate-950 hover:bg-slate-900 text-white px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95"
                            >
                                <PlusIcon className="w-4 h-4 stroke-[2.5]" />
                                Initiate Appraisal
                            </Link>
                        )}
                    </div>
                </div>

                {/* 2. Key Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Total Appraisals */}
                    <div
                        onClick={() => {
                            setStatus('');
                            setScoreFilter('');
                            handleFilterChange({ status: '', score_filter: '' });
                        }}
                        className={`bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group ${!status && !scoreFilter ? 'ring-2 ring-slate-900/10' : ''}`}
                    >
                        <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600 group-hover:scale-105 transition-transform shrink-0">
                            <DocumentTextIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5 truncate">Total Appraisals</p>
                            <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                                {summary?.total ?? evaluations?.total ?? 0}
                            </p>
                        </div>
                    </div>

                    {/* Average Score */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4 hover:shadow-md transition-all group">
                        <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600 group-hover:scale-105 transition-transform shrink-0">
                            <ChartBarIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5 truncate">Average Score</p>
                            <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                                {summary?.avg_score ?? 0}%
                            </p>
                        </div>
                    </div>

                    {/* Top Performers */}
                    <div
                        onClick={() => {
                            const next = scoreFilter === 'top' ? '' : 'top';
                            setScoreFilter(next);
                            handleFilterChange({ score_filter: next });
                        }}
                        className={`bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group ${scoreFilter === 'top' ? 'ring-2 ring-emerald-500/20 border-emerald-200 bg-emerald-50/20' : ''}`}
                    >
                        <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 group-hover:scale-105 transition-transform shrink-0">
                            <AcademicCapIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5 truncate">Top Performers</p>
                            <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                                {summary?.top_performers ?? 0}
                            </p>
                        </div>
                    </div>

                    {/* Needs PIP Support */}
                    <div
                        onClick={() => {
                            const next = status === 'pip' ? '' : 'pip';
                            setStatus(next);
                            setScoreFilter('');
                            handleFilterChange({ status: next, score_filter: '' });
                        }}
                        className={`bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group ${status === 'pip' ? 'ring-2 ring-rose-500/20 border-rose-200 bg-rose-50/20' : ''}`}
                    >
                        <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600 group-hover:scale-105 transition-transform shrink-0">
                            <ExclamationTriangleIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5 truncate">Needs PIP Support</p>
                            <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                                {summary?.pip_count ?? 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Dedicated Filter Bar */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {/* Search Input */}
                        <form onSubmit={handleSearchSubmit} className="relative group">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-700 transition-colors pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search by employee, code, or designation..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-slate-50/60 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-2xs"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        handleFilterChange({ search: '' });
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <XMarkIcon className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </form>

                        {/* Companies Dropdown */}
                        {companies.length > 0 && (
                            <select
                                value={companyId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setCompanyId(val);
                                    handleFilterChange({ company_id: val });
                                }}
                                className="w-full bg-slate-50/60 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-2xs"
                            >
                                <option value="">All Companies & Branches</option>
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        )}

                        {/* Departments Dropdown */}
                        {departments.length > 0 && (
                            <select
                                value={departmentId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setDepartmentId(val);
                                    handleFilterChange({ department_id: val });
                                }}
                                className="w-full bg-slate-50/60 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-2xs"
                            >
                                <option value="">All Departments</option>
                                {departments
                                    .filter(d => !companyId || String(d.company_id) === String(companyId))
                                    .map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                            </select>
                        )}

                        {/* Review Cycle Dropdown */}
                        <select
                            value={cycleType}
                            onChange={(e) => {
                                const val = e.target.value;
                                setCycleType(val);
                                handleFilterChange({ cycle_type: val });
                            }}
                            className="w-full bg-slate-50/60 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-2xs"
                        >
                            <option value="">All Review Cycles</option>
                            <option value="annual">Annual Appraisal</option>
                            <option value="half_yearly">Half Yearly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="probation">Probation Review</option>
                        </select>
                    </div>

                    {/* Quick Status Tabs & Clear Option */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <div className="flex flex-wrap items-center gap-1.5">
                            {statusTabs.map((tab) => {
                                const isActive = (status === tab.key) && (!scoreFilter || tab.key !== '');
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => {
                                            setStatus(tab.key);
                                            setScoreFilter('');
                                            handleFilterChange({ status: tab.key, score_filter: '' });
                                        }}
                                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                                            isActive
                                                ? 'bg-slate-950 text-white shadow-2xs'
                                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-white hover:text-slate-900'
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                            isActive ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-600'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearAllFilters}
                                className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-rose-50 transition-colors"
                            >
                                <ArrowPathIcon className="w-3.5 h-3.5" />
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* 4. Appraisal Records Ledger Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Card Sub-header */}
                    <div className="px-5 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 shadow-2xs text-slate-600">
                                <QueueListIcon className="w-4 h-4" />
                            </div>
                            <h3 className="text-xs font-bold text-slate-800 tracking-wide">
                                Appraisal Records
                            </h3>
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                            {evaluations?.total ?? evalList.length} reviews found
                        </span>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950 text-white">
                                    <th className="w-[300px] px-5 py-3.5 text-xs font-semibold tracking-wide border-r border-slate-800/80">Employee</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold tracking-wide border-r border-slate-800/80 text-center">Branch & Department</th>
                                    <th className="w-[160px] px-5 py-3.5 text-xs font-semibold tracking-wide border-r border-slate-800/80 text-center">Review Period & Cycle</th>
                                    <th className="w-[120px] px-5 py-3.5 text-xs font-semibold tracking-wide border-r border-slate-800/80 text-center">Performance Score</th>
                                    <th className="w-[150px] px-5 py-3.5 text-xs font-semibold tracking-wide border-r border-slate-800/80 text-center">Status</th>
                                    <th className="w-[130px] px-5 py-3.5 text-xs font-semibold tracking-wide text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {evalList.map((evalItem) => (
                                    <tr key={evalItem.id} className="hover:bg-slate-50/80 transition-colors group">
                                        {/* Employee Cell */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    src={evalItem.employee?.employee_image || evalItem.employee?.image}
                                                    name={evalItem.employee?.name}
                                                    size="sm"
                                                    className="ring-1 ring-slate-200 group-hover:ring-slate-400 transition-all shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <div className="text-xs font-semibold text-slate-900 leading-tight truncate flex items-center gap-1.5">
                                                        <Link
                                                            href={route('evaluations.show', evalItem)}
                                                            className="hover:underline hover:text-indigo-600 transition-colors"
                                                        >
                                                            {evalItem.employee?.name || 'Unknown Employee'}
                                                        </Link>
                                                        {evalItem.pip_required && (
                                                            <span title="Performance Improvement Plan Active" className="p-0.5 bg-rose-50 text-rose-600 rounded">
                                                                <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] font-normal text-slate-400 mt-1 truncate flex items-center gap-1.5">
                                                        <span>{evalItem.employee?.employee_code || '-'}</span>
                                                        <span>&bull;</span>
                                                        <span>{evalItem.employee?.designation || 'Staff'}</span>
                                                    </div>
                                                    {evalItem.reference_no && (
                                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                            Ref: {evalItem.reference_no}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Branch & Department */}
                                        <td className="px-5 py-3.5 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded tracking-wide">
                                                    {evalItem.employee?.company?.name || 'All Units'}
                                                </span>
                                                <span className="text-[10px] font-normal text-slate-400 mt-1">
                                                    {evalItem.employee?.department?.name || 'General'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Period & Cycle */}
                                        <td className="px-5 py-3.5 text-center">
                                            <div className="inline-flex flex-col items-center gap-1">
                                                <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                                                    <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
                                                    {getMonthName(evalItem.month)} '{String(evalItem.year || '').slice(-2)}
                                                </div>
                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                    {evalItem.cycle_type ? evalItem.cycle_type.replace('_', ' ') : 'Annual'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Overall Performance Score */}
                                        <td className="px-5 py-3.5 text-center">
                                            <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border shadow-2xs font-bold text-xs ${getScoreColor(evalItem.overall_score)}`}>
                                                <SparklesIcon className="w-3 h-3" />
                                                <span>{evalItem.overall_score}%</span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-3.5 text-center">
                                            {getStatusBadge(evalItem.status, evalItem.is_locked)}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link
                                                    href={route('evaluations.show', evalItem)}
                                                    className="p-1.5 bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white rounded-lg border border-slate-200 transition-all shadow-2xs active:scale-95"
                                                    title="View Appraisal"
                                                >
                                                    <DocumentTextIcon className="w-4 h-4" />
                                                </Link>
                                                {evalItem.status === 'approved' && (
                                                    <a
                                                        href={route('evaluations.appraisal-letter', evalItem)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 bg-slate-50 text-slate-500 hover:bg-indigo-600 hover:text-white rounded-lg border border-slate-200 transition-all shadow-2xs active:scale-95"
                                                        title="Download Official Appraisal Letter"
                                                    >
                                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {canEdit && !evalItem.is_locked && (
                                                    <Link
                                                        href={route('evaluations.edit', evalItem)}
                                                        className="p-1.5 bg-slate-50 text-slate-500 hover:bg-amber-600 hover:text-white rounded-lg border border-slate-200 transition-all shadow-2xs active:scale-95"
                                                        title="Edit Appraisal"
                                                    >
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                    </Link>
                                                )}
                                                {canDelete && !evalItem.is_locked && (
                                                    <button
                                                        onClick={() => setDeleteModal({ show: true, item: evalItem })}
                                                        className="p-1.5 bg-slate-50 text-slate-500 hover:bg-rose-600 hover:text-white rounded-lg border border-slate-200 transition-all shadow-2xs active:scale-95"
                                                        title="Delete Appraisal"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {evalList.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2.5">
                                                <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                                                    <DocumentMagnifyingGlassIcon className="w-7 h-7" />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-700">No appraisals found</p>
                                                <p className="text-xs text-slate-400 max-w-sm">
                                                    There are no appraisal records matching your active filter criteria.
                                                </p>
                                                {hasActiveFilters && (
                                                    <button
                                                        onClick={clearAllFilters}
                                                        className="mt-2 text-xs font-semibold text-indigo-600 underline hover:text-indigo-800"
                                                    >
                                                        Clear all active filters
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {evaluations.links && evaluations.links.length > 3 && (
                        <div className="bg-white px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <p className="text-xs text-slate-500">
                                Showing <span className="font-semibold text-slate-900">{evaluations.from || 0}-{evaluations.to || 0}</span> of <span className="font-semibold text-slate-900">{evaluations.total || 0}</span> reviews
                            </p>
                            <div className="flex items-center gap-1">
                                {evaluations.links.map((link, i) => (
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={`min-w-[32px] h-8 px-2.5 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                                                link.active
                                                    ? 'bg-slate-950 text-white shadow-2xs'
                                                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-white hover:text-slate-900'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="min-w-[32px] h-8 px-2.5 flex items-center justify-center rounded-lg text-xs font-medium text-slate-300 bg-slate-50 border border-slate-100 cursor-not-allowed"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                show={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, item: null })}
                onConfirm={confirmDelete}
                title="Delete Performance Appraisal"
                message={`Are you sure you want to delete the appraisal record for ${deleteModal.item?.employee?.name || 'this employee'}? This action cannot be undone.`}
                confirmText="Delete Appraisal"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}
