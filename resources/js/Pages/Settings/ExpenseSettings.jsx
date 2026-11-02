import SettingsLayout from './SettingsLayout';
import { useForm } from '@inertiajs/react';

const REIMBURSEMENT_OPTIONS = [
    {
        value: 'payroll',
        label: 'Include in Payroll',
        description: 'Approved expense claims are automatically bundled into the employee\'s next payroll cycle.',
        icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V5a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        color: 'blue',
    },
    {
        value: 'direct_payment',
        label: 'Direct Payment',
        description: 'Finance team processes a direct bank transfer or cash payment outside the payroll cycle.',
        icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        ),
        color: 'emerald',
    },
    {
        value: 'accounts_payable',
        label: 'Accounts Payable',
        description: 'Routed through the accounts-payable team for vendor or third-party settlement workflows.',
        icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
        ),
        color: 'purple',
    },
];

const colorMap = {
    blue: {
        border: 'border-blue-500 bg-blue-50/60',
        icon: 'bg-blue-600 text-white shadow-blue-200',
        dot: 'bg-blue-600',
        ring: 'ring-2 ring-blue-500',
        badge: 'bg-blue-100 text-blue-700',
    },
    emerald: {
        border: 'border-emerald-500 bg-emerald-50/60',
        icon: 'bg-emerald-600 text-white shadow-emerald-200',
        dot: 'bg-emerald-600',
        ring: 'ring-2 ring-emerald-500',
        badge: 'bg-emerald-100 text-emerald-700',
    },
    purple: {
        border: 'border-purple-500 bg-purple-50/60',
        icon: 'bg-purple-600 text-white shadow-purple-200',
        dot: 'bg-purple-600',
        ring: 'ring-2 ring-purple-500',
        badge: 'bg-purple-100 text-purple-700',
    },
};

function Toggle({ checked, onChange, label, description }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
                <p className="text-sm font-normal text-gray-800">{label}</p>
                {description && <p className="text-xs text-gray-400 mt-0.5 font-normal leading-relaxed">{description}</p>}
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
                aria-checked={checked}
                role="switch"
            >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
        </div>
    );
}

