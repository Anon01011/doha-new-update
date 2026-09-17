import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import React, { useMemo } from 'react';
import {
    FiArrowLeft, FiMessageSquare, FiUser, FiCalendar, FiBriefcase,
    FiStar, FiThumbsUp, FiThumbsDown, FiCheckCircle, FiSave, FiAlertCircle,
    FiFileText, FiAward, FiCheck, FiMapPin, FiShield
} from 'react-icons/fi';

const RATING_CATEGORIES = [
    {
        key: 'job_satisfaction_rating',
        label: 'Overall Job Satisfaction',
        desc: 'Role responsibilities, day-to-day engagement, and overall sense of accomplishment'
    },
    {
        key: 'management_rating',
        label: 'Management & Leadership',
        desc: 'Support, clear communication, guidance, and fairness from salon leadership'
    },
    {
        key: 'work_environment_rating',
        label: 'Work Culture & Environment',
        desc: 'Team camaraderie, workplace respect, safety, and work-life balance'
    },
    {
        key: 'compensation_rating',
        label: 'Compensation & Benefits',
        desc: 'Competitive salary, commissions, incentives, tips, and benefits fairness'
    },
    {
        key: 'growth_opportunity_rating',
        label: 'Career Growth & Skill Development',
        desc: 'Opportunities for advancement, hair/beauty masterclasses, and mentoring'
    },
];

