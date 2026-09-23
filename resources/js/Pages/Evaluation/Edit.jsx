import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import Avatar from '@/Components/Avatar';
import axios from 'axios';
import {
    UserIcon,
    ChatBubbleBottomCenterTextIcon,
    CheckCircleIcon,
    BuildingOfficeIcon,
    QueueListIcon,
    DocumentTextIcon,
    StarIcon,
    ClipboardDocumentCheckIcon,
    CalendarDaysIcon,
    ArrowLeftIcon,
    ChartPieIcon,
    SparklesIcon,
    ArrowPathIcon,
    CurrencyRupeeIcon,
    ArrowTrendingUpIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function Edit({ auth, evaluation, employees: initialEmployees, branches, departments: initialDepartments, criteria }) {

    // Determine initial increment type from saved data
    const getInitialIncrementType = () => {
        if (evaluation.increment_percentage && parseFloat(evaluation.increment_percentage) > 0) {
            return 'percentage';
        }
        return 'fixed';
    };

    const { data, setData, put, processing, errors, transform } = useForm({
        branch_id: evaluation.employee?.company_id || '',
        department_id: evaluation.employee?.department_id || '',
        employee_id: evaluation.employee_id || '',
        month: evaluation.month,
        year: evaluation.year || new Date().getFullYear(),
        criteria_scores: evaluation.criteria_scores || criteria.reduce((acc, curr) => ({ ...acc, [curr]: 3 }), {}),
        comments: evaluation.comments || '',
        increment_recommended: evaluation.increment_recommended ? String(parseFloat(evaluation.increment_recommended)) : '',
        increment_percentage: evaluation.increment_percentage ? String(parseFloat(evaluation.increment_percentage)) : '',
        promotion_recommended: evaluation.promotion_recommended || false,
        recommended_designation: evaluation.recommended_designation || '',
        pip_required: evaluation.pip_required || false,
        pip_notes: evaluation.pip_notes || '',
    });

    const [incrementType, setIncrementType] = useState(getInitialIncrementType);
    const [selectedEmployee, setSelectedEmployee] = useState(evaluation.employee);
    const [filteredDepartments, setFilteredDepartments] = useState(initialDepartments);
    const [employees, setEmployees] = useState(initialEmployees);

    useEffect(() => {
        if (data.branch_id) {
            const deps = initialDepartments.filter(d => d.company_id === parseInt(data.branch_id));
            setFilteredDepartments(deps);
            axios.get(route('api.employees.byCompany', { company_id: data.branch_id }))
                .then(res => setEmployees(res.data.employees))
                .catch(err => console.error(err));
        } else {
            setFilteredDepartments(initialDepartments);
            setEmployees(initialEmployees);
        }
    }, [data.branch_id]);

    // When switching increment type, clear the opposite field
    const handleIncrementTypeChange = (type) => {
        setIncrementType(type);
        if (type === 'fixed') {
            setData('increment_percentage', '');
        } else {
            setData('increment_recommended', '');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        transform((formData) => ({
            ...formData,
            increment_percentage: incrementType === 'fixed' ? '' : formData.increment_percentage,
            increment_recommended: incrementType === 'percentage' ? '' : formData.increment_recommended,
        }));
        put(route('evaluations.update', evaluation.id));
    };

    const handleScoreChange = (criterion, score) => {
        setData('criteria_scores', {
            ...data.criteria_scores,
            [criterion]: parseInt(score),
        });
    };

    const months = [
        { id: 1, name: 'January' }, { id: 2, name: 'February' }, { id: 3, name: 'March' },
        { id: 4, name: 'April' }, { id: 5, name: 'May' }, { id: 6, name: 'June' },
        { id: 7, name: 'July' }, { id: 8, name: 'August' }, { id: 9, name: 'September' },
        { id: 10, name: 'October' }, { id: 11, name: 'November' }, { id: 12, name: 'December' }
    ];

    const scores = Object.values(data.criteria_scores);
    const averageScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / (scores.length * 4)) * 100) : 0;

    const getScoreLabel = (score) => {
        if (score >= 4) return 'Outstanding';
        if (score >= 3) return 'Above Standards';
        if (score >= 2) return 'Meets Expectation';
        return 'Deficient';
    };

    const groupedCriteria = useMemo(() => {
        return {
            'Attitude': [
                'Service Quality', 'Communication Skills', 'Cleanliness',
                'Teamwork', 'Leadership', 'Professional Behavior', 'Work Under Pressure'
            ],
            'Responsibility': [
                'Attendance Punctuality', 'Accuracy in Cash Handling', 'Following Company Procedures',
                'Accountability for Transactions', 'Work on Deadline', 'Willingness to take more responsibility',
                'Open to feedback'
            ],
            'Competency': [
                'Creativity', 'Speed & Efficiency at Checkout', 'Accuracy in Transactions',
                'Product Knowledge', 'Handling Customer Complaints', 'Use of POS System',
                'Productivity', 'Initiative', 'Effective Problem Solving'
            ]
        };
    }, []);

    // Live salary preview
    const currentBasic = selectedEmployee ? parseFloat(selectedEmployee.basic_salary || 0) : 0;
    const incrementAmt = useMemo(() => {
        if (!selectedEmployee) return 0;
        if (incrementType === 'fixed') {
            return parseFloat(data.increment_recommended || 0);
        } else {
            const pct = parseFloat(data.increment_percentage || 0);
            return currentBasic * (pct / 100);
        }
    }, [incrementType, data.increment_recommended, data.increment_percentage, currentBasic, selectedEmployee]);

    const newSalary = currentBasic + incrementAmt;
    const incrementPct = currentBasic > 0 && incrementAmt > 0
        ? ((incrementAmt / currentBasic) * 100).toFixed(2)
        : 0;

    return (
        <AuthenticatedLayout>
            <Head title={`Edit Evaluation - ${evaluation.employee?.name}`} />

            <div className="min-h-screen bg-slate-50/50 py-4 px-4 sm:px-6 lg:px-8">
                <div className="w-full space-y-4">
                    {/* Action Bar */}
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('evaluations.show', evaluation.id)}
                            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm active:scale-95 group"
                        >
                            <ArrowLeftIcon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                        </Link>
                        <div>
                            <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal leading-none mb-1">Navigation Protocol</p>
                            <h1 className="text-sm font-normal text-slate-900 uppercase tracking-normal">Return to Analysis</h1>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* Left Column: Context & Stats (STICKY) */}
                        <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-24 z-[10]">
                            {/* Employee Identity Card */}
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-8 flex flex-col items-center text-center">
                                <div className="relative mb-6">
                                    <Avatar src={selectedEmployee?.employee_image || selectedEmployee?.image} name={selectedEmployee?.name} size="xl" className="w-32 h-32 ring-8 ring-slate-50 shadow-inner" />
                                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-2 rounded-full border-4 border-white shadow-lg">
                                        <CheckCircleIcon className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-normal text-slate-900 tracking-normal">{selectedEmployee?.name}</h3>
                                <p className="text-[10px] font-normal text-indigo-600 uppercase tracking-[0.2em] mt-1">{selectedEmployee?.designation || 'Specialist Staff'}</p>
                                {currentBasic > 0 && (
                                    <p className="text-[11px] font-semibold text-emerald-600 mt-2">
                                        Current Basic: ₹{currentBasic.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                )}

                                <div className="w-full h-px bg-slate-100 my-8"></div>

                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-left">
                                        <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-1">Company</p>
                                        <p className="text-[10px] font-normal text-slate-700 truncate">{evaluation.employee?.company?.name || 'Main Branch'}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-left">
                                        <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-1">Department</p>
                                        <p className="text-[10px] font-normal text-slate-700 truncate">{evaluation.employee?.department?.name || 'Operations'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Cycle Selection Card */}
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-200 flex items-center gap-3">
                                    <CalendarDaysIcon className="w-5 h-5 text-indigo-600" />
                                    <h3 className="text-sm font-normal text-slate-800 uppercase tracking-normal">Review Cycle</h3>
                                </div>
                                <div className="p-6 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] mb-2">Month</label>
                                        <select
                                            value={data.month}
                                            onChange={(e) => setData('month', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm font-normal text-slate-700 focus:ring-indigo-500"
                                        >
                                            {months.map((m) => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] mb-2">Year</label>
                                        <input
                                            type="number"
                                            value={data.year}
                                            onChange={(e) => setData('year', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm font-normal text-slate-700 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Performance Grade Card */}
                            <div className="bg-slate-900 rounded-lg shadow-xl p-8 relative overflow-hidden group">
                                <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500">
                                    <ChartPieIcon className="w-32 h-32 text-white" />
                                </div>
                                <p className="text-[10px] font-normal text-indigo-400 uppercase tracking-[0.3em] mb-6 relative z-10">Real-time Analysis</p>
                                <div className="flex items-end gap-2 relative z-10">
                                    <span className="text-6xl font-normal text-white tracking-normal leading-none">{averageScore}</span>
                                    <span className="text-xl font-normal text-indigo-400 mb-1">%</span>
                                </div>
                                <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">Growth Grade</span>
                                        <span className={`text-[10px] font-normal uppercase tracking-normal px-2 py-0.5 rounded ${averageScore >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {averageScore >= 90 ? 'Outstanding' : averageScore >= 75 ? 'Qualified' : 'In Review'}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 transition-all duration-700"
                                            style={{ width: `${averageScore}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Assessment Matrix */}
                        <div className="lg:col-span-8 space-y-8">
                            {Object.entries(groupedCriteria).map(([group, items], groupIndex) => (
                                <div key={group} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-normal shadow-lg">
                                                0{groupIndex + 1}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-normal text-slate-800 uppercase tracking-normal">{group} Matrix</h3>
                                                <p className="text-[10px] text-slate-400 font-normal uppercase tracking-normal">Performance Metrics</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 space-y-8">
                                        {items.map((criterion) => {
                                            const score = data.criteria_scores[criterion] || 1;
                                            return (
                                                <div key={criterion} className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-sm font-normal text-slate-700">{criterion}</label>
                                                        <span className={`text-[10px] font-normal uppercase tracking-normal px-3 py-1 rounded-lg ${
                                                            score === 4 ? 'bg-emerald-50 text-emerald-700' :
                                                            score === 3 ? 'bg-indigo-50 text-indigo-700' :
                                                            score === 2 ? 'bg-amber-50 text-amber-700' :
                                                            'bg-rose-50 text-rose-700'
                                                        }`}>
                                                            {getScoreLabel(score)}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-3">
                                                        {[1, 2, 3, 4].map((num) => (
                                                            <button
                                                                key={num}
                                                                type="button"
                                                                onClick={() => handleScoreChange(criterion, num)}
                                                                className={`py-3 rounded-lg border-2 transition-all text-[10px] font-normal uppercase tracking-normal ${
                                                                    score === num
                                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                                                    : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                                                                }`}
                                                            >
                                                                {num === 1 ? 'Deficient' : num === 2 ? 'Meets Exp.' : num === 3 ? 'Above Std.' : 'Outstanding'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* ====================================================== */}
                            {/* Salary Increment Section                                */}
                            {/* ====================================================== */}
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 space-y-5">
                                <h3 className="text-sm font-normal text-slate-800 uppercase tracking-normal flex items-center gap-2">
                                    <CurrencyRupeeIcon className="w-5 h-5 text-emerald-600" />
                                    Salary Increment Recommendation
                                </h3>

                                {/* Mode Toggle: Fixed vs Percentage */}
                                <div className="flex items-center gap-0 bg-slate-100 rounded-lg p-1 w-fit">
                                    <button
                                        type="button"
                                        onClick={() => handleIncrementTypeChange('fixed')}
                                        className={`px-4 py-1.5 rounded-md text-[11px] font-semibold uppercase transition-all ${
                                            incrementType === 'fixed'
                                                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        ₹ Fixed Amount
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleIncrementTypeChange('percentage')}
                                        className={`px-4 py-1.5 rounded-md text-[11px] font-semibold uppercase transition-all ${
                                            incrementType === 'percentage'
                                                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        % Percentage
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {incrementType === 'fixed' ? (
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-normal mb-2">
                                                Fixed Increment Amount (₹)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={data.increment_recommended}
                                                    onChange={(e) => setData('increment_recommended', e.target.value)}
                                                    placeholder="e.g. 2500"
                                                    className="w-full pl-7 bg-slate-50 border-slate-200 rounded-lg text-sm font-normal text-slate-700 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>
                                            {errors.increment_recommended && (
                                                <p className="text-rose-500 text-[10px] mt-1">{errors.increment_recommended}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-normal mb-2">
                                                Increment Percentage (%)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={data.increment_percentage}
                                                    onChange={(e) => setData('increment_percentage', e.target.value)}
                                                    placeholder="e.g. 10"
                                                    className="w-full pr-8 bg-slate-50 border-slate-200 rounded-lg text-sm font-normal text-slate-700 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">%</span>
                                            </div>
                                            {errors.increment_percentage && (
                                                <p className="text-rose-500 text-[10px] mt-1">{errors.increment_percentage}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Live Salary Preview */}
                                    {selectedEmployee && incrementAmt > 0 && (
                                        <div className="sm:col-span-1 flex flex-col gap-2">
                                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-normal">Salary Outcome Preview</p>
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1.5">
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-slate-500">Current Basic</span>
                                                    <span className="font-semibold text-slate-700">₹{currentBasic.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-emerald-600">Increment (+)</span>
                                                    <span className="font-semibold text-emerald-700">
                                                        +₹{incrementAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        {incrementType === 'fixed' && incrementPct > 0 && (
                                                            <span className="ml-1 text-emerald-500">({incrementPct}%)</span>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="border-t border-emerald-200 pt-1.5 flex items-center justify-between text-[12px]">
                                                    <span className="text-slate-700 font-semibold">New Basic Salary</span>
                                                    <span className="font-bold text-emerald-700">₹{newSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ====================================================== */}
                            {/* Promotion & PIP                                         */}
                            {/* ====================================================== */}
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 space-y-4">
                                <h3 className="text-sm font-normal text-slate-800 uppercase tracking-normal flex items-center gap-2">
                                    <ArrowTrendingUpIcon className="w-5 h-5 text-indigo-600" />
                                    Promotion & Performance Action
                                </h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-normal text-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.promotion_recommended}
                                            onChange={(e) => setData('promotion_recommended', e.target.checked)}
                                            className="rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                        Recommend Employee for Promotion
                                    </label>
                                    {data.promotion_recommended && (
                                        <input
                                            type="text"
                                            value={data.recommended_designation}
                                            onChange={(e) => setData('recommended_designation', e.target.value)}
                                            placeholder="Enter new recommended designation..."
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm font-normal text-slate-700"
                                        />
                                    )}
                                    <label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.pip_required}
                                            onChange={(e) => setData('pip_required', e.target.checked)}
                                            className="rounded border-slate-300 text-rose-500 focus:ring-rose-400"
                                        />
                                        <span className="text-rose-600 font-medium">Flag for Performance Improvement Plan (PIP)</span>
                                    </label>
                                    {data.pip_required && (
                                        <textarea
                                            value={data.pip_notes}
                                            onChange={(e) => setData('pip_notes', e.target.value)}
                                            rows={3}
                                            placeholder="Describe PIP objectives, timeline, and targets..."
                                            className="w-full bg-rose-50 border-rose-200 rounded-lg text-sm font-normal text-slate-700 focus:ring-rose-400 focus:border-rose-400 p-3 placeholder:text-slate-400"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Narrative Feedback Card */}
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-200 flex items-center gap-3">
                                    <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-indigo-600" />
                                    <h3 className="text-sm font-normal text-slate-800 uppercase tracking-normal">Managerial Insight</h3>
                                </div>
                                <div className="p-8">
                                    <textarea
                                        value={data.comments}
                                        onChange={(e) => setData('comments', e.target.value)}
                                        rows="4"
                                        className="w-full bg-slate-50 border-slate-100 rounded-lg p-6 text-sm font-normal text-slate-600 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                        placeholder="Update constructive feedback and professional growth recommendations..."
                                    ></textarea>
                                    <div className="mt-4 flex items-start gap-3 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                                        <SparklesIcon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                                        <p className="text-[10px] font-normal text-slate-500 leading-relaxed uppercase tracking-normal">
                                            Modifying this record will update the official performance history for this employee.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Block */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-5 bg-primary hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 text-white rounded-lg font-normal text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                                >
                                    {processing ? (
                                        <div className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Updating Record...
                                        </div>
                                    ) : (
                                        <>
                                            <ArrowPathIcon className="w-5 h-5" />
                                            Update Assessment Record
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
