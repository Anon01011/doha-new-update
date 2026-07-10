import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { FaLayerGroup, FaBuilding, FaArrowLeft, FaSave, FaCheckCircle, FaTerminal, FaShieldAlt, FaChevronRight } from 'react-icons/fa';

export default function Edit({ department, companies = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        name: department.name || '',
        company_ids: department.companies ? department.companies.map(c => c.id) : [],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('departments.update', department.id));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800 tracking-normal text-center sm:text-left">Modify Taxonomy Unit</h2>}>
            <Head title="Modify Department" />
            
            <div className="py-4 px-3 sm:px-4 lg:px-6 space-y-4">
                {/* Tactical Navigation */}
                <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm p-4 rounded-lg border border-slate-200">
                    <Link
                        href={route('departments.index')}
                        className="group flex items-center gap-3 px-6 py-3 bg-white hover:bg-slate-900 text-slate-600 hover:text-white rounded-lg text-[10px] font-normal uppercase tracking-normal transition-all border border-slate-200 shadow-sm active:scale-95"
                    >
                        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                        Abort Modification
                    </Link>
                    <div className="hidden sm:flex items-center gap-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal">
                        Taxonomy <FaChevronRight size={8} /> <span className="text-primary">Unit Configuration</span> <FaChevronRight size={8} /> <span className="text-slate-900 font-normal">ID: {department.id}</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                    {/* Executive Branding Header */}
                    <div className="bg-slate-900 p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 text-white opacity-5">
                            <FaLayerGroup size={80} />
                        </div>
                        <div className="relative flex flex-col sm:flex-row items-center gap-6">
                            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-white shadow-2xl shadow-primary/40 ring-4 ring-white/10">
                                <FaLayerGroup size={24} />
                            </div>
                            <div className="text-center sm:text-left">
                                <h1 className="text-2xl font-normal text-white tracking-normal uppercase">Configuration Portal</h1>
                                <p className="text-slate-400 text-[9px] font-normal uppercase tracking-[0.3em] mt-1.5">Modifying Unit: <span className="text-white">{department.name}</span></p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Primary Configuration */}
                            <div className="lg:col-span-7 space-y-8">
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-900">
                                            <FaTerminal size={14} />
                                        </div>
                                        <h3 className="text-xs font-normal text-slate-900 uppercase tracking-normal">Identity Configuration</h3>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1">
                                            Unit Designation <span className="text-primary">*</span>
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none transition-colors text-slate-400 group-focus-within:text-primary">
                                                <FaLayerGroup size={14} />
                                            </div>
                                            <input
                                                type="text"
                                                className={`w-full pl-14 pr-8 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-normal text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-primary focus:ring-0 transition-all outline-none ${errors.name ? 'border-rose-200 bg-rose-50/30' : ''}`}
                                                value={data.name}
                                                onChange={e => setData('name', e.target.value)}
                                                required
                                                placeholder="e.g. OPERATIONS COMMAND"
                                            />
                                        </div>
                                        {errors.name && <p className="text-rose-500 text-[10px] font-normal uppercase tracking-normal mt-2 ml-1">{errors.name}</p>}
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-900">
                                            <FaShieldAlt size={14} />
                                        </div>
                                        <h3 className="text-xs font-normal text-slate-900 uppercase tracking-normal">Structural Mapping</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[9px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1">
                                            Branch Association Matrix <span className="text-primary">*</span>
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-[320px] overflow-y-auto custom-scrollbar">
                                            {companies.map(c => (
                                                <label key={c.id} className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all group ${data.company_ids.includes(c.id) ? 'bg-white border-primary shadow-lg shadow-primary/5' : 'bg-white/50 border-transparent hover:border-slate-200'}`}>
                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${data.company_ids.includes(c.id) ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200'}`}>
                                                        {data.company_ids.includes(c.id) && <FaSave size={10} />}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={data.company_ids.includes(c.id)}
                                                        onChange={(e) => {
                                                            const id = c.id;
                                                            if (e.target.checked) {
                                                                setData('company_ids', [...data.company_ids, id]);
                                                            } else {
                                                                setData('company_ids', data.company_ids.filter(v => v !== id));
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className={`text-[10px] font-normal uppercase tracking-normal transition-colors ${data.company_ids.includes(c.id) ? 'text-primary' : 'text-slate-600'}`}>{c.name}</span>
                                                        <span className="text-[8px] font-normal text-slate-400 uppercase tracking-normal mt-0.5">Tactical Branch</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        {errors.company_ids && <p className="text-rose-500 text-[10px] font-normal uppercase tracking-normal mt-2 ml-1">{errors.company_ids}</p>}
                                    </div>
                                </section>
                            </div>

                            {/* Supplementary Information */}
                            <div className="lg:col-span-5 space-y-8">
                                <div className="bg-slate-900 rounded-xl p-6 text-white relative overflow-hidden group shadow-2xl shadow-slate-200">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="relative space-y-4">
                                        <h3 className="text-base font-normal uppercase tracking-normal">Modification Audit</h3>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                                <p className="text-[8px] font-normal text-slate-400 uppercase tracking-normal">Current Unit Impact</p>
                                                <p className="text-xl font-normal text-white mt-1">{department.employees_count || 0} Personnel Affected</p>
                                            </div>
                                            <ul className="space-y-4 mt-6">
                                                {[
                                                    'Updating unit designation updates all employee associations.',
                                                    'Removing branch association may restrict personnel access.',
                                                    'Modifications are recorded in the executive audit log.',
                                                    'Structural changes impact real-time reporting analytics.'
                                                ].map((text, i) => (
                                                    <li key={i} className="flex gap-4 items-start">
                                                        <div className="w-5 h-5 bg-white/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-primary">
                                                            <span className="text-[10px] font-normal">{i + 1}</span>
                                                        </div>
                                                        <p className="text-[10px] font-normal text-slate-400 leading-relaxed uppercase tracking-normal">{text}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Executive Action Footer */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-12 border-t border-slate-100">
                            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                                <div className="text-slate-400">
                                    <p className="text-[10px] font-normal uppercase tracking-[0.2em]">Pending Structural Commitment</p>
                                    <p className="text-[8px] font-normal text-slate-300 uppercase tracking-[0.3em] mt-1">Audit trail will be generated upon commit</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                                <Link
                                    href={route('departments.index')}
                                    className="w-full sm:w-auto px-10 py-5 text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors text-center"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full sm:w-auto flex items-center justify-center gap-4 px-10 py-3.5 bg-primary hover:brightness-110 text-white rounded-xl text-[11px] font-normal uppercase tracking-[0.3em] transition-all active:scale-95 shadow-2xl shadow-primary/30 disabled:opacity-50"
                                >
                                    {processing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            COMMITTING...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheckCircle size={14} /> Commit Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}