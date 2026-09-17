import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import React from 'react';
import { 
    FiArrowLeft, FiUserMinus, FiCalendar, FiFileText, 
    FiUploadCloud, FiAlertCircle, FiInfo, FiShield,
    FiBriefcase, FiLayers, FiUser, FiCheck
} from 'react-icons/fi';

const SEPARATION_REASONS = [
    { value: 'resignation',         label: 'Resignation (Voluntary Resignation)' },
    { value: 'retirement',          label: 'Retirement' },
    { value: 'termination',         label: 'Termination' },
    { value: 'contract_completion', label: 'Contract Completion / Expiry' },
    { value: 'redundancy',          label: 'Redundancy / Restructuring' },
    { value: 'mutual_separation',   label: 'Mutual Separation Agreement' },
    { value: 'absconding',          label: 'Absconding / Abandonment' },
    { value: 'other',               label: 'Other' },
];

const EMPLOYEE_SEPARATION_REASONS = [
    { value: 'resignation',       label: 'Resignation (Personal / Career Move)' },
    { value: 'retirement',        label: 'Retirement' },
    { value: 'mutual_separation', label: 'Mutual Separation Agreement' },
    { value: 'other',             label: 'Other Reason' },
];

export default function Edit({ offboarding, userRole = 'employee', isManagementRole = false }) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        separation_reason:         offboarding.separation_reason || 'resignation',
        proposed_last_working_day: offboarding.proposed_last_working_day?.split('T')[0] || '',
        notice_pay_applicable:     Boolean(offboarding.notice_pay_applicable),
        notice_pay_amount:         offboarding.notice_pay_amount || '',
        remarks:                   offboarding.remarks || '',
        supporting_document:       null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('offboarding.update', offboarding.request_number || offboarding.id), { forceFormData: true });
    };

    const noticeDays = data.proposed_last_working_day
        ? Math.max(0, Math.ceil((new Date(data.proposed_last_working_day) - new Date()) / (1000 * 60 * 60 * 24)))
        : null;

    const availableReasons = isManagementRole ? SEPARATION_REASONS : EMPLOYEE_SEPARATION_REASONS;
    const offboardingRef = offboarding.request_number || offboarding.id;

    return (
        <AuthenticatedLayout>
            <Head title={`Edit Offboarding — ${offboarding.employee?.name || 'Request'}`} />

            {/* In-Page Header */}
            <div className="w-full bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link 
                            href={route('offboarding.show', offboardingRef)} 
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                    <FiUserMinus className="text-rose-500 w-5 h-5" /> Edit Offboarding Request
                                </h1>
                                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                                    {offboarding.request_number || `REQ-${offboarding.id}`}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {offboarding.employee?.name} · {offboarding.employee?.employee_code} ({offboarding.employee?.designation || 'Staff'})
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-5xl mx-auto p-3 sm:p-6 lg:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Employee Read-only Summary Banner */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                {offboarding.employee?.employee_image ? (
                                    <img
                                        src={`/storage/${offboarding.employee.employee_image}`}
                                        alt={offboarding.employee.name}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-rose-100"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white font-bold text-base flex items-center justify-center shadow-sm">
                                        {offboarding.employee?.name?.charAt(0)?.toUpperCase() || 'E'}
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="font-bold text-slate-900 text-base">{offboarding.employee?.name}</h2>
                                        <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-rose-50 text-rose-700 border border-rose-100">
                                            {offboarding.employee?.employee_code}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                                        <span>{offboarding.employee?.designation || 'Staff'}</span>
                                        {offboarding.employee?.department?.name && (
                                            <>
                                                <span>·</span>
                                                <span className="text-slate-600 font-medium">{offboarding.employee.department.name}</span>
                                            </>
                                        )}
                                        {offboarding.employee?.company?.name && (
                                            <>
                                                <span>·</span>
                                                <span className="text-slate-400 font-medium">{offboarding.employee.company.name}</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-semibold self-start sm:self-center">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span className="capitalize">{offboarding.status.replace(/_/g, ' ')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left Column (2 cols): Separation Details */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-4">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <FiFileText className="text-rose-500 w-4 h-4" /> Separation Parameters
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Separation Reason *
                                        </label>
                                        <select
                                            value={data.separation_reason}
                                            onChange={(e) => setData('separation_reason', e.target.value)}
                                            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 font-medium text-slate-700"
                                        >
                                            {availableReasons.map((r) => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                        {errors.separation_reason && <p className="text-[10px] text-rose-500 mt-1">{errors.separation_reason}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Proposed Last Working Day *
                                        </label>
                                        <div className="relative">
                                            <FiCalendar className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                                            <input
                                                type="date"
                                                required
                                                value={data.proposed_last_working_day}
                                                onChange={(e) => setData('proposed_last_working_day', e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 font-medium text-slate-700"
                                            />
                                        </div>
                                        {noticeDays !== null && (
                                            <p className="text-[10px] text-slate-500 mt-1">
                                                Calculated notice period: <span className="font-semibold text-slate-700">{noticeDays} day{noticeDays !== 1 ? 's' : ''}</span>
                                            </p>
                                        )}
                                        {errors.proposed_last_working_day && <p className="text-[10px] text-rose-500 mt-1">{errors.proposed_last_working_day}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        {isManagementRole ? 'Remarks / Internal Notes' : 'Reason / Handover Notes'}
                                    </label>
                                    <textarea
                                        rows="4"
                                        value={data.remarks}
                                        onChange={(e) => setData('remarks', e.target.value)}
                                        placeholder="Add notes, justification, or handover context…"
                                        className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
                                    />
                                    {errors.remarks && <p className="text-[10px] text-rose-500 mt-1">{errors.remarks}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Right Column (1 col): Notice Pay (if admin) & Document Upload */}
                        <div className="space-y-6">

                            {/* Notice Pay Card (Only for Management) */}
                            {isManagementRole && (
                                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-4">
                                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <FiAlertCircle className="text-amber-500 w-4 h-4" /> Notice Pay & Terms
                                    </h3>

                                    <div className="flex items-start gap-3 p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl">
                                        <input
                                            type="checkbox"
                                            id="notice_pay"
                                            checked={data.notice_pay_applicable}
                                            onChange={(e) => setData('notice_pay_applicable', e.target.checked)}
                                            className="mt-0.5 rounded text-rose-600 focus:ring-rose-400"
                                        />
                                        <div className="flex-1">
                                            <label htmlFor="notice_pay" className="text-xs font-bold text-slate-800 cursor-pointer">Notice Pay Applicable</label>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Enable if employee is paid in lieu of notice</p>
                                        </div>
                                    </div>

                                    {data.notice_pay_applicable && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Notice Pay Amount (₹)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0.00"
                                                    value={data.notice_pay_amount}
                                                    onChange={(e) => setData('notice_pay_amount', e.target.value)}
                                                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Document Upload */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-3">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <FiUploadCloud className="text-rose-500 w-4 h-4" /> Supporting Document
                                </h3>

                                {offboarding.supporting_document && (
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase">Attached File:</span>
                                        <p className="font-semibold text-slate-700 truncate">
                                            {offboarding.supporting_document.split('/').pop()}
                                        </p>
                                    </div>
                                )}

                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-rose-400 hover:bg-rose-50/20 rounded-xl p-5 cursor-pointer transition-all text-center">
                                    <FiUploadCloud className="w-7 h-7 text-slate-400 mb-1.5" />
                                    <p className="text-xs text-slate-700 font-medium truncate max-w-[200px]">
                                        {data.supporting_document ? data.supporting_document.name : 'Upload New / Replacement File'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1">PDF, DOC, JPG — Max 5MB</p>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        className="hidden"
                                        onChange={(e) => setData('supporting_document', e.target.files[0] || null)}
                                    />
                                </label>
                                {errors.supporting_document && <p className="text-[10px] text-rose-500 mt-1">{errors.supporting_document}</p>}
                            </div>

                            {/* Action Buttons */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-slate-900 hover:bg-rose-600 text-white rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    <FiCheck className="w-4 h-4" />
                                    {processing ? 'Saving Changes…' : 'Save Changes'}
                                </button>
                                <Link
                                    href={route('offboarding.show', offboardingRef)}
                                    className="block text-center py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                    Cancel
                                </Link>
                            </div>

                        </div>

                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
