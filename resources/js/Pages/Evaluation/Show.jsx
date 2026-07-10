import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import Avatar from '@/Components/Avatar';
import {
    UserIcon,
    CalendarIcon,
    StarIcon,
    BuildingOfficeIcon,
    QueueListIcon,
    DocumentTextIcon,
    ArrowLeftIcon,
    PrinterIcon,
    ChatBubbleBottomCenterTextIcon,
    CheckBadgeIcon,
    SparklesIcon,
    IdentificationIcon,
    ChartBarIcon,
    BriefcaseIcon,
    ShieldCheckIcon,
    PencilSquareIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { useMemo } from 'react';

export default function Show({ evaluation }) {
    const { auth } = usePage().props;
    const user = auth?.user || {};

    const getScoreLabel = (score) => {
        if (score >= 4) return 'Outstanding';
        if (score >= 3) return 'Above Standards';
        if (score >= 2) return 'Meets Expectation';
        return 'Deficient';
    };

    const getScoreColor = (score) => {
        if (score >= 4) return 'text-emerald-700 bg-emerald-50 border-emerald-100';
        if (score >= 3) return 'text-indigo-700 bg-indigo-50 border-indigo-100';
        if (score >= 2) return 'text-amber-700 bg-amber-50 border-amber-100';
        return 'text-rose-700 bg-rose-50 border-rose-100';
    };

    const getMonthName = (monthNum) => {
        if (!monthNum) return '';
        if (isNaN(monthNum)) return monthNum;
        const date = new Date();
        date.setMonth(monthNum - 1);
        return date.toLocaleString('default', { month: 'long' });
    };

    const groupedCriteria = useMemo(() => {
        const groups = {
            'Attitude': [
                'Service Quality', 'Communication Skills', 'Cleanliness',
                'Teamwork', 'Leadership', 'Professional Behavior', 'Work Under Pressure'
            ],
            'Responsibility': [
                'Attendance Punctuality', 'Accuracy in Cash Handling', 'Following Company Procedures',
                'Accountability for Transactions', 'Work on Deadline', 'Willingness to take more responsibility',
                'Open to feedback'
            ],
            'Competency': [
                'Creativity', 'Speed & Efficiency at Checkout', 'Accuracy in Transactions',
                'Product Knowledge', 'Handling Customer Complaints', 'Use of POS System',
                'Productivity', 'Initiative', 'Effective Problem Solving'
            ]
        };
        return groups;
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this evaluation? This action cannot be undone.')) {
            router.delete(route('evaluations.destroy', evaluation.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-normal text-slate-900 tracking-normal leading-none">Evaluation Insight</h2>
                    <p className="text-[9px] text-slate-400 font-normal uppercase tracking-[0.2em] mt-1.5">Employee Performance Report</p>
                </div>
            }
        >
            <Head title={`Evaluation - ${evaluation.employee?.name}`} />

            <div className="py-4 bg-slate-50/50 min-h-screen print:bg-white print:p-0">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-5 space-y-4 print:max-w-full">
                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-4 print:hidden">
                        <div className="flex items-center gap-3">
                            <Link
                                href={route('evaluations.index')}
                                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm active:scale-95 group"
                            >
                                <ArrowLeftIcon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                            </Link>
                            <div>
                                <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal leading-none mb-1">Operational Audit Trace</p>
                                <h1 className="text-sm font-normal text-slate-900 uppercase tracking-normal flex items-center gap-2">
                                    REF #{evaluation.id.toString().padStart(6, '0')}
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-normal text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95 uppercase tracking-normal"
                            >
                                <PrinterIcon className="w-3.5 h-3.5" />
                                Print
                            </button>

                            {['admin', 'hr', 'manager'].includes(user.role) && (
                                <Link
                                    href={route('evaluations.edit', evaluation.id)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-normal hover:bg-primary transition-all shadow-sm active:scale-95 uppercase tracking-normal"
                                >
                                    <PencilSquareIcon className="w-3.5 h-3.5" />
                                    Edit Record
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Master Profile Card - Proper Identity */}
                    <div className="bg-white rounded-[8px] border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none relative">
                        <div className="grid grid-cols-1 md:grid-cols-12">
                            {/* Left Side: Identity */}
                            <div className="md:col-span-8 p-4 flex flex-col md:flex-row items-center md:items-start gap-4 md:border-r border-slate-100">
                                <div className="relative">
                                    <Avatar
                                        src={evaluation.employee?.employee_image || evaluation.employee?.image}
                                        name={evaluation.employee?.name}
                                        size="xl"
                                        className="w-16 h-16 ring-2 ring-slate-50 shadow-inner"
                                    />
                                    <div className="absolute -bottom-0.5 -right-0.5 bg-indigo-600 p-0.5 rounded-[4px] border border-white shadow-lg">
                                        <ShieldCheckIcon className="w-3 h-3 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1 text-center md:text-left pt-0.5">
                                    <p className="text-[8px] font-normal text-slate-400 uppercase tracking-normal mb-1 flex items-center justify-center md:justify-start gap-1.5">
                                        Personnel Identity Profile
                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                        {getMonthName(evaluation.month)} {evaluation.year}
                                    </p>
                                    <h1 className="text-lg font-normal text-slate-900 tracking-normal leading-tight uppercase">{evaluation.employee?.name}</h1>
                                    <p className="text-slate-500 font-normal uppercase text-[9px] tracking-normal mt-0.5 flex items-center justify-center md:justify-start gap-2">
                                        {evaluation.employee?.designation || 'Specialist Staff'}
                                    </p>

                                    <div className="mt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
                                        <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-50 rounded-[4px] border border-slate-100">
                                            <BuildingOfficeIcon className="w-2.5 h-2.5 text-indigo-600" />
                                            <p className="text-[8px] font-normal text-slate-700 uppercase">{evaluation.employee?.company?.name || 'Main Hub'}</p>
                                        </div>
                                        <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-50 rounded-[4px] border border-slate-100">
                                            <QueueListIcon className="w-2.5 h-2.5 text-indigo-600" />
                                            <p className="text-[8px] font-normal text-slate-700 uppercase">{evaluation.employee?.department?.name || 'Operations'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Overall Status */}
                            <div className="md:col-span-4 p-4 bg-slate-50/30 flex flex-col items-center justify-center text-center">
                                <div className="p-4 bg-white rounded-[8px] shadow-sm border border-slate-100 w-full relative">
                                    <p className="text-[8px] font-normal text-slate-400 uppercase tracking-normal mb-1">Achievement Index</p>
                                    <div className="text-3xl font-normal text-slate-900 tracking-normal">{evaluation.overall_score}<span className="text-lg text-slate-300 ml-1">%</span></div>
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[8px] font-normal uppercase tracking-normal mt-2">
                                        <SparklesIcon className="w-2.5 h-2.5" />
                                        Performance Verified
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Main Matrix Area */}
                        <div className="lg:col-span-8 space-y-4">
                            {Object.entries(groupedCriteria).map(([group, items], groupIndex) => (
                                <div key={group} className="bg-white rounded-[8px] border border-slate-200 shadow-sm overflow-hidden group">
                                    <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-normal shadow-lg">
                                                0{groupIndex + 1}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-normal text-slate-800 uppercase tracking-normal">{group} Assessment</h3>
                                                <p className="text-[10px] text-slate-400 font-normal uppercase tracking-normal">Performance Metrics</p>
                                            </div>
                                        </div>
                                        <ChartBarIcon className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {items.map((criterion) => {
                                            const score = evaluation.criteria_scores[criterion] || 0;
                                            return (
                                                <div key={criterion} className="p-3 bg-slate-50/50 rounded-[8px] border border-slate-100 flex items-center justify-between hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all group/item">
                                                    <span className="text-xs font-normal text-slate-600 group-hover/item:text-slate-900 transition-colors">{criterion}</span>
                                                    <div className={`px-2 py-1 rounded-[8px] text-[8px] font-normal uppercase tracking-normal border shadow-sm ${getScoreColor(score)}`}>
                                                        {getScoreLabel(score)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Sidebar Sections */}
                        <div className="lg:col-span-4 space-y-4">
                            {/* Feedback Card - Proper */}
                            <div className="bg-white rounded-[8px] border border-slate-200 shadow-sm p-5 space-y-5">
                                <h3 className="text-[9px] font-normal text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="p-1.5 bg-indigo-50 rounded-[8px]">
                                        <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    Managerial Insight
                                </h3>

                                {evaluation.comments ? (
                                    <div className="p-6 bg-slate-50 rounded-lg border-l-4 border-l-indigo-600 border border-slate-100 relative">
                                        <p className="text-sm text-slate-700 leading-relaxed font-normal italic">
                                            "{evaluation.comments}"
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-6 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center">
                                        <p className="text-xs font-normal text-slate-400 uppercase tracking-normal">No Feedback Logged</p>
                                    </div>
                                )}

                                <div className="pt-5 border-t border-slate-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">Growth Potential</span>
                                        <span className={`text-[9px] font-normal uppercase tracking-normal px-2 py-0.5 rounded-[8px] ${evaluation.overall_score >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                            {evaluation.overall_score >= 90 ? 'High' : evaluation.overall_score >= 75 ? 'Stable' : 'Review'}
                                        </span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-100 shadow-inner">
                                        <div
                                            className="h-full bg-slate-800 rounded-full transition-all duration-[1.5s]"
                                            style={{ width: `${evaluation.overall_score}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Authorization Card - Proper */}
                            <div className="bg-slate-900 rounded-[8px] shadow-xl p-6 space-y-6 relative overflow-hidden group">
                                <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500">
                                    <CheckBadgeIcon className="w-32 h-32 text-white" />
                                </div>

                                <h3 className="text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3 relative z-10">
                                    <ShieldCheckIcon className="w-4 h-4 text-indigo-400" />
                                    Authorized Audit
                                </h3>

                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="p-3 bg-white/10 rounded-lg border border-white/10 text-white shadow-lg">
                                        <IdentificationIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-base font-normal text-white">{evaluation.evaluator?.name || 'Admin Auditor'}</p>
                                        <p className="text-[10px] font-normal text-indigo-400 uppercase tracking-normal mt-1">Management Division</p>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-white/10 text-[10px] text-slate-400 leading-relaxed font-normal uppercase tracking-normal relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckBadgeIcon className="w-4 h-4 text-emerald-400" />
                                        <span className="text-emerald-400">Digital Seal Verified</span>
                                    </div>
                                    Official performance record stored in the central Human Resources database.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    nav, header, footer, button, .print\\:hidden {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                    }
                    .max-w-6xl {
                        max-width: 100% !important;
                    }
                    .rounded-\\[1\\.5rem\\], .rounded-lg {
                        border-radius: 0.5rem !important;
                    }
                    .shadow-md, .shadow-xl {
                        box-shadow: none !important;
                        border: 1px solid #e2e8f0 !important;
                    }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
