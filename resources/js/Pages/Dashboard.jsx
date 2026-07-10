import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Avatar from '@/Components/Avatar';
import {
    FiUsers, FiBriefcase, FiCalendar, FiClock, FiDollarSign, FiActivity,
    FiLayers, FiAlertCircle, FiSettings, FiMove, FiEye, FiEyeOff,
    FiCheck, FiX, FiRefreshCcw, FiTrendingUp, FiArrowRight, FiMoreHorizontal,
    FiDownload, FiFilter, FiSearch, FiBell, FiMenu, FiFileText, FiSun, FiPieChart,
    FiCreditCard, FiTarget
} from 'react-icons/fi';


// --- Reusable UI Primitives ---

const Card = ({ children, className = '', title, subtitle, action, padded = true, icon: Icon, accentColor = 'indigo' }) => {
    const accents = {
        indigo: 'bg-indigo-50 text-indigo-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        rose: 'bg-rose-50 text-rose-700',
        amber: 'bg-amber-50 text-amber-700',
        blue: 'bg-blue-50 text-blue-700',
        purple: 'bg-purple-50 text-purple-700',
    };

    const accentStyle = accents[accentColor] || accents.indigo;

    return (
        <div className={`bg-white rounded-lg shadow-md border border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col h-full overflow-hidden group ${className}`}>
            {(title || action) && (
                <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${accentStyle} group-hover:scale-110 transition-transform duration-300`}>
                                <Icon className="w-4 h-4" />
                            </div>
                        )}
                        <div>
                            {title && <h3 className="text-base font-semibold text-slate-900 tracking-normal">{title}</h3>}
                            {subtitle && <p className="text-xs font-normal text-slate-500 uppercase tracking-normal">{subtitle}</p>}
                        </div>
                    </div>
                    {action}
                </div>
            )}
            <div className={`flex-1 ${padded ? 'p-5' : ''} relative`}>
                {children}
            </div>
        </div>
    );
};

const Badge = ({ children, variant = 'slate', className = '' }) => {
    const variants = {
        slate: 'bg-slate-100 text-slate-600 ring-slate-200',
        emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        blue: 'bg-blue-50 text-blue-700 ring-blue-200',
        amber: 'bg-amber-50 text-amber-700 ring-amber-200',
        rose: 'bg-rose-50 text-rose-700 ring-rose-200',
        indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
        violet: 'bg-violet-50 text-violet-700 ring-violet-200',
    };
    return (
        <span className={`px-2.5 py-1 rounded-md text-xs font-normal ring-1 ring-inset inline-flex items-center gap-1.5 shadow-sm ${variants[variant] || variants.slate} ${className}`}>
            {children}
        </span>
    );
};

const StatCard = ({ label, value, subValue, icon: Icon, color = 'blue', trend, href }) => {
    const styles = {
        blue: { from: 'from-blue-500', to: 'to-blue-600', shadow: 'shadow-blue-200', text: 'text-blue-600', bg: 'bg-blue-50' },
        emerald: { from: 'from-emerald-500', to: 'to-emerald-600', shadow: 'shadow-emerald-200', text: 'text-emerald-600', bg: 'bg-emerald-50' },
        violet: { from: 'from-violet-500', to: 'to-violet-600', shadow: 'shadow-violet-200', text: 'text-violet-600', bg: 'bg-violet-50' },
        amber: { from: 'from-amber-500', to: 'to-amber-600', shadow: 'shadow-amber-200', text: 'text-amber-600', bg: 'bg-amber-50' },
        rose: { from: 'from-rose-500', to: 'to-rose-600', shadow: 'shadow-rose-200', text: 'text-rose-600', bg: 'bg-rose-50' },
        indigo: { from: 'from-indigo-500', to: 'to-indigo-600', shadow: 'shadow-indigo-200', text: 'text-indigo-600', bg: 'bg-indigo-50' },
    };

    const style = styles[color] || styles.blue;

    return (
        <Link href={href} className={`relative bg-white rounded-lg p-4 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col justify-between overflow-hidden group h-full`}>
            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${style.from} ${style.to} flex items-center justify-center text-white shadow-lg ${style.shadow} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-4 h-4" />
                </div>
                {trend && (
                    <span className="text-[10px] font-normal text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        {trend}
                    </span>
                )}
            </div>
            <div className="relative z-10">
                <h4 className="text-3xl font-semibold text-slate-900 tracking-normal group-hover:translate-x-1 transition-transform">{value}</h4>
                <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs font-normal text-slate-500 uppercase tracking-normal">{label}</span>
                    {subValue && <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>{subValue}</span>}
                </div>
            </div>

            {/* Decorative Background */}
            <div className={`absolute -right-6 -bottom-6 w-32 h-32 bg-gradient-to-br ${style.from} ${style.to} rounded-full opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500`}></div>
        </Link>
    );
};

// --- Dashboard Widgets ---

const WelcomeHeader = ({ user, workingNow, onBreak }) => {
    const time = new Date().getHours();
    const greeting = time < 12 ? 'Good Morning' : time < 18 ? 'Good Afternoon' : 'Good Evening';
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="relative overflow-hidden rounded-lg bg-indigo-950 shadow-2xl shadow-slate-200 mb-8 text-white min-h-[180px] flex items-center" style={{ backgroundColor: 'var(--primary-color)' }}>
            {/* Advanced Background Gradients */}
            <div className="absolute inset-0 opacity-40 bg-gradient-to-r from-black/20 via-white/5 to-black/20"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3"></div>

            <div className="relative z-10 w-full p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md text-xs font-normal text-slate-300 mb-3">
                        <FiCalendar className="w-3.5 h-3.5 text-white" />
                        {date}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-normal tracking-normal mb-2">
                        {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-blue-200">{user.name}</span>
                    </h1>
                    <p className="text-white/60 font-normal max-w-lg text-sm leading-relaxed">
                        Here's your daily overview.
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="relative group px-6 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-lg border border-white/10 transition-all overflow-hidden flex-1 md:flex-none min-w-[140px]">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/20 rounded-full blur-xl -mr-4 -mt-4 transition-opacity opacity-50 group-hover:opacity-80"></div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
                            <span className="text-xs font-normal text-emerald-200 uppercase tracking-normal">Active</span>
                        </div>
                        <span className="text-3xl font-normal text-white">{workingNow}</span>
                    </div>
                    <div className="relative group px-6 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-lg border border-white/10 transition-all overflow-hidden flex-1 md:flex-none min-w-[140px]">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/20 rounded-full blur-xl -mr-4 -mt-4 transition-opacity opacity-50 group-hover:opacity-80"></div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
                            <span className="text-xs font-normal text-amber-200 uppercase tracking-normal">Break</span>
                        </div>
                        <span className="text-3xl font-normal text-white">{onBreak}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const QuickActionGrid = () => (
    <Card title="Quick Actions" subtitle="Shortcuts" padded={false} icon={FiTarget} accentColor="indigo">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y md:divide-y-0 divide-slate-100 border-b border-slate-100">
            {[
                { label: 'Add Employee', icon: FiUsers, route: 'employees.create', style: 'text-white bg-blue-600 shadow-blue-200' },
                { label: 'New Leave', icon: FiClock, route: 'leave-requests.create', style: 'text-white bg-amber-600 shadow-amber-200' },
                { label: 'Post Salary', icon: FiDollarSign, route: 'salary-postings.create', style: 'text-white bg-emerald-600 shadow-emerald-200' },
                { label: 'Create Task', icon: FiActivity, route: 'tasks.create', style: 'text-white bg-violet-600 shadow-violet-200' },
                { label: 'Training', icon: FiLayers, route: 'trainings.create', style: 'text-white bg-cyan-600 shadow-cyan-200' },
                { label: 'Grievance', icon: FiAlertCircle, route: 'grievances.create', style: 'text-white bg-rose-600 shadow-rose-200' },
            ].map((action, i) => (
                <Link
                    key={i}
                    href={route(action.route)}
                    className="group relative p-4 flex flex-col items-center justify-center gap-3 transition-colors h-28"
                >
                    <div className={`p-3 rounded-lg ${action.style} group-hover:scale-110 transition-transform duration-300 shadow-sm ring-1 ring-inset ring-black/5`}>
                        <action.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-normal text-slate-500 group-hover:text-slate-800 uppercase tracking-normal text-center leading-tight transition-colors">
                        {action.label}
                    </span>
                </Link>
            ))}
        </div>
        <div className="p-3 bg-slate-50 flex justify-center border-t border-slate-100/50">
            <button className="text-xs font-normal text-slate-400 hover:text-indigo-600 uppercase tracking-normal flex items-center gap-1 transition-colors">
                <FiSettings className="w-3 h-3" /> Customize Shortcuts
            </button>
        </div>
    </Card>
);

const TrendChart = ({ trends }) => (
    <Card title="Attendance" subtitle="Weekly Trend" action={<Link href={route('reports.attendance')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><FiArrowRight className="w-4 h-4 text-slate-400 hover:text-indigo-600" /></Link>} icon={FiTrendingUp} accentColor="emerald">
        <div className="flex items-end justify-between gap-2 h-48 mt-2 px-2">
            {trends.map((t, i) => {
                const max = Math.max(...trends.map(x => x.count), 1);
                const height = max > 0 ? (t.count / max) * 100 : 0;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-default">
                        <div className="w-full bg-slate-100 rounded-lg relative flex-1 flex items-end group-hover:bg-slate-200 transition-colors overflow-hidden ring-1 ring-slate-200">
                            <div
                                className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 group-hover:from-emerald-600 group-hover:to-teal-500 rounded-lg transition-all duration-500 relative shadow-lg shadow-emerald-200"
                                style={{ height: `${height}%` }}
                            >
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-normal">
                                    {t.count}
                                </div>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs font-semibold text-slate-500 uppercase group-hover:text-emerald-600 transition-colors">
                                {new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </Card>
);

const DepartmentChart = ({ stats }) => (
    <Card title="Distribution" subtitle="By Dept" icon={FiPieChart} accentColor="violet" action={<Link href={route('employees.index')}><FiArrowRight className="text-slate-400 hover:text-indigo-600" /></Link>}>
        <div className="space-y-4 pt-2">
            {stats.length > 0 ? stats.map((dept, i) => {
                const max = Math.max(...stats.map(s => s.employees_count), 1);
                const width = max > 0 ? (dept.employees_count / max) * 100 : 0;
                return (
                    <div key={i} className="group">
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-semibold text-slate-900">{dept.name}</span>
                            <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-xs">{dept.employees_count}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full group-hover:from-violet-600 group-hover:to-indigo-600 transition-all duration-500"
                                style={{ width: `${width}%` }}
                            ></div>
                        </div>
                    </div>
                );
            }) : <div className="text-center text-xs text-slate-400 py-10">No department data</div>}
        </div>
    </Card>
);

const ExpiringDocsWidget = ({ docs }) => (
    <Card title="Expiring Docs" subtitle="Alerts" icon={FiFileText} accentColor="rose" action={<Link href={route('employees.index')} className="text-rose-600 text-xs font-normal uppercase hover:bg-rose-50 px-2 py-1 rounded transition-colors">Manage</Link>}>
        <div className="space-y-3">
            {docs.length > 0 ? docs.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-100 shadow-sm hover:border-rose-200 hover:shadow-md transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shrink-0 border border-rose-700 group-hover:brightness-110 transition-all shadow-md">
                        <FiAlertCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-normal text-slate-800 truncate">{doc.document_name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{doc.employee?.name}</div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-[10px] font-normal text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">{new Date(doc.expiry_date).toLocaleDateString()}</div>
                    </div>
                </div>
            )) : <div className="text-center text-xs text-slate-400 py-10 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">No expiring documents</div>}
        </div>
    </Card>
);

const LiveAttendanceTable = ({ data, total }) => (
    <Card
        title="Live Feed"
        subtitle="Real-time"
        action={<Badge variant="emerald" className="animate-pulse shadow-emerald-100">{total} Online</Badge>}
        padded={false}
        icon={FiActivity}
        accentColor="emerald"
        className="overflow-hidden"
    >
        <div className="overflow-y-auto max-h-[350px] scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/90 sticky top-0 z-10 backdrop-blur-sm border-b border-slate-200">
                    <tr>
                        <th className="px-5 py-3 text-[10px] font-normal text-slate-500 uppercase tracking-normal">Employee</th>
                        <th className="px-5 py-3 text-[10px] font-normal text-slate-500 uppercase tracking-normal">Time</th>
                        <th className="px-5 py-3 text-[10px] font-normal text-slate-500 uppercase tracking-normal text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.length > 0 ? data.map(att => (
                        <tr key={att.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        src={att.employee?.employee_image || att.employee?.user?.image}
                                        name={att.employee?.name}
                                        size="sm"
                                        className="shadow-md shadow-indigo-100"
                                    />
                                    <div>
                                        <div className="text-xs font-semibold text-slate-900">{att.employee?.name}</div>
                                        <div className="text-[10px] text-slate-500 font-normal">{att.employee?.designation}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-5 py-3">
                                <span className="text-[10px] font-normal text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{att.from_time}</span>
                            </td>
                            <td className="px-5 py-3 text-right">
                                <Badge variant={att.current_break_start ? 'amber' : 'emerald'}>
                                    {att.current_break_start ? 'Break' : 'Working'}
                                </Badge>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan="3" className="p-10 text-center text-xs text-slate-400">No active check-ins.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </Card>
);

const SimplifiedList = ({ items, renderItem, emptyText = "No data" }) => (
    <div className="space-y-3">
        {items.length > 0 ? items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:shadow-md bg-white transition-all group cursor-default">
                {renderItem(item)}
            </div>
        )) : (
            <div className="text-center py-8 text-xs text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                {emptyText}
            </div>
        )}
    </div>
);

const HolidaysWidget = ({ holidays }) => (
    <Card title="Holidays" subtitle="Upcoming" icon={FiSun} accentColor="amber" action={<Link href={route('holidays.index')}><FiArrowRight className="text-slate-400 hover:text-indigo-600" /></Link>}>
        <div className="space-y-3 relative py-2">
            <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-200/0 via-slate-200 to-slate-200/0"></div>

            {holidays.length > 0 ? holidays.map((h, i) => {
                const startDate = new Date(h.start_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                const endDate = new Date(h.end_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                const dateDisplay = h.start_date === h.end_date ? startDate : `${startDate} - ${endDate}`;
                
                return (
                    <div key={i} className="relative flex items-center gap-3 pl-2 group">
                        <div className="w-3 h-3 rounded-full bg-slate-200 ring-4 ring-white relative z-10 group-hover:bg-indigo-500 transition-colors"></div>
                        <div className="flex-1 p-3 rounded-lg bg-white border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
                            <div className="text-xs font-semibold text-slate-900">{h.name}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <FiCalendar className="w-3 h-3 text-slate-500" />
                                <span className="text-[10px] font-normal text-slate-600">{dateDisplay}</span>
                            </div>
                        </div>
                    </div>
                );
            }) : <div className="text-center text-xs text-slate-400 py-10">No upcoming holidays</div>}
        </div>
    </Card>
);

// --- Customization Drawer ---

const CustomizationDrawer = ({ isOpen, onClose, layout, onUpdateLayout, onReset, isSaving }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-80 bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="font-normal text-slate-800">Customize View</h2>
                        <p className="text-xs text-slate-400 mt-0.5 uppercase tracking-normal">Drag to reorder</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><FiX className="text-slate-500" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/30">
                    {layout.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm transition-all group cursor-grab active:cursor-grabbing">
                            <div className="flex items-center gap-3">
                                <div className="text-slate-300 group-hover:text-indigo-400"><FiMove /></div>
                                <span className="text-xs font-normal text-slate-700">{item.label}</span>
                            </div>
                            <button
                                onClick={() => onUpdateLayout(layout.map(i => i.id === item.id ? { ...i, visible: !i.visible } : i))}
                                className={`p-1.5 rounded-lg transition-colors ${item.visible ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
                            >
                                {item.visible ? <FiEye className="w-3.5 h-3.5" /> : <FiEyeOff className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-slate-100 bg-white space-y-3">
                    <button onClick={onReset} className="w-full py-3 text-xs font-normal text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors uppercase tracking-normal">
                        Reset Default
                    </button>
                    <button
                        disabled={isSaving}
                        onClick={onClose}
                        className="w-full py-3 text-xs font-normal text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-lg shadow-slate-200 disabled:opacity-50 uppercase tracking-normal transition-all hover:translate-y-px"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---

const DEFAULT_LAYOUT = [
    { id: 'stats_main', visible: true, colSpan: 3, label: 'Stats: Primary' },
    { id: 'stats_secondary', visible: true, colSpan: 3, label: 'Stats: Secondary' },
    { id: 'quick_actions', visible: true, colSpan: 3, label: 'Quick Operations' },
    { id: 'live_attendance', visible: true, colSpan: 2, label: 'Live Attendance' },
    { id: 'attendance_trends', visible: true, colSpan: 1, label: 'Attendance Chart' },
    { id: 'expiring_docs', visible: true, colSpan: 1, label: 'Expiring Docs' },
    { id: 'department_stats', visible: true, colSpan: 1, label: 'Dept. Distribution' },
    { id: 'upcoming_holidays', visible: true, colSpan: 1, label: 'Upcoming Holidays' },
    { id: 'recent_employees', visible: true, colSpan: 1, label: 'List: Employees' },
    { id: 'recent_leave', visible: true, colSpan: 1, label: 'List: Leave' },
    { id: 'recent_tasks', visible: true, colSpan: 1, label: 'List: Tasks' },
    { id: 'recent_grievances', visible: true, colSpan: 1, label: 'List: Grievances' },
    { id: 'recent_salary', visible: true, colSpan: 1, label: 'List: Salary' },
    { id: 'recent_shifts', visible: true, colSpan: 1, label: 'List: Shifts' },
    { id: 'top_performers', visible: true, colSpan: 1, label: 'Top Performers' },
];

export default function Dashboard(props) {
    const { auth, appSettings } = usePage().props;
    const currency = appSettings?.currency || 'QAR';

    // Merge props layout with default layout
    const initialLayout = props.dashboardSettings || DEFAULT_LAYOUT;
    const mergedLayout = DEFAULT_LAYOUT.map(defItem => {
        const existing = initialLayout.find(i => i.id === defItem.id);
        return existing || defItem;
    });

    const [layout, setLayout] = useState(mergedLayout);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [draggedId, setDraggedId] = useState(null);

    const updateLayout = async (newLayout) => {
        setLayout(newLayout);
        setIsSaving(true);
        try { await axios.post(route('dashboard.settings.update'), { settings: newLayout }); }
        finally { setIsSaving(false); }
    };

    const renderWidget = (id) => {
        switch (id) {
            case 'stats_main':
                return (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 h-full">
                        <StatCard label="Total Staff" value={props.totalEmployees} icon={FiUsers} trend="Active" color="blue" href={route('employees.index')} />
                        <StatCard label="Branches" value={props.totalCompanies} icon={FiBriefcase} trend="Locations" color="violet" href={route('companies.index')} />
                        <StatCard label="Attendance" value={props.totalAttendances} icon={FiCalendar} trend="Today" color="emerald" href={route('employee-attendances.index')} />
                        <StatCard label="Leave Req." value={props.totalLeaveRequests} subValue={`${props.pendingLeaveRequests} Pending`} icon={FiClock} trend={props.pendingLeaveRequests > 0 ? 'Action' : 'Clear'} color="amber" href={route('leave-requests.index')} />
                        <StatCard label="Payroll" value={props.currentMonthSalary} subValue="Processed" icon={FiDollarSign} trend="This Month" color="rose" href={route('salary-postings.index')} />
                    </div>
                );
            case 'stats_secondary':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[
                            { label: 'Loans', value: props.totalLoans, route: 'loans.index', color: 'text-indigo-600', border: 'hover:border-indigo-300', icon: FiCreditCard },
                            { label: 'Advances', value: props.totalAdvances, route: 'advances.index', color: 'text-teal-600', border: 'hover:border-teal-300', icon: FiDollarSign },
                            { label: 'Trainings', value: props.totalTrainings, route: 'trainings.index', color: 'text-cyan-600', border: 'hover:border-cyan-300', icon: FiLayers },
                            { label: 'Tasks', value: props.totalTasks, route: 'tasks.index', color: 'text-orange-600', border: 'hover:border-orange-300', icon: FiActivity },
                            { label: 'Grievances', value: props.totalGrievances, route: 'grievances.index', color: 'text-red-600', border: 'hover:border-red-300', icon: FiAlertCircle },
                            { label: 'Rosters', value: props.totalShifts, route: 'shift-rosters.index', color: 'text-emerald-600', border: 'hover:border-emerald-300', icon: FiCalendar },
                        ].map((stat, i) => (
                            <Link key={i} href={route(stat.route)} className={`px-4 py-4 bg-white rounded-lg border border-slate-100 ${stat.border} transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col justify-center group relative overflow-hidden`}>
                                <div className="absolute right-0 top-0 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 translate-x-1 -translate-y-1">
                                    <stat.icon className="w-16 h-16" />
                                </div>
                                <span className={`text-2xl font-normal ${stat.color} relative z-10`}>{stat.value}</span>
                                <span className="text-[10px] uppercase font-normal text-slate-400 group-hover:text-slate-600 transition-colors relative z-10">{stat.label}</span>
                            </Link>
                        ))}
                    </div>
                );
            case 'quick_actions': return <QuickActionGrid />;
            case 'live_attendance': return <LiveAttendanceTable data={props.currentlyWorking} total={props.workingNowCount} />;
            case 'attendance_trends': return <TrendChart trends={props.attendanceTrends} />;
            case 'expiring_docs': return <ExpiringDocsWidget docs={props.expiringDocuments || []} />;
            case 'upcoming_holidays': return <HolidaysWidget holidays={props.upcomingHolidays || []} />;
            case 'department_stats': return <DepartmentChart stats={props.departmentStats || []} />;
            case 'recent_employees': return (
                <Card title="New Joiners" subtitle="Latest" action={<Link href={route('employees.index')}><FiArrowRight className="text-slate-400 hover:text-indigo-600" /></Link>} icon={FiUsers} accentColor="blue">
                    <SimplifiedList items={props.recentEmployees} renderItem={e => (
                        <>
                            <div>
                                <div className="text-xs font-normal text-slate-800">{e.name}</div>
                                <div className="text-xs text-slate-400">{e.designation}</div>
                            </div>
                            <Badge variant="blue">New</Badge>
                        </>
                    )} />
                </Card>
            );
            case 'recent_leave': return (
                <Card title="Leave Requests" subtitle="Pending" action={<Link href={route('leave-requests.index')}><FiArrowRight className="text-slate-400 hover:text-indigo-600" /></Link>} icon={FiClock} accentColor="amber">
                    <SimplifiedList items={props.recentLeaveRequests} renderItem={l => (
                        <>
                            <div>
                                <div className="text-xs font-normal text-slate-800">{l.employee?.name}</div>
                                <div className="text-xs text-slate-400">{l.leave_type?.name}</div>
                            </div>
                            <Badge variant={l.status === 'approved' ? 'emerald' : l.status === 'pending' ? 'amber' : 'rose'}>{l.status}</Badge>
                        </>
                    )} />
                </Card>
            );
            case 'recent_tasks': return (
                <Card title="Tasks" subtitle="Latest" action={<Link href={route('tasks.index')}><FiArrowRight className="text-slate-400 hover:text-indigo-600" /></Link>} icon={FiActivity} accentColor="violet">
                    <SimplifiedList items={props.recentTasks} renderItem={t => (
                        <>
                            <div className="truncate max-w-[150px]">
                                <div className="text-xs font-normal text-slate-800 truncate">{t.title}</div>
                            </div>
                            <Badge variant={t.priority === 'high' ? 'rose' : 'blue'}>{t.priority}</Badge>
                        </>
                    )} />
                </Card>
            );
            case 'recent_salary': return (
                <Card title="Payroll" subtitle="Recent" action={<Link href={route('salary-postings.index')}><FiArrowRight className="text-slate-400 hover:text-indigo-600" /></Link>} icon={FiDollarSign} accentColor="emerald">
                    <SimplifiedList items={props.recentSalaryPostings} renderItem={s => (
                        <>
                            <div>
                                <div className="text-xs font-normal text-slate-800">{s.employee?.name}</div>
                                <div className="text-xs text-slate-400">{s.month}/{s.year}</div>
                            </div>
                            <div className="font-mono text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">{currency} {s.net_salary.toLocaleString()}</div>
                        </>
                    )} />
                </Card>
            );
            case 'recent_shifts': return (
                <Card title="Rosters" subtitle="Upcoming" action={<Link href={route('shift-rosters.index')}><FiArrowRight className="text-slate-400 hover:text-indigo-600" /></Link>} icon={FiCalendar} accentColor="indigo">
                    <SimplifiedList items={props.recentShifts} renderItem={s => (
                        <>
                            <div>
                                <div className="text-xs font-normal text-slate-800">{s.employee?.name}</div>
                                <div className="text-[10px] text-slate-400">{s.day}</div>
                            </div>
                            <div className="text-xs font-normal bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">{s.shift_time}</div>
                        </>
                    )} />
                </Card>
            );
            case 'recent_grievances': return (
                <Card title="Grievances" subtitle="Reports" action={<Link href={route('grievances.index')}><FiArrowRight className="text-slate-400 hover:text-indigo-600" /></Link>} icon={FiAlertCircle} accentColor="rose">
                    <SimplifiedList items={props.recentGrievances} renderItem={g => (
                        <>
                            <div className="truncate max-w-[150px]">
                                <div className="text-xs font-normal text-slate-800 truncate">{g.subject}</div>
                            </div>
                            <Badge variant="rose">{g.status}</Badge>
                        </>
                    )} />
                </Card>
            );
            case 'top_performers': return (
                <Card title="Top Performers" subtitle="Best Scores" action={<Link href={route('evaluations.index')}><FiArrowRight className="text-slate-400 hover:text-indigo-600" /></Link>} icon={FiTarget} accentColor="indigo">
                    <SimplifiedList items={props.topPerformers || []} renderItem={e => (
                        <>
                            <div className="flex items-center gap-3">
                                <Avatar src={e.employee?.employee_image || e.employee?.user?.image} name={e.employee?.name} size="xs" />
                                <div>
                                    <div className="text-xs font-normal text-slate-800">{e.employee?.name}</div>
                                    <div className="text-[10px] text-slate-400">{e.employee?.designation}</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="text-xs font-normal text-indigo-600">{e.overall_score}%</div>
                                <div className="text-[8px] font-normal text-slate-400 uppercase tracking-normal">Efficiency</div>
                            </div>
                        </>
                    )} />
                </Card>
            );
            default: return null;
        }
    };

    const activeLayout = layout.filter(i => i.visible);

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-normal text-slate-800 tracking-normal text-nowrap">Dashboard</h2>
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="p-2 bg-white text-slate-500 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-all transform hover:scale-105 active:scale-95"
                    title="Dashboard Settings"
                >
                    <FiSettings className="w-5 h-5" />
                </button>
            </div>
        }>
            <Head title="Dashboard" />

            <div className="w-full max-w-[1700px] mx-auto p-4 md:p-6 min-h-screen bg-slate-50/50">
                <WelcomeHeader user={auth.user} workingNow={props.workingNowCount} onBreak={props.onBreakCount} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
                    {activeLayout.map((item) => (
                        <div
                            key={item.id}
                            draggable
                            onDragStart={() => setDraggedId(item.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                                if (draggedId === item.id) return;
                                const newLayout = [...layout];
                                const dIdx = newLayout.findIndex(i => i.id === draggedId);
                                const tIdx = newLayout.findIndex(i => i.id === item.id);
                                const [rm] = newLayout.splice(dIdx, 1);
                                newLayout.splice(tIdx, 0, rm);
                                updateLayout(newLayout);
                                setDraggedId(null);
                            }}
                            className={`transition-all duration-300 ${draggedId === item.id ? 'opacity-30 scale-95' : ''} ${item.colSpan === 3 ? 'lg:col-span-3' : item.colSpan === 2 ? 'lg:col-span-2' : 'lg:col-span-1'
                                }`}
                        >
                            {renderWidget(item.id)}
                        </div>
                    ))}
                </div>
            </div>

            <CustomizationDrawer
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                layout={layout}
                onUpdateLayout={updateLayout}
                onReset={() => {
                    updateLayout(DEFAULT_LAYOUT);
                    setIsMenuOpen(false);
                }}
                isSaving={isSaving}
            />
        </AuthenticatedLayout>
    );
}
