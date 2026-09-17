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
    SparklesIcon,
    CurrencyRupeeIcon,
    ArrowTrendingUpIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function Create({ auth, employees: initialEmployees, branches, departments: initialDepartments, criteria }) {
    const { data, setData, post, processing, errors } = useForm({
        branch_id: '',
        department_id: '',
        employee_id: '',
        cycle_type: 'annual',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        criteria_scores: criteria.reduce((acc, curr) => ({ ...acc, [curr]: 3 }), {}),
        comments: '',
        increment_recommended: '',
        increment_percentage: '',
        promotion_recommended: false,
        recommended_designation: '',
        pip_required: false,
        pip_notes: '',
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

    const cycleTypes = [
        { id: 'annual', name: 'Annual Appraisal' },
        { id: 'half_yearly', name: 'Half-Yearly Review' },
        { id: 'quarterly', name: 'Quarterly Review' },
        { id: 'probation', name: 'Probation Assessment' },
        { id: 'monthly', name: 'Monthly Audit' },
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
        const groups = {
            'Attitude & Professionalism': [
                'Service Quality', 'Communication Skills', 'Cleanliness',
                'Teamwork', 'Leadership', 'Professional Behavior', 'Work Under Pressure'
            ],
            'Responsibility & Compliance': [
                'Attendance Punctuality', 'Accuracy in Cash Handling', 'Following Company Procedures',
                'Accountability for Transactions', 'Work on Deadline', 'Willingness to take more responsibility',
                'Open to feedback'
            ],
            'Competency & Technical Skills': [
                'Creativity', 'Speed & Efficiency at Checkout', 'Accuracy in Transactions',
                'Product Knowledge', 'Handling Customer Complaints', 'Use of POS System',
                'Productivity', 'Initiative', 'Effective Problem Solving'
            ]
        };
        return groups;
    }, []);

    return (
        <AuthenticatedLayout>
            <Head title="Initiate Appraisal" />

            <div className="min-h-screen bg-slate-50/50 py-4 px-4 sm:px-6 lg:px-8">
                <div className="w-full space-y-4">
                    {/* Action Bar */}
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('evaluations.index')}
                            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm active:scale-95 group"
                        >
                            <ArrowLeftIcon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                        </Link>
                        <div>
                            <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal leading-none mb-1">Performance Workflow</p>
                            <h1 className="text-sm font-normal text-slate-900 uppercase tracking-normal">Return to Appraisals List</h1>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Left Column: Target & Configuration */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Target Card */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-3.5 bg-slate-50/50 border-b border-slate-200 flex items-center gap-3">
                                    <UserIcon className="w-4 h-4 text-indigo-600" />
                                    <h3 className="text-xs font-normal text-slate-800 uppercase tracking-normal">Target Employee</h3>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-1">Company / Branch</label>
                                        <select
                                            value={data.branch_id}
                                            onChange={(e) => setData('branch_id', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-700 focus:ring-primary focus:border-primary"
                                        >
                                            <option value="">Select Branch</option>
                                            {branches.map((b) => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-1">Department</label>
                                        <select
                                            value={data.department_id}
                                            onChange={(e) => setData('department_id', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-700 focus:ring-primary focus:border-primary"
                                        >
                                            <option value="">Select Department</option>
                                            {filteredDepartments.map((d) => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-1">Employee *</label>
                                        <select
                                            value={data.employee_id}
                                            onChange={(e) => handleEmployeeChange(e.target.value)}
                                            className={`w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-700 focus:ring-primary focus:border-primary ${errors.employee_id ? 'border-rose-400 ring-rose-50' : ''}`}
                                        >
                                            <option value="">Choose Employee</option>
                                            {employees.map((emp) => (
                                                <option key={emp.id} value={emp.id}>{emp.name} ({emp.employee_code || 'Staff'})</option>
                                            ))}
                                        </select>
                                        {errors.employee_id && <p className="text-rose-600 text-[10px] mt-1">{errors.employee_id}</p>}
                                    </div>

                                    {selectedEmployee && (
                                        <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-center gap-3">
                                            <Avatar src={selectedEmployee.employee_image || selectedEmployee.image} name={selectedEmployee.name} size="md" />
                                            <div>
                                                <p className="text-xs font-normal text-slate-900">{selectedEmployee.name}</p>
                                                <p className="text-[10px] text-indigo-600 font-normal uppercase">{selectedEmployee.designation || 'Staff'}</p>
                                                {selectedEmployee.basic_salary && (
                                                    <p className="text-[10px] text-emerald-600 font-normal">Base: ₹{Number(selectedEmployee.basic_salary).toLocaleString('en-IN')}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cycle Card */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-3.5 bg-slate-50/50 border-b border-slate-200 flex items-center gap-3">
                                    <CalendarDaysIcon className="w-4 h-4 text-indigo-600" />
                                    <h3 className="text-xs font-normal text-slate-800 uppercase tracking-normal">Appraisal Frequency & Period</h3>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-1">Appraisal Frequency</label>
                                        <select
                                            value={data.cycle_type}
                                            onChange={(e) => setData('cycle_type', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-700"
                                        >
                                            {cycleTypes.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-1">Month / Period</label>
                                            <select
                                                value={data.month}
                                                onChange={(e) => setData('month', e.target.value)}
                                                className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-700"
                                            >
                                                {months.map((m) => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-1">Year</label>
                                            <input
                                                type="number"
                                                value={data.year}
                                                onChange={(e) => setData('year', e.target.value)}
                                                className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-700"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Score Overview */}
                            <div className="bg-slate-900 rounded-xl shadow-lg p-6 relative overflow-hidden text-white">
                                <div className="absolute -right-4 -bottom-4 opacity-10">
                                    <ChartPieIcon className="w-28 h-28" />
                                </div>
                                <p className="text-[10px] font-normal text-indigo-400 uppercase tracking-normal mb-3">Live Score Calculation</p>
                                <div className="flex items-end gap-1.5">
                                    <span className="text-4xl font-normal leading-none">{averageScore}</span>
                                    <span className="text-lg text-indigo-400 mb-0.5">%</span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400 uppercase">Evaluation Grade:</span>
                                    <span className={`text-[10px] uppercase font-medium ${averageScore >= 80 ? 'text-emerald-400' : (averageScore >= 50 ? 'text-amber-400' : 'text-rose-400')}`}>
                                        {averageScore >= 80 ? 'Outstanding' : averageScore >= 50 ? 'Satisfactory' : 'PIP Watch'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Criteria & Recommendations */}
                        <div className="lg:col-span-8 space-y-6">
                            {Object.entries(groupedCriteria).map(([group, items], groupIndex) => (
                                <div key={group} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-normal">
                                                0{groupIndex + 1}
                                            </div>
                                            <h3 className="text-xs font-normal text-slate-800 uppercase tracking-normal">{group}</h3>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        {items.map((criterion) => {
                                            const score = data.criteria_scores[criterion] || 1;
                                            return (
                                                <div key={criterion} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs font-normal text-slate-700">{criterion}</label>
                                                        <span className={`text-[9px] font-normal uppercase px-2 py-0.5 rounded ${score === 4 ? 'bg-emerald-50 text-emerald-700' :
                                                                score === 3 ? 'bg-indigo-50 text-indigo-700' :
                                                                    score === 2 ? 'bg-amber-50 text-amber-700' :
                                                                        'bg-rose-50 text-rose-700'
                                                            }`}>
                                                            {getScoreLabel(score)} ({score})
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {[1, 2, 3, 4].map((num) => (
                                                            <button
                                                                key={num}
                                                                type="button"
                                                                onClick={() => handleScoreChange(criterion, num)}
                                                                className={`py-2 rounded-lg border text-[10px] font-normal uppercase transition-all ${score === num
                                                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm font-medium'
                                                                        : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300'
                                                                    }`}
                                                            >
                                                                {num === 1 ? 'Deficient (1)' : num === 2 ? 'Meets (2)' : num === 3 ? 'Above (3)' : 'Outstanding (4)'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Recommendations & Action Linkage */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                                <h3 className="text-xs font-normal text-slate-800 uppercase tracking-normal flex items-center gap-2">
                                    <CurrencyRupeeIcon className="w-4 h-4 text-emerald-600" />
                                    Outcome & Action Linkage Recommendations (INR ₹)
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-1">Recommended Salary Increment (₹ INR)</label>
                                        <input
                                            type="number"
                                            value={data.increment_recommended}
                                            onChange={(e) => setData('increment_recommended', e.target.value)}
                                            placeholder="e.g. 2500"
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-1">Increment Percentage (%)</label>
                                        <input
                                            type="number"
                                            value={data.increment_percentage}
                                            onChange={(e) => setData('increment_percentage', e.target.value)}
                                            placeholder="e.g. 10"
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-700"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="flex items-center gap-2 text-xs font-normal text-slate-700 cursor-pointer">
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
                                                className="w-full mt-2 bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-700"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Manager Observation */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
                                <h3 className="text-xs font-normal text-slate-800 uppercase tracking-normal flex items-center gap-2">
                                    <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-indigo-600" />
                                    Managerial Assessment & Growth Feedback
                                </h3>
                                <textarea
                                    value={data.comments}
                                    onChange={(e) => setData('comments', e.target.value)}
                                    rows="3"
                                    className="w-full bg-slate-50 border-slate-200 rounded-lg p-3 text-xs font-normal text-slate-700 placeholder:text-slate-300"
                                    placeholder="Enter review notes, feedback, and key discussion points..."
                                ></textarea>
                            </div>

                            {/* Submit */}
                            <div>
                                <button
                                    type="submit"
                                    disabled={processing || !data.employee_id}
                                    className="w-full py-3.5 bg-primary hover:brightness-110 text-white rounded-xl text-xs font-normal uppercase tracking-normal shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Submit Appraisal Evaluation
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
