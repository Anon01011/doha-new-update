import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { FaCalendarAlt, FaUser, FaClipboardList, FaArrowLeft, FaEdit, FaCheck, FaTimes, FaClock, FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';
import Avatar from '@/Components/Avatar';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Show({ leaveRequest, userRole = 'employee' }) {
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusStyles = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'approved') return {
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-600',
            border: 'border-emerald-500/20',
            icon: <FaCheckCircle className="text-emerald-500" />
        };
        if (s === 'rejected') return {
            bg: 'bg-rose-500/10',
            text: 'text-rose-600',
            border: 'border-rose-500/20',
            icon: <FaTimesCircle className="text-rose-500" />
        };
        if (s === 'pending') return {
            bg: 'bg-amber-500/10',
            text: 'text-amber-600',
            border: 'border-amber-500/20',
            icon: <FaClock className="text-amber-500" />
        };
        return {
            bg: 'bg-indigo-500/10',
            text: 'text-indigo-600',
            border: 'border-indigo-500/20',
            icon: <FaInfoCircle className="text-indigo-500" />
        };
    };

    const statusStyle = getStatusStyles(leaveRequest.status);

    const handleApprove = () => {
        setProcessing(true);
        router.post(route('leave-requests.approve', leaveRequest.id), {}, {
            onFinish: () => {
                setProcessing(false);
                setShowApproveModal(false);
            }
        });
    };

    const handleReject = (e) => {
        e.preventDefault();
        if (!rejectionReason.trim()) return;

        setProcessing(true);
        router.post(route('leave-requests.reject', leaveRequest.id), {
            rejection_reason: rejectionReason
        }, {
            onFinish: () => {
                setProcessing(false);
                setShowRejectModal(false);
                setRejectionReason('');
            }
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Leave Request Details</h2>}>
            <Head title={`Leave Request Review - #${leaveRequest.id}`} />

            <div className="py-4 px-3 sm:px-4 lg:px-6 space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10">
                        <Link 
                            href={route('leave-requests.index')} 
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-normal text-slate-900 leading-none mb-2">Leave Details</h2>
                            <p className="text-[10px] font-normal text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></span>
                                Request ID: LVE-{String(leaveRequest.id).padStart(6, '0')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                         {leaveRequest.status === 'pending' && userRole !== 'employee' && (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => setShowApproveModal(true)}
                                    className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-normal hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <FaCheck size={10} />
                                    Approve
                                </button>
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    className="flex-1 sm:flex-none px-6 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-normal hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <FaTimes size={10} />
                                    Reject
                                </button>
                            </div>
                        )}
                         {leaveRequest.status === 'pending' && userRole === 'employee' && (
                            <Link
                                href={route('leave-requests.edit', leaveRequest.id)}
                                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-normal hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FaEdit size={10} />
                                Edit Request
                            </Link>
                        )}
                         <span className={`px-4 py-2 rounded-xl text-[10px] font-normal border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} flex items-center gap-2`}>
                            {statusStyle.icon}
                            {leaveRequest.status.charAt(0).toUpperCase() + leaveRequest.status.slice(1).toLowerCase()}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Details */}
                     <div className="lg:col-span-2 space-y-4">
                        {/* Information */}
                         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group">
                            <div className="p-6 md:p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                                                <FaCalendarAlt size={20} />
                                            </div>
                                             <div>
                                                <p className="text-[10px] font-normal text-slate-400 mb-1">Dates</p>
                                                <h3 className="text-base font-normal text-slate-900 leading-tight">
                                                    {formatDate(leaveRequest.start_date)} — {formatDate(leaveRequest.end_date)}
                                                </h3>
                                                <div className="mt-2 inline-flex items-center px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-normal border border-slate-200">
                                                    {leaveRequest.number_of_days} Days
                                                </div>
                                            </div>
                                        </div>

                                         <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                                                <FaClipboardList size={20} />
                                            </div>
                                             <div>
                                                <p className="text-[10px] font-normal text-slate-400 mb-1">Leave Type</p>
                                                <h3 className="text-base font-normal text-slate-900 leading-tight">
                                                    {leaveRequest.leave_type?.name}
                                                </h3>
                                                <p className="mt-1 text-[10px] font-normal text-slate-500">Priority: Standard</p>
                                            </div>
                                        </div>
                                    </div>

                                     <div className="space-y-6">
                                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden group/box">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/box:rotate-12 transition-transform">
                                                <FaInfoCircle size={40} />
                                            </div>
                                             <p className="text-[10px] font-normal text-slate-400 mb-3 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                                Reason
                                            </p>
                                            <p className="text-sm font-normal text-slate-600 leading-relaxed italic">
                                                "{leaveRequest.reason || 'No reason provided.'}"
                                            </p>
                                        </div>

                                         {leaveRequest.rejection_reason && (
                                             <div className="p-6 bg-rose-50 rounded-xl border border-rose-100 relative overflow-hidden">
                                                <p className="text-[10px] font-normal text-rose-500 mb-3 flex items-center gap-2">
                                                    <FaTimesCircle /> Rejection Reason
                                                </p>
                                                <p className="text-sm font-normal text-rose-600 leading-relaxed">
                                                    {leaveRequest.rejection_reason}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                         <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
                            <h3 className="text-[10px] font-normal text-slate-900 mb-8 flex items-center gap-3">
                                <span className="w-6 h-6 bg-slate-900 text-white rounded-xl flex items-center justify-center text-[8px]">01</span>
                                Timeline
                            </h3>
                            <div className="space-y-10 relative">
                                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100"></div>
                                
                                  <div className="relative pl-12 group/step">
                                    <div className="absolute left-2 top-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white shadow-sm ring-2 ring-emerald-100 group-hover:scale-125 transition-transform"></div>
                                    <div>
                                        <p className="text-[10px] font-normal text-slate-400 mb-1">Submitted</p>
                                        <p className="text-sm font-normal text-slate-900 leading-none mb-1">Leave Request Sent</p>
                                        <p className="text-[10px] font-normal text-slate-500">{formatDate(leaveRequest.created_at)}</p>
                                    </div>
                                </div>

                                  <div className="relative pl-12 group/step">
                                    <div className={`absolute left-2 top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ring-2 transition-all group-hover:scale-125 ${
                                        leaveRequest.manager_approval_status === 'approved' ? 'bg-emerald-500 ring-emerald-100' : 
                                        leaveRequest.manager_approval_status === 'rejected' ? 'bg-rose-500 ring-rose-100' : 'bg-amber-500 ring-amber-100'
                                    }`}></div>
                                    <div>
                                        <p className="text-[10px] font-normal text-slate-400 mb-1">Manager Approval</p>
                                        <p className="text-sm font-normal text-slate-900 leading-none mb-1">
                                            Status: <span>{leaveRequest.manager_approval_status.charAt(0).toUpperCase() + leaveRequest.manager_approval_status.slice(1).toLowerCase()}</span>
                                        </p>
                                        {leaveRequest.manager_id && (
                                            <p className="text-[10px] font-normal text-slate-500 mt-1">Reviewed by: {leaveRequest.manager?.name}</p>
                                        )}
                                    </div>
                                </div>

                                  <div className="relative pl-12 group/step">
                                    <div className={`absolute left-2 top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ring-2 transition-all group-hover:scale-125 ${
                                        leaveRequest.hr_approval_status === 'approved' ? 'bg-emerald-500 ring-emerald-100' : 
                                        leaveRequest.hr_approval_status === 'rejected' ? 'bg-rose-500 ring-rose-100' : 'bg-slate-200 ring-slate-100'
                                    }`}></div>
                                    <div>
                                        <p className="text-[10px] font-normal text-slate-400 mb-1">HR Approval</p>
                                        <p className="text-sm font-normal text-slate-900 leading-none mb-1">
                                            Status: <span>{leaveRequest.hr_approval_status.charAt(0).toUpperCase() + leaveRequest.hr_approval_status.slice(1).toLowerCase()}</span>
                                        </p>
                                        {leaveRequest.hr_id && (
                                            <p className="text-[10px] font-normal text-slate-500 mt-1">Reviewed by: {leaveRequest.hr?.name}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                     <div className="space-y-6">
                        <div className="bg-slate-900 rounded-xl p-6 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute -bottom-10 -right-10 p-10 text-slate-700 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                                <FaUser size={120} />
                            </div>
                            <h3 className="text-xs font-normal mb-8 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                Employee
                            </h3>
                            <div className="flex flex-col items-center text-center relative z-10">
                                 <Avatar
                                    src={leaveRequest.employee?.employee_image}
                                    name={leaveRequest.employee?.name}
                                    size="lg"
                                    className="w-24 h-24 rounded-xl border-4 border-white/10 mb-6 shadow-xl"
                                />
                                <h4 className="text-lg font-normal leading-none mb-2">{leaveRequest.employee?.name}</h4>
                                <p className="text-[10px] font-normal text-slate-500 mb-6">{leaveRequest.employee?.employee_code}</p>
                                
                                  <div className="w-full grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                                        <p className="text-[8px] font-normal text-white/40 mb-1">Department</p>
                                        <p className="text-[10px] font-normal text-white truncate">{leaveRequest.employee?.department?.name || 'N/A'}</p>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                                        <p className="text-[8px] font-normal text-white/40 mb-1">Role</p>
                                        <p className="text-[10px] font-normal text-white truncate">{leaveRequest.employee?.designation || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                         <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-[10px] font-normal text-slate-900 mb-6 flex items-center gap-2">
                                <FaClock className="text-slate-400" /> Information
                            </h3>
                            <div className="space-y-4">
                                  <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                    <span className="text-[10px] font-normal text-slate-400">Submitted On</span>
                                    <span className="text-[10px] font-normal text-slate-900">{formatDate(leaveRequest.created_at)}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                    <span className="text-[10px] font-normal text-slate-400">Total Days</span>
                                    <span className="text-[10px] font-normal text-slate-900">{leaveRequest.number_of_days} Days</span>
                                </div>
                                 <div className="flex justify-between items-center py-3">
                                    <span className="text-[10px] font-normal text-slate-400">Priority</span>
                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-xl text-[8px] font-normal border border-amber-100">Standard</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                show={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                onConfirm={handleApprove}
                 title="Approve Leave"
                message="Confirm you want to approve this leave request. This will update the schedule and notify the employee."
                confirmText="Approve"
                processing={processing}
                type="success"
            />

            <Modal show={showRejectModal} onClose={() => setShowRejectModal(false)} maxWidth="md">
                <form onSubmit={handleReject} className="p-8">
                      <h2 className="text-xl font-normal text-slate-900 mb-4 flex items-center gap-3">
                        <FaTimesCircle className="text-rose-500" /> Reject Leave
                    </h2>
                    <p className="text-[11px] font-normal text-slate-500 leading-relaxed mb-6">
                        Provide a reason for rejecting this request. This will be sent to the employee.
                    </p>
                     <textarea
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-rose-500 focus:ring-0 transition-all outline-none text-sm font-normal resize-none mb-8"
                        placeholder="Reason for rejection..."
                        rows="4"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        required
                    ></textarea>
                    <div className="flex items-center gap-4">
                         <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 bg-rose-600 text-white px-8 py-4 rounded-xl text-[11px] font-normal hover:bg-rose-700 shadow-xl shadow-rose-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                            Reject Request
                        </button>
                        <SecondaryButton onClick={() => setShowRejectModal(false)} className="px-8 py-4 rounded-xl border-2 text-[11px] font-normal h-[52px]">
                            Cancel
                        </SecondaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
