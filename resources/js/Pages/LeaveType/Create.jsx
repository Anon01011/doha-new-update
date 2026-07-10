import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { FaClipboardList, FaArrowLeft, FaSave, FaCode, FaCalendarAlt, FaInfoCircle, FaShieldAlt, FaHandHoldingUsd, FaPowerOff } from 'react-icons/fa';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        max_days_per_year: 0,
        carry_forward_allowed: false,
        carry_forward_max_days: null,
        requires_approval: true,
        is_paid: true,
        description: '',
        is_active: true,
    });

    const handleNameChange = (e) => {
        const name = e.target.value;
        setData('name', name);

        const code = name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 5);

        setData('code', code);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('leave-types.store'));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Add Leave Type</h2>}>
            <Head title="Add Leave Type" />

            <div className="py-4 px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <FaClipboardList size={120} />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <Link
                            href={route('leave-types.index')}
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-normal text-slate-900 leading-none mb-2">Add Leave Type</h2>
                            <p className="text-[10px] font-normal text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></span>
                                New Leave Policy
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                        <button
                            form="leave-type-form"
                            type="submit"
                            disabled={processing}
                            className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-normal hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {processing ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <FaSave size={12} />
                            )}
                            <span>Save Leave Type</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-8 md:p-10">
                                <form id="leave-type-form" onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                Name
                                            </label>
                                             <input
                                                type="text"
                                                className={`w-full px-5 py-3.5 bg-slate-50/50 border-2 ${errors.name ? 'border-rose-100 focus:border-rose-200' : 'border-slate-100 focus:border-slate-300'} rounded-xl focus:ring-0 transition-all outline-none text-[11px] font-normal placeholder:text-slate-300`}
                                                value={data.name}
                                                onChange={handleNameChange}
                                                required
                                                placeholder="e.g. Annual Leave"
                                            />
                                            {errors.name && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 flex items-center gap-1"><FaInfoCircle size={10} /> {errors.name}</p>}
                                        </div>

                                         <div className="space-y-3">
                                            <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                <FaCode className="text-slate-400" /> Code
                                            </label>
                                             <div className="relative group">
                                                <input
                                                    type="text"
                                                    className="w-full px-5 py-3.5 bg-slate-100 border-2 border-slate-100 rounded-xl outline-none text-[11px] font-normal text-slate-400 cursor-not-allowed"
                                                    value={data.code}
                                                    readOnly
                                                    placeholder="AUTO"
                                                />
                                                 <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[8px] font-normal text-slate-600 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                                                    Locked
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                     {/* Days */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50/50 rounded-xl border border-slate-100">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                <FaCalendarAlt className="text-slate-400" /> Max Days Per Year
                                            </label>
                                             <input
                                                type="number"
                                                className={`w-full px-5 py-3.5 bg-white border-2 ${errors.max_days_per_year ? 'border-rose-100 focus:border-rose-200' : 'border-slate-100 focus:border-slate-300'} rounded-xl focus:ring-0 transition-all outline-none text-[11px] font-normal`}
                                                value={data.max_days_per_year}
                                                onChange={(e) => setData('max_days_per_year', e.target.value)}
                                                required
                                                min="0"
                                            />
                                        </div>

                                         <div className="space-y-3">
                                            <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                Carry Forward Max
                                            </label>
                                             <input
                                                type="number"
                                                className="w-full px-5 py-3.5 bg-white border-2 border-slate-100 rounded-xl focus:border-slate-300 focus:ring-0 transition-all outline-none text-[11px] font-normal"
                                                value={data.carry_forward_max_days || ''}
                                                onChange={(e) => setData('carry_forward_max_days', e.target.value || null)}
                                                min="0"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                     {/* Policy */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <div className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${data.carry_forward_allowed ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 border-slate-900' : 'bg-white border-slate-100'}`} onClick={() => setData('carry_forward_allowed', !data.carry_forward_allowed)}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${data.carry_forward_allowed ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <FaCalendarAlt size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-[10px] font-normal ${data.carry_forward_allowed ? 'text-white' : 'text-slate-900'}`}>Carry Forward</p>
                                                <p className={`text-[9px] font-normal ${data.carry_forward_allowed ? 'text-white/60' : 'text-slate-400'}`}>Allow residual balance persistence</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-4 transition-all ${data.carry_forward_allowed ? 'bg-white border-white/20' : 'bg-white border-slate-100'}`}></div>
                                        </div>

                                          <div className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${data.requires_approval ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 border-slate-900' : 'bg-white border-slate-100'}`} onClick={() => setData('requires_approval', !data.requires_approval)}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${data.requires_approval ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <FaShieldAlt size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-[10px] font-normal ${data.requires_approval ? 'text-white' : 'text-slate-900'}`}>Requires Approval</p>
                                                <p className={`text-[9px] font-normal ${data.requires_approval ? 'text-white/60' : 'text-slate-400'}`}>Enforce managerial verification</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-4 transition-all ${data.requires_approval ? 'bg-white border-white/20' : 'bg-white border-slate-100'}`}></div>
                                        </div>

                                          <div className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${data.is_paid ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 border-slate-900' : 'bg-white border-slate-100'}`} onClick={() => setData('is_paid', !data.is_paid)}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${data.is_paid ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <FaHandHoldingUsd size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-[10px] font-normal ${data.is_paid ? 'text-white' : 'text-slate-900'}`}>Paid Leave</p>
                                                <p className={`text-[9px] font-normal ${data.is_paid ? 'text-white/60' : 'text-slate-400'}`}>Eligibility for compensation</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-4 transition-all ${data.is_paid ? 'bg-white border-white/20' : 'bg-white border-slate-100'}`}></div>
                                        </div>

                                          <div className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${data.is_active ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 border-slate-900' : 'bg-white border-slate-100'}`} onClick={() => setData('is_active', !data.is_active)}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${data.is_active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <FaPowerOff size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-[10px] font-normal ${data.is_active ? 'text-white' : 'text-slate-900'}`}>Status</p>
                                                <p className={`text-[9px] font-normal ${data.is_active ? 'text-white/60' : 'text-slate-400'}`}>Availability in selection</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-4 transition-all ${data.is_active ? 'bg-white border-white/20' : 'bg-white border-slate-100'}`}></div>
                                        </div>
                                    </div>

                                     {/* Description */}
                                     <div className="space-y-3">
                                         <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                             Description
                                         </label>
                                         <textarea
                                             className="w-full px-6 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-xl focus:border-slate-300 focus:ring-0 transition-all outline-none text-[11px] font-normal placeholder:text-slate-300 resize-none"
                                             rows={3}
                                             value={data.description}
                                             onChange={(e) => setData('description', e.target.value)}
                                             placeholder="Describe policy scope and eligibility criteria..."
                                         />
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                     {/* Guidelines */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 rounded-xl p-8 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 text-slate-700 opacity-20 group-hover:scale-110 transition-transform">
                                <FaInfoCircle size={80} />
                            </div>
                            <h3 className="text-sm font-normal mb-6 relative z-10 flex items-center gap-2">
                                <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                                How it works
                            </h3>
                            <ul className="space-y-6 relative z-10">
                                 <li className="flex gap-4">
                                    <div className="w-8 h-8 bg-white/10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-normal text-xs">01</div>
                                    <p className="text-[10px] font-normal text-slate-400 leading-relaxed">
                                        <span className="text-white font-normal">Max Days</span> determines the maximum quota per personnel cycle.
                                    </p>
                                </li>
                                 <li className="flex gap-4">
                                    <div className="w-8 h-8 bg-white/10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-normal text-xs">02</div>
                                    <p className="text-[10px] font-normal text-slate-400 leading-relaxed">
                                        <span className="text-white font-normal">Carry Forward</span> logic allows unused quota to migrate to subsequent periods.
                                    </p>
                                </li>
                                 <li className="flex gap-4">
                                    <div className="w-8 h-8 bg-white/10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-normal text-xs">03</div>
                                    <p className="text-[10px] font-normal text-slate-400 leading-relaxed">
                                        <span className="text-white font-normal">Approval</span> ensures all applications route through managerial review.
                                    </p>
                                </li>
                            </ul>
                        </div>

                         {/* System Info */}
                        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
                            <h3 className="text-[10px] font-normal text-slate-900 mb-6 flex items-center gap-2">
                                <FaShieldAlt className="text-slate-400" /> System Info
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                    <span className="text-[10px] font-normal text-slate-400">Code</span>
                                    <span className="text-[11px] font-normal text-slate-900">{data.code || 'None'}</span>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-[10px] font-normal text-slate-400">State</span>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-normal border border-emerald-100">Stable</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
