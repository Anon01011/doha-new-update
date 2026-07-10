import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import React from 'react';
import {
    FiCalendar, FiClock, FiCheckCircle, FiMinusCircle,
    FiTrendingUp, FiArrowRight, FiBriefcase, FiAlertTriangle,
    FiFileText, FiPieChart, FiDollarSign, FiCamera, FiTarget
} from 'react-icons/fi';
import Avatar from '@/Components/Avatar';
import { useRef, useState } from 'react';
import { router } from '@inertiajs/react';

// Primitive Components for high-fidelity UI
const StatCard = ({ title, value, subtitle, icon: Icon, color, sparkline }) => (
    <div className={`relative overflow-hidden bg-white rounded-lg p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group`}>
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-${color}-500/10 to-transparent rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110`} />

        <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 bg-${color}-50 text-${color}-600 rounded-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                </div>
                {sparkline && (
                    <div className="flex items-end gap-1 h-8">
                        {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                            <div
                                key={i}
                                className={`w-1 rounded-full bg-${color}-200 transition-all duration-500 group-hover:bg-${color}-500`}
                                style={{ height: `${h}%` }}
                            />
                        ))}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-4xl font-normal text-slate-800 tracking-normal mb-1">{value}</h3>
                <p className="text-[11px] font-normal text-slate-400 uppercase tracking-normal leading-none mb-1">{title}</p>
                <p className="text-xs text-slate-500 font-normal">{subtitle}</p>
            </div>
        </div>
    </div>
);

const SectionHeader = ({ title, icon: Icon, action }) => (
    <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Icon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-normal text-slate-800 tracking-normal">{title}</h2>
        </div>
        {action}
    </div>
);

export default function Dashboard({
    employee,
    totalAttendance,
    thisMonthAttendance,
    recentAttendance,
    attendanceSummary,
    totalLeaveRequests,
    pendingLeaveRequests,
    approvedLeaveRequests,
    recentLeaveRequests,
    leaveBalances,
    totalSalaryPostings,
    currentMonthSalary,
    recentSalaryPostings,
    totalTasks,
    pendingTasks,
    inProgressTasks,
    recentTasks,
    totalTrainings,
    upcomingTrainings,
    recentTrainings,
    totalGrievances,
    openGrievances,
    recentGrievances,
    totalLoans,
    activeLoans,
    totalAdvances,
    pendingAdvances,
    thisWeekShifts,
    weekStart,
    weekEnd,
    warningLetters = [],
    myEvaluations = [],
    todayHoliday
}) {
    const fileInput = useRef();
    const [isUploading, setIsUploading] = useState(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('image', file);

            router.post(route('employee.dashboard.update-photo'), formData, {
                forceFormData: true,
                onFinish: () => setIsUploading(false),
            });
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'QAR', // Standard for this project based on earlier context
        }).format(amount || 0);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Employee Dashboard" />

            <div className="w-full p-4 lg:p-8 space-y-8 bg-slate-50/50 min-h-screen">
                {/* Holiday Banner */}
                {todayHoliday && (
                    <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-lg p-6 text-white flex items-center justify-between">
                        <div className="absolute inset-0 bg-white/10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-50"></div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <FiCalendar className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-normal tracking-normal mb-1">Today is a Holiday! 🎉</h2>
                                <p className="text-amber-50 font-normal">{todayHoliday.name}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Welcome Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-violet-900 rounded-[2.5rem] shadow-2xl shadow-indigo-200 p-8 lg:p-12 text-white">
                    {/* Abstract Decorative Shapes */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl -ml-32 -mb-32 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                        <div className="flex flex-col md:flex-row gap-8 items-center lg:items-start">
                            <div className="relative group shrink-0">
                                <Avatar
                                    src={employee.employee_image}
                                    name={employee.name}
                                    size="2xl"
                                    className="ring-4 ring-white/20 shadow-2xl"
                                />
                                <button
                                    onClick={() => fileInput.current.click()}
                                    className="absolute bottom-0 right-0 p-2.5 bg-white text-indigo-900 rounded-lg shadow-lg group-hover:scale-110 transition-transform active:scale-95"
                                    title="Update Photo"
                                    disabled={isUploading}
                                >
                                    <FiCamera className={`w-4 h-4 ${isUploading ? 'animate-spin' : ''}`} />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInput}
                                    className="hidden"
                                    onChange={handleImageChange}
                                    accept="image/*"
                                />
                            </div>

                            <div className="text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 font-normal text-sm tracking-normal">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Identity Verified Online
                                </div>
                                <h1 className="text-3xl lg:text-5xl font-normal mb-4 tracking-normal leading-tight">
                                    Welcome back,<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-100 to-white italic">{employee.name}!</span> 👋
                                </h1>
                                <p className="text-sm lg:text-lg text-indigo-100 font-normal opacity-80 leading-relaxed max-w-sm">
                                    You're doing a great job! Here's a quick look at your attendance and work status.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { label: 'Present', val: attendanceSummary?.present || 0, icon: FiCheckCircle, color: 'emerald' },
                                { label: 'Leave', val: attendanceSummary?.leave_days || 0, icon: FiCalendar, color: 'blue' },
                                { label: 'OT Hours', val: `${attendanceSummary?.total_ot_hours || 0}h`, icon: FiTrendingUp, color: 'amber' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/10 backdrop-blur-xl p-5 rounded-lg border border-white/15 flex flex-col justify-center items-center text-center group hover:bg-white/20 transition-all cursor-default">
                                    <stat.icon className={`w-6 h-6 mb-3 text-${stat.color}-300 group-hover:scale-110 transition-transform`} />
                                    <div className="text-2xl font-normal tracking-normal">{stat.val}</div>
                                    <div className="text-[10px] font-normal uppercase tracking-[0.2em] opacity-60 mt-1">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Records"
                        value={thisMonthAttendance}
                        subtitle="This month attendance"
                        icon={FiClock}
                        color="indigo"
                        sparkline={true}
                    />
                    <StatCard
                        title="Net Payable"
                        value={currentMonthSalary?.net_salary ? formatCurrency(currentMonthSalary.net_salary) : formatCurrency(0)}
                        subtitle="Last salary posting"
                        icon={FiDollarSign}
                        color="emerald"
                        sparkline={false}
                    />
                    <StatCard
                        title="Active Tasks"
                        value={pendingTasks}
                        subtitle={`Assignments: ${totalTasks}`}
                        icon={FiBriefcase}
                        color="orange"
                        sparkline={true}
                    />
                    <StatCard
                        title="Leave"
                        value={approvedLeaveRequests}
                        subtitle="Approved requests"
                        icon={FiCalendar}
                        color="pink"
                        sparkline={false}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Roster & Attendance */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Weekly Shift Roster */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-8 pb-4">
                                <SectionHeader
                                    title="Weekly Shift Roster"
                                    icon={FiClock}
                                    action={<span className="text-xs font-normal text-slate-400 uppercase tracking-normal">{weekStart} — {weekEnd}</span>}
                                />
                            </div>
                            <div className="px-8 pb-8">
                                {thisWeekShifts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                        <div className="p-4 bg-white rounded-lg shadow-sm mb-4">
                                            <FiCalendar className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 font-normal">No shifts assigned for this week.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                            const shift = thisWeekShifts.find(s => s.day === day);
                                            return (
                                                <div
                                                    key={day}
                                                    className={`p-5 rounded-lg border transition-all duration-300 ${shift
                                                        ? 'bg-indigo-50/50 border-indigo-100 ring-4 ring-indigo-500/0 hover:ring-indigo-500/5'
                                                        : 'bg-slate-50 border-slate-100 opacity-60'
                                                        }`}
                                                >
                                                    <div className="text-[11px] font-normal text-slate-400 uppercase tracking-normal mb-3">{day}</div>
                                                    {shift ? (
                                                        <div className="space-y-1">
                                                            <div className="text-lg font-normal text-indigo-900 leading-none">{shift.shift_time}</div>
                                                            <div className="inline-block px-2 py-0.5 rounded-full bg-indigo-100 text-[10px] font-normal text-indigo-700 uppercase tracking-normal">{shift.shift_type}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-slate-400 font-normal italic">Off Day</div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Attendance */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-8 pb-4">
                                <SectionHeader
                                    title="Recent Attendance"
                                    icon={FiCheckCircle}
                                    action={
                                        <Link
                                            href={route('employee-attendances.index')}
                                            className="text-xs font-normal text-indigo-600 hover:text-indigo-800 uppercase tracking-normal flex items-center gap-1 group"
                                        >
                                            View History <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    }
                                />
                            </div>
                            <div className="px-8 pb-8 overflow-x-auto">
                                <table className="w-full text-left border-separate border-spacing-y-2">
                                    <thead>
                                        <tr className="text-[11px] font-normal text-slate-400 uppercase tracking-normal">
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-center">In/Out</th>
                                            <th className="px-6 py-3 text-center">Work</th>
                                            <th className="px-6 py-3 text-right">OT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentAttendance.map((att, idx) => (
                                            <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 bg-slate-50 group-hover:bg-white border-y border-l border-slate-100 rounded-l-2xl text-sm font-normal text-slate-700">
                                                    {new Date(att.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 bg-slate-50 group-hover:bg-white border-y border-slate-100">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-normal uppercase tracking-normal ${att.attendance === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                                                        att.attendance === 'Absent' ? 'bg-red-100 text-red-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${att.attendance === 'Present' ? 'bg-emerald-500' :
                                                            att.attendance === 'Absent' ? 'bg-red-500' :
                                                                'bg-amber-500'
                                                            }`} />
                                                        {att.attendance}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 bg-slate-50 group-hover:bg-white border-y border-slate-100 text-sm text-slate-500 font-normal text-center">
                                                    {att.from_time && att.to_time ? (
                                                        <span className="inline-flex items-center gap-2">
                                                            {att.from_time} <FiArrowRight className="text-slate-300 w-3 h-3" /> {att.to_time}
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-6 py-4 bg-slate-50 group-hover:bg-white border-y border-slate-100 text-sm text-slate-900 font-normal text-center">
                                                    {att.hours_worked || 0}h
                                                </td>
                                                <td className="px-6 py-4 bg-slate-50 group-hover:bg-white border-y border-r border-slate-100 rounded-r-2xl text-sm text-indigo-600 font-normal text-right">
                                                    +{att.ot || 0}h
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Warnings, Leaves & Slips */}
                    <div className="space-y-8">
                        {/* My Evaluations */}
                        {myEvaluations && myEvaluations.length > 0 && (
                            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
                                <SectionHeader
                                    title="My Evaluations"
                                    icon={FiTarget}
                                    action={
                                        <Link
                                            href={route('evaluations.index')}
                                            className="text-xs font-normal text-indigo-600 hover:text-indigo-800 uppercase tracking-normal flex items-center gap-1 group"
                                        >
                                            View All <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    }
                                />
                                <div className="space-y-4">
                                    {myEvaluations.map((evalItem, idx) => (
                                        <div key={idx} className="p-4 bg-slate-50 hover:bg-white hover:shadow-md transition-all rounded-lg border border-slate-100 group">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-normal uppercase tracking-normal text-slate-400">
                                                    {new Date(evalItem.year, evalItem.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                                </span>
                                                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-normal">
                                                    {evalItem.overall_score}%
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Avatar src={evalItem.evaluator?.image} name={evalItem.evaluator?.name} size="xs" />
                                                <div className="text-xs text-slate-500">
                                                    Evaluated by <span className="font-normal text-slate-700">{evalItem.evaluator?.name}</span>
                                                </div>
                                            </div>
                                            {evalItem.comments && (
                                                <p className="mt-2 text-xs text-slate-500 italic line-clamp-2">"{evalItem.comments}"</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Warning Letters */}
                        {warningLetters && warningLetters.length > 0 && (
                            <div className="relative overflow-hidden bg-rose-600 rounded-[2rem] p-8 text-white shadow-xl shadow-rose-200">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                                <h2 className="text-xl font-normal mb-6 flex items-center gap-2 relative z-10">
                                    <FiAlertTriangle className="w-6 h-6" />
                                    Active Warnings
                                    <Link
                                        href={route('warning-letters.index')}
                                        className="ml-auto text-[10px] font-normal uppercase tracking-normal text-white/60 hover:text-white transition-colors flex items-center gap-1"
                                    >
                                        View All <FiArrowRight className="w-3 h-3" />
                                    </Link>
                                </h2>
                                <div className="space-y-4 relative z-10">
                                    {warningLetters.map((letter, idx) => (
                                        <div key={idx} className="p-4 bg-white/15 backdrop-blur-md rounded-lg border border-white/20 hover:bg-white/25 transition-colors cursor-default">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-normal uppercase tracking-[0.2em] opacity-80">{letter.type}</span>
                                                <span className="text-[10px] font-normal opacity-60 italic">{new Date(letter.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <h4 className="font-normal text-sm mb-1 line-clamp-1">{letter.subject}</h4>
                                            <p className="text-xs opacity-70 line-clamp-2 leading-relaxed font-normal">{letter.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Leave Balances */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
                            <SectionHeader title="Leave Balances" icon={FiPieChart} />
                            <div className="space-y-6">
                                {leaveBalances.map((balance, idx) => {
                                    const percentage = (balance.remaining_days / balance.total_days) * 100;
                                    return (
                                        <div key={idx} className="space-y-2.5">
                                            <div className="flex justify-between items-end">
                                                <span className="text-sm font-normal text-slate-700">{balance.leave_type?.name}</span>
                                                <span className="text-xs font-normal text-slate-400 uppercase tracking-normal">
                                                    <span className="text-indigo-600">{balance.remaining_days}</span> / {balance.total_days} Days
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-50">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${percentage > 50 ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' :
                                                        percentage > 20 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                                                            'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                                                        }`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {leaveBalances.length === 0 && (
                                    <p className="text-sm text-slate-400 font-normal italic text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">No leave balances found.</p>
                                )}
                            </div>
                            <Link
                                href={route('leave-requests.create')}
                                className="mt-8 w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-lg font-normal text-sm tracking-normal hover:bg-primary transition-all duration-300 hover:shadow-xl hover:shadow-indigo-200 group"
                            >
                                <FiCalendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Request Time Off
                            </Link>
                        </div>

                        {/* Recent Salary Slips */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
                            <SectionHeader title="Salary Slips" icon={FiFileText} />
                            <div className="space-y-4">
                                {recentSalaryPostings.map((salary, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-lg hover:shadow-slate-200/40 transition-all group">
                                        <div>
                                            <div className="text-sm font-normal text-slate-800">
                                                {new Date(salary.year, salary.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                            </div>
                                            <div className="text-xs font-normal text-indigo-600 mt-0.5">{formatCurrency(salary.net_salary)}</div>
                                        </div>
                                        <Link
                                            href={route('salary-postings.slip', salary.id)}
                                            className="p-3 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all shadow-sm border border-slate-100 group-hover:border-indigo-100 group-hover:scale-110"
                                            title="View Details"
                                        >
                                            <FiArrowRight className="w-5 h-5" />
                                        </Link>
                                    </div>
                                ))}
                                {recentSalaryPostings.length === 0 && (
                                    <p className="text-sm text-slate-400 font-normal italic text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">No salary records.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
