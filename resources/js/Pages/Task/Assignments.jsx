import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { FaTasks, FaUser, FaHistory, FaCheckCircle, FaPlus, FaArrowLeft, FaFilter } from 'react-icons/fa';

export default function Assignments({ assignments, taskId, status }) {
    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

    const getStatusStyle = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'completed') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (s === 'in_progress') return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        if (s === 'pending') return 'bg-amber-100 text-amber-700 border-amber-200';
        if (s === 'cancelled') return 'bg-rose-100 text-rose-700 border-rose-200';
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    const formatStatus = (s) => {
        if (!s) return 'Pending';
        return s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Task Assignments</h2>}>
            <Head title="Task Assignments" />

            <div className="p-4 space-y-6 bg-slate-50 min-h-screen">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div>
                        <h1 className="text-xl font-normal text-slate-900">Task Assignments</h1>
                        <p className="text-sm text-slate-500 mt-1">Track and manage employee assignments for tasks.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href={route('tasks.index')}
                            className="bg-white text-slate-600 px-4 py-2 rounded-lg text-sm font-normal border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            <FaArrowLeft size={10} /> Back to Tasks
                        </Link>
                        <Link
                            href={route('task-assignments.create', taskId ? { task_id: taskId } : {})}
                            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-normal hover:brightness-110 transition-all flex items-center gap-2"
                        >
                            <FaPlus size={10} /> Assign Task
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-2 rounded-xl border border-slate-200 inline-flex flex-wrap gap-1 shadow-sm">
                    {[
                        { label: 'All Statuses', value: null },
                        { label: 'Pending', value: 'pending' },
                        { label: 'In Progress', value: 'in_progress' },
                        { label: 'Completed', value: 'completed' },
                        { label: 'Cancelled', value: 'cancelled' }
                    ].map((tab) => (
                        <Link
                            key={tab.label}
                            href={route('task-assignments.index', { status: tab.value, task_id: taskId })}
                            className={`px-4 py-2 rounded-lg text-sm font-normal transition-all ${status === tab.value || (!status && !tab.value)
                                ? `bg-slate-900 text-white shadow-md`
                                : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>

                {/* Assignments List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="px-5 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Task Details</th>
                                    <th className="px-5 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Assigned Employee</th>
                                    <th className="px-5 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Assignment Info</th>
                                    <th className="px-5 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Progress</th>
                                    <th className="px-5 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {assignments?.data && assignments.data.length > 0 ? (
                                    assignments.data.map((assignment) => (
                                        <tr
                                            key={assignment.id}
                                            onClick={() => router.visit(route('tasks.show', assignment.task_id))}
                                            className="hover:bg-slate-50 transition-all group cursor-pointer"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-primary font-normal text-sm shrink-0">
                                                        {assignment.task?.title?.charAt(0) || 'T'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-normal text-slate-800 group-hover:text-primary transition-colors mb-1">{assignment.task?.title}</p>
                                                        <p className="text-xs text-slate-400 font-normal">Task ID: #{assignment.task?.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-normal text-slate-600 shrink-0 overflow-hidden shadow-sm">
                                                        {assignment.employee?.employee_image ? (
                                                            <img src={`/storage/${assignment.employee.employee_image}`} alt={assignment.employee.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            assignment.employee?.name?.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-normal text-slate-700">{assignment.employee?.name || 'Unassigned'}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs text-slate-500 font-normal flex items-center gap-1.5"><FaHistory size={10} className="text-slate-300" /> Assigned: <span className="text-slate-800 font-normal">{formatDate(assignment.assigned_date)}</span></p>
                                                    <p className="text-xs text-slate-500 font-normal flex items-center gap-1.5"><FaUser size={10} className="text-slate-300" /> Assigner: <span className="text-slate-800 font-normal">{assignment.assigner?.name || 'System'}</span></p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 w-48">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center text-[10px] font-normal uppercase tracking-normal">
                                                        <span className="text-slate-400">Completion</span>
                                                        <span className={assignment.progress_percentage === 100 ? 'text-emerald-600' : 'text-primary'}>
                                                            {assignment.progress_percentage || 0}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${assignment.progress_percentage === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                                                            style={{ width: `${assignment.progress_percentage || 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-normal uppercase tracking-normal border ${getStatusStyle(assignment.status)}`}>
                                                    {formatStatus(assignment.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-5 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
                                                    <FaTasks size={32} className="text-slate-200" />
                                                </div>
                                                <h3 className="text-slate-800 font-normal text-lg">No assignments found</h3>
                                                <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">There are no task assignments matching your current filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {assignments?.links && assignments.links.length > 3 && (
                    <div className="flex justify-center pt-6">
                        <div className="bg-white p-2 rounded-xl border border-slate-200 flex gap-2 shadow-sm">
                            {assignments.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`px-4 py-2 rounded-lg text-xs font-normal transition-all ${link.active
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : !link.url
                                            ? 'text-slate-300 cursor-not-allowed pointer-events-none'
                                            : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
