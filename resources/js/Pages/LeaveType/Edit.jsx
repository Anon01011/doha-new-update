import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { FaClipboardList, FaArrowLeft, FaSave, FaCode, FaCalendarAlt, FaInfoCircle, FaShieldAlt, FaHandHoldingUsd, FaPowerOff, FaEdit } from 'react-icons/fa';

export default function Edit({ leaveType }) {
    const { data, setData, put, processing, errors } = useForm({
        name: leaveType.name || '',
        code: leaveType.code || '',
        max_days_per_year: leaveType.max_days_per_year || 0,
        carry_forward_allowed: leaveType.carry_forward_allowed || false,
        carry_forward_max_days: leaveType.carry_forward_max_days || null,
        requires_approval: leaveType.requires_approval !== false,
        is_paid: Boolean(leaveType.is_paid),
        description: leaveType.description || '',
        is_active: leaveType.is_active !== false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('leave-types.update', leaveType.id));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Edit Leave Type</h2>}>
            <Head title="Edit Leave Type" />

            <div className="py-4 px-3 sm:px-4 lg:px-6 space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <FaEdit size={120} />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <Link 
                            href={route('leave-types.show', leaveType.id)} 
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-normal text-slate-900 leading-none mb-2">Edit Leave Type</h2>
                            <p className="text-[10px] font-normal text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></span>
                                Leave Type: {leaveType.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                         <button
                            form="leave-type-edit-form"
                            type="submit"
                            disabled={processing}
                            className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-normal hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {processing ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <FaSave size={12} />
                            )}
                            <span>Save Changes</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Form */}
                     <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 md:p-8">
                                <form id="leave-type-edit-form" onSubmit={handleSubmit} className="space-y-8">
                                    {/* Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                             <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                Name
                                            </label>
                                             <input
                                                type="text"
                                                className={`w-full px-5 py-3 bg-slate-50 border ${errors.name ? 'border-rose-200 focus:border-rose-300' : 'border-slate-200 focus:border-slate-300'} rounded-xl focus:ring-0 transition-all outline-none text-[11px] font-normal placeholder:text-slate-300`}
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                required
                                            />
                                            {errors.name && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 flex items-center gap-1"><FaInfoCircle size={10} /> {errors.name}</p>}
                                        </div>

                                         <div className="space-y-3">
                                             <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                <FaCode className="text-slate-400" /> Code
                                            </label>
                                             <input
                                                type="text"
                                                className={`w-full px-5 py-3 bg-slate-50 border ${errors.code ? 'border-rose-200 focus:border-rose-300' : 'border-slate-200 focus:border-slate-300'} rounded-xl focus:ring-0 transition-all outline-none text-[11px] font-normal placeholder:text-slate-300`}
                                                value={data.code}
                                                onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                                required
                                            />
                                            {errors.code && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 flex items-center gap-1"><FaInfoCircle size={10} /> {errors.code}</p>}
                                        </div>
                                    </div>

                                    {/* Days */}
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                <FaCalendarAlt className="text-slate-400" /> Max Days Per Year
                                            </label>
                                             <input
                                                type="number"
                                                className={`w-full px-5 py-3 bg-white border ${errors.max_days_per_year ? 'border-rose-200 focus:border-rose-300' : 'border-slate-200 focus:border-slate-300'} rounded-xl focus:ring-0 transition-all outline-none text-[11px] font-normal`}
                                                value={data.max_days_per_year}
                                                onChange={(e) => setData('max_days_per_year', e.target.value)}
                                                required
                                                min="0"
                                            />
                                        </div>

                                         <div className="space-y-3">
                                            <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                Max Carry Forward Days
                                            </label>
                                             <input
                                                type="number"
                                                className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:border-slate-300 focus:ring-0 transition-all outline-none text-[11px] font-normal"
                                                value={data.carry_forward_max_days || ''}
                                                onChange={(e) => setData('carry_forward_max_days', e.target.value || null)}
                                                min="0"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                     {/* Policy */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${data.carry_forward_allowed ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' : 'bg-white border-slate-100'}`} onClick={() => setData('carry_forward_allowed', !data.carry_forward_allowed)}>
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${data.carry_forward_allowed ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <FaCalendarAlt size={14} />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-[10px] font-normal ${data.carry_forward_allowed ? 'text-white' : 'text-slate-900'}`}>Carry Forward</p>
                                                <p className={`text-[9px] font-normal ${data.carry_forward_allowed ? 'text-white/60' : 'text-slate-400'}`}>Allow unused days to be used next year</p>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border-2 transition-all ${data.carry_forward_allowed ? 'bg-white border-white/20' : 'bg-white border-slate-100'}`}></div>
                                        </div>

                                           <div className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${data.requires_approval ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' : 'bg-white border-slate-100'}`} onClick={() => setData('requires_approval', !data.requires_approval)}>
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${data.requires_approval ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <FaShieldAlt size={14} />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-[10px] font-normal ${data.requires_approval ? 'text-white' : 'text-slate-900'}`}>Requires Approval</p>
                                                <p className={`text-[9px] font-normal ${data.requires_approval ? 'text-white/60' : 'text-slate-400'}`}>Requires manager approval</p>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border-2 transition-all ${data.requires_approval ? 'bg-white border-white/20' : 'bg-white border-slate-100'}`}></div>
                                        </div>

                                           <div className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${data.is_paid ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' : 'bg-white border-slate-100'}`} onClick={() => setData('is_paid', !data.is_paid)}>
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${data.is_paid ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <FaHandHoldingUsd size={14} />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-[10px] font-normal ${data.is_paid ? 'text-white' : 'text-slate-900'}`}>Paid Leave</p>
                                                <p className={`text-[9px] font-normal ${data.is_paid ? 'text-white/60' : 'text-slate-400'}`}>This is a paid leave type</p>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border-2 transition-all ${data.is_paid ? 'bg-white border-white/20' : 'bg-white border-slate-100'}`}></div>
                                        </div>

                                           <div className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${data.is_active ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' : 'bg-white border-slate-100'}`} onClick={() => setData('is_active', !data.is_active)}>
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${data.is_active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <FaPowerOff size={14} />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-[10px] font-normal ${data.is_active ? 'text-white' : 'text-slate-900'}`}>Active</p>
                                                <p className={`text-[9px] font-normal ${data.is_active ? 'text-white/60' : 'text-slate-400'}`}>Visible in the system</p>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border-2 transition-all ${data.is_active ? 'bg-white border-white/20' : 'bg-white border-slate-100'}`}></div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                     <div className="space-y-3">
                                        <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                            Description
                                        </label>
                                        <textarea
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-300 focus:ring-0 transition-all outline-none text-[11px] font-normal placeholder:text-slate-300 resize-none"
                                            rows={3}
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Enter description..."
                                        />
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Guidelines */}
                    <div className="space-y-6">
                         <div className="bg-slate-900 rounded-xl p-6 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 text-slate-700 opacity-20 group-hover:scale-110 transition-transform">
                                <FaInfoCircle size={60} />
                            </div>
                            <h3 className="text-xs font-normal mb-6 relative z-10 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                Guidelines
                            </h3>
                            <ul className="space-y-5 relative z-10">
                                <li className="flex gap-4">
                                    <div className="w-7 h-7 bg-white/10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-normal text-[10px]">01</div>
                                    <p className="text-[10px] font-normal text-slate-200 leading-relaxed">
                                        Modifying <span className="text-white">Annual Limit</span> will update quotas for all employees.
                                    </p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-7 h-7 bg-white/10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-normal text-[10px]">02</div>
                                    <p className="text-[10px] font-normal text-slate-200 leading-relaxed">
                                        Leave Type <span className="text-white">Deactivation</span> prevents new requests but keeps old records.
                                    </p>
                                </li>
                            </ul>
                        </div>

                        {/* Summary View */}
                         <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-[10px] font-normal text-slate-900 mb-6 flex items-center gap-2">
                                <FaShieldAlt className="text-slate-400" /> Summary
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                    <span className="text-[10px] font-normal text-slate-400">Code</span>
                                    <span className="text-[11px] font-normal text-slate-900">{leaveType.code}</span>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-[10px] font-normal text-slate-400">Status</span>
                                    <span className={`px-3 py-1 rounded-xl text-[9px] font-normal border ${data.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                        {data.is_active ? 'Active' : 'Deactivated'}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-8">
                                <Link
                                    href={route('leave-types.show', leaveType.id)}
                                    className="block w-full py-3.5 bg-slate-50 text-slate-500 rounded-xl text-[11px] font-normal hover:bg-slate-100 transition-all text-center border border-slate-100"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
