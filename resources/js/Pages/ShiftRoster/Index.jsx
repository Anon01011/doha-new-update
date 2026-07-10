import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import Avatar from '@/Components/Avatar';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Modal from '@/Components/Modal';
import { FiCopy, FiCheck, FiInfo } from 'react-icons/fi';

const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function getWeekDays(startDate) {
    const days = [];
    const start = new Date(startDate + 'T00:00:00');
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push({
            date: formatDate(d),
            label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            day: d.toLocaleDateString('en-US', { weekday: 'long' })
        });
    }
    return days;
}

function getMonthDays(year, month) {
    const days = [];
    const start = new Date(year, month, 1, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 0, 0, 0);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push({
            date: formatDate(d),
            label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            day: d.toLocaleDateString('en-US', { weekday: 'long' })
        });
    }
    return days;
}

function getDaysInRange(startDate, endDate) {
    const days = [];
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push({
            date: formatDate(d),
            label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            day: d.toLocaleDateString('en-US', { weekday: 'long' })
        });
    }
    return days;
}

const isEmployeeWeeklyOff = (employee, dateStr) => {
    if (!employee) return false;
    const date = new Date(dateStr + 'T00:00:00');
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

    // 1. Check staff-wise weekly off
    const staffOffs = employee.weekly_offs || employee.weeklyOffs || [];
    if (staffOffs.length > 0) {
        const validOffs = staffOffs
            .filter(w => w.effective_date && w.effective_date.slice(0, 10) <= dateStr)
            .sort((a, b) => b.effective_date.localeCompare(a.effective_date));
        if (validOffs.length > 0) {
            return validOffs[0].weekly_off_day === dayName;
        }
    }

    // 2. Fallback: branch weekly off days
    const branchOffs = employee.company?.weekly_off_days || [];
    return branchOffs.includes(dayName);
};

