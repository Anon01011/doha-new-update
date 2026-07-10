import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ auditLogs, modelTypes, users, filters }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleFilter = (key, value) => {
        const params = { ...filters, [key]: value };
        router.get(route('audit-logs.index'), params, { preserveState: true });
    };

    const formatDate = (date) => new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });

    const getEventStyles = (event) => {
        if (event === 'created') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        if (event === 'updated') return 'bg-primary/10 text-primary border-primary/20';
        if (event === 'deleted') return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
        return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-gray-800">Audit Logs</h2>}>
            <Head title="Audit Logs" />

            <div className="max-w-[1600px] mx-auto p-4 lg:p-5 space-y-4">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-normal text-gray-900 tracking-normal leading-none">Audit Trail</h1>
                        <p className="text-gray-400 text-[10px] font-normal mt-1 uppercase tracking-[0.2em]">Live system activity monitoring</p>
                    </div>
                    
                    {/* Compact Search/Filter Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={filters.event || ''}
                            onChange={(e) => handleFilter('event', e.target.value)}
                            className="bg-white border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] font-normal focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all w-32"
                        >
                            <option value="">All Events</option>
                            <option value="created">Created</option>
                            <option value="updated">Updated</option>
                            <option value="deleted">Deleted</option>
                        </select>

                        <select
                            value={filters.auditable_type || ''}
                            onChange={(e) => handleFilter('auditable_type', e.target.value)}
                            className="bg-white border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] font-normal focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all w-40"
                        >
                            <option value="">All Models</option>
                            {modelTypes.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>

                        <select
                            value={filters.user_id || ''}
                            onChange={(e) => handleFilter('user_id', e.target.value)}
                            className="bg-white border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] font-normal focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all w-40"
                        >
                            <option value="">All Users</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>

                        <div className="relative">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFilter('search', search)}
                                placeholder="Search logs..."
                                className="bg-white border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-[11px] font-normal focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all w-48 placeholder:text-gray-400"
                            />
                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Logs Table Container */}
                <div className="glass-card premium-shadow rounded-xl border border-white/40 overflow-hidden">
                    <div className="overflow-x-auto max-h-[calc(100vh-220px)] scrollbar-hide">
                        <table className="w-full border-collapse table-fixed">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-gray-900 text-white">
                                    <th className="w-[180px] px-4 py-2.5 text-left text-[10px] font-normal uppercase tracking-normal border-r border-gray-800">Timestamp</th>
                                    <th className="px-4 py-2.5 text-left text-[10px] font-normal uppercase tracking-normal border-r border-gray-800">Actor / Executed By</th>
                                    <th className="w-[120px] px-4 py-2.5 text-left text-[10px] font-normal uppercase tracking-normal border-r border-gray-800">Action</th>
                                    <th className="px-4 py-2.5 text-left text-[10px] font-normal uppercase tracking-normal border-r border-gray-800">Target Resource</th>
                                    <th className="w-[140px] px-4 py-2.5 text-left text-[10px] font-normal uppercase tracking-normal border-r border-gray-800">Origin IP</th>
                                    <th className="w-[100px] px-4 py-2.5 text-right text-[10px] font-normal uppercase tracking-normal">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white/50">
                                {auditLogs.data.length > 0 ? (
                                    auditLogs.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-white transition-colors group">
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <div className="text-[11px] font-normal text-gray-900">{formatDate(log.created_at).split(',')[0]}</div>
                                                <div className="text-[9px] font-normal text-gray-400 mt-0.5">{formatDate(log.created_at).split(',')[1]}</div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-normal text-[9px] shadow-sm group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                                        {log.user?.name ? log.user.name.substring(0, 2).toUpperCase() : 'SY'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-[11px] font-normal text-gray-900 truncate tracking-normal">{log.user?.name || 'System Auto'}</div>
                                                        <div className="text-[9px] font-normal text-gray-400 truncate tracking-normal leading-none mt-0.5">{log.user?.email || 'Background Engine'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-normal uppercase border shadow-sm ${getEventStyles(log.event)}`}>
                                                    {log.event}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <div className="text-[11px] font-normal text-gray-900">{log.auditable_type?.split('\\').pop()}</div>
                                                <div className="text-[9px] font-normal text-gray-400 mt-0.5 flex items-center gap-1.5">
                                                    <span className="opacity-50">OBJECT ID</span>
                                                    <span className="bg-gray-100 text-gray-600 px-1 rounded font-normal tracking-normal">{log.auditable_id}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <code className="text-[10px] font-mono font-normal text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                                                    {log.ip_address}
                                                </code>
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <Link
                                                    href={route('audit-logs.show', log.id)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 hover:bg-primary hover:text-white text-gray-600 text-[9px] font-normal uppercase tracking-normal rounded border border-gray-200 transition-all active:scale-95"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-16 text-center text-gray-400 font-normal text-sm bg-gray-50/20">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-white shadow-inner flex items-center justify-center">
                                                    <svg className="w-6 h-6 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                </div>
                                                <span className="text-[11px] font-normal uppercase tracking-normal">No activity found in this period</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - More Compact */}
                    {auditLogs.links && auditLogs.links.length > 3 && (
                        <div className="bg-white/80 backdrop-blur-md border-t border-gray-100 px-4 py-2.5 flex items-center justify-between">
                            <div className="text-[9px] font-normal text-gray-400 uppercase tracking-normal">
                                PAGE RECORDS: {auditLogs.from}-{auditLogs.to} <span className="mx-1 opacity-30">/</span> TOTAL {auditLogs.total}
                            </div>
                            <div className="flex gap-1">
                                {auditLogs.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`px-2 py-1 rounded text-[9px] font-normal uppercase tracking-normal transition-all active:scale-95 ${link.active
                                                ? 'bg-primary text-white shadow-sm'
                                                : link.url
                                                    ? 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                                                    : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed opacity-50'
                                            }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
