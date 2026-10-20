import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    FaArrowLeft,
    FaCalendarAlt,
    FaClipboardList,
    FaClock,
    FaHandHoldingUsd,
    FaInfoCircle,
    FaListUl,
    FaPaperclip,
    FaPowerOff,
    FaSave,
    FaShieldAlt,
} from 'react-icons/fa';
import {
    Field,
    SectionCard,
    SummaryRow,
    SwitchRow,
    inputClass,
} from './Partials/LeaveTypeForm';

export default function Create({ enableAttachment, defaultNoticeDays = 0 }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        max_days_per_year: 0,
        min_notice_days: '',
        carry_forward_allowed: false,
        carry_forward_max_days: null,
        requires_approval: true,
        requires_attachment: false,
        is_paid: true,
        description: '',
        is_active: true,
    });

    const handleNameChange = (e) => {
        const name = e.target.value;
        setData('name', name);

        // Derive a short code from the name; the field is read-only for the user.
        const code = name
            .split(' ')
            .map((word) => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 5);

        setData('code', code);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('leave-types.store'));
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <AuthenticatedLayout>
            <Head title="Add Leave Type" />

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
                            <h1 className="truncate text-xl font-semibold text-slate-900">
                                Add Leave Type
                            </h1>
                            <p className="mt-1.5 text-xs text-slate-400">
                                Create a new leave policy and its entitlement
                                rules
                            </p>
                        </div>
                    </div>

                    <button
                        form="leave-type-form"
                        type="submit"
                        disabled={processing}
                        className="flex w-full flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50 sm:w-auto"
                    >
                        {processing ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                            <FaSave size={11} />
                        )}
                        <span>Save Leave Type</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
                    {/* Form */}
                    <div className="space-y-4 lg:col-span-2">
                        <form
                            id="leave-type-form"
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
                            {/* Basics */}
                            <SectionCard
                                icon={<FaClipboardList size={14} />}
                                title="Leave Type Details"
                                description="The name employees will see when applying for this leave."
                            >
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <Field
                                        label="Name"
                                        htmlFor="name"
                                        error={errors.name}
                                        required
                                    >
                                        <input
                                            id="name"
                                            type="text"
                                            className={inputClass(errors.name)}
                                            value={data.name}
                                            onChange={handleNameChange}
                                            required
                                            placeholder="e.g. Annual Leave"
                                        />
                                    </Field>

                                    <Field
                                        label="Code"
                                        htmlFor="code"
                                        error={errors.code}
                                        hint="Generated automatically from the leave type name."
                                    >
                                        <div className="relative">
                                            <input
                                                id="code"
                                                type="text"
                                                className={`${inputClass(errors.code)} cursor-not-allowed bg-slate-100 pr-20 text-slate-500`}
                                                value={data.code}
                                                readOnly
                                                placeholder="AUTO"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">
                                                Locked
                                            </span>
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
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                                    <Field
                                        label="Max Days Per Year"
                                        htmlFor="max_days_per_year"
                                        error={errors.max_days_per_year}
                                        required
                                    >
                                        <input
                                            id="max_days_per_year"
                                            type="number"
                                            className={inputClass(
                                                errors.max_days_per_year,
                                            )}
                                            value={data.max_days_per_year}
                                            onChange={(e) =>
                                                setData(
                                                    'max_days_per_year',
                                                    e.target.value,
                                                )
                                            }
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
                                            className={inputClass(
                                                errors.min_notice_days,
                                            )}
                                            value={data.min_notice_days}
                                            onChange={(e) =>
                                                setData(
                                                    'min_notice_days',
                                                    e.target.value,
                                                )
                                            }
                                            min="0"
                                            max="365"
                                            placeholder={String(
                                                defaultNoticeDays ?? 0,
                                            )}
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
                                            className={inputClass(
                                                errors.carry_forward_max_days,
                                            )}
                                            value={
                                                data.carry_forward_max_days ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'carry_forward_max_days',
                                                    e.target.value || null,
                                                )
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
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <SwitchRow
                                        id="carry_forward_allowed"
                                        icon={<FaCalendarAlt size={14} />}
                                        title="Carry Forward"
                                        description="Allow unused days to roll into next year"
                                        checked={data.carry_forward_allowed}
                                        onChange={() =>
                                            setData(
                                                'carry_forward_allowed',
                                                !data.carry_forward_allowed,
                                            )
                                        }
                                    />

                                    <SwitchRow
                                        id="requires_approval"
                                        icon={<FaShieldAlt size={14} />}
                                        title="Requires Approval"
                                        description="Route applications through manager review"
                                        checked={data.requires_approval}
                                        onChange={() =>
                                            setData(
                                                'requires_approval',
                                                !data.requires_approval,
                                            )
                                        }
                                    />

                                    <SwitchRow
                                        id="is_paid"
                                        icon={<FaHandHoldingUsd size={14} />}
                                        title="Paid Leave"
                                        description="Eligible for compensation during this leave"
                                        checked={data.is_paid}
                                        onChange={() =>
                                            setData('is_paid', !data.is_paid)
                                        }
                                    />

                                    <SwitchRow
                                        id="is_active"
                                        icon={<FaPowerOff size={14} />}
                                        title="Active"
                                        description="Make this leave type available for selection"
                                        checked={data.is_active}
                                        onChange={() =>
                                            setData(
                                                'is_active',
                                                !data.is_active,
                                            )
                                        }
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
                                                checked={
                                                    data.requires_attachment
                                                }
                                                onChange={() =>
                                                    setData(
                                                        'requires_attachment',
                                                        !data.requires_attachment,
                                                    )
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
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
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
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
                                <FaShieldAlt
                                    className="text-slate-400"
                                    size={12}
                                />
                                <h2 className="text-xs font-semibold text-slate-900">
                                    Summary
                                </h2>
                            </div>

                            <dl className="space-y-3.5 p-6">
                                <SummaryRow
                                    label="Name"
                                    value={data.name || '—'}
                                />
                                <SummaryRow
                                    label="Code"
                                    value={data.code || '—'}
                                />
                                <SummaryRow
                                    label="Max Days"
                                    value={`${data.max_days_per_year || 0} days`}
                                />
                                <SummaryRow
                                    label="Min Notice"
                                    value={
                                        data.min_notice_days === '' ||
                                        data.min_notice_days === null
                                            ? 'Global'
                                            : `${data.min_notice_days} days`
                                    }
                                    accent
                                />
                                <SummaryRow
                                    label="Paid"
                                    value={data.is_paid ? 'Yes' : 'No'}
                                />
                                <SummaryRow
                                    label="Approval"
                                    value={
                                        data.requires_approval
                                            ? 'Required'
                                            : 'Automatic'
                                    }
                                />
                                <SummaryRow
                                    label="Status"
                                    value={
                                        data.is_active ? 'Active' : 'Inactive'
                                    }
                                />
                            </dl>
                        </div>

                        {/* Guidance */}
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                <FaClock size={11} /> How It Works
                            </h2>

                            <ol className="mt-4 space-y-4">
                                <li className="flex gap-3">
                                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-500">
                                        01
                                    </span>
                                    <p className="text-[11px] leading-relaxed text-slate-500">
                                        <span className="font-semibold text-slate-700">
                                            Max Days
                                        </span>{' '}
                                        sets the quota available per personnel
                                        cycle.
                                    </p>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-500">
                                        02
                                    </span>
                                    <p className="text-[11px] leading-relaxed text-slate-500">
                                        <span className="font-semibold text-slate-700">
                                            Carry Forward
                                        </span>{' '}
                                        lets unused quota migrate into
                                        subsequent periods.
                                    </p>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-500">
                                        03
                                    </span>
                                    <p className="text-[11px] leading-relaxed text-slate-500">
                                        <span className="font-semibold text-slate-700">
                                            Approval
                                        </span>{' '}
                                        sends every application through
                                        managerial review.
                                    </p>
                                </li>
                            </ol>
                        </div>

                        {hasErrors && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                                <p className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                                    <FaInfoCircle size={12} />
                                    {Object.keys(errors).length} field(s) need
                                    attention
                                </p>
                            </div>
                        )}

                        <Link
                            href={route('leave-types.index')}
                            className="block w-full rounded-xl border border-slate-200 bg-white py-3 text-center text-xs font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
                        >
                            Cancel
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
