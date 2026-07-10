import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { FiArrowLeft, FiPrinter, FiShield, FiFileText, FiUser, FiCalendar } from 'react-icons/fi';

export default function Show({ warningLetter, userRole }) {
    const formatDate = (date) => date ? new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'N/A';

    const getTypeStyles = (type) => {
        const t = type?.toLowerCase() || '';
        if (t.includes('strict') || t.includes('cause')) return {
            bg: 'bg-rose-50',
            text: 'text-rose-700',
            border: 'border-rose-200',
            accent: 'bg-rose-500'
        };
        if (t.includes('termination')) return {
            bg: 'bg-slate-900',
            text: 'text-white',
            border: 'border-slate-800',
            accent: 'bg-slate-700'
        };
        return {
            bg: 'bg-amber-50',
            text: 'text-amber-700',
            border: 'border-amber-200',
            accent: 'bg-amber-500'
        };
    };

    const style = getTypeStyles(warningLetter.type);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('warning-letters.index')}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 group"
                        >
                            <FiArrowLeft className="w-5 h-5 group-hover:text-slate-600" />
                        </Link>
                        <h2 className="text-lg font-normal text-slate-800 tracking-normal flex items-center gap-2">
                            <span className="w-1 h-4 bg-rose-500 rounded-full"></span>
                            Document #{warningLetter.id.toString().padStart(5, '0')}
                        </h2>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-normal text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <FiPrinter className="w-4 h-4" />
                        Print Notice
                    </button>
                </div>
            }
        >
            <Head title={`Warning: ${warningLetter.subject}`} />

            <div className="max-w-full mx-auto py-4">
                <div className="bg-white rounded-lg shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden relative">
                    {/* Header Decorative Elements */}
                    <div className={`h-1.5 w-full ${style.accent}`} />

                    {/* Watermark/Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none flex items-center justify-center overflow-hidden">
                        <div className="text-[15rem] font-normal rotate-[-25deg] uppercase tracking-[0.5em] text-slate-900 whitespace-nowrap">
                            OFFICIAL RECORD • OFFICIAL RECORD • OFFICIAL RECORD
                        </div>
                    </div>

                    <div className="relative z-10 p-8 md:p-12">
                        {/* Compact Letter Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10 pb-8 border-b border-slate-50">
                            <div className="space-y-4 max-w-xl">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-normal uppercase tracking-normal border ${style.bg} ${style.text} ${style.border}`}>
                                        {warningLetter.type} Notice
                                    </span>
                                    <span className="text-[10px] font-normal text-slate-300 uppercase tracking-normal">Confidential</span>
                                </div>
                                <h1 className="text-4xl font-normal text-slate-900 tracking-normal uppercase leading-none">
                                    {warningLetter.subject}
                                </h1>
                                <div className="flex flex-wrap gap-x-6 gap-y-2">
                                    <div className="flex items-center gap-2 text-[11px] font-normal text-slate-400 uppercase tracking-normal">
                                        <FiCalendar className="w-3.5 h-3.5" />
                                        Issued: <span className="text-slate-800">{formatDate(warningLetter.sent_at || warningLetter.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-normal text-slate-400 uppercase tracking-normal">
                                        <FiShield className="w-3.5 h-3.5" />
                                        REF: <span className="text-slate-800">HR-{warningLetter.id.toString().padStart(6, '0')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <div className="text-[9px] font-normal text-slate-300 uppercase tracking-normal">Digital Stamp</div>
                                <div className="p-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center min-w-[110px]">
                                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-1 border border-slate-100">
                                        <FiShield className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <span className="text-[7px] font-normal text-slate-400 uppercase tracking-normal text-center leading-tight">Verified Digital<br />Document</span>
                                </div>
                            </div>
                        </div>

                        {/* Letter Content Area */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3 py-2 px-4 bg-slate-50 rounded-lg border border-slate-100 inline-flex">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-slate-100">
                                    <FiUser className="w-4 h-4 text-slate-400" />
                                </div>
                                <div>
                                    <div className="text-[9px] font-normal text-slate-400 uppercase tracking-normal leading-none">Recipient Name</div>
                                    <div className="text-sm font-normal text-slate-800 mt-0.5">{warningLetter.employee?.name}</div>
                                </div>
                            </div>

                            <div className="text-slate-700 leading-relaxed font-normal text-lg whitespace-pre-wrap max-w-3xl">
                                {warningLetter.content}
                            </div>

                            {/* Signatures & Actions */}
                            <div className="mt-16 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-end gap-10">
                                <div className="space-y-6">
                                    <div>
                                        <div className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-4">Issuing Authority</div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center font-normal text-sm text-white uppercase shadow-lg shadow-slate-200">
                                                {warningLetter.sender?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-normal text-slate-900">{warningLetter.sender?.name}</div>
                                                <div className="text-[10px] font-normal text-slate-400 uppercase">Management Representative</div>
                                            </div>
                                        </div>
                                    </div>

                                    {warningLetter.grievance && (
                                        <Link
                                            href={(userRole === 'admin' || userRole === 'hr' || userRole === 'manager')
                                                ? route('grievances.edit', warningLetter.grievance_id)
                                                : route('grievances.show', warningLetter.grievance_id)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-primary hover:text-white transition-all active:scale-95 border border-indigo-100"
                                        >
                                            <FiFileText className="w-3.5 h-3.5" />
                                            {(userRole === 'admin' || userRole === 'hr' || userRole === 'manager') ? 'Manage & Edit Case' : 'View Related Case'}
                                        </Link>
                                    )}
                                </div>

                                <div className="text-right flex flex-col items-end">
                                    <div className="w-48 h-12 border-b border-slate-200 flex items-end justify-center pb-1 italic font-serif text-slate-400 text-sm">
                                        Digitally Signed
                                    </div>
                                    <div className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mt-2 px-2">
                                        Authorized Signature
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compact Footer Note */}
                <div className="mt-6 flex items-center gap-4 py-4 px-6 bg-slate-100/50 rounded-lg border border-slate-200/60">
                    <div className="shrink-0 p-2 bg-slate-200 rounded-lg">
                        <FiShield className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-600 font-normal leading-relaxed">
                            <span className="font-normal text-slate-800 uppercase tracking-normal mr-2">Notice:</span>
                            This is a formal communication and constitutes part of your employment record. Please consult the employee handbook for policies regarding disciplinary actions and appeals processes.
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
