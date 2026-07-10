import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Utility functions
const getDaysInRange = (startDate, endDate) => {
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
};

const getWeekDays = (startDate) => {
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
};

const getMonthDays = (year, month) => {
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
};

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

export default function Create({
    companies = [],
    departments = [],
    employees = [],
    shiftTemplates = {},
    selectedCompany: initialSelectedCompany = '',
    selectedDepartment: initialSelectedDepartment = '',
    shiftTypes = []
}) {
    // State management
    const [selectedCompany, setSelectedCompany] = useState(initialSelectedCompany || '');
    const [selectedDepartment, setSelectedDepartment] = useState(initialSelectedDepartment || '');
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [viewMode, setViewMode] = useState('week');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmingAction, setConfirmingAction] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'warning'
    });

    // Date states
    const [weekStart, setWeekStart] = useState(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const day = today.getDay(), diff = today.getDate() - day + (day === 0 ? -6 : 1);
        return formatDate(new Date(today.setDate(diff)));
    });

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

    const [rosterEntries, setRosterEntries] = useState({});

    // Computed values
    const days = useMemo(() => {
        if (viewMode === 'week') return getWeekDays(weekStart);
        if (viewMode === 'month') return getMonthDays(monthYear.year, monthYear.month);
        if (viewMode === 'custom') return getDaysInRange(customStart, customEnd);
        return [];
    }, [viewMode, weekStart, monthYear, customStart, customEnd]);

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp =>
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (emp.designation && emp.designation.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [employees, searchTerm]);

    const isAllSelected = filteredEmployees.length > 0 && filteredEmployees.every(emp => selectedEmployees.includes(emp.id));

    // Handlers
    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedEmployees(prev => prev.filter(id => !filteredEmployees.some(fe => fe.id === id)));
        } else {
            const newSelections = [...new Set([...selectedEmployees, ...filteredEmployees.map(emp => emp.id)])];
            setSelectedEmployees(newSelections);
        }
    };

    // Fetch employees
    // Employees are loaded via page reload when company/department changes

    const handleEntryChange = useCallback((empId, date, field, value) => {
        setRosterEntries(prev => ({
            ...prev,
            [empId]: {
                ...prev[empId],
                [date]: {
                    ...prev[empId]?.[date],
                    [field]: value,
                    date: date,
                    employee_id: empId
                }
            }
        }));
    }, []);

    const applyTemplateToAll = (templateName) => {
        const template = shiftTemplates[templateName];
        if (!template) return;

        setRosterEntries(prev => {
            const next = { ...prev };
            selectedEmployees.forEach(empId => {
                const newEmpEntries = { ...next[empId] };
                days.forEach(day => {
                    newEmpEntries[day.date] = {
                        ...newEmpEntries[day.date],
                        shift_time: template.time,
                        shift_type: template.type,
                        designation: template.designation,
                        date: day.date,
                        employee_id: empId
                    };
                });
                next[empId] = newEmpEntries;
            });
            return next;
        });
    };

    const applyTemplatePerEmployee = (empId, templateName) => {
        const template = shiftTemplates[templateName];
        if (!template) return;

        setRosterEntries(prev => {
            const newEmpEntries = { ...prev[empId] };
            days.forEach(day => {
                newEmpEntries[day.date] = {
                    ...newEmpEntries[day.date],
                    shift_time: template.time,
                    shift_type: template.type,
                    designation: template.designation,
                    date: day.date,
                    employee_id: empId
                };
            });
            return { ...prev, [empId]: newEmpEntries };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || selectedEmployees.length === 0) return;

        setIsSubmitting(true);
        const entries = [];
        selectedEmployees.forEach(empId => {
            days.forEach(day => {
                const entry = rosterEntries[empId]?.[day.date];
                if (entry && entry.shift_time) {
                    const entryDate = new Date(day.date + 'T00:00:00');
                    const dayOfWeek = entryDate.getDay();
                    const diff = entryDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                    const monday = new Date(entryDate.setDate(diff));
                    const entryWeekStart = formatDate(monday);

                    entries.push({
                        ...entry,
                        day: day.day,
                        week_start: entryWeekStart
                    });
                }
            });
        });

        if (entries.length === 0) {
            setConfirmingAction({
                show: true,
                title: 'Empty Roster',
                message: 'Please fill at least one shift time before publishing.',
                type: 'warning',
                onConfirm: () => setConfirmingAction(prev => ({ ...prev, show: false }))
            });
            setIsSubmitting(false);
            return;
        }

        router.post(route('shift-rosters.store'), {
            company_id: selectedCompany,
            department_id: selectedDepartment || null,
            entries: entries,
            week_start: viewMode === 'week' ? weekStart : null
        }, {
            onFinish: () => setIsSubmitting(false)
        });
    };

    return (
        <AuthenticatedLayout header="Shift Roster">
            <Head title="Create Shift Roster" />

            <div className="max-w-full mx-auto px-2 py-3 md:px-6 md:py-4 flex flex-col gap-4 bg-gray-50/50 min-h-screen">

                {/* Compact Control Bar */}
                <div className="sticky top-[-1px] z-50 flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-xl p-3 rounded-lg shadow-lg border border-white/40 mb-2">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-1 bg-indigo-600 rounded-full hidden md:block"></div>
                        <div>
                            <h2 className="text-lg font-normal text-gray-900 leading-tight">Create Shifts</h2>
                            <p className="text-[10px] font-normal text-gray-400 uppercase tracking-normal">{viewMode} perspective • {selectedEmployees.length} staff selected</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {selectedEmployees.length > 0 && (
                            <div className="flex items-center bg-gray-100/80 p-1 rounded-lg gap-1 border border-gray-200 shadow-inner">
                                <span className="text-[10px] font-normal text-gray-500 px-2">BULK:</span>
                                {Object.keys(shiftTemplates).map(tName => (
                                    <button
                                        key={tName}
                                        onClick={() => applyTemplateToAll(tName)}
                                        className="px-3 py-1.5 text-[10px] font-normal bg-white text-gray-700 rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm border border-gray-200 capitalize"
                                    >
                                        {tName}
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || selectedEmployees.length === 0}
                            className={`px-6 py-2.5 rounded-lg font-normal text-xs uppercase tracking-normal transition-all shadow-md active:scale-95 ${isSubmitting || selectedEmployees.length === 0
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
                                }`}
                        >
                            {isSubmitting ? 'Processing...' : 'Publish Roster'}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)]">
                    {/* Left Panel: Compact Filters & Selection */}
                    <div className="lg:w-[320px] flex flex-col gap-3 h-full overflow-hidden">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-normal text-gray-400 uppercase">Branch</label>
                                <select
                                    value={selectedCompany}
                                    onChange={e => {
                                        const companyId = e.target.value;
                                        router.get(route('shift-rosters.create', companyId ? { company: companyId } : {}), {}, {
                                            preserveState: false,
                                            replace: true
                                        });
                                    }}
                                    className="w-full text-xs font-normal rounded-lg border-gray-100 bg-gray-50 focus:ring-indigo-500 py-2"
                                >
                                    <option value="">Choose Branch</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-normal text-gray-400 uppercase">Department</label>
                                <select
                                    value={selectedDepartment}
                                    onChange={e => {
                                        const deptId = e.target.value;
                                        if (selectedCompany) {
                                            const params = { company: selectedCompany };
                                            if (deptId) params.department = deptId;
                                            router.get(route('shift-rosters.create', params), {}, {
                                                preserveState: false,
                                                replace: true
                                            });
                                        }
                                    }}
                                    className="w-full text-xs font-normal rounded-lg border-gray-100 bg-gray-50 focus:ring-indigo-500 py-2"
                                    disabled={!selectedCompany}
                                >
                                    <option value="">All Departments</option>
                                    {departments
                                        .filter(d => !selectedCompany || !d.company_id || d.company_id == selectedCompany)
                                        .map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-1 bg-gray-50 p-1 rounded-lg">
                                {['week', 'month', 'custom'].map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`py-1.5 text-[10px] font-normal rounded-lg transition-all capitalize border ${viewMode === mode ? 'bg-white text-indigo-600 border-gray-200 shadow-sm' : 'text-gray-400 border-transparent hover:text-gray-600'
                                            }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-1">
                                {viewMode === 'week' && <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} className="w-full text-xs font-normal rounded-lg border-gray-100 bg-gray-50 py-2" />}
                                {viewMode === 'month' && (
                                    <div className="flex gap-1">
                                        <select value={monthYear.month} onChange={e => setMonthYear(p => ({ ...p, month: parseInt(e.target.value) }))} className="flex-1 text-[10px] font-normal rounded-lg border-gray-100 bg-gray-50 py-2">
                                            {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString('en-US', { month: 'short' })}</option>)}
                                        </select>
                                        <input type="number" value={monthYear.year} onChange={e => setMonthYear(p => ({ ...p, year: parseInt(e.target.value) }))} className="w-20 text-[10px] font-normal rounded-lg border-gray-100 bg-gray-50 py-2" />
                                    </div>
                                )}
                                {viewMode === 'custom' && (
                                    <div className="flex flex-col gap-1">
                                        <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="text-[10px] font-normal rounded-lg border-gray-100 bg-gray-50 py-1" />
                                        <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="text-[10px] font-normal rounded-lg border-gray-100 bg-gray-50 py-1" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="p-4 border-b border-gray-50 space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[10px] font-normal text-gray-400 uppercase tracking-normal">Employees ({employees.length})</h3>
                                    <button
                                        onClick={toggleSelectAll}
                                        className={`text-[9px] font-normal px-2 py-0.5 rounded border transition-all ${isAllSelected ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-indigo-400'
                                            }`}
                                    >
                                        {isAllSelected ? 'DESELECT ALL' : 'SELECT ALL'}
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by name..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-1.5 text-xs font-normal rounded-lg border-gray-100 bg-gray-50 focus:ring-indigo-500"
                                    />
                                    <svg className="absolute left-3 top-2 h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                                <div className="space-y-0.5">
                                    {filteredEmployees.map(emp => (
                                        <label key={emp.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${selectedEmployees.includes(emp.id) ? 'bg-indigo-50 border-indigo-100 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedEmployees.includes(emp.id)}
                                                onChange={e => {
                                                    if (e.target.checked) setSelectedEmployees(p => [...p, emp.id]);
                                                    else setSelectedEmployees(p => p.filter(id => id !== emp.id));
                                                }}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-normal text-gray-800 truncate leading-tight">{emp.name}</p>
                                                <p className="text-[9px] font-normal text-gray-400 truncate uppercase mt-0.5">{emp.designation || 'Staff'}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: High-Density Roster Grid */}
                    <div className="flex-1 min-w-0 bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full">
                        {selectedEmployees.length > 0 ? (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
                                    <span className="text-[10px] font-normal text-gray-500 uppercase">Roster Worksheet • {days.length} Days</span>
                                    <span className="text-[9px] font-normal text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Live Editing Enabled</span>
                                </div>
                                <div className="flex-1 overflow-auto bg-white custom-scrollbar">
                                    <table className="min-w-full border-separate border-spacing-0">
                                        <thead className="sticky top-0 z-40 bg-white">
                                            <tr>
                                                <th className="p-0 sticky left-0 z-50 bg-white border-r border-b border-gray-200 min-w-[180px]">
                                                    <div className="px-4 py-3 text-left text-[9px] font-normal text-gray-400 uppercase tracking-normal bg-gray-50/80">Staff Member</div>
                                                </th>
                                                {days.map(day => (
                                                    <th key={day.date} className="p-0 border-r border-b border-gray-100 min-w-[220px] bg-gray-50/30">
                                                        <div className="px-3 py-2 flex flex-col items-center">
                                                            <span className="text-[8px] font-normal text-indigo-500 uppercase">{day.day.slice(0, 3)}</span>
                                                            <span className="text-[11px] font-normal text-gray-800">{day.label}</span>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {selectedEmployees.map(empId => {
                                                const employee = employees.find(e => e.id == empId);
                                                return (
                                                    <tr key={empId} className="hover:bg-indigo-50/20 transition-colors group">
                                                        <td className="p-0 sticky left-0 z-30 bg-white group-hover:bg-indigo-50/10 border-r border-gray-100 transition-colors">
                                                            <div className="px-4 py-3">
                                                                <p className="text-xs font-normal text-gray-900 leading-tight">{employee?.name}</p>
                                                                <div className="flex gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                                                    {Object.keys(shiftTemplates).slice(0, 2).map(tName => (
                                                                        <button
                                                                            key={tName}
                                                                            onClick={() => applyTemplatePerEmployee(empId, tName)}
                                                                            className="px-1.5 py-0.5 text-[7px] font-normal bg-white border border-gray-200 rounded text-gray-500 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all uppercase"
                                                                        >
                                                                            {tName}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {days.map(day => {
                                                            const entry = rosterEntries[empId]?.[day.date] || {};
                                                            const isWeeklyOff = isEmployeeWeeklyOff(employee, day.date);
                                                            return (
                                                                <td key={day.date} className={`p-1 border-r border-gray-50 last:border-r-0 ${isWeeklyOff ? 'bg-amber-50/20' : ''}`}>
                                                                    <div className="flex flex-col gap-1">
                                                                        {isWeeklyOff && (
                                                                            <span className="text-[8px] font-bold text-amber-600 bg-amber-100/50 px-1.5 py-0.5 rounded uppercase tracking-wider self-start leading-none">Weekly Off Day</span>
                                                                        )}
                                                                        <input
                                                                            type="text"
                                                                            placeholder={isWeeklyOff ? "Weekly Off" : "HH:MM - HH:MM"}
                                                                            value={entry.shift_time || ''}
                                                                            onChange={e => handleEntryChange(empId, day.date, 'shift_time', e.target.value)}
                                                                            className={`w-full text-[10px] font-normal p-1.5 border-transparent focus:bg-white focus:border-indigo-100 focus:ring-1 focus:ring-indigo-100 rounded-lg transition-all ${isWeeklyOff ? 'bg-amber-50/60 placeholder-amber-400 text-amber-700' : 'bg-gray-50/80'}`}
                                                                        />
                                                                        <div className="flex gap-1">
                                                                            <select
                                                                                value={entry.shift_type || ''}
                                                                                onChange={e => handleEntryChange(empId, day.date, 'shift_type', e.target.value)}
                                                                                className="flex-1 text-[9px] font-normal p-1 bg-gray-50/40 border-transparent rounded-lg focus:ring-0 focus:bg-white"
                                                                            >
                                                                                <option value="">Type</option>
                                                                                {shiftTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                                            </select>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Note"
                                                                                value={entry.notes || ''}
                                                                                onChange={e => handleEntryChange(empId, day.date, 'notes', e.target.value)}
                                                                                className="w-16 text-[9px] font-normal p-1 bg-gray-50/40 border-transparent rounded-lg focus:ring-0 focus:bg-white"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4">
                                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 animate-pulse">
                                    <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-normal text-gray-800 uppercase tracking-normal">No Selection</h4>
                                    <p className="text-[10px] font-normal text-gray-400 max-w-[240px]">Select employees from the left panel to begin your scheduled planning.</p>
                                </div>
                                <button onClick={toggleSelectAll} className="px-6 py-2 bg-primary text-white text-[10px] font-normal rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 transition-all shadow-lg shadow-indigo-100">QUICK SELECT ALL</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
            `}} />
            <ConfirmationModal
                show={confirmingAction.show}
                title={confirmingAction.title}
                message={confirmingAction.message}
                onConfirm={confirmingAction.onConfirm}
                onClose={() => setConfirmingAction(prev => ({ ...prev, show: false }))}
                type={confirmingAction.type}
                hideCancel={true}
                confirmText="OK"
            />
        </AuthenticatedLayout>
    );
}