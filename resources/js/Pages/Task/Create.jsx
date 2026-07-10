import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { FaTasks, FaInfoCircle, FaUsers, FaProjectDiagram, FaCalendarAlt, FaClock, FaCheckCircle, FaArrowRight, FaTimesCircle } from 'react-icons/fa';

export default function Create({ projects, parentTasks, selectedProjectId, selectedParentId, branches, employees, settings }) {
    const { data, setData, post, processing, errors } = useForm({
        project_id: selectedProjectId || '',
        parent_id: selectedParentId || '',
        title: '',
        description: '',
        priority: settings?.default_priority || 'medium',
        due_date: '',
        estimated_hours: '',
        category: '',
        tags: [],
        is_recurring: false,
        recurrence_pattern: '',
        branch_id: '',
        assigned_employee_ids: [],
    });

    const filteredEmployees = employees.filter(emp => {
        if (data.project_id) {
            const project = projects.find(p => p.id == data.project_id);
            return project && emp.company_id == project.branch_id;
        }
        if (data.branch_id) return emp.company_id == data.branch_id;
        return true;
    });

    const [confirmingAction, setConfirmingAction] = useState({
        show: false, title: '', message: '', onConfirm: () => {}, type: 'warning'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!settings.mail_configured && data.assigned_employee_ids.length > 0) {
            setConfirmingAction({
                show: true,
                title: 'Mail Not Configured',
                message: 'Email settings are not configured. Assigned employees will not receive email notifications. Do you want to proceed anyway?',
                type: 'warning',
                onConfirm: () => {
                    setConfirmingAction(prev => ({ ...prev, show: false }));
                    post(route('tasks.store'));
                }
            });
            return;
        }
        post(route('tasks.store'));
    };

    const toggleEmployee = (id) => {
        const newIds = data.assigned_employee_ids.includes(id)
            ? data.assigned_employee_ids.filter(i => i !== id)
            : [...data.assigned_employee_ids, id];
        setData('assigned_employee_ids', newIds);
    };

    const inputClass = (field) =>
        `w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm transition-all outline-none ${
            errors[field] ? 'border-rose-400 focus:ring-1 focus:ring-rose-400' : 'border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary'
        }`;

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Create Task</h2>}>
            <Head title="Create Task" />

            <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-normal text-slate-900">New Task</h1>
                        <p className="text-sm text-slate-400 mt-0.5">Fill in the details below to create a new task.</p>
                    </div>
                    <Link
                        href={route('tasks.index')}
                        className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 text-sm font-normal transition-all flex items-center gap-2"
                    >
                        <FaTimesCircle size={12} /> Cancel
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Task Details */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                    <FaInfoCircle size={14} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-normal text-slate-800">Task Details</h3>
                                    <p className="text-xs text-slate-400">Fill in the title and description.</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-normal text-slate-600">Task Title <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    className={inputClass('title')}
                                    placeholder="Enter task title..."
                                    required
                                />
                                {errors.title && <p className="text-rose-500 text-xs mt-1">{errors.title}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-normal text-slate-600">Description</label>
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm transition-all outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[120px] resize-none"
                                    placeholder="Provide detailed instructions or context..."
                                />
                            </div>
                        </div>

                        {/* Team Assignment */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <FaUsers size={14} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-normal text-slate-800">Assign Employees</h3>
                                    <p className="text-xs text-slate-400">Select employees to assign to this task.</p>
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
                        {/* Project & Scope */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                                    <FaProjectDiagram size={12} />
                                </div>
                                <h3 className="text-sm font-normal text-slate-800">Project & Scope</h3>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-normal text-slate-600">Project</label>
                                <select
                                    value={data.project_id}
                                    onChange={e => {
                                        setData('project_id', e.target.value);
                                        setData('assigned_employee_ids', []);
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-all cursor-pointer"
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
                                        className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm outline-none transition-all cursor-pointer ${errors.branch_id ? 'border-rose-400' : 'border-slate-200 focus:border-primary'}`}
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
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-all cursor-pointer"
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
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-all cursor-pointer"
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
                                <>Save Task <FaArrowRight className="group-hover:translate-x-1 transition-transform" size={12} /></>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <ConfirmationModal
                show={confirmingAction.show}
                title={confirmingAction.title}
                message={confirmingAction.message}
                onConfirm={confirmingAction.onConfirm}
                onClose={() => setConfirmingAction(prev => ({ ...prev, show: false }))}
                type={confirmingAction.type}
            />
        </AuthenticatedLayout>
    );
}
