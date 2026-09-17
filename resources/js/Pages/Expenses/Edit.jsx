import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import React, { useState, useRef } from 'react';
import {
    FiArrowLeft, FiUploadCloud, FiFile, FiTrash2,
    FiAlertCircle, FiCheckCircle, FiInfo, FiTag
} from 'react-icons/fi';

export default function Edit({ claim, categories = [], projects = [], departments = [] }) {
    const fileInputRef = useRef();
    const [previewUrl, setPreviewUrl] = useState(claim.receipt_path ? `/storage/${claim.receipt_path}` : null);
    const [selectedCategory, setSelectedCategory] = useState(
        categories.find((c) => c.id === claim.expense_category_id) || null
    );

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        expense_category_id: claim.expense_category_id || '',
        expense_date: claim.expense_date ? claim.expense_date.split('T')[0] : '',
        amount: claim.amount || '',
        tax_amount: claim.tax_amount || '',
        tax_rate: claim.tax_rate || '',
        tax_invoice_number: claim.tax_invoice_number || '',
        vendor_name: claim.vendor_name || '',
        business_purpose: claim.business_purpose || '',
        cost_center: claim.cost_center || '',
        project_name: claim.project_name || '',
        payment_method: claim.payment_method || 'personal_card',
        receipt: null,
        submit_now: false,
    });

    const handleCategoryChange = (catId) => {
        setData('expense_category_id', catId);
        const cat = categories.find((c) => String(c.id) === String(catId));
        setSelectedCategory(cat || null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('receipt', file);
            if (file.type.startsWith('image/')) {
                setPreviewUrl(URL.createObjectURL(file));
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const handleSubmit = (submitDirectly) => {
        setData('submit_now', submitDirectly);
        post(route('expenses.update', claim.id), {
            forceFormData: true,
        });
    };

    const formatINR = (val) => {
        return '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Edit Claim - ${claim.claim_number}`} />

            {/* In-Page Header */}
            <div className="w-full bg-white border-b border-slate-100 px-4 lg:px-8 py-4">
                <div className="flex items-center gap-3">
                    <Link
                        href={route('expenses.show', claim.id)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Edit Claim #{claim.claim_number}</h1>
                        <p className="text-xs text-slate-500 font-normal mt-0.5">Modify expense details and re-upload supporting documents</p>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-5xl mx-auto p-4 lg:p-8">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }} className="space-y-6">

                    {claim.manager_comments && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                            <p className="font-semibold flex items-center gap-1.5">
                                <FiInfo className="text-amber-600" /> Reviewer Feedback / Reason for Return:
                            </p>
                            <p className="italic">"{claim.manager_comments}"</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                    <FiTag className="text-primary" />
                                    Expense Particulars
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                                        <select
                                            value={data.expense_category_id}
                                            onChange={(e) => handleCategoryChange(e.target.value)}
                                            className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white"
                                        >
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Date *</label>
                                        <input
                                            type="date"
                                            value={data.expense_date}
                                            onChange={(e) => setData('expense_date', e.target.value)}
                                            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (INR ₹) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white font-semibold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Name</label>
                                        <input
                                            type="text"
                                            value={data.vendor_name}
                                            onChange={(e) => setData('vendor_name', e.target.value)}
                                            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Business Purpose *</label>
                                    <textarea
                                        rows="3"
                                        value={data.business_purpose}
                                        onChange={(e) => setData('business_purpose', e.target.value)}
                                        className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Right: Receipt & Submit */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                    <FiUploadCloud className="text-primary" />
                                    Receipt Document
                                </h3>

                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-200 hover:border-primary/50 bg-slate-50 rounded-xl p-4 text-center cursor-pointer"
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,application/pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <p className="text-xs font-medium text-slate-700">Change Receipt File</p>
                                </div>

                                {previewUrl && (
                                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                        <img src={previewUrl} alt="Receipt preview" className="w-full h-36 object-cover" />
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-3">
                                <button
                                    type="button"
                                    disabled={processing}
                                    onClick={() => handleSubmit(true)}
                                    className="w-full py-3 bg-slate-900 hover:bg-primary text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <FiCheckCircle className="w-4 h-4" />
                                    Save & Submit Claim
                                </button>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