export default function ExpenseSettings({ settings }) {
    const { data, setData, post, processing, errors } = useForm({
        default_reimbursement_method: settings.default_reimbursement_method || 'payroll',
        require_finance_approval:     settings.require_finance_approval    ?? true,
        allow_direct_payment:         settings.allow_direct_payment        ?? true,
        allow_payroll_settlement:     settings.allow_payroll_settlement     ?? true,
        policy_violation_auto_flag:   settings.policy_violation_auto_flag  ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.expenses.update'));
    };

    const selected = REIMBURSEMENT_OPTIONS.find(o => o.value === data.default_reimbursement_method);
    const colors = colorMap[selected?.color || 'blue'];

    return (
        <SettingsLayout
            activeTab="expenses"
            title="Expense & Reimbursement Settings"
            description="Configure the default reimbursement method, approval workflow, and policy enforcement for expense claims."
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                    {/* ── Main Form ── */}
                    <div className="xl:col-span-2 space-y-5">

                        {/* Default Reimbursement Method */}
                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-orange-500 text-white rounded-lg shadow-lg shadow-orange-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-normal text-gray-900 tracking-normal">
                                        Default Reimbursement Method
                                    </h3>
                                    <p className="text-[11px] text-gray-400 font-normal mt-0.5">
                                        Applied automatically when a new expense claim is created.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {REIMBURSEMENT_OPTIONS.map((opt) => {
                                    const c = colorMap[opt.color];
                                    const isSelected = data.default_reimbursement_method === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setData('default_reimbursement_method', opt.value)}
                                            className={`relative text-left rounded-xl border-2 p-4 transition-all duration-200 focus:outline-none ${
                                                isSelected
                                                    ? `${c.border} ${c.ring} shadow-md`
                                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                            }`}
                                        >
                                            {isSelected && (
                                                <span className={`absolute top-2.5 right-2.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-normal ${c.badge}`}>
                                                    Default
                                                </span>
                                            )}
                                            <div className={`inline-flex p-2 rounded-lg shadow-lg mb-3 ${c.icon}`}>
                                                {opt.icon}
                                            </div>
                                            <p className="text-sm font-normal text-gray-900 mb-1">{opt.label}</p>
                                            <p className="text-[11px] text-gray-400 leading-relaxed font-normal">{opt.description}</p>
                                        </button>
                                    );
                                })}
                            </div>

                            {errors.default_reimbursement_method && (
                                <p className="mt-2 text-xs text-red-500">{errors.default_reimbursement_method}</p>
                            )}
                        </div>

                        {/* Approval & Policy Options */}
                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-normal text-gray-900 tracking-normal">
                                    Approval &amp; Policy Options
                                </h3>
                            </div>

                            <div className="space-y-4 divide-y divide-gray-100">
                                <div className="pb-4">
                                    <Toggle
                                        checked={!!data.require_finance_approval}
                                        onChange={(v) => setData('require_finance_approval', v)}
                                        label="Require Finance Approval"
                                        description="Claims must pass a finance-team review before reimbursement can be processed."
                                    />
                                </div>
                                <div className="py-4">
                                    <Toggle
                                        checked={!!data.allow_payroll_settlement}
                                        onChange={(v) => setData('allow_payroll_settlement', v)}
                                        label="Allow Payroll Settlement"
                                        description="Finance may choose to bundle reimbursements into the next salary run."
                                    />
                                </div>
                                <div className="py-4">
                                    <Toggle
                                        checked={!!data.allow_direct_payment}
                                        onChange={(v) => setData('allow_direct_payment', v)}
                                        label="Allow Direct Payment"
                                        description="Finance may process immediate bank / cash payments outside of payroll."
                                    />
                                </div>
                                <div className="pt-4">
                                    <Toggle
                                        checked={!!data.policy_violation_auto_flag}
                                        onChange={(v) => setData('policy_violation_auto_flag', v)}
                                        label="Auto-Flag Policy Violations"
                                        description="Automatically detect and flag claims that exceed category limits or appear as duplicates."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="space-y-5">
                        {/* Info card */}
                        <div className={`rounded-xl p-5 text-white shadow-xl relative overflow-hidden ${
                            selected?.color === 'emerald' ? 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-200'
                            : selected?.color === 'purple' ? 'bg-gradient-to-br from-purple-600 to-indigo-700 shadow-purple-200'
                            : 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-200'
                        }`}>
                            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                            <h4 className="text-sm font-normal tracking-normal mb-2 relative z-10">
                                {selected?.label ?? 'Method Info'}
                            </h4>
                            <p className="text-xs text-white/80 leading-relaxed font-normal relative z-10">
                                {selected?.description ?? ''}
                            </p>
                        </div>

                        {/* Summary */}
                        <div className="glass-card premium-shadow rounded-lg p-4 border border-white/40">
                            <h4 className="text-xs font-normal text-gray-700 mb-3 tracking-normal">Current Configuration</h4>
                            <ul className="space-y-2 text-xs text-gray-500 font-normal">
                                <li className="flex items-center justify-between">
                                    <span>Default method</span>
                                    <span className={`px-2 py-0.5 rounded-full font-normal ${colors.badge}`}>
                                        {REIMBURSEMENT_OPTIONS.find(o => o.value === data.default_reimbursement_method)?.label}
                                    </span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span>Finance approval</span>
                                    <span className={data.require_finance_approval ? 'text-green-600' : 'text-gray-400'}>
                                        {data.require_finance_approval ? 'Required' : 'Optional'}
                                    </span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span>Payroll settlement</span>
                                    <span className={data.allow_payroll_settlement ? 'text-green-600' : 'text-gray-400'}>
                                        {data.allow_payroll_settlement ? 'Enabled' : 'Disabled'}
                                    </span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span>Direct payment</span>
                                    <span className={data.allow_direct_payment ? 'text-green-600' : 'text-gray-400'}>
                                        {data.allow_direct_payment ? 'Enabled' : 'Disabled'}
                                    </span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span>Violation auto-flag</span>
                                    <span className={data.policy_violation_auto_flag ? 'text-green-600' : 'text-gray-400'}>
                                        {data.policy_violation_auto_flag ? 'On' : 'Off'}
                                    </span>
                                </li>
                            </ul>
                        </div>

                        <div className="pt-1">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-normal rounded-lg transition-all shadow-lg shadow-orange-900/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Saving...
                                    </>
                                ) : 'Save Expense Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </SettingsLayout>
    );
}

