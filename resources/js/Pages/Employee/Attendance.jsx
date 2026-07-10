import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

// Format hours: remove trailing zeros (e.g. 16.000 → 16, 9.5 → 9.5)
const fmt = (val) => {
    const n = parseFloat(val);
    if (isNaN(n) || n === 0) return '0';
    return n % 1 === 0 ? String(Math.round(n)) : parseFloat(n.toFixed(2)).toString();
};

function parsePunches(punches = [], normalHours = 8) {
    if (!punches || punches.length === 0) return null;

    const sessions = [];
    const breaks = [];
    let totalWorkMinutes = 0;
    let totalBreakMinutes = 0;

    let currentIn = null;
    let currentOut = null;

    // Sort punches chronologically just in case
    const sortedPunches = [...punches].sort((a, b) => new Date(a.time) - new Date(b.time));

    sortedPunches.forEach((punch) => {
        const time = new Date(punch.time);
        const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        if (punch.type === 'in') {
            currentIn = time;
            if (currentOut) {
                const diffMs = time - currentOut;
                const diffMins = Math.round(diffMs / 1000 / 60);
                breaks.push({
                    start: currentOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    end: timeStr,
                    duration: diffMins
                });
                totalBreakMinutes += diffMins;
                currentOut = null;
            }
        } else if (punch.type === 'out') {
            currentOut = time;
            if (currentIn) {
                const diffMs = time - currentIn;
                const diffMins = Math.round(diffMs / 1000 / 60);
                sessions.push({
                    start: currentIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    end: timeStr,
                    duration: (diffMins / 60).toFixed(2)
                });
                totalWorkMinutes += diffMins;
                currentIn = null;
            }
        }
    });

    const workedHours = (totalWorkMinutes / 60).toFixed(2);
    const ot = parseFloat(workedHours) > normalHours ? (parseFloat(workedHours) - normalHours).toFixed(2) : '0.00';

    return {
        sessions,
        breaks,
        totalBreakMinutes,
        workedHours,
        ot
    };
}

