import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { FaInfoCircle, FaUsers, FaProjectDiagram, FaCalendarAlt, FaClock, FaCheckCircle, FaArrowRight, FaTimesCircle, FaEye, FaList, FaLock, FaUnlock } from 'react-icons/fa';

export default function Edit({ task, projects, parentTasks, branches, employees }) {
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dateString.split('T')[0];
    };

    const { data, setData, put, processing, errors } = useForm({
        project_id:           task.project_id || '',
        parent_id:            task.parent_id || '',
        title:                task.title || '',
        description:          task.description || '',
        priority:             task.priority || 'medium',
        status:               task.status || 'pending',
        due_date:             formatDate(task.due_date),
        estimated_hours:      task.estimated_hours || '',
        category:             task.category || '',
        tags:                 task.tags || [],
        is_recurring:         task.is_recurring || false,
        recurrence_pattern:   task.recurrence_pattern || '',
        is_blocked:           task.is_blocked || false,
        blocked_reason:       task.blocked_reason || '',
        branch_id:            task.branch_id || '',
        assigned_employee_ids: task.assignments?.map(a => a.employee_id) || [],
    });

    const filteredEmployees = employees.filter(emp => {
        if (data.project_id) {
            const project = projects.find(p => p.id == data.project_id);
            return project && emp.company_id == project.branch_id;
        }
        if (data.branch_id) return emp.company_id == data.branch_id;
        return true;
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('tasks.update', task.id));
    };

    const toggleEmployee = (id) => {
        const newIds = data.assigned_employee_ids.includes(id)
            ? data.assigned_employee_ids.filter(i => i !== id)
            : [...data.assigned_employee_ids, id];
        setData('assigned_employee_ids', newIds);
    };

    const selectClass = (field) =>
        `w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm outline-none transition-all cursor-pointer ${
            errors[field] ? 'border-rose-400' : 'border-slate-200 focus:border-primary'
        }`;

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Edit Task</h2>}>
            <Head title={`Edit Task - ${task.title}`} />

            <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-normal text-slate-900">Edit Task</h1>
                        <p className="text-sm text-slate-400 mt-0.5">Editing: {task.title}</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('tasks.show', task.id)} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-primary hover:bg-primary/5 text-sm font-normal transition-all flex items-center gap-2">
                            <FaEye size={12} /> View
                        </Link>
                        <Link href={route('tasks.index')} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 text-sm font-normal transition-all flex items-center gap-2">
                            <FaList size={12} /> Cancel
                        </Link>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Task Details */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                    <FaInfoCircle size={14} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-normal text-slate-800">Task Details</h3>
                                    <p className="text-xs text-slate-400">Update the title and description.</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-normal text-slate-600">Task Title <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm transition-all outline-none ${errors.title ? 'border-rose-400' : 'border-slate-200 focus:border-primary'}`}
                                    required
                                />
                                {errors.title && <p className="text-rose-500 text-xs mt-1">{errors.title}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-normal text-slate-600">Description</label>
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm transition-all outline-none focus:border-primary min-h-[120px] resize-none"
                                    placeholder="Describe the task in detail..."
                                />
                            </div>
                        </div>

                        {/* Assigned Employees */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <FaUsers size={14} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-normal text-slate-800">Assigned Employees</h3>
                                    <p className="text-xs text-slate-400">Select or update the assigned employees.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {filteredEmployees.map(emp => (
                                    <button
                                        key={emp.id}
                                        type="button"
                                        onClick={() => toggleEmployee(emp.id)}
                                        className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left ${
                                            data.assigned_employee_ids.includes(emp.id)
                                                ? 'bg-emerald-50 border-emerald-200'
                                                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-normal overflow-hidden shrink-0 ${
                                            data.assigned_employee_ids.includes(emp.id)
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-white text-slate-500 border border-slate-200'
                                        }`}>
                                            {emp.employee_image
                                                ? <img src={`/storage/${emp.employee_image}`} alt={emp.name} className="w-full h-full object-cover" />
                                                : emp.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-normal truncate ${data.assigned_employee_ids.includes(emp.id) ? 'text-emerald-800' : 'text-slate-700'}`}>{emp.name}</p>
                                            <p className="text-xs text-slate-400 truncate">{emp.designation || 'Employee'}</p>
                                        </div>
                                        {data.assigned_employee_ids.includes(emp.id) && (
                                            <FaCheckCircle className="text-emerald-600 shrink-0" size={12} />
                                        )}
                                    </button>
                                ))}
                                {filteredEmployees.length === 0 && (
                                    <div className="col-span-full py-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                        <p className="text-sm text-slate-400">No employees found. Select a project or branch first.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Status & Scope */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                                    <FaProjectDiagram size={12} />
                                </div>
                                <h3 className="text-sm font-normal text-slate-800">Status & Scope</h3>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-normal text-slate-600">Status <span className="text-rose-500">*</span></label>
                                <select
                                    value={data.status}
                                    onChange={e => setData('status', e.target.value)}
                                    className={selectClass('status')}
                                    required
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-normal text-slate-600">Project</label>
                                <select
                                    value={data.project_id}
                                    onChange={e => {
                                        setData('project_id', e.target.value);
                                        setData('assigned_employee_ids', []);
                                    }}
                                    className={selectClass('project_id')}
                                >
                                    <option value="">No project (standalone task)</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {!data.project_id && (
                                <div className="space-y-1">
                                    <label className="block text-sm font-normal text-slate-600">Branch <span className="text-rose-500">*</span></label>
                                    <select
                                        value={data.branch_id}
                                        onChange={e => {
                                            setData('branch_id', e.target.value);
                                            setData('assigned_employee_ids', []);
                                        }}
                                        className={selectClass('branch_id')}
                                        required={!data.project_id}
                                    >
                                        <option value="">Select branch...</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                    {errors.branch_id && <p className="text-rose-500 text-xs mt-1">{errors.branch_id}</p>}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="block text-sm font-normal text-slate-600">Parent Task</label>
                                <select
                                    value={data.parent_id}
                                    onChange={e => setData('parent_id', e.target.value)}
                                    className={selectClass('parent_id')}
                                >
                                    <option value="">No parent (top-level task)</option>
                                    {parentTasks.map(t => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Priority & Deadline */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <FaCalendarAlt size={12} />
                                </div>
                                <h3 className="text-sm font-normal text-slate-800">Priority & Deadline</h3>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-normal text-slate-600">Priority <span className="text-rose-500">*</span></label>
                                <select
                                    value={data.priority}
                                    onChange={e => setData('priority', e.target.value)}
                                    className={selectClass('priority')}
                                    required
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-normal text-slate-600">Due Date <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                    <input
                                        type="date"
                                        value={data.due_date}
                                        onChange={e => setData('due_date', e.target.value)}
                                        className={`w-full bg-slate-50 border rounded-lg pl-9 pr-3 py-2 text-sm transition-all outline-none ${errors.due_date ? 'border-rose-400' : 'border-slate-200 focus:border-primary'}`}
                                        required
                                    />
                                </div>
                                {errors.due_date && <p className="text-rose-500 text-xs mt-1">{errors.due_date}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-normal text-slate-600">Estimated Hours</label>
                                <div className="relative">
                                    <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={data.estimated_hours}
                                        onChange={e => setData('estimated_hours', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-all"
                                        placeholder="e.g. 4"
                                    />
                                </div>
                            </div>

                            {/* Blocked toggle */}
                            <div className={`p-3 rounded-lg border transition-all ${data.is_blocked ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${data.is_blocked ? 'bg-rose-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                            {data.is_blocked ? <FaLock size={10} /> : <FaUnlock size={10} />}
                                        </div>
                                        <h4 className="text-sm font-normal text-slate-700">Mark as Blocked</h4>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setData('is_blocked', !data.is_blocked)}
                                        className={`w-8 h-4 rounded-full transition-all relative ${data.is_blocked ? 'bg-rose-600' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${data.is_blocked ? 'left-4' : 'left-0.5'}`} />
                                    </button>
                                </div>
                                {data.is_blocked && (
                                    <input
                                        type="text"
                                        value={data.blocked_reason}
                                        onChange={e => setData('blocked_reason', e.target.value)}
                                        className="w-full bg-white border border-rose-200 rounded-lg px-3 py-2 text-sm transition-all outline-none"
                                        placeholder="Reason this task is blocked..."
                                    />
                                )}
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-normal hover:bg-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
                        >
                            {processing ? (
                                <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Saving...</>
                            ) : (
                                <>Save Changes <FaArrowRight className="group-hover:translate-x-1 transition-transform" size={12} /></>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
