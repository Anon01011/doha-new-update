import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Avatar from '@/Components/Avatar';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Modal from '@/Components/Modal';
import { FaArrowLeft, FaEdit, FaCheckCircle, FaTimesCircle, FaMoneyBillWave, FaHistory, FaShieldAlt, FaPrint, FaClock, FaChartPie, FaChartLine, FaPlus, FaMinus, FaFileInvoiceDollar, FaInfoCircle } from 'react-icons/fa';

/** Reusable section header row for the salary detail modal */
function SectionHeader({ icon, iconBg, iconColor, title, subtitle }) {
    return (
        <div className="flex items-start gap-3">
            <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className={`${iconColor} text-xs`}>{icon}</span>
            </div>
            <div>
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">{title}</h4>
                {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

export default function Show({ salaryPosting, userRole = 'employee', loanInstallments = [], advances = [], payrollDetails = null }) {
    const { auth, appSettings } = usePage().props;
    const user = auth?.user || {};
    const canManagePayroll = user.role === 'admin' || (user.permissions && user.permissions.includes('manage-payroll'));
    const currency = appSettings?.currency || 'QAR';

    const [calculationDetails, setCalculationDetails] = useState(payrollDetails);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
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
                        {calculationDetails && (
                            <button
                                type="button"
                                onClick={() => setShowDetailsModal(true)}
                                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-indigo-100 transition-all border border-indigo-100 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FaInfoCircle size={10} />
                                View Breakdown
                            </button>
                        )}
                        <a
                            href={route('salary-postings.slip', salaryPosting.id)}
                            target="_blank"
                            className="w-full sm:w-auto px-6 py-2.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-slate-100 transition-all border border-slate-200 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <FaPrint size={10} />
                            Generate Slip
                        </a>
                        {canManagePayroll && ['draft', 'pending'].includes(salaryPosting.status?.toLowerCase()) && (
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
                        {canManagePayroll && (
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

            <Modal show={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="3xl">
                <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">

                    {/* ── Header ── */}
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-6 py-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold text-indigo-300 uppercase tracking-widest mb-1">Salary Audit Report</p>
                                <h3 className="text-lg font-bold text-white">
                                    {new Date(salaryPosting.year, salaryPosting.month - 1).toLocaleDateString('en-US', { month: 'long' })} {salaryPosting.year}
                                </h3>
                                {calculationDetails?.employee_shift_info?.primary_shift_type && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full text-[10px] text-white font-semibold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                                            {calculationDetails.employee_shift_info.primary_shift_type} Shift
                                        </span>
                                        {calculationDetails?.employee_shift_info?.primary_shift_time && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full text-[10px] text-slate-300 font-medium">
                                                🕐 {calculationDetails.employee_shift_info.primary_shift_time}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDetailsModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Quick stats bar */}
                        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/10">
                            {[
                                { label: 'Basic', value: formatCurrency(calculationDetails?.basic_salary), color: 'text-slate-200' },
                                { label: '+ Overtime', value: `+${formatCurrency(calculationDetails?.overtime_amount)}`, color: 'text-emerald-300' },
                                { label: '- Deduction', value: `-${formatCurrency(calculationDetails?.leave_deduction)}`, color: 'text-rose-300' },
                                { label: 'Net Salary', value: formatCurrency(calculationDetails?.net_salary), color: 'text-white' },
                            ].map(item => (
                                <div key={item.label} className="text-center">
                                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">{item.label}</p>
                                    <p className={`text-xs font-bold mt-0.5 ${item.color}`}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Body ── */}
                    <div className="max-h-[72vh] overflow-y-auto divide-y divide-slate-100">

                        {/* ── 1. Attendance Overview ── */}
                        <div className="px-6 py-5">
                            <SectionHeader icon={<FaClock />} iconBg="bg-indigo-100" iconColor="text-indigo-600" title="Attendance Overview" subtitle={`${calculationDetails?.calendar_days || 0} calendar days · ${calculationDetails?.working_days_in_month || 0} working days · ${calculationDetails?.weekly_off_days || 0} weekly offs · ${calculationDetails?.holiday_days || 0} holidays`} />
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
                                {[
                                    { label: 'Present', value: calculationDetails?.attendance_summary?.present || 0, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                                    { label: 'Absent', value: calculationDetails?.attendance_summary?.absent || 0, bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
                                    { label: 'Half Day', value: calculationDetails?.attendance_summary?.half_day || 0, bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
                                    { label: 'Paid Leave', value: calculationDetails?.attendance_summary?.leave_paid || 0, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                                    { label: 'Unpaid Leave', value: calculationDetails?.attendance_summary?.leave_unpaid || 0, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                                    { label: 'Weekly Off', value: calculationDetails?.attendance_summary?.weekly_off || 0, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
                                ].map(item => (
                                    <div key={item.label} className={`${item.bg} border ${item.border} rounded-xl p-2.5 text-center`}>
                                        <p className={`text-lg font-black ${item.text}`}>{item.value}</p>
                                        <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider leading-tight mt-0.5">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── 2. Leave Details ── */}
                        {(() => {
                            const leaves = calculationDetails?.leave_breakdown || [];
                            const paidCount = leaves.filter(l => l.is_paid).length;
                            const unpaidCount = leaves.filter(l => !l.is_paid).length;
                            return (
                                <div className="px-6 py-5">
                                    <SectionHeader icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} iconBg="bg-blue-100" iconColor="text-blue-600" title="Leave Details" subtitle={leaves.length === 0 ? 'No leaves taken this period' : `${leaves.length} leave day(s) · ${paidCount} paid · ${unpaidCount} unpaid`} />
                                    {leaves.length === 0 ? (
                                        <div className="mt-3 flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <span className="text-xl">🎉</span>
                                            <p className="text-xs text-slate-500">No leaves taken — full attendance bonus may apply.</p>
                                        </div>
                                    ) : (
                                        <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
                                            <div className="grid grid-cols-4 bg-slate-50 px-4 py-2 border-b border-slate-200">
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Date</span>
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Leave Type</span>
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</span>
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Reason</span>
                                            </div>
                                            {leaves.map((leave, idx) => (
                                                <div key={idx} className={`grid grid-cols-4 items-center px-4 py-2.5 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 last:border-0`}>
                                                    <span className="text-[11px] text-slate-600 font-medium">
                                                        {new Date(leave.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                    <span className="text-[11px] text-slate-700 font-semibold">{leave.type}</span>
                                                    <div className="text-center">
                                                        {leave.is_paid ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold border border-emerald-200">PAID</span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-bold border border-rose-200">UNPAID</span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 truncate">{leave.reason || '—'}</span>
                                                </div>
                                            ))}
                                            {unpaidCount > 0 && (
                                                <div className="px-4 py-2.5 bg-rose-50 border-t border-rose-100 flex justify-between items-center">
                                                    <span className="text-[10px] text-rose-600 font-semibold">{unpaidCount} unpaid day(s) deducted from salary</span>
                                                    <span className="text-xs font-bold text-rose-700">-{formatCurrency(calculationDetails?.leave_deduction || 0)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* ── 3. Shift Roster vs Attendance ── */}
                        <div className="px-6 py-5">
                            <SectionHeader icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} iconBg="bg-violet-100" iconColor="text-violet-600" title="Shift Roster vs Attendance" subtitle="Compares rostered shifts against actual clock-in records" />
                            <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
                                <div className="grid grid-cols-4 bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Shift</span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center">Rostered Days</span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center">Days Attended</span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center">OT Rate</span>
                                </div>
                                {[
                                    { key: 'Morning', label: 'Morning', icon: '🌅', otKey: 'Day', def: '1.25', badgeBg: 'bg-amber-50', badgeText: 'text-amber-700', badgeBorder: 'border-amber-200' },
                                    { key: 'Day', label: 'Day', icon: '☀️', otKey: 'Day', def: '1.25', badgeBg: 'bg-sky-50', badgeText: 'text-sky-700', badgeBorder: 'border-sky-200' },
                                    { key: 'Evening', label: 'Evening', icon: '🌆', otKey: 'Day', def: '1.25', badgeBg: 'bg-orange-50', badgeText: 'text-orange-700', badgeBorder: 'border-orange-200' },
                                    { key: 'Night', label: 'Night', icon: '🌙', otKey: 'Night', def: '1.50', badgeBg: 'bg-indigo-50', badgeText: 'text-indigo-700', badgeBorder: 'border-indigo-200' },
                                ].map((shift, idx) => {
                                    const rostered = calculationDetails?.shift_summary?.rostered?.[shift.key] || 0;
                                    const attended = calculationDetails?.shift_summary?.attended?.[shift.key] || 0;
                                    const rawMult = calculationDetails?.overtime_breakdown?.[shift.otKey]?.multiplier;
                                    const mult = rawMult ? parseFloat(rawMult).toFixed(2) : shift.def;
                                    return (
                                        <div key={shift.key} className={`grid grid-cols-4 items-center px-4 py-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 last:border-0`}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{shift.icon}</span>
                                                <span className="text-[11px] font-semibold text-slate-700">{shift.label} Shift</span>
                                            </div>
                                            <div className="text-center">
                                                <span className={`text-[13px] font-bold ${rostered > 0 ? 'text-slate-700' : 'text-slate-300'}`}>{rostered}</span>
                                                <span className="text-[9px] text-slate-400 ml-1">days</span>
                                            </div>
                                            <div className="text-center">
                                                <span className={`text-[13px] font-bold ${attended > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>{attended}</span>
                                                <span className="text-[9px] text-slate-400 ml-1">days</span>
                                            </div>
                                            <div className="text-center">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-bold ${shift.badgeBg} ${shift.badgeText} ${shift.badgeBorder}`}>{mult}×</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-[9px] text-slate-400 mt-2 px-1">
                                Night shifts use a higher OT multiplier ({parseFloat(calculationDetails?.overtime_breakdown?.Night?.multiplier || 1.50).toFixed(2)}×) vs Day shifts ({parseFloat(calculationDetails?.overtime_breakdown?.Day?.multiplier || 1.25).toFixed(2)}×). Holiday OT uses {parseFloat(calculationDetails?.overtime_breakdown?.Holiday?.multiplier || 2.25).toFixed(2)}×.
                            </p>
                        </div>

                        {/* ── 4. Salary Formula ── */}
                        <div className="px-6 py-5">
                            <SectionHeader icon={<FaMoneyBillWave />} iconBg="bg-emerald-100" iconColor="text-emerald-600" title="Salary Calculation" subtitle={`Method: ${(calculationDetails?.salary_calculation_method || 'fixed').toUpperCase()} · ${calculationDetails?.effective_days_per_month || 30} effective days/month`} />
                            <div className="mt-3 space-y-2">
                                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">① Basic Salary</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Fixed monthly salary</p>
                                    </div>
                                    <span className="text-sm font-bold text-slate-800">{formatCurrency(calculationDetails?.basic_salary)}</span>
                                </div>
                                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">② Daily Rate</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{formatCurrency(calculationDetails?.basic_salary)} ÷ {calculationDetails?.effective_days_per_month || 30} days</p>
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{formatCurrency(calculationDetails?.daily_rate)} / day</span>
                                </div>
                                {(calculationDetails?.absent_days || 0) > 0 && (
                                    <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                                        <div>
                                            <p className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">③ Absent Deduction</p>
                                            <p className="text-[11px] text-rose-500 mt-0.5">{calculationDetails?.absent_days || 0} absent/unpaid days × {formatCurrency(calculationDetails?.daily_rate)}</p>
                                        </div>
                                        <span className="text-sm font-bold text-rose-700">-{formatCurrency(calculationDetails?.leave_deduction)}</span>
                                    </div>
                                )}
                                {Object.keys(calculationDetails?.allowances || {}).length > 0 && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                                        <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-2">④ Allowances</p>
                                        {Object.entries(calculationDetails.allowances).map(([name, amount]) => (
                                            <div key={name} className="flex justify-between items-center py-0.5">
                                                <span className="text-[11px] text-slate-600">{name}</span>
                                                <span className="text-[11px] font-semibold text-emerald-700">+{formatCurrency(amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {Object.entries(calculationDetails?.deductions || {}).filter(([k]) => !['Loan Repayment','Advance Repayment'].includes(k)).length > 0 && (
                                    <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                                        <p className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider mb-2">⑤ Deductions</p>
                                        {Object.entries(calculationDetails.deductions).filter(([k]) => !['Loan Repayment','Advance Repayment'].includes(k)).map(([name, amount]) => (
                                            <div key={name} className="flex justify-between items-center py-0.5">
                                                <span className="text-[11px] text-slate-600">{name}</span>
                                                <span className="text-[11px] font-semibold text-rose-700">-{formatCurrency(amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── 5. Overtime Breakdown ── */}
                        <div className="px-6 py-5">
                            <SectionHeader icon={<FaChartLine />} iconBg="bg-indigo-100" iconColor="text-indigo-600" title="Overtime Breakdown" subtitle={`${parseFloat(calculationDetails?.overtime_hours || 0).toFixed(2)} total OT hours · Base rate: ${formatCurrency(calculationDetails?.overtime_base_rate)}/hr`} />
                            <div className="grid grid-cols-3 gap-2 mt-3">
                                {[
                                    { label: 'OT Hours', value: `${parseFloat(calculationDetails?.overtime_hours || 0).toFixed(2)} hrs`, icon: '⏱️' },
                                    { label: 'Base Rate / Hr', value: formatCurrency(calculationDetails?.overtime_base_rate), icon: '💵' },
                                    { label: 'Total OT Pay', value: formatCurrency(calculationDetails?.overtime_amount), icon: '✅' },
                                ].map(item => (
                                    <div key={item.label} className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
                                        <p className="text-lg">{item.icon}</p>
                                        <p className="text-xs font-bold text-indigo-800 mt-1">{item.value}</p>
                                        <p className="text-[9px] text-indigo-500 uppercase tracking-wider mt-0.5">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
                                {[
                                    { key: 'Day', label: 'Day/Morning/Evening OT', icon: '☀️', color: 'text-amber-600' },
                                    { key: 'Night', label: 'Night Shift OT', icon: '🌙', color: 'text-indigo-600' },
                                    { key: 'Holiday', label: 'Holiday OT', icon: '🎉', color: 'text-rose-600' },
                                ].map((row, idx) => {
                                    const ot = calculationDetails?.overtime_breakdown?.[row.key];
                                    const hrs = parseFloat(ot?.hours || 0);
                                    if (hrs === 0) return null;
                                    const mult = parseFloat(ot?.multiplier || 0).toFixed(2);
                                    const baseRate = parseFloat(calculationDetails?.overtime_base_rate || 0);
                                    return (
                                        <div key={row.key} className={`flex items-center justify-between px-4 py-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 last:border-0`}>
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-base">{row.icon}</span>
                                                <div>
                                                    <p className="text-[11px] font-semibold text-slate-700">{row.label}</p>
                                                    <p className="text-[10px] text-slate-400">{hrs.toFixed(2)} hrs × {mult}× × {formatCurrency(baseRate)}/hr</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-[10px] font-bold ${row.color}`}>{mult}×</p>
                                                <p className="text-xs font-bold text-emerald-700">+{formatCurrency(ot.amount)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {!calculationDetails?.overtime_breakdown?.Day?.hours && !calculationDetails?.overtime_breakdown?.Night?.hours && !calculationDetails?.overtime_breakdown?.Holiday?.hours && (
                                    <div className="px-4 py-5 text-center text-[11px] text-slate-400 italic">No overtime recorded this period.</div>
                                )}
                            </div>
                        </div>

                        {/* ── 6. Final Net Salary Summary ── */}
                        <div className="px-6 py-5">
                            <SectionHeader icon={<FaMoneyBillWave />} iconBg="bg-slate-800" iconColor="text-white" title="Net Salary Summary" subtitle="Final calculation breakdown" />
                            <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                {[
                                    { label: 'Basic Salary', value: formatCurrency(calculationDetails?.basic_salary), color: 'text-slate-800', sign: '' },
                                    { label: 'Allowances (total)', value: formatCurrency(Object.values(calculationDetails?.allowances || {}).reduce((a, b) => a + b, 0)), color: 'text-emerald-700', sign: '+' },
                                    { label: 'Overtime Pay', value: formatCurrency(calculationDetails?.overtime_amount), color: 'text-emerald-700', sign: '+' },
                                    { label: 'Absent/Unpaid Deduction', value: formatCurrency(calculationDetails?.leave_deduction), color: 'text-rose-600', sign: '-' },
                                    { label: 'Other Deductions', value: formatCurrency(Object.values(calculationDetails?.deductions || {}).reduce((a, b) => a + b, 0)), color: 'text-rose-600', sign: '-' },
                                ].map((row, idx) => (
                                    <div key={idx} className={`flex justify-between items-center px-4 py-2.5 ${idx < 4 ? 'border-b border-slate-200' : ''}`}>
                                        <span className="text-[11px] text-slate-600">{row.label}</span>
                                        <span className={`text-[11px] font-bold ${row.color}`}>{row.sign}{row.value}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center px-4 py-3 bg-slate-800">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">🟢 Net Salary</span>
                                    <span className="text-base font-black text-emerald-400">{formatCurrency(calculationDetails?.net_salary)}</span>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Total Hours Worked</p>
                                    <p className="text-[10px] text-indigo-400 mt-0.5">Sum of all clock-in/out punches</p>
                                </div>
                                <p className="text-xl font-black text-indigo-700">{parseFloat(calculationDetails?.total_hours_worked || 0).toFixed(2)}<span className="text-xs font-semibold ml-1">hrs</span></p>
                            </div>
                        </div>

                    </div>

                    {/* ── Footer ── */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setShowDetailsModal(false)}
                            className="px-6 py-2 bg-slate-900 hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
