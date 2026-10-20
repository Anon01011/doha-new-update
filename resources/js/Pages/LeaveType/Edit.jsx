import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import {
    FaArrowLeft,
    FaSave,
    FaCode,
    FaCalendarAlt,
    FaInfoCircle,
    FaShieldAlt,
    FaHandHoldingUsd,
    FaPowerOff,
    FaPaperclip,
    FaClock,
    FaClipboardList,
    FaListUl,
    FaEdit,
} from 'react-icons/fa';
import { Field, SwitchRow, SectionCard, SummaryRow, inputClass } from './Partials/LeaveTypeForm';

export default function Edit({ leaveType, enableAttachment, defaultNoticeDays = 0 }) {
    const { data, setData, put, processing, errors } = useForm({
        name: leaveType.name || '',
        code: leaveType.code || '',
        max_days_per_year: leaveType.max_days_per_year || 0,
        min_notice_days: leaveType.min_notice_days ?? '',
        carry_forward_allowed: leaveType.carry_forward_allowed || false,
        carry_forward_max_days: leaveType.carry_forward_max_days || null,
        requires_approval: leaveType.requires_approval !== false,
        requires_attachment:
            Boolean(leaveType.requires_attachment) &&
            leaveType.requires_attachment !== '0' &&
            leaveType.requires_attachment !== 0 &&
            leaveType.requires_attachment !== 'false',
        is_paid: Boolean(leaveType.is_paid),
        description: leaveType.description || '',
        is_active: leaveType.is_active !== false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('leave-types.update', leaveType.id));
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <AuthenticatedLayout>
            <Head title="Edit Leave Type" />

            <div className="py-4 px-3 sm:px-4 lg:px-6 space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 min-w-0">
                        <Link
                            href={route('leave-types.show', leaveType.id)}
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div className="min-w-0">
                            <h1 className="text-xl font-semibold text-slate-900 truncate">Edit Leave Type</h1>
                            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                                <FaEdit size={10} className="text-slate-300" />
                                Updating {leaveType.name}
                            </p>
                        </div>
                    </div>

                    <button
                        form="leave-type-edit-form"
                        type="submit"
                        disabled={processing}
                        className="flex-shrink-0 w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {processing ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <FaSave size={11} />
                        )}
                        <span>Save Changes</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    {/* Form */}
                    <div className="lg:col-span-2 space-y-4">
                        <form id="leave-type-edit-form" onSubmit={handleSubmit} className="space-y-4">
                            {/* Basics */}
                            <SectionCard
                                icon={<FaClipboardList size={14} />}
                                title="Leave Type Details"
                                description="The name employees will see when applying for this leave."
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Field label="Name" htmlFor="name" error={errors.name} required>
                                        <input
                                            id="name"
                                            type="text"
                                            className={inputClass(errors.name)}
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            placeholder="e.g. Annual Leave"
                                        />
                                    </Field>

                                    <Field
                                        label="Code"
                                        htmlFor="code"
                                        error={errors.code}
                                        hint="A short unique identifier. Letters are converted to uppercase."
                                    >
                                        <div className="relative">
                                            <input
                                                id="code"
                                                type="text"
                                                className={`${inputClass(errors.code)} pr-10`}
                                                value={data.code}
                                                onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                                placeholder="AL"
                                            />
                                            <FaCode
                                                size={12}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
                                            />
                                        </div>
                                    </Field>
                                </div>
                            </SectionCard>

                            {/* Entitlement */}
                            <SectionCard
                                icon={<FaCalendarAlt size={14} />}
                                title="Entitlement & Notice"
                                description="How much leave is granted and how early it must be requested."
                            >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <Field
                                        label="Max Days Per Year"
                                        htmlFor="max_days_per_year"
                                        error={errors.max_days_per_year}
                                        required
                                    >
                                        <input
                                            id="max_days_per_year"
                                            type="number"
                                            className={inputClass(errors.max_days_per_year)}
                                            value={data.max_days_per_year}
                                            onChange={(e) => setData('max_days_per_year', e.target.value)}
                                            required
                                            min="0"
                                        />
                                    </Field>

                                    <Field
                                        label="Min Notice (Days)"
                                        htmlFor="min_notice_days"
                                        error={errors.min_notice_days}
                                        hint={
                                            defaultNoticeDays
                                                ? `Leave empty to inherit the global setting (${defaultNoticeDays} days).`
                                                : 'Leave empty to inherit the global company setting.'
                                        }
                                    >
                                        <input
                                            id="min_notice_days"
                                            type="number"
                                            className={inputClass(errors.min_notice_days)}
                                            value={data.min_notice_days}
                                            onChange={(e) => setData('min_notice_days', e.target.value)}
                                            min="0"
                                            max="365"
                                            placeholder={String(defaultNoticeDays ?? 0)}
                                        />
                                    </Field>

                                    <Field
                                        label="Carry Forward Max"
                                        htmlFor="carry_forward_max_days"
                                        error={errors.carry_forward_max_days}
                                        hint="Cap on days that can roll into the next year."
                                    >
                                        <input
                                            id="carry_forward_max_days"
                                            type="number"
                                            className={inputClass(errors.carry_forward_max_days)}
                                            value={data.carry_forward_max_days || ''}
                                            onChange={(e) =>
                                                setData('carry_forward_max_days', e.target.value || null)
                                            }
                                            min="0"
                                            placeholder="0"
                                        />
                                    </Field>
                                </div>
                            </SectionCard>

                            {/* Policy rules */}
                            <SectionCard
                                icon={<FaListUl size={14} />}
                                title="Policy Rules"
                                description="Control how this leave is reviewed, paid and offered to employees."
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <SwitchRow
                                        id="carry_forward_allowed"
                                        icon={<FaCalendarAlt size={14} />}
                                        title="Carry Forward"
                                        description="Allow unused days to roll into next year"
                                        checked={data.carry_forward_allowed}
                                        onChange={() => setData('carry_forward_allowed', !data.carry_forward_allowed)}
                                    />

                                    <SwitchRow
                                        id="requires_approval"
                                        icon={<FaShieldAlt size={14} />}
                                        title="Requires Approval"
                                        description="Route applications through manager review"
                                        checked={data.requires_approval}
                                        onChange={() => setData('requires_approval', !data.requires_approval)}
                                    />

                                    <SwitchRow
                                        id="is_paid"
                                        icon={<FaHandHoldingUsd size={14} />}
                                        title="Paid Leave"
                                        description="Eligible for compensation during this leave"
                                        checked={data.is_paid}
                                        onChange={() => setData('is_paid', !data.is_paid)}
                                    />

                                    <SwitchRow
                                        id="is_active"
                                        icon={<FaPowerOff size={14} />}
                                        title="Active"
                                        description="Make this leave type available for selection"
                                        checked={data.is_active}
                                        onChange={() => setData('is_active', !data.is_active)}
                                    />

                                    {enableAttachment && (
                                        <div className="md:col-span-2">
                                            <SwitchRow
                                                id="requires_attachment"
                                                icon={<FaPaperclip size={14} />}
                                                title="Requires Attachment"
                                                description="Employees must upload a document when applying"
                                                badge={
                                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                                        Optional
                                                    </span>
                                                }
                                                checked={data.requires_attachment}
                                                onChange={() =>
                                                    setData('requires_attachment', !data.requires_attachment)
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            </SectionCard>

                            {/* Description */}
                            <SectionCard
                                icon={<FaInfoCircle size={14} />}
                                title="Description"
                                description="Explain the policy scope and eligibility criteria."
                            >
                                <textarea
                                    className={`${inputClass(errors.description)} resize-none`}
                                    rows={4}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Describe policy scope and eligibility criteria..."
                                />
                                {errors.description && (
                                    <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-rose-600">
                                        <FaInfoCircle size={11} />
                                        {errors.description}
                                    </p>
                                )}
                            </SectionCard>
                        </form>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Live summary */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                <FaShieldAlt className="text-slate-400" size={12} />
                                <h2 className="text-xs font-semibold text-slate-900">Summary</h2>
                            </div>

                            <dl className="p-6 space-y-3.5">
                                <SummaryRow label="Name" value={data.name || '—'} />
                                <SummaryRow label="Code" value={data.code || '—'} />
                                <SummaryRow label="Max Days" value={`${data.max_days_per_year || 0} days`} />
                                <SummaryRow
                                    label="Min Notice"
                                    value={
                                        data.min_notice_days === '' || data.min_notice_days === null
                                            ? 'Global'
                                            : `${data.min_notice_days} days`
                                    }
                                    accent
                                />
                                <SummaryRow label="Paid" value={data.is_paid ? 'Yes' : 'No'} />
                                <SummaryRow
                                    label="Approval"
                                    value={data.requires_approval ? 'Required' : 'Automatic'}
                                />
                                <SummaryRow label="Status" value={data.is_active ? 'Active' : 'Inactive'} />
                            </dl>
                        </div>

                        {/* Change checklist */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                <FaClock size={11} /> Before You Save
                            </h2>

                            <ul className="mt-4 space-y-3">
                                <li className="flex gap-2.5">
                                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-slate-300" />
                                    <p className="text-[11px] leading-relaxed text-slate-500">
                                        Changes apply to <span className="font-semibold text-slate-700">new</span>{' '}
                                        applications. Existing requests keep their original rules.
                                    </p>
                                </li>
                                <li className="flex gap-2.5">
                                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-slate-300" />
                                    <p className="text-[11px] leading-relaxed text-slate-500">
                                        Clearing <span className="font-semibold text-slate-700">Min Notice</span> reverts
                                        the policy to the global company setting.
                                    </p>
                                </li>
                                <li className="flex gap-2.5">
                                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-slate-300" />
                                    <p className="text-[11px] leading-relaxed text-slate-500">
                                        Marking the type <span className="font-semibold text-slate-700">Inactive</span>{' '}
                                        hides it from the leave application form.
                                    </p>
                                </li>
                            </ul>
                        </div>

                        {hasErrors && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                                <p className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                                    <FaInfoCircle size={12} />
                                    {Object.keys(errors).length} field(s) need attention
                                </p>
                            </div>
                        )}

                        <Link
                            href={route('leave-types.show', leaveType.id)}
                            className="block w-full py-3 bg-white text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all text-center border border-slate-200 shadow-sm"
                        >
                            Cancel
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
