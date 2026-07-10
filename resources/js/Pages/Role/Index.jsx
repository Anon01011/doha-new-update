import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { FaUserShield, FaPlus, FaEdit, FaTrash, FaShieldAlt, FaArrowRight } from 'react-icons/fa';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index({ roles }) {
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleDelete = (role) => {
        setSelectedRole(role);
        setConfirmingDeletion(true);
    };

    const confirmDeletion = () => {
        setProcessing(true);
        router.delete(route('roles.destroy', selectedRole.id), {
            onFinish: () => {
                setProcessing(false);
                setConfirmingDeletion(false);
            }
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-normal text-slate-900 uppercase">Roles & Permissions</h2>}>
            <Head title="Roles & Permissions" />

            <div className="min-h-screen bg-slate-50/50 py-4">
                <div className="max-w mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Hero Section */}
                    <div className="bg-slate-900 rounded-lg p-5 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <FaUserShield className="text-7xl" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-xl font-normal mb-1 uppercase tracking-normal">Role Management</h1>
                                <p className="text-slate-400 max-w-xl text-[11px] leading-snug uppercase font-normal tracking-normal opacity-80">
                                    Define roles and assign permissions to control access across the system.
                                </p>
                            </div>
                            <Link
                                href={route('roles.create')}
                                className="bg-primary text-white hover:brightness-110 px-4 py-2 rounded-lg font-normal shadow-lg transition-all active:scale-95 flex items-center gap-2 text-[11px] uppercase tracking-normal"
                            >
                                <FaPlus /> Create New Role
                            </Link>
                        </div>
                    </div>

                    {/* Roles List */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-[10px] font-normal text-slate-400 uppercase tracking-normal flex items-center gap-2">
                                <FaShieldAlt className="text-primary" /> Active System Roles
                            </h3>
                            <span className="text-[10px] font-normal text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm uppercase">
                                Records: {roles.total}
                            </span>
                        </div>

                        {roles?.data && roles.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/30 text-slate-400 text-[10px] uppercase tracking-[0.2em] border-b border-slate-100">
                                            <th className="px-5 py-3 font-normal">Role Identity</th>
                                            <th className="px-5 py-3 font-normal text-center">Permissions</th>
                                            <th className="px-5 py-3 font-normal text-center">Users</th>
                                            <th className="px-5 py-3 font-normal text-center">Status</th>
                                            <th className="px-5 py-3 font-normal text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {roles.data.map((role) => (
                                            <tr key={role.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-normal shadow-sm group-hover:bg-primary transition-colors">
                                                            {role.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-normal text-slate-800 group-hover:text-primary transition-colors uppercase tracking-normal">{role.name}</div>
                                                            <div className="text-[9px] text-slate-400 font-normal bg-slate-50 px-1.5 py-0.5 rounded inline-block uppercase tracking-normal mt-0.5 border border-slate-100">{role.slug}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <span className="text-xs font-normal text-slate-800 tabular-nums">{role.permissions?.length || 0}</span>
                                                        <span className="text-[8px] text-slate-400 font-normal uppercase tracking-normal">Modules</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <span className="text-xs font-normal text-slate-800 tabular-nums">{role.users?.length || 0}</span>
                                                        <span className="text-[8px] text-slate-400 font-normal uppercase tracking-normal">Assigned</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    {role.is_active ? (
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
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Link
                                                            href={route('roles.edit', role.id)}
                                                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-90"
                                                            title="Edit Role"
                                                        >
                                                            <FaEdit size={12} />
                                                        </Link>
                                                        {role.slug !== 'admin' && (
                                                            <button
                                                                onClick={() => handleDelete(role)}
                                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all active:scale-90"
                                                                title="Delete Role"
                                                            >
                                                                <FaTrash size={12} />
                                                            </button>
                                                        )}
                                                        <Link
                                                            href={route('roles.show', role.id)}
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
                            <div className="p-12 text-center bg-slate-50/30">
                                <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200 shadow-sm">
                                    <FaShieldAlt className="text-3xl" />
                                </div>
                                <h3 className="text-sm font-normal text-slate-800 uppercase tracking-normal">No Roles Defined</h3>
                                <p className="text-slate-400 text-[10px] font-normal uppercase tracking-normal mt-1">Get started by creating a new role for your system.</p>
                            </div>
                        )}

                        {/* Pagination Footer */}
                        {roles?.links && roles.links.length > 3 && (
                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-center">
                                <div className="flex gap-1.5">
                                    {roles.links.map((link, index) => (
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
                <ConfirmationModal
                    show={confirmingDeletion}
                    title="Delete Role"
                    message={`Are you sure you want to delete the role "${selectedRole?.name}"? This action cannot be undone.`}
                    onConfirm={confirmDeletion}
                    onClose={() => setConfirmingDeletion(false)}
                    type="danger"
                    processing={processing}
                />
            </div>
        </AuthenticatedLayout>
    );
}
