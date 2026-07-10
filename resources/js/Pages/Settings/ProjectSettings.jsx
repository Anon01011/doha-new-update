import SettingsLayout from './SettingsLayout';
import { useForm } from '@inertiajs/react';

export default function ProjectSettings({ settings }) {
    const { data, setData, post, processing } = useForm({
        default_visibility: settings.default_visibility || 'public',
        budget_tracking_enabled: settings.budget_tracking_enabled || true,
        budget_alert_threshold: settings.budget_alert_threshold || 80,
        milestone_notifications: settings.milestone_notifications || true,
        completion_requires_all_tasks: settings.completion_requires_all_tasks || true,
        project_time_tracking: settings.project_time_tracking || false,
        default_member_role: settings.default_member_role || 'member',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.projects.update'));
    };

    return (
        <SettingsLayout
            activeTab="projects"
            title="Project Configuration"
            description="Configure roles, milestones, and budget tracking."
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    {/* Main Form */}
                    <div className="xl:col-span-2 space-y-5">
                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-primary text-white rounded-lg shadow-lg shadow-blue-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Project Defaults</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Default Visibility</label>
                                    <select
                                        value={data.default_visibility}
                                        onChange={(e) => setData('default_visibility', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                    >
                                        <option value="public">Public</option>
                                        <option value="private">Private</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Default Member Role</label>
                                    <select
                                        value={data.default_member_role}
                                        onChange={(e) => setData('default_member_role', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                    >
                                        <option value="member">Member</option>
                                        <option value="viewer">Viewer</option>
                                        <option value="lead">Lead</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Tracking & Workflow</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Budget Tracking</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('budget_tracking_enabled', !data.budget_tracking_enabled)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.budget_tracking_enabled ? 'bg-emerald-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.budget_tracking_enabled ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {data.budget_tracking_enabled && (
                                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="text-xs font-normal text-gray-700 ml-1">Alert Threshold (%)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={data.budget_alert_threshold}
                                                onChange={(e) => setData('budget_alert_threshold', e.target.value)}
                                                className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-normal"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Milestone Alerts</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('milestone_notifications', !data.milestone_notifications)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.milestone_notifications ? 'bg-blue-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.milestone_notifications ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Strict Completion</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('completion_requires_all_tasks', !data.completion_requires_all_tasks)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.completion_requires_all_tasks ? 'bg-indigo-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.completion_requires_all_tasks ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Time Tracking</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('project_time_tracking', !data.project_time_tracking)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.project_time_tracking ? 'bg-amber-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.project_time_tracking ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg p-5 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
                            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                            <h4 className="text-sm font-normal tracking-normal mb-2 relative z-10">Project Tip</h4>
                            <p className="text-xs text-blue-50 leading-relaxed font-normal relative z-10">
                                Strict completion ensures that no loose ends are left before a project is marked as finished.
                            </p>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full px-5 py-2.5 bg-primary hover:bg-blue-500 text-white text-sm font-normal rounded-lg transition-all shadow-lg shadow-blue-900/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
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
