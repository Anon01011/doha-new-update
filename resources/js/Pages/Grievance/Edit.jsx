import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';
import { Head, useForm, Link } from '@inertiajs/react';
import {
    FiArrowLeft, FiSave, FiAlertCircle, FiShield, FiUser, FiInfo, FiCheckCircle
} from 'react-icons/fi';

export default function Edit({ grievance, employees, userRole = 'employee', categories = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        employee_id: grievance.employee_id || '',
        category: grievance.category || '',
        priority: grievance.priority || 'low',
        subject: grievance.subject || '',
        description: grievance.description || '',
        status: grievance.status || 'open',
        resolution_notes: grievance.resolution_notes || '',
        resolution_action: grievance.resolution_action || '',
        is_confidential: grievance.is_confidential || false,
    });

    const isEmployee = userRole === 'employee';

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('grievances.update', grievance.id));
    };

    const priorityColors = {
        low: 'bg-slate-100 text-slate-600 border-slate-200',
        medium: 'bg-indigo-100 text-indigo-600 border-indigo-200',
        high: 'bg-amber-100 text-amber-600 border-amber-200',
        urgent: 'bg-rose-100 text-rose-600 border-rose-200',
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Edit Case - ${grievance.id}`} />

            <div className="min-h-screen bg-[#F8FAFC]">
                {/* Compact Header */}
                <div className="bg-white border-b border-slate-200/60 sticky top-16 z-[40]">
                    <div className="max-w mx-auto px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={route('grievances.show', grievance.id)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                                <FiArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-lg font-normal text-slate-800 leading-tight">Edit Case</h1>
                                <p className="text-[11px] font-normal text-slate-400 tracking-normal uppercase">Reference: #{grievance.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href={route('grievances.show', grievance.id)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-normal uppercase hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Cancel
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="max-w mx-auto p-6 lg:p-10">
                    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 items-start">

                        {/* Primary Content Area */}
                        <div className="flex-1 w-full space-y-6">

                            {/* 1. Identity Context */}
                            <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden p-6">
                                <div className="flex items-center gap-2 mb-5">
                                    <FiUser className="text-primary w-4 h-4" />
                                    <h2 className="text-xs font-normal text-slate-400 uppercase tracking-[0.15em]">Reporter Info</h2>
                                </div>

                                {!isEmployee ? (
                                    <div className="space-y-1">
                                        <SearchableSelect
                                            id="employee_id"
                                            name="employee_id"
                                            value={data.employee_id}
                                            onChange={(e) => setData('employee_id', e.target.value)}
                                            options={employees?.map(emp => ({ value: emp.id, label: `${emp.name} (${emp.employee_code})` })) || []}
                                            placeholder="Select Employee"
                                        />
                                        {errors.employee_id && <p className="text-rose-500 text-[10px] font-normal mt-1 ml-1">{errors.employee_id}</p>}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 group opacity-75">
                                        <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-normal text-primary shadow-sm overflow-hidden flex-shrink-0">
                                            {grievance.employee?.employee_image ? (
                                                <img src={`/storage/${grievance.employee.employee_image}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-lg uppercase">{grievance.employee?.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-normal text-slate-800 truncate">{grievance.employee?.name}</p>
                                            <p className="text-[10px] font-normal text-slate-500 uppercase tracking-normal truncate">
                                                {grievance.employee?.employee_code} • {grievance.employee?.designation || 'Staff Member'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 2. Core Issue Details */}
                            <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm p-6 space-y-6">
                                <div className="flex items-center gap-2">
                                    <FiAlertCircle className="text-primary w-4 h-4" />
                                    <h2 className="text-xs font-normal text-slate-400 uppercase tracking-[0.15em]">Issue Parameters</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-normal text-slate-400 uppercase tracking-normal ml-1">Classification</label>
                                        <select
                                            className="w-full h-11 px-5 bg-slate-50 border-0 rounded-lg text-sm font-normal text-slate-700 outline-none focus:ring-2 focus:ring-primary transition-all"
                                            value={data.category} onChange={(e) => setData('category', e.target.value)} required
                                        >
                                            <option value="">Choose Category...</option>
                                            {categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-normal text-slate-400 uppercase tracking-normal ml-1">Urgency Level</label>
                                        <div className="flex gap-2">
                                            {['low', 'medium', 'high', 'urgent'].map((p) => (
                                                <button
                                                    key={p} type="button"
                                                    onClick={() => setData('priority', p)}
                                                    className={`flex-1 h-11 rounded-lg text-[10px] font-normal uppercase tracking-normal border-2 transition-all ${data.priority === p
                                                        ? priorityColors[p] + ' shadow-inner scale-[0.98]'
                                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[11px] font-normal text-slate-400 uppercase tracking-normal ml-1">Subject Header</label>
                                        <input
                                            type="text" value={data.subject}
                                            className="w-full h-11 px-5 bg-slate-50 border-0 rounded-lg text-sm font-normal text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                                            onChange={(e) => setData('subject', e.target.value)} placeholder="Summary of the grievance..." required
                                        />
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[11px] font-normal text-slate-400 uppercase tracking-normal ml-1">Detailed Description</label>
                                        <textarea
                                            rows="4" value={data.description}
                                            className="w-full p-5 bg-slate-50 border-0 rounded-lg text-sm font-normal text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all resize-none min-h-[120px]"
                                            onChange={(e) => setData('description', e.target.value)} placeholder="Describe the incident..." required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 3. Resolution (Management Only) */}
                            {!isEmployee && (
                                <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm p-6 space-y-6 animate-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-2">
                                        <FiCheckCircle className="text-emerald-600 w-4 h-4" />
                                        <h2 className="text-xs font-normal text-slate-400 uppercase tracking-[0.15em]">Management Resolution</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-normal text-slate-400 uppercase tracking-normal ml-1">Case Status</label>
                                            <select
                                                className="w-full h-11 px-5 bg-slate-50 border-0 rounded-lg text-sm font-normal text-slate-700 outline-none focus:ring-2 focus:ring-primary transition-all"
                                                value={data.status} onChange={(e) => setData('status', e.target.value)}
                                            >
                                                <option value="submitted">Submitted</option>
                                                <option value="under_review">Under Review</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="closed">Closed</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-normal text-slate-400 uppercase tracking-normal ml-1">Resolution Action</label>
                                            <input
                                                type="text" value={data.resolution_action}
                                                className="w-full h-11 px-5 bg-slate-50 border-0 rounded-lg text-sm font-normal text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                                                onChange={(e) => setData('resolution_action', e.target.value)} placeholder="Formal action taken..."
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[11px] font-normal text-slate-400 uppercase tracking-normal ml-1">Resolution Notes</label>
                                            <textarea
                                                rows="3" value={data.resolution_notes}
                                                className="w-full p-5 bg-slate-50 border-0 rounded-lg text-sm font-normal text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all resize-none min-h-[100px]"
                                                onChange={(e) => setData('resolution_notes', e.target.value)} placeholder="Explain the outcome..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Sidebar */}
                        <div className="lg:w-[320px] w-full space-y-6 lg:sticky lg:top-[88px]">

                            {/* Privacy Controls */}
                            <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm p-6 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FiShield className="text-primary w-4 h-4" />
                                    <h2 className="text-xs font-normal text-slate-400 uppercase tracking-[0.15em]">Privacy Settings</h2>
                                </div>

                                <div className="space-y-3">
                                    <label className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer ${data.is_confidential ? 'bg-indigo-50/50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-transparent text-slate-600 hover:border-slate-200'
                                        }`}>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-normal uppercase tracking-normal">Confidential</span>
                                            <span className="text-[9px] font-normal opacity-60">Visible to HR only</span>
                                        </div>
                                        <input
                                            type="checkbox" checked={data.is_confidential}
                                            onChange={(e) => setData('is_confidential', e.target.checked)}
                                            className="w-5 h-5 rounded-md border-0 bg-slate-200 checked:bg-primary transition-all cursor-pointer ring-0 focus:ring-0"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Update Button */}
                            <div className="bg-slate-900 rounded-lg shadow-2xl overflow-hidden text-white p-6 relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px]"></div>

                                <h3 className="text-[10px] font-normal uppercase tracking-[0.3em] text-white mb-6 flex items-center gap-2">
                                    <FiInfo className="w-3 h-3 text-white" /> Action Center
                                </h3>

                                <div className="space-y-2 relative z-10">
                                    <p className="text-[10px] font-normal text-white/50 leading-relaxed mb-6">
                                        Saving changes will update the case records and notify relevant stakeholders of any status changes.
                                    </p>

                                    <button
                                        type="submit" disabled={processing}
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-white text-slate-900 rounded-lg font-normal text-[11px] uppercase tracking-[0.15em] hover:bg-indigo-50 transition-all shadow-xl shadow-white/5 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {processing ? '...' : (
                                            <>
                                                <FiSave className="w-4 h-4" />
                                                Update Case
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
