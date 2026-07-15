import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import Avatar from '@/Components/Avatar';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { FiUploadCloud, FiChevronDown, FiChevronLeft, FiChevronRight, FiSearch, FiDownload } from 'react-icons/fi';

// Helper to get week days from a start date
function getWeekDays(startDate) {
    const days = [];
    const start = new Date(startDate);
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push({
            date: d.toISOString().slice(0, 10),
            label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        });
    }
    return days;
}

function isEmployeeWeeklyOff(emp, dateStr) {
    if (!emp) return false;
    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }); // e.g. "Monday"

    // 1. Check staff-wise weekly off
    const weeklyOffs = emp.weekly_offs || emp.weeklyOffs;
    if (Array.isArray(weeklyOffs) && weeklyOffs.length > 0) {
        const staffOff = [...weeklyOffs]
            .filter(w => w.effective_date && w.effective_date.slice(0, 10) <= dateStr)
            .sort((a, b) => b.effective_date.localeCompare(a.effective_date))[0];
        if (staffOff) {
            return staffOff.weekly_off_day === dayName;
        }
    }

    // 2. Fallback to branch-level weekly off days
    if (emp.company && Array.isArray(emp.company.weekly_off_days)) {
        return emp.company.weekly_off_days.includes(dayName);
    }

    return false;
}

function parsePunches(punches = [], normalHours = 8) {
    if (!punches || punches.length === 0) return null;

    const sessions = [];
    const breaks = [];
    let totalWorkMinutes = 0;
    let totalBreakMinutes = 0;

    let currentIn = null;
    let currentOut = null;

    // Sort punches chronologically just in case
    const sortedPunches = [...punches].sort((a, b) => new Date(a.time) - new Date(b.time));

    sortedPunches.forEach((punch) => {
        const time = new Date(punch.time);
        const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        if (punch.type === 'in') {
            currentIn = time;
            if (currentOut) {
                const diffMs = time - currentOut;
                const diffMins = Math.round(diffMs / 1000 / 60);
                breaks.push({
                    start: currentOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    end: timeStr,
                    duration: diffMins
                });
                totalBreakMinutes += diffMins;
                currentOut = null;
            }
        } else if (punch.type === 'out') {
            currentOut = time;
            if (currentIn) {
                const diffMs = time - currentIn;
                const diffMins = Math.round(diffMs / 1000 / 60);
                sessions.push({
                    start: currentIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    end: timeStr,
                    duration: (diffMins / 60).toFixed(2)
                });
                totalWorkMinutes += diffMins;
                currentIn = null;
            }
        }
    });

    const workedHours = (totalWorkMinutes / 60).toFixed(2);
    const ot = parseFloat(workedHours) > normalHours ? (parseFloat(workedHours) - normalHours).toFixed(2) : '0.00';

    return {
        sessions,
        breaks,
        totalBreakMinutes,
        workedHours,
        ot
    };
}

const defaultAttendanceOptions = ['Present', 'Absent', 'Leave', 'Late', 'Half Day'];

// Format hours: remove trailing zeros, max 2 decimals
const fmt = (val) => {
    const n = parseFloat(val);
    if (isNaN(n) || n === 0) return '0';
    return n % 1 === 0 ? String(Math.round(n)) : parseFloat(n.toFixed(2)).toString();
};

