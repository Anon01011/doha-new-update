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
    ArrowLeftIcon,
    CalendarDaysIcon,
    ChartPieIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

export default function Create({ auth, employees: initialEmployees, branches, departments: initialDepartments, criteria }) {
    const { data, setData, post, processing, errors } = useForm({
        branch_id: '',
        department_id: '',
        employee_id: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        criteria_scores: criteria.reduce((acc, curr) => ({ ...acc, [curr]: 3 }), {}),
        comments: '',
    });

    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [filteredDepartments, setFilteredDepartments] = useState(initialDepartments);
    const [employees, setEmployees] = useState(initialEmployees);

    useEffect(() => {
        if (data.branch_id) {
            const deps = initialDepartments.filter(d => d.company_id === parseInt(data.branch_id));
            setFilteredDepartments(deps);
            if (data.department_id && !deps.find(d => d.id === parseInt(data.department_id))) {
                setData(prev => ({ ...prev, department_id: '', employee_id: '' }));
                setSelectedEmployee(null);
            }
            axios.get(route('api.employees.byCompany', { company_id: data.branch_id }))
                .then(res => setEmployees(res.data.employees))
                .catch(err => console.error(err));
        } else {
            setFilteredDepartments(initialDepartments);
            setEmployees(initialEmployees);
        }
    }, [data.branch_id]);

    useEffect(() => {
        if (data.department_id) {
            axios.get(route('api.employees.byDepartment', { department_id: data.department_id }))
                .then(res => setEmployees(res.data.employees))
                .catch(err => console.error(err));
            if (selectedEmployee && selectedEmployee.department_id !== parseInt(data.department_id)) {
                setData('employee_id', '');
                setSelectedEmployee(null);
            }
        }
    }, [data.department_id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('evaluations.store'));
    };

    const handleScoreChange = (criterion, score) => {
        setData('criteria_scores', {
            ...data.criteria_scores,
            [criterion]: parseInt(score),
        });
    };

    const handleEmployeeChange = (employeeId) => {
        setData('employee_id', employeeId);
        const emp = employees.find(e => e.id === parseInt(employeeId));
        setSelectedEmployee(emp);
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
                    <h2 className="text-xl font-normal text-slate-900 tracking-normal leading-none">Performance Calibration</h2>
                    <p className="text-[9px] text-slate-400 font-normal uppercase tracking-[0.2em] mt-1.5">New Employee Assessment Entry</p>
                </div>
            }
        >
            <Head title="New Evaluation" />

            <div className="min-h-screen bg-slate-50/50 py-4 px-4 sm:px-6 lg:px-5">
                <div className="max-w-[1600px] mx-auto space-y-4">
                    {/* Action Bar */}
                    <div className="flex items-center gap-3">
                        <Link 
                            href={route('evaluations.index')} 
                            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm active:scale-95 group"
                        >
                            <ArrowLeftIcon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                        </Link>
                        <div>
                            <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal leading-none mb-1">Navigation Protocol</p>
                            <h1 className="text-sm font-normal text-slate-900 uppercase tracking-normal">Return to Registry</h1>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* Left Column: Configuration & Identity (STICKY) */}
                        <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-24 z-[10]">
                            {/* Target Selection Card */}
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-200 flex items-center gap-3">
                                    <UserIcon className="w-5 h-5 text-indigo-600" />
                                    <h3 className="text-sm font-normal text-slate-800 uppercase tracking-normal">Evaluation Target</h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] mb-2">Branch / Company</label>
                                            <select
                                                value={data.branch_id}
                                                onChange={(e) => setData('branch_id', e.target.value)}
                                                className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm font-normal text-slate-700 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                            >
                                                <option value="">Select Branch</option>
                                                {branches.map((b) => (
                                                    <option key={b.id} value={b.id}>{b.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] mb-2">Department</label>
                                            <select
                                                value={data.department_id}
                                                onChange={(e) => setData('department_id', e.target.value)}
                                                className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm font-normal text-slate-700 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                            >
                                                <option value="">Select Department</option>
                                                {filteredDepartments.map((d) => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] mb-2">Employee</label>
                                            <select
                                                value={data.employee_id}
                                                onChange={(e) => handleEmployeeChange(e.target.value)}
                                                className={`w-full bg-slate-50 border-slate-200 rounded-lg text-sm font-normal text-slate-700 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${errors.employee_id ? 'border-rose-300 ring-rose-50' : ''}`}
                                            >
                                                <option value="">Choose Employee</option>
                                                {employees.map((emp) => (
                                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                                ))}
                                            </select>
                                            {errors.employee_id && <p className="text-rose-600 text-[10px] mt-1.5 font-normal uppercase tracking-normal">{errors.employee_id}</p>}
                                        </div>
                                    </div>

                                    {selectedEmployee && (
                                        <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-center gap-4 transition-all animate-in fade-in slide-in-from-top-2">
                                            <Avatar src={selectedEmployee.employee_image || selectedEmployee.image} name={selectedEmployee.name} size="lg" className="shadow-sm" />
                                            <div>
                                                <p className="text-sm font-normal text-slate-900">{selectedEmployee.name}</p>
                                                <p className="text-[10px] font-normal text-indigo-600 uppercase tracking-normal">{selectedEmployee.designation || 'Specialist'}</p>
                                            </div>
                                        </div>
                                    )}
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

                            {/* Score Overview Card */}
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
                                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">Performance Grade</span>
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

                        {/* Right Column: Criteria Assessment */}
                        <div className="lg:col-span-8 space-y-8">
                            {Object.entries(groupedCriteria).map(([group, items], groupIndex) => (
                                <div key={group} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-normal shadow-lg">
                                                0{groupIndex + 1}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-normal text-slate-800 uppercase tracking-normal">{group} Assessment</h3>
                                                <p className="text-[10px] text-slate-400 font-normal uppercase tracking-normal">Core Competencies</p>
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
                                    <h3 className="text-sm font-normal text-slate-800 uppercase tracking-normal">Managerial Observation</h3>
                                </div>
                                <div className="p-8">
                                    <textarea
                                        value={data.comments}
                                        onChange={(e) => setData('comments', e.target.value)}
                                        rows="4"
                                        className="w-full bg-slate-50 border-slate-100 rounded-lg p-6 text-sm font-normal text-slate-600 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                        placeholder="Enter constructive feedback and professional growth recommendations..."
                                    ></textarea>
                                    <div className="mt-4 flex items-start gap-3 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                                        <SparklesIcon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                                        <p className="text-[10px] font-normal text-slate-500 leading-relaxed uppercase tracking-normal">
                                            This feedback will be shared with the employee. Please maintain professional and constructive communication.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Block */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={processing || !data.employee_id}
                                    className="w-full py-5 bg-primary hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 text-white rounded-lg font-normal text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                                >
                                    {processing ? (
                                        <div className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Generating Report...
                                        </div>
                                    ) : (
                                        <>
                                            <CheckCircleIcon className="w-5 h-5" />
                                            Submit Final Evaluation
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
