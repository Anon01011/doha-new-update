import { hasPermission } from '@/helpers/permissions';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    FaArrowLeft,
    FaBuilding,
    FaCalendarAlt,
    FaCheckCircle,
    FaClipboardList,
    FaClock,
    FaCode,
    FaEdit,
    FaHandHoldingUsd,
    FaHistory,
    FaInfoCircle,
    FaListUl,
    FaPaperclip,
    FaShieldAlt,
    FaTimesCircle,
} from 'react-icons/fa';

export default function Show({ leaveType, enableAttachment }) {
    const { auth } = usePage().props;
    const user = auth?.user || {};

    // The edit route is permission-guarded server-side; mirror it in the UI.
    const canEdit =
        user.role === 'admin' || hasPermission(user, 'manage-leave-types');

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    // The flag may arrive as a boolean, 0/1 or "0"/"false" depending on the driver.
    const isAttachmentRequired =
        Boolean(leaveType.requires_attachment) &&
        leaveType.requires_attachment !== '0' &&
        leaveType.requires_attachment !== 0 &&
        leaveType.requires_attachment !== 'false';

    // A NULL `min_notice_days` means "inherit the global company setting".
    const hasNoticeOverride =
        leaveType.min_notice_days !== null &&
        leaveType.min_notice_days !== undefined;

    const stats = [
        {
            label: 'Max Days / Year',
            value: `${leaveType.max_days_per_year ?? 0}`,
            suffix: 'days of entitlement',
            icon: <FaCalendarAlt size={15} />,
            tint: 'bg-indigo-50 text-indigo-600',
        },
        {
            label: 'Min Notice',
            value: hasNoticeOverride
                ? `${leaveType.min_notice_days}`
                : 'Global',
            suffix: hasNoticeOverride
                ? 'days before start'
                : 'inherits company setting',
            icon: <FaClock size={15} />,
            tint: 'bg-amber-50 text-amber-600',
        },
        {
            label: 'Approval',
            value: leaveType.requires_approval ? 'Required' : 'Automatic',
            suffix: leaveType.requires_approval
                ? 'manager review'
                : 'no review needed',
            icon: <FaShieldAlt size={15} />,
            tint: 'bg-emerald-50 text-emerald-600',
        },
        {
            label: 'Carry Forward',
            value: leaveType.carry_forward_allowed ? 'Allowed' : 'Disabled',
            suffix: leaveType.carry_forward_allowed
                ? leaveType.carry_forward_max_days
                    ? `max ${leaveType.carry_forward_max_days} days`
                    : 'unlimited'
                : 'balance resets yearly',
            icon: <FaHistory size={15} />,
            tint: 'bg-sky-50 text-sky-600',
        },
    ];

    const ruleRows = [
        {
            icon: <FaCalendarAlt size={12} />,
            label: 'Maximum days per year',
            value: `${leaveType.max_days_per_year ?? 0} days`,
        },
        {
            icon: <FaClock size={12} />,
            label: 'Minimum notice period',
            value: hasNoticeOverride
                ? `${leaveType.min_notice_days} day${Number(leaveType.min_notice_days) === 1 ? '' : 's'} before start`
                : 'Inherits global setting',
            muted: !hasNoticeOverride,
        },
        {
            icon: <FaShieldAlt size={12} />,
            label: 'Manager approval',
            value: leaveType.requires_approval ? 'Required' : 'Not required',
        },
        {
            icon: <FaHistory size={12} />,
            label: 'Carry forward',
            value: leaveType.carry_forward_allowed
                ? leaveType.carry_forward_max_days
                    ? `Allowed · max ${leaveType.carry_forward_max_days} days`
                    : 'Allowed · unlimited'
                : 'Not allowed',
        },
        {
            icon: <FaHandHoldingUsd size={12} />,
            label: 'Compensation',
            value: leaveType.is_paid ? 'Paid leave' : 'Unpaid leave',
        },
    ];

    if (enableAttachment) {
        ruleRows.push({
            icon: <FaPaperclip size={12} />,
            label: 'Supporting document',
            value: isAttachmentRequired
                ? 'Required on application'
                : 'Not required',
            muted: !isAttachmentRequired,
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Leave Type - ${leaveType.name}`} />

            <div className="space-y-4 px-3 py-4 sm:px-4 lg:px-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
                    <div className="flex min-w-0 items-center gap-4">
                        <Link
                            href={route('leave-types.index')}
                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="truncate text-xl font-semibold text-slate-900">
                                    {leaveType.name}
                                </h1>
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold ${
                                        leaveType.is_active
                                            ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                                            : 'border-rose-100 bg-rose-50 text-rose-600'
                                    }`}
                                >
                                    {leaveType.is_active ? (
                                        <FaCheckCircle size={9} />
                                    ) : (
                                        <FaTimesCircle size={9} />
                                    )}
                                    {leaveType.is_active
                                        ? 'Active'
                                        : 'Inactive'}
                                </span>
                            </div>
                            <p className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                                <FaCode size={10} className="text-slate-300" />
                                Leave Type · {leaveType.code}
                            </p>
                        </div>
                    </div>

                    {canEdit && (
                        <Link
                            href={route('leave-types.edit', leaveType.id)}
                            className="flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95"
                        >
                            <FaEdit size={11} />
                            Edit Leave Type
                        </Link>
                    )}
                </div>

                {/* Key figures */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div
                                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${stat.tint}`}
                            >
                                {stat.icon}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    {stat.label}
                                </p>
                                <p className="mt-1 truncate text-lg font-semibold leading-tight text-slate-900">
                                    {stat.value}
                                </p>
                                <p className="mt-0.5 text-[10px] text-slate-400">
                                    {stat.suffix}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
                    {/* Main column */}
                    <div className="space-y-4 lg:col-span-2">
                        {/* Overview */}
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
                                <FaClipboardList
                                    className="text-slate-400"
                                    size={12}
                                />
                                <h2 className="text-xs font-semibold text-slate-900">
                                    Overview
                                </h2>
                            </div>

                            <div className="space-y-5 p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600">
                                        <FaClipboardList size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                            Leave Type Name
                                        </p>
                                        <h3 className="mt-1 text-base font-semibold text-slate-900">
                                            {leaveType.name}
                                        </h3>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                                {leaveType.code}
                                            </span>
                                            <span
                                                className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                                                    leaveType.is_paid
                                                        ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                                                        : 'border-slate-200 bg-slate-50 text-slate-500'
                                                }`}
                                            >
                                                {leaveType.is_paid
                                                    ? 'Paid Leave'
                                                    : 'Unpaid Leave'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-5">
                                    <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        <FaInfoCircle size={10} /> Description
                                    </p>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                        {leaveType.description ||
                                            'No description provided for this leave type.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Policy & Entitlements */}
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
                                <FaListUl
                                    className="text-slate-400"
                                    size={12}
                                />
                                <h2 className="text-xs font-semibold text-slate-900">
                                    Policy &amp; Entitlements
                                </h2>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {ruleRows.map((row) => (
                                    <div
                                        key={row.label}
                                        className="flex items-center justify-between gap-4 px-6 py-4"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-400">
                                                {row.icon}
                                            </span>
                                            <span className="truncate text-xs text-slate-500">
                                                {row.label}
                                            </span>
                                        </div>
                                        <span
                                            className={`flex-shrink-0 text-right text-xs font-semibold ${
                                                row.muted
                                                    ? 'text-slate-400'
                                                    : 'text-slate-900'
                                            }`}
                                        >
                                            {row.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* System Info — light panel, decorative art is CSS-only so it is
                            never forced to solid white by the layout's dark-panel rules. */}
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
                                <FaShieldAlt
                                    className="text-slate-400"
                                    size={12}
                                />
                                <h2 className="text-xs font-semibold text-slate-900">
                                    System Info
                                </h2>
                            </div>

                            <dl className="space-y-4 p-6">
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-[11px] font-medium text-slate-400">
                                        Code
                                    </dt>
                                    <dd className="text-xs font-semibold text-slate-900">
                                        {leaveType.code}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-[11px] font-medium text-slate-400">
                                        Status
                                    </dt>
                                    <dd className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${
                                                leaveType.is_active
                                                    ? 'bg-emerald-500'
                                                    : 'bg-rose-500'
                                            }`}
                                        />
                                        {leaveType.is_active
                                            ? 'Active'
                                            : 'Inactive'}
                                    </dd>
                                </div>
                                {leaveType.company?.name && (
                                    <div className="flex items-center justify-between gap-3">
                                        <dt className="text-[11px] font-medium text-slate-400">
                                            Branch
                                        </dt>
                                        <dd className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                                            <FaBuilding
                                                size={10}
                                                className="text-slate-300"
                                            />
                                            <span className="truncate">
                                                {leaveType.company.name}
                                            </span>
                                        </dd>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-[11px] font-medium text-slate-400">
                                        Created On
                                    </dt>
                                    <dd className="text-xs font-semibold text-slate-900">
                                        {formatDate(leaveType.created_at)}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-[11px] font-medium text-slate-400">
                                        Last Updated
                                    </dt>
                                    <dd className="text-xs font-semibold text-slate-900">
                                        {formatDate(leaveType.updated_at)}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Documentation — only when the attachment feature is enabled */}
                        {Boolean(enableAttachment) && (
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    <FaPaperclip size={11} /> Documentation
                                </h2>

                                <div
                                    className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${
                                        isAttachmentRequired
                                            ? 'border-indigo-100 bg-indigo-50/60'
                                            : 'border-slate-100 bg-slate-50'
                                    }`}
                                >
                                    <div
                                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                                            isAttachmentRequired
                                                ? 'bg-indigo-100 text-indigo-600'
                                                : 'bg-slate-100 text-slate-400'
                                        }`}
                                    >
                                        <FaPaperclip size={12} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-900">
                                            {isAttachmentRequired
                                                ? 'Attachment required'
                                                : 'Attachment optional'}
                                        </p>
                                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                                            {isAttachmentRequired
                                                ? 'Employees must upload a supporting document when applying for this leave.'
                                                : 'No supporting document is required for this leave type.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Link
                            href={route('leave-types.index')}
                            className="block w-full rounded-xl border border-slate-200 bg-white py-3 text-center text-xs font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
                        >
                            Back to Leave Types
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
