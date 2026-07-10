import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { FaShieldAlt, FaArrowLeft, FaEdit, FaCheck, FaInfoCircle, FaUserShield, FaUsers, FaLayerGroup } from 'react-icons/fa';

export default function Show({ permission }) {
    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-normal text-slate-900 uppercase">Capability Analysis Profile</h2>}>
            <Head title={`Permission Profile - ${permission.name}`} />

            <div className="min-h-screen bg-slate-50/50 py-4">
                <div className="w-full mx-auto px-4 space-y-4">

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
                                <h1 className="text-xs font-normal text-slate-900 uppercase tracking-normal">Capability: {permission.name}</h1>
                                <p className="text-[9px] text-slate-400 font-normal uppercase tracking-normal">Active System Signature and Access Scope</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href={route('permissions.edit', permission.id)}
                                className="bg-primary text-white px-4 py-2 rounded-lg text-[10px] font-normal uppercase tracking-normal shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <FaEdit /> Update Signature
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Main Analysis Area */}
                        <div className="lg:col-span-8 space-y-4">
                            
                            {/* Technical Overview */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-slate-900 p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                                        <FaShieldAlt size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-normal text-white uppercase tracking-normal">Technical Attributes</h3>
                                        <p className="text-[9px] text-slate-400 font-normal uppercase">System classification and unique identifier</p>
                                    </div>
                                </div>
                                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-normal text-slate-400 uppercase tracking-normal block">Signature Name</span>
                                        <p className="text-xs font-normal text-slate-800 uppercase tracking-normal">{permission.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-normal text-slate-400 uppercase tracking-normal block">System Slug</span>
                                        <p className="text-[10px] font-mono font-normal text-slate-500 uppercase">{permission.slug}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-normal text-slate-400 uppercase tracking-normal block">Deployment Unit</span>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-normal uppercase tracking-normal bg-slate-100 text-slate-600 border border-slate-200">
                                                <FaLayerGroup size={8} /> {permission.module || 'Global'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="md:col-span-3 space-y-1">
                                        <span className="text-[9px] font-normal text-slate-400 uppercase tracking-normal block">Capability Description</span>
                                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                            <p className="text-[11px] font-normal text-slate-600 leading-relaxed uppercase opacity-80">
                                                {permission.description || 'NO DETAILED DESCRIPTION REGISTERED FOR THIS CAPABILITY.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Impact Analysis */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div className="flex items-center gap-2">
                                        <FaUserShield className="text-primary" />
                                        <h3 className="text-[10px] font-normal text-slate-800 uppercase tracking-[0.2em]">Authorized Roles Registry</h3>
                                    </div>
                                    <span className="text-[10px] font-normal text-slate-900 tabular-nums">{permission.roles?.length || 0} Assignments</span>
                                </div>
                                <div className="p-4">
                                    {permission.roles && permission.roles.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                                            {permission.roles.map((role) => (
                                                <div key={role.id} className="bg-slate-50/50 border border-slate-100 p-2.5 rounded-lg hover:bg-white hover:border-primary/20 transition-all group relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-1 opacity-5 group-hover:opacity-10 transition-opacity">
                                                        <FaUserShield size={40} />
                                                    </div>
                                                    <div className="relative z-10">
                                                        <div className="text-[10px] font-normal text-slate-800 uppercase tracking-normal group-hover:text-primary transition-colors">{role.name}</div>
                                                        <div className="text-[7px] font-mono text-slate-300 font-normal mt-1 uppercase">{role.slug}</div>
                                                        <Link 
                                                            href={route('roles.show', role.id)} 
                                                            className="text-[8px] font-normal text-primary hover:underline mt-2 inline-block uppercase tracking-normal"
                                                        >
                                                            View Role Profile →
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center">
                                            <FaUserShield className="text-3xl text-slate-100 mx-auto mb-2" />
                                            <p className="text-[9px] text-slate-400 font-normal uppercase tracking-normal">No Authorized Roles Linked</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Distribution Sidebar */}
                        <div className="lg:col-span-4 space-y-4">
                            
                            {/* Distribution Analytics */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                                    <h3 className="text-[10px] font-normal text-slate-800 uppercase tracking-normal flex items-center gap-2">
                                        <FaUsers className="text-primary" /> Personnel Exposure
                                    </h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    {permission.users && permission.users.length > 0 ? (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[9px] font-normal text-slate-400 uppercase">Direct Access Staff</span>
                                                <span className="text-[10px] font-normal text-slate-900 tabular-nums">{permission.users.length} Records</span>
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                                                {permission.users.map((user) => (
                                                    <div key={user.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg hover:border-primary/30 transition-colors">
                                                        <div className="min-w-0">
                                                            <div className="text-[10px] font-normal text-slate-800 uppercase truncate tracking-normal">{user.name}</div>
                                                            <div className="text-[8px] text-slate-400 font-normal truncate uppercase">{user.email}</div>
                                                        </div>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                            <p className="text-[9px] text-slate-400 font-normal uppercase tracking-normal">Zero Personnel Exposure</p>
                                            <p className="text-[7px] text-slate-300 font-normal uppercase mt-1">This capability is not directly assigned</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* System Status Card */}
                            <div className="bg-slate-900 rounded-lg shadow-xl p-5 text-white space-y-4 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform duration-500">
                                    <FaInfoCircle size={60} />
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <h3 className="text-[10px] font-normal uppercase tracking-normal border-b border-white/10 pb-2 flex items-center justify-between">
                                        Logic Status
                                        {permission.is_active ? (
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                        ) : (
                                            <span className="w-2 h-2 rounded-full bg-rose-400" />
                                        )}
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-normal text-slate-400 uppercase">Production Status</span>
                                            <span className={`text-[9px] font-normal uppercase ${permission.is_active ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {permission.is_active ? 'ENABLED' : 'DISABLED'}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                            <p className="text-[8px] text-slate-400 font-normal leading-relaxed uppercase tracking-normal">
                                                Active capabilities are immediately available for authorization checks in the application middleware layer.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
