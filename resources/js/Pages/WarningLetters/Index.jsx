import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { FiAlertTriangle, FiSearch, FiChevronRight, FiInbox } from 'react-icons/fi';
import Avatar from '@/Components/Avatar';

export default function Index({ warningLetters, filters, userRole }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('warning-letters.index'), { search: searchTerm, type: filters.type }, { preserveState: true });
    };

    const formatDate = (date) => date ? new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }) : 'N/A';

    const getTypeColor = (type) => {
        const t = type?.toLowerCase() || '';
        if (t.includes('strict') || t.includes('cause')) return 'bg-rose-50 text-rose-700 border-rose-100';
        if (t.includes('termination')) return 'bg-slate-900 text-white border-slate-900';
        return 'bg-amber-50 text-amber-700 border-amber-100';
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-rose-50 rounded-lg">
                        <FiAlertTriangle className="h-5 w-5 text-rose-600" />
                    </div>
                    <h2 className="text-lg font-normal text-slate-800 tracking-normal">
                        {userRole === 'employee' ? 'My Warning Letters' : 'Warning Letters'}
                    </h2>
                </div>
            }
        >
            <Head title="Warning Letters" />

            <div className="max-w mx-auto space-y-4">
                {/* Search & Actions */}
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
                                placeholder="Search records..."
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

                    <div className="flex items-center gap-2 px-3 py-1.5 border-l border-slate-100 hidden md:flex">
                        <div className="text-right">
                            <div className="text-[10px] font-normal text-slate-400 uppercase tracking-normal leading-none">Total Notifications</div>
                            <div className="text-lg font-normal text-slate-800 leading-none mt-1">{warningLetters.total}</div>
                        </div>
                    </div>
                </div>

                {/* Compact List */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                    {warningLetters.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-5 py-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal">Recipient Details</th>
                                        <th className="px-5 py-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal text-center">Reference</th>
                                        <th className="px-5 py-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal">Subject & Severity</th>
                                        <th className="px-5 py-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal">Issue Date</th>
                                        <th className="px-5 py-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal text-right">View</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {warningLetters.data.map((letter) => (
                                        <tr key={letter.id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        src={letter.employee?.employee_image}
                                                        name={letter.employee?.name}
                                                        size="sm"
                                                    />
                                                    <div>
                                                        <div className="text-xs font-normal text-slate-800 leading-tight">{letter.employee?.name}</div>
                                                        <div className="text-[10px] font-normal text-slate-400 uppercase">{letter.employee?.employee_code}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className="text-[10px] font-normal text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                                    #{letter.id.toString().padStart(5, '0')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="text-xs font-normal text-slate-700 mb-1">{letter.subject}</div>
                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-normal uppercase tracking-normal border ${getTypeColor(letter.type)}`}>
                                                    {letter.type}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="text-[10px] font-normal text-slate-500 tabular-nums">{formatDate(letter.sent_at || letter.created_at)}</div>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <Link
                                                    href={route('warning-letters.show', letter.id)}
                                                    className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 hover:bg-primary hover:text-white rounded-lg transition-all active:scale-90 text-slate-400 group-hover:bg-primary group-hover:text-white"
                                                >
                                                    <FiChevronRight className="w-4 h-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <FiInbox className="w-6 h-6 text-slate-200" />
                            </div>
                            <h4 className="text-slate-800 font-normal text-sm tracking-normal uppercase">Inbox Empty</h4>
                            <p className="text-slate-400 text-[11px] mt-1 font-normal uppercase tracking-normal">No disciplinary records found</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {warningLetters.links.length > 3 && (
                    <div className="flex justify-center gap-1.5 pt-2">
                        {warningLetters.links.map((link, i) => (
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
            </div>
        </AuthenticatedLayout>
    );
}
