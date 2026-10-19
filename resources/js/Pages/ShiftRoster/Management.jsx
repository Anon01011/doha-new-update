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
    FiX,
    FiUsers,
    FiLayers,
    FiShield,
    FiSun,
    FiMoon,
    FiExternalLink,
    FiBriefcase
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

    // Details Modal State & In-Modal Filters
    const [detailsModal, setDetailsModal] = useState({
        show: false,
        loading: false,
        data: null,
        error: null
    });
    const [modalSearchTerm, setModalSearchTerm] = useState('');
    const [modalShiftFilter, setModalShiftFilter] = useState('all');

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
        setModalSearchTerm('');
        setModalShiftFilter('all');
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

    // Day definitions for 7-day schedule
    const dayColumns = [
        { key: 'Monday', short: 'Mon', index: 0 },
        { key: 'Tuesday', short: 'Tue', index: 1 },
        { key: 'Wednesday', short: 'Wed', index: 2 },
        { key: 'Thursday', short: 'Thu', index: 3 },
        { key: 'Friday', short: 'Fri', index: 4 },
        { key: 'Saturday', short: 'Sat', index: 5 },
        { key: 'Sunday', short: 'Sun', index: 6 },
    ];

    const getDayDateLabel = (weekStart, dayIndex) => {
        if (!weekStart) return '';
        try {
            const parts = weekStart.split('-');
            if (parts.length === 3) {
                const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                d.setDate(d.getDate() + dayIndex);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
        } catch {
            return '';
        }
        return '';
    };

    // Calculate shift counts inside the active modal
    const modalShiftMetrics = useMemo(() => {
        if (!detailsModal.data?.employees) {
            return { morning: 0, evening: 0, night: 0, off: 0, total: 0 };
        }
        let morning = 0, evening = 0, night = 0, off = 0, total = 0;
        detailsModal.data.employees.forEach(emp => {
            Object.values(emp.days || {}).forEach(d => {
                const text = ((d.shift_time || '') + ' ' + (d.shift_type || '')).toLowerCase();
                if (!d.shift_time || d.shift_time === 'Off' || d.shift_time === 'Weekly Off') {
                    off++;
                } else {
                    total++;
                    if (text.includes('night') || text.includes('10:00 pm') || text.includes('11:00 pm')) {
                        night++;
                    } else if (text.includes('evening') || text.includes('02:00 pm') || text.includes('03:00 pm')) {
                        evening++;
                    } else if (text.includes('morning') || text.includes('06:00 am') || text.includes('07:00 am') || text.includes('08:00 am')) {
                        morning++;
                    }
                }
            });
        });
        return { morning, evening, night, off, total };
    }, [detailsModal.data]);

    // Filter employees in the active modal by search term & shift filter
    const filteredModalEmployees = useMemo(() => {
        if (!detailsModal.data?.employees) return [];
        let list = detailsModal.data.employees;

        if (modalSearchTerm.trim()) {
            const term = modalSearchTerm.toLowerCase();
            list = list.filter(emp =>
                emp.employee_name?.toLowerCase().includes(term) ||
                emp.designation?.toLowerCase().includes(term) ||
                emp.department_name?.toLowerCase().includes(term)
            );
        }

        if (modalShiftFilter !== 'all') {
            list = list.filter(emp => {
                const daysValues = Object.values(emp.days || {});
                if (modalShiftFilter === 'morning') {
                    return daysValues.some(d => ((d.shift_type || '') + ' ' + (d.shift_time || '')).toLowerCase().includes('morning') || (d.shift_time || '').includes('06:') || (d.shift_time || '').includes('07:') || (d.shift_time || '').includes('08:'));
                }
                if (modalShiftFilter === 'evening') {
                    return daysValues.some(d => ((d.shift_type || '') + ' ' + (d.shift_time || '')).toLowerCase().includes('evening') || (d.shift_time || '').includes('02:') || (d.shift_time || '').includes('03:'));
                }
                if (modalShiftFilter === 'night') {
                    return daysValues.some(d => ((d.shift_type || '') + ' ' + (d.shift_time || '')).toLowerCase().includes('night') || (d.shift_time || '').includes('10:') || (d.shift_time || '').includes('11:'));
                }
                if (modalShiftFilter === 'has_off') {
                    return daysValues.some(d => !d.shift_time || d.shift_time === 'Off' || d.shift_time === 'Weekly Off');
                }
                return true;
            });
        }

        return list;
    }, [detailsModal.data?.employees, modalSearchTerm, modalShiftFilter]);

    const renderModalShiftCell = (shift) => {
        if (!shift || shift.shift_time === 'Off' || shift.shift_time === 'Weekly Off') {
            return (
                <div className="py-2 px-1.5 rounded-xl bg-gray-50/80 border border-gray-100 flex flex-col items-center justify-center min-h-[54px]">
                    <span className="text-[11px] font-semibold text-gray-400">Off</span>
                    <span className="text-[9px] text-gray-400/80">Weekly Off</span>
                </div>
            );
        }

        const t = ((shift.shift_time || '') + ' ' + (shift.shift_type || '')).toLowerCase();
        let cardClass = "bg-slate-50/70 border-slate-200/80 text-slate-800";
        let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
        let icon = "🕒";
        let typeName = shift.shift_type || 'Shift';

        if (t.includes('night') || t.includes('10:00 pm') || t.includes('11:00 pm') || t.includes('12:00 am')) {
            cardClass = "bg-indigo-50/60 border-indigo-200/90 text-indigo-950";
            badgeClass = "bg-indigo-100 text-indigo-700 border-indigo-200";
            icon = "🌙";
            typeName = shift.shift_type || 'Night';
        } else if (t.includes('evening') || t.includes('02:00 pm') || t.includes('03:00 pm') || t.includes('04:00 pm')) {
            cardClass = "bg-amber-50/60 border-amber-200/90 text-amber-950";
            badgeClass = "bg-amber-100 text-amber-800 border-amber-200";
            icon = "⛅";
            typeName = shift.shift_type || 'Evening';
        } else if (t.includes('morning') || t.includes('06:00 am') || t.includes('07:00 am') || t.includes('08:00 am')) {
            cardClass = "bg-sky-50/60 border-sky-200/90 text-sky-950";
            badgeClass = "bg-sky-100 text-sky-800 border-sky-200";
            icon = "☀️";
            typeName = shift.shift_type || 'Morning';
        }

        return (
            <div className={`p-1.5 rounded-xl border ${cardClass} flex flex-col items-center justify-center min-h-[54px] transition-all hover:shadow-xs hover:scale-[1.02]`}>
                <span className="font-bold text-[10.5px] leading-tight text-gray-900 whitespace-nowrap">
                    {shift.shift_time}
                </span>
                <div className="mt-1 flex items-center gap-1">
                    <span className={`text-[8.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${badgeClass} flex items-center gap-0.5`}>
                        <span>{icon}</span>
                        <span>{typeName}</span>
                    </span>
                </div>
                {shift.notes && (
                    <span className="text-[8.5px] text-gray-400 truncate max-w-[110px] mt-0.5" title={shift.notes}>
                        {shift.notes}
                    </span>
                )}
            </div>
        );
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
                    maxWidth="full"
                >
                    <div className="p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        {detailsModal.loading ? (
                            <div className="py-20 text-center">
                                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <h4 className="text-sm font-bold text-gray-800">Loading Schedule Details</h4>
                                <p className="text-xs text-gray-500 mt-1">Retrieving weekly shift breakdown, audit logs, and employee rosters...</p>
                            </div>
                        ) : detailsModal.error ? (
                            <div className="py-14 text-center">
                                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                                    <FiAlertTriangle className="w-7 h-7" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">{detailsModal.error}</h3>
                                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">An error occurred while fetching details for this roster schedule batch.</p>
                                <button
                                    onClick={() => setDetailsModal(prev => ({ ...prev, show: false }))}
                                    className="mt-5 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
                                >
                                    Close Window
                                </button>
                            </div>
                        ) : detailsModal.data ? (
                            <>
                                {/* Modal Header */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider flex items-center gap-1.5">
                                                <FiBriefcase className="w-3.5 h-3.5" />
                                                {detailsModal.data.company_name}
                                            </span>
                                            <span className="text-gray-300">•</span>
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 flex items-center gap-1.5">
                                                <FiCalendar className="w-3.5 h-3.5 text-gray-500" />
                                                {detailsModal.data.week_label}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200/60">
                                                {detailsModal.data.total_shifts} Total Shifts
                                            </span>
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                                            Shift Schedule Audit & Weekly Breakdown
                                        </h2>
                                    </div>

                                    {/* Right Status Badge & Close 'X' */}
                                    <div className="flex items-center gap-3">
                                        {detailsModal.data.status === 'approved' && (
                                            <span className="px-4 py-2 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs flex items-center gap-2">
                                                <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                                                <span>Schedule Approved</span>
                                            </span>
                                        )}
                                        {detailsModal.data.status === 'pending' && (
                                            <span className="px-4 py-2 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs flex items-center gap-2">
                                                <span className="relative flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                                </span>
                                                <span>Pending Approval</span>
                                            </span>
                                        )}
                                        {detailsModal.data.status === 'rejected' && (
                                            <span className="px-4 py-2 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs flex items-center gap-2">
                                                <FiXCircle className="w-4 h-4 text-rose-600" />
                                                <span>Revisions Required</span>
                                            </span>
                                        )}

                                        <button
                                            onClick={() => setDetailsModal(prev => ({ ...prev, show: false }))}
                                            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors"
                                            title="Close modal"
                                        >
                                            <FiX className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Audit Status & Action Banner */}
                                <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                                    detailsModal.data.status === 'approved'
                                        ? 'bg-gradient-to-r from-emerald-50/80 via-emerald-50/30 to-white border-emerald-200 shadow-sm'
                                        : detailsModal.data.status === 'rejected'
                                        ? 'bg-gradient-to-r from-rose-50/80 via-rose-50/30 to-white border-rose-200 shadow-sm'
                                        : 'bg-gradient-to-r from-amber-50/80 via-amber-50/30 to-white border-amber-200 shadow-sm'
                                }`}>
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex items-start gap-3.5">
                                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                                                detailsModal.data.status === 'approved'
                                                    ? 'bg-emerald-600 text-white'
                                                    : detailsModal.data.status === 'rejected'
                                                    ? 'bg-rose-600 text-white'
                                                    : 'bg-amber-500 text-white'
                                            }`}>
                                                {detailsModal.data.status === 'approved' ? (
                                                    <FiShield className="w-5 h-5" />
                                                ) : detailsModal.data.status === 'rejected' ? (
                                                    <FiAlertTriangle className="w-5 h-5" />
                                                ) : (
                                                    <FiUserCheck className="w-5 h-5" />
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${
                                                        detailsModal.data.status === 'approved'
                                                            ? 'text-emerald-800'
                                                            : detailsModal.data.status === 'rejected'
                                                            ? 'text-rose-800'
                                                            : 'text-amber-800'
                                                    }`}>
                                                        {detailsModal.data.status === 'approved' 
                                                            ? 'Approval Verified & Signed Off' 
                                                            : detailsModal.data.status === 'rejected' 
                                                            ? 'Schedule Rejected — Revisions Required' 
                                                            : 'Approval in Review'}
                                                    </span>
                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/80 border border-gray-200/80 text-gray-700 shadow-xs">
                                                        {detailsModal.data.total_shifts} shifts across {detailsModal.data.total_employees} staff
                                                    </span>
                                                </div>

                                                <div className="text-xs text-gray-600 leading-relaxed">
                                                    {detailsModal.data.status === 'approved' ? (
                                                        <>
                                                            Verified & approved by <span className="font-bold text-gray-900">{detailsModal.data.approved_by_name || 'HR / Manager'}</span> on <span className="font-semibold text-gray-900">{detailsModal.data.approved_at}</span>. All shifts are authorized and broadcasting to employees is unlocked.
                                                        </>
                                                    ) : detailsModal.data.status === 'rejected' ? (
                                                        <div className="mt-1">
                                                            <span className="font-medium text-rose-700">Rejection Feedback: </span>
                                                            <span className="font-semibold text-rose-950 bg-white/80 px-2 py-0.5 rounded-md border border-rose-200">
                                                                {detailsModal.data.rejection_reason || 'Please review shift assignments and revise.'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            This roster currently has <span className="font-bold text-amber-900">{detailsModal.data.pending_count} pending shifts</span>. Broadcasting to employees is locked until HR or a Manager reviews and approves the schedule.
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2.5 shrink-0 flex-wrap lg:justify-end">
                                            {canApprove && (detailsModal.data.status === 'pending' || detailsModal.data.status === 'rejected') && (
                                                <button
                                                    onClick={() => handleApprove(detailsModal.data)}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2 active:scale-95"
                                                >
                                                    <FiCheck className="w-4 h-4" />
                                                    <span>Approve Schedule</span>
                                                </button>
                                            )}

                                            {canApprove && detailsModal.data.status === 'pending' && (
                                                <button
                                                    onClick={() => handleOpenReject(detailsModal.data)}
                                                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 active:scale-95"
                                                >
                                                    <FiX className="w-4 h-4" />
                                                    <span>Reject Roster</span>
                                                </button>
                                            )}

                                            {detailsModal.data.status === 'approved' && (
                                                <button
                                                    onClick={() => handleBroadcast(detailsModal.data)}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2 active:scale-95"
                                                >
                                                    <FiSend className="w-4 h-4" />
                                                    <span>Broadcast to Employees</span>
                                                </button>
                                            )}

                                            {canApprove && (detailsModal.data.status === 'approved' || detailsModal.data.status === 'rejected') && (
                                                <button
                                                    onClick={() => handleReset(detailsModal.data)}
                                                    className="px-3.5 py-2 text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium transition-colors"
                                                >
                                                    Reset to Pending
                                                </button>
                                            )}

                                            <Link
                                                href={route('shift-rosters.index', {
                                                    company_id: detailsModal.data.company_id,
                                                    week_start: detailsModal.data.week_start
                                                })}
                                                className="px-3.5 py-2 text-indigo-700 hover:text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200/80 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
                                            >
                                                <FiExternalLink className="w-3.5 h-3.5" />
                                                <span>Open Calendar</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Shift Breakdown Ribbon & In-Modal Filter Bar */}
                                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70 space-y-3">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        {/* Quick Shift Summary Badges */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-1">Shifts Breakdown:</span>
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 shadow-xs flex items-center gap-1.5">
                                                <FiUsers className="w-3.5 h-3.5 text-indigo-600" />
                                                <span>{detailsModal.data.total_employees} Staff</span>
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 border border-sky-200 text-sky-800 flex items-center gap-1.5">
                                                <span>☀️</span>
                                                <span>{modalShiftMetrics.morning} Morning</span>
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1.5">
                                                <span>⛅</span>
                                                <span>{modalShiftMetrics.evening} Evening</span>
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-800 flex items-center gap-1.5">
                                                <span>🌙</span>
                                                <span>{modalShiftMetrics.night} Night</span>
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 border border-gray-200 text-gray-600 flex items-center gap-1.5">
                                                <span>💤</span>
                                                <span>{modalShiftMetrics.off} Weekly Offs</span>
                                            </span>
                                        </div>

                                        {/* Total Match Counter */}
                                        <span className="text-xs text-gray-500 font-medium">
                                            Showing <span className="font-bold text-gray-900">{filteredModalEmployees.length}</span> of {detailsModal.data.total_employees} staff
                                        </span>
                                    </div>

                                    {/* Search & Shift Filter Controls */}
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-200/60">
                                        {/* Search */}
                                        <div className="relative flex-1 max-w-md">
                                            <input
                                                type="text"
                                                placeholder="Search staff by name, role, department..."
                                                value={modalSearchTerm}
                                                onChange={e => setModalSearchTerm(e.target.value)}
                                                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                                            />
                                            <FiSearch className="absolute left-3 top-2.5 text-gray-400 w-3.5 h-3.5" />
                                            {modalSearchTerm && (
                                                <button
                                                    onClick={() => setModalSearchTerm('')}
                                                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                                                >
                                                    <FiX className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Shift Filter Pills */}
                                        <div className="flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-xl overflow-x-auto shadow-xs">
                                            {[
                                                { key: 'all', label: 'All Shifts' },
                                                { key: 'morning', label: '☀️ Morning' },
                                                { key: 'evening', label: '⛅ Evening' },
                                                { key: 'night', label: '🌙 Night' },
                                                { key: 'has_off', label: 'Has Off' }
                                            ].map(f => (
                                                <button
                                                    key={f.key}
                                                    onClick={() => setModalShiftFilter(f.key)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                                                        modalShiftFilter === f.key
                                                            ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* 7-Day Weekly Schedule Breakdown Table */}
                                <div className="border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm bg-white">
                                    <div className="overflow-x-auto max-h-[58vh] overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="bg-slate-100/90 border-b border-gray-200 sticky top-0 z-30">
                                                    {/* Employee sticky column */}
                                                    <th className="py-3 px-4 min-w-[240px] sticky left-0 top-0 bg-slate-100 z-40 border-r border-gray-200 font-bold text-[10px] uppercase tracking-wider text-slate-600 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                                                        <div className="flex items-center justify-between">
                                                            <span>Employee & Role</span>
                                                            <span className="text-[9px] font-semibold text-slate-400 lowercase">({filteredModalEmployees.length})</span>
                                                        </div>
                                                    </th>

                                                    {/* 7 Day Columns with date labels */}
                                                    {dayColumns.map(day => {
                                                        const dateLabel = getDayDateLabel(detailsModal.data.week_start, day.index);
                                                        const isWeekend = day.key === 'Saturday' || day.key === 'Sunday';
                                                        return (
                                                            <th 
                                                                key={day.key} 
                                                                className={`py-3 px-2.5 text-center min-w-[130px] border-r border-gray-200/60 last:border-r-0 ${
                                                                    isWeekend ? 'bg-slate-200/40' : ''
                                                                }`}
                                                            >
                                                                <div className="flex flex-col items-center">
                                                                    <span className="font-bold text-[11px] text-slate-800 tracking-wider">
                                                                        {day.short}
                                                                    </span>
                                                                    {dateLabel && (
                                                                        <span className="text-[10px] font-medium text-slate-500 mt-0.5">
                                                                            {dateLabel}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </th>
                                                        );
                                                    })}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredModalEmployees.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={8} className="py-14 text-center text-gray-500">
                                                            <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                <FiSearch className="w-5 h-5" />
                                                            </div>
                                                            <p className="text-xs font-semibold text-gray-700">No employees match your search criteria</p>
                                                            <p className="text-[11px] text-gray-400 mt-0.5">Try clearing your search term or shift filter</p>
                                                            <button
                                                                onClick={() => { setModalSearchTerm(''); setModalShiftFilter('all'); }}
                                                                className="mt-3 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                                                            >
                                                                Reset In-Modal Filters
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredModalEmployees.map(emp => {
                                                        // Count offs and shifts for this employee
                                                        let empShifts = 0, empOffs = 0;
                                                        dayColumns.forEach(d => {
                                                            const s = emp.days[d.key];
                                                            if (!s || s.shift_time === 'Off' || s.shift_time === 'Weekly Off') {
                                                                empOffs++;
                                                            } else {
                                                                empShifts++;
                                                            }
                                                        });

                                                        return (
                                                            <tr key={emp.employee_id} className="hover:bg-indigo-50/20 transition-colors group">
                                                                {/* Employee sticky cell */}
                                                                <td className="py-2.5 px-4 sticky left-0 bg-white group-hover:bg-[#f7f8fe] border-r border-gray-100 z-20 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] transition-colors">
                                                                    <div className="flex items-center gap-2.5">
                                                                        <Avatar src={emp.employee_image} name={emp.employee_name} size="sm" />
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="font-bold text-gray-900 text-xs truncate leading-tight group-hover:text-indigo-600 transition-colors">
                                                                                {emp.employee_name}
                                                                            </span>
                                                                            <span className="text-[10px] text-gray-400 truncate mt-0.5">
                                                                                {emp.designation || emp.department_name || 'Staff'}
                                                                            </span>
                                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                                                    {empShifts} shifts
                                                                                </span>
                                                                                <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-gray-100 text-gray-500">
                                                                                    {empOffs} off
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* 7 Days Cells */}
                                                                {dayColumns.map(day => {
                                                                    const shift = emp.days[day.key];
                                                                    const isWeekend = day.key === 'Saturday' || day.key === 'Sunday';
                                                                    return (
                                                                        <td 
                                                                            key={day.key} 
                                                                            className={`py-2 px-2 text-center border-r border-gray-100/70 last:border-r-0 ${
                                                                                isWeekend ? 'bg-slate-50/30' : ''
                                                                            }`}
                                                                        >
                                                                            {renderModalShiftCell(shift)}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Modal Close Footer */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
                                    <div className="text-xs text-gray-400 flex items-center gap-2">
                                        <span className="font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                            {detailsModal.data.company_slug}_{detailsModal.data.week_start}
                                        </span>
                                        <span>•</span>
                                        <span>{filteredModalEmployees.length} staff records listed</span>
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                        <Link
                                            href={route('shift-rosters.index', {
                                                company_id: detailsModal.data.company_id,
                                                week_start: detailsModal.data.week_start
                                            })}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                                        >
                                            <FiCalendar className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>Open in Calendar Grid</span>
                                        </Link>
                                        <button
                                            onClick={() => setDetailsModal(prev => ({ ...prev, show: false }))}
                                            className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
                                        >
                                            Close
                                        </button>
                                    </div>
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
