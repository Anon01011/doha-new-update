import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import Avatar from '@/Components/Avatar';
import { useState } from 'react';
import WarningLetterModal from '@/Components/Grievance/WarningLetterModal';
import {
    FiArrowLeft, FiEdit3, FiAlertCircle, FiShield, FiUser,
    FiCalendar, FiClock, FiCheckCircle, FiFileText, FiEye, FiHash
} from 'react-icons/fi';

export default function Show({ grievance, userRole = 'employee', warningTypes }) {
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

    const formatDate = (date) => date ? new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'N/A';

    const getPriorityStyles = (priority) => {
        const p = priority?.toLowerCase() || '';
        if (p === 'urgent') return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
        if (p === 'high') return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
        if (p === 'medium') return 'bg-primary/10 text-primary border-primary/20';
        return 'bg-slate-100 text-slate-500 border-slate-200';
    };

    const getStatusStyles = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'resolved') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        if (s === 'under_review' || s === 'in_progress') return 'bg-primary/10 text-primary border-primary/20';
        if (s === 'closed') return 'bg-slate-100 text-slate-500 border-slate-200';
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-normal text-slate-900 uppercase">Grievance Details</h2>}>
            <Head title={`Case - ${grievance.subject}`} />

            <div className="p-4 space-y-4 bg-slate-50 min-h-screen">

                {/* Control Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Link
                            href={route('grievances.index')}
                            className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-95 border border-slate-100"
                        >
                            <FiArrowLeft size={16} />
                        </Link>
                        <div>
                            <h2 className="text-base font-normal text-slate-900 uppercase leading-none">Case Details</h2>
                            <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mt-0.5 flex items-center gap-1.5">
                                <FiHash size={8} />
                                REF: GRV-{grievance.id.toString().padStart(5, '0')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {userRole !== 'employee' && (
                            <Link
                                href={route('grievances.edit', grievance.id)}
                                className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-primary transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FiEdit3 size={12} /> Manage Case
                            </Link>
                        )}
                        {userRole === 'admin' && (
                            <button
                                onClick={() => setIsWarningModalOpen(true)}
                                className="flex-1 sm:flex-none px-4 py-2 bg-rose-500 text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-rose-100"
                            >
                                <FiShield size={12} /> Send Warning
                            </button>
                        )}
                    </div>
                </div>

                {/* Hero Banner */}
                <div className="bg-slate-900 rounded-lg p-5 text-white shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 text-white opacity-5 group-hover:scale-110 transition-transform">
                        <FiAlertCircle size={100} />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-normal uppercase tracking-normal border ${getStatusStyles(grievance.status)} bg-white/10 text-white border-white/20`}>
                                {grievance.status?.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-normal uppercase tracking-normal border ${getPriorityStyles(grievance.priority)} bg-white/10 text-white border-white/20`}>
                                {grievance.priority} PRIORITY
                            </span>
                            {grievance.is_anonymous && (
                                <span className="px-2 py-0.5 rounded text-[8px] font-normal uppercase tracking-normal border bg-white/10 text-white border-white/20 flex items-center gap-1.5">
                                    <FiEye size={9} /> ANONYMOUS
                                </span>
                            )}
                        </div>

                        <h1 className="text-xl md:text-2xl font-normal tracking-normal leading-tight uppercase max-w-3xl">
                            {grievance.subject}
                        </h1>

                        <div className="flex flex-wrap gap-4 pt-1">
                            <div className="space-y-0.5">
                                <p className="text-[8px] font-normal text-white/50 uppercase tracking-normal leading-none">Reporter</p>
                                <div className="flex items-center gap-2">
                                    <Avatar
                                        src={grievance.is_anonymous ? null : grievance.employee?.employee_image}
                                        name={grievance.is_anonymous ? '?' : grievance.employee?.name}
                                        size="xs"
                                        className="ring-1 ring-white/10"
                                    />
                                    <div className="text-[10px] font-normal uppercase tracking-normal">
                                        {grievance.is_anonymous ? 'CONFIDENTIAL' : grievance.employee?.name}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[8px] font-normal text-white/50 uppercase tracking-normal leading-none">Classification</p>
                                <p className="text-[10px] font-normal uppercase flex items-center gap-1.5">
                                    <FiFileText size={9} className="text-primary" />
                                    {grievance.category || 'STANDARD'}
                                </p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[8px] font-normal text-white/50 uppercase tracking-normal leading-none">Submitted</p>
                                <p className="text-[10px] font-normal uppercase flex items-center gap-1.5 tabular-nums">
                                    <FiCalendar size={9} className="text-primary" />
                                    {formatDate(grievance.submitted_date || grievance.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Case Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-5 md:p-6 space-y-5">
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-0.5 h-3 bg-primary rounded-full"></div>
                                        Detailed Description
                                    </h3>
                                    <div className="text-slate-600 leading-relaxed font-normal whitespace-pre-wrap">
                                        {grievance.description}
                                    </div>
                                </div>

                                {/* Resolution */}
                                {(grievance.resolution_notes || grievance.resolved_date) && (
                                    <div className="bg-emerald-50 rounded-lg border border-emerald-100 p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-2 text-emerald-800 font-normal text-[10px] uppercase tracking-normal">
                                            <FiCheckCircle className="w-4 h-4" />
                                            Case Resolution Detail
                                        </div>
                                        <div className="space-y-3">
                                            {grievance.resolved_date && (
                                                <div className="text-[10px] font-normal text-emerald-600 uppercase tracking-normal">
                                                    RESOLVED ON: <span className="text-emerald-800">{formatDate(grievance.resolved_date)}</span>
                                                </div>
                                            )}
                                            {grievance.resolution_notes && (
                                                <p className="text-emerald-700 text-sm font-normal leading-relaxed bg-white/50 p-4 rounded-lg border border-emerald-100/50">
                                                    {grievance.resolution_notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Warnings Issued */}
                        {grievance.warning_letters && grievance.warning_letters.length > 0 && (
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
                                <h3 className="text-xs font-normal text-slate-800 uppercase tracking-normal flex items-center gap-2">
                                    <FiShield className="text-rose-500 w-4 h-4" />
                                    Formal Warnings Issued
                                </h3>
                                <div className="space-y-3">
                                    {grievance.warning_letters.map((letter) => (
                                        <div key={letter.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 group hover:border-rose-200 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-rose-500 transition-colors">
                                                    <FiFileText size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-normal text-slate-800 mb-0.5 uppercase tracking-normal">{letter.subject}</div>
                                                    <div className="flex items-center gap-2.5 text-[9px] font-normal text-slate-400 uppercase tracking-normal">
                                                        <span>{formatDate(letter.created_at)}</span>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                        <span className="text-rose-500">{letter.type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Link
                                                href={route('warning-letters.show', letter.id)}
                                                className="px-4 py-2 bg-white hover:bg-slate-900 hover:text-white rounded-lg text-[9px] font-normal uppercase tracking-normal text-slate-600 transition-all border border-slate-100 shadow-sm active:scale-95"
                                            >
                                                View Notice
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Info & Sidebar */}
                    <div className="space-y-6">
                        {/* Reporter Sidebar Card */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-5 space-y-4">
                                <h3 className="text-[9px] font-normal text-slate-400 uppercase tracking-[0.2em] mb-2">Reporter Information</h3>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <Avatar
                                        src={grievance.is_anonymous ? null : grievance.employee?.employee_image}
                                        name={grievance.is_anonymous ? '?' : grievance.employee?.name}
                                        size="sm"
                                        className="ring-1 ring-white shadow-sm"
                                    />
                                    <div className="min-w-0">
                                        <div className="text-[11px] font-normal text-slate-900 truncate uppercase leading-none">
                                            {grievance.is_anonymous ? 'ANONYMOUS' : grievance.employee?.name}
                                        </div>
                                        <div className="text-[8px] font-normal text-slate-400 uppercase tracking-normal truncate mt-1">
                                            {grievance.is_anonymous ? 'IDENTITY PROTECTED' : (grievance.employee?.designation || 'STAFF MEMBER')}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-[8px] font-normal text-slate-400 uppercase tracking-normal leading-none">
                                            <FiCalendar size={9} className="text-primary" /> Date Reported
                                        </div>
                                        <div className="text-[10px] font-normal text-slate-800 tabular-nums uppercase">{formatDate(grievance.submitted_date || grievance.created_at)}</div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-[8px] font-normal text-slate-400 uppercase tracking-normal leading-none">
                                            <FiAlertCircle size={9} className="text-primary" /> Classification
                                        </div>
                                        <div className="text-[10px] font-normal text-slate-800 uppercase tracking-normal">{grievance.category || 'STANDARD'}</div>
                                    </div>

                                    {grievance.assignee && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[8px] font-normal text-slate-400 uppercase tracking-normal leading-none">
                                                <FiUser size={9} className="text-primary" /> Case Handler
                                            </div>
                                            <div className="text-[10px] font-normal text-slate-800 uppercase">{grievance.assignee.name}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SLA Notice */}
                        {grievance.sla_deadline && !grievance.resolved_date && (
                            <div className={`p-6 rounded-lg border flex gap-4 shadow-sm animate-pulse-slow ${grievance.is_overdue ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                                <FiClock size={20} className="shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-[9px] font-normal uppercase tracking-[0.2em] opacity-60 mb-1">Resolution SLA</div>
                                    <p className="text-xs font-normal leading-tight uppercase">
                                        {grievance.is_overdue
                                            ? 'CASE EXCEEDS STANDARD RESPONSE TIME'
                                            : `Resolution expected by ${new Date(grievance.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <WarningLetterModal
                isOpen={isWarningModalOpen}
                setIsOpen={setIsWarningModalOpen}
                employee={grievance.employee}
                grievanceId={grievance.id}
                warningTypes={warningTypes}
            />
        </AuthenticatedLayout>
    );
}
