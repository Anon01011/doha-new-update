import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { FiArrowLeft, FiFilter, FiDownload, FiFileText, FiTable, FiCalendar, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

export default function Leave({ leaveRequests, summary, startDate, endDate, status, leaveTypeId, leaveTypes }) {
    const today = new Date().toLocaleDateString('en-CA');
    const [filters, setFilters] = useState({
        start_date: startDate || '',
        end_date: endDate || '',
        status: status || '',
        leave_type_id: leaveTypeId || ''
    });

    const handleFilter = () => {
        router.get(route('reports.leave'), filters, { preserveState: true });
    };

    const handleExport = (type) => {
        const queryParams = new URLSearchParams(filters).toString();
        const baseUrl = route(`reports.leave.export.${type}`);
        window.open(`${baseUrl}?${queryParams}`, '_blank');
    };

    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

    const getStatusStyle = (s) => {
        switch (s?.toLowerCase()) {
            case 'approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'pending': return 'bg-sky-50 text-sky-600 border-sky-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800 tracking-normal">Leave Analysis</h2>}>
            <Head title="Leave Report" />

            <div className="w-full mx-auto p-6 space-y-6 bg-slate-50 min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={route('reports.index')} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-all shadow-sm">
                            <FiArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-normal text-slate-900">Leave Report</h1>
                            <p className="text-sm text-slate-500 mt-0.5 font-normal">Monitor leave patterns, approvals, and absence distributions.</p>
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
                        <h3 className="text-base font-normal text-slate-800">Parameters</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">Start Date</label>
                            <input
                                type="date"
                                value={filters.start_date}
                                max={today}
                                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                                className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-sm bg-slate-50/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">End Date</label>
                            <input
                                type="date"
                                value={filters.end_date}
                                max={today}
                                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                                className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-sm bg-slate-50/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-sm bg-slate-50/50"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">Leave Type</label>
                            <select
                                value={filters.leave_type_id}
                                onChange={(e) => setFilters({ ...filters, leave_type_id: e.target.value })}
                                className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-sm bg-slate-50/50"
                            >
                                <option value="">All Types</option>
                                {leaveTypes?.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <button
                                onClick={handleFilter}
                                className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-normal hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                            >
                                Apply Analytics
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiCalendar size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Total</div>
                                <div className="text-xl font-normal text-slate-800">{summary.total_requests || 0}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiCheckCircle size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Approved</div>
                                <div className="text-xl font-normal text-emerald-600">{summary.approved || 0}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiClock size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Pending</div>
                                <div className="text-xl font-normal text-sky-600">{summary.pending || 0}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiXCircle size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Rejected</div>
                                <div className="text-xl font-normal text-rose-600">{summary.rejected || 0}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiCalendar size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Total Days</div>
                                <div className="text-xl font-normal text-indigo-600">{summary.total_days || 0}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Leave List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-base font-normal text-slate-800">Request Logs</h3>
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                            <FiCalendar size={16} />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Employee</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Leave Type</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Duration</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Days</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-50">
                                {leaveRequests && leaveRequests.length > 0 ? (
                                    leaveRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-normal text-slate-500 border border-slate-200 shadow-sm">
                                                        {req.employee?.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-normal text-slate-700">{req.employee?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-normal text-slate-600">{req.leave_type?.name}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-slate-500">
                                                {formatDate(req.start_date)} - {formatDate(req.end_date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-slate-700">
                                                {req.days_requested} days
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className={`px-3 py-1 text-[10px] font-normal rounded-lg uppercase tracking-normal border ${getStatusStyle(req.status)}`}>
                                                    {req.status || 'N/A'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200 border border-slate-100 shadow-inner">
                                                    <FiCalendar size={24} />
                                                </div>
                                                <p className="text-slate-400 text-sm font-normal">No leave requests found for the selected period.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
