import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FaUserShield, FaPlus, FaArrowLeft, FaCheck, FaInfoCircle, FaShieldAlt } from 'react-icons/fa';

export default function Create({ permissions }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
        is_active: true,
        permissions: [],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('roles.store'));
    };

    const togglePermission = (permissionId) => {
        const newPermissions = data.permissions.includes(permissionId)
            ? data.permissions.filter(id => id !== permissionId)
            : [...data.permissions, permissionId];

        setData('permissions', newPermissions);
    };

    // Group permissions by module
    const groupedPermissions = permissions?.reduce((acc, perm) => {
        const module = perm.module || 'Other';
        if (!acc[module]) {
            acc[module] = [];
        }
        acc[module].push(perm);
        return acc;
    }, {}) || {};

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-normal text-slate-900 uppercase">Add Role</h2>}>
            <Head title="Create New Role" />

            <div className="min-h-screen bg-slate-50/50 py-4">
                <form onSubmit={handleSubmit} className="w-full mx-auto px-4 space-y-4">
                    
                    {/* Control Header */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 flex justify-between items-center sticky top-4 z-20">
                        <div className="flex items-center gap-3">
                            <Link
                                href={route('roles.index')}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-90"
                            >
                                <FaArrowLeft size={12} />
                            </Link>
                            <div>
                                <h1 className="text-xs font-normal text-slate-900 uppercase tracking-normal">Role Information</h1>
                                <p className="text-[9px] text-slate-400 font-normal uppercase tracking-normal">Set role name and basic details</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-primary text-white px-4 py-2 rounded-lg text-[10px] font-normal uppercase tracking-normal shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {processing ? 'Saving...' : <><FaCheck /> Save Role</>}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Main Architecture Area */}
                        <div className="lg:col-span-8 space-y-4">
                            
                            {/* Role Identification */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-slate-900 p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                                        <FaUserShield size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-normal text-white uppercase tracking-normal">Identity</h3>
                                        <p className="text-[9px] text-slate-400 font-normal uppercase">Basic details and system signature</p>
                                    </div>
                                </div>
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal ml-1">Administrative Name</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-800 focus:ring-primary focus:border-primary placeholder:text-slate-300 transition-all"
                                            placeholder="E.G. OPERATIONS COORDINATOR"
                                            required
                                        />
                                        {errors.name && <p className="text-[9px] text-rose-500 font-normal uppercase ml-1 mt-1">{errors.name}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal ml-1">System Slug (Read-Only)</label>
                                        <input
                                            type="text"
                                            value={data.slug}
                                            onChange={(e) => setData('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                            className="w-full bg-slate-100 border-slate-200 rounded-lg text-xs font-mono font-normal text-slate-500 cursor-not-allowed uppercase tracking-normal"
                                            placeholder="auto-generated-slug"
                                            readOnly
                                        />
                                        {errors.slug && <p className="text-[9px] text-rose-500 font-normal uppercase ml-1 mt-1">{errors.slug}</p>}
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal ml-1">Role Objective & Description</label>
                                        <textarea
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-800 focus:ring-primary focus:border-primary placeholder:text-slate-300 min-h-[80px] transition-all"
                                            placeholder="DESCRIBE THE RESPONSIBILITIES FOR THIS ROLE..."
                                        />
                                        {errors.description && <p className="text-[9px] text-rose-500 font-normal uppercase ml-1 mt-1">{errors.description}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Permissions Registry */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <div className="flex items-center gap-2">
                                        <FaShieldAlt className="text-primary" />
                                        <h3 className="text-[10px] font-normal text-slate-800 uppercase tracking-[0.2em]">Permissions</h3>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setData('permissions', permissions?.map(p => p.id) || [])}
                                            className="text-[8px] px-2 py-1 bg-slate-900 text-white rounded font-normal uppercase tracking-normal hover:bg-primary transition-colors"
                                        >
                                            Select All
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setData('permissions', [])}
                                            className="text-[8px] px-2 py-1 bg-slate-200 text-slate-600 rounded font-normal uppercase tracking-normal hover:bg-rose-500 hover:text-white transition-colors"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 max-h-[600px] overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
                                    {Object.keys(groupedPermissions).map((module) => (
                                        <div key={module} className="space-y-2">
                                            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-l-2 border-primary rounded-r-lg mb-2">
                                                <h4 className="text-[10px] font-normal text-slate-800 uppercase tracking-[0.2em]">{module}</h4>
                                                <span className="text-[9px] px-2 py-0.5 bg-primary text-white rounded-md font-normal uppercase tabular-nums shadow-md shadow-primary/20">{groupedPermissions[module].length}</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                                                {groupedPermissions[module].map((permission) => (
                                                    <div
                                                        key={permission.id}
                                                        onClick={() => togglePermission(permission.id)}
                                                        className={`group relative flex flex-col p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                                                            data.permissions.includes(permission.id)
                                                            ? 'bg-primary/5 border-primary shadow-sm'
                                                            : 'bg-white border-slate-100 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className={`text-[10px] font-normal uppercase tracking-normal transition-colors ${data.permissions.includes(permission.id) ? 'text-primary' : 'text-slate-700'}`}>
                                                                {permission.name}
                                                            </span>
                                                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-all ${data.permissions.includes(permission.id) ? 'bg-primary text-white scale-110' : 'bg-slate-100'}`}>
                                                                {data.permissions.includes(permission.id) && <FaCheck size={6} />}
                                                            </div>
                                                        </div>
                                                        {permission.description && (
                                                            <p className="text-[8px] text-slate-400 font-normal uppercase tracking-normal leading-tight line-clamp-1">{permission.description}</p>
                                                        )}
                                                        <span className="text-[7px] text-slate-300 font-mono font-normal mt-1 uppercase group-hover:text-primary/50 transition-colors">{permission.slug}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Configuration Sidebar */}
                        <div className="lg:col-span-4 space-y-4">
                            
                            {/* Summary Card */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                                    <h3 className="text-[10px] font-normal text-slate-800 uppercase tracking-normal flex items-center gap-2">
                                        <FaInfoCircle className="text-primary" /> Summary
                                    </h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                        <span className="text-[9px] font-normal text-slate-400 uppercase">Capabilities</span>
                                        <span className="text-[10px] font-normal text-slate-900 tabular-nums">{data.permissions.length} Assigned</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                        <span className="text-[9px] font-normal text-slate-400 uppercase">Status</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-normal uppercase ${data.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {data.is_active ? 'Active' : 'Inactive'}
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
                                            Ensure the role naming convention matches organization standards. Slugs are used for internal authorization checks and are immutable once deployed.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Role Visualizer */}
                            <div className="bg-slate-900 rounded-lg shadow-xl p-6 text-center space-y-4 relative overflow-hidden">
                                <div className="absolute inset-0 bg-primary/5 pattern-grid-slate-100/5" />
                                <div className="relative z-10 space-y-3">
                                    <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center mx-auto border border-primary/30 shadow-lg group-hover:scale-110 transition-transform">
                                        <span className="text-2xl font-normal text-primary">
                                            {data.name ? data.name.charAt(0).toUpperCase() : '?'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-normal text-white uppercase tracking-normal truncate px-4">
                                            {data.name || 'ROLE IDENTITY'}
                                        </h3>
                                        <p className="text-[8px] text-slate-400 font-normal uppercase tracking-normal mt-1">
                                            System Classification
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
