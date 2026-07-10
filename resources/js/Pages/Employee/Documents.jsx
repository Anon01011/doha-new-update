import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { FaFileAlt, FaCloudUploadAlt, FaDownload, FaTrash, FaCheckCircle, FaExclamationCircle, FaTimesCircle, FaCalendarAlt, FaFileContract, FaInfoCircle } from 'react-icons/fa';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Documents({ employee, documents, documentTypes, userRole, settings }) {
    const [showUploadModal, setShowUploadModal] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        document_type_id: '',
        document_name: '',
        file: null,
        issue_date: '',
        expiry_date: '',
        notes: '',
    });

    const canUpload = ['admin', 'hr', 'manager'].includes(userRole);
    const canDelete = ['admin', 'hr'].includes(userRole);

    const handleUpload = (e) => {
        e.preventDefault();
        post(route('employees.documents.store', employee.id), {
            onSuccess: () => {
                reset();
                setShowUploadModal(false);
            },
        });
    };

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDelete = (documentId) => {
        setSelectedDocId(documentId);
        setConfirmingDeletion(true);
    };

    const confirmDeletion = () => {
        setIsProcessing(true);
        router.delete(route('employee-documents.destroy', selectedDocId), {
            onFinish: () => {
                setIsProcessing(false);
                setConfirmingDeletion(false);
            }
        });
    };

    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    const formatFileSize = (bytes) => {
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
        if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return bytes + ' B';
    };

    const getExpiryStatus = (doc) => {
        if (!doc.expiry_date) return null;
        if (doc.is_expired) return { color: 'bg-rose-50 text-rose-600 border-rose-100', text: 'Expired', icon: <FaTimesCircle size={10} /> };
        if (doc.is_expiring_soon) return { color: 'bg-amber-50 text-amber-600 border-amber-100', text: 'Expiring Soon', icon: <FaExclamationCircle size={10} /> };
        return { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', text: 'Valid', icon: <FaCheckCircle size={10} /> };
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-normal text-slate-900 uppercase">Personnel Documentation Vault</h2>}>
            <Head title={`Documents - ${employee.name}`} />

            <div className="min-h-screen bg-slate-50/50 py-4">
                <div className="w-full mx-auto px-4 space-y-4">

                    {/* Hero Header */}
                    <div className="bg-slate-900 rounded-lg p-5 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform duration-500">
                            <FaFileContract className="text-7xl" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 shadow-lg">
                                    <FaFileAlt size={20} />
                                </div>
                                <div>
                                    <h1 className="text-xl font-normal mb-0.5 uppercase tracking-normal">{employee.name}</h1>
                                    <p className="text-slate-400 text-[10px] uppercase font-normal tracking-[0.2em] opacity-80 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Active Personnel Repository
                                    </p>
                                </div>
                            </div>
                            {canUpload && (
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="bg-primary text-white px-5 py-2.5 rounded-lg text-[11px] font-normal uppercase tracking-normal shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <FaCloudUploadAlt size={14} /> Upload Vault Entry
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Documents Display */}
                    {documents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                            {documents.map((doc) => {
                                const expiryStatus = getExpiryStatus(doc);
                                return (
                                    <div key={doc.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-primary/20 transition-all group flex flex-col">
                                        {/* Card Header */}
                                        <div className="p-4 border-b border-slate-50 flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="text-[12px] font-normal text-slate-800 uppercase tracking-normal truncate group-hover:text-primary transition-colors">{doc.document_name}</h3>
                                                <p className="text-[9px] text-slate-400 font-normal uppercase tracking-normal mt-0.5 truncate">{doc.document_type?.name || 'GENERIC FILING'}</p>
                                            </div>
                                            {expiryStatus && (
                                                <span className={`shrink-0 px-2 py-0.5 rounded-md text-[8px] font-normal uppercase tracking-normal border flex items-center gap-1 shadow-sm ${expiryStatus.color}`}>
                                                    {expiryStatus.icon} {expiryStatus.text}
                                                </span>
                                            )}
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-4 space-y-3 flex-1">
                                            <div className="grid grid-cols-2 gap-y-2 text-[10px] font-normal uppercase tracking-normal">
                                                <div className="text-slate-400">Signature Format</div>
                                                <div className="text-slate-700 text-right tabular-nums">{doc.file_type.toUpperCase()} • {formatFileSize(doc.file_size)}</div>
                                                
                                                {doc.issue_date && (
                                                    <>
                                                        <div className="text-slate-400">Certification Date</div>
                                                        <div className="text-slate-700 text-right">{formatDate(doc.issue_date)}</div>
                                                    </>
                                                )}
                                                
                                                {doc.expiry_date && (
                                                    <>
                                                        <div className="text-slate-400">Expiration Cycle</div>
                                                        <div className="text-slate-700 text-right flex items-center justify-end gap-1">
                                                            <FaCalendarAlt size={10} className={doc.is_expired ? 'text-rose-500' : 'text-primary'} />
                                                            {formatDate(doc.expiry_date)}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {doc.notes && (
                                                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                    <p className="text-[9px] text-slate-500 font-normal uppercase leading-tight italic opacity-70">"{doc.notes}"</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Footer Actions */}
                                        <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                                            <a
                                                href={route('employee-documents.download', doc.id)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95 shadow-sm"
                                            >
                                                <FaDownload size={10} /> Access Asset
                                            </a>
                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="w-10 h-9 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all active:scale-95 shadow-sm"
                                                    title="Purge Document"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                                <FaFileAlt className="text-slate-200 text-2xl" />
                            </div>
                            <div>
                                <p className="text-xs font-normal text-slate-400 uppercase tracking-[0.2em]">Zero Records Found</p>
                                <p className="text-[10px] text-slate-300 font-normal uppercase tracking-normal mt-1">No personnel documentation has been synchronized yet.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Upload Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
                            {/* Modal Header */}
                            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white relative">
                                <div className="absolute inset-0 bg-primary/5 pattern-grid-slate-100/5" />
                                <h2 className="text-xs font-normal uppercase tracking-normal flex items-center gap-2 relative z-10">
                                    <FaCloudUploadAlt className="text-primary" />
                                    Synchronize New Asset
                                </h2>
                                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white transition-colors relative z-10">
                                    <FaTimesCircle className="text-lg" />
                                </button>
                            </div>

                            <form onSubmit={handleUpload} className="p-6 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal ml-1">Document Registry Name *</label>
                                        <input
                                            type="text"
                                            value={data.document_name}
                                            onChange={(e) => setData('document_name', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-800 focus:ring-primary focus:border-primary placeholder:text-slate-300 transition-all uppercase tracking-normal"
                                            placeholder="E.G. PASSPORT_RENEWAL_2024"
                                            required
                                        />
                                        {errors.document_name && <p className="text-[9px] text-rose-500 font-normal uppercase ml-1 mt-1">{errors.document_name}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal ml-1">Asset Classification</label>
                                        <select
                                            value={data.document_type_id}
                                            onChange={(e) => setData('document_type_id', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-800 focus:ring-primary focus:border-primary transition-all uppercase tracking-normal"
                                        >
                                            <option value="">Select Type (Optional)</option>
                                            {documentTypes.map((type) => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal ml-1">
                                            Binary Asset * {settings?.max_file_size_mb && <span className="text-[8px] opacity-60">(MAX {settings.max_file_size_mb}MB)</span>}
                                        </label>
                                        <input
                                            type="file"
                                            onChange={(e) => setData('file', e.target.files[0])}
                                            accept={settings?.allowed_file_types ? settings.allowed_file_types.split(',').map(t => `.${t}`).join(',') : '*'}
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-[10px] font-normal text-slate-500 file:bg-slate-200 file:border-none file:text-[9px] file:font-normal file:uppercase file:px-3 file:py-2 file:mr-3 file:rounded-lg file:text-slate-600 hover:file:bg-slate-300 transition-all cursor-pointer"
                                            required
                                        />
                                        {errors.file && <p className="text-[9px] text-rose-500 font-normal uppercase ml-1 mt-1">{errors.file}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal ml-1">Certification Date</label>
                                        <input
                                            type="date"
                                            value={data.issue_date}
                                            onChange={(e) => setData('issue_date', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-800 focus:ring-primary focus:border-primary transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal ml-1">Expiration Cycle</label>
                                        <input
                                            type="date"
                                            value={data.expiry_date}
                                            onChange={(e) => setData('expiry_date', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-800 focus:ring-primary focus:border-primary transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal ml-1">Operational Notes</label>
                                        <textarea
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            rows="2"
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-[11px] font-normal text-slate-700 focus:ring-primary focus:border-primary placeholder:text-slate-300 transition-all uppercase tracking-normal"
                                            placeholder="ENTER OPTIONAL TECHNICAL ANNOTATIONS..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowUploadModal(false)}
                                        className="flex-1 px-4 py-3 bg-white text-slate-400 rounded-xl font-normal uppercase tracking-normal text-[10px] border border-slate-200 hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-normal uppercase tracking-normal text-[10px] shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {processing ? 'Processing Binary...' : 'Authorize Upload'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                <ConfirmationModal
                    show={confirmingDeletion}
                    title="Purge Document Asset"
                    message="You are about to permanently delete this document from the personnel repository. This action is irreversible and will be logged. Continue?"
                    onConfirm={confirmDeletion}
                    onClose={() => setConfirmingDeletion(false)}
                    type="danger"
                    processing={isProcessing}
                />
            </div>
        </AuthenticatedLayout>
    );
}
