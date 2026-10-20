import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaCheckCircle, FaTimesCircle, FaClipboardList, FaInfoCircle } from 'react-icons/fa';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { hasPermission } from '@/helpers/permissions';

export default function Index({ leaveTypes }) {
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [selectedLeaveType, setSelectedLeaveType] = useState(null);
    const [processing, setProcessing] = useState(false);

    const { auth } = usePage().props;
    const user = auth?.user || {};

    // The edit/delete routes are permission-guarded server-side; mirror that here so
    // users without the permission are not offered actions that will 403.
    const canManage = user.role === 'admin' || hasPermission(user, 'manage-leave-types');

    const handleDelete = (leaveType) => {
        setSelectedLeaveType(leaveType);
        setConfirmingDeletion(true);
    };

    const confirmDeletion = () => {
        setProcessing(true);
        router.delete(route('leave-types.destroy', selectedLeaveType.id), {
            onFinish: () => {
                setProcessing(false);
                setConfirmingDeletion(false);
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Leave Policy Management" />

            <div className="py-4 px-3 sm:px-4 lg:px-6 space-y-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 flex-shrink-0 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
                            <FaClipboardList size={20} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-semibold text-slate-900 leading-none">Leave Types</h1>
                            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                {leaveTypes?.total ?? 0} configured polic{(leaveTypes?.total ?? 0) === 1 ? 'y' : 'ies'}
                            </p>
                        </div>
                    </div>

                    {canManage && (
                        <Link
                            href={route('leave-types.create')}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95"
                        >
                            <FaPlus size={11} />
                            Add Leave Type
                        </Link>
                    )}
                </div>

                {/* Leave Types */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 border-b border-slate-100">Leave Type</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 border-b border-slate-100">Code</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 border-b border-slate-100">Branch</th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 border-b border-slate-100">Days Per Year</th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 border-b border-slate-100">Min Notice</th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 border-b border-slate-100">Carry Forward</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 border-b border-slate-100">Status</th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 border-b border-slate-100">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {leaveTypes?.data && leaveTypes.data.length > 0 ? (
                                    leaveTypes.data.map((type) => (
                                        <tr key={type.id} className="group hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xs font-semibold">
                                                        {type.code?.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-slate-900 block">
                                                            {type.name}
                                                        </span>
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 mt-1.5 text-[10px] font-semibold uppercase rounded-md border ${
                                                                type.is_paid
                                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                    : 'bg-slate-50 text-slate-400 border-slate-200'
                                                            }`}
                                                        >
                                                            {type.is_paid ? 'Paid' : 'Unpaid'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium border border-slate-200">
                                                    {type.code}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-sm text-slate-600">
                                                    {type.company?.name || 'All Branches'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className="text-sm font-semibold text-slate-900 leading-none">
                                                    {type.max_days_per_year}
                                                </span>
                                                <p className="text-[11px] text-slate-400 mt-1">Days</p>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                {type.min_notice_days !== null && type.min_notice_days !== undefined ? (
                                                    <>
                                                        <span className="text-sm font-semibold text-slate-900 leading-none">
                                                            {type.min_notice_days}
                                                        </span>
                                                        <p className="text-[11px] text-slate-400 mt-1">Days before</p>
                                                    </>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 bg-slate-50 text-slate-400 rounded-lg text-xs border border-slate-100">
                                                        Global
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                {type.carry_forward_allowed ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium border border-emerald-100">
                                                        Allowed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 bg-slate-50 text-slate-400 rounded-lg text-xs border border-slate-100">
                                                        No
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                {type.is_active ? (
                                                    <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium border border-emerald-100 gap-1.5">
                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-xs border border-slate-100 gap-1.5">
                                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={route('leave-types.show', type.id)}
                                                        title="View"
                                                        aria-label={`View ${type.name}`}
                                                        className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all border border-transparent hover:border-slate-200"
                                                    >
                                                        <FaEye size={12} />
                                                    </Link>

                                                    {canManage && (
                                                        <Link
                                                            href={route('leave-types.edit', type.id)}
                                                            title="Edit"
                                                            aria-label={`Edit ${type.name}`}
                                                            className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all border border-transparent hover:border-slate-200"
                                                        >
                                                            <FaEdit size={12} />
                                                        </Link>
                                                    )}

                                                    {canManage && (
                                                        <button
                                                            onClick={() => handleDelete(type)}
                                                            title="Delete"
                                                            aria-label={`Delete ${type.name}`}
                                                            className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-6 border border-slate-100">
                                                    <FaClipboardList size={28} />
                                                </div>
                                                <h3 className="text-sm font-semibold text-slate-500">No Leave Types</h3>
                                                <p className="text-xs text-slate-400 mt-2 max-w-[280px] leading-relaxed">
                                                    There are currently no leave types configured in the system.
                                                </p>
                                                {canManage && (
                                                    <Link
                                                        href={route('leave-types.create')}
                                                        className="mt-8 flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95"
                                                    >
                                                        <FaPlus size={10} />
                                                        Add First Leave Type
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {leaveTypes?.links && leaveTypes.links.length > 3 && (
                        <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                            <p className="text-xs text-slate-500">
                                Total Leave Types: <span className="font-semibold text-slate-900">{leaveTypes.total}</span>
                            </p>
                            <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-100">
                                {leaveTypes.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${link.active ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' :
                                                !link.url ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
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
                onClose={() => setConfirmingDeletion(false)}
                onConfirm={confirmDeletion}
                title="Delete Leave Type"
                message={`Are you sure you want to delete the "${selectedLeaveType?.name}" leave type? This may affect existing leave requests.`}
                confirmText="Delete"
                type="danger"
                processing={processing}
            />
        </AuthenticatedLayout>
    );
}