const RATING_LABELS = {
    1: { text: 'Poor', color: 'text-rose-600 bg-rose-50 border-rose-200' },
    2: { text: 'Fair', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    3: { text: 'Satisfactory', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    4: { text: 'Very Good', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    5: { text: 'Outstanding', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
};

function StarRating({ value, onChange, disabled = false }) {
    const [hover, setHover] = React.useState(0);
    const score = hover || value || 0;
    const currentLabel = RATING_LABELS[score];

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(star)}
                        onMouseEnter={() => !disabled && setHover(star)}
                        onMouseLeave={() => !disabled && setHover(0)}
                        className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                            star <= score
                                ? 'text-amber-400 bg-amber-50 hover:bg-amber-100 scale-105'
                                : 'text-slate-300 hover:text-slate-400 hover:bg-slate-50'
                        } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                        <FiStar className={`w-5 h-5 sm:w-6 sm:h-6 ${star <= score ? 'fill-amber-400' : ''}`} />
                    </button>
                ))}
            </div>
            {currentLabel && (
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ml-1 ${currentLabel.color}`}>
                    {score}/5 — {currentLabel.text}
                </span>
            )}
        </div>
    );
}

export default function ExitInterview({ offboarding, exitInterview = null }) {
    const isCompleted = offboarding.status === 'completed' || (exitInterview && exitInterview.conducted_at);

    const { data, setData, post, processing, errors } = useForm({
        reason_for_leaving:        exitInterview?.reason_for_leaving || '',
        job_satisfaction_rating:   exitInterview?.job_satisfaction_rating || 3,
        management_rating:         exitInterview?.management_rating || 3,
        work_environment_rating:   exitInterview?.work_environment_rating || 3,
        compensation_rating:       exitInterview?.compensation_rating || 3,
        growth_opportunity_rating: exitInterview?.growth_opportunity_rating || 3,
        best_part_of_job:          exitInterview?.best_part_of_job || '',
        improvement_suggestions:   exitInterview?.improvement_suggestions || '',
        additional_comments:       exitInterview?.additional_comments || '',
        rehire_eligible:           exitInterview ? Boolean(exitInterview.rehire_eligible) : true,
    });

    const averageRating = useMemo(() => {
        const scores = [
            data.job_satisfaction_rating,
            data.management_rating,
            data.work_environment_rating,
            data.compensation_rating,
            data.growth_opportunity_rating,
        ].filter(Boolean);
        if (scores.length === 0) return 0;
        return (scores.reduce((a, b) => a + Number(b), 0) / scores.length).toFixed(1);
    }, [data]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('offboarding.exit-interview.store', offboarding.request_number || offboarding.id));
    };

    const targetRoute = offboarding.request_number || offboarding.id;

    return (
        <AuthenticatedLayout>
            <Head title={`Exit Interview — ${offboarding.employee?.name}`} />

            {/* In-Page Full Width Header */}
            <div className="w-full bg-white border-b border-slate-100 px-3 sm:px-6 lg:px-8 py-3.5 sm:py-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                        <Link
                            href={route('offboarding.show', targetRoute)}
                            className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800 shrink-0"
                            title="Back to Offboarding Request"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                                    Exit Interview
                                </h1>
                                <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md">
                                    {offboarding.request_number || `REQ-${offboarding.id}`}
                                </span>
                                {isCompleted && (
                                    <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Recorded & Completed
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                                Capture departing employee feedback, dimensional satisfaction metrics, and organizational insights
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link
                            href={route('offboarding.show', targetRoute)}
                            className="w-full sm:w-auto text-center px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all shadow-xs"
                        >
                            View Clearance Checklist
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content Area - Full Width */}
            <div className="w-full p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">

                {/* Employee Separation Details Banner */}
                <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs p-4 sm:p-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
                                <FiUser className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold tracking-wider truncate">Employee</p>
                                <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{offboarding.employee?.name}</p>
                                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">{offboarding.employee?.employee_code}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
                                <FiBriefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold tracking-wider truncate">Department & Role</p>
                                <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{offboarding.employee?.department?.name || 'Department'}</p>
                                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">{offboarding.employee?.designation || 'Staff'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
                                <FiCalendar className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold tracking-wider truncate">Last Working Day</p>
                                <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                    {offboarding.proposed_last_working_day
                                        ? new Date(offboarding.proposed_last_working_day).toLocaleDateString('en-IN')
                                        : '—'}
                                </p>
                                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">{offboarding.notice_period_days || 0} days notice</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center shrink-0">
                                <FiMapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold tracking-wider truncate">Salon / Branch</p>
                                <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{offboarding.employee?.company?.name || 'Main Salon'}</p>
                                <p className="text-[10px] sm:text-[11px] text-rose-600 font-medium capitalize truncate">
                                    {offboarding.separation_reason?.replace(/_/g, ' ') || 'Resignation'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">

                    {/* 2-Column Responsive Form Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* Left Column (5 cols): Key Dimensional Ratings & Rehire Eligibility */}
                        <div className="lg:col-span-5 space-y-6">

                            {/* Ratings Card */}
                            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs p-5 sm:p-6 space-y-5">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <FiStar className="text-amber-500 w-4 h-4" /> Satisfaction Ratings
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Rate experience on a scale of 1 (Poor) to 5 (Outstanding)
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Average</span>
                                        <span className="text-base font-bold text-amber-500">{averageRating} / 5.0</span>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    {RATING_CATEGORIES.map((cat) => (
                                        <div key={cat.key} className="space-y-1.5 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">{cat.label}</p>
                                                <p className="text-[11px] text-slate-400">{cat.desc}</p>
                                            </div>
                                            <div className="pt-1">
                                                <StarRating
                                                    value={data[cat.key]}
                                                    onChange={(val) => setData(cat.key, val)}
                                                    disabled={isCompleted}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Retention & Rehire Assessment Card */}
                            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs p-5 sm:p-6 space-y-4">
                                <div className="border-b border-slate-100 pb-3">
                                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <FiShield className="text-emerald-500 w-4 h-4" /> Rehire Eligibility
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        HR & Management assessment for future re-employment
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2.5">
                                    <p className="text-xs font-semibold text-slate-800">
                                        Is this employee eligible for rehire in future openings?
                                    </p>
                                    <div className="flex items-center gap-3 pt-1">
                                        <button
                                            type="button"
                                            disabled={isCompleted}
                                            onClick={() => setData('rehire_eligible', true)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                                data.rehire_eligible === true
                                                    ? 'bg-emerald-600 text-white shadow-xs'
                                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            <FiCheckCircle className="w-4 h-4" /> Eligible for Rehire
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isCompleted}
                                            onClick={() => setData('rehire_eligible', false)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                                data.rehire_eligible === false
                                                    ? 'bg-rose-600 text-white shadow-xs'
                                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            <FiAlertCircle className="w-4 h-4" /> Not Eligible
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column (7 cols): Qualitative Exit Feedback & HR Notes */}
                        <div className="lg:col-span-7 space-y-6">

                            {/* Qualitative Feedback Card */}
                            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs p-5 sm:p-6 space-y-5">
                                <div className="border-b border-slate-100 pb-3">
                                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <FiMessageSquare className="text-blue-500 w-4 h-4" /> Qualitative Feedback & Insights
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Detailed commentary to understand reasons and improve team retention
                                    </p>
                                </div>

                                <div className="space-y-4 text-xs">
                                    <div>
                                        <label className="block font-bold text-slate-800 mb-1.5">
                                            Primary Reasons for Leaving
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={data.reason_for_leaving}
                                            onChange={(e) => setData('reason_for_leaving', e.target.value)}
                                            placeholder="Explain what factors contributed most to the decision to leave (e.g. better offer, relocation, higher pay, career change)..."
                                            disabled={isCompleted}
                                            className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-rose-400 focus:border-rose-400 transition-all outline-none"
                                        />
                                        {errors.reason_for_leaving && <p className="text-rose-600 text-[11px] mt-1">{errors.reason_for_leaving}</p>}
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-800 mb-1.5">
                                            What did you value most during your tenure?
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={data.best_part_of_job}
                                            onChange={(e) => setData('best_part_of_job', e.target.value)}
                                            placeholder="Positive highlights, team members, supportive managers, learning experiences, client appreciation..."
                                            disabled={isCompleted}
                                            className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-rose-400 focus:border-rose-400 transition-all outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-800 mb-1.5">
                                            Recommendations & Suggestions for Organizational Improvement
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={data.improvement_suggestions}
                                            onChange={(e) => setData('improvement_suggestions', e.target.value)}
                                            placeholder="What could the salon management improve? (e.g. shift schedules, inventory tools, training programs, incentive structure)..."
                                            disabled={isCompleted}
                                            className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-rose-400 focus:border-rose-400 transition-all outline-none"
                                        />
                                    </div>

                                    <div className="pt-2 border-t border-slate-100">
                                        <label className="block font-bold text-slate-800 mb-1.5">
                                            Confidential HR / Internal Notes & Remarks
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={data.additional_comments}
                                            onChange={(e) => setData('additional_comments', e.target.value)}
                                            placeholder="Internal remarks for HR records, handover observations, retention notes..."
                                            disabled={isCompleted}
                                            className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-rose-400 focus:border-rose-400 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Floating/Sticky Action Bar */}
                    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
                        <Link
                            href={route('offboarding.show', targetRoute)}
                            className="px-5 py-2.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all"
                        >
                            Cancel & Return
                        </Link>

                        {!isCompleted ? (
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 px-7 py-2.5 bg-slate-900 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                            >
                                <FiSave className="w-4 h-4" />
                                {processing ? 'Submitting...' : 'Save & Complete Exit Interview'}
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                                <FiCheckCircle className="w-4 h-4" />
                                Exit Interview Recorded on {new Date(exitInterview.conducted_at).toLocaleDateString('en-IN')}
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
