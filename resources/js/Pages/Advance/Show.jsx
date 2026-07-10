import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { FaMoneyBillWave, FaCalendarAlt, FaCheckCircle, FaClock, FaArrowLeft, FaEdit, FaUserCheck, FaTrash, FaTimesCircle, FaUser, FaShieldAlt, FaHistory, FaInfoCircle, FaChartPie } from 'react-icons/fa';
import Avatar from '@/Components/Avatar';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Show({ advance, userRole = 'employee' }) {
    const { appSettings } = usePage().props;
    const currency = appSettings?.currency || 'QAR';
    const currency_symbol = appSettings?.currency_symbol || 'QAR';

    const [modal, setModal] = useState({
        show: false,
        type: 'approve',
        processing: false
    });

    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: currency 
    }).format(amount || 0);

    const formatDate = (date) => date ? new Date(date).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    }) : 'N/A';

    const getStatusStyles = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'approved') return { 
            bg: 'bg-emerald-500/10', 
            text: 'text-emerald-600', 
            border: 'border-emerald-500/20', 
            label: 'APPROVED' 
        };
        if (s === 'repaid') return { 
            bg: 'bg-indigo-500/10', 
            text: 'text-indigo-600', 
            border: 'border-indigo-500/20', 
            label: 'REPAID' 
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

    const statusStyle = getStatusStyles(advance.status);

    const handleAction = () => {
        setModal(prev => ({ ...prev, processing: true }));
        if (modal.type === 'approve') {
            router.post(route('advances.approve', advance.id), {}, {
                onFinish: () => setModal({ show: false, type: 'approve', processing: false })
            });
        } else {
            router.delete(route('advances.destroy', advance.id), {
                onFinish: () => setModal({ show: false, type: 'delete', processing: false })
            });
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Advance Details</h2>}>
            <Head title={`Details - ${advance.employee?.name}`} />

            <div className="p-4 sm:p-6 space-y-4">
                {/* Executive Control Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 bg-primary h-full"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <Link 
                            href={route('advances.index')} 
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-normal text-slate-900 tracking-normal leading-none mb-2 uppercase">Advance Details</h2>
                            <p className="text-[10px] font-normal text-slate-400 uppercase flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                                Reference: ADV-{advance.id}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                        {userRole !== 'employee' && advance.status?.toLowerCase() === 'pending' && (
                            <button
                                onClick={() => setModal({ show: true, type: 'approve', processing: false })}
                                className="w-full sm:w-auto px-6 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-normal uppercase hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FaCheckCircle size={10} />
                                Approve
                            </button>
                        )}
                        {(userRole !== 'employee' || advance.status?.toLowerCase() === 'pending') && (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Link
                                    href={route('advances.edit', advance.id)}
                                    className="flex-1 sm:flex-none px-6 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-normal uppercase hover:bg-primary transition-all shadow-lg shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <FaEdit size={10} />
                                    Edit
                                </Link>
                                <button
                                    onClick={() => setModal({ show: true, type: 'delete', processing: false })}
                                    className="flex-1 sm:flex-none px-6 py-2 bg-white border border-rose-100 text-rose-600 rounded-lg text-[10px] font-normal uppercase hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <FaTrash size={10} />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    {/* Primary Statement Column */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Personnel Profile */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden group">
                            <div className="p-4 flex flex-col md:flex-row items-center gap-6">
                                <Avatar 
                                    src={advance.employee?.employee_image}
                                    name={advance.employee?.name}
                                    size="xl"
                                    className="rounded-lg ring-8 ring-slate-50 group-hover:scale-105 transition-transform"
                                />
                                <div className="text-center md:text-left flex-1 space-y-1">
                                    <p className="text-[10px] font-normal text-primary uppercase">Employee Details</p>
                                    <h2 className="text-2xl font-normal text-slate-900 uppercase tracking-normal">{advance.employee?.name}</h2>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                        <span className="px-2 py-1 bg-slate-50 text-slate-500 rounded text-[9px] font-normal uppercase border border-slate-100">
                                            ID: {advance.employee?.employee_code || 'N/A'}
                                        </span>
                                        <span className="px-2 py-1 bg-slate-50 text-slate-500 rounded text-[9px] font-normal uppercase border border-slate-100">
                                            {advance.employee?.department?.name || 'GENERIC UNIT'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-center md:text-right">
                                    <span className={`px-3 py-1 rounded text-[9px] font-normal uppercase border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                        {statusStyle.label}
                                    </span>
                                    <p className="text-[10px] font-normal text-slate-400 uppercase mt-4">Request Date</p>
                                    <p className="text-lg font-normal text-slate-900 uppercase">{formatDate(advance.request_date)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Narrative Details */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
                            <h3 className="text-sm font-normal text-slate-900 uppercase flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"><FaInfoCircle size={12}/></div>
                                Purpose
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 text-primary opacity-5 group-hover:scale-110 transition-transform">
                                        <FaMoneyBillWave size={80} />
                                    </div>
                                    <p className="text-[10px] font-normal text-slate-400 uppercase mb-2">Reason</p>
                                    <p className="text-base font-normal text-slate-700 leading-relaxed relative z-10">
                                        {advance.purpose || 'No formal objective stated.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-normal text-slate-400 uppercase">Repayment Date</p>
                                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                            <FaCalendarAlt className="text-primary" size={12} />
                                            <span className="text-[10px] font-normal text-slate-900 uppercase">{formatDate(advance.repayment_date)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-normal text-slate-400 uppercase">Payment Cycle</p>
                                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                            <FaClock className="text-primary" size={12} />
                                            <span className="text-[10px] font-normal text-slate-900 uppercase">NEXT PAYROLL CYCLE</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Intelligence Sidebar */}
                    <div className="space-y-4">
                        <div className="bg-slate-900 rounded-lg p-5 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 text-white opacity-20 group-hover:scale-110 transition-transform">
                                <FaChartPie size={80} />
                            </div>
                            <h3 className="text-[10px] font-normal uppercase mb-8 opacity-60 flex items-center gap-2">
                                <span className="w-2 h-2 bg-white rounded-full"></span>
                                Summary
                            </h3>
                            
                            <div className="space-y-6 relative z-10">
                                <div>
                                    <p className="text-[10px] font-normal text-slate-500 uppercase mb-1">Amount</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-normal text-white">{currency_symbol}</span>
                                        <h2 className="text-4xl font-normal tracking-normal">
                                            {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(advance.amount)}
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-white/10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-normal text-slate-500 uppercase">Type</span>
                                        <span className="text-[10px] font-normal text-slate-200 uppercase">ADVANCE</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-normal text-slate-500 uppercase">Priority</span>
                                        <span className="text-[10px] font-normal text-emerald-400 uppercase">HIGH</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* History Trail */}
                        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                            <h3 className="text-[10px] font-normal text-slate-900 uppercase mb-4 flex items-center gap-2">
                                <FaHistory className="text-primary" /> History
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0"><FaClock size={12}/></div>
                                    <div>
                                        <p className="text-[9px] font-normal text-slate-400 uppercase">Requested On</p>
                                        <p className="text-[10px] font-normal text-slate-900 uppercase">{new Date(advance.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0"><FaUserCheck size={12}/></div>
                                    <div>
                                        <p className="text-[9px] font-normal text-slate-400 uppercase">Verified By</p>
                                        <p className="text-[10px] font-normal text-slate-900 uppercase">{advance.approved_by_user?.name || 'SYSTEM'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex gap-4">
                            <FaShieldAlt className="text-primary shrink-0 mt-1" size={14} />
                            <p className="text-[9px] font-normal text-slate-500 uppercase leading-relaxed">
                                ADVANCES ARE SUBJECT TO OPERATIONAL LIMITS.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                show={modal.show}
                onClose={() => setModal({ show: false, type: modal.type, processing: false })}
                onConfirm={handleAction}
                title={modal.type === 'approve' ? 'Approve Advance' : 'Delete Request'}
                message={modal.type === 'approve' ? 'Are you sure you want to approve this salary advance?' : 'Are you sure you want to delete this request? This action cannot be undone.'}
                confirmText={modal.type === 'approve' ? 'APPROVE' : 'DELETE'}
                type={modal.type === 'approve' ? 'success' : 'danger'}
                processing={modal.processing}
            />
        </AuthenticatedLayout>
    );
}
