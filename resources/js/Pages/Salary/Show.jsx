import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Avatar from '@/Components/Avatar';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { FaArrowLeft, FaEdit, FaCheckCircle, FaTimesCircle, FaMoneyBillWave, FaHistory, FaShieldAlt, FaPrint, FaClock, FaChartPie, FaPlus, FaMinus, FaFileInvoiceDollar, FaInfoCircle } from 'react-icons/fa';

export default function Show({ salaryPosting, userRole = 'employee', loanInstallments = [], advances = [] }) {
    const { appSettings } = usePage().props;
    const currency = appSettings?.currency || 'QAR';

    const [modal, setModal] = useState({
        show: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: () => { },
        processing: false
    });

    const formatCurrency = (amount) => {
        const num = parseFloat(amount);
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: currency,
            minimumFractionDigits: 2
        }).format(isNaN(num) ? 0 : num);
    };

    const getStatusStyles = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'approved') return {
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-600',
            border: 'border-emerald-500/20',
            label: 'APPROVED'
        };
        if (s === 'posted') return {
            bg: 'bg-blue-500/10',
            text: 'text-blue-600',
            border: 'border-blue-500/20',
            label: 'POSTED'
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
            label: 'PENDING'
        };
    };

    const closeModal = () => setModal(prev => ({ ...prev, show: false }));

    const handleApprove = () => {
        setModal({
            show: true,
            title: 'Approve Salary',
            message: 'Are you sure you want to approve this salary record? This will lock the record for payment.',
            type: 'success',
            onConfirm: () => {
                setModal(prev => ({ ...prev, processing: true }));
                router.post(route('salary-postings.approve', salaryPosting.id), {}, {
                    onFinish: () => closeModal()
                });
            }
        });
    };

    const handleReject = () => {
        setModal({
            show: true,
            title: 'Reject Salary',
            message: 'Are you sure you want to reject this salary record? This will return it to draft state.',
            type: 'danger',
            onConfirm: () => {
                setModal(prev => ({ ...prev, processing: true }));
                router.post(route('salary-postings.reject', salaryPosting.id), {}, {
                    onFinish: () => closeModal()
                });
            }
        });
    };

    const basicSalary = parseFloat(salaryPosting.basic_salary) || 0;
    const overtimeAmount = parseFloat(salaryPosting.overtime_amount) || 0;
    const leaveDeduction = parseFloat(salaryPosting.leave_deduction) || 0;
    const allowancesTotal = salaryPosting.allowances ? Object.values(salaryPosting.allowances).reduce((a, b) => a + (parseFloat(b) || 0), 0) : 0;
    const deductionsTotal = salaryPosting.deductions ? Object.values(salaryPosting.deductions).reduce((a, b) => a + (parseFloat(b) || 0), 0) : 0;
    const totalEarnings = basicSalary + allowancesTotal + overtimeAmount;
    const totalDeductions = deductionsTotal + leaveDeduction;
    const netSalary = totalEarnings - totalDeductions;

    const statusStyle = getStatusStyles(salaryPosting.status);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Salary Details</h2>}>
            <Head title={`Salary Details - ${salaryPosting.employee?.name}`} />

            <div className="py-4 px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Executive Control Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 bg-primary h-full"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <Link 
                            href={route('salary-postings.index')} 
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-normal text-slate-900 tracking-normal leading-none mb-2 uppercase tracking-normal">Salary Details</h2>
                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                                Reference: SLP-{salaryPosting.id}-{salaryPosting.month}/{salaryPosting.year}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                        <a
                            href={route('salary-postings.slip', salaryPosting.id)}
                            target="_blank"
                            className="w-full sm:w-auto px-6 py-2.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-slate-100 transition-all border border-slate-200 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <FaPrint size={10} />
                            Generate Slip
                        </a>
                        {['admin', 'hr', 'manager', 'system admin', 'system_admin', 'super admin', 'superadmin'].includes(String(userRole).toLowerCase()) && ['draft', 'pending'].includes(salaryPosting.status?.toLowerCase()) && (
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
                        {['admin', 'hr', 'manager', 'system admin', 'system_admin', 'super admin', 'superadmin'].includes(String(userRole).toLowerCase()) && (
                            <Link
                                href={route('salary-postings.edit', salaryPosting.id)}
                                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-primary transition-all shadow-lg shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FaEdit size={10} />
                                Edit Record
                            </Link>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                    {/* Primary Statement Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personnel Profile */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden group">
                            <div className="p-5 flex flex-col md:flex-row items-center gap-5">
                                <Avatar 
                                    src={salaryPosting.employee?.employee_image}
                                    name={salaryPosting.employee?.name}
                                    size="xl"
                                    className="rounded-lg ring-4 ring-slate-50 group-hover:scale-105 transition-transform"
                                />
                                <div className="text-center md:text-left flex-1 space-y-1">
                                    <p className="text-[9px] font-normal text-primary uppercase tracking-[0.3em]">Employee Details</p>
                                    <h2 className="text-2xl font-normal text-slate-900 uppercase tracking-normal">{salaryPosting.employee?.name}</h2>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                        <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-normal uppercase tracking-normal border border-slate-100">
                                            ID: {salaryPosting.employee?.employee_code || 'N/A'}
                                        </span>
                                        <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-normal uppercase tracking-normal border border-slate-100">
                                            {salaryPosting.employee?.department?.name || 'GENERIC UNIT'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-center md:text-right">
                                    <span className={`px-4 py-2 rounded-lg text-[10px] font-normal uppercase tracking-[0.2em] border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                        {statusStyle.label}
                                    </span>
                                    <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mt-4">Period</p>
                                    <p className="text-xl font-normal text-slate-900 uppercase">{new Date(salaryPosting.year, salaryPosting.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        {/* Statement Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Earnings Matrix */}
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
                                <h3 className="text-sm font-normal text-slate-900 uppercase tracking-normal flex items-center gap-3">
                                    <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><FaPlus size={12}/></div>
                                    Earnings
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">Basic Salary</span>
                                        <span className="text-sm font-normal text-slate-900">{formatCurrency(basicSalary)}</span>
                                    </div>
                                    {Object.entries(salaryPosting.allowances || {}).map(([name, amount], i) => (
                                        <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50">
                                            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">{name}</span>
                                            <span className="text-sm font-normal text-slate-900">+{formatCurrency(amount)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                        <span className="text-[10px] font-normal text-emerald-500 uppercase tracking-normal">Overtime</span>
                                        <span className="text-sm font-normal text-emerald-600">+{formatCurrency(overtimeAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4">
                                        <span className="text-[11px] font-normal text-slate-900 uppercase tracking-[0.2em]">Gross Salary</span>
                                        <span className="text-lg font-normal text-emerald-600">{formatCurrency(totalEarnings)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Liability Matrix */}
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
                                <h3 className="text-sm font-normal text-slate-900 uppercase tracking-normal flex items-center gap-3">
                                    <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center"><FaMinus size={12}/></div>
                                    Deductions
                                </h3>
                                <div className="space-y-4">
                                    {Object.entries(salaryPosting.deductions || {}).map(([name, amount], i) => (
                                        <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50">
                                            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">{name}</span>
                                            <span className="text-sm font-normal text-slate-900">-{formatCurrency(amount)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                        <span className="text-[10px] font-normal text-rose-500 uppercase tracking-normal">Leave Deduction</span>
                                        <span className="text-sm font-normal text-rose-600">-{formatCurrency(leaveDeduction)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4">
                                        <span className="text-[11px] font-normal text-slate-900 uppercase tracking-[0.2em]">Total Deductions</span>
                                        <span className="text-lg font-normal text-rose-600">{formatCurrency(totalDeductions)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ancillary Deductions (Loans/Advances) */}
                        {(loanInstallments.length > 0 || advances.length > 0) && (
                            <div className="bg-slate-50/50 rounded-lg p-6 border border-slate-200 space-y-4">
                                <h3 className="text-sm font-normal text-slate-900 uppercase tracking-normal flex items-center gap-3">
                                    <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center"><FaHistory size={12}/></div>
                                    Loans & Advances
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {loanInstallments.length > 0 && (
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em]">Loan Payments</p>
                                            {loanInstallments.map((li, i) => (
                                                <div key={i} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                                                    <span className="text-[10px] font-normal text-slate-900 uppercase">{li.loan?.loan_type?.name || 'Loan'}</span>
                                                    <span className="text-[10px] font-normal text-rose-600">-{formatCurrency(li.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {advances.length > 0 && (
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em]">Advance Recovery</p>
                                            {advances.map((adv, i) => (
                                                <div key={i} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                                                    <span className="text-[10px] font-normal text-slate-900 uppercase">Cash Advance</span>
                                                    <span className="text-[10px] font-normal text-rose-600">-{formatCurrency(adv.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Intelligence Sidebar */}
                    <div className="space-y-5">
                        <div className="bg-slate-900 rounded-lg p-6 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 text-white opacity-10 group-hover:scale-110 transition-transform">
                                <FaFileInvoiceDollar size={80} />
                            </div>
                            <h3 className="text-[10px] font-normal uppercase tracking-[0.3em] mb-6 text-white flex items-center gap-2">
                                <span className="w-2 h-2 bg-primary rounded-full"></span>
                                Salary Summary
                            </h3>
                            
                            <div className="space-y-6 relative z-10">
                                <div>
                                    <p className="text-[10px] font-normal text-white uppercase tracking-normal mb-2">Net Pay</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-normal text-white">{currency}</span>
                                        <h2 className="text-4xl font-normal tracking-normal">
                                            {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(netSalary)}
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-white/10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-normal text-white uppercase tracking-normal">Date</span>
                                        <span className="text-[10px] font-normal text-white uppercase">{new Date(salaryPosting.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-normal text-white uppercase tracking-normal">Priority</span>
                                        <span className="text-[10px] font-normal text-white uppercase">CRITICAL</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Audit Log Placeholder */}
                        <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-[10px] font-normal text-slate-900 uppercase tracking-normal mb-6 flex items-center gap-2">
                                <FaShieldAlt className="text-primary" /> Status History
                            </h3>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0"><FaClock size={12}/></div>
                                    <div>
                                        <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">Created</p>
                                        <p className="text-[10px] font-normal text-slate-900 uppercase">{new Date(salaryPosting.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0"><FaHistory size={12}/></div>
                                    <div>
                                        <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">Last Modified</p>
                                        <p className="text-[10px] font-normal text-slate-900 uppercase">{new Date(salaryPosting.updated_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex gap-4">
                            <FaInfoCircle className="text-primary shrink-0 mt-1" size={14} />
                            <p className="text-[9px] font-normal text-slate-500 uppercase tracking-normal leading-relaxed">
                                PAID RECORDS ARE SAVED FOR HISTORY. CHANGES MAY REQUIRE APPROVAL.
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
                confirmText={modal.type === 'danger' ? 'REJECT SALARY' : 'APPROVE SALARY'}
                type={modal.type}
                processing={modal.processing}
            />
        </AuthenticatedLayout>
    );
}
