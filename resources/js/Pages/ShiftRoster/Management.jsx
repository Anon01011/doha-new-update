import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import Avatar from '@/Components/Avatar';
import Modal from '@/Components/Modal';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { 
    FiCalendar, 
    FiCheckCircle, 
    FiClock, 
    FiXCircle, 
    FiEye, 
    FiArrowRight, 
    FiSend, 
    FiFilter, 
    FiSearch, 
    FiRefreshCw, 
    FiPlus, 
    FiUserCheck,
    FiAlertTriangle,
    FiInfo,
    FiCheck,
    FiX
} from 'react-icons/fi';

export default function Management({
    batches = [],
    metrics = {
        total_schedules: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        total_shifts: 0
    },
    companies = [],
    departments = [],
    filters = {},
    canApprove = false,
    userRole = 'admin'
}) {
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedCompany, setSelectedCompany] = useState(filters.company_id || '');
    const [selectedDepartment, setSelectedDepartment] = useState(filters.department_id || '');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');

    // Details Modal State
    const [detailsModal, setDetailsModal] = useState({
        show: false,
        loading: false,
        data: null,
        error: null
    });

    // Rejection Modal State
    const [rejectionModal, setRejectionModal] = useState({
        show: false,
        company_id: null,
        week_start: null,
        reason: '',
        processing: false
    });

    // Confirmation Modal State
    const [confirmingAction, setConfirmingAction] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'info',
        processing: false,
        hideCancel: false,
        confirmText: 'Confirm'
    });

    const handleFilterChange = (newFilters) => {
        const query = {
            status: newFilters.status ?? selectedStatus,
            company_id: newFilters.company_id ?? selectedCompany,
            department_id: newFilters.department_id ?? selectedDepartment,
            search: newFilters.search ?? searchTerm,
            from_date: newFilters.from_date ?? fromDate,
            to_date: newFilters.to_date ?? toDate,
        };

        // Remove empty keys
        Object.keys(query).forEach(key => {
            if (!query[key] || query[key] === 'all') delete query[key];
        });

        router.get(route('shift-rosters.management'), query, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const resetFilters = () => {
        setSelectedStatus('all');
        setSelectedCompany('');
        setSelectedDepartment('');
        setSearchTerm('');
        setFromDate('');
        setToDate('');
        router.get(route('shift-rosters.management'), {}, {
            preserveState: true,
            replace: true
        });
    };

    // View Details Handler
    const handleViewDetails = (batch) => {
        setDetailsModal({
            show: true,
            loading: true,
            data: null,
            error: null
        });

        window.axios.get(route('shift-rosters.batchDetails'), {
            params: {
                company_id: batch.company_id,
                week_start: batch.week_start,
                department_id: selectedDepartment || null
            }
        })
        .then(res => {
            if (res.data && res.data.success) {
                setDetailsModal({
                    show: true,
                    loading: false,
                    data: res.data.data,
                    error: null
                });
            } else {
                setDetailsModal(prev => ({
                    ...prev,
                    loading: false,
                    error: res.data.message || 'Could not load schedule details.'
                }));
            }
        })
        .catch(err => {
            setDetailsModal(prev => ({
                ...prev,
                loading: false,
                error: err.response?.data?.message || 'Error loading roster details.'
            }));
        });
    };

    // Approve Handler
    const handleApprove = (batch) => {
        setConfirmingAction({
            show: true,
            title: 'Approve Shift Schedule',
            message: `Are you sure you want to approve the roster for ${batch.company_name} (${batch.week_label})? This will approve ${batch.pending_count || batch.total_shifts} shifts and unlock broadcast to employees.`,
            type: 'info',
            confirmText: 'Approve Roster',
            onConfirm: () => {
                setConfirmingAction(prev => ({ ...prev, processing: true }));
                router.post(route('shift-rosters.approve'), {
                    company_id: batch.company_id,
                    week_start: batch.week_start,
                    department_id: selectedDepartment || null
                }, {
                    preserveScroll: true,
                    onSuccess: () => {
                        setConfirmingAction(prev => ({ ...prev, show: false, processing: false }));
                        if (detailsModal.show) {
                            handleViewDetails(batch);
                        }
                    },
                    onError: () => {
                        setConfirmingAction(prev => ({ ...prev, processing: false }));
                    }
                });
            }
        });
    };

    // Open Reject Modal
    const handleOpenReject = (batch) => {
        setRejectionModal({
            show: true,
            company_id: batch.company_id,
            week_start: batch.week_start,
            reason: '',
            processing: false
        });
    };

    // Submit Rejection
    const submitRejection = () => {
        setRejectionModal(prev => ({ ...prev, processing: true }));
        router.post(route('shift-rosters.reject'), {
            company_id: rejectionModal.company_id,
            week_start: rejectionModal.week_start,
            department_id: selectedDepartment || null,
            rejection_reason: rejectionModal.reason || null
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setRejectionModal({ show: false, company_id: null, week_start: null, reason: '', processing: false });
                if (detailsModal.show && detailsModal.data) {
                    handleViewDetails({
                        company_id: rejectionModal.company_id,
                        week_start: rejectionModal.week_start
                    });
                }
            },
            onError: () => {
                setRejectionModal(prev => ({ ...prev, processing: false }));
            }
        });
    };

    // Reset Handler
    const handleReset = (batch) => {
        setConfirmingAction({
            show: true,
            title: 'Reset Schedule to Pending',
            message: `Are you sure you want to reset this schedule back to pending? This will allow edits and require re-approval before broadcasting.`,
            type: 'warning',
            confirmText: 'Reset to Pending',
            onConfirm: () => {
                setConfirmingAction(prev => ({ ...prev, processing: true }));
                router.post(route('shift-rosters.resetToPending'), {
                    company_id: batch.company_id,
                    week_start: batch.week_start,
                    department_id: selectedDepartment || null
                }, {
                    preserveScroll: true,
                    onSuccess: () => {
                        setConfirmingAction(prev => ({ ...prev, show: false, processing: false }));
                        if (detailsModal.show) {
                            handleViewDetails(batch);
                        }
                    },
                    onError: () => {
                        setConfirmingAction(prev => ({ ...prev, processing: false }));
                    }
                });
            }
        });
    };

    // Broadcast Handler
    const handleBroadcast = (batch) => {
        if (batch.status !== 'approved') {
            setConfirmingAction({
                show: true,
                title: 'Broadcast Blocked',
                message: 'This roster is not yet approved. Broadcast is only allowed after HR or Manager approval.',
                type: 'warning',
                hideCancel: true,
                confirmText: 'OK',
                onConfirm: () => setConfirmingAction(prev => ({ ...prev, show: false }))
            });
            return;
        }

        setConfirmingAction({
            show: true,
            title: 'Broadcast Schedule Notifications',
            message: `Broadcast shift schedules via Email & WhatsApp to all assigned employees for ${batch.company_name} (${batch.week_label})?`,
            type: 'info',
            confirmText: 'Broadcast Now',
            onConfirm: () => {
                setConfirmingAction(prev => ({ ...prev, processing: true }));
                window.axios.post(route('shift-rosters.sendEmails'), {
                    company_id: batch.company_id,
                    week_start: batch.week_start,
                    department_id: selectedDepartment || null
                })
                .then(res => {
                    setConfirmingAction({
                        show: true,
                        title: 'Success',
                        message: res.data.message,
                        type: 'success',
                        hideCancel: true,
                        confirmText: 'Done',
                        onConfirm: () => setConfirmingAction(prev => ({ ...prev, show: false }))
                    });
                })
                .catch(err => {
                    setConfirmingAction({
                        show: true,
                        title: 'Broadcast Error',
                        message: err.response?.data?.message || 'Failed to send roster broadcasts.',
                        type: 'danger',
                        hideCancel: true,
                        confirmText: 'Close',
                        onConfirm: () => setConfirmingAction(prev => ({ ...prev, show: false }))
                    });
                })
                .finally(() => setConfirmingAction(prev => ({ ...prev, processing: false })));
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Shift Roster Management & Approvals" />

            <div className="w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-gray-50/50 min-h-screen">
                
                {/* 1. Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Schedule Operations</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">Shift Roster Management & Approvals</h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                            Track all weekly roster schedules, monitor pending and rejected batches, and audit approval history before broadcasting to employees.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                        <Link
                            href={route('shift-rosters.index')}
                            className="px-4 py-2.5 bg-gray-50 hover:bg-white text-gray-700 border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-medium shadow-sm transition-all flex items-center gap-2 active:scale-95"
                        >
                            <FiCalendar className="w-4 h-4 text-indigo-600" />
                            <span>Calendar Grid View</span>
                        </Link>
                        <Link
                            href={route('shift-rosters.create')}
                            className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-medium shadow-lg shadow-primary/20 hover:brightness-110 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <FiPlus className="w-4 h-4" />
                            <span>Create New Roster</span>
                        </Link>
                    </div>
                </div>

                {/* 2. Top Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Schedules */}
                    <div 
                        onClick={() => { setSelectedStatus('all'); handleFilterChange({ status: 'all' }); }}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                            selectedStatus === 'all'
                                ? 'bg-white border-indigo-300 shadow-lg ring-2 ring-indigo-50'
                                : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Schedules</span>
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FiCalendar className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">{metrics.total_schedules}</span>
                            <span className="text-xs text-gray-500 font-medium">({metrics.total_shifts} shifts)</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">Across all branches & active weeks</p>
                    </div>

                    {/* Pending Approval */}
                    <div 
                        onClick={() => { setSelectedStatus('pending'); handleFilterChange({ status: 'pending' }); }}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                            selectedStatus === 'pending'
                                ? 'bg-amber-50/70 border-amber-300 shadow-lg ring-2 ring-amber-100'
                                : 'bg-white border-gray-100 hover:border-amber-200 shadow-sm hover:shadow-md'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending Sign-Off</span>
                            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FiClock className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-amber-600">{metrics.pending}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                Action Needed
                            </span>
                        </div>
                        <p className="text-[11px] text-amber-700/80 mt-1">Awaiting approval by HR / Manager</p>
                    </div>

                    {/* Approved & Active */}
                    <div 
                        onClick={() => { setSelectedStatus('approved'); handleFilterChange({ status: 'approved' }); }}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                            selectedStatus === 'approved'
                                ? 'bg-emerald-50/70 border-emerald-300 shadow-lg ring-2 ring-emerald-100'
                                : 'bg-white border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-md'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Approved & Ready</span>
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FiCheckCircle className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-emerald-600">{metrics.approved}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                Broadcast Ready
                            </span>
                        </div>
                        <p className="text-[11px] text-emerald-700/80 mt-1">Approved and ready for employee broadcast</p>
                    </div>

                    {/* Rejected / Revisions */}
                    <div 
                        onClick={() => { setSelectedStatus('rejected'); handleFilterChange({ status: 'rejected' }); }}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                            selectedStatus === 'rejected'
                                ? 'bg-rose-50/70 border-rose-300 shadow-lg ring-2 ring-rose-100'
                                : 'bg-white border-gray-100 hover:border-rose-200 shadow-sm hover:shadow-md'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Rejected / Revisions</span>
                            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FiXCircle className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-rose-600">{metrics.rejected}</span>
                            {metrics.rejected > 0 && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                    Requires Edit
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-rose-700/80 mt-1">Rejected with notes for revision</p>
                    </div>
                </div>

                {/* 3. Filter Controls & Status Tabs */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    {/* Status Tabs */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 p-1 bg-gray-100/70 rounded-xl">
                            {[
                                { key: 'all', label: 'All Schedules', count: metrics.total_schedules },
                                { key: 'pending', label: 'Pending Approval', count: metrics.pending, color: 'text-amber-600' },
                                { key: 'approved', label: 'Approved', count: metrics.approved, color: 'text-emerald-600' },
                                { key: 'rejected', label: 'Rejected', count: metrics.rejected, color: 'text-rose-600' },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => {
                                        setSelectedStatus(tab.key);
                                        handleFilterChange({ status: tab.key });
                                    }}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                                        selectedStatus === tab.key
                                            ? 'bg-white text-gray-900 shadow-sm font-semibold'
                                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                        selectedStatus === tab.key ? 'bg-gray-100 font-bold' : 'bg-gray-200/60'
                                    }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {(selectedCompany || selectedDepartment || searchTerm || fromDate || toDate || selectedStatus !== 'all') && (
                            <button
                                onClick={resetFilters}
                                className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1.5 font-medium px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <FiRefreshCw className="w-3.5 h-3.5" />
                                <span>Reset Filters</span>
                            </button>
                        )}
                    </div>

                    {/* Filter Inputs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Company Filter */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Company / Branch</label>
                            <select
                                value={selectedCompany}
                                onChange={e => {
                                    setSelectedCompany(e.target.value);
                                    handleFilterChange({ company_id: e.target.value, department_id: '' });
                                }}
                                className="w-full text-xs rounded-xl border-gray-200 bg-gray-50/70 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 py-2.5 transition-all"
                            >
                                <option value="">All Branches</option>
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Department Filter */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Department</label>
                            <select
                                value={selectedDepartment}
                                onChange={e => {
                                    setSelectedDepartment(e.target.value);
                                    handleFilterChange({ department_id: e.target.value });
                                }}
                                className="w-full text-xs rounded-xl border-gray-200 bg-gray-50/70 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 py-2.5 transition-all"
                            >
                                <option value="">All Departments</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Search Filter */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Search Schedule</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by branch or week..."
                                    value={searchTerm}
                                    onChange={e => {
                                        setSearchTerm(e.target.value);
                                        handleFilterChange({ search: e.target.value });
                                    }}
                                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border-gray-200 bg-gray-50/70 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                                <FiSearch className="absolute left-3 top-3 text-gray-400 w-3.5 h-3.5" />
                            </div>
                        </div>

                        {/* Date From - To */}
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">From Week</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={e => {
                                        setFromDate(e.target.value);
                                        handleFilterChange({ from_date: e.target.value });
                                    }}
                                    className="w-full text-xs rounded-xl border-gray-200 bg-gray-50/70 focus:bg-white py-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">To Week</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={e => {
                                        setToDate(e.target.value);
                                        handleFilterChange({ to_date: e.target.value });
                                    }}
                                    className="w-full text-xs rounded-xl border-gray-200 bg-gray-50/70 focus:bg-white py-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Schedules Batches List Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {batches.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiCalendar className="w-8 h-8" />
                            </div>
                            <h3 className="text-base font-semibold text-gray-800">No Shift Roster Schedules Found</h3>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                                No roster schedules match your active filters. Try adjusting your filter parameters or create a new shift schedule.
                            </p>
                            <div className="mt-5 flex justify-center gap-3">
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    Reset Filters
                                </button>
                                <Link
                                    href={route('shift-rosters.create')}
                                    className="px-4 py-2 text-xs font-medium text-white bg-primary rounded-xl hover:brightness-110 shadow-sm transition-colors"
                                >
                                    Create New Schedule
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                        <th className="py-3.5 px-4 sm:px-6">Branch / Company</th>
                                        <th className="py-3.5 px-4">Schedule Period</th>
                                        <th className="py-3.5 px-4 text-center">Shifts</th>
                                        <th className="py-3.5 px-4 text-center">Staff Count</th>
                                        <th className="py-3.5 px-4">Approval Status</th>
                                        <th className="py-3.5 px-4">Audit / Approver Info</th>
                                        <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-xs">
                                    {batches.map((batch, idx) => {
                                        return (
                                            <tr key={`${batch.company_id}_${batch.week_start}`} className="hover:bg-gray-50/70 transition-colors group">
                                                {/* Branch Name */}
                                                <td className="py-4 px-4 sm:px-6 font-medium text-gray-900">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-xs">
                                                            {batch.company_name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-gray-900 block leading-tight">{batch.company_name}</span>
                                                            <span className="text-[10px] text-gray-400 font-normal">Created: {batch.created_at || 'Recent'}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Schedule Period */}
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-800">{batch.week_label}</span>
                                                        <span className="text-[10px] text-gray-400 font-mono">Starts {batch.week_start}</span>
                                                    </div>
                                                </td>

                                                {/* Shifts Count */}
                                                <td className="py-4 px-4 text-center">
                                                    <span className="font-semibold text-gray-900 text-sm">{batch.total_shifts}</span>
                                                    <span className="text-[10px] text-gray-400 block">shifts</span>
                                                </td>

                                                {/* Staff Count */}
                                                <td className="py-4 px-4 text-center">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg font-medium text-gray-700">
                                                        <FiUserCheck className="w-3 h-3 text-gray-500" />
                                                        <span>{batch.total_employees}</span>
                                                    </div>
                                                </td>

                                                {/* Approval Status */}
                                                <td className="py-4 px-4">
                                                    {batch.status === 'approved' && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span>Approved</span>
                                                        </span>
                                                    )}
                                                    {batch.status === 'pending' && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                                            <span>Pending Approval</span>
                                                        </span>
                                                    )}
                                                    {batch.status === 'rejected' && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                            <FiXCircle className="w-3.5 h-3.5 text-rose-600" />
                                                            <span>Rejected</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Audit / Approver Info */}
                                                <td className="py-4 px-4">
                                                    {batch.status === 'approved' && (
                                                        <div className="flex flex-col">
                                                            <span className="text-gray-800 font-medium text-[11px]">
                                                                By {batch.approved_by_name || 'Manager'}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400">{batch.approved_at}</span>
                                                        </div>
                                                    )}
                                                    {batch.status === 'rejected' && (
                                                        <div className="flex flex-col max-w-[200px]">
                                                            <span className="text-rose-700 font-medium text-[11px] line-clamp-1">
                                                                {batch.rejection_reason ? `"${batch.rejection_reason}"` : 'Revisions requested'}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400">Rejected on {batch.updated_at}</span>
                                                        </div>
                                                    )}
                                                    {batch.status === 'pending' && (
                                                        <span className="text-[11px] text-amber-700/80 italic">
                                                            Awaiting sign-off
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-4 px-4 sm:px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* View Details Button */}
                                                        <button
                                                            onClick={() => handleViewDetails(batch)}
                                                            className="px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 rounded-lg font-medium text-xs transition-colors flex items-center gap-1.5 border border-gray-100 hover:border-indigo-200"
                                                            title="View Full Schedule Breakdown & Audit"
                                                        >
                                                            <FiEye className="w-3.5 h-3.5" />
                                                            <span>Details</span>
                                                        </button>

                                                        {/* Open in Grid Editor */}
                                                        <Link
                                                            href={route('shift-rosters.index', {
                                                                company_id: batch.company_id,
                                                                week_start: batch.week_start
                                                            })}
                                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="Open in Calendar Grid Editor"
                                                        >
                                                            <FiArrowRight className="w-4 h-4" />
                                                        </Link>

                                                        {/* Quick Actions for Approvers */}
                                                        {canApprove && batch.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApprove(batch)}
                                                                    className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors border border-emerald-200 shadow-sm"
                                                                    title="Approve this Schedule"
                                                                >
                                                                    <FiCheck className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleOpenReject(batch)}
                                                                    className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-colors border border-rose-200 shadow-sm"
                                                                    title="Reject this Schedule"
                                                                >
                                                                    <FiX className="w-3.5 h-3.5" />
                                                                </button>
                                                            </>
                                                        )}

                                                        {batch.status === 'approved' && (
                                                            <button
                                                                onClick={() => handleBroadcast(batch)}
                                                                className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors border border-indigo-200 shadow-sm"
                                                                title="Broadcast Schedule to Employees"
                                                            >
                                                                <FiSend className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 5. View Details Modal */}
                <Modal 
                    show={detailsModal.show} 
                    onClose={() => setDetailsModal(prev => ({ ...prev, show: false }))} 
                    maxWidth="5xl"
                >
                    <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                        {detailsModal.loading ? (
                            <div className="py-16 text-center">
                                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-xs text-gray-500 font-medium">Loading schedule details and audit breakdown...</p>
                            </div>
                        ) : detailsModal.error ? (
                            <div className="py-12 text-center">
                                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <FiAlertTriangle className="w-6 h-6" />
                                </div>
                                <h3 className="text-sm font-semibold text-gray-900">{detailsModal.error}</h3>
                                <button
                                    onClick={() => setDetailsModal(prev => ({ ...prev, show: false }))}
                                    className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg"
                                >
                                    Close
                                </button>
                            </div>
                        ) : detailsModal.data ? (
                            <>
                                {/* Modal Header & Audit Card */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{detailsModal.data.company_name}</span>
                                            <span className="text-gray-300">•</span>
                                            <span className="text-xs font-medium text-gray-500">{detailsModal.data.week_label}</span>
                                        </div>
                                        <h2 className="text-lg font-bold text-gray-900 mt-1">Shift Schedule Audit & Details</h2>
                                    </div>

                                    {/* Status Badge in Modal */}
                                    <div className="flex items-center gap-2">
                                        {detailsModal.data.status === 'approved' && (
                                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                                                <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                                                <span>Schedule Approved</span>
                                            </span>
                                        )}
                                        {detailsModal.data.status === 'pending' && (
                                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                                <span>Pending Approval</span>
                                            </span>
                                        )}
                                        {detailsModal.data.status === 'rejected' && (
                                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                                                <FiXCircle className="w-4 h-4 text-rose-600" />
                                                <span>Schedule Rejected</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Audit Summary Banner */}
                                <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                                    detailsModal.data.status === 'approved'
                                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                                        : detailsModal.data.status === 'rejected'
                                        ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                                        : 'bg-amber-50/50 border-amber-200 text-amber-900'
                                }`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg shrink-0 ${
                                            detailsModal.data.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : (detailsModal.data.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')
                                        }`}>
                                            <FiUserCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-bold uppercase tracking-wide">
                                                    {detailsModal.data.status === 'approved' ? 'Approval Verified' : (detailsModal.data.status === 'rejected' ? 'Rejection Feedback' : 'Approval In Review')}
                                                </span>
                                                <span className="text-[11px] opacity-80">
                                                    ({detailsModal.data.total_shifts} shifts across {detailsModal.data.total_employees} staff)
                                                </span>
                                            </div>
                                            <p className="text-xs mt-1">
                                                {detailsModal.data.status === 'approved' ? (
                                                    <>Approved by <span className="font-semibold">{detailsModal.data.approved_by_name || 'HR / Manager'}</span> on <span className="font-semibold">{detailsModal.data.approved_at}</span>. Broadasting unlocked.</>
                                                ) : detailsModal.data.status === 'rejected' ? (
                                                    <>Reason: <span className="font-semibold">{detailsModal.data.rejection_reason || 'Revisions required.'}</span></>
                                                ) : (
                                                    <>This roster has {detailsModal.data.pending_count} pending shifts. Broadcasting to employees is locked until HR or Manager approves.</>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Modal Actions */}
                                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                        {canApprove && (detailsModal.data.status === 'pending' || detailsModal.data.status === 'rejected') && (
                                            <button
                                                onClick={() => handleApprove(detailsModal.data)}
                                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm transition-all flex items-center gap-1.5"
                                            >
                                                <FiCheck className="w-3.5 h-3.5" />
                                                Approve
                                            </button>
                                        )}
                                        {canApprove && detailsModal.data.status === 'pending' && (
                                            <button
                                                onClick={() => handleOpenReject(detailsModal.data)}
                                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                                            >
                                                <FiX className="w-3.5 h-3.5" />
                                                Reject
                                            </button>
                                        )}
                                        {detailsModal.data.status === 'approved' && (
                                            <button
                                                onClick={() => handleBroadcast(detailsModal.data)}
                                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm transition-all flex items-center gap-1.5"
                                            >
                                                <FiSend className="w-3.5 h-3.5" />
                                                Broadcast Alerts
                                            </button>
                                        )}
                                        {canApprove && (detailsModal.data.status === 'approved' || detailsModal.data.status === 'rejected') && (
                                            <button
                                                onClick={() => handleReset(detailsModal.data)}
                                                className="px-3 py-1.5 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                                            >
                                                Reset to Pending
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Weekly Shifts Breakdown Table */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Employee Weekly Schedule Breakdown</h3>
                                        <Link
                                            href={route('shift-rosters.index', {
                                                company_id: detailsModal.data.company_id,
                                                week_start: detailsModal.data.week_start
                                            })}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                                        >
                                            <span>Open in Calendar Grid</span>
                                            <FiArrowRight className="w-3 h-3" />
                                        </Link>
                                    </div>

                                    <div className="border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                                                    <th className="py-2.5 px-3 min-w-[180px] sticky left-0 bg-gray-50 z-10 border-r border-gray-200">Employee</th>
                                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                                                        <th key={day} className="py-2.5 px-2 text-center min-w-[110px]">
                                                            {day}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {detailsModal.data.employees?.map(emp => (
                                                    <tr key={emp.employee_id} className="hover:bg-gray-50/50">
                                                        {/* Employee Name */}
                                                        <td className="py-2.5 px-3 sticky left-0 bg-white border-r border-gray-100 z-10">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar src={emp.employee_image} name={emp.employee_name} size="sm" />
                                                                <div className="flex flex-col">
                                                                    <span className="font-semibold text-gray-900 leading-tight">{emp.employee_name}</span>
                                                                    <span className="text-[10px] text-gray-400">{emp.designation || emp.department_name}</span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* 7 Days */}
                                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                                            const shift = emp.days[day];
                                                            const isOff = !shift || shift.shift_time === 'Off' || shift.shift_time === 'Weekly Off';
                                                            return (
                                                                <td key={day} className="py-2.5 px-2 text-center">
                                                                    {isOff ? (
                                                                        <span className="inline-block px-2 py-1 text-[9px] font-medium text-gray-400 bg-gray-50 rounded border border-gray-100">
                                                                            Off
                                                                        </span>
                                                                    ) : (
                                                                        <div className="p-1.5 rounded-lg border border-gray-100 bg-white shadow-xs flex flex-col items-center">
                                                                            <span className="font-semibold text-gray-900 text-[10px] leading-tight">{shift.shift_time}</span>
                                                                            <span className="text-[8px] text-gray-400 uppercase mt-0.5">{shift.shift_type || 'General'}</span>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Modal Close Footer */}
                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <div className="text-[11px] text-gray-400">
                                        Shift Schedule ID: {detailsModal.data.company_slug}_{detailsModal.data.week_start}
                                    </div>
                                    <button
                                        onClick={() => setDetailsModal(prev => ({ ...prev, show: false }))}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-medium rounded-xl transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </Modal>

                {/* 6. Reject Reason Modal */}
                <Modal 
                    show={rejectionModal.show} 
                    onClose={() => setRejectionModal({ show: false, company_id: null, week_start: null, reason: '', processing: false })} 
                    maxWidth="md"
                >
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <FiXCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Reject Shift Schedule</h3>
                                <p className="text-xs text-gray-500">Provide feedback so the creator can revise shifts.</p>
                            </div>
                        </div>

                        <div className="mt-4 mb-5">
                            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Reason / Instructions for Revision</label>
                            <textarea
                                value={rejectionModal.reason}
                                onChange={e => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="e.g. Please reschedule Friday shift coverage or adjust staff headcount..."
                                rows={3}
                                className="w-full text-xs rounded-xl border-gray-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 p-3"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setRejectionModal({ show: false, company_id: null, week_start: null, reason: '', processing: false })}
                                className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={rejectionModal.processing}
                                onClick={submitRejection}
                                className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm disabled:opacity-50 transition-colors"
                            >
                                {rejectionModal.processing ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* 7. Action Confirmation Modal */}
                <ConfirmationModal
                    show={confirmingAction.show}
                    title={confirmingAction.title}
                    message={confirmingAction.message}
                    onConfirm={confirmingAction.onConfirm}
                    onClose={() => setConfirmingAction(prev => ({ ...prev, show: false }))}
                    type={confirmingAction.type}
                    processing={confirmingAction.processing}
                    hideCancel={confirmingAction.hideCancel}
                    confirmText={confirmingAction.confirmText}
                />
            </div>
        </AuthenticatedLayout>
    );
}
