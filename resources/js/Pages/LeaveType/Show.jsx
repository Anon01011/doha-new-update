import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { FaClipboardList, FaArrowLeft, FaEdit, FaCheckCircle, FaTimesCircle, FaCode, FaCalendarAlt, FaShieldAlt, FaHandHoldingUsd, FaClock, FaInfoCircle } from 'react-icons/fa';

export default function Show({ leaveType }) {
    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Leave Type Details</h2>}>
            <Head title={`Leave Type - ${leaveType.name}`} />

            <div className="py-4 px-3 sm:px-4 lg:px-6 space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10">
                        <Link 
                            href={route('leave-types.index')} 
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-normal text-slate-900 leading-none mb-2">Leave Type Details</h2>
                            <p className="text-[10px] font-normal text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></span>
                                Reference: {leaveType.code}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                         <Link
                            href={route('leave-types.edit', leaveType.id)}
                            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-normal hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <FaEdit size={10} />
                            Edit Leave Type
                        </Link>
                        <span className={`px-4 py-2 rounded-xl text-[10px] font-normal border ${leaveType.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'} flex items-center gap-2`}>
                            {leaveType.is_active ? <FaCheckCircle /> : <FaTimesCircle />}
                            {leaveType.is_active ? 'Active' : 'Inactive'}
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
                                            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                                <FaClipboardList size={24} />
                                            </div>
                                             <div>
                                                <p className="text-[10px] font-normal text-slate-400 mb-1">Name</p>
                                                <h3 className="text-lg font-normal text-slate-900 leading-tight">
                                                    {leaveType.name}
                                                </h3>
                                                <p className="mt-1 text-[10px] font-normal text-slate-500">ID: {leaveType.id}</p>
                                            </div>
                                        </div>

                                         <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                                <FaCalendarAlt size={24} />
                                            </div>
                                              <div>
                                                <p className="text-[10px] font-normal text-slate-400 mb-1">Max Days Per Year</p>
                                                <h3 className="text-lg font-normal text-slate-900 leading-tight">
                                                    {leaveType.max_days_per_year} <span className="text-[10px] text-slate-400">Days</span>
                                                </h3>
                                                <div className={`mt-2 inline-flex items-center px-3 py-1 ${leaveType.is_paid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'} rounded-xl text-[9px] font-normal border`}>
                                                    {leaveType.is_paid ? 'Paid Leave' : 'Unpaid Leave'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                     <div className="space-y-6">
                                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
                                                <FaInfoCircle size={40} />
                                            </div>
                                            <p className="text-[10px] font-normal text-slate-400 mb-2 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                                Description
                                            </p>
                                            <p className="text-xs font-normal text-slate-600 leading-relaxed italic">
                                                "{leaveType.description || 'No description provided.'}"
                                            </p>
                                        </div>

                                         <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                                <p className="text-[9px] font-normal text-slate-400 mb-2">Approval</p>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${leaveType.requires_approval ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                                                    <span className="text-[10px] font-normal text-slate-900">{leaveType.requires_approval ? 'Required' : 'Auto'}</span>
                                                </div>
                                            </div>
                                             <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                                <p className="text-[9px] font-normal text-slate-400 mb-2">Carry Forward</p>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${leaveType.carry_forward_allowed ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>
                                                    <span className="text-[10px] font-normal text-slate-900">{leaveType.carry_forward_allowed ? 'Yes' : 'No'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                         {/* Carry Forward */}
                          {leaveType.carry_forward_allowed && (
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 relative overflow-hidden group">
                                <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform">
                                    <FaClock size={150} />
                                </div>
                                <h3 className="text-xs font-normal text-slate-900 mb-6 flex items-center gap-3">
                                    <FaClock className="text-slate-400" /> Rules
                                </h3>
                                <div className="flex items-center justify-between max-w-md">
                                    <div>
                                        <p className="text-[10px] font-normal text-slate-400 mb-1">Max Days</p>
                                        <p className="text-xl font-normal text-slate-900">{leaveType.carry_forward_max_days || 'Unlimited'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-normal text-slate-400 mb-1">Reset</p>
                                        <p className="text-xl font-normal text-slate-900">Annual</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Meta Data Sidebar */}
                    <div className="space-y-6">
                         <div className="bg-slate-900 rounded-xl p-6 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 text-slate-700 opacity-20 group-hover:rotate-12 transition-transform">
                                <FaShieldAlt size={60} />
                            </div>
                            <h3 className="text-[10px] font-normal mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                System Info
                            </h3>
                              <div className="space-y-5 relative z-10">
                                <div>
                                    <p className="text-[9px] font-normal text-slate-500 mb-1">Code</p>
                                    <p className="text-lg font-normal text-white">{leaveType.code}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-normal text-slate-500 mb-1">Status</p>
                                    <p className="text-xs font-normal text-slate-200 flex items-center gap-2">
                                        {leaveType.is_active ? 'Active' : 'Inactive'}
                                    </p>
                                </div>
                                <div className="pt-5 border-t border-white/10">
                                    <p className="text-[9px] font-normal text-slate-500 mb-1">Created On</p>
                                    <p className="text-xs font-normal text-slate-400">{formatDate(leaveType.created_at)}</p>
                                </div>
                            </div>
                        </div>

                         {/* Audit Metadata */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-[10px] font-normal text-slate-900 mb-6 flex items-center gap-2">
                                <FaInfoCircle className="text-slate-400" /> Audit
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                    <span className="text-[10px] font-normal text-slate-400">Last Updated</span>
                                    <span className="text-[10px] font-normal text-slate-900">{formatDate(leaveType.updated_at)}</span>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-[10px] font-normal text-slate-400">Usage</span>
                                    <span className="text-[10px] font-normal text-slate-900">Normal</span>
                                </div>
                            </div>
                            <div className="mt-8">
                                <Link
                                    href={route('leave-types.index')}
                                    className="block w-full py-3.5 bg-slate-50 text-slate-500 rounded-xl text-[11px] font-normal hover:bg-slate-100 transition-all text-center border border-slate-100"
                                >
                                    Back to List
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
