import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, Fragment } from 'react';
import { FiArrowLeft, FiFilter, FiDownload, FiFileText, FiTable, FiBarChart2, FiUserCheck, FiTrendingUp, FiAlertCircle, FiChevronRight } from 'react-icons/fi';
import MultiCheckboxSelect from '@/Components/MultiCheckboxSelect';

export default function Evaluation({ evaluations, summary, month, year, companyId, companies }) {
    const [filters, setFilters] = useState({
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear(),
        company_id: companyId 
            ? (Array.isArray(companyId) ? companyId.map(String) : [String(companyId)])
            : [],
    });

    const handleFilter = () => {
        router.get(route('reports.evaluation'), filters, { preserveState: true });
    };

    const handleExport = (type) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(v => params.append(`${key}[]`, v));
            } else {
                params.append(key, value);
            }
        });
        const queryParams = params.toString();
        const baseUrl = route(`reports.evaluation.export.${type}`);
        window.open(`${baseUrl}?${queryParams}`, '_blank');
    };

    const months = [
        { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
        { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
        { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-100';
        return 'text-rose-600 bg-rose-50 border-rose-100';
    };

    const criteriaGroups = {
        'Attitude': ['Service Quality', 'Communication Skills', 'Cleanliness', 'Teamwork', 'Leadership', 'Professional Behavior', 'Work Under Pressure'],
        'Responsibility': ['Attendance Punctuality', 'Accuracy in Cash Handling', 'Following Company Procedures', 'Accountability for Transactions', 'Work on Deadline', 'Willingness to take more responsibility', 'Open to feedback'],
        'Competency': ['Creativity', 'Speed & Efficiency at Checkout', 'Accuracy in Transactions', 'Product Knowledge', 'Handling Customer Complaints', 'Use of POS System', 'Productivity', 'Initiative', 'Effective Problem Solving']
    };

    const calculateGroupAvg = (scores, group) => {
        if (!scores) return 0;
        const groupCriteria = criteriaGroups[group];
        const groupScores = groupCriteria.map(c => parseFloat(scores[c]) || 0).filter(s => s > 0);
        return groupScores.length ? (groupScores.reduce((a, b) => a + b, 0) / groupScores.length).toFixed(1) : 'N/A';
    };

    const [expandedRow, setExpandedRow] = useState(null);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800 tracking-normal">Advanced Performance Intelligence</h2>}>
            <Head title="Advanced Evaluation Report" />

            <div className="w-full mx-auto p-6 space-y-6 bg-slate-50 min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={route('reports.index')} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-all shadow-sm">
                            <FiArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-normal text-slate-900">Advanced Evaluation Report</h1>
                            <p className="text-sm text-slate-500 mt-0.5 font-normal">Deep dive into performance metrics, department benchmarks, and competency breakdowns.</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => handleExport('pdf')}
                            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-normal uppercase tracking-normal hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center gap-2"
                        >
                            <FiFileText size={14} /> Export PDF
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-normal uppercase tracking-normal hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
                        >
                            <FiTable size={14} /> Export Excel
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <FiFilter size={16} />
                        </div>
                        <h3 className="text-base font-normal text-slate-800">Analytical Parameters</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">Period</label>
                            <select
                                value={filters.month}
                                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                                className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-sm bg-slate-50/50 font-normal"
                            >
                                {months.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">Financial Year</label>
                            <select
                                value={filters.year}
                                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                                className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-sm bg-slate-50/50 font-normal"
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">Organization Branch</label>
                            <MultiCheckboxSelect
                                value={filters.company_id}
                                options={companies?.map(c => ({ value: String(c.id), label: c.name })) || []}
                                onChange={(e) => setFilters({ ...filters, company_id: e.target.value })}
                                placeholder="Select Branches"
                            />
                        </div>
                        <div>
                            <button
                                onClick={handleFilter}
                                className="w-full bg-primary text-white py-2.5 rounded-xl text-xs font-normal uppercase tracking-normal hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                            >
                                Sync Analytics
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                            <div className="relative z-10">
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal mb-1">Organization Health</div>
                                <div className="text-3xl font-normal text-slate-800">{Number(summary.avg_score).toFixed(1)}%</div>
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${summary.avg_score}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-normal text-blue-600 uppercase tracking-normal">Avg.</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                            <div className="relative z-10">
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal mb-1">Elite Talent Tier</div>
                                <div className="text-3xl font-normal text-emerald-600">{summary.top_performers || 0} <span className="text-sm font-normal text-slate-400">Staff</span></div>
                                <p className="text-[10px] text-slate-500 font-normal uppercase mt-2">Scoring above 80% this period</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                            <div className="relative z-10">
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal mb-1">Performance Alerts</div>
                                <div className="text-3xl font-normal text-rose-600">{summary.low_performers || 0} <span className="text-sm font-normal text-slate-400">Cases</span></div>
                                <p className="text-[10px] text-slate-500 font-normal uppercase mt-2">Scoring below 50% benchmarks</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                            <div className="relative z-10">
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal mb-1">Total Coverage</div>
                                <div className="text-3xl font-normal text-slate-800">{summary.total_evaluations || 0} <span className="text-sm font-normal text-slate-400">Audits</span></div>
                                <p className="text-[10px] text-slate-500 font-normal uppercase mt-2">Evaluations finalized in {months.find(m => m.value == filters.month)?.label}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-sm font-normal text-slate-800 uppercase tracking-normal mb-4 flex items-center gap-2">
                            <FiBarChart2 className="text-primary" />
                            Department Averages
                        </h3>
                        <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {summary.dept_averages && Object.entries(summary.dept_averages).map(([dept, avg]) => (
                                <div key={dept} className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[11px] font-normal">
                                        <span className="text-slate-600 truncate max-w-[120px]">{dept}</span>
                                        <span className="text-slate-900">{Number(avg).toFixed(1)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${Number(avg) >= 80 ? 'bg-emerald-500' : (Number(avg) >= 60 ? 'bg-blue-500' : 'bg-rose-500')}`} 
                                            style={{ width: `${avg}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {(!summary.dept_averages || Object.keys(summary.dept_averages).length === 0) && (
                                <div className="py-10 text-center text-xs text-slate-400 font-normal italic">No department data available.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Evaluation List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-base font-normal text-slate-800">Advanced Performance Records</h3>
                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">Click row to expand breakdown</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Employee / Department</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Evaluator</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Category Performance</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-right">Overall</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-right">Audit Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-50">
                                {evaluations && evaluations.length > 0 ? (
                                    evaluations.map((ev) => (
                                        <Fragment key={ev.id}>
                                            <tr 
                                                className={`hover:bg-slate-50 transition-colors group cursor-pointer ${expandedRow === ev.id ? 'bg-primary/5' : ''}`}
                                                onClick={() => setExpandedRow(expandedRow === ev.id ? null : ev.id)}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-normal text-slate-400 group-hover:border-primary group-hover:text-primary transition-all shadow-sm">
                                                            {ev.employee?.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-normal text-slate-800">{ev.employee?.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-normal uppercase tracking-normal">{ev.employee?.department}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-xs font-normal text-slate-600">{ev.evaluator?.name}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase tracking-normal">Certified Evaluator</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-4">
                                                        {['Attitude', 'Responsibility', 'Competency'].map(cat => (
                                                            <div key={cat} className="space-y-0.5">
                                                                <div className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">{cat.charAt(0)}</div>
                                                                <div className={`text-[11px] font-normal ${Number(calculateGroupAvg(ev.criteria_scores, cat)) >= 3.5 ? 'text-emerald-500' : (Number(calculateGroupAvg(ev.criteria_scores, cat)) >= 2.5 ? 'text-blue-500' : 'text-rose-500')}`}>
                                                                    {calculateGroupAvg(ev.criteria_scores, cat)}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className={`inline-flex px-4 py-1.5 text-sm font-normal rounded-xl border-2 ${getScoreColor(ev.overall_score)}`}>
                                                        {Number(ev.overall_score).toFixed(0)}%
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-[11px] font-normal text-slate-500 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <span>{new Date(ev.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${expandedRow === ev.id ? 'bg-primary text-white rotate-180' : 'bg-slate-100 text-slate-400 group-hover:bg-primary/20 group-hover:text-primary'}`}>
                                                            <FiChevronRight size={14} className="transition-transform" />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedRow === ev.id && (
                                                <tr key={`${ev.id}-extra`}>
                                                    <td colSpan="5" className="px-10 py-6 bg-slate-50/80">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                            {Object.entries(criteriaGroups).map(([group, list]) => (
                                                                <div key={group} className="space-y-3">
                                                                    <h4 className="text-[11px] font-normal text-slate-800 uppercase tracking-normal border-b border-slate-200 pb-2">{group} Breakdown</h4>
                                                                    <div className="space-y-2">
                                                                        {list.map(criterion => (
                                                                            <div key={criterion} className="flex justify-between items-center text-[10px]">
                                                                                <span className="text-slate-500 font-normal">{criterion}</span>
                                                                                <div className="flex gap-1">
                                                                                    {[1, 2, 3, 4].map(star => (
                                                                                        <div 
                                                                                            key={star} 
                                                                                            className={`w-2.5 h-1.5 rounded-full ${star <= (ev.criteria_scores?.[criterion] || 0) ? 'bg-primary' : 'bg-slate-200'}`}
                                                                                        ></div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="mt-8 p-4 bg-white rounded-xl border border-slate-200 italic text-xs text-slate-600 font-normal">
                                                            <span className="font-normal text-slate-400 uppercase tracking-normal mr-3 non-italic">Feedback:</span>
                                                            "{ev.comments || 'No qualitative feedback provided for this audit cycle.'}"
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200 border border-slate-100">
                                                    <FiBarChart2 size={32} />
                                                </div>
                                                <p className="text-slate-400 text-sm font-normal uppercase tracking-normal">No Intelligence Data Found</p>
                                                <p className="text-slate-300 text-xs font-normal mt-1">Adjust filters to broaden your search parameters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
