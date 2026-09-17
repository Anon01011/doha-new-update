import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiTag,
    FiCheck, FiX, FiInfo, FiDollarSign, FiBriefcase
} from 'react-icons/fi';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index({ categories = [], companies = [], filters = {} }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '' });

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        name: '',
        code: '',
        description: '',
        policy_limit_amount: '',
        requires_receipt: true,
        is_tax_deductible: false,
        is_active: true,
        company_id: '',
    });

    const openCreateModal = () => {
        setEditingCategory(null);
        reset();
        setData({
            name: '',
            code: '',
            description: '',
            policy_limit_amount: '',
            requires_receipt: true,
            is_tax_deductible: false,
            is_active: true,
            company_id: '',
        });
        setModalOpen(true);
    };

    const openEditModal = (cat) => {
        setEditingCategory(cat);
        setData({
            name: cat.name || '',
            code: cat.code || '',
            description: cat.description || '',
            policy_limit_amount: cat.policy_limit_amount || '',
            requires_receipt: Boolean(cat.requires_receipt),
            is_tax_deductible: Boolean(cat.is_tax_deductible),
            is_active: Boolean(cat.is_active),
            company_id: cat.company_id || '',
        });
        setModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingCategory) {
            put(route('expense-categories.update', editingCategory.id), {
                onSuccess: () => setModalOpen(false),
            });
        } else {
            post(route('expense-categories.store'), {
                onSuccess: () => setModalOpen(false),
            });
        }
    };

    const confirmDelete = () => {
        if (!deleteModal.id) return;
        destroy(route('expense-categories.destroy', deleteModal.id), {
            onSuccess: () => setDeleteModal({ show: false, id: null, name: '' }),
        });
    };

    const formatINR = (val) => {
        return val ? '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : 'No limit';
    };

    return (
        <AuthenticatedLayout>
            <Head title="Expense Categories" />

            {/* In-Page Header */}
            <div className="w-full bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('expenses.index')}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                <FiTag className="text-rose-500 w-5 h-5" /> Expense Categories & Policy Limits
                            </h1>
                            <p className="text-xs text-slate-500 font-normal mt-0.5">
                                Configure claimable business categories, spending limits in INR (₹), and receipt policies
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                        <FiPlus className="w-4 h-4" />
                        Add Category
                    </button>
                </div>
            </div>

            <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">

                {/* Categories Table Card */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3.5 px-4">Code</th>
                                    <th className="py-3.5 px-4">Category Name</th>
                                    <th className="py-3.5 px-4">Scope / Company</th>
                                    <th className="py-3.5 px-4">Policy Limit (INR ₹)</th>
                                    <th className="py-3.5 px-4 text-center">Receipt Mandated</th>
                                    <th className="py-3.5 px-4 text-center">Tax Deductible</th>
                                    <th className="py-3.5 px-4 text-center">Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                                {categories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{cat.code}</td>
                                        <td className="py-3.5 px-4">
                                            <p className="font-semibold text-slate-900">{cat.name}</p>
                                            {cat.description && <p className="text-[11px] text-slate-400 mt-0.5">{cat.description}</p>}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {cat.company ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                                                    <FiBriefcase className="w-3 h-3" /> {cat.company.name}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    Global (All Companys)
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                                            {formatINR(cat.policy_limit_amount)}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            {cat.requires_receipt ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    Required
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-slate-400">Optional</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            {cat.is_tax_deductible ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                    Yes (GST)
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-slate-400">No</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${cat.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {cat.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(cat)}
                                                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                                    title="Edit Category"
                                                >
                                                    <FiEdit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteModal({ show: true, id: cat.id, name: cat.name })}
                                                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                                    title="Delete Category"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {categories.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="py-8 text-center text-slate-400 italic">
                                            No expense categories configured. Click "Add Category" to create one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create / Edit Modal */}
                {modalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <h3 className="text-base font-bold text-slate-900">
                                    {editingCategory ? 'Edit Expense Category' : 'Create Expense Category'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Travel & Stay"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                                    />
                                    {errors.name && <p className="text-[10px] text-rose-500 mt-1">{errors.name}</p>}
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Code *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. EXP-TRV"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 uppercase font-mono font-bold"
                                    />
                                    {errors.code && <p className="text-[10px] text-rose-500 mt-1">{errors.code}</p>}
                                </div>
                            </div>

                            {companies.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Branch Scope</label>
                                    <select
                                        value={data.company_id}
                                        onChange={(e) => setData('company_id', e.target.value)}
                                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                                    >
                                        <option value="">Global (Available to All Companys)</option>
                                        {companies.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Limit Amount (INR ₹)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Leave empty for unlimited"
                                        value={data.policy_limit_amount}
                                        onChange={(e) => setData('policy_limit_amount', e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-semibold"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">Claims exceeding this threshold will be flagged for review.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Policy Guidance</label>
                                <textarea
                                    rows="2"
                                    placeholder="Guidelines on what is eligible under this category..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                />
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.requires_receipt}
                                        onChange={(e) => setData('requires_receipt', e.target.checked)}
                                        className="rounded text-rose-600 focus:ring-rose-400"
                                    />
                                    <span className="text-slate-700 font-medium">Receipt Attachment is Mandatory</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.is_tax_deductible}
                                        onChange={(e) => setData('is_tax_deductible', e.target.checked)}
                                        className="rounded text-rose-600 focus:ring-rose-400"
                                    />
                                    <span className="text-slate-700 font-medium">Tax Deductible / Eligible for Input GST Credit</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="rounded text-rose-600 focus:ring-rose-400"
                                    />
                                    <span className="text-slate-700 font-medium">Active & Claimable</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all shadow-sm cursor-pointer"
                                >
                                    {editingCategory ? 'Update Category' : 'Save Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Confirmation Modal for Delete */}
                <ConfirmationModal
                    show={deleteModal.show}
                    type="danger"
                    title="Delete Expense Category"
                    message={`Are you sure you want to delete the expense category "${deleteModal.name}"? This action cannot be undone.`}
                    confirmText="Delete Category"
                    cancelText="Cancel"
                    onConfirm={confirmDelete}
                    onClose={() => setDeleteModal({ show: false, id: null, name: '' })}
                />
            </div>
        </AuthenticatedLayout>
    );
}