export default function Attendance({ attendances = [], todayAttendance = null, todayRoster = null, userRole = 'employee', settings }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedBreakup, setSelectedBreakup] = useState(null);
    const handleShowBreakup = (employeeName, date, attendance) => {
        setSelectedBreakup({ employee: { name: employeeName }, date, attendance });
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const shiftEndTime = todayRoster?.shift_end_time ? new Date(todayRoster.shift_end_time) : null;
    const isOvertime = shiftEndTime && currentTime > shiftEndTime;

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleClockIn = () => {
        setIsProcessing(true);
        router.post(route('employee-attendances.clockIn'), {}, {
            onFinish: () => setIsProcessing(false)
        });
    };

    const handleClockOut = () => {
        setIsProcessing(true);
        router.post(route('employee-attendances.clockOut'), {}, {
            onFinish: () => setIsProcessing(false)
        });
    };

    const handleStartBreak = () => {
        setIsProcessing(true);
        router.post(route('employee-attendances.startBreak'), {}, {
            onFinish: () => setIsProcessing(false)
        });
    };

    const handleEndBreak = () => {
        setIsProcessing(true);
        router.post(route('employee-attendances.endBreak'), {}, {
            onFinish: () => setIsProcessing(false)
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return 'bg-green-100 text-green-700 border-green-200';
            case 'Absent': return 'bg-red-100 text-red-700 border-red-200';
            case 'Late': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Half Day': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-white">My Attendance</h2>}>
            <Head title="My Attendance" />

            <div className="w-full p-4 space-y-6">
                {/* Clock Section */}
                <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-lg shadow-2xl p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="mb-2 text-blue-100 font-normal tracking-normal uppercase text-sm">
                            {formatDate(currentTime)}
                        </div>
                        <div className="text-6xl md:text-8xl font-normal tracking-normal mb-4 drop-shadow-lg font-mono">
                            {formatTime(currentTime)}
                        </div>

                        {settings?.grace_period_minutes && !todayAttendance?.from_time && (
                            <div className="mb-4 text-xs font-normal bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                Grace Period: <span className="font-normal">{settings.grace_period_minutes} minutes</span>
                            </div>
                        )}

                        {isOvertime && !todayAttendance?.to_time && (
                            <div className="mb-6 flex items-center gap-2 bg-red-500/30 backdrop-blur-md px-4 py-2 rounded-full border border-red-400/50 animate-pulse">
                                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                <span className="text-xs font-normal uppercase tracking-normal text-red-100">Overtime Active</span>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
                            {!todayAttendance?.from_time ? (
                                <button
                                    onClick={handleClockIn}
                                    disabled={isProcessing}
                                    className="flex-1 bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-normal text-lg transition-all shadow-xl hover:shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    Clock In
                                </button>
                            ) : !todayAttendance?.to_time ? (
                                <>
                                    {todayAttendance?.current_break_start ? (
                                        <button
                                            onClick={handleEndBreak}
                                            disabled={isProcessing}
                                            className="flex-1 bg-orange-500 text-white hover:bg-orange-600 px-8 py-4 rounded-lg font-normal text-lg transition-all shadow-xl hover:shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            End Break
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleStartBreak}
                                            disabled={isProcessing}
                                            className="flex-1 bg-blue-500 text-white hover:bg-primary px-8 py-4 rounded-lg font-normal text-lg transition-all shadow-xl hover:shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Take Break
                                        </button>
                                    )}
                                    <button
                                        onClick={handleClockOut}
                                        disabled={isProcessing || todayAttendance?.current_break_start}
                                        className="flex-1 bg-red-500 text-white hover:bg-red-600 px-8 py-4 rounded-lg font-normal text-lg transition-all shadow-xl hover:shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        <div className="w-3 h-3 bg-white rounded-full"></div>
                                        Clock Out
                                    </button>
                                </>
                            ) : (
                                <div className="flex-1 bg-white/20 backdrop-blur-md border border-white/30 px-8 py-4 rounded-lg font-normal text-lg text-white flex items-center justify-center gap-3">
                                    <svg className="w-6 h-6 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Shift Completed
                                </div>
                            )}
                        </div>

                        {todayAttendance?.from_time && (
                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/10">
                                    <div className="text-blue-200 text-[10px] uppercase font-normal tracking-normal mb-1">Clocked In</div>
                                    <div className="text-xl font-normal">{todayAttendance.from_time}</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/10">
                                    <div className="text-blue-200 text-[10px] uppercase font-normal tracking-normal mb-1">Break Time</div>
                                    <div className="text-xl font-normal">{todayAttendance.total_break_minutes || 0}m</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/10">
                                    <div className="text-blue-200 text-[10px] uppercase font-normal tracking-normal mb-1">Working Hours</div>
                                    <div className="text-xl font-normal">{todayAttendance.hours_worked || '--'}h</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* History Section */}
                <div className="bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="text-xl font-normal text-gray-900 flex items-center gap-2">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Recent Attendance History
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-normal font-normal">
                                    <th className="px-8 py-4">Date</th>
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-8 py-4">Clock In</th>
                                    <th className="px-8 py-4">Clock Out</th>
                                    <th className="px-8 py-4">Break</th>
                                    <th className="px-8 py-4">Total Hours</th>
                                    <th className="px-8 py-4">Overtime</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {attendances.length > 0 ? (
                                    attendances.map((att, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="text-sm font-normal text-gray-900">{new Date(att.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                <div className="text-[10px] text-gray-400 uppercase font-normal">{new Date(att.date).toLocaleDateString('en-US', { weekday: 'long' })}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-normal uppercase border ${getStatusColor(att.attendance)}`}>
                                                    {att.attendance}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-normal text-gray-600">{att.from_time || '--'}</td>
                                            <td className="px-8 py-5 text-sm font-normal text-gray-600">{att.to_time || '--'}</td>
                                            <td className="px-8 py-5">
                                                <div className="text-sm font-normal text-gray-900">{att.total_break_minutes || 0}m</div>
                                                {att.break_history && att.break_history.length > 0 && (
                                                    <div className="text-[10px] text-gray-400">{att.break_history.length} breaks</div>
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                {att.hours_worked > 0 ? (() => {
                                                    const worked = parseFloat(att.hours_worked);
                                                    const std = parseFloat(settings?.standard_working_hours || 9);
                                                    const otHours = worked > std ? fmt(worked - std) : 0;
                                                    const isOT = worked > std;
                                                    const isUnder = worked < std;
                                                    const colorClass = isUnder
                                                        ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                                                        : isOT
                                                            ? 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'
                                                            : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100';
                                                    return (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleShowBreakup('Me', att.date, att)}
                                                            className={`flex flex-col items-center px-3 py-1.5 rounded-lg border transition-all duration-200 leading-tight ${colorClass}`}
                                                            title={isOT ? `Worked ${fmt(worked)}h — ${otHours}h overtime. Click for details.` : `Worked ${fmt(worked)}h. Click for details.`}
                                                        >
                                                            <span className="text-sm font-bold">{fmt(worked)}h</span>
                                                            {isOT && (
                                                                <span className="text-[9px] font-normal text-orange-500 leading-none">▲ {otHours}h OT</span>
                                                            )}
                                                        </button>
                                                    );
                                                })() : (
                                                    <span className="text-sm font-normal text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                {parseFloat(att.ot || 0) > 0 ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-orange-500">{fmt(att.ot)}h OT</span>
                                                        <span className="text-[10px] text-orange-400 font-normal">overtime</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-normal text-gray-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                    </svg>
                                                </div>
                                                <p className="text-gray-500 font-normal">No attendance records found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {selectedBreakup && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">Attendance Breakup</h3>
                                <p className="text-[10px] text-slate-400 uppercase mt-1 tracking-normal font-normal">
                                    {new Date(selectedBreakup.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedBreakup(null)}
                                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-center">
                                    <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-1">Worked Hours</p>
                                    <p className={`text-lg font-bold ${parseFloat(selectedBreakup.attendance.hours_worked || 0) < parseFloat(settings?.standard_working_hours || 9)
                                            ? 'text-rose-600'
                                            : 'text-emerald-600'
                                        }`}>{selectedBreakup.attendance.hours_worked || '0.00'}h</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-center">
                                    <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-1">Break Time</p>
                                    <p className="text-lg font-semibold text-amber-600">{selectedBreakup.attendance.total_break_minutes || 0}m</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-center">
                                    <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-1">Overtime</p>
                                    <p className={`text-lg font-bold ${parseFloat(selectedBreakup.attendance.ot || 0) > 0
                                            ? 'text-orange-500 font-bold'
                                            : 'text-slate-400'
                                        }`}>{selectedBreakup.attendance.ot || '0.00'}h</p>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-normal">Session Timeline</h4>
                                {(() => {
                                    const parsed = parsePunches(selectedBreakup.attendance.punches, selectedBreakup.attendance.normal_hours || parseFloat(settings?.standard_working_hours || 9));
                                    if (!parsed || parsed.sessions.length === 0) {
                                        return (
                                            <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 italic">
                                                No detailed punch records available. Showing first clock-in/out:
                                                <div className="mt-2 font-semibold text-slate-700 not-italic">
                                                    IN: {selectedBreakup.attendance.from_time || '--'} | OUT: {selectedBreakup.attendance.to_time || '--'}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="relative border-l-2 border-slate-100 pl-6 ml-3 space-y-6">
                                            {parsed.sessions.map((sess, idx) => {
                                                const breakAfter = parsed.breaks[idx];
                                                return (
                                                    <div key={idx} className="relative">
                                                        {/* Icon Dot */}
                                                        <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white shadow-sm ring-1 ring-slate-100"></div>
                                                        <div>
                                                            <p className="text-xs font-medium text-slate-800">
                                                                Session {idx + 1}: <span className="font-semibold text-indigo-600">{sess.start} — {sess.end}</span>
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">Duration: {sess.duration} hours</p>
                                                        </div>

                                                        {breakAfter && (
                                                            <div className="mt-3 py-1.5 px-3 bg-amber-50/50 border border-amber-100/50 rounded-lg flex items-center justify-between max-w-sm">
                                                                <span className="text-[10px] text-amber-700 font-medium uppercase tracking-normal">Break Duration</span>
                                                                <span className="text-[10px] text-amber-800 font-semibold">{breakAfter.duration} mins ({breakAfter.start} — {breakAfter.end})</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end font-normal">
                            <button
                                type="button"
                                onClick={() => setSelectedBreakup(null)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-normal hover:bg-slate-50 transition-all uppercase tracking-normal"
                            >
                                Close Breakup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
