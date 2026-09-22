import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import React, { useRef, useState } from 'react';
import {
    FiCalendar, FiClock, FiCheckCircle, FiMinusCircle,
    FiTrendingUp, FiArrowRight, FiBriefcase, FiAlertTriangle,
    FiFileText, FiPieChart, FiDollarSign, FiCamera, FiTarget,
    FiAward, FiBarChart2, FiStar, FiThumbsUp, FiFlag, FiLayers,
    FiPlus, FiUserMinus, FiCheckSquare, FiExternalLink, FiShield
} from 'react-icons/fi';
import Avatar from '@/Components/Avatar';

// Compact Metric Card
const StatCard = ({ title, value, subtitle, icon: Icon, color = 'rose', trend }) => {
    const colorStyles = {
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
    };

    const style = colorStyles[color] || colorStyles.rose;

    return (
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-xs border border-slate-200/80 hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">{title}</span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border shrink-0 ${style}`}>
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
            </div>
            <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">{value}</div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">{subtitle}</div>
            </div>
        </div>
    );
};

const SectionCard = ({ title, icon: Icon, action, children, className = '' }) => (
    <div className={`bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden ${className}`}>
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white via-slate-50/40 to-white">
            <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
                    <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-900">{title}</h3>
            </div>
            {action}
        </div>
        <div className="p-5">{children}</div>
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
    thisWeekShifts = [],
    weekStart,
    weekEnd,
    warningLetters = [],
    myEvaluations = [],
    totalEvaluations = 0,
    pendingAckEvaluations = 0,
    latestScore = null,
    totalExpenses = 0,
    pendingExpenses = 0,
    totalClaimedAmount = 0,
    totalReimbursedAmount = 0,
    recentExpenses = [],
    todayHoliday,
    activeOffboarding = null
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
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const evalStatusConfig = {
        draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600' },
        pending_self: { label: 'Self Assessment', color: 'bg-amber-100 text-amber-700' },
        pending_manager: { label: 'Manager Review', color: 'bg-blue-100 text-blue-700' },
        pending_acknowledgment: { label: 'Sign-Off Needed', color: 'bg-purple-100 text-purple-700' },
        approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700' },
        closed: { label: 'Closed', color: 'bg-slate-200 text-slate-700' },
    };

    const offboardingStatusConfig = {
        pending_approval: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500 animate-pulse' },
        approved: { label: 'Approved (Notice Active)', color: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
        in_progress: { label: 'Clearance In Progress', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500 animate-pulse' },
        clearance_pending: { label: 'Department Clearance', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500' },
        exit_interview_pending: { label: 'Exit Interview Pending', color: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500 animate-pulse' },
        settlement_pending: { label: 'Final Settlement Pending', color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
        completed: { label: 'Separation Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
        rejected: { label: 'Separation Rejected', color: 'bg-rose-100 text-rose-800 border-rose-200', dot: 'bg-rose-500' },
        cancelled: { label: 'Separation Cancelled', color: 'bg-slate-100 text-slate-800 border-slate-200', dot: 'bg-slate-400' },
    };

    const getEvalStatus = (status) => evalStatusConfig[status] || { label: status, color: 'bg-slate-100 text-slate-600' };
    const getOffboardingStatus = (status) => offboardingStatusConfig[status] || { label: status?.replace('_', ' ') || 'In Progress', color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' };

    const scoreColor = (score) => {
        if (score >= 80) return 'text-emerald-600';
        if (score >= 60) return 'text-blue-600';
        if (score >= 40) return 'text-amber-600';
        return 'text-rose-600';
    };

    const scoreBarColor = (score) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-blue-500';
        if (score >= 40) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    return (
        <AuthenticatedLayout>
            <Head title="Employee Dashboard" />

            <div className="w-full p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 bg-slate-50/60 min-h-screen">

                {/* Holiday Alert */}
                {todayHoliday && (
                    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-xl p-3.5 sm:p-4 text-white flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg shrink-0">
                                <FiCalendar className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h4 className="text-xs sm:text-sm font-semibold">Today is a Company Holiday: {todayHoliday.name} 🎉</h4>
                                <p className="text-[11px] sm:text-xs text-amber-100">Standard operating shifts are adjusted accordingly.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Compact & Clean Profile Header */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="relative group shrink-0">
                                <Avatar
                                    src={employee.employee_image}
                                    name={employee.name}
                                    size="lg"
                                    className="ring-2 ring-rose-200 shadow-sm"
                                />
                                <button
                                    onClick={() => fileInput.current.click()}
                                    className="absolute -bottom-1 -right-1 p-1.5 bg-slate-900 text-white rounded-full shadow-md hover:bg-rose-600 transition-colors"
                                    title="Update Photo"
                                    disabled={isUploading}
                                >
                                    <FiCamera className={`w-3 h-3 ${isUploading ? 'animate-spin' : ''}`} />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInput}
                                    className="hidden"
                                    onChange={handleImageChange}
                                    accept="image/*"
                                />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h1 className="text-lg sm:text-xl font-bold text-slate-900">{employee.name}</h1>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                        {employee.employee_code}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                                    <span className="font-medium text-slate-700">{employee.designation || 'Company Staff'}</span>
                                    {employee.department?.name && (
                                        <>
                                            <span>•</span>
                                            <span>{employee.department.name}</span>
                                        </>
                                    )}
                                    {employee.company?.name && (
                                        <>
                                            <span>•</span>
                                            <span className="text-slate-400">{employee.company.name}</span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Punch / Month Quick Metrics */}
                        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                            <div className="px-3 py-1.5 text-center">
                                <div className="text-base sm:text-lg font-bold text-emerald-600">{attendanceSummary?.present || 0}</div>
                                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Present</div>
                            </div>
                            <div className="px-3 py-1.5 text-center border-x border-slate-200/80">
                                <div className="text-base sm:text-lg font-bold text-rose-500">{attendanceSummary?.leave_days || 0}</div>
                                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Leaves</div>
                            </div>
                            <div className="px-3 py-1.5 text-center">
                                <div className="text-base sm:text-lg font-bold text-indigo-600">{attendanceSummary?.total_ot_hours || 0}h</div>
                                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Overtime</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Offboarding / Resignation Active Status Alert */}
                {activeOffboarding && !['cancelled'].includes(activeOffboarding.status) && (
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-indigo-900/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                            <div className="flex items-start sm:items-center gap-3.5">
                                <div className="p-2.5 bg-white/10 text-indigo-300 rounded-xl shrink-0 border border-white/10">
                                    <FiUserMinus className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                        <h4 className="text-sm font-bold text-white">
                                            Separation Notice: {activeOffboarding.request_number || `#${activeOffboarding.id}`}
                                        </h4>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getOffboardingStatus(activeOffboarding.status).color}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${getOffboardingStatus(activeOffboarding.status).dot}`}></span>
                                            {getOffboardingStatus(activeOffboarding.status).label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span>Type: <strong className="text-white capitalize">{activeOffboarding.separation_reason?.replace('_', ' ')}</strong></span>
                                        <span>•</span>
                                        <span>Last Working Day: <strong className="text-white">{activeOffboarding.proposed_last_working_day}</strong></span>
                                        {activeOffboarding.tasks && activeOffboarding.tasks.length > 0 && (
                                            <>
                                                <span>•</span>
                                                <span>Clearance: <strong className="text-white">{activeOffboarding.tasks.filter(t => t.status === 'completed' || t.status === 'waived').length} / {activeOffboarding.tasks.length}</strong> tasks cleared</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                                {activeOffboarding.exit_interview && activeOffboarding.exit_interview.status === 'pending' && (
                                    <Link
                                        href={route('offboarding.exit-interview.show', activeOffboarding.id)}
                                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                                    >
                                        <FiFileText className="w-3.5 h-3.5" /> Take Exit Interview
                                    </Link>
                                )}
                                <Link
                                    href={route('offboarding.show', activeOffboarding.request_number || activeOffboarding.id)}
                                    className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                                >
                                    View Status <FiArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
                    <StatCard
                        title="Attendance"
                        value={`${thisMonthAttendance}d`}
                        subtitle="This month total"
                        icon={FiClock}
                        color="indigo"
                    />
                    <StatCard
                        title="Latest Net Pay"
                        value={currentMonthSalary?.net_salary ? formatCurrency(currentMonthSalary.net_salary) : '₹0'}
                        subtitle="Salary posting"
                        icon={FiDollarSign}
                        color="emerald"
                    />
                    <StatCard
                        title="Approved Leaves"
                        value={approvedLeaveRequests}
                        subtitle={`${pendingLeaveRequests} pending`}
                        icon={FiCalendar}
                        color="amber"
                    />
                    <StatCard
                        title="Active Tasks"
                        value={pendingTasks}
                        subtitle={`${totalTasks} assigned`}
                        icon={FiBriefcase}
                        color="purple"
                    />
                    <StatCard
                        title="Appraisal Score"
                        value={latestScore !== null ? `${latestScore}%` : '—'}
                        subtitle={`${pendingAckEvaluations} pending sign-off`}
                        icon={FiAward}
                        color="rose"
                    />
                    <StatCard
                        title="Reimbursed"
                        value={formatCurrency(totalReimbursedAmount)}
                        subtitle={`${pendingExpenses} in review`}
                        icon={FiDollarSign}
                        color="blue"
                    />
                </div>

                {/* Main 2-Column Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column (2 Cols): Shifts, Attendance, Appraisals */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Weekly Shift Roster */}
                        <SectionCard
                            title="Weekly Shift Roster"
                            icon={FiClock}
                            action={
                                <span className="text-[11px] font-medium text-slate-400">
                                    {weekStart} — {weekEnd}
                                </span>
                            }
                        >
                            {thisWeekShifts.length === 0 ? (
                                <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    <FiClock className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                                    <p className="text-xs text-slate-500">No shifts rostered for the current week.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                        const shift = thisWeekShifts.find(s => s.day === day);
                                        return (
                                            <div
                                                key={day}
                                                className={`p-2.5 rounded-lg border text-center transition-all ${shift
                                                        ? 'bg-rose-50/50 border-rose-200/80 text-slate-800'
                                                        : 'bg-slate-50/80 border-slate-100 text-slate-400'
                                                    }`}
                                            >
                                                <div className="text-[10px] font-semibold uppercase tracking-wider mb-1">
                                                    {day.slice(0, 3)}
                                                </div>
                                                {shift ? (
                                                    <div>
                                                        <div className="text-xs font-bold text-rose-700">{shift.shift_time}</div>
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100/70 text-rose-800 font-medium">
                                                            {shift.shift_type}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="text-[11px] italic text-slate-400">Off</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </SectionCard>

                        {/* Recent Attendance */}
                        <SectionCard
                            title="Recent Attendance Log"
                            icon={FiCheckCircle}
                            action={
                                <Link
                                    href={route('employee-attendances.index')}
                                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                                >
                                    View All <FiArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            }
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                            <th className="pb-2">Date</th>
                                            <th className="pb-2">Status</th>
                                            <th className="pb-2 text-center">Timings</th>
                                            <th className="pb-2 text-center">Hours</th>
                                            <th className="pb-2 text-right">OT</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {recentAttendance.slice(0, 5).map((att, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-2.5 font-medium text-slate-800">
                                                    {new Date(att.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="py-2.5">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${att.attendance === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                            att.attendance === 'Absent' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                                'bg-amber-50 text-amber-700 border border-amber-200'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${att.attendance === 'Present' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                        {att.attendance}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 text-center text-slate-500 font-mono text-[11px]">
                                                    {att.from_time && att.to_time ? `${att.from_time} - ${att.to_time}` : '—'}
                                                </td>
                                                <td className="py-2.5 text-center font-medium text-slate-800">
                                                    {att.hours_worked || 0}h
                                                </td>
                                                <td className="py-2.5 text-right font-medium text-indigo-600">
                                                    +{att.ot || 0}h
                                                </td>
                                            </tr>
                                        ))}
                                        {recentAttendance.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="py-4 text-center text-slate-400 italic">
                                                    No recent attendance records.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>

                        {/* Performance Appraisals & Goal Reviews */}
                        <SectionCard
                            title="Performance Appraisals & Reviews"
                            icon={FiAward}
                            action={
                                <Link
                                    href={route('evaluations.index')}
                                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                                >
                                    View History <FiArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            }
                        >
                            {pendingAckEvaluations > 0 && (
                                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2 text-purple-900 font-medium">
                                        <FiFlag className="w-4 h-4 text-purple-600" />
                                        <span>{pendingAckEvaluations} appraisal review awaiting your sign-off.</span>
                                    </div>
                                    <Link
                                        href={route('evaluations.index')}
                                        className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-[11px] font-semibold hover:bg-purple-700"
                                    >
                                        Review Now
                                    </Link>
                                </div>
                            )}

                            <div className="space-y-3">
                                {myEvaluations.slice(0, 3).map((evalItem, idx) => {
                                    const statusCfg = getEvalStatus(evalItem.status);
                                    const score = parseFloat(evalItem.overall_score || 0);
                                    return (
                                        <div key={idx} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70 hover:bg-white hover:border-slate-300 transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <span className="font-bold text-xs text-slate-900">
                                                        {evalItem.cycle_type?.toUpperCase()} Cycle {evalItem.year}
                                                    </span>
                                                    <p className="text-[11px] text-slate-400">Evaluator: {evalItem.evaluator?.name || 'Manager'}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusCfg.color}`}>
                                                    {statusCfg.label}
                                                </span>
                                            </div>

                                            {score > 0 && (
                                                <div className="mb-2">
                                                    <div className="flex justify-between text-[11px] font-medium mb-1">
                                                        <span className="text-slate-500">Score</span>
                                                        <span className={scoreColor(score)}>{score}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                                        <div className={`h-full rounded-full ${scoreBarColor(score)}`} style={{ width: `${score}%` }} />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-1">
                                                <div className="flex gap-1.5">
                                                    {evalItem.increment_percentage > 0 && (
                                                        <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-semibold">
                                                            +{evalItem.increment_percentage}% Increment
                                                        </span>
                                                    )}
                                                    {evalItem.promotion_recommended && (
                                                        <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-semibold">
                                                            Promotion
                                                        </span>
                                                    )}
                                                </div>
                                                <Link
                                                    href={route('evaluations.show', evalItem.id)}
                                                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-800"
                                                >
                                                    View Details →
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                                {myEvaluations.length === 0 && (
                                    <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                        No performance appraisal records found.
                                    </p>
                                )}
                            </div>
                        </SectionCard>
                    </div>

                    {/* Right Column (1 Col): Leave balances, Expenses, Payslips, Warnings */}
                    <div className="space-y-6">

                        {/* Leave Balances */}
                        <SectionCard
                            title="Leave Balances"
                            icon={FiPieChart}
                            action={
                                <Link
                                    href={route('leave-requests.create')}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                                >
                                    <FiPlus className="w-3 h-3" /> Apply
                                </Link>
                            }
                        >
                            <div className="space-y-3">
                                {leaveBalances.map((bal, idx) => {
                                    const pct = bal.total_days > 0 ? (bal.remaining_days / bal.total_days) * 100 : 0;
                                    return (
                                        <div key={idx}>
                                            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                                                <span>{bal.leave_type?.name}</span>
                                                <span className="text-slate-500 font-mono text-[11px]">
                                                    {bal.remaining_days} / {bal.total_days}d
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${pct > 40 ? 'bg-emerald-500' : pct > 15 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                {leaveBalances.length === 0 && (
                                    <p className="text-xs text-slate-400 italic text-center py-3">No leave quotas allocated.</p>
                                )}
                            </div>
                        </SectionCard>

                        {/* Expense Claims */}
                        <SectionCard
                            title="Expense Claims"
                            icon={FiDollarSign}
                            action={
                                <Link
                                    href={route('expenses.create')}
                                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                                >
                                    <FiPlus className="w-3.5 h-3.5" /> Claim
                                </Link>
                            }
                        >
                            <div className="space-y-2.5">
                                {recentExpenses.slice(0, 3).map((claim, idx) => (
                                    <Link
                                        key={idx}
                                        href={route('expenses.show', claim.id)}
                                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-rose-50/40 border border-slate-200/60 transition-colors block"
                                    >
                                        <div>
                                            <div className="text-xs font-bold text-slate-800">{claim.category?.name || 'General Expense'}</div>
                                            <div className="text-[10px] text-slate-400">{claim.claim_number}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-slate-900">{formatCurrency(claim.amount)}</div>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold bg-slate-100 text-slate-600">
                                                {claim.status?.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                                {recentExpenses.length === 0 && (
                                    <p className="text-xs text-slate-400 italic text-center py-3">No expense claims yet.</p>
                                )}
                            </div>
                        </SectionCard>

                        {/* Salary Slips */}
                        <SectionCard
                            title="Recent Salary Slips"
                            icon={FiFileText}
                            action={
                                <Link
                                    href={route('salary-postings.index')}
                                    className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                                >
                                    View All
                                </Link>
                            }
                        >
                            <div className="space-y-2">
                                {recentSalaryPostings.slice(0, 3).map((salary, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                                        <div>
                                            <div className="text-xs font-semibold text-slate-800">
                                                {new Date(salary.year, salary.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="text-xs font-bold text-emerald-600">{formatCurrency(salary.net_salary)}</div>
                                        </div>
                                        <Link
                                            href={route('salary-postings.slip', salary.id)}
                                            className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700"
                                        >
                                            Payslip
                                        </Link>
                                    </div>
                                ))}
                                {recentSalaryPostings.length === 0 && (
                                    <p className="text-xs text-slate-400 italic text-center py-3">No salary slips posted yet.</p>
                                )}
                            </div>
                        </SectionCard>

                        {/* Employment & Separation Widget */}
                        <SectionCard
                            title="Resignation & Separation"
                            icon={FiUserMinus}
                            action={
                                activeOffboarding ? (
                                    <Link
                                        href={route('offboarding.show', activeOffboarding.request_number || activeOffboarding.id)}
                                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                                    >
                                        View Track <FiArrowRight className="w-3 h-3" />
                                    </Link>
                                ) : (
                                    <Link
                                        href={route('offboarding.create')}
                                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                                    >
                                        <FiPlus className="w-3 h-3" /> Apply
                                    </Link>
                                )
                            }
                        >
                            {activeOffboarding ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Request</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getOffboardingStatus(activeOffboarding.status).color}`}>
                                                {getOffboardingStatus(activeOffboarding.status).label}
                                            </span>
                                        </div>
                                        <div className="text-xs font-bold text-slate-900">{activeOffboarding.request_number || `#${activeOffboarding.id}`}</div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            LWD: <strong className="text-slate-700">{activeOffboarding.proposed_last_working_day}</strong>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                                        <span>Notice Period Status</span>
                                        <span className="font-semibold text-slate-800 capitalize">{activeOffboarding.status?.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500">Employment Status</span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            Active Verified
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500">Service Tenure</span>
                                        <span className="font-medium text-slate-700">
                                            {employee.joined_date ? `Joined ${employee.joined_date}` : 'Active'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-2.5">
                                        To submit a formal notice of separation, resignation, or contract completion, initiate an offboarding request.
                                    </p>
                                    <Link
                                        href={route('offboarding.create')}
                                        className="w-full py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
                                    >
                                        <FiUserMinus className="w-3.5 h-3.5" /> Submit Resignation / Notice
                                    </Link>
                                </div>
                            )}
                        </SectionCard>

                        {/* Warning Letters if any */}
                        {warningLetters && warningLetters.length > 0 && (
                            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5 mb-2">
                                    <FiAlertTriangle className="w-4 h-4 text-rose-600" /> Active Notices ({warningLetters.length})
                                </h4>
                                <div className="space-y-2">
                                    {warningLetters.map((letter, idx) => (
                                        <div key={idx} className="p-2.5 bg-white rounded-lg border border-rose-200/80 text-xs">
                                            <div className="font-semibold text-rose-900">{letter.subject}</div>
                                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{letter.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
