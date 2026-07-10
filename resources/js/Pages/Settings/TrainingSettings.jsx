import SettingsLayout from './SettingsLayout';
import { useForm } from '@inertiajs/react';

export default function TrainingSettings({ settings }) {
    const { data, setData, post, processing } = useForm({
        certificate_auto_generation: settings.certificate_auto_generation || true,
        minimum_attendance_percentage: settings.minimum_attendance_percentage || 80,
        evaluation_required: settings.evaluation_required || true,
        passing_score_percentage: settings.passing_score_percentage || 70,
        certificate_validity_months: settings.certificate_validity_months || 12,
        expiry_reminder_days: settings.expiry_reminder_days || 30,
        assignment_notification: settings.assignment_notification || true,
        session_reminder_hours: settings.session_reminder_hours || 24,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.training.update'));
    };

    return (
        <SettingsLayout
            activeTab="training"
            title="Training Configuration"
            description="Configure certificates, evaluations, and completion rules."
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    {/* Main Form */}
                    <div className="xl:col-span-2 space-y-5">
                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-violet-600 text-white rounded-lg shadow-lg shadow-violet-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Completion Criteria</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Min Attendance (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={data.minimum_attendance_percentage}
                                        onChange={(e) => setData('minimum_attendance_percentage', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-normal"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Passing Score (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={data.passing_score_percentage}
                                        onChange={(e) => setData('passing_score_percentage', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-normal"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Certificate Validity (mo)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.certificate_validity_months}
                                        onChange={(e) => setData('certificate_validity_months', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-normal"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Expiry Reminder (days)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.expiry_reminder_days}
                                        onChange={(e) => setData('expiry_reminder_days', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-normal"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-primary text-white rounded-lg shadow-lg shadow-indigo-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Notifications & Automation</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Auto-Certificates</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('certificate_auto_generation', !data.certificate_auto_generation)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.certificate_auto_generation ? 'bg-violet-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.certificate_auto_generation ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Require Evaluation</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('evaluation_required', !data.evaluation_required)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.evaluation_required ? 'bg-indigo-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.evaluation_required ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Assignment Alerts</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('assignment_notification', !data.assignment_notification)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.assignment_notification ? 'bg-blue-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.assignment_notification ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-normal text-gray-700 ml-1">Session Reminder (hrs)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={data.session_reminder_hours}
                                            onChange={(e) => setData('session_reminder_hours', e.target.value)}
                                            className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-lg p-5 text-white shadow-xl shadow-violet-200 relative overflow-hidden">
                            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                            <h4 className="text-sm font-normal tracking-normal mb-2 relative z-10">Training Tip</h4>
                            <p className="text-xs text-violet-50 leading-relaxed font-normal relative z-10">
                                Setting a minimum attendance ensures that employees are truly engaged with the material before certification.
                            </p>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-normal rounded-lg transition-all shadow-lg shadow-violet-900/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
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
