import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';

export default function Edit({ project, branches, employees, settings }) {
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dateString.split('T')[0];
    };

    const { data, setData, put, processing, errors } = useForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'active',
        visibility: project.visibility || 'public',
        budget: project.budget || '',
        priority: project.priority || 'medium',
        category: project.category || '',
        tags: project.tags || [],
        start_date: formatDate(project.start_date),
        end_date: formatDate(project.end_date),
        branch_id: project.branch_id || '',
        members: project.members?.map(m => ({ employee_id: m.employee_id, role: m.role })) || [],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('projects.update', project.id));
    };

    const addMember = () => {
        setData('members', [...data.members, { employee_id: '', role: 'member' }]);
    };

    const removeMember = (index) => {
        const newMembers = [...data.members];
        newMembers.splice(index, 1);
        setData('members', newMembers);
    };

    const updateMember = (index, field, value) => {
        const newMembers = [...data.members];
        newMembers[index][field] = value;
        setData('members', newMembers);
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-gray-800">Edit Project</h2>}>
            <Head title={`Edit ${project.name}`} />
            <div className="max-w mx-auto p-4 lg:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        {/* Left Column: Basic Info & Members */}
                        <div className="xl:col-span-8 space-y-6">
                            {/* General Info Card */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-5">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-100/50">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <h3 className="text-base font-normal text-slate-900">General Information</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal mb-1.5">Project Name *</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className={`w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm font-normal focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all ${errors.name ? 'border-rose-500' : 'border-slate-200'}`}
                                            placeholder="e.g. Website Redesign 2024"
                                            required
                                        />
                                        {errors.name && <p className="text-rose-500 text-[10px] mt-1 font-normal">{errors.name}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal mb-1.5">Description</label>
                                        <textarea
                                            value={data.description}
                                            onChange={e => setData('description', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                            rows="4"
                                            placeholder="Describe the project goals and scope..."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Team Members Card */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-5">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </div>
                                        <h3 className="text-base font-normal text-slate-900">Team Members</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addMember}
                                        className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-normal uppercase tracking-normal hover:bg-indigo-100 transition-all border border-indigo-100 flex items-center gap-2"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        Add Member
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {data.members.map((member, index) => (
                                        <div key={index} className="flex flex-col md:flex-row items-center gap-3 p-3 bg-slate-50/50 rounded-lg border border-slate-100 hover:border-indigo-100 transition-all group">
                                            <div className="flex-1 w-full">
                                                <select
                                                    value={member.employee_id}
                                                    onChange={e => updateMember(index, 'employee_id', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                                    required
                                                >
                                                    <option value="">Select Employee...</option>
                                                    {employees
                                                        .filter(emp => !data.branch_id || emp.company_id == data.branch_id)
                                                        .map(emp => (
                                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                                        ))}
                                                </select>
                                            </div>
                                            <div className="w-full md:w-40">
                                                <select
                                                    value={member.role}
                                                    onChange={e => updateMember(index, 'role', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                                    required
                                                >
                                                    <option value="lead">Project Lead</option>
                                                    <option value="member">Member</option>
                                                    <option value="viewer">Viewer</option>
                                                </select>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeMember(index)}
                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                    {data.members.length === 0 && (
                                        <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-lg">
                                            <p className="text-slate-400 font-normal text-xs uppercase tracking-normal">No team members added yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Settings & Timeline */}
                        <div className="xl:col-span-4 space-y-6">
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-5">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-100/50">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                    </div>
                                    <h3 className="text-base font-normal text-slate-900">Project Settings</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal mb-1.5">Visibility</label>
                                            <select
                                                value={data.visibility}
                                                onChange={e => setData('visibility', e.target.value)}
                                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                                            >
                                                <option value="public">Public</option>
                                                <option value="private">Private</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal mb-1.5">Priority</label>
                                            <select
                                                value={data.priority}
                                                onChange={e => setData('priority', e.target.value)}
                                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </div>
                                    </div>

                                    {settings?.budget_tracking && (
                                        <div>
                                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal mb-1.5">Budget</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-slate-400 font-normal text-sm">$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={data.budget}
                                                    onChange={e => setData('budget', e.target.value)}
                                                    className="w-full pl-7 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-normal focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal mb-1.5">Branch</label>
                                        <select
                                            value={data.branch_id}
                                            onChange={e => setData('branch_id', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                                        >
                                            <option value="">Select Branch</option>
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal mb-1.5">Status</label>
                                        <select
                                            value={data.status}
                                            onChange={e => setData('status', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                                        >
                                            <option value="active">Active</option>
                                            <option value="on_hold">On Hold</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100">
                                        <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal mb-2">Category & Tags</label>
                                        <input
                                            type="text"
                                            value={data.category}
                                            onChange={e => setData('category', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all mb-3"
                                            placeholder="Category (e.g. Development)"
                                        />

                                        <div className="space-y-2">
                                            <div className="flex flex-wrap gap-2">
                                                {data.tags && data.tags.map((tag, i) => (
                                                    <span key={i} className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-xs font-normal border border-indigo-100 flex items-center gap-1">
                                                        {tag}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.preventDefault(); const newTags = [...data.tags]; newTags.splice(i, 1); setData('tags', newTags); }}
                                                            className="hover:text-indigo-800"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (e.target.value.trim()) {
                                                            setData('tags', [...(data.tags || []), e.target.value.trim()]);
                                                            e.target.value = '';
                                                        }
                                                    }
                                                }}
                                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                                placeholder="Type tag & hit Enter..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-5">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-100/50">
                                    <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                    <h3 className="text-base font-normal text-slate-900">Timeline</h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal mb-1.5">Start Date</label>
                                        <input
                                            type="date"
                                            value={data.start_date}
                                            onChange={e => setData('start_date', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-normal focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal mb-1.5">Target End Date</label>
                                        <input
                                            type="date"
                                            value={data.end_date}
                                            onChange={e => setData('end_date', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-normal focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-normal uppercase tracking-normal hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                                >
                                    {processing && <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                    Save Changes
                                </button>
                                <Link
                                    href={route('projects.index')}
                                    className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-lg font-normal hover:bg-slate-50 transition-all text-sm"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
