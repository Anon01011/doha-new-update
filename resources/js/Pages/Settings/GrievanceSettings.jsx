import SettingsLayout from './SettingsLayout';
import { useForm } from '@inertiajs/react';

export default function GrievanceSettings({ settings }) {
    const { data, setData, post, processing } = useForm({
        response_sla_hours: settings.response_sla_hours || 48,
        escalation_enabled: settings.escalation_enabled || true,
        escalation_after_hours: settings.escalation_after_hours || 72,
        anonymous_submission_allowed: settings.anonymous_submission_allowed || true,
        require_evidence_attachment: settings.require_evidence_attachment || false,
        auto_close_after_days: settings.auto_close_after_days || 30,
        notify_on_status_change: settings.notify_on_status_change || true,
        warning_letter_types: settings.warning_letter_types || ['Warning', 'Strict Warning', 'Show Cause', 'Termination'],
        grievance_categories: settings.grievance_categories || ['Harassment', 'Pay & Benefits', 'Work Conditions', 'Discrimination', 'Interpersonal Conflict', 'Other'],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.grievances.update'));
    };

    return (
        <SettingsLayout
            activeTab="grievance"
            title="Grievance Configuration"
            description="Configure SLA, escalation rules, and privacy options."
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    {/* Main Form */}
                    <div className="xl:col-span-2 space-y-5">
                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-rose-600 text-white rounded-lg shadow-lg shadow-rose-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">SLA & Escalation</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Response SLA (hrs)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.response_sla_hours}
                                        onChange={(e) => setData('response_sla_hours', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-normal"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Escalation After (hrs)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.escalation_after_hours}
                                        onChange={(e) => setData('escalation_after_hours', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-normal"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Auto-close (days)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.auto_close_after_days}
                                        onChange={(e) => setData('auto_close_after_days', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-normal"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-primary text-white rounded-lg shadow-lg shadow-indigo-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Privacy & Rules</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Auto Escalation</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('escalation_enabled', !data.escalation_enabled)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.escalation_enabled ? 'bg-rose-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.escalation_enabled ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Anonymous Submission</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('anonymous_submission_allowed', !data.anonymous_submission_allowed)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.anonymous_submission_allowed ? 'bg-indigo-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.anonymous_submission_allowed ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Require Evidence</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('require_evidence_attachment', !data.require_evidence_attachment)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.require_evidence_attachment ? 'bg-blue-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.require_evidence_attachment ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Status Notifications</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('notify_on_status_change', !data.notify_on_status_change)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.notify_on_status_change ? 'bg-emerald-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.notify_on_status_change ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-2 space-y-5">
                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-amber-500 text-white rounded-lg shadow-lg shadow-amber-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Warning Letter Types</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-3">Define the types of warning letters available to issuing.</p>
                                    <div className="space-y-2">
                                        {data.warning_letter_types.map((type, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={type}
                                                    onChange={(e) => {
                                                        const newTypes = [...data.warning_letter_types];
                                                        newTypes[index] = e.target.value;
                                                        setData('warning_letter_types', newTypes);
                                                    }}
                                                    placeholder="e.g. Verbal Warning"
                                                    className="flex-1 rounded-lg border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-normal"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newTypes = data.warning_letter_types.filter((_, i) => i !== index);
                                                        setData('warning_letter_types', newTypes);
                                                    }}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Remove"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setData('warning_letter_types', [...data.warning_letter_types, ''])}
                                        className="mt-3 px-3 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs font-normal transition-colors flex items-center gap-2"
                                    >
                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Warning Type
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-2 space-y-5">
                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-fuchsia-600 text-white rounded-lg shadow-lg shadow-fuchsia-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Grievance Categories</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-3">Define categories for grievance submission.</p>
                                    <div className="space-y-2">
                                        {data.grievance_categories.map((category, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={category}
                                                    onChange={(e) => {
                                                        const newCategories = [...data.grievance_categories];
                                                        newCategories[index] = e.target.value;
                                                        setData('grievance_categories', newCategories);
                                                    }}
                                                    placeholder="e.g. Harassment"
                                                    className="flex-1 rounded-lg border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 font-normal"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newCategories = data.grievance_categories.filter((_, i) => i !== index);
                                                        setData('grievance_categories', newCategories);
                                                    }}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Remove"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setData('grievance_categories', [...data.grievance_categories, ''])}
                                        className="mt-3 px-3 py-2 bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-100 rounded-lg text-xs font-normal transition-colors flex items-center gap-2"
                                    >
                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Category
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        <div className="bg-gradient-to-br from-rose-600 to-indigo-700 rounded-lg p-5 text-white shadow-xl shadow-rose-200 relative overflow-hidden">
                            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                            <h4 className="text-sm font-normal tracking-normal mb-2 relative z-10">Grievance Tip</h4>
                            <p className="text-xs text-rose-50 leading-relaxed font-normal relative z-10">
                                Anonymous submissions can help employees feel safer when reporting sensitive issues.
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
