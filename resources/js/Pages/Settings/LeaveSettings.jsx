import SettingsLayout from './SettingsLayout';
import { useForm } from '@inertiajs/react';

export default function LeaveSettings({ settings }) {
    const { data, setData, post, processing, errors } = useForm({
        leave_accrual_method: settings.leave_accrual_method || 'monthly',
        carry_forward_enabled: settings.carry_forward_enabled || true,
        max_carry_forward_days: settings.max_carry_forward_days || 10,
        leave_approval_workflow: settings.leave_approval_workflow || 'single',
        minimum_notice_period: settings.minimum_notice_period || 3,
        max_consecutive_days: settings.max_consecutive_days || 15,
        negative_balance_allowed: settings.negative_balance_allowed || false,
        probation_leave_eligibility: settings.probation_leave_eligibility || false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.leave.update'));
    };

    return (
        <SettingsLayout
            activeTab="leave"
            title="Leave Management"
            description="Configure leave accrual, carry-forward rules, and approval workflow."
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    {/* Main Form */}
                    <div className="xl:col-span-2 space-y-5">
                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-rose-600 text-white rounded-lg shadow-lg shadow-rose-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Accrual & Policy</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Accrual Method</label>
                                    <select
                                        value={data.leave_accrual_method}
                                        onChange={(e) => setData('leave_accrual_method', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-normal"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Notice Period (days)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.minimum_notice_period}
                                        onChange={(e) => setData('minimum_notice_period', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-normal"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Max Consecutive Days</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.max_consecutive_days}
                                        onChange={(e) => setData('max_consecutive_days', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-normal"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Approval Workflow</label>
                                    <select
                                        value={data.leave_approval_workflow}
                                        onChange={(e) => setData('leave_approval_workflow', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-normal"
                                    >
                                        <option value="single">Single Level</option>
                                        <option value="multi">Multi Level</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-amber-600 text-white rounded-lg shadow-lg shadow-amber-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Carry Forward & Balances</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Enable Carry Forward</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('carry_forward_enabled', !data.carry_forward_enabled)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.carry_forward_enabled ? 'bg-amber-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.carry_forward_enabled ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {data.carry_forward_enabled && (
                                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="text-xs font-normal text-gray-700 ml-1">Max Carry Forward (days)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={data.max_carry_forward_days}
                                                onChange={(e) => setData('max_carry_forward_days', e.target.value)}
                                                className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-normal"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Allow Negative Balance</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('negative_balance_allowed', !data.negative_balance_allowed)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.negative_balance_allowed ? 'bg-rose-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.negative_balance_allowed ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Probation Eligibility</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('probation_leave_eligibility', !data.probation_leave_eligibility)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.probation_leave_eligibility ? 'bg-emerald-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.probation_leave_eligibility ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        <div className="bg-gradient-to-br from-rose-600 to-orange-600 rounded-lg p-5 text-white shadow-xl shadow-rose-200 relative overflow-hidden">
                            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                            <h4 className="text-sm font-normal tracking-normal mb-2 relative z-10">Policy Tip</h4>
                            <p className="text-xs text-rose-50 leading-relaxed font-normal relative z-10">
                                Restricting leave during probation helps ensure new hires are fully integrated before taking time off.
                            </p>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-normal rounded-lg transition-all shadow-lg shadow-rose-900/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {processing ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </SettingsLayout>
    );
}
