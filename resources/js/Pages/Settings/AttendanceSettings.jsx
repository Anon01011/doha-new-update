import SettingsLayout from './SettingsLayout';
import { useForm } from '@inertiajs/react';

export default function AttendanceSettings({ settings }) {
    const { data, setData, post, processing, errors } = useForm({
        clock_in_grace_period: settings.clock_in_grace_period || 15,
        late_arrival_threshold: settings.late_arrival_threshold || 30,
        early_departure_threshold: settings.early_departure_threshold || 30,
        auto_clock_out_time: settings.auto_clock_out_time || '23:59',
        max_break_duration: settings.max_break_duration || 60,
        overtime_calculation_method: settings.overtime_calculation_method || 'daily',
        overtime_approval_required: settings.overtime_approval_required || false,
        weekend_days: settings.weekend_days || ['Friday'],
        company_opening_time: settings.company_opening_time || '09:30',
        company_closing_time: settings.company_closing_time || '03:00',
        standard_working_hours: settings.standard_working_hours || 9,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.attendance.update'));
    };

    return (
        <SettingsLayout
            activeTab="attendance"
            title="Attendance Configuration"
            description="Configure clock-in/out rules, overtime calculation, and break policies."
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    {/* Main Settings */}
                    <div className="xl:col-span-2 space-y-5">
                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-primary text-white rounded-lg shadow-lg shadow-indigo-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Timing Rules</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Clock-in Grace Period */}
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">
                                        Grace Period (min)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.clock_in_grace_period}
                                        onChange={(e) => setData('clock_in_grace_period', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal"
                                    />
                                    {errors.clock_in_grace_period && (
                                        <p className="text-[10px] font-normal text-rose-500 ml-1">{errors.clock_in_grace_period}</p>
                                    )}
                                </div>

                                {/* Late Arrival Threshold */}
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">
                                        Late Threshold (min)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.late_arrival_threshold}
                                        onChange={(e) => setData('late_arrival_threshold', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal"
                                    />
                                    {errors.late_arrival_threshold && (
                                        <p className="text-[10px] font-normal text-rose-500 ml-1">{errors.late_arrival_threshold}</p>
                                    )}
                                </div>

                                {/* Early Departure Threshold */}
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">
                                        Early Exit Threshold (min)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.early_departure_threshold}
                                        onChange={(e) => setData('early_departure_threshold', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal"
                                    />
                                    {errors.early_departure_threshold && (
                                        <p className="text-[10px] font-normal text-rose-500 ml-1">{errors.early_departure_threshold}</p>
                                    )}
                                </div>

                                {/* Auto Clock-out Time */}
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">
                                        Auto Clock-out
                                    </label>
                                    <input
                                        type="time"
                                        value={data.auto_clock_out_time}
                                        onChange={(e) => setData('auto_clock_out_time', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal"
                                    />
                                    {errors.auto_clock_out_time && (
                                        <p className="text-[10px] font-normal text-rose-500 ml-1">{errors.auto_clock_out_time}</p>
                                    )}
                                </div>

                                {/* Company Opening Time */}
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">
                                        Company Opening Time
                                    </label>
                                    <input
                                        type="time"
                                        value={data.company_opening_time}
                                        onChange={(e) => setData('company_opening_time', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal"
                                    />
                                    {errors.company_opening_time && (
                                        <p className="text-[10px] font-normal text-rose-500 ml-1">{errors.company_opening_time}</p>
                                    )}
                                </div>

                                {/* Company Closing Time */}
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">
                                        Company Closing Time
                                    </label>
                                    <input
                                        type="time"
                                        value={data.company_closing_time}
                                        onChange={(e) => setData('company_closing_time', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal"
                                    />
                                    {errors.company_closing_time && (
                                        <p className="text-[10px] font-normal text-rose-500 ml-1">{errors.company_closing_time}</p>
                                    )}
                                </div>

                                {/* Standard Working Hours */}
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">
                                        Standard Working Hours (Hrs)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="24"
                                        step="0.5"
                                        value={data.standard_working_hours}
                                        onChange={(e) => setData('standard_working_hours', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal"
                                    />
                                    {errors.standard_working_hours && (
                                        <p className="text-[10px] font-normal text-rose-500 ml-1">{errors.standard_working_hours}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-violet-600 text-white rounded-lg shadow-lg shadow-violet-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Overtime & Breaks</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-normal text-gray-700 ml-1">
                                            Max Break (min)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={data.max_break_duration}
                                            onChange={(e) => setData('max_break_duration', e.target.value)}
                                            className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-normal"
                                        />
                                    </div>

                                    <div className="p-3 bg-violet-50/50 rounded-lg border border-violet-100 flex items-center justify-between">
                                        <label className="text-xs font-normal text-violet-900">Require OT Approval</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('overtime_approval_required', !data.overtime_approval_required)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${data.overtime_approval_required ? 'bg-violet-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.overtime_approval_required ? 'translate-x-4' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">
                                        OT Calculation
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {['hourly', 'daily', 'weekly'].map((method) => (
                                            <button
                                                key={method}
                                                type="button"
                                                onClick={() => setData('overtime_calculation_method', method)}
                                                className={`px-3 py-2 rounded-lg border text-sm font-normal transition-all text-left flex items-center justify-between ${data.overtime_calculation_method === method
                                                    ? 'border-violet-600 bg-violet-50 text-violet-900'
                                                    : 'border-gray-100 bg-gray-50/50 text-gray-500 hover:border-gray-200'
                                                    }`}
                                            >
                                                <span className="capitalize">{method}</span>
                                                {data.overtime_calculation_method === method && (
                                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <h4 className="text-sm font-normal text-gray-900 tracking-normal mb-4">Weekend Days</h4>
                            <div className="grid grid-cols-1 gap-1.5">
                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => {
                                            if (data.weekend_days.includes(day)) {
                                                setData('weekend_days', data.weekend_days.filter(d => d !== day));
                                            } else {
                                                setData('weekend_days', [...data.weekend_days, day]);
                                            }
                                        }}
                                        className={`px-3 py-2 rounded-lg border text-sm font-normal transition-all text-left flex items-center justify-between ${data.weekend_days.includes(day)
                                            ? 'border-rose-600 bg-rose-50 text-rose-900'
                                            : 'border-gray-100 bg-gray-50/50 text-gray-500 hover:border-gray-200'
                                            }`}
                                    >
                                        {day}
                                        {data.weekend_days.includes(day) && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-600 shadow-lg shadow-rose-200"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-lg p-5 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                            <h4 className="text-sm font-normal tracking-normal mb-2 relative z-10">Pro Tip</h4>
                            <p className="text-xs text-indigo-50 leading-relaxed font-normal relative z-10">
                                Setting a reasonable grace period helps reduce minor late arrival flags while maintaining discipline.
                            </p>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full px-5 py-2.5 bg-primary hover:bg-indigo-500 text-white text-sm font-normal rounded-lg transition-all shadow-lg shadow-indigo-900/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Configuration'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </SettingsLayout>
    );
}
