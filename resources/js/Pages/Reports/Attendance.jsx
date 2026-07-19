import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { FiArrowLeft, FiFilter, FiDownload, FiFileText, FiTable, FiClock, FiCheckCircle, FiXCircle, FiCalendar, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import MultiCheckboxSelect from '@/Components/MultiCheckboxSelect';

// Helper: OT color badge class
function getHoursColorClass(worked, std) {
    if (worked < std) return 'text-rose-600';
    if (worked > std) return 'text-orange-500';
    return 'text-emerald-600';
}

export default function Attendance({ attendances, summary, startDate, endDate, companyId, employeeId, companies, employees, settings }) {
    const [activeTab, setActiveTab] = useState('detail');
    const today = new Date().toLocaleDateString('en-CA');
    const stdHours = parseFloat(settings?.standard_working_hours || 9);

    const [filters, setFilters] = useState({
        start_date: startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date: endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        company_id: companyId
            ? (Array.isArray(companyId) ? companyId.map(String) : [String(companyId)])
            : [],
        employee_id: employeeId
            ? (Array.isArray(employeeId) ? employeeId.map(String) : [String(employeeId)])
            : []
    });

    // Filter employees based on selected company_id
    const filteredEmployees = (() => {
        if (!employees) return [];
        if (!filters.company_id || filters.company_id.length === 0) return employees;
        return employees.filter(emp => filters.company_id.includes(String(emp.company_id)));
    })();

    // Remove deselected company employees
    useEffect(() => {
        if (filters.company_id && filters.company_id.length > 0) {
            const allowedEmpIds = employees
                .filter(emp => filters.company_id.includes(String(emp.company_id)))
                .map(emp => String(emp.id));
            const newEmployeeIds = filters.employee_id.filter(id => allowedEmpIds.includes(id));
            if (newEmployeeIds.length !== filters.employee_id.length) {
                setFilters(prev => ({ ...prev, employee_id: newEmployeeIds }));
            }
        }
    }, [filters.company_id, employees]);

    // Build employee summaries for summary tab
    const employeeSummaries = (() => {
        const map = {};
        if (Array.isArray(attendances)) {
            attendances.forEach(att => {
                const empId = att.employee_id;
                if (!map[empId]) {
                    map[empId] = {
                        employee: att.employee,
                        company: att.company,
                        total_days: 0,
                        present: 0,
                        absent: 0,
                        leave: 0,
                        weekly_off: 0,
                        hours_worked: 0,
                        ot: 0,
                        ot_amt: 0
                    };
                }
                const item = map[empId];
                item.total_days++;
                if (['Present', 'Late'].includes(att.attendance)) item.present++;
                else if (att.attendance === 'Absent') item.absent++;
                else if (att.attendance === 'Weekly Off') item.weekly_off++;
                else if (att.attendance && att.attendance.toLowerCase().includes('leave')) item.leave++;
                item.hours_worked += parseFloat(att.hours_worked || 0);
                item.ot += parseFloat(att.ot || 0);
                item.ot_amt += parseFloat(att.ot_amt || 0);
            });
        }
        return Object.values(map);
    })();

    const overtimeAttendances = Array.isArray(attendances)
        ? attendances.filter(att => parseFloat(att.ot || 0) > 0)
        : [];

    const totalOtHours = summary?.total_ot_hours || 0;
    const totalOtAmount = summary?.total_ot_amount || 0;

    const handleFilter = () => {
        router.get(route('reports.attendance'), filters, { preserveState: true });
    };

    const handleExport = (type) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(v => params.append(`${key}[]`, v));
            } else {
                params.append(key, value);
            }
        });
        params.append('report_type', activeTab);
        window.open(`${route(`reports.attendance.export.${type}`)}?${params.toString()}`, '_blank');
    };

    const formatDate = (date) => date
        ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'N/A';

    // Status badge
    const statusBadge = (status) => {
        const map = {
            'Present': 'bg-emerald-50 text-emerald-600 border-emerald-100',
            'Late': 'bg-amber-50 text-amber-600 border-amber-100',
            'Absent': 'bg-rose-50 text-rose-600 border-rose-100',
            'Weekly Off': 'bg-indigo-50 text-indigo-600 border-indigo-100',
            'Half Day': 'bg-orange-50 text-orange-600 border-orange-100',
        };
        const cls = map[status] || 'bg-blue-50 text-blue-600 border-blue-100';
        return <span className={`px-2.5 py-1 text-[10px] font-normal rounded-lg uppercase tracking-normal border ${cls}`}>{status || 'N/A'}</span>;
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800 tracking-normal">Attendance Analysis</h2>}>
            <Head title="Attendance Report" />

            <div className="w-full mx-auto p-6 space-y-6 bg-slate-50 min-h-screen">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={route('reports.index')} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-all shadow-sm">
                            <FiArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-normal text-slate-900">Attendance Report</h1>
                            <p className="text-sm text-slate-500 mt-0.5 font-normal">Detailed tracking of employee presence, work hours and overtime.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleExport('pdf')}
                            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-normal uppercase tracking-normal hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center gap-2"
                        >
                            <FiFileText size={14} /> Export PDF
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-normal uppercase tracking-normal hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
                        >
                            <FiTable size={14} /> Export Excel
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <FiFilter size={16} />
                        </div>
                        <h3 className="text-base font-normal text-slate-800">Filter Parameters</h3>
                        <span className="ml-auto text-xs text-slate-400 font-normal">Standard working hours: <span className="font-bold text-slate-600">{stdHours}h</span></span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">Start Date</label>
                            <input type="date" value={filters.start_date} max={today} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-sm bg-slate-50/50" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">End Date</label>
                            <input type="date" value={filters.end_date} max={today} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-sm bg-slate-50/50" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">Branch</label>
                            <MultiCheckboxSelect value={filters.company_id} options={companies?.map(c => ({ value: String(c.id), label: c.name })) || []} onChange={(e) => setFilters({ ...filters, company_id: e.target.value })} placeholder="All Branches" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">Employee</label>
                            <MultiCheckboxSelect value={filters.employee_id} options={filteredEmployees.map(emp => ({ value: String(emp.id), label: emp.name }))} onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })} placeholder="All Employees" />
                        </div>
                        <div>
                            <button onClick={handleFilter} className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-normal hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 transition-all">
                                Apply Filter
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-2 group hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiCalendar size={18} />
                            </div>
                            <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Total Days</div>
                            <div className="text-2xl font-normal text-slate-800">{summary.total_days || 0}</div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-2 group hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiCheckCircle size={18} />
                            </div>
                            <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Present</div>
                            <div className="text-2xl font-normal text-emerald-600">{summary.present || 0}</div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-2 group hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiXCircle size={18} />
                            </div>
                            <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Absent</div>
                            <div className="text-2xl font-normal text-rose-600">{summary.absent || 0}</div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-2 group hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiClock size={18} />
                            </div>
                            <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Total Hours</div>
                            <div className="text-2xl font-normal text-sky-600">{parseFloat(summary.total_hours || 0).toFixed(1)}h</div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-orange-200 p-5 flex flex-col gap-2 group hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiTrendingUp size={18} />
                            </div>
                            <div className="text-xs font-normal text-orange-400 uppercase tracking-normal">OT Hours</div>
                            <div className="text-2xl font-normal text-orange-500">{parseFloat(totalOtHours).toFixed(1)}h</div>
                            <div className="text-[10px] text-orange-300 font-normal">{overtimeAttendances.length} OT session{overtimeAttendances.length !== 1 ? 's' : ''}</div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-indigo-200 p-5 flex flex-col gap-2 group hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiAlertCircle size={18} />
                            </div>
                            <div className="text-xs font-normal text-indigo-400 uppercase tracking-normal">OT Amount</div>
                            <div className="text-xl font-normal text-indigo-600">{parseFloat(totalOtAmount).toLocaleString('en-US', { style: 'currency', currency: 'QAR', maximumFractionDigits: 0 })}</div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-slate-200 gap-1">
                    {[
                        { key: 'detail', label: 'Detail Log' },
                        { key: 'summary', label: 'Employee Summary' },
                        { key: 'overtime', label: `Overtime (${overtimeAttendances.length})` },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-5 pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-sm font-normal text-slate-800">
                            {activeTab === 'summary' ? `Employee Summaries (${employeeSummaries.length})` : activeTab === 'overtime' ? `Overtime Records (${overtimeAttendances.length})` : `Detailed Attendance Logs (${attendances?.length || 0})`}
                        </h3>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-normal uppercase tracking-normal">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span> Under {stdHours}h</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span> On time</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block"></span> Overtime</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">

                        {/* ── DETAIL TAB ── */}
                        {activeTab === 'detail' && (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Date</th>
                                        <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Employee</th>
                                        <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Branch</th>
                                        <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Status</th>
                                        <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-center">Clock In</th>
                                        <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-center">Clock Out</th>
                                        <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-right">Worked</th>
                                        <th className="px-6 py-4 text-xs font-normal text-orange-500 uppercase tracking-normal text-right">OT Hours</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-50">
                                    {attendances && attendances.length > 0 ? (
                                        attendances.map((att) => {
                                            const worked = parseFloat(att.hours_worked || 0);
                                            const otH = parseFloat(att.ot || 0);
                                            const colorClass = getHoursColorClass(worked, stdHours);
                                            return (
                                                <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-normal text-slate-700">{formatDate(att.date)}</div>
                                                        <div className="text-[10px] text-slate-400">{new Date(att.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-normal text-slate-500 border border-slate-200 shadow-sm">
                                                                {att.employee?.name?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-normal text-slate-700">{att.employee?.name}</div>
                                                                <div className="text-[10px] text-slate-400">{att.employee?.employee_code}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-slate-500">{att.company?.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{statusBadge(att.attendance)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-normal">
                                                        {att.from_time ? <span className="text-emerald-600 font-medium">{att.from_time}</span> : <span className="text-slate-300">--:--</span>}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-normal">
                                                        {att.to_time ? <span className="text-rose-500 font-medium">{att.to_time}</span> : <span className="text-slate-300">--:--</span>}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${colorClass}`}>
                                                        {worked > 0 ? (
                                                            <div className="flex flex-col items-end">
                                                                <span>{worked.toFixed(2)}h</span>
                                                                {worked > stdHours && (
                                                                    <span className="text-[9px] text-orange-400 font-normal">(+{(worked - stdHours).toFixed(2)}h OT)</span>
                                                                )}
                                                            </div>
                                                        ) : <span className="text-slate-300">—</span>}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        {(() => {
                                                            // Use stored ot, but cap it: if att.ot equals hours_worked (bug in old data), recalculate
                                                            const otStored = parseFloat(att.ot || 0);
                                                            const otComputed = worked > stdHours ? parseFloat((worked - stdHours).toFixed(3)) : 0;
                                                            // If stored OT equals full hours worked (bad data), use computed instead
                                                            const otDisplay = (otStored > 0 && Math.abs(otStored - worked) < 0.01) ? otComputed : otStored;
                                                            return otDisplay > 0 ? (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-sm font-bold text-orange-500">{otDisplay.toFixed(2)}h</span>
                                                                    <span className="text-[9px] text-orange-400 font-normal">overtime</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-slate-300">—</span>
                                                            );
                                                        })()}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200 border border-slate-100 shadow-inner">
                                                        <FiCalendar size={24} />
                                                    </div>
                                                    <p className="text-slate-400 text-sm font-normal">No attendance records found for the selected period.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* ── SUMMARY TAB ── */}
                        {activeTab === 'summary' && (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Employee</th>
                                        <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Branch</th>
                                        <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-center">Days</th>
                                        <th className="px-6 py-4 text-xs font-normal text-emerald-600 uppercase tracking-normal text-center">Present</th>
                                        <th className="px-6 py-4 text-xs font-normal text-rose-600 uppercase tracking-normal text-center">Absent</th>
                                        <th className="px-6 py-4 text-xs font-normal text-blue-600 uppercase tracking-normal text-center">Leave</th>
                                        <th className="px-6 py-4 text-xs font-normal text-amber-600 uppercase tracking-normal text-center">W/Off</th>
                                        <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-right">Work Hours</th>
                                        <th className="px-6 py-4 text-xs font-normal text-orange-500 uppercase tracking-normal text-right">OT Hours</th>
                                        <th className="px-6 py-4 text-xs font-normal text-indigo-600 uppercase tracking-normal text-right">OT Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-50">
                                    {employeeSummaries.length > 0 ? (
                                        employeeSummaries.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-normal text-slate-700">{item.employee?.name}</div>
                                                    <div className="text-[10px] text-slate-400">{item.employee?.employee_code || '—'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-slate-500">{item.company?.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-slate-700 text-center">{item.total_days}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 text-center">{item.present}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-rose-600 text-center">{item.absent}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-blue-600 text-center">{item.leave}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-amber-600 text-center">{item.weekly_off}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="text-sm font-bold text-slate-700">{item.hours_worked.toFixed(2)}h</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    {item.ot > 0 ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-sm font-bold text-orange-500">{item.ot.toFixed(2)}h</span>
                                                            <span className="text-[9px] text-orange-400">overtime</span>
                                                        </div>
                                                    ) : <span className="text-slate-300 text-sm">—</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    {item.ot_amt > 0 ? (
                                                        <span className="text-sm font-bold text-indigo-600">
                                                            {item.ot_amt.toLocaleString('en-US', { style: 'currency', currency: 'QAR', maximumFractionDigits: 0 })}
                                                        </span>
                                                    ) : <span className="text-slate-300 text-sm">—</span>}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="10" className="px-6 py-20 text-center">
                                                <p className="text-slate-400 text-sm font-normal">No summary records found.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* ── OVERTIME TAB ── */}
                        {activeTab === 'overtime' && (
                            <table className="w-full text-left">
                                <thead className="bg-orange-50/60 border-b border-orange-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Date</th>
                                        <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Employee</th>
                                        <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Branch</th>
                                        <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-right">Standard</th>
                                        <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-right">Actual Worked</th>
                                        <th className="px-6 py-4 text-xs font-bold text-orange-600 uppercase tracking-normal text-right">OT Hours</th>
                                        <th className="px-6 py-4 text-xs font-bold text-indigo-600 uppercase tracking-normal text-right">OT Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-50">
                                    {overtimeAttendances.length > 0 ? (
                                        overtimeAttendances.map((att) => {
                                            const worked = parseFloat(att.hours_worked || 0);
                                            const normal = parseFloat(att.normal_hours || stdHours);
                                            const otH = parseFloat(att.ot || 0);
                                            return (
                                                <tr key={att.id} className="hover:bg-orange-50/30 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-normal text-slate-700">{formatDate(att.date)}</div>
                                                        <div className="text-[10px] text-slate-400">{new Date(att.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-normal text-slate-700">{att.employee?.name}</div>
                                                        <div className="text-[10px] text-slate-400">{att.employee?.employee_code}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-slate-500">{att.company?.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-slate-500 text-right">{normal}h</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700 text-right">{worked.toFixed(2)}h</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-sm font-bold text-orange-500">{otH.toFixed(2)}h</span>
                                                            <span className="text-[9px] text-orange-400">{((otH / normal) * 100).toFixed(0)}% extra</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600 text-right">
                                                        {parseFloat(att.ot_amt || 0).toLocaleString('en-US', { style: 'currency', currency: 'QAR' })}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-orange-200 border border-orange-100 shadow-inner">
                                                        <FiTrendingUp size={24} />
                                                    </div>
                                                    <p className="text-slate-400 text-sm font-normal">No overtime records in this period.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                {overtimeAttendances.length > 0 && (
                                    <tfoot className="bg-orange-50/40 border-t border-orange-100">
                                        <tr>
                                            <td colSpan="5" className="px-6 py-3 text-xs font-normal text-slate-500 uppercase tracking-normal">Totals</td>
                                            <td className="px-6 py-3 text-right">
                                                <span className="text-sm font-bold text-orange-500">{parseFloat(totalOtHours).toFixed(2)}h</span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <span className="text-sm font-bold text-indigo-600">
                                                    {parseFloat(totalOtAmount).toLocaleString('en-US', { style: 'currency', currency: 'QAR' })}
                                                </span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
