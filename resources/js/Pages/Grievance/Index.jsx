import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { FiAlertCircle, FiSearch, FiFilter, FiPlus, FiEye, FiCheckCircle, FiClock, FiXCircle, FiMoreHorizontal } from 'react-icons/fi';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Avatar from '@/Components/Avatar';

export default function Index({ grievances, status, priority, search: initialSearch = '', userRole }) {
    const [searchTerm, setSearchTerm] = useState(initialSearch || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('grievances.index'), { search: searchTerm, status, priority }, { preserveState: true });
    };

    const formatDate = (date) => date ? new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }) : 'N/A';

    const getPriorityStyles = (p) => {
        const priority = p?.toLowerCase() || '';
        if (priority === 'urgent') return 'bg-rose-50 text-rose-700 border-rose-100';
        if (priority === 'high') return 'bg-orange-50 text-orange-700 border-orange-100';
        if (priority === 'medium') return 'bg-amber-50 text-amber-700 border-amber-100';
        return 'bg-slate-50 text-slate-700 border-slate-100';
    };

    const getStatusStyles = (s) => {
        const status = s?.toLowerCase() || '';
        if (status === 'resolved') return {
            bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            icon: <FiCheckCircle className="w-3 h-3" />
        };
        if (status === 'under_review' || status === 'in_progress') return {
            bg: 'bg-primary/5 text-indigo-700 border-primary/10',
            icon: <FiClock className="w-3 h-3" />
        };
        if (status === 'closed') return {
            bg: 'bg-slate-100 text-slate-600 border-slate-200',
            icon: <FiXCircle className="w-3 h-3" />
        };
        return {
            bg: 'bg-amber-50 text-amber-700 border-amber-100',
            icon: <FiAlertCircle className="w-3 h-3" />
        };
    };

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [selectedGrievanceId, setSelectedGrievanceId] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleDelete = (id) => {
        setSelectedGrievanceId(id);
        setConfirmingDeletion(true);
    };

    const confirmDeletion = () => {
        setProcessing(true);
        router.delete(route('grievances.destroy', selectedGrievanceId), {
            onFinish: () => {
                setProcessing(false);
                setConfirmingDeletion(false);
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/5 rounded-lg">
                        <FiAlertCircle className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-normal text-slate-800 tracking-normal">
                        {userRole === 'employee' ? 'My Grievance Cases' : 'Grievance Management'}
                    </h2>
                </div>
            }
        >
            <Head title="Grievances" />

            <div className="max-w mx-auto space-y-4">
                {/* Search & Statistics */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-3 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <form onSubmit={handleSearch} className="flex md:w-96 gap-2 w-full">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiSearch className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search cases by subject, description..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary transition-all font-normal text-sm text-slate-700 placeholder:text-slate-400"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-slate-100 text-slate-600 px-5 py-2 rounded-lg hover:bg-slate-200 font-normal text-xs transition-all active:scale-95"
                        >
                            Filter
                        </button>
                    </form>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                        <div className="hidden lg:block text-right pr-4 border-r border-slate-100">
                            <div className="text-[9px] font-normal text-slate-400 uppercase tracking-normal leading-none">Total Records</div>
                            <div className="text-base font-normal text-slate-800 leading-none mt-1">{grievances.total}</div>
                        </div>
                        <Link
                            href={route('grievances.create')}
                            className="bg-primary text-white px-5 py-2.5 rounded-lg text-xs font-normal uppercase tracking-normal hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <FiPlus className="w-4 h-4" />
                            {userRole === 'employee' ? 'New Submission' : 'Log New Case'}
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 items-center text-[10px] font-normal uppercase tracking-normal text-slate-400">
                    <FiFilter className="w-3 h-3" />
                    <span>Quick Status:</span>
                    <div className="flex gap-1">
                        {['submitted', 'under_review', 'resolved', 'closed'].map(s => (
                            <Link
                                key={s}
                                href={route('grievances.index', { status: status === s ? null : s, search: searchTerm, priority })}
                                className={`px-2.5 py-1 rounded-lg border transition-all ${status === s
                                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200'}`}
                            >
                                {s.replace('_', ' ')}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Compact List */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                    {grievances.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-5 py-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal">Case Origin</th>
                                        <th className="px-5 py-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal">Subject & Category</th>
                                        <th className="px-5 py-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal text-center">Priority</th>
                                        <th className="px-5 py-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal text-center">Status</th>
                                        <th className="px-5 py-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal">Date Reported</th>
                                        <th className="px-5 py-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {grievances.data.map((grievance) => {
                                        const statusStyle = getStatusStyles(grievance.status);
                                        return (
                                            <tr key={grievance.id} className="hover:bg-slate-50/40 transition-colors group">
                                                <td className="px-5 py-3">
                                                    {grievance.is_anonymous ? (
                                                        <div className="flex items-center gap-2 text-slate-400 font-normal text-[11px] italic">
                                                            <FiEye className="w-3 h-3 opacity-50" />
                                                            Anonymous Case
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <Avatar
                                                                src={grievance.employee?.employee_image}
                                                                name={grievance.employee?.name}
                                                                size="sm"
                                                            />
                                                            <div>
                                                                <div className="text-xs font-normal text-slate-800 leading-tight">{grievance.employee?.name}</div>
                                                                <div className="text-[9px] font-normal text-slate-400 uppercase">{grievance.employee?.employee_code}</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="text-xs font-normal text-slate-700 leading-tight mb-1 line-clamp-1">{grievance.subject}</div>
                                                    <div className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">{grievance.category || 'Standard'}</div>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-normal uppercase tracking-normal border ${getPriorityStyles(grievance.priority)}`}>
                                                        {grievance.priority || 'Low'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-normal uppercase tracking-normal border ${statusStyle.bg}`}>
                                                        {statusStyle.icon}
                                                        {grievance.status?.replace('_', ' ')}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="text-[10px] font-normal text-slate-500 tabular-nums">{formatDate(grievance.submitted_date || grievance.created_at)}</div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <Link
                                                            href={route('grievances.show', grievance.id)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-primary hover:text-white rounded-lg transition-all active:scale-90 text-[10px] font-normal text-slate-600 group-hover:bg-primary group-hover:text-white"
                                                        >
                                                            <FiEye className="w-3.5 h-3.5" />
                                                            View
                                                        </Link>

                                                        {userRole !== 'employee' && (
                                                            <div className="relative group/menu">
                                                                <button className="p-1.5 bg-slate-50 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                                                                    <FiMoreHorizontal className="w-4 h-4" />
                                                                </button>
                                                                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-100 py-2 z-20 invisible group-hover/menu:visible opacity-0 group-hover/menu:opacity-100 transition-all scale-95 group-hover/menu:scale-100 origin-top-right">
                                                                    <Link
                                                                        href={route('grievances.edit', grievance.id)}
                                                                        className="flex items-center gap-2 px-3 py-2 text-[10px] font-normal text-slate-600 hover:bg-slate-50 transition-colors uppercase"
                                                                    >
                                                                        Edit Case
                                                                    </Link>
                                                                    {(userRole === 'admin' || userRole === 'hr') && (
                                                                        <button
                                                                            onClick={() => handleDelete(grievance.id)}
                                                                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-[10px] font-normal text-rose-500 hover:bg-rose-50 transition-colors uppercase"
                                                                        >
                                                                            Delete Case
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <FiAlertCircle className="w-6 h-6 text-slate-200" />
                            </div>
                            <h4 className="text-slate-800 font-normal text-sm tracking-normal uppercase">Case Log Empty</h4>
                            <p className="text-slate-400 text-[11px] mt-1 font-normal uppercase tracking-normal">No grievance records match your criteria</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {grievances.links.length > 3 && (
                    <div className="flex justify-center gap-1.5 pt-2">
                        {grievances.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`h-8 px-3 flex items-center justify-center rounded-lg text-[10px] font-normal transition-all ${link.active
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
                                    } ${!link.url && 'opacity-30 cursor-not-allowed'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
                <ConfirmationModal
                    show={confirmingDeletion}
                    title="Delete Grievance Case"
                    message="Are you sure you want to delete this grievance case? This action cannot be undone."
                    onConfirm={confirmDeletion}
                    onClose={() => setConfirmingDeletion(false)}
                    type="danger"
                    processing={processing}
                />
            </div>
        </AuthenticatedLayout>
    );
}
