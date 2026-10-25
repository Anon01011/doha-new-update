import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiTag,
    FiCheck, FiInfo, FiDollarSign, FiBriefcase
} from 'react-icons/fi';
import ConfirmationModal from '@/Components/ConfirmationModal';
import FormModal from '@/Components/FormModal';
import { useCurrency } from '@/helpers/currency';
import { useCurrencyLabel, CurrencyAmountInput } from '@/helpers/currency-ui';

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

    const { code: currencyCode, symbol: currencySymbol, format: formatAmount } = useCurrency();
    const { label: currencyLabelText, caption: currencyCaptionText } = useCurrencyLabel();

    const formatINR = (val) => {
        return val ? formatAmount(val) : 'No limit';
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
                                Configure claimable business categories, spending limits in {currencyCaptionText}, and receipt policies
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
                                    <th className="py-3.5 px-4">Policy Limit ({currencyCaptionText})</th>
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
                <FormModal
                    show={modalOpen}
                    onClose={() => setModalOpen(false)}
                    icon={<FiTag className="w-5 h-5" />}
                    iconClassName="bg-rose-500/10 text-rose-600"
                    title={editingCategory ? 'Edit Expense Category' : 'Create Expense Category'}
                    subtitle={
                        editingCategory
                            ? `Update the policy limit, scope and claim rules for ${data.name || 'this category'}.`
                            : 'Define a claimable category with an optional spending cap and receipt policy.'
                    }
                    maxWidth="max-w-xl"
                    footer={
                        <>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="expense-category-form"
                                disabled={processing}
                                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all shadow-sm shadow-rose-600/20 hover:shadow-md hover:shadow-rose-600/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1.5"
                            >
                                {processing ? (
                                    <>
                                        <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                        Saving
                                    </>
                                ) : editingCategory ? (
                                    'Update Category'
                                ) : (
                                    'Save Category'
                                )}
                            </button>
                        </>
                    }
                >
                    <form id="expense-category-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="expense-category-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Category Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    id="expense-category-name"
                                    type="text"
                                    required
                                    placeholder="e.g. Travel & Stay"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:bg-white transition-colors font-medium text-slate-800 placeholder:text-slate-400"
                                />
                                {errors.name && <p className="text-[10px] text-rose-500 mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label htmlFor="expense-category-code" className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Code <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    id="expense-category-code"
                                    type="text"
                                    required
                                    placeholder="e.g. EXP-TRV"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:bg-white transition-colors uppercase font-mono font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal placeholder:normal-case"
                                />
                                {errors.code && <p className="text-[10px] text-rose-500 mt-1">{errors.code}</p>}
                            </div>
                        </div>

                        {companies.length > 0 && (
                            <div>
                                <label htmlFor="expense-category-company" className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Company / Branch Scope
                                </label>
                                <select
                                    id="expense-category-company"
                                    value={data.company_id}
                                    onChange={(e) => setData('company_id', e.target.value)}
                                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:bg-white transition-colors font-medium text-slate-800"
                                >
                                    <option value="">Global (Available to All Companys)</option>
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-slate-400 mt-1.5">
                                    Global categories can be claimed by every company and branch.
                                </p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="expense-category-limit" className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Policy Limit Amount <span className="font-normal text-slate-400">({currencyCaptionText})</span>
                            </label>
                            <CurrencyAmountInput
                                id="expense-category-limit"
                                value={data.policy_limit_amount}
                                onChange={(e) => setData('policy_limit_amount', e.target.value)}
                                symbol={currencySymbol}
                                code={currencyCode}
                                placeholder="Leave empty for unlimited"
                            />
                            <p className="text-[10px] text-slate-400 mt-1.5">
                                Claims exceeding this threshold will be flagged for review.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="expense-category-description" className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Description / Policy Guidance
                            </label>
                            <textarea
                                id="expense-category-description"
                                rows="2"
                                placeholder="Guidelines on what is eligible under this category..."
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:bg-white transition-colors text-slate-800 placeholder:text-slate-400"
                            />
                        </div>

                        <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={data.requires_receipt}
                                    onChange={(e) => setData('requires_receipt', e.target.checked)}
                                    className="rounded text-rose-600 focus:ring-rose-400"
                                />
                                <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">
                                    Receipt Attachment is Mandatory
                                </span>
                            </label>
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={data.is_tax_deductible}
                                    onChange={(e) => setData('is_tax_deductible', e.target.checked)}
                                    className="rounded text-rose-600 focus:ring-rose-400"
                                />
                                <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">
                                    Tax Deductible / Eligible for Input GST Credit
                                </span>
                            </label>
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded text-rose-600 focus:ring-rose-400"
                                />
                                <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">
                                    Active &amp; Claimable
                                </span>
                            </label>
                        </div>
                    </form>
                </FormModal>

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
