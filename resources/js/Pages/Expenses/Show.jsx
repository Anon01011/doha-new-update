import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    FiArrowLeft, FiCheckCircle, FiXCircle, FiRotateCcw,
    FiFileText, FiDollarSign, FiCalendar, FiTag, FiCreditCard,
    FiShield, FiUser, FiPaperclip, FiAlertTriangle, FiCheck,
    FiClock, FiDownload, FiExternalLink, FiPrinter
} from 'react-icons/fi';
import Avatar from '@/Components/Avatar';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Show({
    claim,
    userRole,
    userEmployeeId,
    applicantRole = 'employee',
    isManagerOrAdminApplicant = false,
    canManagerApprove = false,
    approvalReason = ''
}) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [managerModal, setManagerModal] = useState({ open: false, type: 'approve' }); // approve, reject, return
    const [financeModal, setFinanceModal] = useState({ open: false, type: 'approve' }); // approve, reject
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);

    const isEmployee = userEmployeeId === claim.employee_id;
    const isFinanceOrAdmin = ['admin', 'hr', 'finance'].includes(userRole);

    // Manager Review Form
    const managerForm = useForm({
        manager_comments: '',
        comments: '', // For return
    });

    // Finance Review Form
    const financeForm = useForm({
        reimbursement_method: claim.reimbursement_method || 'payroll',
        finance_comments: '',
        tax_amount: claim.tax_amount || '',
    });

    // Payment Processing Form
    const paymentForm = useForm({
        payment_reference: '',
        paid_at: new Date().toISOString().split('T')[0],
    });

    const formatINR = (val) => {
        return '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    };

    const handleManagerAction = (type) => {
        if (type === 'approve') {
            managerForm.post(route('expenses.manager-approve', claim.id), {
                onSuccess: () => setManagerModal({ open: false, type: 'approve' }),
            });
        } else if (type === 'reject') {
            managerForm.post(route('expenses.manager-reject', claim.id), {
                onSuccess: () => setManagerModal({ open: false, type: 'reject' }),
            });
        } else if (type === 'return') {
            managerForm.post(route('expenses.return', claim.id), {
                onSuccess: () => setManagerModal({ open: false, type: 'return' }),
            });
        }
    };

    const handleFinanceAction = (type) => {
        if (type === 'approve') {
            financeForm.post(route('expenses.finance-approve', claim.id), {
                onSuccess: () => setFinanceModal({ open: false, type: 'approve' }),
            });
        } else if (type === 'reject') {
            financeForm.post(route('expenses.finance-reject', claim.id), {
                onSuccess: () => setFinanceModal({ open: false, type: 'reject' }),
            });
        }
    };

    const handleProcessPayment = (e) => {
        e.preventDefault();
        paymentForm.post(route('expenses.process-payment', claim.id), {
            onSuccess: () => setPaymentModalOpen(false),
        });
    };

    const handleSubmitDraft = () => {
        router.post(route('expenses.submit', claim.id));
    };

    // Stepper Stages
    const stages = [
        { key: 'draft', label: 'Draft' },
        { key: 'submitted', label: 'Manager Review' },
        { key: 'manager_approved', label: 'Finance Review' },
        { key: 'finance_approved', label: 'Reimbursement' },
        { key: 'paid', label: 'Paid / Archived' },
    ];

    const getStageIndex = () => {
        if (claim.status === 'draft' || claim.status === 'returned_to_employee') return 0;
        if (claim.status === 'submitted') return 1;
        if (claim.status === 'manager_approved') return 2;
        if (claim.status === 'finance_approved') {
            return claim.reimbursement_status === 'pending' ? 3 : 4;
        }
        if (claim.status === 'paid' || claim.reimbursement_status === 'included_in_payroll') return 4;
        return 1;
    };

    const currentStageIdx = getStageIndex();

    return (
        <AuthenticatedLayout>
            <Head title={`Claim - ${claim.claim_number}`} />

            {/* In-Page Header */}
            <div className="w-full bg-white border-b border-slate-100 px-4 lg:px-8 py-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('expenses.index')}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Claim #{claim.claim_number}</h1>
                                {claim.policy_violation_flag && (
                                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[9px] font-semibold flex items-center gap-1">
                                        <FiAlertTriangle className="w-3 h-3" /> Policy Warning
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 font-normal mt-0.5">Submitted on {claim.created_at ? new Date(claim.created_at).toLocaleDateString('en-IN') : '-'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {inArray(claim.status, ['draft', 'returned_to_employee']) && isEmployee && (
                            <button
                                onClick={handleSubmitDraft}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-primary text-white text-xs rounded-lg shadow-sm font-medium transition-all"
                            >
                                <FiCheckCircle className="w-4 h-4" />
                                Submit Claim
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">

                {/* Workflow Stepper */}
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto no-scrollbar">
                        <div className="min-w-[460px] flex items-center justify-between relative py-1 px-4">
                            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 z-0"></div>
                            <div
                                className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-500 z-0"
                                style={{ width: `${(currentStageIdx / (stages.length - 1)) * 88}%` }}
                            ></div>

                            {stages.map((stg, idx) => {
                                const isDone = idx <= currentStageIdx;
                                const isCurrent = idx === currentStageIdx;
                                return (
                                    <div key={stg.key} className="relative z-10 flex flex-col items-center">
                                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${isDone ? 'bg-primary text-white ring-4 ring-primary/10 shadow-md' : 'bg-white border-2 border-slate-200 text-slate-400'
                                            }`}>
                                            {isDone ? <FiCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : idx + 1}
                                        </div>
                                        <span className={`text-[9px] sm:text-[10px] font-normal uppercase tracking-normal mt-2 whitespace-nowrap ${isCurrent ? 'text-primary font-semibold' : isDone ? 'text-slate-700' : 'text-slate-400'
                                            }`}>
                                            {stg.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Policy Warning Banner if Flagged */}
                {claim.policy_violation_flag && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
                        <FiAlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-rose-900 space-y-0.5">
                            <p className="font-semibold">Policy Compliance Warning</p>
                            <p className="text-rose-700">{claim.violation_reason || 'This claim triggered a policy limit or duplicate check exception.'}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left 2 Cols: Claim Dossier Details */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Core Details */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
                            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                                <div>
                                    <span className="text-[10px] font-normal uppercase tracking-normal text-slate-400">Claim Amount</span>
                                    <h3 className="text-3xl font-semibold text-slate-900 tracking-tight">{formatINR(claim.amount)}</h3>
                                    {claim.tax_amount > 0 && (
                                        <p className="text-xs text-slate-500 mt-0.5">Includes Tax / GST: {formatINR(claim.tax_amount)} ({claim.tax_rate || 0}%)</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-normal uppercase tracking-normal text-slate-400">Expense Date</span>
                                    <p className="text-sm font-semibold text-slate-800">{claim.expense_date}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="text-[9px] font-normal uppercase text-slate-400">Category</span>
                                    <p className="text-xs font-semibold text-slate-800 mt-0.5">{claim.category?.name || 'General'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="text-[9px] font-normal uppercase text-slate-400">Payment Method</span>
                                    <p className="text-xs font-semibold text-slate-800 mt-0.5 capitalize">{claim.payment_method ? claim.payment_method.replace('_', ' ') : '-'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="text-[9px] font-normal uppercase text-slate-400">Vendor</span>
                                    <p className="text-xs font-semibold text-slate-800 mt-0.5">{claim.vendor_name || '—'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="text-[9px] font-normal uppercase text-slate-400">Cost Centre</span>
                                    <p className="text-xs font-semibold text-slate-800 mt-0.5">{claim.cost_center || '—'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="text-[9px] font-normal uppercase text-slate-400">Project</span>
                                    <p className="text-xs font-semibold text-slate-800 mt-0.5">{claim.project_name || '—'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="text-[9px] font-normal uppercase text-slate-400">Tax Invoice No.</span>
                                    <p className="text-xs font-semibold text-slate-800 mt-0.5">{claim.tax_invoice_number || '—'}</p>
                                </div>
                            </div>

                            <div>
                                <span className="text-[10px] font-normal uppercase tracking-normal text-slate-400 block mb-1">Business Purpose</span>
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed">
                                    {claim.business_purpose}
                                </div>
                            </div>
                        </div>

                        {/* Approval & Audit Timeline */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                <FiShield className="text-primary" />
                                Approval & Audit Log
                            </h3>

                            <div className="space-y-4">
                                {/* 1. Submission */}
                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full mt-0.5">
                                        <FiUser className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-1 text-xs">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-slate-800">Claim Created & Submitted</p>
                                            <span className="text-[10px] text-slate-400">{claim.created_at ? new Date(claim.created_at).toLocaleString('en-IN') : '-'}</span>
                                        </div>
                                        <p className="text-slate-500 mt-0.5">By {claim.employee?.name} ({claim.employee?.employee_code})</p>
                                    </div>
                                </div>

                                {/* 2. Manager Review */}
                                <div className={`flex items-start gap-3 p-3 rounded-lg border ${claim.manager_approved_at ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/50 border-slate-100'
                                    }`}>
                                    <div className={`p-2 rounded-full mt-0.5 ${claim.manager_approved_at ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                        <FiCheck className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-1 text-xs">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-slate-800">Reporting Manager Verification</p>
                                            {claim.manager_approved_at && (
                                                <span className="text-[10px] text-slate-400">{new Date(claim.manager_approved_at).toLocaleString('en-IN')}</span>
                                            )}
                                        </div>
                                        <p className="text-slate-500 mt-0.5">
                                            {claim.manager ? `Approved by ${claim.manager.name}` : claim.status === 'submitted' ? 'Pending Manager Verification' : 'Pending'}
                                        </p>
                                        {claim.manager_comments && (
                                            <p className="mt-1 text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-100">"{claim.manager_comments}"</p>
                                        )}
                                    </div>
                                </div>

                                {/* 3. Finance Review */}
                                <div className={`flex items-start gap-3 p-3 rounded-lg border ${claim.finance_reviewed_at ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/50 border-slate-100'
                                    }`}>
                                    <div className={`p-2 rounded-full mt-0.5 ${claim.finance_reviewed_at ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                        <FiDollarSign className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-1 text-xs">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-slate-800">Finance & Tax Audit</p>
                                            {claim.finance_reviewed_at && (
                                                <span className="text-[10px] text-slate-400">{new Date(claim.finance_reviewed_at).toLocaleString('en-IN')}</span>
                                            )}
                                        </div>
                                        <p className="text-slate-500 mt-0.5">
                                            {claim.financeReviewer ? `Approved by ${claim.financeReviewer.name} (${claim.reimbursement_method ? claim.reimbursement_method.replace('_', ' ') : ''})` : 'Pending Finance Review'}
                                        </p>
                                        {claim.finance_comments && (
                                            <p className="mt-1 text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-100">"{claim.finance_comments}"</p>
                                        )}
                                    </div>
                                </div>

                                {/* 4. Reimbursement Status */}
                                <div className={`flex items-start gap-3 p-3 rounded-lg border ${claim.paid_at || claim.reimbursement_status === 'included_in_payroll' ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50/50 border-slate-100'
                                    }`}>
                                    <div className={`p-2 rounded-full mt-0.5 ${claim.paid_at ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                                        <FiCreditCard className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-1 text-xs">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-slate-800">Reimbursement Settlement</p>
                                            {claim.paid_at && <span className="text-[10px] text-slate-400">{new Date(claim.paid_at).toLocaleDateString('en-IN')}</span>}
                                        </div>
                                        <p className="text-slate-500 mt-0.5">
                                            Status: <span className="font-medium text-slate-700 uppercase">{claim.reimbursement_status ? claim.reimbursement_status.replace('_', ' ') : 'Pending'}</span>
                                            {claim.payment_reference && ` — Ref: ${claim.payment_reference}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right 1 Col: Receipt, Actions & Reviews */}
                    <div className="space-y-6">

                        {/* Employee Card */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-3">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-normal">Employee Information</h3>
                            <div className="flex items-center gap-3">
                                <Avatar
                                    src={claim.employee?.employee_image}
                                    name={claim.employee?.name}
                                    size="md"
                                />
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-800">{claim.employee?.name}</h4>
                                    <p className="text-xs text-slate-500">{claim.employee?.designation || 'Staff'} · {claim.employee?.employee_code}</p>
                                    <p className="text-[10px] text-indigo-600 mt-0.5">{claim.employee?.company?.name || 'Main Company'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Receipt Preview Card */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-normal">Supporting Receipt</h3>
                                {claim.receipt_path && (
                                    <a
                                        href={`/storage/${claim.receipt_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1"
                                    >
                                        <FiExternalLink className="w-3 h-3" /> Full View
                                    </a>
                                )}
                            </div>

                            {claim.receipt_path ? (
                                <div className="space-y-2">
                                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer hover:opacity-90 transition-opacity">
                                        <img
                                            src={`/storage/${claim.receipt_path}`}
                                            alt="Receipt"
                                            className="w-full h-48 object-cover"
                                            onClick={() => setLightboxOpen(true)}
                                        />
                                    </div>
                                    <a
                                        href={`/storage/${claim.receipt_path}`}
                                        download
                                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-2 border border-slate-200 transition-colors"
                                    >
                                        <FiDownload className="w-3.5 h-3.5" /> Download Receipt
                                    </a>
                                </div>
                            ) : (
                                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 text-slate-400 text-xs">
                                    No receipt attached.
                                </div>
                            )}
                        </div>

                        {/* Review Action Controls */}
                        {/* 1. Review Actions (Step 28) */}
                        {claim.status === 'submitted' && (
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-normal">
                                        {isManagerOrAdminApplicant ? 'Admin Review Required' : 'Manager / HR Review'}
                                    </h3>
                                    {isManagerOrAdminApplicant && (
                                        <span className="text-[9px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 uppercase">
                                            {applicantRole} Claim
                                        </span>
                                    )}
                                </div>

                                {isManagerOrAdminApplicant && (
                                    <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900 space-y-0.5">
                                        <p className="font-semibold">Special Approval Policy</p>
                                        <p className="text-[11px] text-amber-700">
                                            Claims submitted for Managers or Administrators strictly require Administrator review.
                                        </p>
                                    </div>
                                )}

                                {canManagerApprove ? (
                                    <div className="space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => setManagerModal({ open: true, type: 'approve' })}
                                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <FiCheckCircle className="w-4 h-4" />
                                            {userRole === 'admin' ? 'Administrator Verify & Approve' : 'Verify & Approve Claim'}
                                        </button>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setManagerModal({ open: true, type: 'return' })}
                                                className="py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-medium border border-amber-200 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <FiRotateCcw className="w-3.5 h-3.5" />
                                                Return for Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setManagerModal({ open: true, type: 'reject' })}
                                                className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-medium border border-rose-200 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <FiXCircle className="w-3.5 h-3.5" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
                                        {approvalReason || 'Under review by authorized administrator/manager.'}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. Finance Actions (Step 29 & 31) */}
                        {claim.status === 'manager_approved' && isFinanceOrAdmin && (
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-3">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-normal">Finance Actions</h3>
                                <button
                                    type="button"
                                    onClick={() => setFinanceModal({ open: true, type: 'approve' })}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <FiCheckCircle className="w-4 h-4" />
                                    Approve for Reimbursement
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFinanceModal({ open: true, type: 'reject' })}
                                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-medium border border-rose-200 transition-colors flex items-center justify-center gap-1"
                                >
                                    <FiXCircle className="w-3.5 h-3.5" />
                                    Reject Claim
                                </button>
                            </div>
                        )}

                        {/* 3. Direct Payment Action (Step 32) */}
                        {claim.status === 'finance_approved' && claim.reimbursement_status === 'pending' && isFinanceOrAdmin && (
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-3">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-normal">Payment Processing</h3>
                                {claim.reimbursement_method === 'payroll' ? (
                                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 space-y-1">
                                        <p className="font-semibold">Marked for Payroll Reimbursement</p>
                                        <p className="text-[11px] text-indigo-700">This claim will be automatically added to the next monthly salary slip calculation.</p>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setPaymentModalOpen(true)}
                                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <FiCreditCard className="w-4 h-4" />
                                        Process Direct Payment
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Manager Review Dialog */}
                {managerModal.open && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                            <h3 className="text-base font-semibold text-slate-900 capitalize">
                                {managerModal.type === 'approve' ? 'Approve Expense Claim' : managerModal.type === 'return' ? 'Return Claim to Employee' : 'Reject Expense Claim'}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {managerModal.type === 'approve'
                                    ? 'Confirm that you have verified the business purpose, invoice validity, and budget availability.'
                                    : managerModal.type === 'return'
                                        ? 'Provide feedback to the employee on why this claim needs modifications.'
                                        : 'Provide mandatory reasons for rejecting this business expense.'}
                            </p>

                            <textarea
                                rows="3"
                                placeholder="Comments / Notes..."
                                value={managerModal.type === 'return' ? managerForm.data.comments : managerForm.data.manager_comments}
                                onChange={(e) => {
                                    if (managerModal.type === 'return') managerForm.setData('comments', e.target.value);
                                    else managerForm.setData('manager_comments', e.target.value);
                                }}
                                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary"
                            ></textarea>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setManagerModal({ open: false, type: 'approve' })}
                                    className="px-4 py-2 text-xs bg-slate-100 text-slate-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={managerForm.processing}
                                    onClick={() => handleManagerAction(managerModal.type)}
                                    className={`px-4 py-2 text-xs font-semibold text-white rounded-lg ${managerModal.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : managerModal.type === 'return' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'
                                        }`}
                                >
                                    Confirm {managerModal.type}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Finance Review Dialog */}
                {financeModal.open && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                            <h3 className="text-base font-semibold text-slate-900 capitalize">
                                {financeModal.type === 'approve' ? 'Finance Approval & Reimbursement Method' : 'Reject Expense Claim'}
                            </h3>

                            {financeModal.type === 'approve' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Reimbursement Channel</label>
                                        <select
                                            value={financeForm.data.reimbursement_method}
                                            onChange={(e) => financeForm.setData('reimbursement_method', e.target.value)}
                                            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="payroll">Include in Monthly Payroll (Salary Slip)</option>
                                            <option value="direct_payment">Direct Bank Transfer / Petty Cash</option>
                                            <option value="accounts_payable">Accounts Payable (AP Ledger)</option>
                                        </select>
                                    </div>
                                    <textarea
                                        rows="2"
                                        placeholder="Finance remarks / accounting code..."
                                        value={financeForm.data.finance_comments}
                                        onChange={(e) => financeForm.setData('finance_comments', e.target.value)}
                                        className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary"
                                    ></textarea>
                                </div>
                            ) : (
                                <textarea
                                    rows="3"
                                    placeholder="Reason for finance rejection..."
                                    value={financeForm.data.finance_comments}
                                    onChange={(e) => financeForm.setData('finance_comments', e.target.value)}
                                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary"
                                ></textarea>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setFinanceModal({ open: false, type: 'approve' })}
                                    className="px-4 py-2 text-xs bg-slate-100 text-slate-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={financeForm.processing}
                                    onClick={() => handleFinanceAction(financeModal.type)}
                                    className={`px-4 py-2 text-xs font-semibold text-white rounded-lg ${financeModal.type === 'approve' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'
                                        }`}
                                >
                                    Confirm {financeModal.type}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Direct Payment Processing Modal */}
                {paymentModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <form onSubmit={handleProcessPayment} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                            <h3 className="text-base font-semibold text-slate-900">Record Reimbursement Payment</h3>
                            <p className="text-xs text-slate-500">Record bank transfer reference / petty cash receipt for {formatINR(claim.amount)}.</p>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Reference (UTR / Cheque / Cash Voucher) *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. UTR-9821839218"
                                        value={paymentForm.data.payment_reference}
                                        onChange={(e) => paymentForm.setData('payment_reference', e.target.value)}
                                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Disbursement Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={paymentForm.data.paid_at}
                                        onChange={(e) => paymentForm.setData('paid_at', e.target.value)}
                                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentModalOpen(false)}
                                    className="px-4 py-2 text-xs bg-slate-100 text-slate-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={paymentForm.processing}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                                >
                                    Record Payment
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function inArray(val, arr) {
    return Array.isArray(arr) && arr.includes(val);
}
