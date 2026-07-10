import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { FaShieldAlt, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaArrowRight, FaFilter, FaLayerGroup } from 'react-icons/fa';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index({ permissions, modules, selectedModule, moduleCounts }) {
    const { flash } = usePage().props;
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [selectedPermission, setSelectedPermission] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleDelete = (permission) => {
        setSelectedPermission(permission);
        setConfirmingDeletion(true);
    };

    const confirmDeletion = () => {
        setProcessing(true);
        router.delete(route('permissions.destroy', selectedPermission.id), {
            onFinish: () => {
                setProcessing(false);
                setConfirmingDeletion(false);
            }
        });
    };

    const handleModuleChange = (module) => {
        const url = module
            ? route('permissions.index', { module })
            : route('permissions.index');
        router.visit(url, { preserveState: true });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-normal text-slate-900 uppercase">Permissions</h2>}>
            <Head title="Permissions Management" />

            <div className="min-h-screen bg-slate-50/50 py-4">
                <div className="max-w-[98%] mx-auto px-4 space-y-6">

                    {/* Hero Section */}
                    <div className="bg-slate-900 rounded-lg p-5 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <FaShieldAlt className="text-7xl" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-xl font-normal mb-1 uppercase tracking-normal">All Permissions</h1>
                                <p className="text-slate-400 max-w-xl text-[11px] leading-snug uppercase font-normal tracking-normal opacity-80">
                                    Granular control over system capabilities. Define specific access levels for all modules.
                                </p>
                            </div>
                            <Link
                                href={route('permissions.create')}
                                className="bg-primary text-white hover:brightness-110 px-4 py-2 rounded-lg font-normal shadow-lg transition-all active:scale-95 flex items-center gap-2 text-[11px] uppercase tracking-normal"
                            >
                                <FaPlus /> Create Permission
                            </Link>
                        </div>
                    </div>

                    {/* Module Filter & Content */}
                    <div className="flex flex-col lg:flex-row gap-5">

                        {/* Sidebar Filters */}
                        {modules && modules.length > 0 && (
                            <div className="lg:w-56 flex-shrink-0 space-y-1">
                                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 overflow-hidden sticky top-6">
                                    <h3 className="px-3 py-2 text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-50 mb-1">
                                        <FaFilter size={10} /> Modules
                                    </h3>
                                    <div className="space-y-0.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                                        <button
                                            onClick={() => handleModuleChange('')}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-normal uppercase tracking-normal transition-all flex justify-between items-center ${!selectedModule
                                                ? 'bg-primary text-white shadow-md'
                                                : 'text-slate-500 hover:bg-slate-50'
                                                }`}
                                        >
                                            <span>All Units</span>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-md font-normal uppercase tabular-nums shadow-sm ${!selectedModule ? 'bg-white text-primary' : 'bg-primary text-white shadow-primary/20'}`}>
                                                {permissions.total || 0}
                                            </span>
                                        </button>
                                        {modules.map((module) => (
                                            <button
                                                key={module}
                                                onClick={() => handleModuleChange(module)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-normal uppercase tracking-normal transition-all flex justify-between items-center ${selectedModule === module
                                                    ? 'bg-primary text-white shadow-md'
                                                    : 'text-slate-500 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <span className="truncate">{module?.replace(/-/g, ' ') || 'Other'}</span>
                                                {moduleCounts && moduleCounts[module] && (
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-normal uppercase tabular-nums shadow-sm ${selectedModule === module
                                                        ? 'bg-white text-primary shadow-white/20'
                                                        : 'bg-primary text-white shadow-primary/20'
                                                        }`}>
                                                        {moduleCounts[module]}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                            {/* Success Message */}
                            {flash?.success && (
                                <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm text-[11px] font-normal uppercase tracking-normal">
                                    <FaCheckCircle className="text-emerald-500" /> {flash.success}
                                </div>
                            )}

                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                {permissions?.data && permissions.data.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/30 text-slate-400 text-[10px] uppercase tracking-[0.2em] border-b border-slate-100">
                                                    <th className="px-5 py-3 font-normal">Permission Name</th>
                                                    <th className="px-5 py-3 font-normal">Module</th>
                                                    <th className="px-5 py-3 font-normal text-center">Roles</th>
                                                    <th className="px-5 py-3 font-normal text-center">Status</th>
                                                    <th className="px-5 py-3 font-normal text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {permissions.data.map((permission) => (
                                                    <tr key={permission.id} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-5 py-3">
                                                            <div>
                                                                <div className="text-[11px] font-normal text-slate-800 group-hover:text-primary transition-colors uppercase tracking-normal">{permission.name}</div>
                                                                <div className="text-[9px] text-slate-400 font-normal bg-slate-50 px-1.5 py-0.5 rounded inline-block uppercase tracking-normal mt-1 border border-slate-100">{permission.slug}</div>
                                                                {permission.description && (
                                                                    <div className="text-[9px] text-slate-400 mt-1 uppercase font-normal tracking-normal line-clamp-1 opacity-70 group-hover:opacity-100">{permission.description}</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            {permission.module ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-normal bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-normal">
                                                                    <FaLayerGroup size={8} /> {permission.module}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300 text-[9px] font-normal uppercase italic">N/A</span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3 text-center">
                                                            <div className="inline-flex flex-col items-center gap-0.5">
                                                                <span className="text-[11px] font-normal text-slate-800 tabular-nums">{permission.roles?.length || 0}</span>
                                                                <span className="text-[8px] text-slate-400 font-normal uppercase tracking-normal">Assigned</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3 text-center">
                                                            {permission.is_active ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-normal uppercase tracking-normal bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                                    Active
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-normal uppercase tracking-normal bg-slate-100 text-slate-400 border border-slate-200">
                                                                    Inactive
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Link
                                                                    href={route('permissions.edit', permission.id)}
                                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-90"
                                                                    title="Edit Permission"
                                                                >
                                                                    <FaEdit size={12} />
                                                                </Link>
                                                                <button
                                                                    onClick={() => handleDelete(permission)}
                                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all active:scale-90"
                                                                    title="Delete Permission"
                                                                >
                                                                    <FaTrash size={12} />
                                                                </button>
                                                                <Link
                                                                    href={route('permissions.show', permission.id)}
                                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all active:scale-90"
                                                                    title="View Details"
                                                                >
                                                                    <FaArrowRight size={12} />
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-16 text-center bg-slate-50/30">
                                        <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center mx-auto mb-4 text-slate-200 shadow-sm">
                                            <FaShieldAlt className="text-3xl" />
                                        </div>
                                        <h3 className="text-sm font-normal text-slate-800 uppercase tracking-normal">No Permissions Found</h3>
                                        <p className="text-slate-400 text-[10px] font-normal uppercase tracking-normal mt-1 max-w-sm mx-auto">
                                            {selectedModule
                                                ? `The module "${selectedModule}" currently has no assigned capabilities.`
                                                : 'Initialize the system by creating granular access controls.'}
                                        </p>
                                    </div>
                                )}

                                {/* Pagination */}
                                {permissions?.links && permissions.links.length > 3 && (
                                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-center">
                                        <div className="flex gap-1.5">
                                            {permissions.links.map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    className={`h-8 px-3 flex items-center justify-center rounded-lg text-[10px] font-normal transition-all ${link.active
                                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                            : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-200'
                                                        } ${!link.url && 'opacity-30 cursor-not-allowed hidden'}`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <ConfirmationModal
                    show={confirmingDeletion}
                    title="Delete Permission"
                    message={`Are you sure you want to delete the permission "${selectedPermission?.name}"? This action cannot be undone.`}
                    onConfirm={confirmDeletion}
                    onClose={() => setConfirmingDeletion(false)}
                    type="danger"
                    processing={processing}
                />
            </div>
        </AuthenticatedLayout>
    );
}
