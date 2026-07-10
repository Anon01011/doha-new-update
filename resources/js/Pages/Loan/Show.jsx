import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { FaMoneyBillWave, FaCalendarAlt, FaCheckCircle, FaClock, FaUniversity, FaArrowLeft, FaEdit, FaUserCheck, FaHandHoldingUsd, FaReceipt, FaInfoCircle, FaTimesCircle, FaShieldAlt, FaHistory, FaChevronRight, FaPrint, FaCogs, FaChartPie } from 'react-icons/fa';
import { useState } from 'react';
import Avatar from '@/Components/Avatar';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Show({ loan, userRole = 'employee' }) {
    const { appSettings } = usePage().props;
    const currency = appSettings?.currency || 'QAR';
    const currency_symbol = appSettings?.currency_symbol || 'QAR';

    const [modal, setModal] = useState({
        show: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: () => { },
        processing: false
    });

    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: currency 
    }).format(amount || 0);

    const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A';

    const getStatusStyles = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'approved') return { 
            bg: 'bg-emerald-500/10', 
            text: 'text-emerald-600', 
            border: 'border-emerald-500/20', 
            label: 'AUTHORIZED' 
        };
        if (s === 'disbursed') return { 
            bg: 'bg-blue-500/10', 
            text: 'text-blue-600', 
            border: 'border-blue-500/20', 
            label: 'DISBURSED' 
        };
        if (s === 'completed') return { 
            bg: 'bg-indigo-500/10', 
            text: 'text-indigo-600', 
            border: 'border-indigo-500/20', 
            label: 'FULLY REPAID' 
        };
        if (s === 'rejected') return { 
            bg: 'bg-rose-500/10', 
            text: 'text-rose-600', 
            border: 'border-rose-500/20', 
            label: 'REJECTED' 
        };
        return { 
            bg: 'bg-amber-500/10', 
            text: 'text-amber-600', 
            border: 'border-amber-500/20', 
            label: 'PENDING AUDIT' 
        };
    };

    const statusStyle = getStatusStyles(loan.status);

    const totalInstallments = loan.installments?.length || 0;
    const paidInstallments = loan.installments?.filter(i => i.status === 'paid').length || 0;
    const paidAmount = loan.installments?.filter(i => i.status === 'paid').reduce((sum, i) => sum + parseFloat(i.amount), 0) || 0;
    const progress = totalInstallments > 0 ? (paidInstallments / totalInstallments) * 100 : 0;

    const closeModal = () => setModal(prev => ({ ...prev, show: false }));

    const handleApprove = () => {
        setModal({
            show: true,
            title: 'Protocol Authorization',
            message: 'Confirm intent to authorize this assistance request. This will generate the recoupment schedule.',
            type: 'success',
            onConfirm: () => {
                setModal(prev => ({ ...prev, processing: true }));
                router.post(route('loans.approve', loan.id), {}, {
                    onFinish: () => closeModal()
                });
            }
        });
    };

    const handleReject = () => {
        setModal({
            show: true,
            title: 'Protocol Rejection',
            message: 'Confirm intent to reject this assistance request. This action is immutable.',
            type: 'danger',
            onConfirm: () => {
                setModal(prev => ({ ...prev, processing: true }));
                router.post(route('loans.reject', loan.id), {}, {
                    onFinish: () => closeModal()
                });
            }
        });
    };

    const handleDisburse = () => {
        setModal({
            show: true,
            title: 'Capital Disbursement',
            message: 'Confirm intent to execute capital disbursement. This initiates the active assistance protocol.',
            type: 'info',
            onConfirm: () => {
                setModal(prev => ({ ...prev, processing: true }));
                router.post(route('loans.disburse', loan.id), {}, {
                    onFinish: () => closeModal()
                });
            }
        });
    };

    const handlePayInstallment = (instId) => {
        setModal({
            show: true,
            title: 'Recoupment Manual Override',
            message: 'Confirm intent to execute manual recoupment override for this division.',
            type: 'success',
            onConfirm: () => {
                setModal(prev => ({ ...prev, processing: true }));
                router.post(route('loans.installments.pay', instId), {}, {
                    onFinish: () => closeModal()
                });
            }
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Loan Details</h2>}>
            <Head title={`Loan Details - ${loan.employee?.name}`} />

            <div className="py-4 px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Executive Control Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 bg-primary h-full"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <Link 
                            href={route('loans.index')} 
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-normal text-slate-900 tracking-normal leading-none mb-2 uppercase tracking-normal">Loan Details</h2>
                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                                Reference: LNP-{loan.id}-{loan.loan_type?.toUpperCase()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                        {userRole !== 'employee' && loan.status?.toLowerCase() === 'pending' && (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    onClick={handleApprove}
                                    className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <FaCheckCircle size={10} />
                                    Approve
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="flex-1 sm:flex-none px-6 py-2.5 bg-rose-600 text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <FaTimesCircle size={10} />
                                    Reject
                                </button>
                            </div>
                        )}
                        {userRole !== 'employee' && loan.status?.toLowerCase() === 'approved' && (
                            <button
                                onClick={handleDisburse}
                                className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 transition-all shadow-lg shadow-blue-100 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FaUniversity size={10} />
                                Execute Payment
                            </button>
                        )}
                        {userRole !== 'employee' && loan.status?.toLowerCase() === 'pending' && (
                            <Link
                                href={route('loans.edit', loan.id)}
                                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-primary transition-all shadow-lg shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FaEdit size={10} />
                                Edit Loan
                            </Link>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Primary Statement Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personnel Profile */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden group">
                            <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                                <Avatar 
                                    src={loan.employee?.employee_image}
                                    name={loan.employee?.name}
                                    size="xl"
                                    className="rounded-lg ring-4 ring-slate-50 group-hover:scale-105 transition-transform"
                                />
                                <div className="text-center md:text-left flex-1 space-y-2">
                                    <p className="text-[10px] font-normal text-primary uppercase tracking-[0.2em]">Employee Info</p>
                                    <h2 className="text-2xl font-normal text-slate-900 tracking-normal">{loan.employee?.name}</h2>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                        <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-normal tracking-normal border border-slate-100">
                                            ID: {loan.employee?.employee_code || 'N/A'}
                                        </span>
                                        <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-normal tracking-normal border border-slate-100">
                                            {loan.employee?.department?.name || 'Department'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-center md:text-right mt-4 md:mt-0">
                                    <span className={`px-4 py-2 rounded-lg text-[10px] font-normal uppercase tracking-normal border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                        {statusStyle.label}
                                    </span>
                                    <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mt-3">Request Date</p>
                                    <p className="text-sm font-normal text-slate-900">{formatDate(loan.created_at)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Recoupment Schedule */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <h3 className="text-sm font-normal text-slate-900 uppercase tracking-normal flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"><FaReceipt size={12}/></div>
                                    Repayment Schedule
                                </h3>
                                <div className="flex items-center gap-4 bg-slate-50/50 px-4 py-2 rounded-lg border border-slate-100">
                                    <div className="text-right">
                                        <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">Progress</p>
                                        <p className="text-xs font-normal text-slate-900">{paidInstallments} / {totalInstallments} Paid</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full border-4 border-indigo-100 flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-indigo-500 origin-bottom transition-all duration-1000" style={{ height: `${progress}%` }}></div>
                                        <span className="relative z-10 text-[8px] font-normal text-slate-900">{Math.round(progress)}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-6 py-3 text-left text-[9px] font-normal text-slate-400 uppercase tracking-normal border-b border-slate-100">Inst. #</th>
                                            <th className="px-6 py-3 text-left text-[9px] font-normal text-slate-400 uppercase tracking-normal border-b border-slate-100">Due Date</th>
                                            <th className="px-6 py-3 text-left text-[9px] font-normal text-slate-400 uppercase tracking-normal border-b border-slate-100">Amount</th>
                                            <th className="px-6 py-3 text-left text-[9px] font-normal text-slate-400 uppercase tracking-normal border-b border-slate-100">Status</th>
                                            <th className="px-6 py-3 text-right text-[9px] font-normal text-slate-400 uppercase tracking-normal border-b border-slate-100">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {loan.installments?.map((inst, i) => (
                                            <tr key={inst.id} className="hover:bg-slate-50/50 transition-all group">
                                                <td className="px-6 py-3">
                                                    <span className="text-[10px] font-normal text-slate-900 uppercase tracking-normal">#{i + 1}</span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <FaCalendarAlt className="text-slate-300" size={10} />
                                                        <span className="text-[10px] font-normal text-slate-600 uppercase tracking-normal">{formatDate(inst.due_date)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="text-[11px] font-normal text-slate-900">{formatCurrency(inst.amount)}</span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className={`px-2 py-1 rounded text-[9px] font-normal uppercase tracking-normal border ${
                                                        inst.status === 'paid' 
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                        : 'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                        {inst.status?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    {userRole !== 'employee' && inst.status !== 'paid' && (
                                                        <button
                                                            onClick={() => handlePayInstallment(inst.id)}
                                                            className="px-3 py-1 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50 rounded text-[9px] font-normal uppercase tracking-normal transition-all active:scale-95"
                                                        >
                                                            Override
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {!loan.installments?.length && (
                                            <tr>
                                                <td colSpan="5" className="px-8 py-12 text-center">
                                                    <div className="flex flex-col items-center gap-3 opacity-40">
                                                        <FaClock size={24} className="text-slate-300" />
                                                        <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">Recoupment schedule awaiting protocol authorization</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Intelligence Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 rounded-lg p-6 text-white shadow-lg shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 text-primary opacity-20 group-hover:scale-110 transition-transform">
                                <FaChartPie size={80} />
                            </div>
                            <h3 className="text-[10px] font-normal uppercase tracking-normal mb-6 text-white flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                Loan Summary
                            </h3>
                            
                            <div className="space-y-6 relative z-10">
                                <div>
                                    <p className="text-[9px] font-normal text-white uppercase tracking-normal mb-1">Loan Amount</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xs font-normal text-primary">{currency_symbol}</span>
                                        <h2 className="text-3xl font-normal tracking-normal">
                                            {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(loan.amount)}
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-white/10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-normal text-white uppercase tracking-normal">Paid Amount</span>
                                        <span className="text-[10px] font-normal text-emerald-400">+{formatCurrency(paidAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-normal text-white uppercase tracking-normal">Tenure</span>
                                        <span className="text-[9px] font-normal text-slate-200 uppercase">{loan.tenure_months} Cycles</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                        <span className="text-[9px] font-normal text-white uppercase tracking-normal">Remaining Balance</span>
                                        <span className="text-sm font-normal text-white">{formatCurrency(parseFloat(loan.amount) - paidAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Metadata */}
                        <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm space-y-6">
                            <div>
                                <h4 className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-4 flex items-center gap-2">
                                    <FaInfoCircle className="text-primary" /> Assistance Objective
                                </h4>
                                <p className="text-[11px] font-normal text-slate-600 uppercase tracking-normal leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    {loan.purpose || 'NO OBJECTIVE STATED'}
                                </p>
                            </div>
                            
                            <div>
                                <h4 className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-4 flex items-center gap-2">
                                    <FaHistory className="text-primary" /> Integrity Trail
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0"><FaClock size={12}/></div>
                                        <div>
                                            <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">Protocol Generation</p>
                                            <p className="text-[10px] font-normal text-slate-900 uppercase">{new Date(loan.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0"><FaUserCheck size={12}/></div>
                                        <div>
                                            <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">Amended By</p>
                                            <p className="text-[10px] font-normal text-slate-900 uppercase">{loan.approved_by_user?.name || 'SYSTEM CORE'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 flex gap-4">
                            <FaShieldAlt className="text-primary shrink-0 mt-1" size={14} />
                            <p className="text-[9px] font-normal text-slate-500 uppercase tracking-normal leading-relaxed">
                                DISBURSED CAPITAL PROTOCOLS ARE SUBJECT TO ISO-27001 FISCAL AUDIT STANDARDS.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                show={modal.show}
                onClose={closeModal}
                onConfirm={modal.onConfirm}
                title={modal.title}
                message={modal.message}
                confirmText={modal.type === 'danger' ? 'REJECT PROTOCOL' : 'AUTHORIZE PROTOCOL'}
                type={modal.type}
                processing={modal.processing}
            />
        </AuthenticatedLayout>
    );
}
