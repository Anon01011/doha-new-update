import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    FaPlus, FaSearch, FaHistory, FaCalendarCheck, FaCalendarAlt,
    FaUser, FaInfoCircle, FaEdit, FaTrash, FaEye, FaTimesCircle,
    FaClock, FaCheckCircle, FaClipboardList, FaChevronDown, FaChevronUp,
    FaCheck, FaTimes
} from 'react-icons/fa';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import PrimaryButton from '@/Components/PrimaryButton';
import Avatar from '@/Components/Avatar';

export default function Index({ leaveRequests, leaveBalances, stats = null, status, userRole = 'employee', search: initialSearch = '' }) {
    const { auth } = usePage().props;
    const permissions = auth.user?.permissions || [];
    const hasPermission = (slug) => permissions.includes(slug);
    const isAdmin = auth.user?.role === 'admin';

    const [searchTerm, setSearchTerm] = useState(initialSearch || '');
    const [requestAction, setRequestAction] = useState({ type: null, request: null });
    const [processing, setProcessing] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approvalRemarks, setApprovalRemarks] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [balanceSearch, setBalanceSearch] = useState('');
    const [showAllBalances, setShowAllBalances] = useState(false);
    const [balanceViewMode, setBalanceViewMode] = useState('grid');
    const [bulkApproveModal, setBulkApproveModal] = useState({ show: false, remarks: '', sameForAll: true, error: '' });

    const canUserApprove = (request) => {
        if (request.status === 'approved' || request.status === 'rejected' || request.status === 'cancelled') {
            return false;
        }
        if (isAdmin || auth.user?.role === 'hr' || hasPermission('approve-leave-requests') || hasPermission('manage-leaves')) {
            return true;
        }
        if (auth.user?.employee_id && request.manager_id && auth.user.employee_id == request.manager_id && request.manager_approval_status === 'pending') {
            return true;
        }
        return false;
    };

    const approvableRequests = leaveRequests.data?.filter(canUserApprove) || [];
    const allSelected = approvableRequests.length > 0 && approvableRequests.every(req => selectedIds.includes(req.id));

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !approvableRequests.map(r => r.id).includes(id)));
        } else {
            const newSelected = [...selectedIds];
            approvableRequests.forEach(req => {
                if (!newSelected.includes(req.id)) {
                    newSelected.push(req.id);
                }
            });
            setSelectedIds(newSelected);
        }
    };

    const selectedRequests = (leaveRequests.data || []).filter(req => selectedIds.includes(req.id));
    const totalSelectedDays = selectedRequests.reduce((sum, req) => sum + parseFloat(req.days_requested ?? req.number_of_days ?? 0), 0);
    const selectedEmployeeNames = [...new Set(selectedRequests.map(r => r.employee?.name).filter(Boolean))];

    const handleOpenApproveModal = () => {
        if (selectedIds.length === 0) return;
        setApprovalRemarks('');
        setShowApproveModal(true);
    };

    const handleOpenRejectModal = () => {
        if (selectedIds.length === 0) return;
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleSingleApprove = (request) => {
        setSelectedIds([request.id]);
        setApprovalRemarks('');
        setShowApproveModal(true);
    };

    const handleSingleReject = (request) => {
        setSelectedIds([request.id]);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleApprove = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (selectedIds.length === 0) return;
        setBulkApproveModal({ show: true, remarks: '', sameForAll: true, error: '' });
    };

    const confirmBulkApprove = () => {
        setProcessing(true);
        router.post(route('leave-requests.bulk-approve'), {
            ids: selectedIds,
            remarks: bulkApproveModal?.remarks?.trim() || (typeof approvalRemarks !== 'undefined' ? approvalRemarks : null),
        }, {
            onSuccess: () => {
                setSelectedIds([]);
                setBulkApproveModal({ show: false, remarks: '', sameForAll: true, error: '' });
            },
            onFinish: () => {
                setProcessing(false);
            }
        });
    };

    const handleReject = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (selectedIds.length === 0 || !rejectionReason.trim()) return;

        setProcessing(true);
        router.post(route('leave-requests.bulk-reject'), {
            ids: selectedIds,
            rejection_reason: rejectionReason.trim()
        }, {
            onSuccess: () => {
                setSelectedIds([]);
                setShowRejectModal(false);
                setRejectionReason('');
            },
            onFinish: () => {
                setProcessing(false);
            }
        });
    };

    const handleAction = () => {
        if (!requestAction.request) return;

        setProcessing(true);

        if (requestAction.type === 'delete') {
            router.delete(route('leave-requests.destroy', requestAction.request.id), {
                onFinish: () => {
                    setProcessing(false);
                    setRequestAction({ type: null, request: null });
                }
            });
        } else {
            // cancel — route is POST, no method spoofing needed
            router.post(route('leave-requests.cancel', requestAction.request.id), {}, {
                onFinish: () => {
                    setProcessing(false);
                    setRequestAction({ type: null, request: null });
                }
            });
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('leave-requests.index'), { search: searchTerm, status }, { preserveState: true });
    };

    const getStatusStyle = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'approved') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (s === 'rejected') return 'bg-rose-50 text-rose-600 border-rose-100';
        if (s === 'pending') return 'bg-amber-50 text-amber-600 border-amber-100';
        if (s.includes('manager')) return 'bg-blue-50 text-blue-600 border-blue-100';
        if (s.includes('hr')) return 'bg-purple-50 text-purple-600 border-purple-100';
        if (s === 'cancelled') return 'bg-slate-50 text-slate-500 border-slate-100';
        return 'bg-slate-50 text-slate-500 border-slate-100';
    };

    const getDetailedStatus = (request) => {
        if (request.status === 'approved') return 'Approved';
        if (request.status === 'rejected') return 'Rejected';
        if (request.status === 'cancelled') return 'Cancelled';
        if (request.manager_approval_status === 'pending') return 'Pending Manager';
        if (request.manager_approval_status === 'approved' && request.hr_approval_status === 'pending') return 'Pending HR';
        return 'Pending';
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const canCancel = (request) => {
        if (request.status !== 'approved') return false;
        const startDate = new Date(request.start_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return startDate > today;
    };

    const [expandedQuotas, setExpandedQuotas] = useState(false);

    // Clean up leave type names (Title Case, abbreviations)
    const cleanLeaveName = (name) => {
        if (!name) return 'Leave';
        const trimmed = String(name).trim();
        if (trimmed.toUpperCase() === 'PH') return 'Public Holiday (PH)';
        if (trimmed.toUpperCase() === 'OT TO OFFSET') return 'OT to Offset';
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 2) {
            return trimmed.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
        return trimmed;
    };

    // Subtle modern color themes for quota cards
    const getQuotaTheme = (name, index) => {
        const n = (name || '').toLowerCase();
        if (n.includes('sick') || n.includes('medical') || n.includes('health')) {
            return {
                bg: 'bg-emerald-50/50 hover:bg-emerald-50/80',
                border: 'border-emerald-200/70 hover:border-emerald-300',
                iconBg: 'bg-emerald-500 text-white',
                progress: 'bg-emerald-500',
                badge: 'bg-emerald-100 text-emerald-800',
            };
        }
        if (n.includes('annual') || n.includes('vacation')) {
            return {
                bg: 'bg-indigo-50/50 hover:bg-indigo-50/80',
                border: 'border-indigo-200/70 hover:border-indigo-300',
                iconBg: 'bg-indigo-600 text-white',
                progress: 'bg-indigo-600',
                badge: 'bg-indigo-100 text-indigo-800',
            };
        }
        if (n.includes('emerg') || n.includes('casual') || n.includes('urgent')) {
            return {
                bg: 'bg-amber-50/50 hover:bg-amber-50/80',
                border: 'border-amber-200/70 hover:border-amber-300',
                iconBg: 'bg-amber-500 text-white',
                progress: 'bg-amber-500',
                badge: 'bg-amber-100 text-amber-800',
            };
        }
        if (n.includes('ph') || n.includes('holiday')) {
            return {
                bg: 'bg-violet-50/50 hover:bg-violet-50/80',
                border: 'border-violet-200/70 hover:border-violet-300',
                iconBg: 'bg-violet-600 text-white',
                progress: 'bg-violet-600',
                badge: 'bg-violet-100 text-violet-800',
            };
        }
        if (n.includes('ot') || n.includes('offset') || n.includes('comp')) {
            return {
                bg: 'bg-sky-50/50 hover:bg-sky-50/80',
                border: 'border-sky-200/70 hover:border-sky-300',
                iconBg: 'bg-sky-500 text-white',
                progress: 'bg-sky-500',
                badge: 'bg-sky-100 text-sky-800',
            };
        }
        const palettes = [
            {
                bg: 'bg-rose-50/50 hover:bg-rose-50/80',
                border: 'border-rose-200/70 hover:border-rose-300',
                iconBg: 'bg-rose-500 text-white',
                progress: 'bg-rose-500',
                badge: 'bg-rose-100 text-rose-800',
            },
            {
                bg: 'bg-cyan-50/50 hover:bg-cyan-50/80',
                border: 'border-cyan-200/70 hover:border-cyan-300',
                iconBg: 'bg-cyan-600 text-white',
                progress: 'bg-cyan-600',
                badge: 'bg-cyan-100 text-cyan-800',
            },
            {
                bg: 'bg-teal-50/50 hover:bg-teal-50/80',
                border: 'border-teal-200/70 hover:border-teal-300',
                iconBg: 'bg-teal-600 text-white',
                progress: 'bg-teal-600',
                badge: 'bg-teal-100 text-teal-800',
            },
        ];
        return palettes[index % palettes.length];
    };

    const getGridColsClass = (count) => {
        if (count === 1) return 'grid-cols-1 max-w-sm';
        if (count === 2) return 'grid-cols-1 sm:grid-cols-2 max-w-xl';
        if (count === 3) return 'grid-cols-1 sm:grid-cols-3';
        if (count === 4) return 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4';
        if (count === 5) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
        return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
    };

    // Normalize leaveBalances (handles both Eloquent collections/arrays and key-value objects)
    const balancesList = Array.isArray(leaveBalances)
        ? leaveBalances.map((bal, idx) => ({
            id: bal?.id ?? idx,
            name: bal?.leave_type?.name || bal?.type || bal?.name || 'Leave',
            remaining: bal?.remaining_days ?? bal?.balance ?? (typeof bal === 'number' ? bal : 0),
            total: bal?.total_days ?? null,
            used: bal?.used_days ?? null,
        }))
        : (leaveBalances && typeof leaveBalances === 'object')
            ? Object.entries(leaveBalances).map(([key, val], idx) => {
                if (val && typeof val === 'object') {
                    return {
                        id: val?.id ?? idx,
                        name: val?.leave_type?.name || val?.type || val?.name || key,
                        remaining: val?.remaining_days ?? val?.balance ?? 0,
                        total: val?.total_days ?? null,
                        used: val?.used_days ?? null,
                    };
                }
                return {
                    id: idx,
                    name: key,
                    remaining: val,
                    total: null,
                    used: null,
                };
            })
            : [];

    const totalRemaining = balancesList.reduce((acc, b) => acc + (parseFloat(b.remaining) || 0), 0);
    const totalAllocated = balancesList.reduce((acc, b) => acc + (parseFloat(b.total) || 0), 0);
    const totalUsed = balancesList.reduce((acc, b) => acc + (parseFloat(b.used) || 0), 0);
    const isManagementUser = isAdmin || userRole === 'hr' || userRole === 'manager' || hasPermission('approve-leave-requests');

    const visibleQuotas = (balancesList.length > 6 && !expandedQuotas)
        ? balancesList.slice(0, 6)
        : balancesList;

    return (
        <AuthenticatedLayout>
            <Head title="Leave Management" />

            <div className="w-full p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                {/* In-Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-200 shrink-0">
                            <FaCalendarCheck size={18} />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
                                {isManagementUser ? 'Leave Management' : 'My Leave & Applications'}
                            </h1>
                            <p className="text-xs text-slate-500 font-normal mt-0.5">
                                {isManagementUser
                                    ? 'Review employee applications, manage approvals, and monitor staff availability'
                                    : 'Track your annual leave quotas, apply for time off, and monitor application status'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {(isAdmin || hasPermission('manage-leave-types')) && (
                            <Link
                                href={route('leave-types.index')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium shadow-xs transition-all flex-1 sm:flex-initial justify-center"
                            >
                                <FaClipboardList className="text-slate-400" size={12} />
                                <span>Leave Policies</span>
                            </Link>
                        )}
                        <Link
                            href={route('leave-requests.create')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md shadow-slate-200 transition-all active:scale-95 flex-1 sm:flex-initial justify-center"
                        >
                            <FaPlus size={11} />
                            <span>Apply Leave</span>
                        </Link>
                    </div>
                </div>

                {/* Admin / Management Overview KPI Metrics */}
                {isManagementUser && stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => router.get(route('leave-requests.index'))}
                            className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all text-left flex items-center gap-3 sm:gap-3.5 group"
                        >
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                <FaCalendarAlt size={15} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate">Total Requests</p>
                                <p className="text-lg sm:text-2xl font-bold text-slate-900 leading-tight">{stats.total ?? 0}</p>
                                <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">All Applications</p>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => router.get(route('leave-requests.index', { status: 'pending' }))}
                            className={`bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border ${status === 'pending' ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200/80'} shadow-xs hover:shadow-md hover:border-amber-300 transition-all text-left flex items-center gap-3 sm:gap-3.5 group`}
                        >
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                <FaClock size={15} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-semibold text-amber-700 uppercase tracking-wide truncate">Pending Review</p>
                                <p className="text-lg sm:text-2xl font-bold text-amber-700 leading-tight">{stats.pending ?? 0}</p>
                                <p className="text-[9px] sm:text-[10px] text-amber-600 truncate">Awaiting approval</p>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => router.get(route('leave-requests.index', { status: 'approved' }))}
                            className={`bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border ${status === 'approved' ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200/80'} shadow-xs hover:shadow-md hover:border-emerald-300 transition-all text-left flex items-center gap-3 sm:gap-3.5 group`}
                        >
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                <FaCheckCircle size={15} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-semibold text-emerald-700 uppercase tracking-wide truncate">Approved</p>
                                <p className="text-lg sm:text-2xl font-bold text-emerald-700 leading-tight">{stats.approved ?? 0}</p>
                                <p className="text-[9px] sm:text-[10px] text-emerald-600 truncate">Authorized</p>
                            </div>
                        </button>

                        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 sm:gap-3.5">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                                <FaUser size={15} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-semibold text-sky-700 uppercase tracking-wide truncate">On Leave Today</p>
                                <p className="text-lg sm:text-2xl font-bold text-sky-700 leading-tight">{stats.on_leave_today ?? 0}</p>
                                <p className="text-[9px] sm:text-[10px] text-sky-600 truncate">Staff away today</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => router.get(route('leave-requests.index', { status: 'rejected' }))}
                            className={`bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border ${status === 'rejected' ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200/80'} shadow-xs hover:shadow-md hover:border-rose-300 transition-all text-left flex items-center gap-3 sm:gap-3.5 group col-span-2 sm:col-span-1`}
                        >
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                <FaTimesCircle size={15} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-semibold text-rose-700 uppercase tracking-wide truncate">Rejected</p>
                                <p className="text-lg sm:text-2xl font-bold text-rose-700 leading-tight">{stats.rejected ?? 0}</p>
                                <p className="text-[9px] sm:text-[10px] text-rose-600 truncate">Declined</p>
                            </div>
                        </button>
                    </div>
                )}

                {/* Personal Leave Quotas (Grid) */}
                {balancesList.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                                    Personal Leave Quotas · {new Date().getFullYear()}
                                </h2>
                                <span className="text-[11px] text-slate-500 font-normal">
                                    (<strong className="text-slate-800">{totalRemaining}d</strong> available · {totalUsed}d used)
                                </span>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                {balancesList.length > 6 && (
                                    <button
                                        type="button"
                                        onClick={() => setExpandedQuotas(!expandedQuotas)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                                    >
                                        {expandedQuotas ? (
                                            <>
                                                <span>Show Top 6</span>
                                                <FaChevronUp size={10} />
                                            </>
                                        ) : (
                                            <>
                                                <span>View All ({balancesList.length})</span>
                                                <FaChevronDown size={10} />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Responsive Auto-Fitting Grid */}
                        <div className={`grid ${getGridColsClass(visibleQuotas.length)} gap-3 sm:gap-3.5`}>
                            {visibleQuotas.map((bal, idx) => {
                                const theme = getQuotaTheme(bal.name, idx);
                                const remNum = bal.remaining !== null && bal.remaining !== undefined && !isNaN(bal.remaining) ? parseFloat(bal.remaining) : 0;
                                const totNum = bal.total !== null && bal.total !== undefined && !isNaN(bal.total) ? parseFloat(bal.total) : null;
                                const usedNum = bal.used !== null && bal.used !== undefined && !isNaN(bal.used) ? parseFloat(bal.used) : (totNum ? Math.max(0, totNum - remNum) : 0);
                                const pct = totNum && totNum > 0 ? (remNum / totNum) * 100 : (remNum > 0 ? 100 : 0);

                                return (
                                    <div
                                        key={bal.id ?? bal.name}
                                        className={`p-3 sm:p-3.5 rounded-xl border ${theme.border} ${theme.bg} transition-all duration-200 hover:shadow-md flex flex-col justify-between min-w-0 group`}
                                    >
                                        {/* Top: Icon + Title */}
                                        <div className="flex items-center gap-2 mb-2 min-w-0">
                                            <div className={`w-7 h-7 rounded-lg ${theme.iconBg} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                                                <FaCalendarCheck size={12} />
                                            </div>
                                            <span
                                                className="text-xs font-semibold text-slate-800 truncate leading-snug"
                                                title={bal.name}
                                            >
                                                {cleanLeaveName(bal.name)}
                                            </span>
                                        </div>

                                        {/* Middle: Big remaining + total days */}
                                        <div className="flex items-baseline justify-between min-w-0 mt-0.5">
                                            <div className="flex items-baseline">
                                                <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none">
                                                    {remNum}
                                                </span>
                                                {totNum !== null && (
                                                    <span className="text-[11px] text-slate-500 font-medium ml-1">
                                                        / {totNum}d
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${theme.badge}`}>
                                                {remNum <= 0 ? 'Exhausted' : `${remNum}d Left`}
                                            </span>
                                        </div>

                                        {/* Bottom: Progress Bar */}
                                        <div className="mt-2.5">
                                            <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${theme.progress}`}
                                                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center text-[9px] text-slate-500 font-medium mt-1">
                                                <span>{usedNum}d used</span>
                                                <span>{Math.round(pct)}% left</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    (!isManagementUser || auth.user?.employee_id) && (
                        <div className="py-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-6">
                            <FaInfoCircle className="mx-auto text-slate-300 mb-2" size={24} />
                            <p className="text-xs font-semibold text-slate-600">No personal leave quotas allocated for {new Date().getFullYear()}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Please contact HR or your administrator to allocate leave quotas.</p>
                        </div>
                    )
                )}

                {/* Filters */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <form onSubmit={handleSearch} className="relative flex-1 sm:flex-none">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full sm:w-56 pl-9 pr-4 py-2 bg-slate-50 border-slate-200 rounded-xl text-[11px] font-normal focus:ring-0 focus:border-slate-300 transition-all outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </form>
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
                            {['all', 'pending', 'approved', 'rejected'].map((tab) => (
                                <Link
                                    key={tab}
                                    href={route('leave-requests.index', { status: tab === 'all' ? '' : tab })}
                                    className={`px-3 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-normal transition-all whitespace-nowrap ${
                                        (status === tab || (tab === 'all' && !status)) 
                                        ? 'bg-slate-900 text-white shadow-md' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <Link
                        href={route('leave-requests.create')}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-normal hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <FaPlus size={10} />
                        <span>Add Leave</span>
                    </Link>
                </div>

                {/* Bulk Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-xl shadow-sm animate-fadeIn">
                        <div className="text-[11px] font-normal text-slate-600">
                            Selected <span className="font-semibold text-slate-900">{selectedIds.length}</span> request(s) for bulk action.
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => setSelectedIds([])}
                                className="flex-1 sm:flex-initial px-3.5 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-normal hover:bg-slate-50 transition-all"
                            >
                                Clear Selection
                            </button>
                             <button
                                onClick={handleOpenRejectModal}
                                disabled={processing}
                                className="flex-1 sm:flex-initial px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-normal hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <FaTimes size={10} />
                                Reject
                            </button>
                            <button
                                onClick={handleOpenApproveModal}
                                disabled={processing}
                                className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-normal hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <FaCheck size={10} />
                                Approve
                            </button>
                        </div>
                    </div>
                )}

                {/* Records */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    {approvableRequests.length > 0 && (
                                        <th className="pl-6 py-4 text-left border-b border-slate-100 w-12">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={toggleSelectAll}
                                                className="rounded border-slate-300 text-slate-950 focus:ring-0 cursor-pointer"
                                            />
                                        </th>
                                    )}
                                    <th className="px-6 py-4 text-left text-[10px] font-normal text-slate-400 border-b border-slate-100">Employee</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-normal text-slate-400 border-b border-slate-100">Leave Type</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-normal text-slate-400 border-b border-slate-100">Dates</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-normal text-slate-400 border-b border-slate-100">Days</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-normal text-slate-400 border-b border-slate-100">Status</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-normal text-slate-400 border-b border-slate-100">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {leaveRequests.data && leaveRequests.data.length > 0 ? (
                                    leaveRequests.data.map((request) => (
                                        <tr key={request.id} className="group hover:bg-slate-50/50 transition-colors">
                                            {approvableRequests.length > 0 && (
                                                <td className="pl-6 py-4 border-b border-slate-50 w-12">
                                                    {canUserApprove(request) ? (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(request.id)}
                                                            onChange={() => toggleSelect(request.id)}
                                                            className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                                                        />
                                                    ) : (
                                                        <div className="w-4 h-4" />
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <Avatar
                                                        src={request.employee?.employee_image}
                                                        name={request.employee?.name}
                                                        size="sm"
                                                        className="rounded-xl border border-slate-100"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-normal text-slate-900 leading-none">{request.employee?.name}</p>
                                                        <p className="text-[10px] font-normal text-slate-400 mt-1.5">{request.employee?.employee_code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[11px] font-normal text-slate-900">{request.leave_type?.name}</p>
                                                <p className="text-[10px] text-slate-400 font-normal line-clamp-1 mt-1 max-w-[200px]">{request.reason || 'N/A'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-normal text-slate-900 leading-none">{formatDate(request.start_date)}</span>
                                                    <span className="text-[10px] font-normal text-slate-300 mt-1">To {formatDate(request.end_date)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-1 bg-slate-50 text-slate-900 rounded-xl text-[10px] font-normal border border-slate-100">
                                                    {parseFloat(request.days_requested ?? request.number_of_days ?? 0)} Days
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[9px] font-normal border ${getStatusStyle(getDetailedStatus(request))}`}>
                                                    {getDetailedStatus(request)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canUserApprove(request) && (
                                                        <>
                                                            <button
                                                                onClick={() => handleSingleApprove(request)}
                                                                title="Approve Request"
                                                                className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-xl transition-all border border-emerald-100 shadow-sm"
                                                            >
                                                                <FaCheck size={11} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleSingleReject(request)}
                                                                title="Reject Request"
                                                                className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-all border border-rose-100 shadow-sm"
                                                            >
                                                                <FaTimes size={11} />
                                                            </button>
                                                        </>
                                                    )}
                                                     <Link
                                                        href={route('leave-requests.show', request.id)}
                                                        className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
                                                    >
                                                        <FaEye size={12} />
                                                     </Link>
                                                    {(hasPermission('manage-leaves') || (userRole === 'employee' && request.status === 'pending')) && (
                                                        <Link
                                                            href={route('leave-requests.edit', request.id)}
                                                            className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
                                                        >
                                                            <FaEdit size={12} />
                                                        </Link>
                                                    )}
                                                    {(isAdmin || hasPermission('manage-leaves') || (userRole === 'employee' && (request.status === 'pending' || request.status === 'rejected'))) && (
                                                        <button
                                                            onClick={() => setRequestAction({ type: 'delete', request })}
                                                            className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    )}
                                                    {canCancel(request) && (
                                                        <button
                                                            onClick={() => setRequestAction({ type: 'cancel', request })}
                                                            className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[9px] font-normal hover:bg-rose-100 transition-all"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={approvableRequests.length > 0 ? 7 : 6} className="px-6 py-12 text-center">
                                            <FaCalendarAlt className="mx-auto text-slate-200 mb-4" size={48} />
                                            <p className="text-base font-normal text-slate-400">No Leave Requests</p>
                                            <p className="text-[10px] font-normal text-slate-300 mt-2">No leave applications detected in current dataset</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                     {/* Pagination */}
                    <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] font-normal text-slate-400">
                            Showing: <span className="text-slate-900">{leaveRequests.from || 0} - {leaveRequests.to || 0} of {leaveRequests.total} requests</span>
                        </p>
                         <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-100">
                            {leaveRequests.links && leaveRequests.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`px-3.5 py-2 rounded-xl text-[10px] font-normal transition-all ${
                                        link.active ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' :
                                        !link.url ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                show={!!requestAction.request}
                title={requestAction.type === 'delete' ? 'Delete Request' : 'Cancel Request'}
                message={`Confirm you want to ${requestAction.type === 'delete' ? 'delete' : 'cancel'} this leave application? This cannot be undone.`}
                onConfirm={handleAction}
                onClose={() => setRequestAction({ type: null, request: null })}
                confirmText={requestAction.type === 'delete' ? 'Delete' : 'Cancel'}
                type="danger"
                processing={processing}
            />

            {/* Modal for Approval with Remarks (Matching Show.jsx design) */}
            <Modal show={showApproveModal} onClose={() => setShowApproveModal(false)} maxWidth="md">
                <form onSubmit={handleApprove} className="p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <FaCheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                {selectedIds.length === 1 ? 'Approve Leave Request' : 'Approve Selected Leave Requests'}
                            </h2>
                            <p className="text-xs text-slate-500">Confirm approval and add remarks</p>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 mb-5 text-xs text-slate-600 space-y-1.5">
                        {selectedIds.length === 1 && selectedRequests[0] ? (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Employee:</span>
                                    <span className="font-semibold text-slate-800">{selectedRequests[0]?.employee?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Duration:</span>
                                    <span className="font-semibold text-emerald-700">
                                        {parseFloat(selectedRequests[0]?.days_requested ?? selectedRequests[0]?.number_of_days ?? 0)} Days ({formatDate(selectedRequests[0]?.start_date)} - {formatDate(selectedRequests[0]?.end_date)})
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Selected Requests:</span>
                                    <span className="font-semibold text-slate-800">{selectedIds.length} Application{selectedIds.length > 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Total Duration:</span>
                                    <span className="font-semibold text-emerald-700">{totalSelectedDays} Total Day{totalSelectedDays !== 1 ? 's' : ''}</span>
                                </div>
                                {selectedEmployeeNames.length > 0 && (
                                    <div className="flex justify-between items-start pt-1.5 border-t border-slate-200/60">
                                        <span className="text-slate-400">Employees:</span>
                                        <span className="font-semibold text-slate-700 text-right max-w-[240px] truncate" title={selectedEmployeeNames.join(', ')}>
                                            {selectedEmployeeNames.slice(0, 3).join(', ')}{selectedEmployeeNames.length > 3 ? ` +${selectedEmployeeNames.length - 3} more` : ''}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="space-y-1.5 mb-6">
                        <label className="text-xs font-semibold text-slate-700">
                            Approval Remarks / Notes <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <textarea
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-xs resize-none"
                            placeholder="Add any remarks or notes for employee..."
                            rows="3"
                            value={approvalRemarks}
                            onChange={(e) => setApprovalRemarks(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-xl text-xs font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {processing ? 'Approving...' : selectedIds.length > 1 ? `Confirm & Approve (${selectedIds.length})` : 'Confirm & Approve'}
                        </button>
                        <SecondaryButton onClick={() => setShowApproveModal(false)} className="px-6 py-3 rounded-xl border text-xs">
                            Cancel
                        </SecondaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal for Rejection with Reason (Matching Show.jsx design) */}
            <Modal show={showRejectModal} onClose={() => setShowRejectModal(false)} maxWidth="md">
                <form onSubmit={handleReject} className="p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <FaTimesCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                {selectedIds.length === 1 ? 'Reject Leave Request' : 'Reject Selected Leave Requests'}
                            </h2>
                            <p className="text-xs text-slate-500">Provide rejection reason</p>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 mb-5 text-xs text-slate-600 space-y-1.5">
                        {selectedIds.length === 1 && selectedRequests[0] ? (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Employee:</span>
                                    <span className="font-semibold text-slate-800">{selectedRequests[0]?.employee?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Duration:</span>
                                    <span className="font-semibold text-rose-700">
                                        {parseFloat(selectedRequests[0]?.days_requested ?? selectedRequests[0]?.number_of_days ?? 0)} Days ({formatDate(selectedRequests[0]?.start_date)} - {formatDate(selectedRequests[0]?.end_date)})
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Selected Requests:</span>
                                    <span className="font-semibold text-slate-800">{selectedIds.length} Application{selectedIds.length > 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Total Duration:</span>
                                    <span className="font-semibold text-rose-700">{totalSelectedDays} Total Day{totalSelectedDays !== 1 ? 's' : ''}</span>
                                </div>
                                {selectedEmployeeNames.length > 0 && (
                                    <div className="flex justify-between items-start pt-1.5 border-t border-slate-200/60">
                                        <span className="text-slate-400">Employees:</span>
                                        <span className="font-semibold text-slate-700 text-right max-w-[240px] truncate" title={selectedEmployeeNames.join(', ')}>
                                            {selectedEmployeeNames.slice(0, 3).join(', ')}{selectedEmployeeNames.length > 3 ? ` +${selectedEmployeeNames.length - 3} more` : ''}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="space-y-1.5 mb-6">
                        <label className="text-xs font-semibold text-slate-700">
                            Reason for Rejection <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none text-xs resize-none"
                            placeholder="Reason for rejecting this request (Required)..."
                            rows="3"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            required
                        ></textarea>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={processing || !rejectionReason.trim()}
                            className="flex-1 bg-rose-600 text-white px-6 py-3 rounded-xl text-xs font-semibold hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {processing ? 'Rejecting...' : selectedIds.length > 1 ? `Confirm & Reject (${selectedIds.length})` : 'Confirm & Reject'}
                        </button>
                        <SecondaryButton onClick={() => setShowRejectModal(false)} className="px-6 py-3 rounded-xl border text-xs">
                            Cancel
                        </SecondaryButton>
                    </div>
                </form>
            </Modal>

            {/* Bulk Approve Confirmation Modal */}
            <Modal
                show={bulkApproveModal.show}
                onClose={() => setBulkApproveModal({ show: false, remarks: '', sameForAll: true, error: '' })}
                maxWidth="md"
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-full bg-emerald-50 text-emerald-600">
                            <FaCheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-normal text-slate-900">Approve Selected Requests</h3>
                            <p className="text-xs text-slate-500">You are about to approve <strong>{selectedIds.length}</strong> leave application(s)</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-normal text-slate-700 mb-1">
                                Approval Remarks <span className="text-slate-400">(optional)</span>
                            </label>
                            <textarea
                                value={bulkApproveModal.remarks}
                                onChange={(e) => setBulkApproveModal(prev => ({ ...prev, remarks: e.target.value }))}
                                rows={3}
                                placeholder="Add remarks for all selected approvals (optional)..."
                                className="w-full text-xs rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0"
                            />
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                            <p className="text-[11px] text-emerald-700 font-medium">
                                ✓ The same remarks will be applied to all {selectedIds.length} selected leave request(s).
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <SecondaryButton
                            onClick={() => setBulkApproveModal({ show: false, remarks: '', sameForAll: true, error: '' })}
                            disabled={processing}
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            onClick={confirmBulkApprove}
                            disabled={processing}
                            className="bg-emerald-600 hover:bg-emerald-700 focus:bg-emerald-700 active:bg-emerald-900 focus:ring-emerald-500"
                        >
                            {processing ? 'Processing...' : `Confirm Approval (${selectedIds.length})`}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
