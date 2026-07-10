import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { FaFileContract, FaCalendarAlt, FaClock, FaExclamationTriangle, FaEye, FaArrowRight } from 'react-icons/fa';

export default function Expiring({ expiringDocuments, days }) {
    const [filterDays, setFilterDays] = useState(days);

    const handleFilterChange = (newDays) => {
        setFilterDays(newDays);
        router.get(route('documents.expiring'), { days: newDays }, { preserveState: true });
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-GB', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    });

    const getDaysUntilExpiry = (expiryDate) => {
        const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return days;
    };

    const getUrgencyStyles = (daysLeft) => {
        if (daysLeft <= 7) return 'bg-rose-50 text-rose-600 border-rose-100';
        if (daysLeft <= 14) return 'bg-amber-50 text-amber-600 border-amber-100';
        return 'bg-primary/5 text-primary border-primary/10';
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-normal text-slate-900 uppercase">Critical Expiration Monitoring</h2>}>
            <Head title="Expiring Assets" />

            <div className="min-h-screen bg-slate-50/50 py-4">
                <div className="w-full mx-auto px-4 space-y-4">

                    {/* Hero Header */}
                    <div className="bg-slate-900 rounded-lg p-5 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <FaCalendarAlt className="text-7xl" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-xl font-normal mb-1 uppercase tracking-normal">Expiring Asset Registry</h1>
                                <p className="text-slate-400 max-w-xl text-[11px] leading-snug uppercase font-normal tracking-normal opacity-80">
                                    Real-time monitoring of personnel documentation approaching technical expiration thresholds.
                                </p>
                            </div>
                            <div className="flex bg-white/5 p-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                                {[7, 14, 30, 60, 90].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => handleFilterChange(d)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-normal uppercase tracking-normal transition-all ${filterDays === d
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {d} Days
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Critical (7D)', count: expiringDocuments.filter(d => getDaysUntilExpiry(d.expiry_date) <= 7).length, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                            { label: 'Urgent (14D)', count: expiringDocuments.filter(d => getDaysUntilExpiry(d.expiry_date) <= 14).length, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                            { label: 'Pending (30D)', count: expiringDocuments.filter(d => getDaysUntilExpiry(d.expiry_date) <= 30).length, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                            { label: 'Total Tracked', count: expiringDocuments.length, color: 'text-primary', bg: 'bg-primary/10' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                                <div>
                                    <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">{stat.label}</p>
                                    <h3 className="text-xl font-normal text-slate-900 tabular-nums mt-1">{stat.count}</h3>
                                </div>
                                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center border border-white group-hover:scale-110 transition-transform`}>
                                    <FaClock size={16} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Documents Registry */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/30 text-slate-400 text-[10px] uppercase tracking-[0.2em] border-b border-slate-100">
                                        <th className="px-5 py-3 font-normal">Personnel Identifier</th>
                                        <th className="px-5 py-3 font-normal">Asset Nomenclature</th>
                                        <th className="px-5 py-3 font-normal text-center">Expiration Date</th>
                                        <th className="px-5 py-3 font-normal text-center">Remaining Cycle</th>
                                        <th className="px-5 py-3 font-normal text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {expiringDocuments.length > 0 ? (
                                        expiringDocuments.map((doc) => {
                                            const daysLeft = getDaysUntilExpiry(doc.expiry_date);
                                            return (
                                                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-normal text-[10px] uppercase group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                                {doc.employee?.name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="text-[11px] font-normal text-slate-800 uppercase tracking-normal">{doc.employee?.name}</div>
                                                                <div className="text-[9px] text-slate-400 font-normal uppercase tracking-normal opacity-60">{doc.employee?.employee_code || 'EMP-ID'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="text-[11px] font-normal text-slate-700 uppercase tracking-normal">{doc.document_name}</div>
                                                        <div className="text-[9px] text-slate-400 font-normal uppercase tracking-normal opacity-60">{doc.document_type?.name || 'GENERIC ASSET'}</div>
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-normal tabular-nums">
                                                            <FaCalendarAlt size={10} className="text-slate-400" />
                                                            {formatDate(doc.expiry_date)}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-normal uppercase tracking-normal border shadow-sm ${getUrgencyStyles(daysLeft)}`}>
                                                            <FaExclamationTriangle size={10} />
                                                            {daysLeft} {daysLeft === 1 ? 'Day' : 'Days'} Remaining
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-right">
                                                        <a
                                                            href={route('employees.documents.index', doc.employee_id)}
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-normal uppercase tracking-normal hover:bg-primary transition-all active:scale-95 shadow-sm group/btn"
                                                        >
                                                            <FaEye size={10} className="group-hover/btn:scale-110 transition-transform" /> 
                                                            Analyze <FaArrowRight size={8} />
                                                        </a>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-5 py-20 text-center">
                                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100 opacity-50">
                                                    <FaFileContract className="text-slate-200" />
                                                </div>
                                                <p className="text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em]">Zero Expirations Detected</p>
                                                <p className="text-[9px] text-slate-300 font-normal uppercase mt-1">All documentation is currently synchronized within the {filterDays} day threshold.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
