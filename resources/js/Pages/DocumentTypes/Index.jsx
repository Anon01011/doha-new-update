import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { FaFileContract, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaCalendarAlt, FaLayerGroup, FaInfoCircle } from 'react-icons/fa';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index({ documentTypes }) {
    const [editingId, setEditingId] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        category: '',
        requires_expiry: false,
        is_mandatory: false,
        is_active: true,
        alert_days_before_expiry: 30,
    });

    const handleCreate = (e) => {
        e.preventDefault();
        post(route('document-types.store'), {
            onSuccess: () => {
                reset();
                setShowCreateModal(false);
            },
        });
    };

    const handleEdit = (type) => {
        setData(type);
        setEditingId(type.id);
        setShowCreateModal(true);
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        put(route('document-types.update', editingId), {
            onSuccess: () => {
                reset();
                setShowCreateModal(false);
                setEditingId(null);
            },
        });
    };

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [selectedType, setSelectedType] = useState(null);
    const [deletionProcessing, setDeletionProcessing] = useState(false);

    const handleDelete = (type) => {
        setSelectedType(type);
        setConfirmingDeletion(true);
    };

    const confirmDeletion = () => {
        setDeletionProcessing(true);
        router.delete(route('document-types.destroy', selectedType.id), {
            onFinish: () => {
                setDeletionProcessing(false);
                setConfirmingDeletion(false);
            }
        });
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setEditingId(null);
        reset();
    };

    const categories = [...new Set(documentTypes.map(t => t.category))];

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-normal text-slate-900 uppercase">Document Control Panel</h2>}>
            <Head title="Document Configuration" />

            <div className="min-h-screen bg-slate-50/50 py-4">
                <div className="w-full mx-auto px-4 space-y-4">

                    {/* Hero Section */}
                    <div className="bg-slate-900 rounded-lg p-5 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <FaFileContract className="text-7xl" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-xl font-normal mb-1 uppercase tracking-normal">Compliance & Documentation</h1>
                                <p className="text-slate-400 max-w-xl text-[11px] leading-snug uppercase font-normal tracking-normal opacity-80">
                                    Manage document categories, technical expiry rules, and operational compliance requirements.
                                </p>
                            </div>
                            <button
                                onClick={() => { setEditingId(null); reset(); setShowCreateModal(true); }}
                                className="bg-primary text-white hover:brightness-110 px-4 py-2 rounded-lg font-normal shadow-lg transition-all active:scale-95 flex items-center gap-2 text-[11px] uppercase tracking-normal"
                            >
                                <FaPlus /> Add Document Type
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        {categories.map((category) => (
                            <div key={category} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-l-2 border-primary rounded-r-lg mb-0">
                                    <div className="flex items-center gap-3">
                                        <FaLayerGroup size={12} className="text-primary" />
                                        <h2 className="text-[10px] font-normal text-slate-800 uppercase tracking-[0.2em]">{category || 'Uncategorized'}</h2>
                                    </div>
                                    <span className="text-[9px] px-2 py-0.5 bg-primary text-white rounded-md font-normal uppercase tabular-nums shadow-md shadow-primary/20">
                                        {documentTypes.filter(t => t.category === category).length} Types
                                    </span>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/30 text-slate-400 text-[10px] uppercase tracking-[0.2em] border-b border-slate-100">
                                                <th className="px-5 py-3 font-normal">Document Nomenclature</th>
                                                <th className="px-5 py-3 font-normal">Compliance Rules</th>
                                                <th className="px-5 py-3 font-normal text-center">Alert Protocol</th>
                                                <th className="px-5 py-3 font-normal text-center">Status</th>
                                                <th className="px-5 py-3 font-normal text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {documentTypes.filter(t => t.category === category).map((type) => (
                                                <tr key={type.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-5 py-3">
                                                        <div>
                                                            <div className="text-[11px] font-normal text-slate-800 group-hover:text-primary transition-colors uppercase tracking-normal">{type.name}</div>
                                                            <div className="text-[9px] text-slate-400 font-normal uppercase tracking-normal mt-0.5 opacity-60">ID: {type.id}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {type.is_mandatory ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-normal uppercase tracking-normal bg-rose-50 text-rose-600 border border-rose-100">
                                                                    <FaExclamationTriangle size={8} /> Mandatory
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-normal uppercase tracking-normal bg-slate-50 text-slate-400 border border-slate-100">
                                                                    Optional
                                                                </span>
                                                            )}
                                                            {type.requires_expiry && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-normal uppercase tracking-normal bg-primary/5 text-primary border border-primary/10">
                                                                    <FaCalendarAlt size={8} /> Expiring
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        {type.requires_expiry ? (
                                                            <div className="inline-flex flex-col items-center">
                                                                <span className="text-[11px] font-normal text-slate-800 tabular-nums">{type.alert_days_before_expiry}D</span>
                                                                <span className="text-[7px] text-slate-400 font-normal uppercase tracking-normal">Pre-Alert</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 text-[9px] font-normal uppercase italic">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        {type.is_active ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-normal uppercase tracking-normal bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-normal uppercase tracking-normal bg-slate-100 text-slate-400 border border-slate-200">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => handleEdit(type)}
                                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-90"
                                                                title="Edit Profile"
                                                            >
                                                                <FaEdit size={12} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(type)}
                                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all active:scale-90"
                                                                title="Delete Entry"
                                                            >
                                                                <FaTrash size={12} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Create/Edit Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200/60 transition-all duration-500">
                            {/* Modal Header */}
                            <div className="px-6 py-5 flex justify-between items-center text-white relative" style={{ backgroundColor: 'var(--secondary-color)' }}>
                                <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-white/20 to-transparent" />
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                                        <FaFileContract className="text-white text-sm" />
                                    </div>
                                    <h2 className="text-sm font-normal uppercase tracking-wider">
                                        {editingId ? 'Modify Document Signature' : 'Register New Document'}
                                    </h2>
                                </div>
                                <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors relative z-10">
                                    <FaTimesCircle className="text-lg opacity-60 hover:opacity-100" />
                                </button>
                            </div>

                            <form onSubmit={editingId ? handleUpdate : handleCreate} className="p-8 space-y-6">
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-widest ml-1">Document Label</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-xs font-normal text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary placeholder:text-slate-300 transition-all uppercase tracking-normal"
                                            placeholder="E.G. EMPLOYMENT CONTRACT"
                                            required
                                        />
                                        {errors.name && <p className="text-[9px] text-rose-500 font-normal uppercase ml-1 mt-1">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-widest ml-1">Classification Category</label>
                                        <input
                                            type="text"
                                            value={data.category}
                                            onChange={(e) => setData('category', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-xs font-normal text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary placeholder:text-slate-300 transition-all uppercase tracking-normal"
                                            placeholder="E.G. HR COMPLIANCE"
                                            list="categories"
                                            required
                                        />
                                        <datalist id="categories">
                                            {categories.map(c => <option key={c} value={c} />)}
                                        </datalist>
                                        {errors.category && <p className="text-[9px] text-rose-500 font-normal uppercase ml-1 mt-1">{errors.category}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setData('requires_expiry', !data.requires_expiry)}
                                            className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-300 ${data.requires_expiry ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                            style={data.requires_expiry ? { backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)' } : {}}
                                        >
                                            <FaCheckCircle size={14} className={data.requires_expiry ? 'text-white' : 'opacity-20'} />
                                            <span className="text-[11px] font-normal uppercase tracking-widest">Expiring</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setData('is_mandatory', !data.is_mandatory)}
                                            className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-300 ${data.is_mandatory ? 'bg-rose-500 border-rose-500 text-white shadow-xl shadow-rose-200 scale-[1.02]' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                        >
                                            <FaExclamationTriangle size={14} className={data.is_mandatory ? 'text-white' : 'opacity-20'} />
                                            <span className="text-[11px] font-normal uppercase tracking-widest">Mandatory</span>
                                        </button>
                                    </div>

                                    {data.requires_expiry && (
                                        <div className="p-5 rounded-2xl shadow-lg relative overflow-hidden transition-all animate-in zoom-in-95 duration-300" style={{ backgroundColor: 'var(--secondary-color)' }}>
                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                                <FaCalendarAlt size={48} className="text-white" />
                                            </div>
                                            <label className="block text-[10px] font-normal text-slate-300 uppercase tracking-widest mb-3 relative z-10">Notification Protocol (Days)</label>
                                            <div className="flex items-center gap-4 relative z-10">
                                                <input
                                                    type="number"
                                                    value={data.alert_days_before_expiry}
                                                    onChange={(e) => setData('alert_days_before_expiry', parseInt(e.target.value))}
                                                    className="w-24 bg-white/10 border-white/20 rounded-xl py-2.5 text-base font-normal text-white focus:ring-2 focus:ring-white/30 focus:border-white/40 text-center backdrop-blur-sm"
                                                />
                                                <p className="text-[10px] text-slate-400 font-normal uppercase leading-relaxed tracking-wider">Early warning threshold for administrative oversight</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-md bg-slate-200/50 flex items-center justify-center">
                                                <FaInfoCircle size={10} className="text-slate-400" />
                                            </div>
                                            <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest">Deployment Status</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-normal uppercase tracking-widest ${data.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {data.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setData('is_active', !data.is_active)}
                                                className={`w-10 h-5 rounded-full relative transition-all duration-300 ${data.is_active ? 'bg-emerald-500 shadow-md shadow-emerald-100' : 'bg-slate-200'}`}
                                            >
                                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ${data.is_active ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 px-6 py-3.5 bg-white text-slate-400 rounded-xl font-normal uppercase tracking-widest text-[10px] border border-slate-200 hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 px-6 py-3.5 bg-primary text-white rounded-xl font-normal uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                                        style={{ backgroundColor: 'var(--primary-color)' }}
                                    >
                                        {processing ? 'Processing...' : editingId ? 'Update Config' : 'Register Type'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                <ConfirmationModal
                    show={confirmingDeletion}
                    title="Delete Document Type"
                    message={`Are you sure you want to delete the document type "${selectedType?.name}"? This action cannot be undone.`}
                    onConfirm={confirmDeletion}
                    onClose={() => setConfirmingDeletion(false)}
                    type="danger"
                    processing={deletionProcessing}
                />
            </div>
        </AuthenticatedLayout>
    );
}
