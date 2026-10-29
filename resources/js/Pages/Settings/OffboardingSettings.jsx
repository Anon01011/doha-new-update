import React, { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import SettingsLayout from './SettingsLayout';

export default function OffboardingSettings({ settings = {}, availableTemplates = [] }) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        relieving_letter_template: settings.relieving_letter_template || 'relieving_letter',
        offboarding_send_email: settings.offboarding_send_email !== false && settings.offboarding_send_email !== 0 && settings.offboarding_send_email !== '0',
        offboarding_send_sms: Boolean(settings.offboarding_send_sms === true || settings.offboarding_send_sms === '1' || settings.offboarding_send_sms === 1),
        minimum_notice_days: settings.minimum_notice_days ?? 30,
        require_asset_clearance: settings.require_asset_clearance !== false && settings.require_asset_clearance !== 0 && settings.require_asset_clearance !== '0',
        require_finance_clearance: settings.require_finance_clearance !== false && settings.require_finance_clearance !== 0 && settings.require_finance_clearance !== '0',
        require_exit_interview: Boolean(settings.require_exit_interview === true || settings.require_exit_interview === '1' || settings.require_exit_interview === 1),
        auto_archive_employee_on_complete: settings.auto_archive_employee_on_complete !== false && settings.auto_archive_employee_on_complete !== 0 && settings.auto_archive_employee_on_complete !== '0',
        relieving_letter_signatory_name: settings.relieving_letter_signatory_name || 'Management',
        relieving_letter_signatory_title: settings.relieving_letter_signatory_title || 'Head of Human Resources',
    });

    const [previewModal, setPreviewModal] = useState({
        open: false,
        template: null,
        title: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.offboarding.update'), {
            preserveScroll: true,
        });
    };

    const handleOpenPreview = (tplValue, tplLabel) => {
        setPreviewModal({
            open: true,
            template: tplValue,
            title: tplLabel,
        });
    };

    return (
        <SettingsLayout
            activeTab="offboarding"
            title="Offboarding & Relieving Settings"
            description="Manage separation policies, exit clearance requirements, and select the PDF template used for employee relieving & experience certificates."
        >
            <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl">
                {/* Flash Success / Error Alerts */}
                {flash?.success && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{flash.success}</span>
                        </div>
                    </div>
                )}

                {/* ── Section 1: Relieving Letter PDF Template Selector ─────────────────── */}
                <div className="glass-card premium-shadow rounded-xl p-5 border border-white/60 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-2">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 tracking-normal flex items-center gap-2">
                                <span>Relieving Certificate PDF Template</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase">
                                    Official Format
                                </span>
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Select the format used when generating experience certificates and offboarding relieving letters.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleOpenPreview(data.relieving_letter_template, 'Selected Template')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer shadow-2xs"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>Preview Active Template</span>
                            </button>
                        </div>
                    </div>

                    {/* Template Card Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableTemplates.map((tpl) => {
                            const isSelected = data.relieving_letter_template === tpl.value;
                            return (
                                <div
                                    key={tpl.value}
                                    onClick={() => setData('relieving_letter_template', tpl.value)}
                                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                        isSelected
                                            ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-500/20'
                                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                    isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 bg-white'
                                                }`}>
                                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                </div>
                                                <h4 className="text-xs font-bold text-gray-900">{tpl.label}</h4>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                tpl.badgeColor === 'blue' ? 'bg-blue-100 text-blue-700' :
                                                tpl.badgeColor === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                                                tpl.badgeColor === 'purple' ? 'bg-purple-100 text-purple-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                {tpl.badge}
                                            </span>
                                        </div>

                                        <p className="text-[11px] text-gray-600 leading-relaxed mb-3">
                                            {tpl.description}
                                        </p>

                                        {tpl.features && (
                                            <ul className="space-y-1 mb-4">
                                                {tpl.features.map((feat, idx) => (
                                                    <li key={idx} className="text-[10px] text-gray-500 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                                                        <span>{feat}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-[10px] font-semibold text-gray-400">
                                            {isSelected ? '✓ Active Default' : 'Click to Select'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenPreview(tpl.value, tpl.label);
                                            }}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 rounded-md transition-all cursor-pointer"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            <span>Preview PDF</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Section 2: Automated Notification & Dispatch Settings ──────────── */}
                <div className="glass-card premium-shadow rounded-xl p-5 border border-white/60 bg-white">
                    <div className="pb-3 mb-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900 tracking-normal">
                            Automated Communication &amp; Dispatch
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Configure automatic delivery of relieving documentation and milestone alerts.
                        </p>
                    </div>

                    <div className="space-y-3.5">
                        <div className="flex items-center justify-between p-3.5 bg-gray-50/70 rounded-xl border border-gray-200/70">
                            <div>
                                <label htmlFor="offboarding_send_email" className="text-xs font-bold text-gray-800 block cursor-pointer">
                                    Automatically Email Relieving Certificate &amp; Exit Kit
                                </label>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    When an offboarding request is marked completed, immediately compile the selected PDF letter and dispatch it to the employee's email address.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="offboarding_send_email"
                                    checked={data.offboarding_send_email}
                                    onChange={(e) => setData('offboarding_send_email', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-gray-50/70 rounded-xl border border-gray-200/70">
                            <div>
                                <label htmlFor="offboarding_send_sms" className="text-xs font-bold text-gray-800 block cursor-pointer">
                                    Send SMS Notifications on Status Changes
                                </label>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    Send quick SMS alerts to the employee's phone when resignation is acknowledged, approved, or settlement processed.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="offboarding_send_sms"
                                    checked={data.offboarding_send_sms}
                                    onChange={(e) => setData('offboarding_send_sms', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* ── Section 3: Clearance Policies & Governance ──────────────────────── */}
                <div className="glass-card premium-shadow rounded-xl p-5 border border-white/60 bg-white">
                    <div className="pb-3 mb-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900 tracking-normal">
                            Clearance Policies &amp; Exit Requirements
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Set minimum notice duration, handover prerequisites, and security lockdown rules.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-800 block mb-1">
                                Standard Minimum Notice Period (Days)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="365"
                                value={data.minimum_notice_days}
                                onChange={(e) => setData('minimum_notice_days', parseInt(e.target.value) || 0)}
                                className="w-full text-xs rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">
                                Default notice duration in calendar days. Used to calculate shortfall notice pay if employee exits early.
                            </p>
                            {errors.minimum_notice_days && (
                                <p className="text-[10px] text-rose-500 mt-0.5">{errors.minimum_notice_days}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-800 block mb-1">
                                Auto-Archive &amp; Lock Profile on Completion
                            </label>
                            <div className="flex items-center gap-2 mt-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.auto_archive_employee_on_complete}
                                        onChange={(e) => setData('auto_archive_employee_on_complete', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                                <span className="text-xs text-gray-700 font-medium">
                                    Mark employee status inactive &amp; revoke login access upon final signoff
                                </span>
                            </div>
                        </div>

                        <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200/70">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-gray-800 block">Mandatory IT &amp; Asset Clearance</span>
                                    <span className="text-[11px] text-gray-500 block mt-0.5">Requires confirmation that laptop, badge, keys, and phone are surrendered</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={data.require_asset_clearance}
                                    onChange={(e) => setData('require_asset_clearance', e.target.checked)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200/70">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-gray-800 block">Mandatory Finance &amp; Loan Clearance</span>
                                    <span className="text-[11px] text-gray-500 block mt-0.5">Enforces verification of outstanding salary advances, loans, and credit cards</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={data.require_finance_clearance}
                                    onChange={(e) => setData('require_finance_clearance', e.target.checked)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Section 4: Authorized Signatory Information ─────────────────────── */}
                <div className="glass-card premium-shadow rounded-xl p-5 border border-white/60 bg-white">
                    <div className="pb-3 mb-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900 tracking-normal">
                            Certificate Signatory Details
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Printed on relieving and experience letters under the authorized signature block.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-800 block mb-1">
                                Authorized Signatory Name
                            </label>
                            <input
                                type="text"
                                value={data.relieving_letter_signatory_name}
                                onChange={(e) => setData('relieving_letter_signatory_name', e.target.value)}
                                className="w-full text-xs rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder="e.g. Sarah Jenkins"
                            />
                            {errors.relieving_letter_signatory_name && (
                                <p className="text-[10px] text-rose-500 mt-0.5">{errors.relieving_letter_signatory_name}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-800 block mb-1">
                                Signatory Official Title / Designation
                            </label>
                            <input
                                type="text"
                                value={data.relieving_letter_signatory_title}
                                onChange={(e) => setData('relieving_letter_signatory_title', e.target.value)}
                                className="w-full text-xs rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder="e.g. Vice President — Human Resources"
                            />
                            {errors.relieving_letter_signatory_title && (
                                <p className="text-[10px] text-rose-500 mt-0.5">{errors.relieving_letter_signatory_title}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Submit Action ───────────────────────────────────────────────────── */}
                <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                        {processing ? (
                            <span>Saving Changes...</span>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Save Offboarding Settings</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* ── Live PDF Preview Modal ────────────────────────────────────────────── */}
            {previewModal.open && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full flex flex-col overflow-hidden max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <span className="p-1 rounded bg-indigo-500/20 text-indigo-300">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </span>
                                <div>
                                    <h3 className="text-xs font-bold text-white leading-tight">
                                        Live Certificate Preview: {previewModal.title}
                                    </h3>
                                    <p className="text-[10px] text-slate-400">
                                        Sample rendering using active company branding and mock employee credentials
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={route('settings.offboarding.previewTemplate', { template: previewModal.template })}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-all flex items-center gap-1"
                                >
                                    <span>Open Tab</span>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setPreviewModal({ open: false, template: null, title: '' })}
                                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body / PDF Frame */}
                        <div className="p-3 bg-slate-100 flex-1 overflow-hidden min-h-[550px]">
                            <iframe
                                title="Relieving Letter Sample PDF"
                                src={route('settings.offboarding.previewTemplate', { template: previewModal.template })}
                                className="w-full h-full min-h-[550px] rounded-lg border border-slate-300 bg-white shadow-inner"
                            />
                        </div>

                        {/* Modal Footer */}
                        <div className="px-5 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Format: A4 Portrait • Printable PDF with official QR verification</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setData('relieving_letter_template', previewModal.template);
                                    setPreviewModal({ open: false, template: null, title: '' });
                                }}
                                className="px-3.5 py-1 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer"
                            >
                                Use This Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SettingsLayout>
    );
}
