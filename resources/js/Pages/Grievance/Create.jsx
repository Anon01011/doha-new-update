import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';
import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
    FiArrowLeft, FiPlus, FiSave, FiCheckCircle,
    FiInfo, FiAlertCircle, FiShield, FiUser, FiFileText, FiLink, FiX
} from 'react-icons/fi';

export default function Create({ employees = [], userRole = 'employee', settings, categories = [], authEmployeeId = null }) {
    const { appSettings } = usePage().props;

    const isEmployee = userRole === 'employee';
    const currentEmployee = useMemo(() => {
        if (!isEmployee || !authEmployeeId) return null;
        return employees.find(emp => emp.id === authEmployeeId);
    }, [employees, authEmployeeId, isEmployee]);

    const { data, setData, post, processing, errors } = useForm({
        employee_id: authEmployeeId || (employees.length > 0 ? employees[0].id : ''),
        category: '',
        priority: 'medium',
        subject: '',
        description: '',
        submitted_date: new Date().toISOString().split('T')[0],
        is_confidential: false,
        is_anonymous: false,
        attachments: [],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('grievances.store'));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setData('attachments', [...data.attachments, ...files]);
    };

    const removeFile = (index) => {
        const updatedFiles = [...data.attachments];
        updatedFiles.splice(index, 1);
        setData('attachments', updatedFiles);
    };

    const priorityColors = {
        low: 'bg-slate-100 text-slate-600 border-slate-200',
        medium: 'bg-indigo-100 text-primary border-indigo-200',
        high: 'bg-amber-100 text-amber-600 border-amber-200',
        urgent: 'bg-rose-100 text-rose-600 border-rose-200',
    };

    return (
        <AuthenticatedLayout>
            <Head title="Report Grievance" />

            <div className="min-h-screen bg-[#F8FAFC]">
                {/* Compact Header */}
                <div className="bg-white border-b border-slate-200/60 sticky top-16 z-[40]">
                    <div className="max-w mx-auto px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={route('grievances.index')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                                <FiArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-lg font-normal text-slate-800 leading-tight">Report Grievance</h1>
                                <p className="text-[11px] font-normal text-slate-400 tracking-normal uppercase">Submit Issue</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {data.is_anonymous && (
                                <span className="text-[10px] font-normal py-1 px-3 bg-primary/5 text-primary rounded-full border border-primary/10 uppercase tracking-normal flex items-center gap-1.5 shadow-sm">
                                    <FiShield className="w-3 h-3" /> Anonymous Mode
                                </span>
                            )}
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
                                    <h2 className="text-xs font-normal text-slate-400 uppercase tracking-[0.15em]">Borrower Info</h2>
                                </div>

                                {isEmployee && currentEmployee ? (
                                    <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 group">
                                        <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-normal text-primary shadow-sm overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                                            {currentEmployee.employee_image ? (
                                                <img src={`/storage/${currentEmployee.employee_image}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-lg uppercase">{currentEmployee.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-normal text-slate-800 truncate">{currentEmployee.name}</p>
                                            <p className="text-[10px] font-normal text-slate-500 uppercase tracking-normal truncate">
                                                {currentEmployee.employee_code} • {currentEmployee.designation || 'Staff Member'}
                                            </p>
                                        </div>
                                        <div className="ml-auto hidden sm:block">
                                            <span className="text-[10px] font-normal text-slate-300 uppercase tracking-normal leading-none">Verified Identity</span>
                                        </div>
                                    </div>
                                ) : (
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
                                            onChange={(e) => setData('description', e.target.value)} placeholder="Describe the incident or concern in detail..." required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 3. Evidence / Attachments */}
                            <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm p-6 space-y-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FiLink className="text-primary w-4 h-4" />
                                        <h2 className="text-xs font-normal text-slate-400 uppercase tracking-[0.15em]">Supporting Evidence</h2>
                                    </div>
                                    {settings?.require_evidence && (
                                        <span className="text-[9px] font-normal px-2 py-0.5 bg-rose-50 text-rose-500 rounded uppercase tracking-normal border border-rose-100">Mandatory</span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label className="relative flex flex-col items-center justify-center h-32 p-6 border-2 border-dashed border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-slate-50 transition-all group cursor-pointer">
                                        <input type="file" multiple className="hidden" onChange={handleFileChange} required={settings?.require_evidence && data.attachments.length === 0} />
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-primary transition-colors mb-2">
                                            <FiPlus className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-[0.05em] group-hover:text-primary">Click to Upload</span>
                                    </label>

                                    <div className="space-y-2 overflow-y-auto max-h-32 scrollbar-hide">
                                        {data.attachments.length > 0 ? (
                                            data.attachments.map((file, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 group animate-in fade-in slide-in-from-right-2 duration-300">
                                                    <div className="flex items-center gap-3 truncate">
                                                        <div className="p-1.5 bg-white rounded-lg border border-slate-100 text-indigo-500">
                                                            <FiFileText className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-xs font-normal text-slate-600 truncate">{file.name}</span>
                                                    </div>
                                                    <button type="button" onClick={() => removeFile(i)} className="p-1 hover:bg-rose-100 hover:text-rose-600 text-slate-300 rounded-lg transition-colors">
                                                        <FiX className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-1">
                                                <FiInfo className="w-6 h-6 opacity-30" />
                                                <p className="text-[10px] uppercase font-normal opacity-30 tracking-normal">No Documents</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar: Logic & Submit */}
                        <div className="lg:w-[320px] w-full space-y-6 lg:sticky lg:top-[88px]">

                            {/* Privacy Controls */}
                            <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm p-6 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FiShield className="text-primary w-4 h-4" />
                                    <h2 className="text-xs font-normal text-slate-400 uppercase tracking-[0.15em]">Privacy Settings</h2>
                                </div>

                                <div className="space-y-3">
                                    <label className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer ${data.is_confidential ? 'bg-primary/5/50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-transparent text-slate-600 hover:border-slate-200'
                                        }`}>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-normal uppercase tracking-normal">Confidential</span>
                                            <span className="text-[9px] font-normal opacity-60">Visible to HR only</span>
                                        </div>
                                        <input
                                            type="checkbox" checked={data.is_confidential}
                                            onChange={(e) => setData('is_confidential', e.target.checked)}
                                            className="w-5 h-5 rounded-md border-0 bg-slate-200 checked:bg-primary checked:hover:bg-indigo-700 transition-all cursor-pointer ring-0 focus:ring-0"
                                        />
                                    </label>

                                    {settings?.anonymous_allowed && isEmployee && (
                                        <label className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer ${data.is_anonymous ? 'bg-violet-50/50 border-violet-200 text-violet-700' : 'bg-slate-50 border-transparent text-slate-600 hover:border-slate-200'
                                            }`}>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-normal uppercase tracking-normal">Anonymous</span>
                                                <span className="text-[9px] font-normal opacity-60">Hide identity</span>
                                            </div>
                                            <input
                                                type="checkbox" checked={data.is_anonymous}
                                                onChange={(e) => setData('is_anonymous', e.target.checked)}
                                                className="w-5 h-5 rounded-md border-0 bg-slate-200 checked:bg-violet-600 checked:hover:bg-violet-700 transition-all cursor-pointer ring-0 focus:ring-0"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Resolution Roadmap (Visual Guide) */}
                            <div className="bg-slate-900 rounded-lg shadow-2xl overflow-hidden text-white p-6 relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/50/10 blur-[50px]"></div>

                                <h3 className="text-[10px] font-normal uppercase tracking-[0.3em] text-white mb-6 flex items-center gap-2">
                                    <FiCheckCircle className="w-3 h-3 text-white" /> Process Step
                                </h3>

                                <div className="space-y-5 relative z-10">
                                    {[
                                        { s: 'Submission', d: 'Your concern is logged securely.' },
                                        { s: 'Review', d: 'HR analyzes within 24 hours.' },
                                        { s: 'Resolution', d: 'Objective action is proposed.' }
                                    ].map((step, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-700 bg-slate-900 flex items-center justify-center text-[9px] font-normal text-white">{i + 1}</div>
                                                {i < 2 && <div className="w-px h-full bg-slate-700 mt-1"></div>}
                                            </div>
                                            <div className="pb-2">
                                                <h4 className="text-[11px] font-normal uppercase tracking-normal text-white">{step.s}</h4>
                                                <p className="text-[10px] font-normal text-white/60 leading-tight mt-0.5">{step.d}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-800">
                                    <button
                                        type="submit" disabled={processing}
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-white text-slate-900 rounded-lg font-normal text-[11px] uppercase tracking-[0.15em] hover:bg-primary/5 transition-all shadow-xl shadow-white/5 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {processing ? '...' : (
                                            <>
                                                <FiSave className="w-4 h-4" />
                                                Submit Grievance
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
