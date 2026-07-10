import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FaShieldAlt, FaSave, FaArrowLeft, FaCheck, FaInfoCircle, FaLayerGroup } from 'react-icons/fa';

export default function Edit({ permission, modules }) {
    const { data, setData, put, processing, errors } = useForm({
        name: permission.name || '',
        slug: permission.slug || '',
        module: permission.module || '',
        description: permission.description || '',
        is_active: permission.is_active ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('permissions.update', permission.id));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-normal text-slate-900 uppercase">Synchronize Capability</h2>}>
            <Head title={`Edit Permission - ${permission.name}`} />

            <div className="min-h-screen bg-slate-50/50 py-4">
                <form onSubmit={handleSubmit} className="w-full mx-auto px-4 space-y-4">
                    
                    {/* Control Header */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 flex justify-between items-center sticky top-4 z-20">
                        <div className="flex items-center gap-3">
                            <Link
                                href={route('permissions.index')}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-90"
                            >
                                <FaArrowLeft size={12} />
                            </Link>
                            <div>
                                <h1 className="text-xs font-normal text-slate-900 uppercase tracking-normal">Updating: {permission.name}</h1>
                                <p className="text-[9px] text-slate-400 font-normal uppercase tracking-normal">Adjusting granular system access parameters</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-primary text-white px-4 py-2 rounded-lg text-[10px] font-normal uppercase tracking-normal shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {processing ? 'Syncing...' : <><FaSave /> Commit Changes</>}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Main Architecture Area */}
                        <div className="lg:col-span-8 space-y-4">
                            
                            {/* Permission Identification */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-slate-900 p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                                        <FaShieldAlt size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-normal text-white uppercase tracking-normal">Technical Signature</h3>
                                        <p className="text-[9px] text-slate-400 font-normal uppercase">Basic classification and system identifier</p>
                                    </div>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal ml-1">Friendly Name</label>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-800 focus:ring-primary focus:border-primary placeholder:text-slate-300 transition-all uppercase tracking-normal"
                                                required
                                            />
                                            {errors.name && <p className="text-[9px] text-rose-500 font-normal uppercase ml-1 mt-1">{errors.name}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal ml-1">Technical Slug (Restricted)</label>
                                            <input
                                                type="text"
                                                value={data.slug}
                                                onChange={(e) => setData('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                                className="w-full bg-slate-100 border-slate-200 rounded-lg text-xs font-mono font-normal text-slate-500 cursor-not-allowed uppercase tracking-normal"
                                                readOnly
                                                disabled
                                            />
                                            {errors.slug && <p className="text-[9px] text-rose-500 font-normal uppercase ml-1 mt-1">{errors.slug}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal ml-1 flex items-center gap-1.5">
                                            <FaLayerGroup size={10} className="text-primary" /> Target Module
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={data.module}
                                                onChange={(e) => setData('module', e.target.value)}
                                                className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-800 focus:ring-primary focus:border-primary placeholder:text-slate-300 transition-all uppercase tracking-normal"
                                                list="modules"
                                            />
                                            <datalist id="modules">
                                                {modules?.map((module) => (
                                                    <option key={module} value={module} />
                                                ))}
                                            </datalist>
                                        </div>
                                        {errors.module && <p className="text-[9px] text-rose-500 font-normal uppercase ml-1 mt-1">{errors.module}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal ml-1">Capability Description</label>
                                        <textarea
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-800 focus:ring-primary focus:border-primary placeholder:text-slate-300 min-h-[80px] transition-all"
                                        />
                                        {errors.description && <p className="text-[9px] text-rose-500 font-normal uppercase ml-1 mt-1">{errors.description}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Configuration Sidebar */}
                        <div className="lg:col-span-4 space-y-4">
                            
                            {/* Summary Card */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                                    <h3 className="text-[10px] font-normal text-slate-800 uppercase tracking-normal flex items-center gap-2">
                                        <FaInfoCircle className="text-primary" /> Logic Parameters
                                    </h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                        <span className="text-[9px] font-normal text-slate-400 uppercase">Operational Status</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-normal uppercase ${data.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {data.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setData('is_active', !data.is_active)}
                                                className={`w-8 h-4 rounded-full relative transition-all ${data.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                            >
                                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${data.is_active ? 'right-0.5' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <p className="text-[8px] text-slate-400 font-normal leading-relaxed uppercase">
                                            Modifying permissions can impact multiple roles and users immediately. Verify the capability slug is not hardcoded in custom middleware before renaming.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Visual Identity */}
                            <div className="bg-slate-900 rounded-lg shadow-xl p-6 text-center space-y-4 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-primary/5 pattern-grid-slate-100/5" />
                                <div className="relative z-10 space-y-3">
                                    <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto border border-primary/30 shadow-lg group-hover:scale-110 transition-transform">
                                        <FaShieldAlt size={24} className="text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-normal text-white uppercase tracking-normal truncate px-4">
                                            {data.name || 'CAPABILITY ID'}
                                        </h3>
                                        <p className="text-[8px] text-slate-400 font-normal uppercase tracking-normal mt-1">
                                            Signature: {permission.slug}
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
