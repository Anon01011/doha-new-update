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
    ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function Edit({ auth, evaluation, employees: initialEmployees, branches, departments: initialDepartments, criteria }) {
    
    const { data, setData, put, processing, errors } = useForm({
        branch_id: evaluation.employee?.company_id || '',
        department_id: evaluation.employee?.department_id || '',
        employee_id: evaluation.employee_id || '',
        month: evaluation.month,
        year: evaluation.year || new Date().getFullYear(),
        criteria_scores: evaluation.criteria_scores || criteria.reduce((acc, curr) => ({ ...acc, [curr]: 3 }), {}),
        comments: evaluation.comments || '',
    });

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

    const handleSubmit = (e) => {
        e.preventDefault();
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

    const getScoreColor = (score) => {
        if (score >= 4) return 'bg-emerald-500';
        if (score >= 3) return 'bg-indigo-500';
        if (score >= 2) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    const groupedCriteria = useMemo(() => {
        const groups = {
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
        return groups;
    }, []);

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-normal text-slate-900 tracking-normal leading-none">Record Modification</h2>
                    <p className="text-[9px] text-slate-400 font-normal uppercase tracking-[0.2em] mt-1.5">Adjusting Historical Performance Data</p>
                </div>
            }
        >
            <Head title={`Edit Evaluation - ${evaluation.employee?.name}`} />

            <div className="min-h-screen bg-slate-50/50 py-4 px-4 sm:px-6 lg:px-5">
                <div className="max-w-[1600px] mx-auto space-y-4">
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
                                    className="w-full py-5 bg-primary hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 text-white rounded-lg font-normal text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
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
