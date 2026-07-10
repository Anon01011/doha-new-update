import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import Avatar from '@/Components/Avatar';
import {
    PlusIcon,
    DocumentTextIcon,
    CalendarIcon,
    StarIcon,
    BuildingOfficeIcon,
    QueueListIcon,
    ChevronRightIcon,
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    SparklesIcon,
    ArrowPathIcon,
    DocumentMagnifyingGlassIcon,
    ChartBarIcon,
    UserGroupIcon,
    AcademicCapIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';

export default function Index({ evaluations }) {
    const { auth } = usePage().props;
    const user = auth?.user || {};
    const [search, setSearch] = useState('');

    const getScoreColor = (score) => {
        if (score >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-100';
        if (score >= 70) return 'text-indigo-700 bg-indigo-50 border-indigo-100';
        if (score >= 40) return 'text-amber-700 bg-amber-50 border-amber-100';
        return 'text-rose-700 bg-rose-50 border-rose-100';
    };

    const getMonthName = (monthNum) => {
        if (!monthNum) return '';
        if (isNaN(monthNum)) return monthNum;
        const date = new Date();
        date.setMonth(monthNum - 1);
        return date.toLocaleString('default', { month: 'short' });
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this evaluation? This action cannot be undone.')) {
            router.delete(route('evaluations.destroy', id));
        }
    };

    const stats = useMemo(() => {
        const data = evaluations.data || [];
        const total = evaluations.total || 0;
        const avg = data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + curr.overall_score, 0) / data.length) : 0;
        const high = data.filter(e => e.overall_score >= 90).length;
        
        return [
            { label: 'Total Assessments', value: total, icon: DocumentTextIcon, color: 'text-slate-600', bg: 'bg-slate-100' },
            { label: 'Average Score', value: `${avg}%`, icon: ChartBarIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'High Performers', value: high, icon: AcademicCapIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Success Rate', value: '94%', icon: ArrowTrendingUpIcon, color: 'text-blue-600', bg: 'bg-blue-50' }
        ];
    }, [evaluations]);

    const filteredEvaluations = evaluations.data.filter(item => 
        item.employee?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-normal text-slate-900 tracking-normal leading-none">Performance Hub</h2>
                    <p className="text-[9px] text-slate-400 font-normal uppercase tracking-[0.2em] mt-1.5">Enterprise Evaluation Records</p>
                </div>
            }
        >
            <Head title="Evaluation Dashboard" />

            <div className="max-w-[1600px] mx-auto py-4 px-4 sm:px-6 lg:px-5 space-y-4">
                {/* Top Action Bar */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-slate-900 rounded-xl shadow-lg shadow-slate-200">
                            <DocumentMagnifyingGlassIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-normal text-slate-900 tracking-normal leading-none">Assessments</h1>
                            <p className="text-[10px] text-slate-400 font-normal uppercase tracking-[0.2em] mt-1">Live Employee Performance Monitoring</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative group">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search records..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-white border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-[11px] font-normal text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all w-full md:w-56 shadow-sm placeholder:text-slate-400"
                            />
                        </div>
                        {['admin', 'hr', 'manager'].includes(user.role) && (
                            <Link
                                href={route('evaluations.create')}
                                className="bg-primary hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 text-white px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 text-[10px] font-normal uppercase tracking-normal"
                            >
                                <PlusIcon className="w-3.5 h-3.5" />
                                Create Evaluation
                            </Link>
                        )}
                    </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
                            <div className={`p-2.5 ${stat.bg} rounded-lg transition-transform group-hover:scale-110`}>
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-0.5">{stat.label}</p>
                                <p className="text-lg font-normal text-slate-900 tracking-normal">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Table Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
                    <div className="px-5 py-3.5 bg-slate-50/30 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <QueueListIcon className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <h3 className="text-[10px] font-normal text-slate-800 uppercase tracking-normal">Performance Catalog</h3>
                        </div>
                        <span className="text-[9px] font-normal text-slate-400 uppercase tracking-normal bg-white px-2 py-0.5 rounded-full border border-slate-100">{filteredEvaluations.length} records detected</span>
                    </div>

                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    <th className="w-[280px] px-5 py-2.5 text-[9px] font-normal uppercase tracking-normal border-r border-slate-800">Employee Identity</th>
                                    <th className="px-5 py-2.5 text-[9px] font-normal uppercase tracking-normal border-r border-slate-800 text-center">Organizational Unit</th>
                                    <th className="w-[140px] px-5 py-2.5 text-[9px] font-normal uppercase tracking-normal border-r border-slate-800 text-center">Review Period</th>
                                    <th className="w-[120px] px-5 py-2.5 text-[9px] font-normal uppercase tracking-normal border-r border-slate-800 text-center">Score</th>
                                    <th className="w-[120px] px-5 py-2.5 text-[9px] font-normal uppercase tracking-normal text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredEvaluations.map((evalItem) => (
                                    <tr key={evalItem.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-5 py-2">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    src={evalItem.employee?.employee_image || evalItem.employee?.image}
                                                    name={evalItem.employee?.name}
                                                    size="sm"
                                                    className="ring-2 ring-slate-100 group-hover:ring-primary/20 transition-all"
                                                />
                                                <div className="min-w-0">
                                                    <div className="text-[11px] font-normal text-slate-900 leading-none truncate tracking-normal">{evalItem.employee?.name}</div>
                                                    <div className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mt-1.5 truncate">{evalItem.employee?.designation || 'Staff Member'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-2 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-[9px] font-normal text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg uppercase tracking-normal">{evalItem.employee?.company?.name || 'Unit'}</span>
                                                <span className="text-[8px] font-normal text-slate-400 uppercase tracking-normal mt-1 leading-none">{evalItem.employee?.department?.name || 'General'}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-2 text-center">
                                            <div className="inline-flex items-center gap-1.5 text-[9px] font-normal text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
                                                <CalendarIcon className="w-3 h-3 text-indigo-400" />
                                                {getMonthName(evalItem.month)} '{evalItem.year.toString().slice(-2)}
                                            </div>
                                        </td>
                                        <td className="px-5 py-2 text-center">
                                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border shadow-sm transition-all ${getScoreColor(evalItem.overall_score)}`}>
                                                <SparklesIcon className="w-2.5 h-2.5" />
                                                <span className="text-[10px] font-normal">{evalItem.overall_score}%</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-2 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link
                                                    href={route('evaluations.show', evalItem.id)}
                                                    className="p-1.5 bg-slate-50 text-slate-400 hover:bg-primary hover:text-white rounded-md border border-slate-200 transition-all shadow-sm active:scale-90"
                                                    title="View"
                                                >
                                                    <DocumentTextIcon className="w-4 h-4" />
                                                </Link>
                                                {['admin', 'hr', 'manager'].includes(user.role) && (
                                                    <Link
                                                        href={route('evaluations.edit', evalItem.id)}
                                                        className="p-1.5 bg-slate-50 text-slate-400 hover:bg-amber-500 hover:text-white rounded-md border border-slate-200 transition-all shadow-sm active:scale-90"
                                                        title="Edit"
                                                    >
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                    </Link>
                                                )}
                                                {['admin', 'hr'].includes(user.role) && (
                                                    <button
                                                        onClick={() => handleDelete(evalItem.id)}
                                                        className="p-1.5 bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white rounded-md border border-slate-200 transition-all shadow-sm active:scale-90"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredEvaluations.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-5 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-20">
                                                <DocumentMagnifyingGlassIcon className="w-10 h-10 text-slate-400" />
                                                <p className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em]">No valid matches found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - More Compact */}
                    {evaluations.links && evaluations.links.length > 3 && (
                        <div className="bg-white px-5 py-2.5 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">
                                PAGE: <span className="text-slate-900">{evaluations.from}-{evaluations.to}</span> / TOTAL {evaluations.total}
                            </p>
                            <div className="flex items-center gap-1">
                                {evaluations.links.map((link, i) => (
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={`min-w-[28px] h-7 flex items-center justify-center rounded-lg text-[9px] font-normal transition-all ${link.active ? 'bg-primary text-white shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-white hover:text-primary'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="min-w-[28px] h-7 flex items-center justify-center rounded-lg text-[9px] font-normal text-slate-300 bg-slate-50 border border-transparent cursor-not-allowed opacity-50"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
