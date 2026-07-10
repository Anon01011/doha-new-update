import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { FaSearch, FaPlus, FaFilter, FaEye, FaEdit, FaTrash, FaUsers, FaTasks } from 'react-icons/fa';

export default function Index({ tasks, projects, status, priority, projectId, search: initialSearch = '', userRole, leadProjectIds = [] }) {
    const [searchTerm, setSearchTerm] = useState(initialSearch || '');

    const canManageTask = (task) => {
        if (userRole === 'admin' || userRole === 'hr' || userRole === 'manager') return true;
        return task.project_id && leadProjectIds.includes(task.project_id);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('tasks.index'), { search: searchTerm, status, priority, project_id: projectId }, { preserveState: true });
    };

    const handleFilterChange = (key, value) => {
        const params = { search: searchTerm, status, priority, project_id: projectId };
        params[key] = value;
        router.get(route('tasks.index'), params, { preserveState: true });
    };

    const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A';

    const getPriorityColor = (p) => {
        const v = p?.toLowerCase() || '';
        if (v === 'urgent') return 'bg-rose-50 text-rose-600 border border-rose-200';
        if (v === 'high')   return 'bg-amber-50 text-amber-600 border border-amber-200';
        if (v === 'medium') return 'bg-blue-50 text-blue-600 border border-blue-200';
        return 'bg-slate-50 text-slate-600 border border-slate-200';
    };

    const getStatusColor = (s) => {
        const v = s?.toLowerCase() || '';
        if (v === 'completed')  return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        if (v === 'in_progress') return 'bg-sky-50 text-sky-700 border border-sky-200';
        if (v === 'cancelled')  return 'bg-slate-50 text-slate-500 border border-slate-200';
        return 'bg-amber-50 text-amber-700 border border-amber-200';
    };

    const formatStatus = (s) => {
        if (!s) return 'Pending';
        return s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleDelete = (id) => {
        setSelectedTaskId(id);
        setConfirmingDeletion(true);
    };

    const confirmDeletion = () => {
        setProcessing(true);
        router.delete(route('tasks.destroy', selectedTaskId), {
            onFinish: () => { setProcessing(false); setConfirmingDeletion(false); }
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Tasks</h2>}>
            <Head title="Tasks" />
            <div className="p-4 space-y-4 bg-slate-50 min-h-screen">

                {/* Header & Filters */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-normal text-slate-900">All Tasks</h1>
                        <p className="text-sm text-slate-400 mt-0.5">Manage and monitor task progress across projects.</p>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex-1 xl:max-w-4xl">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2 items-center">
                            <div className="relative flex-1 w-full">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search tasks..."
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm transition-all outline-none focus:border-primary focus:bg-white"
                                />
                            </div>

                            <div className="flex w-full md:w-auto gap-2">
                                <select
                                    value={projectId || ''}
                                    onChange={(e) => handleFilterChange('project_id', e.target.value)}
                                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none cursor-pointer focus:border-primary"
                                >
                                    <option value="">All Projects</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={status || ''}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none cursor-pointer focus:border-primary"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <select
                                    value={priority || ''}
                                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none cursor-pointer focus:border-primary"
                                >
                                    <option value="">All Priorities</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            <div className="flex gap-2 w-full md:w-auto">
                                <button
                                    type="submit"
                                    className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-primary text-sm font-normal transition-all flex items-center justify-center gap-2"
                                >
                                    <FaFilter size={11} /> Filter
                                </button>
                                {(userRole !== 'employee' || leadProjectIds.length > 0) && (
                                    <Link
                                        href={route('tasks.create')}
                                        className="bg-primary text-white px-4 py-2 rounded-lg hover:brightness-110 text-sm font-normal transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                                    >
                                        <FaPlus size={11} /> New Task
                                    </Link>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Task Table */}
                {tasks?.data && tasks.data.length > 0 ? (
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-normal text-slate-500">Task</th>
                                        <th className="px-4 py-3 text-left text-xs font-normal text-slate-500">Project</th>
                                        <th className="px-4 py-3 text-left text-xs font-normal text-slate-500">Priority</th>
                                        <th className="px-4 py-3 text-left text-xs font-normal text-slate-500">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-normal text-slate-500">Due Date</th>
                                        <th className="px-4 py-3 text-center text-xs font-normal text-slate-500">Subtasks</th>
                                        <th className="px-4 py-3 text-left text-xs font-normal text-slate-500">Progress</th>
                                        <th className="px-4 py-3 text-right text-xs font-normal text-slate-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {tasks.data.map((task) => (
                                        <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                        <FaTasks size={11} />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-normal text-slate-800 block leading-none">{task.title}</span>
                                                        {task.category && <span className="text-xs text-slate-400 mt-0.5 block">{task.category}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-sm text-slate-600">{task.project?.name || '—'}</span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-normal ${getPriorityColor(task.priority)}`}>
                                                    {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Low'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-normal ${getStatusColor(task.status)}`}>
                                                    {formatStatus(task.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                                                {formatDate(task.due_date)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <span className="text-sm text-slate-500">{task.subtasks?.length || 0}</span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-16">
                                                        <div
                                                            className="h-full bg-primary rounded-full"
                                                            style={{ width: `${task.assignments?.[0]?.progress_percentage || 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-400">{task.assignments?.[0]?.progress_percentage || 0}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link href={route('tasks.show', task.id)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white rounded-lg transition-all">
                                                        <FaEye size={11} />
                                                    </Link>
                                                    {canManageTask(task) && (
                                                        <>
                                                            <Link href={route('tasks.edit', task.id)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white rounded-lg transition-all">
                                                                <FaEdit size={11} />
                                                            </Link>
                                                            <Link href={route('task-assignments.index', { task_id: task.id })} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white rounded-lg transition-all">
                                                                <FaUsers size={11} />
                                                            </Link>
                                                            <button onClick={() => handleDelete(task.id)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all">
                                                                <FaTrash size={11} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-slate-200 p-16 text-center shadow-sm">
                        <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-3 border border-slate-100 text-slate-300">
                            <FaTasks size={22} />
                        </div>
                        <h3 className="text-base font-normal text-slate-700 mb-1">No tasks found</h3>
                        <p className="text-sm text-slate-400 mb-4 max-w-xs mx-auto">Tasks will appear here once created and assigned to a project.</p>
                        {(userRole !== 'employee' || leadProjectIds.length > 0) && (
                            <Link href={route('tasks.create')} className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-normal hover:brightness-110 transition-all">
                                <FaPlus size={11} /> Create Task
                            </Link>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {tasks?.links && tasks.links.length > 3 && (
                    <div className="flex justify-center mt-2">
                        <div className="flex gap-1 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                            {tasks.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-normal transition-all ${link.active
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-400 hover:text-primary hover:bg-primary/5'
                                    } ${!link.url && 'opacity-40 cursor-not-allowed pointer-events-none'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <ConfirmationModal
                    show={confirmingDeletion}
                    title="Delete Task"
                    message="Are you sure you want to delete this task? This action cannot be undone."
                    onConfirm={confirmDeletion}
                    onClose={() => setConfirmingDeletion(false)}
                    type="danger"
                    processing={processing}
                />
            </div>
        </AuthenticatedLayout>
    );
}
