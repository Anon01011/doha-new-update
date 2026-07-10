import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import { FaMoneyBillWave, FaArrowLeft, FaSave, FaTag, FaPercentage, FaCheck, FaTimes, FaShieldAlt, FaCogs, FaCoins, FaEdit, FaHistory } from 'react-icons/fa';

export default function Edit({ component }) {
    const { appSettings } = usePage().props;
    const { data, setData, put, processing, errors } = useForm({
        name: component.name || '',
        type: component.type || 'allowance',
        value_type: component.value_type || 'flat',
        is_taxable: component.is_taxable || false,
        default_amount: component.default_amount || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('salary-components.update', component.id));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Edit Component</h2>}>
            <Head title={`Amend Component - ${component.name}`} />

            <div className="py-4 px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Executive Control Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-5 rounded-lg shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <FaEdit size={120} />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <Link 
                            href={route('salary-components.index')} 
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-95"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-normal text-slate-900 tracking-normal leading-none mb-2 uppercase tracking-normal">Edit Component</h2>
                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                Updating: {component.name.toUpperCase()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {processing ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaSave size={10} />}
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Primary Configuration Core */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                                        Entity Identifier
                                    </label>
                                    <input
                                        type="text"
                                        className={`w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-[11px] font-normal uppercase tracking-normal ${errors.name ? 'border-rose-300' : ''}`}
                                        placeholder="E.G., HOUSING ALLOWANCE"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    {errors.name && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 uppercase tracking-normal">{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1">Component Type</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setData('type', 'allowance')}
                                                className={`p-4 rounded-lg border flex flex-col items-center gap-3 transition-all ${data.type === 'allowance' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-100' : 'border-slate-100 bg-slate-50/50 text-slate-400 opacity-60 hover:opacity-100'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data.type === 'allowance' ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                                                    <FaCoins size={14}/>
                                                </div>
                                                <span className="text-[10px] font-normal uppercase tracking-normal">Allowance</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData('type', 'deduction')}
                                                className={`p-4 rounded-lg border flex flex-col items-center gap-3 transition-all ${data.type === 'deduction' ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-lg shadow-rose-100' : 'border-slate-100 bg-slate-50/50 text-slate-400 opacity-60 hover:opacity-100'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data.type === 'deduction' ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                                                    <FaMoneyBillWave size={14}/>
                                                </div>
                                                <span className="text-[10px] font-normal uppercase tracking-normal">Deduction</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1">Calculation Type</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setData('value_type', 'flat')}
                                                className={`p-4 rounded-lg border flex flex-col items-center gap-3 transition-all ${data.value_type === 'flat' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-100' : 'border-slate-100 bg-slate-50/50 text-slate-400 opacity-60 hover:opacity-100'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data.value_type === 'flat' ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                                                    <FaMoneyBillWave size={14}/>
                                                </div>
                                                <span className="text-[10px] font-normal uppercase tracking-normal">Flat Amount</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData('value_type', 'percentage')}
                                                className={`p-4 rounded-lg border flex flex-col items-center gap-3 transition-all ${data.value_type === 'percentage' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-100' : 'border-slate-100 bg-slate-50/50 text-slate-400 opacity-60 hover:opacity-100'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data.value_type === 'percentage' ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                                                    <FaPercentage size={14}/>
                                                </div>
                                                <span className="text-[10px] font-normal uppercase tracking-normal">Percent</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1">Default Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-normal text-slate-400">
                                                {data.value_type === 'percentage' ? '%' : (appSettings?.currency_symbol || 'QAR')}
                                            </span>
                                            <input
                                                type="number" step="0.01"
                                                className="w-full pl-16 pr-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-[11px] font-normal uppercase tracking-normal"
                                                placeholder="0.00"
                                                value={data.default_amount}
                                                onChange={(e) => setData('default_amount', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center pt-8">
                                        <label className="flex items-center cursor-pointer group">
                                            <div className="relative">
                                                <input type="checkbox" className="sr-only" checked={data.is_taxable} onChange={(e) => setData('is_taxable', e.target.checked)} />
                                                <div className={`w-14 h-8 rounded-full transition-all ${data.is_taxable ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                                                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform shadow-sm ${data.is_taxable ? 'translate-x-6' : ''}`}></div>
                                            </div>
                                            <div className="ml-4">
                                                <span className="text-[10px] font-normal text-slate-900 uppercase tracking-normal">Is Taxable?</span>
                                                <span className="block text-[8px] font-normal text-slate-400 uppercase tracking-normal">Include in tax calculations</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operational Guard Sidebar */}
                    <div className="space-y-6 sticky top-6">
                        <div className="bg-slate-900 rounded-lg p-6 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 text-indigo-500 opacity-20 group-hover:scale-110 transition-transform">
                                <FaCogs size={80} />
                            </div>
                            <h3 className="text-[10px] font-normal uppercase tracking-[0.3em] mb-6 opacity-60 flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                Update Summary
                            </h3>
                            
                            <div className="space-y-8 relative z-10">
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0 border border-white/5"><FaShieldAlt size={12} className="text-indigo-400"/></div>
                                        <div>
                                            <p className="text-[9px] font-normal text-slate-500 uppercase tracking-normal mb-1">Security</p>
                                            <p className="text-[10px] font-normal text-slate-300 leading-relaxed">Secure storage of all component data.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0 border border-white/5"><FaHistory size={12} className="text-indigo-400"/></div>
                                        <div>
                                            <p className="text-[9px] font-normal text-slate-500 uppercase tracking-normal mb-1">Audit Trail</p>
                                            <p className="text-[10px] font-normal text-slate-300 leading-relaxed">All changes are tracked for history.</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={processing}
                                    className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg text-[11px] font-normal uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:from-indigo-700 hover:to-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 border border-white/10"
                                >
                                    {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaSave size={14} />}
                                    <span>Save Changes</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-lg flex gap-4">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm shrink-0"><FaShieldAlt size={12}/></div>
                            <p className="text-[9px] font-normal text-slate-500 uppercase tracking-normal leading-relaxed">
                                UPDATING COMPONENT DETAILS MAY IMPACT EXISTING PAYROLL RECORDS.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
