import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    FaArrowLeft, FaEdit, FaClipboardList, FaCheckCircle, FaUsers,
    FaClock, FaCalendarAlt, FaChevronRight, FaPlus, FaShieldAlt,
    FaBuilding, FaFire, FaUserTie
} from 'react-icons/fa';

export default function Show({ project, userRole = 'employee', projectMemberRole = null }) {
    const [activeTab, setActiveTab] = useState('overview');

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
    };

    const isLead = userRole === 'admin' || userRole === 'hr' || userRole === 'manager' || projectMemberRole === 'lead';

    const getStatusBadge = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'active') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        if (s === 'completed') return 'bg-primary/10 text-primary border-primary/20';
        if (s === 'on_hold') return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
        return 'bg-slate-100 text-slate-500 border-slate-200';
    };

    const getTaskDot = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'completed') return 'bg-emerald-500';
        if (s === 'in_progress') return 'bg-primary';
        if (s === 'cancelled') return 'bg-slate-300';
        return 'bg-amber-500';
    };

    const getPriorityColor = (priority) => {
        const p = priority?.toLowerCase() || '';
        if (p === 'critical' || p === 'high') return 'text-rose-500';
        if (p === 'medium') return 'text-amber-500';
        return 'text-slate-400';
    };

    const stats = {
        totalTasks: project.tasks?.length || 0,
        completedTasks: project.tasks?.filter(t => t.status === 'completed').length || 0,
        membersCount: project.members?.length || 0,
        daysRemaining: project.end_date
            ? Math.ceil((new Date(project.end_date) - new Date()) / (1000 * 60 * 60 * 24))
            : null
    };

    const completionPct = stats.totalTasks > 0
        ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
        : 0;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FaClipboardList },
        { id: 'tasks', label: 'Tasks', icon: FaCheckCircle, count: stats.totalTasks },
        { id: 'members', label: 'Members', icon: FaUsers, count: stats.membersCount },
    ];

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-normal text-slate-900 uppercase">Project Details</h2>}>
            <Head title={`Project - ${project.name}`} />

            <div className="p-4 space-y-4 bg-slate-50 min-h-screen">

                {/* Control Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Link
                            href={route('projects.index')}
                            className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={13} />
                        </Link>
                        <div>
                            <h2 className="text-base font-normal text-slate-900 uppercase leading-none">Project Details</h2>
                            <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mt-0.5 flex items-center gap-1.5">
                                <span className="w-1 h-1 bg-primary rounded-full animate-pulse"></span>
                                REF: PRJ-{project.id}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {isLead && (
                            <Link
                                href={route('projects.edit', project.id)}
                                className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-primary transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FaEdit size={10} /> Edit Project
                            </Link>
                        )}
                        <Link
                            href={route('projects.index')}
                            className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-normal uppercase hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            Back to List
                        </Link>
                    </div>
                </div>

                {/* Hero Banner */}
                <div className="bg-slate-900 rounded-lg p-5 text-white shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 text-white opacity-5 group-hover:scale-110 transition-transform">
                        <FaFire size={120} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-2xl font-normal text-white uppercase flex-shrink-0">
                                {project.name?.charAt(0)}
                            </div>
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded text-[8px] font-normal uppercase border bg-white/10 text-white border-white/10`}>
                                        {project.status?.toUpperCase() || 'DRAFT'}
                                    </span>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-normal tracking-normal leading-none uppercase">
                                    {project.name}
                                </h1>
                                <div className="flex flex-wrap gap-5">
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-normal text-white/50 uppercase">Branch</p>
                                        <p className="text-[11px] font-normal text-white uppercase flex items-center gap-1.5">
                                            <FaBuilding size={9} className="text-white" />
                                            {project.branch?.name || 'Main Branch'}
                                        </p>
                                    </div>
                                    {project.creator && (
                                        <div className="space-y-0.5">
                                            <p className="text-[8px] font-normal text-white/50 uppercase">Created By</p>
                                            <p className="text-[11px] font-normal text-white uppercase flex items-center gap-1.5">
                                                <FaUserTie size={9} className="text-white" />
                                                {project.creator?.name || 'N/A'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Progress ring */}
                        <div className="w-full md:w-48 bg-white/5 border border-white/10 rounded-lg p-3 backdrop-blur-sm flex-shrink-0">
                            <div className="flex justify-between items-baseline mb-2">
                                <p className="text-[9px] font-normal text-white uppercase">Completion</p>
                                <p className="text-xl font-normal text-white tracking-normal">{completionPct}%</p>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-1000"
                                    style={{ width: `${completionPct}%` }}
                                ></div>
                            </div>
                            <p className="text-[8px] font-normal text-white/50 uppercase mt-2">
                                {stats.completedTasks} of {stats.totalTasks} tasks done
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Tasks', value: stats.totalTasks, icon: FaClipboardList, color: 'text-primary', bg: 'bg-primary/10' },
                        { label: 'Completion', value: `${completionPct}%`, icon: FaCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                        { label: 'Team Members', value: stats.membersCount, icon: FaUsers, color: 'text-sky-600', bg: 'bg-sky-500/10' },
                        {
                            label: 'Days Remaining', icon: FaClock, color: 'text-amber-600', bg: 'bg-amber-500/10',
                            value: stats.daysRemaining !== null ? (stats.daysRemaining < 0 ? 'Overdue' : stats.daysRemaining) : '—'
                        },
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between group">
                            <div>
                                <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-1">{s.label}</p>
                                <p className={`text-2xl font-normal text-slate-900 tracking-normal ${s.value === 'Overdue' ? 'text-rose-500' : ''}`}>{s.value}</p>
                            </div>
                            <div className={`w-10 h-10 rounded-lg ${s.bg} ${s.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <s.icon size={16} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs + Content */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[420px]">
                    {/* Side tabs */}
                    <div className="w-full md:w-48 bg-slate-50/50 border-r border-slate-100 flex flex-row md:flex-col py-2 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 px-5 py-3 text-[9px] font-normal uppercase tracking-normal transition-all relative whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'text-primary bg-primary/5'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <tab.icon size={10} />
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span className={`ml-auto px-1.5 py-0.5 rounded text-[8px] font-normal ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                                        {tab.count}
                                    </span>
                                )}
                                {activeTab === tab.id && (
                                    <div className="absolute right-0 top-0 w-0.5 h-full bg-primary hidden md:block"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5">

                        {/* Overview */}
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fadeIn">
                                <div className="lg:col-span-2 space-y-4">
                                    {/* Description */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-normal text-slate-900 uppercase flex items-center gap-2">
                                            <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center"><FaClipboardList size={12} /></div>
                                            Description
                                        </h3>
                                        <p className="text-sm font-normal text-slate-600 leading-relaxed whitespace-pre-wrap">
                                            {project.description || 'No description provided for this project.'}
                                        </p>
                                    </div>

                                    {/* Recent Activity */}
                                    <div className="space-y-3 pt-2 border-t border-slate-50">
                                        <h3 className="text-sm font-normal text-slate-900 uppercase flex items-center gap-2">
                                            <div className="w-7 h-7 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center"><FaClock size={12} /></div>
                                            Recent Activity
                                        </h3>
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[11px] font-normal flex-shrink-0 overflow-hidden">
                                                {project.creator?.image
                                                    ? <img src={`/storage/${project.creator.image}`} alt="" className="w-full h-full object-cover" />
                                                    : (project.creator?.name?.charAt(0) || '?')
                                                }
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-normal text-slate-900 uppercase">Project was created</p>
                                                <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">
                                                    by {project.creator?.name || 'System'} · {formatDate(project.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline Sidebar */}
                                <div className="space-y-3">
                                    <div className="bg-slate-900 p-4 rounded-lg space-y-4">
                                        <h4 className="text-[10px] font-normal text-white uppercase tracking-normal">Timeline</h4>
                                        {[
                                            { label: 'Start Date', value: formatDate(project.start_date), icon: FaCalendarAlt, color: 'text-primary' },
                                            { label: 'End Date', value: formatDate(project.end_date), icon: FaCalendarAlt, color: 'text-rose-400' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <item.icon size={12} className={item.color} />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-normal text-white/50 uppercase">{item.label}</p>
                                                    <p className="text-[10px] font-normal text-white uppercase">{item.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {stats.daysRemaining !== null && (
                                            <div className={`mt-2 pt-3 border-t border-white/10 text-center`}>
                                                <p className="text-[8px] font-normal text-white/50 uppercase">Days Remaining</p>
                                                <p className={`text-2xl font-normal ${stats.daysRemaining < 0 ? 'text-rose-400' : 'text-primary'} tracking-normal`}>
                                                    {stats.daysRemaining < 0 ? 'OVERDUE' : stats.daysRemaining}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tasks */}
                        {activeTab === 'tasks' && (
                            <div className="space-y-3 animate-fadeIn">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-normal text-slate-900 uppercase flex items-center gap-2">
                                        <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center"><FaCheckCircle size={12} /></div>
                                        Tasks
                                        <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[9px] font-normal">{stats.totalTasks}</span>
                                    </h3>
                                    {isLead && (
                                        <Link
                                            href={route('tasks.create', { project_id: project.id })}
                                            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-normal uppercase hover:bg-primary transition-all active:scale-95 flex items-center gap-2"
                                        >
                                            <FaPlus size={9} /> Add Task
                                        </Link>
                                    )}
                                </div>

                                <div className="divide-y divide-slate-50">
                                    {project.tasks?.map(task => (
                                        <Link
                                            key={task.id}
                                            href={route('tasks.show', task.id)}
                                            className="flex items-center justify-between py-3 px-2 hover:bg-slate-50 transition-colors group rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getTaskDot(task.status)}`}></div>
                                                <div>
                                                    <p className="text-[11px] font-normal text-slate-900 uppercase group-hover:text-primary transition-colors">{task.title}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[8px] font-normal uppercase ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                                        <span className="text-slate-200">·</span>
                                                        <span className="text-[8px] font-normal text-slate-400 uppercase">Due: {formatDate(task.due_date)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {/* Assignee avatars */}
                                                <div className="flex -space-x-1">
                                                    {task.assignments?.slice(0, 3).map(assign => (
                                                        <div
                                                            key={assign.id}
                                                            className="w-6 h-6 rounded-lg border border-white bg-primary/10 text-primary text-[8px] font-normal flex items-center justify-center overflow-hidden"
                                                            title={assign.employee?.name}
                                                        >
                                                            {assign.employee?.employee_image
                                                                ? <img src={`/storage/${assign.employee.employee_image}`} alt="" className="w-full h-full object-cover" />
                                                                : assign.employee?.name?.charAt(0)
                                                            }
                                                        </div>
                                                    ))}
                                                </div>
                                                <FaChevronRight size={9} className="text-slate-300 group-hover:text-primary transition-colors" />
                                            </div>
                                        </Link>
                                    ))}
                                    {(!project.tasks || project.tasks.length === 0) && (
                                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                                            <div className="w-12 h-12 bg-slate-50 text-slate-200 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-100">
                                                <FaClipboardList size={20} />
                                            </div>
                                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">No tasks found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Members */}
                        {activeTab === 'members' && (
                            <div className="space-y-3 animate-fadeIn">
                                <h3 className="text-sm font-normal text-slate-900 uppercase flex items-center gap-2">
                                    <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center"><FaUsers size={12} /></div>
                                    Team Members
                                    <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[9px] font-normal">{stats.membersCount}</span>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {project.members?.map(member => (
                                        <div
                                            key={member.id}
                                            className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-primary/20 hover:shadow-sm transition-all group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[12px] font-normal uppercase flex-shrink-0 overflow-hidden group-hover:bg-primary transition-colors">
                                                {member.employee?.employee_image
                                                    ? <img src={`/storage/${member.employee.employee_image}`} alt="" className="w-full h-full object-cover" />
                                                    : member.employee?.name?.charAt(0)
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-normal text-slate-900 uppercase truncate">{member.employee?.name}</p>
                                                <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">{member.employee?.designation || 'Team Member'}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-normal uppercase tracking-normal border ${
                                                member.role === 'lead'
                                                    ? 'bg-primary/10 text-primary border-primary/20'
                                                    : 'bg-slate-50 text-slate-400 border-slate-100'
                                            }`}>
                                                {member.role}
                                            </span>
                                        </div>
                                    ))}
                                    {(!project.members || project.members.length === 0) && (
                                        <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
                                            <div className="w-12 h-12 bg-slate-50 text-slate-200 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-100">
                                                <FaUsers size={20} />
                                            </div>
                                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">No members assigned</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer note */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex gap-3">
                    <FaShieldAlt className="text-primary shrink-0 mt-0.5" size={13} />
                    <p className="text-[9px] font-normal text-slate-500 uppercase leading-relaxed">
                        Project data is stored securely. Only authorized team members can view or edit this project.
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
