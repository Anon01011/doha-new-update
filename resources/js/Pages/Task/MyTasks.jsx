import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { FaTasks, FaClock, FaCheckCircle, FaPlay, FaStop, FaArrowRight, FaFilter } from 'react-icons/fa';

export default function MyTasks({ tasks, status, priority }) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleFilterChange = (key, value) => {
        const params = { status, priority };
        params[key] = value;
        router.get(route('my_tasks'), params, { preserveState: true });
    };

    const handleAction = (route_name, task_id, params = {}) => {
        router.post(route(route_name, task_id), params);
    };

    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

    const getPriorityColor = (priority) => {
        const p = priority?.toLowerCase() || '';
        if (p === 'urgent') return 'bg-rose-100 text-rose-600 border border-rose-200';
        if (p === 'high') return 'bg-orange-100 text-orange-600 border border-orange-200';
        if (p === 'medium') return 'bg-amber-100 text-amber-600 border border-amber-200';
        return 'bg-sky-100 text-sky-600 border border-sky-200';
    };

    const getStatusColor = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'completed') return 'bg-emerald-500 text-white';
        if (s === 'in_progress') return 'bg-indigo-500 text-white';
        if (s === 'cancelled') return 'bg-slate-500 text-white';
        return 'bg-amber-500 text-white';
    };

    const formatStatus = (s) => {
        if (!s) return 'Pending';
        return s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">My Tasks</h2>}>
            <Head title="My Tasks" />

            <div className="p-4 space-y-6 bg-slate-50 min-h-screen">
                {/* Modern Header & Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div>
                        <h1 className="text-xl font-normal text-slate-900">Assigned Tasks</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage your tasks and track your progress.</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <FaFilter size={12} className="text-slate-400" />
                            <select
                                value={status || ''}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 focus:border-primary outline-none transition-all cursor-pointer min-w-[140px]"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <select
                            value={priority || ''}
                            onChange={(e) => handleFilterChange('priority', e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 focus:border-primary outline-none transition-all cursor-pointer min-w-[140px]"
                        >
                            <option value="">All Priorities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>

                {tasks?.data && tasks.data.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {tasks.data.map((task) => {
                            const assignment = task.assignments?.[0];
                            const isTimerRunning = assignment?.timers?.some(t => !t.end_time);

                            return (
                                <div key={task.id} className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col">
                                    <div className="p-5 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-normal uppercase tracking-normal border ${getPriorityColor(task.priority)}`}>
                                                {task.priority || 'Medium'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-normal text-slate-500" title={`Created by ${task.creator?.name}`}>
                                                    {task.creator?.name.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                        </div>

                                        <Link href={route('tasks.show', task.id)} className="block group-hover:text-primary transition-colors mb-2">
                                            <h3 className="text-base font-normal text-slate-800 leading-tight line-clamp-2">{task.title}</h3>
                                        </Link>

                                        <div className="flex items-center gap-2 mb-5">
                                            <FaProjectDiagram size={12} className="text-primary/60" />
                                            <p className="text-xs font-normal text-slate-500 truncate">{task.project?.name || 'Standalone Task'}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-5">
                                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                                <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-1">Due Date</p>
                                                <p className="text-sm font-normal text-slate-700">{formatDate(task.due_date)}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                                <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-1">Estimate</p>
                                                <p className="text-sm font-normal text-slate-700">{task.estimated_hours || '0'}h</p>
                                            </div>
                                        </div>

                                        {assignment && (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">Progress</span>
                                                    <span className="text-sm font-normal text-primary">{assignment.progress_percentage}%</span>
                                                </div>
                                                {assignment.acceptance_status === 'accepted' ? (
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        step="5"
                                                        defaultValue={assignment.progress_percentage}
                                                        onMouseUp={(e) => handleAction('tasks.update-progress', task.id, { progress_percentage: e.target.value })}
                                                        onTouchEnd={(e) => handleAction('tasks.update-progress', task.id, { progress_percentage: e.target.value })}
                                                        className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-primary"
                                                    />
                                                ) : (
                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className="bg-primary h-full transition-all duration-1000"
                                                            style={{ width: `${assignment.progress_percentage}%` }}
                                                        ></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Actions Footer */}
                                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                                        {assignment?.acceptance_status === 'pending' ? (
                                            <>
                                                <button
                                                    onClick={() => handleAction('tasks.accept', task.id)}
                                                    className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg text-xs font-normal hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <FaCheckCircle size={10} /> Accept
                                                </button>
                                                <Link
                                                    href={route('tasks.show', task.id)}
                                                    className="flex-1 bg-white text-slate-500 py-2.5 rounded-lg text-xs font-normal border border-slate-200 hover:bg-slate-100 transition-all text-center"
                                                >
                                                    Details
                                                </Link>
                                            </>
                                        ) : (
                                            <>
                                                {isTimerRunning ? (
                                                    <button
                                                        onClick={() => handleAction('tasks.stop-timer', task.id)}
                                                        className="flex-1 bg-rose-600 text-white py-2.5 rounded-lg text-xs font-normal hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <FaStop size={10} className="animate-pulse" /> Stop Timer
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAction('tasks.start-timer', task.id)}
                                                        className="flex-1 bg-primary text-white py-2.5 rounded-lg text-xs font-normal hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <FaPlay size={10} /> Start Timer
                                                    </button>
                                                )}
                                                <Link
                                                    href={route('tasks.show', task.id)}
                                                    className="flex-1 bg-white text-slate-600 py-2.5 rounded-lg text-xs font-normal border border-slate-200 hover:bg-slate-100 transition-all text-center flex items-center justify-center gap-2"
                                                >
                                                    View <FaArrowRight size={10} />
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 border border-slate-100 shadow-inner">
                            <FaTasks size={32} />
                        </div>
                        <h3 className="text-xl font-normal text-slate-800">No tasks assigned</h3>
                        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">You don't have any active tasks at the moment. When tasks are assigned to you, they will appear here.</p>
                    </div>
                )}

                {/* Modern Pagination */}
                {tasks?.links && tasks.links.length > 3 && (
                    <div className="flex justify-center mt-10">
                        <div className="flex gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                            {tasks.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`px-4 py-2 rounded-lg text-xs font-normal transition-all ${link.active
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                        } ${!link.url && 'opacity-30 cursor-not-allowed pointer-events-none'}`}
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
