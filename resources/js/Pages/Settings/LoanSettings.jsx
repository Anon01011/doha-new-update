import SettingsLayout from './SettingsLayout';
import { useForm } from '@inertiajs/react';

export default function LoanSettings({ settings }) {
    const { data, setData, post, processing } = useForm({
        max_loan_amount: settings.max_loan_amount || 5000,
        maximum_active_loans: settings.maximum_active_loans || 1,
        interest_rate_default: settings.interest_rate_default || 0,
        max_tenure_months: settings.max_tenure_months || 12,
        approval_workflow_level: settings.approval_workflow_level || 1,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.loans.update'));
    };

    return (
        <SettingsLayout
            activeTab="loans"
            title="Loan Configuration"
            description="Manage loan policies, limits, and interest rates."
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    {/* Main Form */}
                    <div className="xl:col-span-2 space-y-5">
                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Loan Limits & Interest</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Maximum Loan Amount</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.max_loan_amount}
                                        onChange={(e) => setData('max_loan_amount', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-normal"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Max Active Loans</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.maximum_active_loans}
                                        onChange={(e) => setData('maximum_active_loans', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-normal"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Default Interest Rate (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={data.interest_rate_default}
                                        onChange={(e) => setData('interest_rate_default', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-normal"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Max Tenure (Months)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.max_tenure_months}
                                        onChange={(e) => setData('max_tenure_months', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-normal"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Approval Workflow</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Levels of Approval</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={data.approval_workflow_level}
                                        onChange={(e) => setData('approval_workflow_level', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                    />
                                    <p className="text-[10px] text-gray-400 ml-1 italic">Number of managers required to approve a loan.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-lg p-5 text-white shadow-xl shadow-emerald-200 relative overflow-hidden">
                            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                            <h4 className="text-sm font-normal tracking-normal mb-2 relative z-10">Loan Tip</h4>
                            <p className="text-xs text-emerald-50 leading-relaxed font-normal relative z-10">
                                Setting a zero interest rate makes the system act as an Interest-Free Advance system, common in many HR policies.
                            </p>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-normal rounded-lg transition-all shadow-lg shadow-emerald-900/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
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
