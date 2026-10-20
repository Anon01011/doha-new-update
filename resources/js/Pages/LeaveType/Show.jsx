import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    FaClipboardList,
    FaArrowLeft,
    FaEdit,
    FaCheckCircle,
    FaTimesCircle,
    FaCode,
    FaCalendarAlt,
    FaShieldAlt,
    FaHandHoldingUsd,
    FaClock,
    FaInfoCircle,
    FaPaperclip,
    FaHistory,
    FaListUl,
    FaBuilding,
} from 'react-icons/fa';
import { hasPermission } from '@/helpers/permissions';

export default function Show({ leaveType, enableAttachment }) {
    const { auth } = usePage().props;
    const user = auth?.user || {};

    // The edit route is permission-guarded server-side; mirror it in the UI.
    const canEdit = user.role === 'admin' || hasPermission(user, 'manage-leave-types');

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
    const hasNoticeOverride = leaveType.min_notice_days !== null && leaveType.min_notice_days !== undefined;

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
            value: hasNoticeOverride ? `${leaveType.min_notice_days}` : 'Global',
            suffix: hasNoticeOverride ? 'days before start' : 'inherits company setting',
            icon: <FaClock size={15} />,
            tint: 'bg-amber-50 text-amber-600',
        },
        {
            label: 'Approval',
            value: leaveType.requires_approval ? 'Required' : 'Automatic',
            suffix: leaveType.requires_approval ? 'manager review' : 'no review needed',
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

    if (Boolean(enableAttachment)) {
        ruleRows.push({
            icon: <FaPaperclip size={12} />,
            label: 'Supporting document',
            value: isAttachmentRequired ? 'Required on application' : 'Not required',
            muted: !isAttachmentRequired,
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Leave Type - ${leaveType.name}`} />

            <div className="py-4 px-3 sm:px-4 lg:px-6 space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 min-w-0">
                        <Link
                            href={route('leave-types.index')}
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-semibold text-slate-900 truncate">{leaveType.name}</h1>
                                <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${
                                        leaveType.is_active
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : 'bg-rose-50 text-rose-600 border-rose-100'
                                    }`}
                                >
                                    {leaveType.is_active ? <FaCheckCircle size={9} /> : <FaTimesCircle size={9} />}
                                    {leaveType.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                                <FaCode size={10} className="text-slate-300" />
                                Leave Type · {leaveType.code}
                            </p>
                        </div>
                    </div>

                    {canEdit && (
                        <Link
                            href={route('leave-types.edit', leaveType.id)}
                            className="flex-shrink-0 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <FaEdit size={11} />
                            Edit Leave Type
                        </Link>
                    )}
                </div>

                {/* Key figures */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4"
                        >
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.tint}`}
                            >
                                {stat.icon}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    {stat.label}
                                </p>
                                <p className="text-lg font-semibold text-slate-900 leading-tight mt-1 truncate">
                                    {stat.value}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{stat.suffix}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    {/* Main column */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Overview */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                <FaClipboardList className="text-slate-400" size={12} />
                                <h2 className="text-xs font-semibold text-slate-900">Overview</h2>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
                                        <FaClipboardList size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                            Leave Type Name
                                        </p>
                                        <h3 className="text-base font-semibold text-slate-900 mt-1">{leaveType.name}</h3>
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold border border-slate-200">
                                                {leaveType.code}
                                            </span>
                                            <span
                                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                                    leaveType.is_paid
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        : 'bg-slate-50 text-slate-500 border-slate-200'
                                                }`}
                                            >
                                                {leaveType.is_paid ? 'Paid Leave' : 'Unpaid Leave'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-5 border-t border-slate-100">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                        <FaInfoCircle size={10} /> Description
                                    </p>
                                    <p className="text-sm text-slate-600 leading-relaxed mt-2">
                                        {leaveType.description || 'No description provided for this leave type.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Policy & Entitlements */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                <FaListUl className="text-slate-400" size={12} />
                                <h2 className="text-xs font-semibold text-slate-900">Policy &amp; Entitlements</h2>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {ruleRows.map((row) => (
                                    <div key={row.label} className="px-6 py-4 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0">
                                                {row.icon}
                                            </span>
                                            <span className="text-xs text-slate-500 truncate">{row.label}</span>
                                        </div>
                                        <span
                                            className={`text-xs font-semibold text-right flex-shrink-0 ${
                                                row.muted ? 'text-slate-400' : 'text-slate-900'
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
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                <FaShieldAlt className="text-slate-400" size={12} />
                                <h2 className="text-xs font-semibold text-slate-900">System Info</h2>
                            </div>

                            <dl className="p-6 space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-[11px] font-medium text-slate-400">Code</dt>
                                    <dd className="text-xs font-semibold text-slate-900">{leaveType.code}</dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-[11px] font-medium text-slate-400">Status</dt>
                                    <dd className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full ${
                                                leaveType.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                                            }`}
                                        />
                                        {leaveType.is_active ? 'Active' : 'Inactive'}
                                    </dd>
                                </div>
                                {leaveType.company?.name && (
                                    <div className="flex items-center justify-between gap-3">
                                        <dt className="text-[11px] font-medium text-slate-400">Branch</dt>
                                        <dd className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                                            <FaBuilding size={10} className="text-slate-300" />
                                            <span className="truncate">{leaveType.company.name}</span>
                                        </dd>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-[11px] font-medium text-slate-400">Created On</dt>
                                    <dd className="text-xs font-semibold text-slate-900">
                                        {formatDate(leaveType.created_at)}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-[11px] font-medium text-slate-400">Last Updated</dt>
                                    <dd className="text-xs font-semibold text-slate-900">
                                        {formatDate(leaveType.updated_at)}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Documentation — only when the attachment feature is enabled */}
                        {Boolean(enableAttachment) && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                    <FaPaperclip size={11} /> Documentation
                                </h2>

                                <div
                                    className={`mt-4 flex items-start gap-3 p-4 rounded-xl border ${
                                        isAttachmentRequired
                                            ? 'bg-indigo-50/60 border-indigo-100'
                                            : 'bg-slate-50 border-slate-100'
                                    }`}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                            isAttachmentRequired
                                                ? 'bg-indigo-100 text-indigo-600'
                                                : 'bg-slate-100 text-slate-400'
                                        }`}
                                    >
                                        <FaPaperclip size={12} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-900">
                                            {isAttachmentRequired ? 'Attachment required' : 'Attachment optional'}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
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
                            className="block w-full py-3 bg-white text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all text-center border border-slate-200 shadow-sm"
                        >
                            Back to Leave Types
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
