import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { FaUserShield, FaArrowLeft, FaEdit, FaShieldAlt, FaUsers, FaInfoCircle } from 'react-icons/fa';

export default function Show({ role }) {
    // Group permissions by module
    const groupedPermissions = role.permissions?.reduce((acc, perm) => {
        const module = perm.module || 'Other';
        if (!acc[module]) {
            acc[module] = [];
        }
        acc[module].push(perm);
        return acc;
    }, {}) || {};

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-normal text-slate-900 uppercase">Role Architecture Review</h2>}>
            <Head title={`Role Profile - ${role.name}`} />

            <div className="min-h-screen bg-slate-50/50 py-4">
                <div className="w-full mx-auto px-4 space-y-4">

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
                                <h1 className="text-xs font-normal text-slate-900 uppercase tracking-normal">Viewing Profile: {role.name}</h1>
                                <p className="text-[9px] text-slate-400 font-normal uppercase tracking-normal">Active System Configuration and Assigned Rights</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href={route('roles.edit', role.id)}
                                className="bg-primary text-white px-4 py-2 rounded-lg text-[10px] font-normal uppercase tracking-normal shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <FaEdit /> Modify Config
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Main Information Area */}
                        <div className="lg:col-span-8 space-y-4">
                            
                            {/* Role Overview */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-slate-900 p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                                        <FaUserShield size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-normal text-white uppercase tracking-normal">Operational Summary</h3>
                                        <p className="text-[9px] text-slate-400 font-normal uppercase">Basic classification and system signature</p>
                                    </div>
                                </div>
                                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-normal text-slate-400 uppercase tracking-normal block">Identity Label</span>
                                        <p className="text-xs font-normal text-slate-800 uppercase tracking-normal">{role.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-normal text-slate-400 uppercase tracking-normal block">Technical Slug</span>
                                        <p className="text-[10px] font-mono font-normal text-slate-500 uppercase">{role.slug}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-normal text-slate-400 uppercase tracking-normal block">Active Status</span>
                                        {role.is_active ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-normal uppercase tracking-normal bg-emerald-50 text-emerald-600 border border-emerald-100">Active</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-normal uppercase tracking-normal bg-slate-100 text-slate-400 border border-slate-200">Inactive</span>
                                        )}
                                    </div>
                                    {role.description && (
                                        <div className="md:col-span-3 space-y-1">
                                            <span className="text-[9px] font-normal text-slate-400 uppercase tracking-normal block">Functional Description</span>
                                            <p className="text-[11px] font-normal text-slate-600 leading-relaxed uppercase opacity-80">{role.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Capability Matrix */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                                    <FaShieldAlt className="text-primary" />
                                    <h3 className="text-[10px] font-normal text-slate-800 uppercase tracking-[0.2em]">Authorized Capabilities ({role.permissions?.length || 0})</h3>
                                </div>
                                <div className="p-4 max-h-[600px] overflow-y-auto space-y-4">
                                    {Object.keys(groupedPermissions).length > 0 ? (
                                        Object.keys(groupedPermissions).map((module) => (
                                            <div key={module} className="space-y-2">
                                                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-l-2 border-primary rounded-r-lg mb-2">
                                                    <h4 className="text-[10px] font-normal text-slate-800 uppercase tracking-[0.2em]">{module}</h4>
                                                    <span className="text-[9px] px-2 py-0.5 bg-primary text-white rounded-md font-normal uppercase tabular-nums shadow-md shadow-primary/20">{groupedPermissions[module].length} Units</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                                                    {groupedPermissions[module].map((permission) => (
                                                        <div key={permission.id} className="bg-slate-50/50 border border-slate-100 p-2.5 rounded-lg hover:bg-white hover:border-primary/20 transition-all group">
                                                            <div className="text-[10px] font-normal text-slate-800 uppercase tracking-normal group-hover:text-primary transition-colors">{permission.name}</div>
                                                            {permission.description && (
                                                                <p className="text-[8px] text-slate-400 font-normal uppercase tracking-normal leading-tight mt-1 opacity-70">{permission.description}</p>
                                                            )}
                                                            <div className="text-[7px] font-mono text-slate-300 font-normal mt-1 uppercase">{permission.slug}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center">
                                            <FaShieldAlt className="text-3xl text-slate-100 mx-auto mb-2" />
                                            <p className="text-[9px] text-slate-400 font-normal uppercase tracking-normal">No Authorized Capabilities Assigned</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Analysis Sidebar */}
                        <div className="lg:col-span-4 space-y-4">
                            
                            {/* Deployment Analytics */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                                    <h3 className="text-[10px] font-normal text-slate-800 uppercase tracking-normal flex items-center gap-2">
                                        <FaUsers className="text-primary" /> Active Personnel
                                    </h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    {role.users && role.users.length > 0 ? (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[9px] font-normal text-slate-400 uppercase">Assigned Staff</span>
                                                <span className="text-[10px] font-normal text-slate-900 tabular-nums">{role.users.length} Records</span>
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                                                {role.users.map((user) => (
                                                    <div key={user.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg hover:border-primary/30 transition-colors">
                                                        <div className="min-w-0">
                                                            <div className="text-[10px] font-normal text-slate-800 uppercase truncate tracking-normal">{user.name}</div>
                                                            <div className="text-[8px] text-slate-400 font-normal truncate uppercase">{user.email}</div>
                                                        </div>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                            <p className="text-[9px] text-slate-400 font-normal uppercase tracking-normal">Zero Personnel Assigned</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Security Insights */}
                            <div className="bg-slate-900 rounded-lg shadow-xl p-5 text-white space-y-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <FaInfoCircle size={60} />
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <h3 className="text-[10px] font-normal uppercase tracking-normal border-b border-white/10 pb-2">Configuration Insights</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-2">
                                            <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                                            <p className="text-[8px] text-slate-400 font-normal uppercase leading-relaxed tracking-normal">
                                                This role grants access to {role.permissions?.length || 0} system functions across {Object.keys(groupedPermissions).length} modules.
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                                            <p className="text-[8px] text-slate-400 font-normal uppercase leading-relaxed tracking-normal">
                                                Total user exposure: {role.users?.length || 0} personnel. Modifications will propagate in real-time.
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
