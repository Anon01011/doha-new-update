import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Show({ auditLog }) {
    const formatDate = (date) => new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });

    const getEventConfig = (event) => {
        if (event === 'created') return { color: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
        if (event === 'updated') return { color: 'primary', bg: 'bg-primary', text: 'text-primary', badge: 'bg-primary/10 text-primary border-primary/20' };
        if (event === 'deleted') return { color: 'rose', bg: 'bg-rose-500', text: 'text-rose-700', badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20' };
        return { color: 'slate', bg: 'bg-slate-500', text: 'text-slate-700', badge: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
    };

    const getChanges = () => {
        const changes = [];
        if (auditLog.event === 'updated' && auditLog.old_values && auditLog.new_values) {
            Object.keys(auditLog.new_values).forEach(key => {
                const oldVal = auditLog.old_values[key];
                const newVal = auditLog.new_values[key];
                if (oldVal !== newVal && key !== 'updated_at') {
                    changes.push({ field: key, old: oldVal, new: newVal });
                }
            });
        }
        return changes;
    };

    const formatValue = (val) => {
        if (val === null || val === undefined || val === '') return <span className="text-gray-400 italic">Empty or unassigned</span>;
        if (typeof val === 'boolean') return val ? 'Yes' : 'No';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
    };

    const formatFieldName = (field) => {
        return field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const changes = getChanges();
    const config = getEventConfig(auditLog.event);

    return (
        <AuthenticatedLayout header={
            <div>
                <h2 className="text-xl font-normal text-gray-900 tracking-normal leading-none">Audit Entry Details</h2>
                <p className="text-[9px] font-normal text-gray-400 uppercase tracking-[0.2em] mt-1.5">Historical Snapshot Record</p>
            </div>
        }>
            <Head title={`Audit Log #${auditLog.id}`} />

            <div className="max-w-[1600px] mx-auto p-4 lg:p-5 space-y-4">
                {/* Top Action Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${config.bg} animate-pulse`}></div>
                        <span className="text-[10px] font-normal text-gray-900 uppercase tracking-normal">Live Record Analysis</span>
                    </div>
                    <Link
                        href={route('audit-logs.index')}
                        className="px-3 py-1.5 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-normal rounded-lg text-[10px] transition-all shadow-sm flex items-center gap-2 active:scale-95 uppercase tracking-normal"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Return to Activity logs
                    </Link>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                    {/* Log Metadata Sidebar */}
                    <div className="xl:col-span-4 flex flex-col gap-5">
                        <div className="bg-white premium-shadow rounded-2xl border border-gray-100 p-5 flex flex-col">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                                <h3 className="text-[10px] font-normal text-gray-400 uppercase tracking-normal flex items-center gap-2">
                                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Technical Header
                                </h3>
                                <span className="text-[9px] font-normal bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200 tracking-normal">ID: {auditLog.id}</span>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-normal text-gray-400 uppercase tracking-normal mb-2.5">Executed By</p>
                                    <div className="flex items-center gap-3 p-2.5 bg-gray-50/50 rounded-xl border border-gray-100">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-normal text-[10px] shadow-sm">
                                            {auditLog.user?.name ? auditLog.user.name.substring(0, 2).toUpperCase() : 'SY'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-normal text-gray-900 tracking-normal leading-none truncate">{auditLog.user?.name || 'System Engine'}</p>
                                            <p className="text-[9px] font-normal text-gray-400 mt-1 truncate">{auditLog.user?.email || 'Automated Background Task'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-2.5 bg-gray-50/50 rounded-xl border border-gray-100">
                                        <p className="text-[9px] font-normal text-gray-400 uppercase tracking-normal mb-1">Occurred At</p>
                                        <p className="text-[11px] font-normal text-gray-800 leading-tight">{formatDate(auditLog.created_at)}</p>
                                    </div>
                                    <div className="p-2.5 bg-gray-50/50 rounded-xl border border-gray-100">
                                        <p className="text-[9px] font-normal text-gray-400 uppercase tracking-normal mb-1">Event Type</p>
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-normal uppercase inline-block border shadow-sm ${config.badge}`}>
                                            {auditLog.event}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-2.5 bg-gray-50/50 rounded-xl border border-gray-100">
                                    <p className="text-[9px] font-normal text-gray-400 uppercase tracking-normal mb-2">Target Resource</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-normal text-gray-900 tracking-normal">{auditLog.auditable_type?.split('\\').pop()}</span>
                                        <span className="text-[9px] font-normal bg-white text-gray-400 px-1.5 py-0.5 rounded border border-gray-200">REF ID: {auditLog.auditable_id}</span>
                                    </div>
                                </div>

                                <div className="p-2.5 bg-gray-50/50 rounded-xl border border-gray-100">
                                    <p className="text-[9px] font-normal text-gray-400 uppercase tracking-normal mb-2">Network Origin</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-normal text-gray-400">IP ADDRESS</span>
                                            <code className="text-[10px] font-mono font-normal text-gray-600 bg-white px-1.5 py-0.5 rounded border border-gray-200">{auditLog.ip_address}</code>
                                        </div>
                                        <div className="space-y-1.5 pt-2 border-t border-gray-100">
                                            <span className="text-[9px] font-normal text-gray-400">AGENT STRING</span>
                                            <p className="text-[9px] font-normal text-gray-500 leading-tight bg-white p-2 rounded border border-gray-200 break-all">
                                                {auditLog.user_agent}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Changes Data Panel */}
                    <div className="xl:col-span-8 flex flex-col gap-5">
                        <div className="bg-white premium-shadow rounded-2xl border border-gray-100 p-5 flex-1">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                                <h3 className="text-[10px] font-normal text-gray-400 uppercase tracking-normal flex items-center gap-2">
                                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                    State Drift Analysis
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-[9px] font-normal text-gray-400 uppercase tracking-normal">Consistent State</span>
                                </div>
                            </div>
                            
                            {/* CREATED OR DELETED EVENT DATA */}
                            {(auditLog.event === 'created' || auditLog.event === 'deleted') && (
                                <div className="space-y-4">
                                    <div className="p-3.5 bg-gray-900 rounded-xl border border-gray-800 shadow-lg">
                                        <h4 className="text-xs font-normal text-white tracking-normal">
                                            {auditLog.event === 'created' ? 'INITIAL STATE MIGRATION' : 'PRE-DESTRUCTION CAPTURE'}
                                        </h4>
                                        <p className="text-[9px] font-normal text-gray-400 mt-1 uppercase tracking-normal opacity-60">
                                            {auditLog.event === 'created' 
                                                ? 'Resource attributes at the moment of insertion into system.' 
                                                : 'Full data record captured immediately prior to permanent deletion.'}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-gray-100 overflow-hidden bg-gray-50/20">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 [&>div:nth-child(n+4)]:border-t">
                                            {Object.entries((auditLog.event === 'created' ? auditLog.new_values : auditLog.old_values) || {}).map(([key, val]) => (
                                                <div key={key} className="p-3.5 flex flex-col gap-1 hover:bg-white transition-colors group">
                                                    <span className="text-[8px] font-normal text-gray-400 uppercase tracking-normal group-hover:text-primary transition-colors">{formatFieldName(key)}</span>
                                                    <span className="text-[10px] font-normal text-gray-900 break-all leading-tight tracking-normal">{formatValue(val)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* UPDATED EVENT DATA (DIFF LOGIC) */}
                            {auditLog.event === 'updated' && (
                                <div className="space-y-4">
                                    <div className="p-3.5 bg-gray-50/50 rounded-xl border border-gray-100">
                                        <h4 className="text-xs font-normal text-gray-900 tracking-normal uppercase tracking-normal">Attribute Transitions</h4>
                                        <p className="text-[9px] font-normal text-gray-400 mt-1 uppercase tracking-normal">Comparing former state against current records</p>
                                    </div>

                                    {changes.length > 0 ? (
                                        <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                                            <table className="w-full text-left border-collapse table-fixed">
                                                <thead>
                                                    <tr className="bg-gray-900 text-white">
                                                        <th className="font-normal text-[9px] uppercase tracking-normal px-4 py-3 w-1/4 border-r border-gray-800">Attribute</th>
                                                        <th className="font-normal text-[9px] uppercase tracking-normal px-4 py-3 w-3/8 border-r border-gray-800 bg-rose-500/10 text-rose-200">Former State</th>
                                                        <th className="font-normal text-[9px] uppercase tracking-normal px-4 py-3 w-3/8 bg-emerald-500/10 text-emerald-300">New State</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 bg-white">
                                                    {changes.map((change, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                            <td className="px-4 py-3 text-[10px] font-normal text-gray-900 align-top group-hover:text-primary transition-colors border-r border-gray-50">
                                                                {formatFieldName(change.field)}
                                                            </td>
                                                            <td className="px-4 py-3 text-[10px] font-normal text-gray-400 align-top bg-rose-50/10 border-r border-gray-50">
                                                                <span className="line-through decoration-rose-300/30 opacity-60">
                                                                    {formatValue(change.old)}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-[10px] font-normal text-emerald-800 align-top bg-emerald-50/10">
                                                                {formatValue(change.new)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 px-5 bg-gray-50/30 rounded-2xl border-2 border-dashed border-gray-100">
                                            <div className="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-300">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <h4 className="text-[10px] font-normal text-gray-900 tracking-normal mb-1 uppercase tracking-normal">No material drift detected</h4>
                                            <p className="text-[9px] font-normal text-gray-400 max-w-[200px] mx-auto leading-tight uppercase tracking-normal">
                                                All monitored attributes remained identical during this transaction.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