export default function Index({
    companies = [],
    departments = [],
    employees = [],
    rosters = [],
    week_start,
    company_id,
    department_id,
    shiftTemplates = {},
    shiftTypes = [],
    userRole = 'admin'
}) {
    const isEmployee = userRole === 'employee';
    const [viewMode, setViewMode] = useState('week');
    const [selectedCompany, setSelectedCompany] = useState(company_id || '');
    const [selectedDepartment, setSelectedDepartment] = useState(department_id || '');
    const [isLoading, setIsLoading] = useState(false);
    const [showAdvancedActions, setShowAdvancedActions] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [copiedRoster, setCopiedRoster] = useState(false);
    const [editingRoster, setEditingRoster] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        shift_time: '',
        shift_type: '',
        designation: '',
        notes: ''
    });

    const [confirmingAction, setConfirmingAction] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger',
        processing: false,
        hideCancel: false,
        confirmText: 'Confirm'
    });

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedRoster(true);
        setTimeout(() => setCopiedRoster(false), 2000);
    };

    // Date states
    const [weekStart, setWeekStart] = useState(week_start || (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const day = today.getDay(), diff = today.getDate() - day + (day === 0 ? -6 : 1);
        return formatDate(new Date(today.setDate(diff)));
    })());

    const [monthYear, setMonthYear] = useState(() => {
        const today = new Date();
        return { year: today.getFullYear(), month: today.getMonth() };
    });

    const [customStart, setCustomStart] = useState(() => {
        return formatDate(new Date());
    });
    const [customEnd, setCustomEnd] = useState(() => {
        const today = new Date();
        today.setDate(today.getDate() + 6);
        return formatDate(today);
    });

    // Ref to track previous parameters
    const prevParamsRef = useRef();

    // Get days based on view mode
    const days = useMemo(() => {
        if (viewMode === 'week') return getWeekDays(weekStart);
        if (viewMode === 'month') return getMonthDays(monthYear.year, monthYear.month);
        if (viewMode === 'custom') return getDaysInRange(customStart, customEnd);
        return [];
    }, [viewMode, weekStart, monthYear, customStart, customEnd]);

    // Build a map: {employee_id}_{date} => roster
    const rosterMap = useMemo(() => {
        const map = {};
        if (rosters && Array.isArray(rosters)) {
            rosters.forEach(r => {
                if (r && r.employee_id && r.date) {
                    map[`${r.employee_id}_${r.date}`] = r;
                }
            });
        }
        return map;
    }, [rosters]);

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => (
            (!selectedCompany || emp.company_id == selectedCompany) &&
            (!selectedDepartment || emp.department_id == selectedDepartment) &&
            (emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (emp.designation && emp.designation.toLowerCase().includes(searchTerm.toLowerCase())))
        ));
    }, [employees, selectedCompany, selectedDepartment, searchTerm]);

    const updateRoster = (params) => {
        const paramsString = JSON.stringify(params);
        if (prevParamsRef.current === paramsString) return;
        prevParamsRef.current = paramsString;

        setIsLoading(true);
        router.get(route('shift-rosters.index'), params, {
            preserveState: true,
            replace: true,
            onFinish: () => setIsLoading(false),
        });
    };

    useEffect(() => {
        const params = { company_id: selectedCompany };
        if (selectedDepartment) params.department_id = selectedDepartment;
        if (viewMode === 'week') params.week_start = weekStart;
        if (viewMode === 'month') {
            params.month = monthYear.month;
            params.year = monthYear.year;
        }
        if (viewMode === 'custom') {
            params.start_date = customStart;
            params.end_date = customEnd;
        }
        updateRoster(params);
    }, [selectedCompany, selectedDepartment, weekStart, viewMode, monthYear, customStart, customEnd]);

    const handleWeekChange = (direction) => {
        const d = new Date(weekStart + 'T00:00:00');
        d.setDate(d.getDate() + direction * 7);
        setWeekStart(formatDate(d));
    };

    const handleMonthChange = (direction) => {
        const newMonth = monthYear.month + direction;
        if (newMonth < 0) {
            setMonthYear({ year: monthYear.year - 1, month: 11 });
        } else if (newMonth > 11) {
            setMonthYear({ year: monthYear.year + 1, month: 0 });
        } else {
            setMonthYear({ ...monthYear, month: newMonth });
        }
    };

    // Modal Handlers
    const handleOpenEdit = (roster, employee, dayObj) => {
        if (isEmployee) return;

        setEditingRoster({
            ...roster,
            employee: employee,
            date: dayObj.date,
            day: dayObj.day
        });

        setEditForm({
            shift_time: roster?.shift_time || '',
            shift_type: roster?.shift_type || '',
            designation: roster?.designation || employee.designation || '',
            notes: roster?.notes || ''
        });

        setShowEditModal(true);
    };

    const handleSaveShift = () => {
        if (!editingRoster) return;
        setIsSaving(true);

        const data = {
            ...editForm,
            employee_id: editingRoster.employee_id || editingRoster.employee.id,
            company_id: selectedCompany || editingRoster.employee.company_id,
            week_start: editingRoster.week_start || weekStart,
            day: editingRoster.day
        };

        const options = {
            onSuccess: () => {
                setShowEditModal(false);
                setEditingRoster(null);
            },
            onFinish: () => setIsSaving(false),
            preserveState: true
        };

        if (editingRoster.id) {
            router.put(route('shift-rosters.update', editingRoster.id), data, options);
        } else {
            router.post(route('shift-rosters.createShift'), data, options);
        }
    };

    const handleDeleteShift = () => {
        if (!editingRoster?.id) return;
        setConfirmingAction({
            show: true,
            title: 'Delete Shift',
            message: 'Are you sure you want to permanently delete this shift?',
            type: 'danger',
            onConfirm: () => {
                setConfirmingAction(prev => ({ ...prev, processing: true }));
                router.delete(route('shift-rosters.destroy', editingRoster.id), {
                    onSuccess: () => {
                        setShowEditModal(false);
                        setConfirmingAction(prev => ({ ...prev, show: false }));
                    },
                    onFinish: () => setConfirmingAction(prev => ({ ...prev, processing: false }))
                });
            }
        });
    };

    const applyTemplate = (key) => {
        const template = shiftTemplates[key];
        if (template) {
            setEditForm(prev => ({
                ...prev,
                shift_time: template.time,
                shift_type: template.type
            }));
        }
    };

    // Advanced Actions
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [targetDuplicateDate, setTargetDuplicateDate] = useState('');

    const handleDuplicateWeek = () => {
        setShowDuplicateModal(true);
    };

    const confirmDuplicateWeek = () => {
        if (!targetDuplicateDate) {
            setConfirmingAction({
                show: true,
                title: 'Date Required',
                message: 'Please select a target week to duplicate shifts to.',
                type: 'warning',
                hideCancel: true,
                confirmText: 'OK',
                onConfirm: () => setConfirmingAction(prev => ({ ...prev, show: false }))
            });
            return;
        }

        // Ensure data is snapped to Monday
        const d = new Date(targetDuplicateDate + 'T00:00:00');
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const mondayDate = formatDate(new Date(d.setDate(diff)));

        setIsSaving(true);
        router.post(route('shift-rosters.duplicateWeek'), {
            source_week: weekStart,
            target_week: mondayDate,
            company_id: selectedCompany,
            department_id: selectedDepartment || null
        }, {
            onSuccess: () => {
                setShowDuplicateModal(false);
                setTargetDuplicateDate('');
                setConfirmingAction({
                    show: true,
                    title: 'Success',
                    message: `Week duplicated successfully for week starting ${mondayDate}!`,
                    type: 'success',
                    hideCancel: true,
                    confirmText: 'Great',
                    onConfirm: () => setConfirmingAction(prev => ({ ...prev, show: false }))
                });
            },
            onFinish: () => setIsSaving(false)
        });
    };

    const handleExport = () => {
        let url = route('shift-rosters.export-week') + `?week_start=${weekStart}&company_id=${selectedCompany}`;
        if (selectedDepartment) url += `&department_id=${selectedDepartment}`;
        window.location.href = url;
    };

    const handleSendEmails = () => {
        setConfirmingAction({
            show: true,
            title: 'Send Notifications',
            message: 'Are you sure you want to send shift notifications to all assigned employees?',
            type: 'info',
            onConfirm: () => {
                setConfirmingAction(prev => ({ ...prev, processing: true }));
                window.axios.post(route('shift-rosters.sendEmails'), {
                    company_id: selectedCompany,
                    week_start: weekStart,
                    department_id: selectedDepartment || null
                })
                    .then(res => {
                        setConfirmingAction({
                            show: true,
                            title: 'Success',
                            message: res.data.message,
                            type: 'success',
                            hideCancel: true,
                            confirmText: 'OK',
                            onConfirm: () => setConfirmingAction(prev => ({ ...prev, show: false }))
                        });
                    })
                    .catch(error => {
                        if (error.response && error.response.status === 422 && error.response.data.missing_integration) {
                            setConfirmingAction({
                                show: true,
                                title: 'Configuration Required',
                                message: error.response.data.message,
                                type: 'warning',
                                hideCancel: false,
                                confirmText: 'Configure Integrations',
                                onConfirm: () => {
                                    setConfirmingAction(prev => ({ ...prev, show: false }));
                                    router.get(route('settings.integrations'));
                                }
                            });
                        } else {
                            setConfirmingAction({
                                show: true,
                                title: 'Error',
                                message: error.response?.data?.message || 'An unexpected error occurred while sending notifications.',
                                type: 'danger',
                                hideCancel: true,
                                confirmText: 'Close',
                                onConfirm: () => setConfirmingAction(prev => ({ ...prev, show: false }))
                            });
                        }
                    })
                    .finally(() => setConfirmingAction(prev => ({ ...prev, processing: false })));
            }
        });
    };

    const getViewModeLabel = () => {
        if (viewMode === 'week') return `${days[0]?.label} - ${days[days.length - 1]?.label}`;
        if (viewMode === 'month') return new Date(monthYear.year, monthYear.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return `${days[0]?.label} - ${days[days.length - 1]?.label}`;
    };

    const selectedCompanyObj = companies.find(c => c.id == selectedCompany);
    const selectedCompanySlug = selectedCompanyObj ? selectedCompanyObj.slug : '';

    const { auth } = usePage().props;
    const currentUser = auth?.user || {};

    const todayDate = formatDate(new Date());
    const myRosters = useMemo(() => {
        if (!isEmployee) return [];
        return days.map(day => rosterMap[`${currentUser.employee_id}_${day.date}`]).filter(Boolean);
    }, [days, rosterMap, currentUser.employee_id, isEmployee]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-100 ring-4 ring-indigo-50">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-normal text-slate-800 tracking-normal leading-none">Schedule Hub</h2>
                            <p className="text-[10px] font-normal text-gray-400 uppercase tracking-normal mt-1">Manage your time efficiently</p>
                        </div>
                    </div>
                </div>
            }
        >
            <>
                <Head title="Shift Roster" />

                <div className="w-full mx-auto px-4 py-2 md:px-6 md:py-4 flex flex-col gap-4 bg-gray-50/50 min-h-screen">

                    {/* 1. Employee "My Schedule" Hero Section */}
                    {isEmployee && myRosters.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="md:col-span-1 bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-100 flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                                <div className="relative z-10">
                                    <span className="text-[10px] font-normal uppercase tracking-normal opacity-80">Personal Outlook</span>
                                    <h3 className="text-2xl font-normal mt-1 leading-tight">Your Upcoming <br />Shifts</h3>
                                </div>
                                <div className="relative z-10 mt-6 flex items-baseline gap-1">
                                    <span className="text-4xl font-normal">{myRosters.length}</span>
                                    <span className="text-sm font-normal opacity-80 uppercase tracking-normal">Active Shifts</span>
                                </div>
                            </div>

                            <div className="md:col-span-3 flex gap-4 overflow-x-auto pb-2 custom-scrollbar no-bg-on-scroll">
                                {days.map(day => {
                                    const roster = rosterMap[`${currentUser.employee_id}_${day.date}`];
                                    const isToday = day.date === todayDate;
                                    return (
                                        <div key={day.date} className={`min-w-[200px] flex-shrink-0 p-5 rounded-[2rem] border transition-all duration-300 flex flex-col justify-between ${isToday
                                            ? 'bg-white border-indigo-200 shadow-xl shadow-indigo-50/50 ring-4 ring-indigo-50/50'
                                            : 'bg-white/60 border-gray-100 hover:bg-white hover:border-gray-200'
                                            }`}>
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <span className={`text-[10px] font-normal uppercase tracking-normal ${isToday ? 'text-indigo-600' : 'text-gray-400'}`}>
                                                        {day.day}
                                                    </span>
                                                    {isToday && <span className="bg-primary text-[8px] font-normal text-white px-2 py-0.5 rounded-full uppercase tracking-normal">Today</span>}
                                                </div>
                                                <p className="text-sm font-normal text-gray-800 mt-1">{day.label}</p>
                                            </div>

                                            <div className="mt-4">
                                                {roster ? (
                                                    <div className="space-y-1">
                                                        <p className="text-lg font-normal text-indigo-700 tracking-normal leading-none">{roster.shift_time}</p>
                                                        <p className="text-[9px] font-normal text-gray-400 uppercase tracking-normal">{roster.shift_type || 'General'}</p>
                                                    </div>
                                                ) : (
                                                    <div className="py-2 px-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                                        <span className="text-[10px] font-normal text-gray-400 italic">No assigned shift</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 2. Modern Glassmorphism Control Bar */}
                    <div className="sticky top-4 z-50 flex flex-wrap items-center justify-between gap-4 bg-white/80 backdrop-blur-2xl p-4 rounded-lg shadow-xl shadow-gray-200/50 border border-white/60">
                        <div className="flex items-center gap-5">
                            <div className="flex items-center bg-gray-100/80 p-1.5 rounded-lg border border-gray-100 ring-1 ring-black/5">
                                <button onClick={() => viewMode === 'week' ? handleWeekChange(-1) : handleMonthChange(-1)} className="p-2 hover:bg-white rounded-lg transition-all text-gray-500 hover:text-indigo-600 shadow-sm hover:shadow-md">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <span className="px-5 text-[11px] font-normal text-gray-700 uppercase tracking-normal tabular-nums">{getViewModeLabel()}</span>
                                <button onClick={() => viewMode === 'week' ? handleWeekChange(1) : handleMonthChange(1)} className="p-2 hover:bg-white rounded-lg transition-all text-gray-500 hover:text-indigo-600 shadow-sm hover:shadow-md">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>

                            {!isEmployee && (
                                <div className="h-8 w-px bg-gray-200"></div>
                            )}

                            {!isEmployee && (
                                <div className="relative group">
                                    <button
                                        onClick={() => setShowAdvancedActions(!showAdvancedActions)}
                                        className="px-5 py-2.5 bg-gray-50 text-gray-600 rounded-lg font-normal text-[10px] uppercase tracking-normal hover:bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all flex items-center gap-2 group"
                                    >
                                        <svg className={`w-4 h-4 transition-transform duration-300 ${showAdvancedActions ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m10 4a2 2 0 100-4m0 4a2 2 0 110-4m-4 1V12m0 8v-2m-2-5h4" /></svg>
                                        Toolkit
                                    </button>
                                    <div className={`absolute left-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-lg shadow-2xl border border-gray-100 p-2 z-[110] transition-all transform origin-top-left ring-1 ring-black/5 ${showAdvancedActions ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
                                        <div className="px-3 py-2 mb-1">
                                            <p className="text-[10px] font-normal text-indigo-500 uppercase tracking-normal leading-none">Management Power-ups</p>
                                        </div>
                                        <button
                                            onClick={handleDuplicateWeek}
                                            disabled={!selectedCompany}
                                            className={`w-full text-left px-3 py-3 text-[11px] font-normal uppercase rounded-lg flex items-center gap-3 transition-all group/item ${!selectedCompany ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-600 hover:bg-primary hover:text-white'}`}
                                        >
                                            <div className="p-1.5 bg-indigo-50 group-hover/item:bg-white/20 rounded-md transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                                            </div>
                                            Clone Schedule
                                        </button>
                                        <button
                                            onClick={handleExport}
                                            disabled={!selectedCompany}
                                            className={`w-full text-left px-3 py-3 text-[11px] font-normal uppercase rounded-lg flex items-center gap-3 transition-all group/item ${!selectedCompany ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-600 hover:bg-emerald-600 hover:text-white'}`}
                                        >
                                            <div className="p-1.5 bg-emerald-50 group-hover/item:bg-white/20 rounded-md transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            </div>
                                            Export Roster
                                        </button>
                                        <button
                                            onClick={handleSendEmails}
                                            disabled={!selectedCompany}
                                            className={`w-full text-left px-3 py-3 text-[11px] font-normal uppercase rounded-lg flex items-center gap-3 transition-all group/item ${!selectedCompany ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-600 hover:bg-primary hover:text-white'}`}
                                        >
                                            <div className="p-1.5 bg-blue-50 group-hover/item:bg-white/20 rounded-md transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            </div>
                                            Broadcast Alerts
                                        </button>
                                        <button onClick={() => setShowTemplateModal(true)} className="w-full text-left px-3 py-3 text-[11px] font-normal text-gray-600 uppercase hover:bg-purple-600 hover:text-white rounded-lg flex items-center gap-3 transition-all group/item">
                                            <div className="p-1.5 bg-purple-50 group-hover/item:bg-white/20 rounded-md transition-colors">
                                                <FiInfo className="w-4 h-4" />
                                            </div>
                                            WhatsApp Template Format
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {isEmployee && (
                                <div className="hidden lg:flex items-center gap-4 mr-4 animate-in fade-in duration-700">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-normal text-gray-400 uppercase tracking-normal leading-none">Logged In As</span>
                                        <span className="text-xs font-normal text-indigo-600 mt-0.5">{currentUser.name}</span>
                                    </div>
                                    <div className="h-8 w-px bg-gray-100"></div>
                                </div>
                            )}
                            <div className="flex bg-gray-100/50 p-1.5 rounded-lg border border-gray-100 ring-1 ring-black/5">
                                {['week', 'month'].map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`px-5 py-2 text-[10px] font-normal rounded-lg transition-all uppercase tracking-normal ${viewMode === mode ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'}`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>

                            {!isEmployee && (
                                <button className="px-5 py-2.5 bg-primary text-white rounded-lg font-normal text-[10px] uppercase tracking-normal hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 ml-2" onClick={() => router.get(route('shift-rosters.create'))}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                    New Shift
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 3. Main Roster Content Area */}
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Management Sidebar */}
                        {!isEmployee && (
                            <div className="lg:w-[280px] flex flex-col gap-4 h-full shrink-0">
                                <div className="bg-white p-4 rounded-lg shadow-xl shadow-gray-200/40 border border-gray-100 flex flex-col gap-4 ring-1 ring-black/5">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                            <label className="text-[10px] font-normal text-gray-400 uppercase tracking-normal">Filter Schedule</label>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-normal text-gray-500 uppercase ml-2 mb-1">Company Branch</p>
                                                <select
                                                    value={selectedCompany}
                                                    onChange={e => {
                                                        setSelectedCompany(e.target.value);
                                                        setSelectedDepartment('');
                                                    }}
                                                    className="w-full text-[11px] font-normal rounded-lg border-gray-100 bg-gray-50/80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all py-3.5"
                                                >
                                                    <option value="">All Branches</option>
                                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-[9px] font-normal text-gray-500 uppercase ml-2 mb-1">Department</p>
                                                <select
                                                    value={selectedDepartment}
                                                    onChange={e => setSelectedDepartment(e.target.value)}
                                                    className="w-full text-[11px] font-normal rounded-lg border-gray-100 bg-gray-50/80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all py-3.5 disabled:opacity-50"
                                                    disabled={!selectedCompany}
                                                >
                                                    <option value="">All Departments</option>
                                                    {departments
                                                        .filter(d => !selectedCompany || !d.company_id || d.company_id == selectedCompany)
                                                        .map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                placeholder="Search team..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-3 py-2.5 text-[11px] font-normal rounded-lg border-gray-100 bg-gray-50/80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            />
                                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <p className="text-[10px] font-normal text-indigo-900 uppercase tracking-normal">Insights</p>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-3">
                                            <div className="bg-white/80 p-3 rounded-lg shadow-[0_4px_10px_-2px_rgba(79,70,229,0.1)]">
                                                <p className="text-[8px] font-normal text-gray-400 uppercase tracking-normal">Active Shifts</p>
                                                <p className="text-base font-normal text-indigo-600 leading-tight mt-0.5">{rosters.length}</p>
                                            </div>
                                            <div className="bg-white/80 p-3 rounded-lg shadow-[0_4px_10px_-2px_rgba(79,70,229,0.1)]">
                                                <p className="text-[8px] font-normal text-gray-400 uppercase tracking-normal">Staff Count</p>
                                                <p className="text-base font-normal text-indigo-600 leading-tight mt-0.5">{filteredEmployees.length}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Premium Roster Grid/Table */}
                        <div className="flex-1 min-w-0 flex flex-col gap-4">
                            <>
                                {/* Mobile Optimized View (Card List) */}
                                <div className="md:hidden flex flex-col gap-4 animate-in slide-in-from-bottom-2 duration-400">
                                    {filteredEmployees.length === 0 ? (
                                        <div className="bg-white rounded-lg border border-gray-100 p-8 text-center text-gray-500 font-normal">
                                            No employees found.
                                        </div>
                                    ) : (
                                        filteredEmployees.map(emp => {
                                            const rostersForEmp = days.map(day => rosterMap[`${emp.id}_${day.date}`]).filter(Boolean);
                                            // For employees, only show their own and others with shifts.
                                            // For managers, show everyone to allow assignment.
                                            if (isEmployee && rostersForEmp.length === 0 && emp.id !== currentUser.employee_id) return null;

                                            const isSelf = emp.id === currentUser.employee_id;
                                            return (
                                                <div key={emp.id} className={`p-5 rounded-lg border transition-all ${isSelf ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 ring-4 ring-indigo-50 border-transparent' : 'bg-white border-gray-100 shadow-sm'}`}>
                                                    <div className="flex items-center gap-4 border-b border-black/5 pb-4 mb-4">
                                                        <Avatar src={emp.employee_image} name={emp.name} size="md" className={isSelf ? 'ring-4 ring-white/20 shadow-none' : ''} />
                                                        <div>
                                                            <h4 className="text-sm font-normal tracking-normal">{emp.name} {isSelf && '(You)'}</h4>
                                                            <p className={`text-[10px] font-normal uppercase tracking-normal ${isSelf ? 'text-indigo-100' : 'text-gray-400'}`}>{emp.designation || 'Specialist'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {days.map(day => {
                                                            const roster = rosterMap[`${emp.id}_${day.date}`];
                                                            const isWeeklyOff = (roster && roster.is_weekly_off) || isEmployeeWeeklyOff(emp, day.date);
                                                            if (!roster && !isWeeklyOff) return null;
                                                            return (
                                                                <div key={day.date} className={`flex justify-between items-center p-3 rounded-lg ${isSelf ? 'bg-white/10' : 'bg-gray-50'} ${isWeeklyOff ? 'border border-amber-200 bg-amber-50/20' : ''}`}>
                                                                    <div className="flex flex-col">
                                                                        <span className={`text-[8px] font-normal uppercase tracking-normal ${isSelf ? 'text-indigo-100' : 'text-gray-400'}`}>{day.day}</span>
                                                                        <span className="text-xs font-normal">{day.label}</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className={`text-xs font-semibold uppercase tracking-wide ${isWeeklyOff ? 'text-amber-700' : (isSelf ? 'text-white' : 'text-indigo-600')}`}>
                                                                            {isWeeklyOff ? 'Weekly Off' : roster.shift_time}
                                                                        </span>
                                                                        {!isWeeklyOff && roster.shift_type && (
                                                                            <p className={`text-[9px] font-normal uppercase ${isSelf ? 'text-indigo-100' : 'text-gray-400'}`}>{roster.shift_type}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Premium Desktop Table View */}
                                <div className="hidden md:block bg-white shadow-2xl shadow-gray-200/50 border border-gray-100 rounded-lg overflow-hidden flex-1 relative group/table">
                                    <div className="overflow-auto custom-scrollbar h-[calc(100vh-200px)]">
                                        <table className="min-w-full border-separate border-spacing-0">
                                            <thead className="sticky top-0 z-40">
                                                <tr>
                                                    <th className="p-0 sticky left-0 z-[60] bg-white/95 backdrop-blur-md border-r border-b border-gray-100 min-w-[200px] shadow-[10px_0_30px_-15px_rgba(0,0,0,0.05)]">
                                                        <div className="px-5 py-3 text-left flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-normal text-gray-400 uppercase tracking-[0.2em] leading-none">Team Members</span>
                                                                <span className="text-[9px] font-normal text-indigo-400 mt-1 uppercase tracking-normal">{filteredEmployees.length} Total</span>
                                                            </div>
                                                        </div>
                                                    </th>
                                                    {days.map(day => {
                                                        const isToday = day.date === todayDate;
                                                        return (
                                                            <th key={day.date} className={`p-0 border-b border-gray-100 min-w-[160px] transition-all duration-300 ${isToday ? 'bg-indigo-50/20' : 'bg-white'}`}>
                                                                <div className="px-3 py-3 flex flex-col items-center relative group/day">
                                                                    {isToday && <div className="absolute top-0 inset-x-0 h-1 bg-indigo-600 rounded-full mx-6"></div>}
                                                                    <span className={`text-[10px] font-normal uppercase tracking-[0.15em] ${isToday ? 'text-indigo-600' : 'text-gray-400'}`}>{day.day}</span>
                                                                    <span className={`text-sm font-normal mt-1 ${isToday ? 'text-gray-900 scale-110 transition-transform' : 'text-gray-700'}`}>{day.label}</span>
                                                                    {isToday && <span className="mt-2 px-3 py-0.5 bg-primary text-[8px] font-normal text-white rounded-full uppercase tracking-normal animate-pulse shadow-lg shadow-indigo-100">Now Active</span>}
                                                                </div>
                                                            </th>
                                                        );
                                                    })}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50/50">
                                                {filteredEmployees.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={days.length + 1} className="px-6 py-12 text-center text-gray-400 font-normal">
                                                            No employees found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredEmployees.map(emp => {
                                                        const isSelf = emp.id === currentUser.employee_id;
                                                        return (
                                                            <tr key={emp.id} className={`group/row transition-all duration-300 ${isSelf ? 'hover:bg-indigo-50/30' : 'hover:bg-gray-50/50'}`}>
                                                                <td className={`p-0 sticky left-0 z-10 transition-all duration-500 border-r border-gray-50 shadow-[10px_0_30px_-15px_rgba(0,0,0,0.03)] ${isSelf ? 'bg-indigo-50/40 group-hover/row:bg-indigo-50/60' : 'bg-white group-hover/row:bg-gray-50'}`}>
                                                                    <div className="px-4 py-2 flex items-center gap-2">
                                                                        <div className="relative">
                                                                            <Avatar
                                                                                src={emp.employee_image}
                                                                                name={emp.name}
                                                                                size="sm"
                                                                                className={`ring-4 transition-all duration-500 ${isSelf ? 'ring-indigo-100 shadow-xl shadow-indigo-100' : 'ring-transparent'}`}
                                                                            />
                                                                            {isSelf && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center" title="You are here"><div className="w-1 h-1 bg-white rounded-full animate-ping"></div></div>}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className={`text-xs font-normal tracking-normal leading-none ${isSelf ? 'text-indigo-900' : 'text-gray-900'}`}>{emp.name}</span>
                                                                                {isSelf && <span className="text-[7px] font-normal bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase tracking-[0.1em]">Self</span>}
                                                                            </div>
                                                                            <p className={`text-[10px] font-normal uppercase tracking-normal mt-1.5 leading-none transition-colors ${isSelf ? 'text-indigo-400' : 'text-gray-400 group-hover/row:text-gray-500'}`}>{emp.designation || 'Specialist'}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                {days.map(day => {
                                                                    const roster = rosterMap[`${emp.id}_${day.date}`];
                                                                    const isToday = day.date === todayDate;
                                                                    const isWeeklyOff = (roster && roster.is_weekly_off) || isEmployeeWeeklyOff(emp, day.date);

                                                                    return (
                                                                        <td key={day.date} className={`p-2 transition-all duration-500 ${isToday ? (isSelf ? 'bg-indigo-100/30' : 'bg-indigo-50/20') : ''}`}>
                                                                            {isWeeklyOff ? (
                                                                                <div className="p-2 rounded-lg border border-amber-200 bg-amber-50/70 shadow-sm flex flex-col items-center justify-center h-12 text-center select-none animate-in fade-in duration-300">
                                                                                    <span className="text-[10px] font-bold text-amber-700 tracking-wider uppercase">Weekly Off</span>
                                                                                </div>
                                                                            ) : roster ? (
                                                                                <div className={`p-2 rounded-lg border transition-all duration-500 flex flex-col gap-1 relative group/cell ${isSelf
                                                                                    ? 'bg-white border-indigo-200 shadow-lg shadow-indigo-100/50 ring-2 ring-indigo-50/30 scale-[1.02]'
                                                                                    : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 group-hover/row:scale-[0.98] hover:scale-105 hover:!scale-110 hover:z-20'
                                                                                    }`}>
                                                                                    <div className="flex items-center justify-between">
                                                                                        <span className={`text-xs font-normal tracking-normal leading-none ${isSelf ? 'text-indigo-700' : 'text-gray-800'}`}>{roster.shift_time}</span>
                                                                                        <div className={`w-1.5 h-1.5 rounded-full ${roster.shift_type === 'Evening' ? 'bg-amber-400' : (roster.shift_type === 'Morning' ? 'bg-cyan-400' : 'bg-emerald-400')}`}></div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="text-[8px] font-normal text-gray-400 uppercase tracking-normal truncate max-w-[100px]">{roster.shift_type || 'General'}</span>
                                                                                    </div>

                                                                                    {!isEmployee && (
                                                                                        <button onClick={() => handleOpenEdit(roster, emp, day)} className="absolute -top-2 -right-2 opacity-0 group-hover/cell:opacity-100 p-1.5 bg-primary text-white rounded-lg shadow-lg hover:scale-110 active:scale-95 transition-all z-30">
                                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                                                        </button>
                                                                                    )}

                                                                                    {roster.notes && (
                                                                                        <div className="mt-1 pt-1.5 border-t border-gray-50 flex items-center gap-1.5 text-gray-400">
                                                                                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                                                                            <p className="text-[8px] font-normal line-clamp-1 italic">{roster.notes}</p>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                <div
                                                                                    onClick={() => !isEmployee && handleOpenEdit(null, emp, day)}
                                                                                    className={`h-12 border-2 border-dashed border-gray-100 rounded-lg flex flex-col items-center justify-center group/cell cursor-pointer hover:bg-white hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-50/50 transition-all duration-500 ${isSelf ? 'border-indigo-50 bg-indigo-50/30' : ''}`}
                                                                                >
                                                                                    <div className="p-1.5 bg-gray-50 rounded-lg group-hover/cell:bg-indigo-50 group-hover/cell:scale-110 transition-all">
                                                                                        <span className={`text-[16px] leading-none transition-all font-thin ${isSelf ? 'text-indigo-200 group-hover/cell:text-indigo-400' : 'text-gray-200 group-hover/cell:text-indigo-300'}`}>+</span>
                                                                                    </div>
                                                                                </div>
                                                                            )}
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
                            </>
                        </div>
                    </div>
                </div>

                {/* Premium Edit Modal */}
                {
                    showEditModal && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden border border-white/20 transform animate-in slide-in-from-bottom-8 duration-300">
                                {/* Modal Header */}
                                <div className="bg-primary p-6 text-white flex justify-between items-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                    <div className="relative z-10">
                                        <h3 className="text-lg font-normal uppercase tracking-normal">{editingRoster?.id ? 'Adjust Shift' : 'New Assignment'}</h3>
                                        <p className="text-[10px] font-normal text-indigo-100 uppercase mt-1">{editingRoster?.employee.name} • {editingRoster?.date}</p>
                                    </div>
                                    <button onClick={() => setShowEditModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all relative z-10">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6 space-y-5">
                                    {/* Templates */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-normal text-gray-400 uppercase tracking-normal">Quick Templates</label>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.keys(shiftTemplates).filter(k => k !== 'custom').map(key => (
                                                <button
                                                    key={key}
                                                    onClick={() => applyTemplate(key)}
                                                    className="px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 text-[10px] font-normal text-gray-600 hover:text-indigo-600 rounded-lg border border-gray-100 hover:border-indigo-100 transition-all uppercase"
                                                >
                                                    {key.replace('_', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-normal text-gray-400 uppercase tracking-normal">Shift Timing</label>
                                            <input
                                                type="text"
                                                value={editForm.shift_time}
                                                onChange={e => setEditForm({ ...editForm, shift_time: e.target.value })}
                                                placeholder="e.g. 9AM - 5PM"
                                                className="w-full bg-gray-50 border-gray-100 rounded-lg text-xs font-normal py-3 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-normal text-gray-400 uppercase tracking-normal">Category</label>
                                            <select
                                                value={editForm.shift_type}
                                                onChange={e => setEditForm({ ...editForm, shift_type: e.target.value })}
                                                className="w-full bg-gray-50 border-gray-100 rounded-lg text-xs font-normal py-3 focus:ring-indigo-500"
                                            >
                                                <option value="">General</option>
                                                {shiftTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-normal text-gray-400 uppercase tracking-normal">Notes / Requests</label>
                                        <textarea
                                            value={editForm.notes}
                                            onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                            rows="2"
                                            className="w-full bg-gray-50 border-gray-100 rounded-lg text-xs font-normal p-3 focus:ring-indigo-500"
                                            placeholder="Add any special instructions..."
                                        />
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                                    {editingRoster?.id && (
                                        <button onClick={handleDeleteShift} disabled={isSaving} className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                                    <div className="flex gap-2 ml-auto">
                                        <button onClick={() => setShowEditModal(false)} className="px-6 py-3 text-[10px] font-normal text-gray-500 uppercase hover:text-gray-700">Cancel</button>
                                        <button onClick={handleSaveShift} disabled={isSaving} className="px-8 py-3 bg-primary text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2">
                                            {isSaving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (editingRoster?.id ? 'Update' : 'Commit')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Duplicate Week Modal */}
                {
                    showDuplicateModal && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden border border-white/40 ring-1 ring-black/5 transform animate-in zoom-in-95 duration-200">
                                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-5 text-white flex justify-between items-center relative overflow-hidden">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                                    <div className="relative z-10">
                                        <h3 className="text-base font-normal uppercase tracking-normal flex items-center gap-2">
                                            <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                                            Duplicate Roster
                                        </h3>
                                        <p className="text-[11px] font-normal opacity-90 mt-1">{new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(new Date(weekStart).setDate(new Date(weekStart).getDate() + 6)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                    <button onClick={() => setShowDuplicateModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all relative z-10">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-normal text-gray-400 uppercase tracking-normal">Target Week</label>
                                        <input
                                            type="date"
                                            value={targetDuplicateDate}
                                            onChange={e => setTargetDuplicateDate(e.target.value)}
                                            className="w-full pl-4 pr-4 py-2.5 bg-gray-50 border-gray-200 rounded-lg text-xs font-normal focus:ring-2 focus:ring-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex gap-3 items-start">
                                        <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        <p className="text-[10px] text-amber-700 leading-relaxed font-normal">Existing shifts in the target week will be replaced.</p>
                                    </div>
                                </div>
                                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                                    <button onClick={() => setShowDuplicateModal(false)} className="px-4 py-2.5 text-[10px] font-normal text-gray-500 uppercase hover:text-gray-800 rounded-lg">Cancel</button>
                                    <button onClick={confirmDuplicateWeek} disabled={isSaving || !targetDuplicateDate} className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2">
                                        {isSaving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Confirm Copy'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Template Format Modal */}
                <Modal show={showTemplateModal} onClose={() => setShowTemplateModal(false)} maxWidth="2xl">
                    <div className="p-6">
                        <h2 className="text-lg font-normal text-gray-900 mb-4 flex items-center">
                            <FiInfo className="mr-2 text-indigo-500" /> Meta WhatsApp Template Format
                        </h2>
                        <p className="text-sm text-gray-600 mb-6">
                            To use Meta WhatsApp notifications, you must create a template in your Facebook Business Manager that exactly matches this format.
                        </p>

                        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-3 border-b pb-2">
                                <h3 className="font-normal text-gray-800">Shift Roster Notification</h3>
                                <button
                                    onClick={() => copyToClipboard('Hi {{1}},\n\nHere is your shift roster for {{2}} at {{3}}:\n\n{{4}}\n\nPlease arrive 10 mins early. Contact HR for any queries.')}
                                    className="flex items-center text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-indigo-600 transition-colors font-normal"
                                >
                                    {copiedRoster ? <><FiCheck className="mr-1.5" /> Copied!</> : <><FiCopy className="mr-1.5" /> Copy Body</>}
                                </button>
                            </div>
                            <div className="bg-white p-3 rounded border border-gray-200 text-sm font-mono text-gray-700 whitespace-pre-wrap leading-relaxed">
                                Hi {'{{1}}'},{'\n\n'}
                                Here is your shift roster for {'{{2}}'} at {'{{3}}'}:{'\n\n'}
                                {'{{4}}'}{'\n\n'}
                                Please arrive 10 mins early. Contact HR for any queries.
                            </div>
                            <ul className="text-xs text-gray-500 mt-3 list-disc pl-5 space-y-1">
                                <li><strong>{`{{1}}`}</strong>: Employee Name</li>
                                <li><strong>{`{{2}}`}</strong>: Date Range</li>
                                <li><strong>{`{{3}}`}</strong>: Company Name</li>
                                <li><strong>{`{{4}}`}</strong>: Roster Summary List</li>
                            </ul>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-normal text-xs uppercase tracking-normal transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>

                <style dangerouslySetInnerHTML={{
                    __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideInUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-in { animation: fadeIn 0.2s ease-out; }
                .slide-in-from-bottom-8 { animation: slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
            `}} />
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
            </>
        </AuthenticatedLayout>
    );
};