import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import {
    FiArrowLeft, FiUserMinus, FiCheckCircle, FiClock, FiAlertTriangle,
    FiEdit2, FiUser, FiFileText, FiList, FiMessageSquare, FiDollarSign,
    FiChevronDown, FiChevronUp, FiFlag, FiShield, FiStar, FiPackage,
    FiLock, FiBookOpen, FiClipboard, FiCheck, FiDownload, FiInfo, FiLayers,
    FiSearch, FiX, FiCalendar, FiBriefcase, FiRefreshCw, FiCheckSquare,
    FiSliders, FiMessageCircle
} from 'react-icons/fi';

const STATUS_STEPS = [
    { key: 'pending_approval', label: 'Pending Approval' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'clearance_pending', label: 'Clearance' },
    { key: 'exit_interview_pending', label: 'Exit Interview' },
    { key: 'settlement_pending', label: 'Settlement' },
    { key: 'completed', label: 'Completed' },
];

const STATUS_ORDER = STATUS_STEPS.map(s => s.key);

const ROLE_META = {
    hr: { label: 'HR Department', icon: FiUser, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    manager: { label: 'Reporting Manager', icon: FiBriefcase, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    it: { label: 'IT & Asset Management', icon: FiLock, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
    admin: { label: 'Administration & Ops', icon: FiClipboard, color: 'text-slate-600 bg-slate-100 border-slate-200' },
    finance: { label: 'Finance & Accounts', icon: FiDollarSign, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    payroll: { label: 'Payroll & Compensation', icon: FiDollarSign, color: 'text-teal-600 bg-teal-50 border-teal-200' },
    security: { label: 'Security & Access', icon: FiShield, color: 'text-rose-600 bg-rose-50 border-rose-200' },
};

const REASON_LABELS = {
    resignation: 'Resignation', retirement: 'Retirement', termination: 'Termination',
    contract_completion: 'Contract Completion', redundancy: 'Redundancy',
    mutual_separation: 'Mutual Separation', absconding: 'Absconding', other: 'Other',
};

const formatINR = (v) => v ? '₹' + Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '₹0';

function TaskRow({ task, offboardingRef, canUpdate }) {
    const [editingNote, setEditingNote] = useState(false);
    const [noteText, setNoteText] = useState(task.completion_notes || '');
    const [isUpdating, setIsUpdating] = useState(false);

    const isCompleted = task.status === 'completed';
    const isSkipped = task.status === 'skipped';
    const isInProgress = task.status === 'in_progress';

    const handleStatusChange = (newStatus) => {
        setIsUpdating(true);
        router.post(
            route('offboarding.tasks.update', { offboarding: offboardingRef, task: task.id }),
            {
                status: newStatus,
                completion_notes: task.completion_notes || '',
            },
            {
                preserveScroll: true,
                onFinish: () => setIsUpdating(false),
            }
        );
    };

    const handleToggleDone = () => {
        if (!canUpdate || isUpdating) return;
        handleStatusChange(isCompleted ? 'pending' : 'completed');
    };

    const handleSaveNote = (e) => {
        e.preventDefault();
        setIsUpdating(true);
        router.post(
            route('offboarding.tasks.update', { offboarding: offboardingRef, task: task.id }),
            {
                status: task.status,
                completion_notes: noteText,
            },
            {
                preserveScroll: true,
                onSuccess: () => setEditingNote(false),
                onFinish: () => setIsUpdating(false),
            }
        );
    };

    return (
        <div className={`p-3.5 transition-colors border-b border-slate-100 last:border-0 ${isCompleted ? 'bg-slate-50/40' : 'bg-white hover:bg-slate-50/70'
            }`}>
            <div className="flex items-center justify-between gap-3">
                {/* Checkbox + Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {canUpdate ? (
                        <button
                            type="button"
                            onClick={handleToggleDone}
                            disabled={isUpdating}
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${isCompleted
                                ? 'bg-emerald-600 text-white'
                                : 'border border-slate-300 bg-white hover:border-emerald-500 text-transparent hover:text-emerald-500'
                                }`}
                        >
                            <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                    ) : (
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-slate-300'
                            }`}>
                            <FiCheck className="w-3.5 h-3.5" />
                        </div>
                    )}

                    <div className="min-w-0 flex-1">
                        <p className={`text-xs sm:text-sm font-medium ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'
                            }`}>
                            {task.task_title}
                        </p>
                        {task.completion_notes && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                                <FiFileText className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span>{task.completion_notes}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Status selector & note trigger */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => setEditingNote(!editingNote)}
                        className={`p-1.5 rounded text-xs transition-colors ${task.completion_notes
                            ? 'text-slate-600 hover:bg-slate-200 bg-slate-100'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                        title="Add/Edit Note"
                    >
                        <FiEdit2 className="w-3.5 h-3.5" />
                    </button>

                    {canUpdate ? (
                        <select
                            value={task.status}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className={`text-[11px] font-semibold py-1 pl-2.5 pr-7 rounded-md border cursor-pointer focus:outline-none ${isCompleted
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isInProgress
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : isSkipped
                                        ? 'bg-slate-100 text-slate-400 border-slate-200'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="skipped">Skipped</option>
                        </select>
                    ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isInProgress ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : isSkipped ? 'bg-slate-100 text-slate-400 border-slate-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                            {task.status.replace(/_/g, ' ')}
                        </span>
                    )}
                </div>
            </div>

            {/* Note Editor */}
            {editingNote && (
                <form onSubmit={handleSaveNote} className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                    <input
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add clearance note (e.g. returned ID badge & equipment)..."
                        className="flex-1 py-1 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-rose-400 outline-none"
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={() => setEditingNote(false)}
                        className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isUpdating}
                        className="px-3 py-1 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-rose-600 transition-colors"
                    >
                        Save
                    </button>
                </form>
            )}
        </div>
    );
}

export default function Show({
    offboarding,
    tasksByRole = {},
    leaveBalances = [],
    userRole = 'employee',
    isManagementRole = false,
    canApprove = false,
    canSettle = false
}) {
    const [approveModal, setApproveModal] = useState(false);
    const [rejectModal, setRejectModal] = useState(false);
    const [completeModal, setCompleteModal] = useState(false);
    const [unlockModal, setUnlockModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const approve = useForm({ role: 'hr', comments: '' });
    const reject = useForm({ reason: '' });
    const complete = useForm({ actual_last_working_day: offboarding.proposed_last_working_day?.split('T')[0] || '' });
    const unlock = useForm({});

    const currentStepIdx = STATUS_ORDER.indexOf(offboarding.status);
    const offboardingRef = offboarding.request_number || offboarding.id;

    const handleApprove = (e) => {
        e.preventDefault();
        approve.post(route('offboarding.approve', offboardingRef), { onSuccess: () => setApproveModal(false) });
    };

    const handleReject = (e) => {
        e.preventDefault();
        reject.post(route('offboarding.reject', offboardingRef), { onSuccess: () => setRejectModal(false) });
    };

    const handleComplete = (e) => {
        e.preventDefault();
        complete.post(route('offboarding.complete', offboardingRef), { onSuccess: () => setCompleteModal(false) });
    };

    const handleUnlock = (e) => {
        e.preventDefault();
        unlock.post(route('offboarding.unlock', offboardingRef), { onSuccess: () => setUnlockModal(false) });
    };

    const handleSettlement = () => {
        router.post(route('offboarding.settlement', offboardingRef));
    };

    // Calculate progress
    const allTasks = useMemo(() => Object.values(tasksByRole).flat(), [tasksByRole]);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const percentDone = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Filter tasks by search query
    const filteredTasksByRole = useMemo(() => {
        if (!searchQuery.trim()) return tasksByRole;
        const q = searchQuery.toLowerCase();
        const result = {};
        Object.entries(tasksByRole).forEach(([role, tasks]) => {
            const matched = tasks.filter(t =>
                t.task_title?.toLowerCase().includes(q) ||
                t.completion_notes?.toLowerCase().includes(q)
            );
            if (matched.length > 0) result[role] = matched;
        });
        return result;
    }, [tasksByRole, searchQuery]);

    return (
        <AuthenticatedLayout>
            <Head title={`Offboarding — ${offboarding.employee?.name}`} />

            {/* In-Page Header */}
            <div className="w-full bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3.5">
                        <Link
                            href={route('offboarding.index')}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-800"
                            title="Back to Offboarding"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                    {offboarding.employee?.name}
                                </h1>
                                <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded">
                                    {offboarding.request_number || `REQ-${offboarding.id}`}
                                </span>
                                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${offboarding.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : offboarding.status === 'cancelled'
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                    {offboarding.status.replace(/_/g, ' ').toUpperCase()}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-slate-700">{offboarding.employee?.employee_code}</span>
                                <span>•</span>
                                <span>{offboarding.employee?.department?.name || 'Department'}</span>
                                <span>•</span>
                                <span>{offboarding.employee?.company?.name || 'Salon Branch'}</span>
                                <span>•</span>
                                <span>{REASON_LABELS[offboarding.separation_reason] || offboarding.separation_reason}</span>
                            </p>
                        </div>
                    </div>

                    {/* Header Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
                        {canApprove && offboarding.status === 'pending_approval' && (
                            <>
                                <button
                                    onClick={() => setApproveModal(true)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
                                >
                                    <FiCheckCircle className="w-4 h-4" /> Approve
                                </button>
                                <button
                                    onClick={() => setRejectModal(true)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 transition-all cursor-pointer"
                                >
                                    <FiX className="w-4 h-4" /> Reject
                                </button>
                            </>
                        )}

                        <Link
                            href={route('offboarding.exit-interview', offboardingRef)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${offboarding.exitInterview
                                ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            <FiMessageSquare className="w-4 h-4 text-sky-500" />
                            {offboarding.exitInterview ? 'Exit Interview' : 'Conduct Exit Interview'}
                        </Link>

                        {offboarding.status === 'completed' && ['admin', 'hr'].includes(userRole) && (
                            <button
                                onClick={() => setUnlockModal(true)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-100 transition-all shadow-xs cursor-pointer"
                            >
                                <FiLock className="w-4 h-4 text-amber-600" /> Unlock & Reactivate Profile
                            </button>
                        )}

                        {offboarding.status === 'settlement_pending' && canSettle && (
                            <button
                                onClick={() => setCompleteModal(true)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-rose-600 transition-all shadow-xs cursor-pointer"
                            >
                                <FiFlag className="w-4 h-4" /> Complete Offboarding & Lock Profile
                            </button>
                        )}

                        {['settlement_pending', 'completed'].includes(offboarding.status) && (
                            <a
                                href={route('offboarding.relieving-letter', offboardingRef)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-xs"
                            >
                                <FiDownload className="w-4 h-4" /> Relieving Letter
                            </a>
                        )}

                        {['draft', 'pending_approval'].includes(offboarding.status) && (
                            <Link
                                href={route('offboarding.edit', offboardingRef)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all"
                            >
                                <FiEdit2 className="w-3.5 h-3.5" /> Edit
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area - Full Width */}
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

                {/* Stepper Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5">
                    <div className="flex items-center justify-between overflow-x-auto gap-2 pb-1">
                        {STATUS_STEPS.map((step, i) => {
                            const done = currentStepIdx > i || offboarding.status === 'completed';
                            const current = currentStepIdx === i;
                            return (
                                <React.Fragment key={step.key}>
                                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0 min-w-[64px]">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${done ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                                            : current ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
                                                : 'bg-white border-slate-200 text-slate-400'
                                            }`}>
                                            {done ? <FiCheck className="w-4 h-4 stroke-[3]" /> : i + 1}
                                        </div>
                                        <p className={`text-[10px] text-center font-semibold leading-tight max-w-[75px] ${current ? 'text-rose-600 font-bold' : done ? 'text-emerald-700' : 'text-slate-400'
                                            }`}>
                                            {step.label}
                                        </p>
                                    </div>
                                    {i < STATUS_STEPS.length - 1 && (
                                        <div className={`flex-1 h-0.5 ${done ? 'bg-emerald-400' : 'bg-slate-100'} min-w-[20px]`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* 2-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column (8 cols): Departmental Clearance Checklist Sections */}
                    <div className="lg:col-span-8 space-y-5">

                        {/* Checklist Header & Progress Bar */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <FiCheckSquare className="text-rose-500 w-5 h-5" />
                                        Clearance Checklist
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Departmental handovers, equipment recoveries, and account revocations
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${percentDone === 100
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                        }`}>
                                        {completedTasks} / {totalTasks} Completed ({percentDone}%)
                                    </span>
                                </div>
                            </div>

                            {/* Slim Progress Bar */}
                            {totalTasks > 0 && (
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                        style={{ width: `${percentDone}%` }}
                                    />
                                </div>
                            )}

                            {/* Simple Search Input */}
                            {totalTasks > 5 && (
                                <div className="relative pt-1">
                                    <FiSearch className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search clearance tasks by name..."
                                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-rose-400 outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Grouped Department Checklist Cards */}
                        {Object.keys(filteredTasksByRole).length > 0 ? (
                            <div className="space-y-4">
                                {Object.entries(filteredTasksByRole).map(([role, tasks]) => {
                                    const meta = ROLE_META[role] || { label: `${role.toUpperCase()} Clearance`, icon: FiClipboard, color: 'text-slate-700 bg-slate-100 border-slate-200' };
                                    const IconComponent = meta.icon;
                                    const roleCompleted = tasks.filter(t => t.status === 'completed').length;
                                    const isAllRoleDone = tasks.length > 0 && roleCompleted === tasks.length;

                                    return (
                                        <div key={role} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                                            {/* Department Header */}
                                            <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`p-1.5 rounded-md border text-xs ${meta.color}`}>
                                                        <IconComponent className="w-3.5 h-3.5" />
                                                    </span>
                                                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                                        {meta.label}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isAllRoleDone
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-slate-200/70 text-slate-600'
                                                        }`}>
                                                        {roleCompleted} / {tasks.length} Done
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Task Rows */}
                                            <div className="divide-y divide-slate-100">
                                                {tasks.map((task) => (
                                                    <TaskRow
                                                        key={task.id}
                                                        task={task}
                                                        offboardingRef={offboardingRef}
                                                        canUpdate={true}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                                <FiList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                {totalTasks > 0
                                    ? 'No clearance tasks found matching your search.'
                                    : 'Clearance tasks will be generated upon approval.'}
                            </div>
                        )}

                        {/* Exit Interview Summary Card */}
                        {offboarding.exitInterview && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                        <FiStar className="text-amber-500 w-4 h-4" /> Exit Interview Feedback
                                    </h3>
                                    <Link
                                        href={route('offboarding.exit-interview', offboardingRef)}
                                        className="text-xs text-sky-600 font-semibold hover:underline"
                                    >
                                        Edit / Review
                                    </Link>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                    {[
                                        { label: 'Job Satisfaction', value: offboarding.exitInterview.job_satisfaction_rating },
                                        { label: 'Management', value: offboarding.exitInterview.management_rating },
                                        { label: 'Work Culture', value: offboarding.exitInterview.work_environment_rating },
                                        { label: 'Compensation', value: offboarding.exitInterview.compensation_rating },
                                        { label: 'Career Growth', value: offboarding.exitInterview.growth_opportunity_rating },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="text-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                            <p className="text-[10px] text-slate-400 font-semibold truncate mb-1">{label}</p>
                                            <div className="flex items-center justify-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <FiStar key={s} className={`w-3 h-3 ${s <= (value || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                                ))}
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 mt-1">{value || '—'}/5</p>
                                        </div>
                                    ))}
                                </div>

                                {offboarding.exitInterview.reason_for_leaving && (
                                    <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-0.5">
                                        <p className="font-semibold text-slate-700">Reason for Leaving:</p>
                                        <p className="text-slate-600">{offboarding.exitInterview.reason_for_leaving}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column (4 cols): Employee Details, Settlement, Leaves */}
                    <div className="lg:col-span-4 space-y-5">

                        {/* Employee Details Card */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3.5">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                <FiUser className="text-blue-500" /> Separation Overview
                            </h3>
                            <div className="space-y-2.5 text-xs">
                                {[
                                    ['Employee Name', offboarding.employee?.name],
                                    ['Employee Code', offboarding.employee?.employee_code],
                                    ['Department', offboarding.employee?.department?.name || '—'],
                                    ['Designation', offboarding.employee?.designation || 'Staff'],
                                    ['Salon / Branch', offboarding.employee?.company?.name || '—'],
                                    ['Last Working Day', offboarding.proposed_last_working_day
                                        ? new Date(offboarding.proposed_last_working_day).toLocaleDateString('en-IN') : '—'],
                                    ['Notice Period', `${offboarding.notice_period_days || 0} days`],
                                    ['Initiated By', offboarding.initiator?.name || 'HR Team'],
                                ].map(([label, val]) => (
                                    <div key={label} className="flex justify-between items-center py-0.5 border-b border-slate-50 last:border-0">
                                        <span className="text-slate-400">{label}</span>
                                        <span className="text-slate-800 font-semibold text-right max-w-[160px] truncate">{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Final Settlement (F&F) Card */}
                        {(offboarding.net_settlement_amount > 0 || offboarding.status === 'settlement_pending' || offboarding.status === 'completed') && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3.5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                        <FiDollarSign className="text-emerald-500" /> Final Settlement (F&F)
                                    </h3>
                                    {canSettle && offboarding.status !== 'completed' && (
                                        <button
                                            onClick={handleSettlement}
                                            className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            <FiRefreshCw className="w-3 h-3" /> Recalculate
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2 text-xs">
                                    {[
                                        ['Basic Salary till LWD', offboarding.basic_salary_till_lwd],
                                        ['Leave Encashment', offboarding.leave_encashment_amount],
                                        ['Gratuity', offboarding.gratuity_amount],
                                        ['Deductions / Advances', offboarding.deductions_total],
                                    ].map(([label, val]) => (
                                        <div key={label} className="flex justify-between items-center py-0.5">
                                            <span className="text-slate-400">{label}</span>
                                            <span className={`font-semibold ${label.includes('Deductions') ? 'text-rose-600' : 'text-slate-800'}`}>
                                                {val != null ? formatINR(val) : '—'}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 font-bold">
                                        <span className="text-slate-800">Net Payable</span>
                                        <span className="text-emerald-600 text-sm font-bold">{formatINR(offboarding.net_settlement_amount)}</span>
                                    </div>
                                </div>
                                {canSettle && offboarding.status === 'settlement_pending' && !offboarding.settlement_approved && (
                                    <button
                                        onClick={() => setCompleteModal(true)}
                                        className="w-full py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-xs mt-2 cursor-pointer"
                                    >
                                        Approve Settlement & Complete
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Leave Balances */}
                        {leaveBalances.length > 0 && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                    <FiLayers className="text-indigo-500" /> Leave Balances
                                </h3>
                                <div className="space-y-1.5">
                                    {leaveBalances.map((lb) => (
                                        <div key={lb.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-50 last:border-0">
                                            <span className="text-slate-500">{lb.leave_type?.name || 'Leave'}</span>
                                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                                                {lb.balance} days
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Exit Interview Trigger */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                <FiMessageSquare className="text-sky-500" /> Exit Interview
                            </h3>
                            <p className="text-xs text-slate-500">
                                {offboarding.exitInterview
                                    ? 'Exit interview has been recorded.'
                                    : 'Conduct structured exit interview to capture satisfaction ratings.'}
                            </p>
                            <Link
                                href={route('offboarding.exit-interview', offboardingRef)}
                                className="block w-full py-2 px-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg text-center text-xs font-semibold text-sky-700 transition-colors"
                            >
                                {offboarding.exitInterview ? 'View Recorded Interview' : 'Conduct Exit Interview'}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {approveModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleApprove} className="bg-white rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                        <h3 className="text-base font-bold text-slate-900">Approve Offboarding Request</h3>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Approving as *</label>
                            <select
                                value={approve.data.role}
                                onChange={(e) => approve.setData('role', e.target.value)}
                                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-rose-400"
                            >
                                <option value="manager">Manager</option>
                                <option value="hr">HR (Final Approval)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Comments (optional)</label>
                            <textarea
                                rows="2"
                                value={approve.data.comments}
                                onChange={(e) => approve.setData('comments', e.target.value)}
                                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-rose-400"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setApproveModal(false)}
                                className="px-4 py-2 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={approve.processing}
                                className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                                {approve.processing ? 'Approving…' : 'Approve'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {rejectModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleReject} className="bg-white rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                        <h3 className="text-base font-bold text-slate-900">Reject / Cancel Request</h3>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reason *</label>
                            <textarea
                                required
                                rows="3"
                                value={reject.data.reason}
                                onChange={(e) => reject.setData('reason', e.target.value)}
                                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-rose-400"
                                placeholder="State the reason for rejecting…"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setRejectModal(false)}
                                className="px-4 py-2 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={reject.processing}
                                className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                            >
                                {reject.processing ? 'Rejecting…' : 'Reject Request'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {completeModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleComplete} className="bg-white rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                        <h3 className="text-base font-bold text-slate-900">Complete Offboarding</h3>
                        <p className="text-xs text-slate-500">
                            This will mark the employee as <strong>separated</strong> and archive their record.
                        </p>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Actual Last Working Day *</label>
                            <input
                                type="date"
                                required
                                value={complete.data.actual_last_working_day}
                                onChange={(e) => complete.setData('actual_last_working_day', e.target.value)}
                                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-rose-400"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setCompleteModal(false)}
                                className="px-4 py-2 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={complete.processing}
                                className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-rose-600"
                            >
                                {complete.processing ? 'Completing…' : 'Confirm & Complete'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
