import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { FiArrowLeft, FiFilter, FiDownload, FiFileText, FiTable, FiDollarSign, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function Advance({ advances, summary, startDate, endDate, status }) {
    const today = new Date().toLocaleDateString('en-CA');
    const [filters, setFilters] = useState({
        start_date: startDate || '',
        end_date: endDate || '',
        status: status || ''
    });

    const handleFilter = () => {
        router.get(route('reports.advance'), filters, { preserveState: true });
    };

    const handleExport = (type) => {
        const queryParams = new URLSearchParams(filters).toString();
        const baseUrl = route(`reports.advance.export.${type}`);
        window.open(`${baseUrl}?${queryParams}`, '_blank');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'text-sky-600 bg-sky-50 border-sky-100';
            case 'repaid': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'pending': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'rejected': return 'text-rose-600 bg-rose-50 border-rose-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800 tracking-normal">Advance Analytics</h2>}>
            <Head title="Advance Report" />

            <div className="w-full mx-auto p-6 space-y-6 bg-slate-50 min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={route('reports.index')} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-all shadow-sm">
                            <FiArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-normal text-slate-900">Salary Advance Report</h1>
                            <p className="text-sm text-slate-500 mt-0.5 font-normal">Track short-term employee advances, approval states, and repayment status.</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => handleExport('pdf')} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-normal uppercase tracking-normal hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center gap-2">
                            <FiFileText size={14} /> Export PDF
                        </button>
                        <button onClick={() => handleExport('excel')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-normal uppercase tracking-normal hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2">
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
                        <h3 className="text-base font-normal text-slate-800">Filter Parameters</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">Start Date</label>
                            <input
                                type="date"
                                value={filters.start_date}
                                max={today}
                                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                                className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-sm bg-slate-50/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">End Date</label>
                            <input
                                type="date"
                                value={filters.end_date}
                                max={today}
                                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                                className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-sm bg-slate-50/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-sm bg-slate-50/50"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="repaid">Repaid</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div>
                            <button
                                onClick={handleFilter}
                                className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-normal hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                            >
                                Generate View
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiDollarSign size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Total Disbursed</div>
                                <div className="text-xl font-normal text-slate-800">{Number(summary.total_amount).toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiClock size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Pending Requests</div>
                                <div className="text-xl font-normal text-blue-600">{summary.pending || 0}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiCheckCircle size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Total Repaid</div>
                                <div className="text-xl font-normal text-emerald-600">{summary.repaid || 0}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiFileText size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Active Approved</div>
                                <div className="text-xl font-normal text-slate-800">{summary.approved || 0}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Advance Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-base font-normal text-slate-800">Advance Records</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Employee</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-right">Amount</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-center">Request Date</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Purpose</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Status</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-right">Repayment</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-50">
                                {advances && advances.length > 0 ? (
                                    advances.map((adv) => (
                                        <tr key={adv.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-normal text-slate-500 border border-slate-200">
                                                        {adv.employee?.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="text-sm font-normal text-slate-700">{adv.employee?.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-normal text-slate-900">
                                                {Number(adv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-normal text-slate-500">
                                                {new Date(adv.request_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs text-slate-500 font-normal line-clamp-1 max-w-xs">{adv.purpose}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 text-[10px] font-normal rounded-lg border uppercase tracking-normal ${getStatusColor(adv.status)}`}>
                                                    {adv.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-slate-500 text-right">
                                                {adv.repayment_date ? new Date(adv.repayment_date).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <p className="text-slate-400 text-sm font-normal">No advance records found for the selected period.</p>
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
