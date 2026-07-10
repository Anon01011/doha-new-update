import SettingsLayout from './SettingsLayout';
import { useForm } from '@inertiajs/react';

export default function EmployeeSettings({ settings }) {
    const { data, setData, post, processing, errors } = useForm({
        employee_code_prefix: settings.employee_code_prefix || 'EMP',
        default_probation_months: settings.default_probation_months || 3,
        retirement_age: settings.retirement_age || 60,
        allow_duplicate_mobile: settings.allow_duplicate_mobile || false,
        allow_duplicate_email: settings.allow_duplicate_email || false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.employee.update'));
    };

    return (
        <SettingsLayout
            activeTab="employee"
            title="Employee Configuration"
            description="Manage employee code generation, probation rules, and data integrity policies."
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    {/* Main Form */}
                    <div className="xl:col-span-2 space-y-5">
                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Identity & Lifecycle</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Employee Code Prefix */}
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">
                                        Employee Code Prefix
                                    </label>
                                    <input
                                        type="text"
                                        maxLength="10"
                                        value={data.employee_code_prefix}
                                        onChange={(e) => setData('employee_code_prefix', e.target.value.toUpperCase())}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal"
                                        placeholder="EMP"
                                    />
                                    <p className="text-[10px] text-gray-400 ml-1 italic">Used for auto-generating IDs (e.g. EMP-001)</p>
                                </div>

                                {/* Default Probation */}
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">
                                        Probation Period (Months)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.default_probation_months}
                                        onChange={(e) => setData('default_probation_months', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal"
                                    />
                                </div>

                                {/* Retirement Age */}
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">
                                        Retirement Age
                                    </label>
                                    <input
                                        type="number"
                                        min="18"
                                        value={data.retirement_age}
                                        onChange={(e) => setData('retirement_age', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-rose-600 text-white rounded-lg shadow-lg shadow-rose-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Data Integrity</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                    <label className="text-xs font-normal text-gray-700">Allow Duplicate Mobile</label>
                                    <button
                                        type="button"
                                        onClick={() => setData('allow_duplicate_mobile', !data.allow_duplicate_mobile)}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.allow_duplicate_mobile ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.allow_duplicate_mobile ? 'translate-x-4' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                    <label className="text-xs font-normal text-gray-700">Allow Duplicate Email</label>
                                    <button
                                        type="button"
                                        onClick={() => setData('allow_duplicate_email', !data.allow_duplicate_email)}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.allow_duplicate_email ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.allow_duplicate_email ? 'translate-x-4' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg p-5 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                            <h4 className="text-sm font-normal tracking-normal mb-2 relative z-10">Data Tip</h4>
                            <p className="text-xs text-indigo-50 leading-relaxed font-normal relative z-10">
                                Disallowing duplicate emails and mobile numbers ensures cleaner data and avoids issues during multi-salon transitions.
                            </p>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full px-5 py-2.5 bg-primary hover:bg-indigo-500 text-white text-sm font-normal rounded-lg transition-all shadow-lg shadow-indigo-900/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
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
