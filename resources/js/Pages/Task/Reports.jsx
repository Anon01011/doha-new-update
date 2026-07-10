import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    FiPieChart,
    FiTrendingUp,
    FiUsers,
    FiClock,
    FiActivity,
    FiCheckCircle,
    FiAlertCircle,
    FiLoader,
    FiCalendar
} from 'react-icons/fi';

export default function Reports({ statusDistribution, projects, timePerEmployee, recentLogs }) {
    const formatDateTime = (date) => date ? new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'N/A';

    const formatDuration = (minutes) => {
        if (!minutes) return '0m';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const getStatusColor = (status) => {
        const colors = {
            'completed': 'bg-emerald-50 text-emerald-600 border-emerald-100',
            'in_progress': 'bg-blue-50 text-blue-600 border-blue-100',
            'pending': 'bg-amber-50 text-amber-600 border-amber-100',
            'on_hold': 'bg-rose-50 text-rose-600 border-rose-100',
            'cancelled': 'bg-slate-50 text-slate-600 border-slate-100',
            'blocked': 'bg-red-50 text-red-600 border-red-100'
        };
        return colors[status] || 'bg-indigo-50 text-indigo-600 border-indigo-100';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <FiCheckCircle />;
            case 'in_progress': return <FiActivity />;
            case 'blocked': return <FiAlertCircle />;
            default: return <FiLoader />;
        }
    };

    const formatStatus = (s) => {
        if (!s) return 'Pending';
        return s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Task Reports</h2>}>
            <Head title="Task Reports" />

            <div className="p-4 space-y-6 bg-slate-50 min-h-screen">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statusDistribution.map((stat) => (
                        <div key={stat.status} className="p-5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-normal uppercase text-slate-400 tracking-normal">{formatStatus(stat.status)}</span>
                                <div className={`p-2 rounded-lg bg-slate-50 text-lg ${getStatusColor(stat.status).split(' ')[1]}`}>
                                    {getStatusIcon(stat.status)}
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-normal text-slate-900 leading-none">{stat.count}</span>
                                <span className="text-xs font-normal text-slate-400 uppercase tracking-normal">Tasks</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Project Progress */}
                    <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-base font-normal text-slate-900">Project Performance</h3>
                                <p className="text-sm text-slate-500 mt-1">Completion progress for active projects</p>
                            </div>
                            <Link href={route('projects.index')} className="text-xs font-normal text-primary uppercase tracking-normal hover:underline flex items-center gap-1">
                                View All Projects <FiTrendingUp size={12} />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                            {projects.map((project) => (
                                <div key={project.id} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-normal text-slate-700 truncate max-w-[70%]">{project.name}</h4>
                                        <span className="text-xs font-normal text-slate-400">
                                            {project.completed_tasks_count} / {project.tasks_count} tasks
                                        </span>
                                    </div>
                                    <div className="relative w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 bg-primary h-full transition-all duration-700 rounded-full"
                                            style={{ width: `${project.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Performers */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-base font-normal text-slate-900">Top Contributors</h3>
                                <p className="text-sm text-slate-500 mt-1">Based on logged hours</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <FiUsers size={18} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {timePerEmployee.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center text-xs font-normal shadow-sm shrink-0">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-normal text-slate-800 truncate max-w-[120px]">{item.employee_name}</p>
                                            <p className="text-[10px] text-slate-400 font-normal uppercase tracking-normal">Employee</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-sm font-normal text-slate-900">{item.total_hours}h</span>
                                        <span className="text-[10px] text-slate-400 font-normal uppercase tracking-normal">Logged</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Activity Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-base font-normal text-slate-900">Recent Time Logs</h3>
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                            <FiClock size={16} />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Employee</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Task</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Duration</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-right">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-all group">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-normal text-slate-700">{log.assignment?.employee?.name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={route('tasks.show', log.assignment?.task?.id)} className="text-sm font-normal text-primary hover:underline transition-all group-hover:translate-x-1 inline-flex items-center gap-1">
                                                {log.assignment?.task?.title}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-3 py-1 rounded-lg text-xs font-normal bg-slate-100 text-slate-600 border border-slate-200">
                                                {formatDuration(log.duration_minutes)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xs font-normal text-slate-400">{formatDateTime(log.start_time)}</span>
                                        </td>
                                    </tr>
                                ))}
                                {recentLogs.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200 border border-slate-100 shadow-inner">
                                                    <FiActivity size={24} />
                                                </div>
                                                <p className="text-slate-400 text-sm font-normal">No recent time logs detected.</p>
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
