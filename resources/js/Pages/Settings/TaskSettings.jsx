import SettingsLayout from './SettingsLayout';
import { useForm } from '@inertiajs/react';

export default function TaskSettings({ settings }) {
    const { data, setData, post, processing } = useForm({
        default_task_priority: settings.default_task_priority || 'medium',
        auto_assignment_enabled: settings.auto_assignment_enabled || false,
        task_overdue_notification: settings.task_overdue_notification || true,
        reminder_days_before_due: settings.reminder_days_before_due || 2,
        allow_task_rejection: settings.allow_task_rejection || true,
        require_completion_notes: settings.require_completion_notes || false,
        time_tracking_mandatory: settings.time_tracking_mandatory || false,
        subtask_inherit_priority: settings.subtask_inherit_priority || true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.tasks.update'));
    };

    return (
        <SettingsLayout
            activeTab="tasks"
            title="Task Configuration"
            description="Configure priorities, assignments, and notifications."
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    {/* Main Form */}
                    <div className="xl:col-span-2 space-y-5">
                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-primary text-white rounded-lg shadow-lg shadow-indigo-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Task Defaults</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Default Priority</label>
                                    <select
                                        value={data.default_task_priority}
                                        onChange={(e) => setData('default_task_priority', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Reminder (days before)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.reminder_days_before_due}
                                        onChange={(e) => setData('reminder_days_before_due', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-primary text-white rounded-lg shadow-lg shadow-blue-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Workflow Rules</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Auto-Assignment</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('auto_assignment_enabled', !data.auto_assignment_enabled)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.auto_assignment_enabled ? 'bg-indigo-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.auto_assignment_enabled ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Overdue Alerts</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('task_overdue_notification', !data.task_overdue_notification)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.task_overdue_notification ? 'bg-blue-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.task_overdue_notification ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Allow Rejection</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('allow_task_rejection', !data.allow_task_rejection)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.allow_task_rejection ? 'bg-rose-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.allow_task_rejection ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Completion Notes</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('require_completion_notes', !data.require_completion_notes)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.require_completion_notes ? 'bg-emerald-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.require_completion_notes ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Mandatory Tracking</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('time_tracking_mandatory', !data.time_tracking_mandatory)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.time_tracking_mandatory ? 'bg-amber-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.time_tracking_mandatory ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-gray-700">Inherit Priority</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('subtask_inherit_priority', !data.subtask_inherit_priority)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.subtask_inherit_priority ? 'bg-violet-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.subtask_inherit_priority ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-lg p-5 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                            <h4 className="text-sm font-normal tracking-normal mb-2 relative z-10">Task Tip</h4>
                            <p className="text-xs text-indigo-50 leading-relaxed font-normal relative z-10">
                                Mandatory time tracking helps in accurate project costing and resource allocation.
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
