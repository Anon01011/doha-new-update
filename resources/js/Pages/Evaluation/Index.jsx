import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import Avatar from '@/Components/Avatar';
import {
    PlusIcon,
    DocumentTextIcon,
    CalendarIcon,
    StarIcon,
    BuildingOfficeIcon,
    QueueListIcon,
    ChevronRightIcon,
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    SparklesIcon,
    ArrowPathIcon,
    DocumentMagnifyingGlassIcon,
    ChartBarIcon,
    UserGroupIcon,
    AcademicCapIcon,
    ArrowTrendingUpIcon,
    CurrencyRupeeIcon,
    ExclamationTriangleIcon,
    LockClosedIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index({ evaluations, companies = [], departments = [], filters = {} }) {
    const { auth } = usePage().props;
    const user = auth?.user || {};
    const [search, setSearch] = useState(filters.search || '');
    const [companyId, setCompanyId] = useState(filters.company_id || '');
    const [departmentId, setDepartmentId] = useState(filters.department_id || '');
    const [status, setStatus] = useState(filters.status || '');
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

    const handleServerFilter = (overrides = {}) => {
        const payload = {
            search,
            company_id: companyId,
            department_id: departmentId,
            status,
            ...overrides,
        };
        router.get(route('evaluations.index'), payload, { preserveState: true, replace: true });
    };

    const getScoreColor = (score) => {
        if (score >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
        if (score >= 70) return 'text-indigo-700 bg-indigo-50 border-indigo-200';
        if (score >= 40) return 'text-amber-700 bg-amber-50 border-amber-200';
        return 'text-rose-700 bg-rose-50 border-rose-200';
    };

    const getStatusBadge = (status, isLocked) => {
        if (isLocked || status === 'approved') {
            return <span className="text-[9px] font-normal text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase flex items-center gap-1"><CheckCircleIcon className="w-3 h-3" /> Approved</span>;
        }
        if (status === 'self_assessment') {
            return <span className="text-[9px] font-normal text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase">Self Review</span>;
        }
        if (status === 'manager_review') {
            return <span className="text-[9px] font-normal text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase">Manager Review</span>;
        }
        if (status === 'acknowledged') {
            return <span className="text-[9px] font-normal text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase">Acknowledged</span>;
        }
        return <span className="text-[9px] font-normal text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase">{status || 'Pending'}</span>;
    };

    const getMonthName = (monthNum) => {
        if (!monthNum) return '';
        if (isNaN(monthNum)) return monthNum;
        const date = new Date();
        date.setMonth(monthNum - 1);
        return date.toLocaleString('default', { month: 'short' });
    };

    const confirmDelete = () => {
        if (!deleteModal.id) return;
        router.delete(route('evaluations.destroy', deleteModal.id), {
            onSuccess: () => setDeleteModal({ show: false, id: null }),
        });
    };

    const handleDelete = (id) => {
        setDeleteModal({ show: true, id });
    };

    const stats = useMemo(() => {
        const data = evaluations.data || [];
        const total = evaluations.total || 0;
        const avg = data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + (Number(curr.overall_score) || 0), 0) / data.length) : 0;
        const high = data.filter(e => e.overall_score >= 80).length;
        const pipCount = data.filter(e => e.pip_required).length;

        return [
            { label: 'Total Appraisals', value: total, icon: DocumentTextIcon, color: 'text-slate-600', bg: 'bg-slate-100' },
            { label: 'Average Score', value: `${avg}%`, icon: ChartBarIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Top Performers', value: high, icon: AcademicCapIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'PIP Action Cases', value: pipCount, icon: ExclamationTriangleIcon, color: 'text-rose-600', bg: 'bg-rose-50' }
        ];
    }, [evaluations]);

    const filteredEvaluations = (evaluations.data || []).filter(item =>
        item.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.employee?.employee_code?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AuthenticatedLayout>
            <Head title="Performance Appraisals" />

            <div className="w-full p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                {/* Top Action Bar */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="p-2.5 bg-slate-900 rounded-xl shadow-lg shadow-slate-200 shrink-0">
                            <DocumentMagnifyingGlassIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-normal text-slate-900 tracking-normal leading-none truncate">Appraisals & Reviews</h1>
                            <p className="text-[9px] sm:text-[10px] text-slate-400 font-normal uppercase tracking-[0.2em] mt-1 truncate">Multi-Company Goal Setting, Ratings & Increment Linkage</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative group flex-1 sm:flex-initial">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search employee, code..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-white border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-[11px] font-normal text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all w-full sm:w-52 shadow-sm placeholder:text-slate-400"
                            />
                        </div>

                        {companies.length > 0 && (
                            <select
                                value={companyId}
                                onChange={(e) => {
                                    setCompanyId(e.target.value);
                                    handleServerFilter({ company_id: e.target.value });
                                }}
                                className="bg-white border-slate-200 rounded-lg py-1.5 px-3 text-[11px] font-normal text-slate-700 shadow-sm focus:ring-primary focus:border-primary flex-1 sm:flex-initial"
                            >
                                <option value="">All Companys / Branches</option>
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        )}

                        {departments.length > 0 && (
                            <select
                                value={departmentId}
                                onChange={(e) => {
                                    setDepartmentId(e.target.value);
                                    handleServerFilter({ department_id: e.target.value });
                                }}
                                className="bg-white border-slate-200 rounded-lg py-1.5 px-3 text-[11px] font-normal text-slate-700 shadow-sm focus:ring-primary focus:border-primary flex-1 sm:flex-initial"
                            >
                                <option value="">All Departments</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        )}

                        <Link
                            href={route('reports.evaluation')}
                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-[10px] font-normal uppercase shadow-sm flex-1 sm:flex-initial justify-center"
                        >
                            <ChartBarIcon className="w-3.5 h-3.5 text-indigo-600" />
                            Analytics Reports
                        </Link>
                        {['admin', 'hr', 'manager'].includes(user.role) && (
                            <Link
                                href={route('evaluations.create')}
                                className="bg-primary hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 text-white px-4 py-1.5 rounded-lg transition-all flex items-center justify-center gap-2 text-[10px] font-normal uppercase tracking-normal flex-1 sm:flex-initial"
                            >
                                <PlusIcon className="w-3.5 h-3.5" />
                                Initiate Appraisal
                            </Link>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-all group min-w-0">
                            <div className={`p-2 sm:p-2.5 ${stat.bg} rounded-lg transition-transform group-hover:scale-110 shrink-0`}>
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-0.5 truncate">{stat.label}</p>
                                <p className="text-base sm:text-lg font-normal text-slate-900 tracking-normal truncate">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Table Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
                    <div className="px-4 sm:px-5 py-3.5 bg-slate-50/30 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <QueueListIcon className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <h3 className="text-[10px] font-normal text-slate-800 uppercase tracking-normal">Performance Appraisal Ledger</h3>
                        </div>
                        <span className="text-[9px] font-normal text-slate-400 uppercase tracking-normal bg-white px-2 py-0.5 rounded-full border border-slate-100">{filteredEvaluations.length} appraisals found</span>
                    </div>

                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full min-w-[700px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    <th className="w-[280px] px-5 py-2.5 text-[9px] font-normal uppercase tracking-normal border-r border-slate-800">Employee Identity</th>
                                    <th className="px-5 py-2.5 text-[9px] font-normal uppercase tracking-normal border-r border-slate-800 text-center">Company & Dept</th>
                                    <th className="w-[140px] px-5 py-2.5 text-[9px] font-normal uppercase tracking-normal border-r border-slate-800 text-center">Period & Cycle</th>
                                    <th className="w-[110px] px-5 py-2.5 text-[9px] font-normal uppercase tracking-normal border-r border-slate-800 text-center">Score</th>
                                    <th className="w-[140px] px-5 py-2.5 text-[9px] font-normal uppercase tracking-normal border-r border-slate-800 text-center">Status</th>
                                    <th className="w-[140px] px-5 py-2.5 text-[9px] font-normal uppercase tracking-normal text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredEvaluations.map((evalItem) => (
                                    <tr key={evalItem.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-5 py-2.5">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    src={evalItem.employee?.employee_image || evalItem.employee?.image}
                                                    name={evalItem.employee?.name}
                                                    size="sm"
                                                    className="ring-2 ring-slate-100 group-hover:ring-primary/20 transition-all"
                                                />
                                                <div className="min-w-0">
                                                    <div className="text-[11px] font-normal text-slate-900 leading-none truncate tracking-normal flex items-center gap-1.5">
                                                        {evalItem.employee?.name}
                                                        {evalItem.pip_required && (
                                                            <span title="PIP Active" className="p-0.5 bg-rose-50 text-rose-600 rounded">
                                                                <ExclamationTriangleIcon className="w-3 h-3" />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mt-1.5 truncate">
                                                        {evalItem.employee?.employee_code || '-'} &bull; {evalItem.employee?.designation || 'Staff'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-2.5 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-[9px] font-normal text-slate-700 bg-slate-100 px-2 py-0.5 rounded uppercase">{evalItem.employee?.company?.name || 'Unit'}</span>
                                                <span className="text-[8px] font-normal text-slate-400 uppercase mt-0.5">{evalItem.employee?.department?.name || 'General'}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-2.5 text-center">
                                            <div className="inline-flex flex-col items-center gap-0.5">
                                                <div className="inline-flex items-center gap-1 text-[9px] font-normal text-slate-700">
                                                    <CalendarIcon className="w-3 h-3 text-indigo-400" />
                                                    {getMonthName(evalItem.month)} '{evalItem.year.toString().slice(-2)}
                                                </div>
                                                <span className="text-[8px] uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-normal">
                                                    {evalItem.cycle_type ? evalItem.cycle_type.replace('_', ' ') : 'Annual'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-2.5 text-center">
                                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border shadow-sm transition-all ${getScoreColor(evalItem.overall_score)}`}>
                                                <SparklesIcon className="w-2.5 h-2.5" />
                                                <span className="text-[10px] font-normal">{evalItem.overall_score}%</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-2.5 text-center">
                                            {getStatusBadge(evalItem.status, evalItem.is_locked)}
                                        </td>
                                        <td className="px-5 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link
                                                    href={route('evaluations.show', evalItem.id)}
                                                    className="p-1.5 bg-slate-50 text-slate-400 hover:bg-primary hover:text-white rounded-md border border-slate-200 transition-all shadow-sm active:scale-90"
                                                    title="View Appraisal"
                                                >
                                                    <DocumentTextIcon className="w-4 h-4" />
                                                </Link>
                                                {['admin', 'hr', 'manager'].includes(user.role) && !evalItem.is_locked && (
                                                    <Link
                                                        href={route('evaluations.edit', evalItem.id)}
                                                        className="p-1.5 bg-slate-50 text-slate-400 hover:bg-amber-500 hover:text-white rounded-md border border-slate-200 transition-all shadow-sm active:scale-90"
                                                        title="Edit Appraisal"
                                                    >
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                    </Link>
                                                )}
                                                {['admin', 'hr'].includes(user.role) && !evalItem.is_locked && (
                                                    <button
                                                        onClick={() => handleDelete(evalItem.id)}
                                                        className="p-1.5 bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white rounded-md border border-slate-200 transition-all shadow-sm active:scale-90"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredEvaluations.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-30">
                                                <DocumentMagnifyingGlassIcon className="w-8 h-8 text-slate-400" />
                                                <p className="text-[10px] font-normal text-slate-500 uppercase tracking-widest">No appraisals found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {evaluations.links && evaluations.links.length > 3 && (
                        <div className="bg-white px-5 py-2.5 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">
                                PAGE: <span className="text-slate-900">{evaluations.from}-{evaluations.to}</span> / TOTAL {evaluations.total}
                            </p>
                            <div className="flex items-center gap-1">
                                {evaluations.links.map((link, i) => (
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={`min-w-[28px] h-7 flex items-center justify-center rounded-lg text-[9px] font-normal transition-all ${link.active ? 'bg-primary text-white shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-white hover:text-primary'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="min-w-[28px] h-7 flex items-center justify-center rounded-lg text-[9px] font-normal text-slate-300 bg-slate-50 border border-transparent cursor-not-allowed opacity-50"
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
                onClose={() => setDeleteModal({ show: false, id: null })}
                onConfirm={confirmDelete}
                title="Delete Appraisal Record"
                message="Are you sure you want to delete this performance appraisal? This action cannot be undone."
                confirmText="Delete Appraisal"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}