export default function Index({ branches = [], employees, attendances = [], rosters = [], initialCompanyId = null, initialWeekStart = null, attendanceOptions = [], userRole = 'admin', settings }) {
    const finalAttendanceOptions = attendanceOptions.length > 0 ? attendanceOptions : defaultAttendanceOptions;
    const isEmployee = userRole === 'employee';

    // Helper to get Monday of current week
    const getMonday = (d) => {
        d = new Date(d);
        const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    const [selectedBranch, setSelectedBranch] = useState(initialCompanyId || '');
    const [weekStart, setWeekStart] = useState(initialWeekStart || getMonday(new Date()).toISOString().slice(0, 10));
    const [search, setSearch] = useState(() => {
        if (typeof window !== 'undefined') {
            return new URLSearchParams(window.location.search).get('search') || '';
        }
        return '';
    });
    const isFirstRender = useRef(true);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importProcessing, setImportProcessing] = useState(false);
    const fileInputRef = useRef(null);

    const [selectedBreakup, setSelectedBreakup] = useState(null);
    const handleShowBreakup = (employee, date, attendance) => {
        setSelectedBreakup({ employee, date, attendance });
    };

    const [confirmingAction, setConfirmingAction] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'info',
        hideCancel: false
    });

    const closeModal = () => setConfirmingAction(prev => ({ ...prev, show: false }));

    // Build lookup maps
    const attendanceMap = {};
    if (Array.isArray(attendances)) {
        attendances.forEach(a => {
            attendanceMap[`${a.employee_id}_${a.date}`] = a;
        });
    }

    const rosterMap = {};
    if (Array.isArray(rosters)) {
        rosters.forEach(r => {
            rosterMap[`${r.employee_id}_${r.day}`] = r;
        });
    }

    const weekDays = getWeekDays(weekStart);

    // Handle paginated employees
    const employeeList = employees?.data || (Array.isArray(employees) ? employees : []);
    const paginationLinks = employees?.links || [];

    // State for editing
    const [editData, setEditData] = useState({});

    // Initialize editData when data loads
    useEffect(() => {
        const data = {};
        employeeList.forEach(emp => {
            weekDays.forEach(day => {
                const key = `${emp.id}_${day.date}`;
                data[key] = attendanceMap[key] || {
                    employee_id: emp.id,
                    date: day.date,
                    from_time: '',
                    to_time: '',
                    hours_worked: '',
                    normal_hours: '',
                    ot: '',
                    ot_amt: '',
                    attendance: '',
                    reason: '',
                };
            });
        });
        setEditData(data);
    }, [employees, attendances, weekStart]);

    // ... Helper functions (parseShiftTime, calculateHours) same as before ...
    const parseShiftTime = (shiftTime) => {
        if (!shiftTime) return null;
        const convertTo24Hour = (hours, minutes, modifier) => {
            hours = parseInt(hours, 10);
            if (hours === 12) hours = modifier === 'AM' ? 0 : 12;
            else if (modifier === 'PM') hours += 12;
            return `${hours.toString().padStart(2, '0')}:${minutes}`;
        };
        try {
            const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/gi;
            const matches = [...shiftTime.matchAll(timeRegex)];
            if (matches.length >= 2) {
                const fromMatch = matches[0];
                const toMatch = matches[1];
                return {
                    from: convertTo24Hour(fromMatch[1], fromMatch[2], fromMatch[3].toUpperCase()),
                    to: convertTo24Hour(toMatch[1], toMatch[2], toMatch[3].toUpperCase())
                };
            }
        } catch (e) { console.error("Error parsing shift time", e); }
        return null;
    };

    const calculateHours = (from, to) => {
        if (!from || !to) return 0;
        const [h1, m1] = from.split(':').map(Number);
        const [h2, m2] = to.split(':').map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 24 * 60;
        return parseFloat((diff / 60).toFixed(2));
    };

    const getNormalHours = (empId, date) => {
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const plannedShift = rosterMap[`${empId}_${dayName}`];
        const stdHours = parseFloat(settings?.standard_working_hours || 9);
        if (plannedShift && plannedShift.shift_time) {
            const times = parseShiftTime(plannedShift.shift_time);
            if (times) {
                return calculateHours(times.from, times.to) || stdHours;
            }
        }
        return stdHours;
    };

    const handleCellChange = (empId, date, field, value) => {
        if (isEmployee) return;
        const key = `${empId}_${date}`;
        setEditData(prev => {
            const currentCell = prev[key] || {};
            const updates = { [field]: value };

            // Smart Logic (Presence/Absence/Time handling) - SAME AS BEFORE
            if (field === 'attendance') {
                if (value === 'Absent') {
                    updates.from_time = ''; updates.to_time = ''; updates.hours_worked = ''; updates.ot = '';
                } else if (value === 'Present' && !currentCell.from_time && !currentCell.to_time) {
                    const dateObj = new Date(date);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                    const plannedShift = rosterMap[`${empId}_${dayName}`];
                    if (plannedShift?.shift_time) {
                        const times = parseShiftTime(plannedShift.shift_time);
                        if (times) {
                            updates.from_time = times.from;
                            updates.to_time = times.to;
                            const hours = calculateHours(times.from, times.to);
                            updates.hours_worked = hours;
                            const normal = getNormalHours(empId, date);
                            updates.normal_hours = normal;
                            updates.ot = hours > normal ? hours - normal : 0;
                        }
                    }
                }
            }
            if (field === 'from_time' || field === 'to_time') {
                const from = field === 'from_time' ? value : currentCell.from_time;
                const to = field === 'to_time' ? value : currentCell.to_time;
                if (from && to) {
                    const hours = calculateHours(from, to);
                    updates.hours_worked = hours;
                    const normal = getNormalHours(empId, date);
                    updates.normal_hours = normal;
                    updates.ot = hours > normal ? hours - normal : 0;
                }
            }

            return { ...prev, [key]: { ...prev[key], employee_id: empId, date: date, ...updates } };
        });
    };

    const applyRoster = (empId, date, plannedShift) => {
        if (isEmployee || !plannedShift?.shift_time) return;
        const times = parseShiftTime(plannedShift.shift_time);
        setEditData(prev => {
            const key = `${empId}_${date}`;
            const hours = times ? calculateHours(times.from, times.to) : 0;
            const normal = getNormalHours(empId, date);
            return {
                ...prev,
                [key]: {
                    ...prev[key],
                    employee_id: empId,
                    date: date,
                    attendance: 'Present',
                    from_time: times ? times.from : prev[key].from_time,
                    to_time: times ? times.to : prev[key].to_time,
                    hours_worked: hours,
                    normal_hours: normal,
                    ot: hours > normal ? hours - normal : 0,
                }
            };
        });
    };

    // Load data based on page/search change
    const updateParams = (newParams) => {
        router.get(route('employee-attendances.index'), {
            company_id: selectedBranch,
            week_start: weekStart,
            search: search,
            ...newParams
        }, { preserveState: true, preserveScroll: true });
    };

    const handleWeekChange = (direction) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + direction * 7);
        const newWeekStart = d.toISOString().slice(0, 10);
        setWeekStart(newWeekStart);
        updateParams({ week_start: newWeekStart });
    };

    // Debounce search
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timeoutId = setTimeout(() => {
            updateParams({ search: search });
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEmployee) return;

        // Add company_id to each attendance record
        const attendancesWithCompany = Object.values(editData).map(record => {
            const emp = employeeList.find(e => e.id === record.employee_id);
            return {
                ...record,
                company_id: selectedBranch || emp?.company_id
            };
        });

        router.post(route('employee-attendances.batchStore'), {
            attendances: attendancesWithCompany
        });
    };

    const handleImportSubmit = (e) => {
        e.preventDefault();
        if (!importFile || !selectedBranch) {
            setConfirmingAction({
                show: true,
                title: 'Missing File',
                message: 'Please select a CSV file and branch to import.',
                type: 'warning',
                hideCancel: true,
                onConfirm: closeModal
            });
            return;
        }
        setImportProcessing(true);
        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('company_id', selectedBranch);
        router.post(route('employee-attendances.import'), formData, {
            onSuccess: () => {
                setIsImportModalOpen(false);
                setImportFile(null);
                setImportProcessing(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
                setConfirmingAction({
                    show: true,
                    title: 'Import Successful',
                    message: 'Attendance data has been imported successfully.',
                    type: 'success',
                    hideCancel: true,
                    onConfirm: closeModal
                });
            },
            onError: (errors) => {
                setImportProcessing(false);
                console.error(errors);
                
                let errorMsg = 'Failed to import attendance. Please check the file format.';
                if (errors.import_errors) {
                    errorMsg = errors.import_errors;
                } else if (errors.file) {
                    errorMsg = errors.file;
                }

                setConfirmingAction({
                    show: true,
                    title: 'Import Errors Found',
                    message: errorMsg,
                    type: 'danger',
                    hideCancel: true,
                    onConfirm: closeModal
                });
            }
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Attendance</h2>}>
            <Head title="Employee Attendance" />

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8">
                            <h3 className="text-xl font-normal text-slate-900 tracking-normal mb-2">Import Attendance CSV</h3>
                            <p className="text-[11px] font-normal text-slate-400 uppercase tracking-normal mb-6">Upload a CSV file to import attendance data</p>
                            
                            <div className="mb-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
                                <p className="text-[11px] text-primary leading-relaxed font-normal uppercase tracking-normal">
                                    Make sure your CSV file has <strong>Employee Name</strong> and <strong>Date</strong> columns.
                                    <a href={route('employee-attendances.template')} className="block mt-2 font-normal text-primary hover:underline underline-offset-4">
                                        Download Sample Template
                                    </a>
                                </p>
                            </div>

                            <form onSubmit={handleImportSubmit} className="space-y-6">
                                <div className="relative group">
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        accept=".csv,.txt" 
                                        onChange={e => setImportFile(e.target.files[0])} 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
                                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-white group-hover:text-primary transition-colors">
                                            <FiUploadCloud className="w-6 h-6" />
                                        </div>
                                        <p className="text-xs font-normal text-slate-600 tracking-normal truncate">
                                            {importFile ? importFile.name : 'Choose a CSV file to upload'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsImportModalOpen(false)} 
                                        className="flex-1 px-4 py-3 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-slate-100 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={importProcessing} 
                                        className="flex-[2] px-4 py-3 bg-primary text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {importProcessing ? 'Importing...' : 'Import Now'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full h-[calc(100vh-64px)] flex flex-col bg-white">
                {/* Global Orchestration Bar */}
                <div className="px-6 py-4 flex flex-col md:flex-row gap-6 items-center justify-between border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        {!isEmployee && (
                            <div className="relative">
                                <select 
                                    className="appearance-none bg-slate-50 border-slate-200 rounded-lg text-[11px] font-normal uppercase tracking-normal min-w-[240px] pl-4 pr-10 py-2.5 focus:border-primary focus:ring-primary/10 transition-all outline-none" 
                                    value={selectedBranch} 
                                    onChange={e => { setSelectedBranch(e.target.value); updateParams({ company_id: e.target.value }); }}
                                >
                                    <option value="">All Branches</option>
                                    {branches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <FiChevronDown className="w-4 h-4" />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                            <button onClick={() => handleWeekChange(-1)} className="p-2 hover:bg-white hover:text-primary rounded-lg transition-all text-slate-400"><FiChevronLeft className="w-4 h-4" /></button>
                            <div className="px-4 flex flex-col items-center min-w-[160px]">
                                <span className="text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Week</span>
                                <span className="text-[11px] font-normal text-slate-900 tracking-normal">{weekDays[0].label} — {weekDays[6].label}</span>
                            </div>
                            <button onClick={() => handleWeekChange(1)} className="p-2 hover:bg-white hover:text-primary rounded-lg transition-all text-slate-400"><FiChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {!isEmployee && (
                            <div className="relative flex-1 md:flex-none">
                                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                                <input
                                    type="text"
                                    className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-slate-50 border-slate-200 rounded-lg text-[11px] font-normal tracking-normal focus:border-primary focus:ring-primary/10 transition-all outline-none placeholder:text-slate-400"
                                    placeholder="Search employee..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        )}
                        {!isEmployee && (
                            <button 
                                onClick={() => setIsImportModalOpen(true)} 
                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                            >
                                <FiDownload className="w-3.5 h-3.5" />
                                <span>Import CSV</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Analytical Grid Workspace */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col relative">
                    <div className="flex-1 overflow-auto bg-slate-50/30 no-scrollbar">
                        <table className="w-full border-separate border-spacing-0">
                            <thead className="sticky top-0 z-20 shadow-sm border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left border-b border-r border-slate-100 bg-white w-72 min-w-[280px] sticky left-0 z-30">
                                        <span className="text-xs font-normal text-slate-500 uppercase">Employee</span>
                                    </th>
                                    {weekDays.map(day => (
                                        <th key={day.date} className="px-3 py-4 text-center border-b border-r border-slate-100 min-w-[200px] bg-white">
                                            <span className="text-xs font-normal text-slate-900 block">{day.label.split(',')[0]}</span>
                                            <span className="text-[10px] font-normal text-slate-500 mt-1">{day.label.split(',')[1]}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {employeeList.map((emp) => (
                                    <tr key={emp.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5 border-r border-slate-100 bg-white sticky left-0 z-10 align-top shadow-[4px_0_12px_-6px_rgba(0,0,0,0.05)]">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <Avatar
                                                        src={emp.employee_image || emp.user?.image}
                                                        name={emp.name}
                                                        size="sm"
                                                        className="rounded-lg shadow-sm border border-slate-100 group-hover:scale-110 transition-transform"
                                                    />
                                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-normal text-slate-900 tracking-normal leading-none group-hover:text-primary transition-colors">{emp.name}</p>
                                                    <p className="text-xs text-slate-500 mt-1">{emp.designation || 'Specialist'}</p>
                                                    <div className="flex gap-1.5 mt-2">
                                                        <span className="px-1.5 py-0.5 bg-slate-50 text-[10px] font-normal text-slate-500 rounded border border-slate-100">{emp.employee_code}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {weekDays.map(day => {                                             const key = `${emp.id}_${day.date}`;
                                             const cell = editData[key] || { attendance: '' };
                                             const dateObj = new Date(day.date);
                                             const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                                             const plannedShift = rosterMap[`${emp.id}_${dayName}`];
                                             const isWeeklyOff = cell.attendance === 'Weekly Off' || (plannedShift && plannedShift.is_weekly_off) || isEmployeeWeeklyOff(emp, day.date);
                                             const isLeave = cell.attendance === 'Leave';

                                             return (
                                                 <td key={day.date} className="px-2 py-2 align-top border-r border-slate-50 last:border-r-0">
                                                     <div className={`p-2 rounded-lg border transition-all duration-300 ${
                                                         isWeeklyOff ? 'bg-amber-50/70 border-amber-200 shadow-sm shadow-amber-100/30' :
                                                         isLeave ? 'bg-indigo-50/70 border-indigo-200 shadow-sm shadow-indigo-100/30' :
                                                         cell.attendance === 'Absent' ? 'bg-rose-50 border-rose-100 shadow-sm shadow-rose-100/50' : 
                                                         cell.attendance === 'Late' ? 'bg-amber-50 border-amber-100 shadow-sm shadow-amber-100/50' : 
                                                         cell.attendance === 'Present' ? 'bg-white border-primary/20 shadow-sm ring-1 ring-primary/5' :
                                                         'bg-slate-50/50 border-slate-100'
                                                     }`}>
                                                         {/* Status Controls */}
                                                         <div className="flex justify-between items-center mb-2">
                                                             <div className="relative flex items-center group/sel">
                                                                 <select
                                                                     className={`p-0 pr-4 text-[10px] font-medium uppercase tracking-normal border-none bg-transparent bg-none focus:ring-0 cursor-pointer appearance-none transition-colors ${
                                                                         isWeeklyOff ? 'text-amber-600 font-bold' :
                                                                         isLeave ? 'text-indigo-600 font-bold' :
                                                                         cell.attendance === 'Absent' ? 'text-rose-600' : 
                                                                         cell.attendance === 'Late' ? 'text-amber-600' : 
                                                                         cell.attendance === 'Present' ? 'text-primary' :
                                                                         'text-slate-400 hover:text-slate-600'
                                                                     }`}
                                                                     value={isWeeklyOff ? 'Weekly Off' : isLeave ? 'Leave' : (cell.attendance || '')}
                                                                     onChange={e => handleCellChange(emp.id, day.date, 'attendance', e.target.value)}
                                                                     disabled={isEmployee || isWeeklyOff || isLeave}
                                                                 >
                                                                     {isWeeklyOff ? (
                                                                         <option value="Weekly Off">WEEKLY OFF</option>
                                                                     ) : isLeave ? (
                                                                         <option value="Leave">LEAVE</option>
                                                                     ) : (
                                                                         <>
                                                                             <option value="">STATUS</option>
                                                                             {finalAttendanceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                             <option value="Weekly Off">Weekly Off</option>
                                                                         </>
                                                                     )}
                                                                 </select>
                                                                 <FiChevronDown className={`w-3 h-3 -ml-3 pointer-events-none transition-colors ${
                                                                     isWeeklyOff ? 'text-amber-500' :
                                                                     isLeave ? 'text-indigo-500' :
                                                                     cell.attendance === 'Absent' ? 'text-rose-500' : 
                                                                     cell.attendance === 'Late' ? 'text-amber-500' : 
                                                                     cell.attendance === 'Present' ? 'text-primary' :
                                                                     'text-slate-400 group-hover/sel:text-slate-600'
                                                                 }`} />
                                                             </div>
                                                             {plannedShift && !isWeeklyOff && !isLeave && (
                                                                 <button 
                                                                     type="button" 
                                                                     onClick={() => applyRoster(emp.id, day.date, plannedShift)} 
                                                                     className="text-[8px] font-normal text-slate-400 hover:text-primary hover:bg-primary/5 px-2 py-0.5 rounded-lg border border-slate-100 bg-white shadow-sm transition-all uppercase tracking-normal"
                                                                     title={`Planned Shift: ${plannedShift.shift_time}`}
                                                                 >
                                                                     ROSTER
                                                                 </button>
                                                             )}
                                                         </div>

                                                         {/* Time Management */}
                                                         <div className="flex gap-2 mb-2">
                                                             <div className="relative flex-1 group/input">
                                                                 <input
                                                                     type="time"
                                                                     className="w-full text-[10px] p-1 border border-slate-100 rounded-md bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 text-center font-normal transition-all h-7 outline-none disabled:opacity-50 disabled:bg-slate-100/50"
                                                                     value={isWeeklyOff || isLeave ? '' : (cell.from_time || '')}
                                                                     onChange={e => handleCellChange(emp.id, day.date, 'from_time', e.target.value)}
                                                                     disabled={isEmployee || isWeeklyOff || isLeave}
                                                                 />
                                                                 <span className="absolute -top-2 left-2 px-1 bg-white text-[7px] font-normal text-slate-300 uppercase tracking-normal border border-slate-100 rounded">IN</span>
                                                             </div>
                                                             <div className="relative flex-1 group/input">
                                                                 <input
                                                                     type="time"
                                                                     className="w-full text-[10px] p-1 border border-slate-100 rounded-md bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 text-center font-normal transition-all h-7 outline-none disabled:opacity-50 disabled:bg-slate-100/50"
                                                                     value={isWeeklyOff || isLeave ? '' : (cell.to_time || '')}
                                                                     onChange={e => handleCellChange(emp.id, day.date, 'to_time', e.target.value)}
                                                                     disabled={isEmployee || isWeeklyOff || isLeave}
                                                                 />
                                                                 <span className="absolute -top-2 left-2 px-1 bg-white text-[7px] font-normal text-slate-300 uppercase tracking-normal border border-slate-100 rounded">OUT</span>
                                                             </div>
                                                         </div>

                                                         {/* Metadata & Insights */}
                                                         <div className="flex items-center gap-2">
                                                             <div className="relative flex-1">
                                                                 <input
                                                                     type="text"
                                                                     placeholder={isWeeklyOff ? 'Weekly Off' : isLeave ? 'On Leave' : 'Add note...'}
                                                                     className="w-full min-w-0 text-[9px] px-0 py-1 bg-transparent border-none focus:ring-0 text-slate-600 font-normal placeholder:text-slate-300 placeholder:font-normal disabled:opacity-50"
                                                                     value={isWeeklyOff ? '' : isLeave ? (cell.reason || 'On Leave') : (cell.reason || '')}
                                                                     onChange={e => handleCellChange(emp.id, day.date, 'reason', e.target.value)}
                                                                     disabled={isEmployee || isWeeklyOff || isLeave}
                                                                 />
                                                             </div>
                                                             {cell.hours_worked > 0 && (() => {
                                                                 const worked = parseFloat(cell.hours_worked);
                                                                 const std = parseFloat(settings?.standard_working_hours || 9);
                                                                 const otHours = worked > std ? fmt(worked - std) : 0;
                                                                 const isOT = worked > std;
                                                                 const isUnder = worked < std;
                                                                 const colorClass = isUnder
                                                                     ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100/80'
                                                                     : isOT
                                                                         ? 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100/80'
                                                                         : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100/80';
                                                                 return (
                                                                     <button
                                                                         type="button"
                                                                         onClick={() => handleShowBreakup(emp, day.date, cell)}
                                                                         className={`flex flex-col items-center px-2 py-1 rounded-lg border transition-all duration-200 leading-tight ${colorClass}`}
                                                                         title={isOT ? `Worked ${fmt(worked)}h — ${otHours}h overtime. Click for details.` : `Worked ${fmt(worked)}h. Click for details.`}
                                                                     >
                                                                         <span className="text-[9px] font-bold tracking-wide">{fmt(worked)}h</span>
                                                                         {isOT && (
                                                                             <span className="text-[8px] font-normal text-orange-500 leading-none">▲ {otHours}h OT</span>
                                                                         )}
                                                                     </button>
                                                                 );
                                                             })()}
                                                         </div>
                                                     </div>
                                                 </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Operational Footer */}
                    <div className="bg-white border-t border-slate-100 px-6 py-4 shrink-0 flex items-center justify-between z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                        <div className="flex gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                            {paginationLinks.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`px-3.5 py-2 rounded-lg text-[10px] font-normal uppercase tracking-normal transition-all ${
                                        link.active ? 'bg-primary text-white shadow-lg shadow-primary/25' :
                                        !link.url ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-white hover:text-primary'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>

                        {!isEmployee && (
                            <button 
                                type="submit" 
                                className="group relative overflow-hidden bg-slate-900 text-white px-8 py-3.5 rounded-lg text-[11px] font-normal uppercase tracking-[0.15em] hover:bg-primary transition-all active:scale-95 shadow-xl shadow-slate-200"
                            >
                                <span className="relative z-10">Save Changes</span>
                                <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                        )}
                    </div>
                </form>
            </div>
            
            <ConfirmationModal
                show={confirmingAction.show}
                title={confirmingAction.title}
                message={confirmingAction.message}
                onConfirm={confirmingAction.onConfirm}
                onClose={closeModal}
                type={confirmingAction.type}
                hideCancel={confirmingAction.hideCancel}
            />

            {selectedBreakup && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">Attendance Breakup</h3>
                                {(() => {
                                    const totalWorked = parseFloat(selectedBreakup.attendance.hours_worked || 0);
                                    const totalHrs = Math.floor(totalWorked);
                                    const totalMins = Math.round((totalWorked - totalHrs) * 60);
                                    const totalDisplay = totalWorked > 0 ? `${totalHrs}hrs ${totalMins} min` : '0hrs 0 min';
                                    return (
                                        <p className="text-[10px] text-slate-400 uppercase mt-1 tracking-normal font-normal">
                                            {selectedBreakup.employee.name} • {new Date(selectedBreakup.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • Total Worked: <span className="font-bold text-xs text-slate-700">{totalDisplay}</span>
                                        </p>
                                    );
                                })()}
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedBreakup(null)}
                                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Summary Cards */}
                            {(() => {
                                const worked = parseFloat(selectedBreakup.attendance.hours_worked || 0);
                                const std = parseFloat(settings?.standard_working_hours || 9);
                                const regularHours = Math.min(worked, std);
                                
                                const otHoursVal = worked > std ? worked - std : 0;
                                const otHrs = Math.floor(otHoursVal);
                                const otMins = Math.round((otHoursVal - otHrs) * 60);
                                const otDisplay = otHoursVal > 0 ? `${otHrs}h ${otMins}m` : '0h 0m';

                                return (
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-center">
                                            <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-1">Regular Hours</p>
                                            <p className={`text-lg font-bold ${
                                                worked < std ? 'text-rose-600' : 'text-emerald-600'
                                            }`}>{fmt(regularHours)}h</p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-center">
                                            <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-1">Break Time</p>
                                            <p className="text-lg font-semibold text-amber-600">{selectedBreakup.attendance.total_break_minutes || 0}m</p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-center">
                                            <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-1">Overtime</p>
                                            <p className={`text-lg font-bold ${
                                                otHoursVal > 0 ? 'text-orange-500 font-bold' : 'text-slate-400'
                                            }`}>{otDisplay}</p>
                                        </div>
                                    </div>
                                );
                            })()}

                            {parseFloat(selectedBreakup.attendance.hours_worked || 0) > 0 && 
                             parseFloat(selectedBreakup.attendance.hours_worked || 0) < parseFloat(settings?.standard_working_hours || 9) && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-200">
                                    <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div>
                                        <p className="text-xs font-semibold text-rose-800">Hours Under Standard Requirement</p>
                                        <p className="text-[11px] text-rose-600 mt-1 leading-relaxed">
                                            Worked {selectedBreakup.attendance.hours_worked}h which is below the target of {settings?.standard_working_hours || 9}h. 
                                            <span className="block mt-1 font-semibold text-rose-700">💡 Tip for Improvement:</span>
                                            Focus on core assignments, structure break times effectively, and plan daily goals to meet the standard hours.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-normal">Session Timeline</h4>
                                {(() => {
                                    const parsed = parsePunches(selectedBreakup.attendance.punches, selectedBreakup.attendance.normal_hours || parseFloat(settings?.standard_working_hours || 9));
                                    if (!parsed || parsed.sessions.length === 0) {
                                        return (
                                            <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 italic">
                                                No detailed punch records available. Showing first clock-in/out:
                                                <div className="mt-2 font-semibold text-slate-700 not-italic">
                                                    IN: {selectedBreakup.attendance.from_time || '--'} | OUT: {selectedBreakup.attendance.to_time || '--'}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="relative border-l-2 border-slate-100 pl-6 ml-3 space-y-6">
                                            {parsed.sessions.map((sess, idx) => {
                                                const breakAfter = parsed.breaks[idx];
                                                return (
                                                    <div key={idx} className="relative">
                                                        {/* Icon Dot */}
                                                        <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white shadow-sm ring-1 ring-slate-100"></div>
                                                        <div>
                                                            <p className="text-xs font-medium text-slate-800">
                                                                Session {idx + 1}: <span className="font-semibold text-indigo-600">{sess.start} — {sess.end}</span>
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">Duration: {sess.duration} hours</p>
                                                        </div>

                                                        {breakAfter && (
                                                            <div className="mt-3 py-1.5 px-3 bg-amber-50/50 border border-amber-100/50 rounded-lg flex items-center justify-between max-w-sm">
                                                                <span className="text-[10px] text-amber-700 font-medium uppercase tracking-normal">Break Duration</span>
                                                                <span className="text-[10px] text-amber-800 font-semibold">{breakAfter.duration} mins ({breakAfter.start} — {breakAfter.end})</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end font-normal">
                            <button
                                type="button"
                                onClick={() => setSelectedBreakup(null)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-normal hover:bg-slate-50 transition-all uppercase tracking-normal"
                            >
                                Close Breakup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
