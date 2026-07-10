import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { FiArrowLeft, FiFilter, FiDownload, FiFileText, FiTable, FiCheckSquare, FiClock, FiActivity, FiAlertCircle } from 'react-icons/fi';

export default function Task({ tasks, summary, status, priority }) {
    const [filters, setFilters] = useState({
        status: status || '',
        priority: priority || ''
    });

    const handleFilter = () => {
        router.get(route('reports.task'), filters, { preserveState: true });
    };

    const handleExport = (type) => {
        const queryParams = new URLSearchParams(filters).toString();
        const baseUrl = route(`reports.task.export.${type}`);
        window.open(`${baseUrl}?${queryParams}`, '_blank');
    };

    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

    const getStatusStyle = (s) => {
        switch (s?.toLowerCase()) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'in_progress': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const getPriorityStyle = (p) => {
        switch (p?.toLowerCase()) {
            case 'high':
            case 'urgent': return 'bg-rose-500 text-white';
            case 'medium': return 'bg-amber-500 text-white';
            case 'low': return 'bg-sky-500 text-white';
            default: return 'bg-slate-500 text-white';
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800 tracking-normal">Operations Intelligence</h2>}>
            <Head title="Task Report" />

            <div className="w-full mx-auto p-6 space-y-6 bg-slate-50 min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={route('reports.index')} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-all shadow-sm">
                            <FiArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-normal text-slate-900">Task Performance Report</h1>
                            <p className="text-sm text-slate-500 mt-0.5 font-normal">Track operational progress, completion rates, and priority distribution.</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-sm bg-slate-50/50"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">Priority</label>
                            <select
                                value={filters.priority}
                                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                                className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-sm bg-slate-50/50"
                            >
                                <option value="">All Priorities</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiCheckSquare size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Total Tasks</div>
                                <div className="text-xl font-normal text-slate-800">{summary.total_tasks || 0}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiActivity size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Completed</div>
                                <div className="text-xl font-normal text-emerald-600">{summary.completed || 0}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiClock size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">In Progress</div>
                                <div className="text-xl font-normal text-sky-600">{summary.in_progress || 0}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiAlertCircle size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Cancelled</div>
                                <div className="text-xl font-normal text-rose-600">{summary.cancelled || 0}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Task List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-base font-normal text-slate-800">Operational Logs</h3>
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                            <FiActivity size={16} />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Task Objective</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Priority</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Due Date</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Assignments</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Completion</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-50">
                                {tasks && tasks.length > 0 ? (
                                    tasks.map((task) => (
                                        <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-normal text-slate-500 border border-slate-200 shadow-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <FiCheckSquare size={14} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-normal text-slate-700 line-clamp-1 max-w-xs">{task.title}</div>
                                                        <div className="text-[10px] text-slate-400 font-normal uppercase tracking-normal">ID: {task.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 text-[10px] font-normal rounded uppercase tracking-normal ${getPriorityStyle(task.priority)}`}>
                                                    {task.priority || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-slate-500">{formatDate(task.due_date)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[10px] font-normal text-slate-500">
                                                        {task.assignments?.length || 0}
                                                    </div>
                                                    <span className="text-xs text-slate-400 font-normal italic">Assigned</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="w-32">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">{task.progress || 0}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                                        <div 
                                                            className={`h-full transition-all duration-500 ${task.progress >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                                                            style={{ width: `${task.progress || 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className={`px-3 py-1 text-[10px] font-normal rounded-lg uppercase tracking-normal border ${getStatusStyle(task.status)}`}>
                                                    {(task.status || 'N/A').replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200 border border-slate-100 shadow-inner">
                                                    <FiCheckSquare size={24} />
                                                </div>
                                                <p className="text-slate-400 text-sm font-normal">No task records found for the selected filters.</p>
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
