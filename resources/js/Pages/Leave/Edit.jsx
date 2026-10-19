import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import { FaCalendarAlt, FaUser, FaClipboardList, FaArrowLeft, FaSave, FaInfoCircle, FaPaperPlane, FaPaperclip, FaEye } from 'react-icons/fa';
import Avatar from '@/Components/Avatar';
import SearchableSelect from '@/Components/SearchableSelect';
import Lightbox from '@/Components/Lightbox';

export default function Edit({ leaveRequest, employees, leaveTypes, userRole = 'employee', settings }) {
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dateString.split('T')[0];
    };

    const { data, setData, post, processing, errors } = useForm({
        employee_id: leaveRequest.employee_id || '',
        leave_type_id: leaveRequest.leave_type_id || '',
        start_date: formatDate(leaveRequest.start_date),
        end_date: formatDate(leaveRequest.end_date),
        reason: leaveRequest.reason || '',
        attachment: null,
    });

    // Detect if selected leave type requires attachment
    const selectedLeaveType = leaveTypes?.find(t => String(t.id) === String(data.leave_type_id));
    const isAttachmentRequired = (val) => Boolean(val) && val !== '0' && val !== 0 && val !== 'false';
    const requiresAttachment = Boolean(settings?.enable_leave_attachment) && isAttachmentRequired(selectedLeaveType?.requires_attachment);
    const acceptTypes = (settings?.attachment_allowed_types || 'pdf,jpg,jpeg,png,doc,docx')
        .split(',').map(e => `.${e.trim()}`).join(',');

    const [lightbox, setLightbox] = useState({ isOpen: false, src: '', title: '', type: 'auto' });

    const openLightbox = (attachmentPath, title) => {
        if (!attachmentPath) return;
        const fullUrl = attachmentPath.startsWith('http') || attachmentPath.startsWith('/storage')
            ? attachmentPath
            : `/storage/${attachmentPath}`;
        const ext = attachmentPath.split('.').pop()?.toLowerCase();
        const isPdf = ext === 'pdf';
        const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
        const type = isPdf ? 'application/pdf' : (isImg ? 'image' : 'auto');

        setLightbox({
            isOpen: true,
            src: fullUrl,
            title: title || 'Supporting Document',
            type
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('leave-requests.update', leaveRequest.id), {
            forceFormData: true,
            _method: 'PUT',
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Edit Leave" />

            <div className="py-4 px-3 sm:px-4 lg:px-6 space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <FaEdit size={120} />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <Link 
                            href={route('leave-requests.show', leaveRequest.id)} 
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-normal text-slate-900 leading-none mb-2">Edit Leave</h2>
                            <p className="text-[10px] font-normal text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></span>
                                Leave ID: LVE-{String(leaveRequest.id).padStart(6, '0')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                        <button
                            form="leave-edit-form"
                            type="submit"
                            disabled={processing}
                            className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-normal hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {processing ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <FaSave size={12} />
                            )}
                            <span>Save Changes</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Form */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 md:p-8">
                                <form id="leave-edit-form" onSubmit={handleSubmit} className="space-y-8">
                                    {/* Employee */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                            <FaUser className="text-slate-400" /> Select Employee
                                        </label>
                                        {userRole !== 'employee' ? (
                                            <div className="relative z-50">
                                                <SearchableSelect
                                                    id="employee_id"
                                                    name="employee_id"
                                                    value={data.employee_id}
                                                    onChange={(e) => setData('employee_id', e.target.value)}
                                                    options={employees?.map(emp => ({ value: emp.id, label: `${emp.name} (${emp.employee_code})` })) || []}
                                                    placeholder="Search for employee..."
                                                />
                                            </div>
                                        ) : (
                                            <div className="px-6 py-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4">
                                                <Avatar
                                                    src={leaveRequest.employee?.employee_image}
                                                    name={leaveRequest.employee?.name}
                                                    size="sm"
                                                    className="rounded-xl border border-white shadow-sm"
                                                />
                                                <div>
                                                    <p className="text-sm font-normal text-slate-900 leading-none">{leaveRequest.employee?.name}</p>
                                                    <p className="text-[10px] font-normal text-slate-400 mt-1">{leaveRequest.employee?.employee_code}</p>
                                                </div>
                                            </div>
                                        )}
                                        {errors.employee_id && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 flex items-center gap-1"><FaInfoCircle size={10} /> {errors.employee_id}</p>}
                                    </div>

                                    {/* Leave Type */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                <FaClipboardList className="text-slate-400" /> Leave Type
                                            </label>
                                            <div className="relative group">
                                                <select
                                                    className={`w-full pl-5 pr-12 py-3 bg-slate-50 border ${errors.leave_type_id ? 'border-rose-200 focus:border-rose-300' : 'border-slate-200 focus:border-slate-300'} rounded-xl focus:ring-0 transition-all outline-none appearance-none cursor-pointer text-[11px] font-normal bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.25rem_center] bg-no-repeat`}
                                                    value={data.leave_type_id}
                                                    onChange={(e) => setData('leave_type_id', e.target.value)}
                                                >
                                                    <option value="">Select Leave Type...</option>
                                                    {leaveTypes?.map((type) => (
                                                        <option key={type.id} value={type.id}>{type.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {errors.leave_type_id && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 flex items-center gap-1"><FaInfoCircle size={10} /> {errors.leave_type_id}</p>}
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                                            <div className="w-9 h-9 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                                                <FaInfoCircle size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-normal text-slate-900 mb-1">Status: {leaveRequest.status}</p>
                                                <p className="text-[9px] font-normal text-slate-500">Edits may need re-approval</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                <FaCalendarAlt className="text-slate-400" /> Start Date
                                            </label>
                                            <input
                                                type="date"
                                                className={`w-full px-5 py-3 bg-white border ${errors.start_date ? 'border-rose-200 focus:border-rose-300' : 'border-slate-200 focus:border-slate-300'} rounded-xl focus:ring-0 transition-all outline-none text-[11px] font-normal`}
                                                value={data.start_date}
                                                onChange={(e) => setData('start_date', e.target.value)}
                                            />
                                            {errors.start_date && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 flex items-center gap-1"><FaInfoCircle size={10} /> {errors.start_date}</p>}
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                <FaCalendarAlt className="text-slate-400" /> End Date
                                            </label>
                                            <input
                                                type="date"
                                                min={data.start_date}
                                                className={`w-full px-5 py-3 bg-white border ${errors.end_date ? 'border-rose-200 focus:border-rose-300' : 'border-slate-200 focus:border-slate-300'} rounded-xl focus:ring-0 transition-all outline-none text-[11px] font-normal`}
                                                value={data.end_date}
                                                onChange={(e) => setData('end_date', e.target.value)}
                                            />
                                            {errors.end_date && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 flex items-center gap-1"><FaInfoCircle size={10} /> {errors.end_date}</p>}
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                            <FaClipboardList className="text-slate-400" /> Reason for Change
                                        </label>
                                        <textarea
                                            rows="4"
                                            placeholder="Reason for change..."
                                            className={`w-full px-6 py-4 bg-slate-50 border ${errors.reason ? 'border-rose-200 focus:border-rose-300' : 'border-slate-200 focus:border-slate-300'} rounded-xl focus:ring-0 transition-all outline-none text-[11px] font-normal placeholder:text-slate-300 placeholder:font-normal`}
                                            value={data.reason}
                                            onChange={(e) => setData('reason', e.target.value)}
                                        ></textarea>
                                        {errors.reason && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 flex items-center gap-1"><FaInfoCircle size={10} /> {errors.reason}</p>}
                                    </div>

                                    {/* Attachment — only shows when selected leave type requires it */}
                                    {requiresAttachment && (
                                        <div className="space-y-3 p-5 rounded-xl border-2 bg-indigo-50/50 border-indigo-200 transition-all">
                                            <label className="text-[10px] font-normal flex items-center gap-2 ml-1">
                                                <FaPaperclip className="text-indigo-500" />
                                                <span className="text-indigo-700">Supporting Document</span>
                                                <span className="text-rose-500 font-bold text-xs" title="Required">*</span>
                                                {leaveRequest.attachment && (
                                                    <span className="text-[9px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 font-normal">Already uploaded — upload new to replace</span>
                                                )}
                                                {!leaveRequest.attachment && (
                                                    <span className="text-[9px] px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-normal">Required for this leave type</span>
                                                )}
                                            </label>

                                            {/* Show existing attachment */}
                                            {leaveRequest.attachment && (
                                                <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
                                                    <div
                                                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group/doc"
                                                        onClick={() => openLightbox(leaveRequest.attachment, leaveRequest.attachment_original_name)}
                                                    >
                                                        <div className="w-8 h-8 bg-indigo-100 group-hover/doc:bg-indigo-200 text-indigo-600 rounded-lg flex items-center justify-center transition-colors">
                                                            <FaPaperclip size={12} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] font-normal text-slate-900 group-hover/doc:text-indigo-600 transition-colors truncate">{leaveRequest.attachment_original_name || 'Current attachment'}</p>
                                                            <p className="text-[9px] text-slate-400">Click to preview in lightbox</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openLightbox(leaveRequest.attachment, leaveRequest.attachment_original_name)}
                                                            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-lg text-[10px] transition-all"
                                                        >
                                                            <FaEye size={10} /> View
                                                        </button>
                                                        <a
                                                            href={`/storage/${leaveRequest.attachment}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            download={leaveRequest.attachment_original_name || 'attachment'}
                                                            className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                                                        >
                                                            Download
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    id="attachment"
                                                    accept={acceptTypes}
                                                    required={!leaveRequest.attachment}
                                                    onChange={(e) => setData('attachment', e.target.files[0])}
                                                    className="w-full px-4 py-3 bg-white border-2 border-dashed border-indigo-200 rounded-xl outline-none text-[11px] font-normal text-slate-500 cursor-pointer file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-normal file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 hover:border-indigo-300 transition-all"
                                                />
                                            </div>
                                            <p className="text-[9px] text-indigo-500 font-normal ml-1">
                                                Accepted: {settings?.attachment_allowed_types || 'pdf, jpg, png, doc, docx'} · Max: {settings?.attachment_max_size_mb || 5}MB
                                            </p>
                                            {errors.attachment && <p className="text-[10px] font-normal text-rose-500 mt-1 ml-1 flex items-center gap-1"><FaInfoCircle size={10} /> {errors.attachment}</p>}
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Information */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 rounded-xl p-6 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 text-slate-700 opacity-20 group-hover:scale-110 transition-transform">
                                <FaInfoCircle size={60} />
                            </div>
                            <h3 className="text-xs font-normal mb-5 relative z-10 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                Information
                            </h3>
                             <ul className="space-y-6 relative z-10">
                                <li className="flex gap-4">
                                    <div className="w-7 h-7 bg-white/10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-normal text-[10px]">01</div>
                                    <p className="text-[10px] font-normal text-slate-200 leading-relaxed">
                                        Editing an <span className="text-white font-normal">Approved</span> request will reset it to <span className="text-amber-400">Pending</span>.
                                    </p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-7 h-7 bg-white/10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-normal text-[10px]">02</div>
                                    <p className="text-[10px] font-normal text-slate-200 leading-relaxed">
                                        New dates are checked against the <span className="text-white font-normal">Department Schedule</span>.
                                    </p>
                                </li>
                            </ul>
                            
                            <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10 group-hover:bg-white/10 transition-colors">
                                <p className="text-[9px] font-normal text-white mb-1.5">Audit Log</p>
                                <p className="text-[10px] font-normal text-white/90">Every edit is logged with a timestamp and user ID for security.</p>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-[10px] font-normal text-slate-900 mb-6 flex items-center gap-2">
                                <FaPaperPlane className="text-slate-400" /> Preview
                            </h3>
                            <div className="space-y-4">
                                 <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                    <span className="text-[10px] font-normal text-slate-400">Original Days</span>
                                    <span className="text-[11px] font-normal text-slate-900">{parseFloat(leaveRequest.days_requested ?? leaveRequest.number_of_days ?? 0)} Days</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                    <span className="text-[10px] font-normal text-slate-400">New Days</span>
                                    <span className="text-[11px] font-normal text-slate-900">
                                        {data.start_date && data.end_date ? 
                                            Math.max(1, Math.ceil((new Date(data.end_date) - new Date(data.start_date)) / (1000 * 60 * 60 * 24)) + 1) + ' Days' 
                                            : parseFloat(leaveRequest.days_requested ?? leaveRequest.number_of_days ?? 0) + ' Days'}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-6">
                                <Link
                                    href={route('leave-requests.show', leaveRequest.id)}
                                    className="block w-full py-3.5 bg-slate-50 text-slate-500 rounded-xl text-[11px] font-normal hover:bg-slate-100 transition-all text-center border border-slate-100"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox / Document Preview Modal */}
            <Lightbox
                isOpen={lightbox.isOpen}
                onClose={() => setLightbox(prev => ({ ...prev, isOpen: false }))}
                src={lightbox.src}
                type={lightbox.type}
                title={lightbox.title}
            />
        </AuthenticatedLayout>
    );
}
