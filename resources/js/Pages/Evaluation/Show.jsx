import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router, useForm } from '@inertiajs/react';
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
    TrashIcon,
    CurrencyRupeeIcon,
    ArrowTrendingUpIcon,
    ExclamationTriangleIcon,
    AcademicCapIcon,
    LockClosedIcon,
    CheckCircleIcon,
    ClockIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Show({ evaluation, historicalEvaluations = [], criteria = [], userRole, userEmployeeId }) {
    const { auth } = usePage().props;
    const user = auth?.user || {};

    const [activeTab, setActiveTab] = useState('competencies'); // competencies, goals, actions, history
    const [showSelfModal, setShowSelfModal] = useState(false);
    const [showAckModal, setShowAckModal] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [approveModalOpen, setApproveModalOpen] = useState(false);

    const isEmployee = userEmployeeId === evaluation.employee_id || user.id === evaluation.employee?.user_id;
    const isHrOrAdmin = ['admin', 'hr'].includes(userRole || user.role);

    // Self Assessment Form
    const selfForm = useForm({
        self_scores: evaluation.self_scores || {},
        self_comments: evaluation.self_comments || '',
        achievements: evaluation.achievements || '',
        development_needs: evaluation.development_needs || '',
    });

    // Acknowledgment Form
    const ackForm = useForm({
        employee_acknowledgment_notes: '',
    });

    // Final Approval Form
    const approvalForm = useForm({
        apply_increment: true,
        apply_promotion: true,
    });

    const getScoreLabel = (score) => {
        if (score >= 4) return 'Outstanding';
        if (score >= 3) return 'Above Standards';
        if (score >= 2) return 'Meets Expectation';
        if (score >= 1) return 'Needs Improvement';
        return 'Not Rated';
    };

    const getScoreColor = (score) => {
        if (score >= 4) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
        if (score >= 3) return 'text-indigo-700 bg-indigo-50 border-indigo-200';
        if (score >= 2) return 'text-amber-700 bg-amber-50 border-amber-200';
        if (score >= 1) return 'text-rose-700 bg-rose-50 border-rose-200';
        return 'text-slate-500 bg-slate-50 border-slate-200';
    };

    const getMonthName = (monthNum) => {
        if (!monthNum) return '';
        if (isNaN(monthNum)) return monthNum;
        const date = new Date();
        date.setMonth(monthNum - 1);
        return date.toLocaleString('default', { month: 'long' });
    };

    const formatINR = (val) => {
        if (val === null || val === undefined || isNaN(val)) return '₹0';
        return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    };

    const groupedCriteria = useMemo(() => {
        const groups = {
            'Attitude & Professionalism': [
                'Service Quality', 'Communication Skills', 'Cleanliness',
                'Teamwork', 'Leadership', 'Professional Behavior', 'Work Under Pressure'
            ],
            'Responsibility & Compliance': [
                'Attendance Punctuality', 'Accuracy in Cash Handling', 'Following Company Procedures',
                'Accountability for Transactions', 'Work on Deadline', 'Willingness to take more responsibility',
                'Open to feedback'
            ],
            'Competency & Technical Skills': [
                'Creativity', 'Speed & Efficiency at Checkout', 'Accuracy in Transactions',
                'Product Knowledge', 'Handling Customer Complaints', 'Use of POS System',
                'Productivity', 'Initiative', 'Effective Problem Solving'
            ]
        };
        return groups;
    }, []);

    const workflowSteps = [
        { key: 'created', label: 'Cycle Created', completed: true },
        { key: 'self_assessment', label: 'Self Assessment', completed: ['manager_review', 'calibration', 'acknowledged', 'approved'].includes(evaluation.status) },
        { key: 'manager_review', label: 'Manager Review', completed: ['calibration', 'acknowledged', 'approved'].includes(evaluation.status) },
        { key: 'acknowledged', label: 'Employee Sign-off', completed: ['acknowledged', 'approved'].includes(evaluation.status) || !!evaluation.employee_acknowledged_at },
        { key: 'approved', label: 'Approved & Linked', completed: evaluation.status === 'approved' || evaluation.is_locked },
    ];

    const handlePrint = () => {
        window.print();
    };

    const handleDelete = () => {
        setDeleteModalOpen(true);
    };

    const confirmDeleteAction = () => {
        router.delete(route('evaluations.destroy', evaluation.id), {
            onSuccess: () => setDeleteModalOpen(false),
        });
    };

    const submitSelfAssessment = (e) => {
        e.preventDefault();
        selfForm.post(route('evaluations.self-assessment', evaluation.id), {
            onSuccess: () => setShowSelfModal(false)
        });
    };

    const submitAcknowledgment = (e) => {
        e.preventDefault();
        ackForm.post(route('evaluations.acknowledge', evaluation.id), {
            onSuccess: () => setShowAckModal(false)
        });
    };

    const submitApproval = (e) => {
        e.preventDefault();
        setApproveModalOpen(true);
    };

    const confirmApprovalAction = () => {
        approvalForm.post(route('evaluations.approve-close', evaluation.id), {
            onSuccess: () => setApproveModalOpen(false),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Appraisal - ${evaluation.employee?.name}`} />

            <div className="py-4 bg-slate-50/50 min-h-screen print:bg-white print:p-0">
                <div className="w-full px-4 sm:px-6 lg:px-8 space-y-4 print:max-w-full">
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
                                <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal leading-none mb-1">Performance Appraisal Cycle</p>
                                <h1 className="text-sm font-normal text-slate-900 uppercase tracking-normal flex items-center gap-2">
                                    REF #{evaluation.id.toString().padStart(6, '0')}
                                    {evaluation.is_locked && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-normal uppercase bg-slate-800 text-white">
                                            <LockClosedIcon className="w-2.5 h-2.5" /> Locked Record
                                        </span>
                                    )}
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

                            {/* Self Assessment Button */}
                            {isEmployee && !evaluation.is_locked && (
                                <button
                                    onClick={() => setShowSelfModal(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-normal hover:bg-indigo-700 transition-all shadow-sm active:scale-95 uppercase tracking-normal"
                                >
                                    <SparklesIcon className="w-3.5 h-3.5" />
                                    {evaluation.self_scores ? 'Update Self-Assessment' : 'Fill Self-Assessment'}
                                </button>
                            )}

                            {/* Acknowledgment Button */}
                            {isEmployee && !evaluation.employee_acknowledged_at && (
                                <button
                                    onClick={() => setShowAckModal(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-normal hover:bg-emerald-700 transition-all shadow-sm active:scale-95 uppercase tracking-normal"
                                >
                                    <CheckBadgeIcon className="w-3.5 h-3.5" />
                                    Sign & Acknowledge
                                </button>
                            )}

                            {/* HR Approval & Closure */}
                            {isHrOrAdmin && !evaluation.is_locked && (
                                <button
                                    onClick={submitApproval}
                                    disabled={approvalForm.processing}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-normal hover:bg-emerald-600 transition-all shadow-sm active:scale-95 uppercase tracking-normal"
                                >
                                    <ShieldCheckIcon className="w-3.5 h-3.5" />
                                    Approve & Close
                                </button>
                            )}

                            {isHrOrAdmin && !evaluation.is_locked && (
                                <Link
                                    href={route('evaluations.edit', evaluation.id)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-normal hover:bg-amber-600 transition-all shadow-sm active:scale-95 uppercase tracking-normal"
                                >
                                    <PencilSquareIcon className="w-3.5 h-3.5" />
                                    Edit
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Workflow Stepper Bar */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                            {workflowSteps.map((step, idx) => (
                                <div key={step.key} className="flex items-center gap-2 flex-1 w-full md:w-auto">
                                    <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-normal transition-all ${step.completed
                                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                                        }`}>
                                        {step.completed ? <CheckCircleIcon className="w-4 h-4" /> : idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-[10px] font-normal uppercase tracking-normal ${step.completed ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                                            {step.label}
                                        </p>
                                    </div>
                                    {idx < workflowSteps.length - 1 && (
                                        <div className="hidden md:block flex-1 h-0.5 bg-slate-200 mx-2"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Master Profile Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
                        <div className="grid grid-cols-1 md:grid-cols-12">
                            {/* Left Side: Identity & Cycle */}
                            <div className="md:col-span-8 p-5 flex flex-col md:flex-row items-center md:items-start gap-5 md:border-r border-slate-100">
                                <div className="relative">
                                    <Avatar
                                        src={evaluation.employee?.employee_image || evaluation.employee?.image}
                                        name={evaluation.employee?.name}
                                        size="xl"
                                        className="w-20 h-20 ring-4 ring-slate-50 shadow"
                                    />
                                    <div className="absolute -bottom-1 -right-1 bg-indigo-600 p-1 rounded-full border-2 border-white shadow">
                                        <ShieldCheckIcon className="w-3.5 h-3.5 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1 text-center md:text-left pt-0.5">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1.5">
                                        <span className="text-[9px] font-normal text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase">
                                            {evaluation.cycle_type ? evaluation.cycle_type.replace('_', ' ') : 'Annual'} Appraisal
                                        </span>
                                        <span className="text-[9px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">
                                            {getMonthName(evaluation.month)} {evaluation.year}
                                        </span>
                                        {evaluation.pip_required && (
                                            <span className="text-[9px] font-normal text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                                                <ExclamationTriangleIcon className="w-3 h-3" /> PIP Enforced
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-xl font-normal text-slate-900 uppercase tracking-tight">{evaluation.employee?.name}</h1>
                                    <p className="text-slate-500 font-normal uppercase text-[10px] tracking-normal mt-0.5">
                                        Code: {evaluation.employee?.employee_code || '-'} &bull; {evaluation.employee?.designation || 'Staff'}
                                    </p>

                                    <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-2">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                            <BuildingOfficeIcon className="w-3.5 h-3.5 text-indigo-600" />
                                            <p className="text-[9px] font-normal text-slate-700 uppercase">{evaluation.employee?.company?.name || 'Main Unit'}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                            <QueueListIcon className="w-3.5 h-3.5 text-indigo-600" />
                                            <p className="text-[9px] font-normal text-slate-700 uppercase">{evaluation.employee?.department?.name || 'Operations'}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                                            <CurrencyRupeeIcon className="w-3.5 h-3.5 text-emerald-600" />
                                            <p className="text-[9px] font-normal text-emerald-700 uppercase">
                                                Current Base: {formatINR(evaluation.employee?.basic_salary)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Score & Status Card */}
                            <div className="md:col-span-4 p-5 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                                <div className="p-5 bg-white rounded-xl shadow-sm border border-slate-200 w-full relative">
                                    <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-1">Final Performance Score</p>
                                    <div className="text-4xl font-normal text-slate-900 tracking-tight">{evaluation.overall_score}<span className="text-xl text-slate-300 ml-1">%</span></div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[9px] font-normal uppercase tracking-normal mt-2.5">
                                        <SparklesIcon className="w-3 h-3" />
                                        {evaluation.overall_score >= 80 ? 'Top Performer' : evaluation.overall_score >= 60 ? 'Satisfactory' : 'Needs Calibration'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-slate-200 gap-6 text-[11px] font-normal uppercase tracking-normal">
                        <button
                            onClick={() => setActiveTab('competencies')}
                            className={`pb-2.5 border-b-2 transition-all ${activeTab === 'competencies' ? 'border-primary text-primary font-medium' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            Competencies & Ratings
                        </button>
                        <button
                            onClick={() => setActiveTab('goals')}
                            className={`pb-2.5 border-b-2 transition-all ${activeTab === 'goals' ? 'border-primary text-primary font-medium' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            Goals & Achievements
                        </button>
                        <button
                            onClick={() => setActiveTab('actions')}
                            className={`pb-2.5 border-b-2 transition-all ${activeTab === 'actions' ? 'border-primary text-primary font-medium' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            Outcomes & Increments (INR)
                        </button>
                        {historicalEvaluations.length > 0 && (
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`pb-2.5 border-b-2 transition-all ${activeTab === 'history' ? 'border-primary text-primary font-medium' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                Appraisal History ({historicalEvaluations.length})
                            </button>
                        )}
                    </div>

                    {/* Tab 1: Competencies Matrix */}
                    {activeTab === 'competencies' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            <div className="lg:col-span-8 space-y-4">
                                {Object.entries(groupedCriteria).map(([group, items], groupIndex) => (
                                    <div key={group} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-normal shadow">
                                                    0{groupIndex + 1}
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-normal text-slate-900 uppercase tracking-normal">{group}</h3>
                                                    <p className="text-[9px] text-slate-400 font-normal uppercase tracking-normal">Standardized 4-Point Rating Scale</p>
                                                </div>
                                            </div>
                                            <ChartBarIcon className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {items.map((criterion) => {
                                                const mgrScore = evaluation.criteria_scores?.[criterion] || 0;
                                                const selfScore = evaluation.self_scores?.[criterion] || null;

                                                return (
                                                    <div key={criterion} className="p-3 bg-slate-50/50 rounded-lg border border-slate-100 flex flex-col justify-between hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all gap-2">
                                                        <span className="text-[11px] font-normal text-slate-700">{criterion}</span>
                                                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                                                            {selfScore !== null && (
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-[8px] uppercase text-slate-400">Self:</span>
                                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-normal border ${getScoreColor(selfScore)}`}>
                                                                        {getScoreLabel(selfScore)} ({selfScore})
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1 ml-auto">
                                                                <span className="text-[8px] uppercase text-slate-400">Mgr:</span>
                                                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-normal border ${getScoreColor(mgrScore)}`}>
                                                                    {getScoreLabel(mgrScore)} ({mgrScore})
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Sidebar: Feedback & Audit */}
                            <div className="lg:col-span-4 space-y-4">
                                {/* Managerial Feedback */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                                    <h3 className="text-[10px] font-normal text-slate-400 uppercase tracking-normal flex items-center gap-2">
                                        <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-indigo-600" />
                                        Managerial Assessment & Notes
                                    </h3>
                                    {evaluation.comments ? (
                                        <div className="p-4 bg-slate-50 rounded-lg border-l-4 border-l-indigo-600 border border-slate-100">
                                            <p className="text-xs text-slate-700 leading-relaxed font-normal italic">
                                                "{evaluation.comments}"
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center">
                                            <p className="text-[10px] font-normal text-slate-400 uppercase">No Manager Feedback Logged</p>
                                        </div>
                                    )}
                                </div>

                                {/* Employee Sign-off Status */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                                    <h3 className="text-[10px] font-normal text-slate-400 uppercase tracking-normal flex items-center gap-2">
                                        <CheckBadgeIcon className="w-4 h-4 text-emerald-600" />
                                        Employee Acknowledgment
                                    </h3>
                                    {evaluation.employee_acknowledged_at ? (
                                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-normal">
                                                <CheckCircleIcon className="w-4 h-4" />
                                                Acknowledged on {new Date(evaluation.employee_acknowledged_at).toLocaleDateString('en-IN')}
                                            </div>
                                            {evaluation.employee_acknowledgment_notes && (
                                                <p className="text-[10px] text-emerald-800 italic">
                                                    "{evaluation.employee_acknowledgment_notes}"
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-2 text-amber-700 text-xs">
                                            <ClockIcon className="w-4 h-4" />
                                            Pending Employee Sign-off
                                        </div>
                                    )}
                                </div>

                                {/* Audit Seal */}
                                <div className="bg-slate-900 text-white rounded-xl shadow-lg p-5 space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-normal">
                                        <ShieldCheckIcon className="w-4 h-4 text-indigo-400" />
                                        Appraisal Audit Record
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-300">Evaluated By: <span className="text-white">{evaluation.evaluator?.name || 'Authorized Lead'}</span></p>
                                        <p className="text-xs text-slate-300 mt-1">Approved By: <span className="text-white">{evaluation.approver?.name || (evaluation.is_locked ? 'HR Admin' : 'Pending')}</span></p>
                                    </div>
                                    <div className="pt-3 border-t border-slate-800 text-[9px] text-slate-400 uppercase">
                                        Encrypted record registered in central Company HRMS.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Goals & Achievements */}
                    {activeTab === 'goals' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Achievements */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                                <h3 className="text-xs font-normal text-slate-900 uppercase tracking-normal flex items-center gap-2">
                                    <SparklesIcon className="w-4 h-4 text-indigo-600" />
                                    Employee Key Achievements & Milestones
                                </h3>
                                {evaluation.achievements ? (
                                    <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-700 leading-relaxed whitespace-pre-line border border-slate-100">
                                        {evaluation.achievements}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No specific achievements recorded during this cycle.</p>
                                )}
                            </div>

                            {/* Development Needs */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                                <h3 className="text-xs font-normal text-slate-900 uppercase tracking-normal flex items-center gap-2">
                                    <AcademicCapIcon className="w-4 h-4 text-amber-600" />
                                    Identified Development & Training Needs
                                </h3>
                                {evaluation.development_needs ? (
                                    <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-700 leading-relaxed whitespace-pre-line border border-slate-100">
                                        {evaluation.development_needs}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No development gaps identified.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Approved Outcomes & Action Linkage */}
                    {activeTab === 'actions' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Salary Increment in INR */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2 group hover:border-emerald-200 transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">Salary Increment</span>
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                        <CurrencyRupeeIcon className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-xl font-normal text-slate-900">
                                    {evaluation.increment_recommended > 0 ? (
                                        <>
                                            {formatINR(evaluation.increment_recommended)}
                                            {evaluation.increment_percentage > 0 && (
                                                <span className="text-xs text-emerald-600 font-normal ml-1.5">
                                                    (+{evaluation.increment_percentage}%)
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-slate-400 text-sm">No Increment Linked</span>
                                    )}
                                </div>
                                <p className="text-[9px] text-slate-400 uppercase">Directly updates Basic Salary in INR upon approval</p>
                            </div>

                            {/* Promotion */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2 group hover:border-indigo-200 transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">Promotion Elevation</span>
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <ArrowTrendingUpIcon className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-sm font-normal text-slate-900">
                                    {evaluation.promotion_recommended ? (
                                        <span className="text-indigo-600 font-medium">{evaluation.recommended_designation || 'Promoted'}</span>
                                    ) : (
                                        <span className="text-slate-400">Maintains Current Role</span>
                                    )}
                                </div>
                                <p className="text-[9px] text-slate-400 uppercase">Elevates job title and responsibilities</p>
                            </div>

                            {/* PIP Tracker */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2 group hover:border-rose-200 transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">PIP Monitoring</span>
                                    <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                                        <ExclamationTriangleIcon className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-sm font-normal text-slate-900">
                                    {evaluation.pip_required ? (
                                        <span className="text-rose-600 font-medium">30-Day PIP Plan Active</span>
                                    ) : (
                                        <span className="text-emerald-600">Standard Standing</span>
                                    )}
                                </div>
                                <p className="text-[9px] text-slate-400 uppercase">{evaluation.pip_notes || 'Auto-flagged for scores below 50%'}</p>
                            </div>

                            {/* Training Recommendations */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2 group hover:border-purple-200 transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">Training Assigned</span>
                                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                        <AcademicCapIcon className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-sm font-normal text-slate-900">
                                    {evaluation.training_recommended && evaluation.training_recommended.length > 0 ? (
                                        <span>{evaluation.training_recommended.length} Modules Recommended</span>
                                    ) : (
                                        <span className="text-slate-400">No Training Required</span>
                                    )}
                                </div>
                                <p className="text-[9px] text-slate-400 uppercase">Links to LMS Academy</p>
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Historical Records */}
                    {activeTab === 'history' && historicalEvaluations.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 text-[9px] font-normal text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-5 py-3">Period</th>
                                        <th className="px-5 py-3">Cycle</th>
                                        <th className="px-5 py-3 text-center">Score</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {historicalEvaluations.map((h) => (
                                        <tr key={h.id} className="hover:bg-slate-50">
                                            <td className="px-5 py-3 font-normal text-slate-800">
                                                {getMonthName(h.month)} {h.year}
                                            </td>
                                            <td className="px-5 py-3 capitalize text-slate-500">{h.cycle_type || 'Monthly'}</td>
                                            <td className="px-5 py-3 text-center font-normal">{h.overall_score}%</td>
                                            <td className="px-5 py-3 capitalize">{h.status}</td>
                                            <td className="px-5 py-3 text-right">
                                                <Link href={route('evaluations.show', h.id)} className="text-primary hover:underline text-xs">
                                                    View Record
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Self-Assessment Modal */}
            {showSelfModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-base font-normal text-slate-900">Step 15: Employee Self-Assessment</h3>
                            <button onClick={() => setShowSelfModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitSelfAssessment} className="space-y-4">
                            <div>
                                <label className="block text-xs text-slate-500 uppercase mb-1">Key Achievements & Highlights</label>
                                <textarea
                                    value={selfForm.data.achievements}
                                    onChange={(e) => selfForm.setData('achievements', e.target.value)}
                                    className="w-full rounded-lg border-slate-200 text-xs"
                                    rows={3}
                                    placeholder="List your accomplishments, target achievements, and client feedback..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 uppercase mb-1">Development Goals & Needs</label>
                                <textarea
                                    value={selfForm.data.development_needs}
                                    onChange={(e) => selfForm.setData('development_needs', e.target.value)}
                                    className="w-full rounded-lg border-slate-200 text-xs"
                                    rows={3}
                                    placeholder="Areas where you would like training or support..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 uppercase mb-1">Self Assessment Comments</label>
                                <textarea
                                    value={selfForm.data.self_comments}
                                    onChange={(e) => selfForm.setData('self_comments', e.target.value)}
                                    className="w-full rounded-lg border-slate-200 text-xs"
                                    rows={2}
                                    placeholder="Any additional feedback..."
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowSelfModal(false)}
                                    className="px-4 py-2 bg-slate-100 rounded-lg text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={selfForm.processing}
                                    className="px-4 py-2 bg-primary text-white rounded-lg text-xs"
                                >
                                    Submit Self Assessment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Acknowledgment Modal */}
            {showAckModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-base font-normal text-slate-900">Step 20: Employee Acknowledgment</h3>
                            <button onClick={() => setShowAckModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitAcknowledgment} className="space-y-4">
                            <p className="text-xs text-slate-600">
                                I confirm that I have reviewed this performance appraisal evaluation with my manager and understand the ratings, feedback, and action plans.
                            </p>
                            <div>
                                <label className="block text-xs text-slate-500 uppercase mb-1">Employee Comments / Clarification</label>
                                <textarea
                                    value={ackForm.data.employee_acknowledgment_notes}
                                    onChange={(e) => ackForm.setData('employee_acknowledgment_notes', e.target.value)}
                                    className="w-full rounded-lg border-slate-200 text-xs"
                                    rows={3}
                                    placeholder="Optional notes or acknowledgment message..."
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowAckModal(false)}
                                    className="px-4 py-2 bg-slate-100 rounded-lg text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={ackForm.processing}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs"
                                >
                                    Sign & Confirm
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                show={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDeleteAction}
                title="Delete Performance Appraisal"
                message="Are you sure you want to delete this evaluation? This action cannot be undone."
                confirmText="Delete Appraisal"
                type="danger"
            />

            <ConfirmationModal
                show={approveModalOpen}
                onClose={() => setApproveModalOpen(false)}
                onConfirm={confirmApprovalAction}
                title="Approve Appraisal & Link Changes"
                message="Approve this appraisal? Approved salary increments in INR and promotions will automatically update the employee profile."
                confirmText="Approve & Apply Changes"
                type="success"
            />
        </AuthenticatedLayout>
    );
}
