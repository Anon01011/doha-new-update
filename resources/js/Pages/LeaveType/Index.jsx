import ConfirmationModal from '@/Components/ConfirmationModal';
import { hasPermission } from '@/helpers/permissions';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    FaClipboardList,
    FaEdit,
    FaEye,
    FaPlus,
    FaTrash,
} from 'react-icons/fa';

export default function Index({ leaveTypes }) {
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [selectedLeaveType, setSelectedLeaveType] = useState(null);
    const [processing, setProcessing] = useState(false);

    const { auth } = usePage().props;
    const user = auth?.user || {};

    // The edit/delete routes are permission-guarded server-side; mirror that here so
    // users without the permission are not offered actions that will 403.
    const canManage =
        user.role === 'admin' || hasPermission(user, 'manage-leave-types');

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
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Leave Policy Management" />

            <div className="space-y-4 px-3 py-4 sm:px-4 lg:px-6">
                {/* Header */}
                <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:flex-row">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                            <FaClipboardList size={20} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-semibold leading-none text-slate-900">
                                Leave Types
                            </h1>
                            <p className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                {leaveTypes?.total ?? 0} configured polic
                                {(leaveTypes?.total ?? 0) === 1 ? 'y' : 'ies'}
                            </p>
                        </div>
                    </div>

                    {canManage && (
                        <Link
                            href={route('leave-types.create')}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95 md:w-auto"
                        >
                            <FaPlus size={11} />
                            Add Leave Type
                        </Link>
                    )}
                </div>

                {/* Leave Types */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="border-b border-slate-100 px-5 py-3 text-left text-xs font-semibold text-slate-500">
                                        Leave Type
                                    </th>
                                    <th className="border-b border-slate-100 px-5 py-3 text-left text-xs font-semibold text-slate-500">
                                        Code
                                    </th>
                                    <th className="border-b border-slate-100 px-5 py-3 text-left text-xs font-semibold text-slate-500">
                                        Branch
                                    </th>
                                    <th className="border-b border-slate-100 px-5 py-3 text-center text-xs font-semibold text-slate-500">
                                        Days Per Year
                                    </th>
                                    <th className="border-b border-slate-100 px-5 py-3 text-center text-xs font-semibold text-slate-500">
                                        Min Notice
                                    </th>
                                    <th className="border-b border-slate-100 px-5 py-3 text-center text-xs font-semibold text-slate-500">
                                        Carry Forward
                                    </th>
                                    <th className="border-b border-slate-100 px-5 py-3 text-left text-xs font-semibold text-slate-500">
                                        Status
                                    </th>
                                    <th className="border-b border-slate-100 px-5 py-3 text-right text-xs font-semibold text-slate-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {leaveTypes?.data &&
                                leaveTypes.data.length > 0 ? (
                                    leaveTypes.data.map((type) => (
                                        <tr
                                            key={type.id}
                                            className="group transition-colors hover:bg-slate-50/60"
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-white">
                                                        {type.code?.substring(
                                                            0,
                                                            2,
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm font-medium text-slate-900">
                                                            {type.name}
                                                        </span>
                                                        <span
                                                            className={`mt-1.5 inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                                                type.is_paid
                                                                    ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                                                                    : 'border-slate-200 bg-slate-50 text-slate-400'
                                                            }`}
                                                        >
                                                            {type.is_paid
                                                                ? 'Paid'
                                                                : 'Unpaid'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                    {type.code}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-sm text-slate-600">
                                                    {type.company?.name ||
                                                        'All Branches'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className="text-sm font-semibold leading-none text-slate-900">
                                                    {type.max_days_per_year}
                                                </span>
                                                <p className="mt-1 text-[11px] text-slate-400">
                                                    Days
                                                </p>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                {type.min_notice_days !==
                                                    null &&
                                                type.min_notice_days !==
                                                    undefined ? (
                                                    <>
                                                        <span className="text-sm font-semibold leading-none text-slate-900">
                                                            {
                                                                type.min_notice_days
                                                            }
                                                        </span>
                                                        <p className="mt-1 text-[11px] text-slate-400">
                                                            Days before
                                                        </p>
                                                    </>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-lg border border-slate-100 bg-slate-50 px-2 py-0.5 text-xs text-slate-400">
                                                        Global
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                {type.carry_forward_allowed ? (
                                                    <span className="inline-flex items-center rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                                                        Allowed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-lg border border-slate-100 bg-slate-50 px-2 py-0.5 text-xs text-slate-400">
                                                        No
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                {type.is_active ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1 text-xs text-slate-400">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={route(
                                                            'leave-types.show',
                                                            type.id,
                                                        )}
                                                        title="View"
                                                        aria-label={`View ${type.name}`}
                                                        className="rounded-lg border border-transparent bg-slate-50 p-2 text-slate-400 transition-all hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                                                    >
                                                        <FaEye size={12} />
                                                    </Link>

                                                    {canManage && (
                                                        <Link
                                                            href={route(
                                                                'leave-types.edit',
                                                                type.id,
                                                            )}
                                                            title="Edit"
                                                            aria-label={`Edit ${type.name}`}
                                                            className="rounded-lg border border-transparent bg-slate-50 p-2 text-slate-400 transition-all hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                                                        >
                                                            <FaEdit size={12} />
                                                        </Link>
                                                    )}

                                                    {canManage && (
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    type,
                                                                )
                                                            }
                                                            title="Delete"
                                                            aria-label={`Delete ${type.name}`}
                                                            className="rounded-lg border border-transparent bg-slate-50 p-2 text-slate-400 transition-all hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
                                                        >
                                                            <FaTrash
                                                                size={12}
                                                            />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="px-6 py-20 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-300">
                                                    <FaClipboardList
                                                        size={28}
                                                    />
                                                </div>
                                                <h3 className="text-sm font-semibold text-slate-500">
                                                    No Leave Types
                                                </h3>
                                                <p className="mt-2 max-w-[280px] text-xs leading-relaxed text-slate-400">
                                                    There are currently no leave
                                                    types configured in the
                                                    system.
                                                </p>
                                                {canManage && (
                                                    <Link
                                                        href={route(
                                                            'leave-types.create',
                                                        )}
                                                        className="mt-8 flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95"
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
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                            <p className="text-xs text-slate-500">
                                Total Leave Types:{' '}
                                <span className="font-semibold text-slate-900">
                                    {leaveTypes.total}
                                </span>
                            </p>
                            <div className="flex gap-1 rounded-xl border border-slate-100 bg-white p-1">
                                {leaveTypes.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                                            link.active
                                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                                : !link.url
                                                  ? 'cursor-not-allowed text-slate-300'
                                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
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
