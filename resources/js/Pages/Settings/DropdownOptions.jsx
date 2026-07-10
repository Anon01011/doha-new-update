import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { FiPlus, FiEdit2, FiTrash2, FiCheckCircle, FiXCircle, FiGrid, FiList, FiSettings } from 'react-icons/fi';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function DropdownOptions({ groupedOptions }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOption, setEditingOption] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(Object.keys(groupedOptions).filter(c => c !== 'Gender')[0] || '');

    // Sort categories alphabetically
    const categories = Object.keys(groupedOptions)
        .filter(c => c !== 'Gender')
        .sort();

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        category: '',
        value: '',
        sort_order: 0,
        is_active: true,
    });

    const openModal = (option = null) => {
        clearErrors();
        if (option) {
            setEditingOption(option);
            setData({
                category: option.category,
                value: option.value,
                sort_order: option.sort_order,
                is_active: Boolean(option.is_active),
            });
        } else {
            setEditingOption(null);
            setData({
                category: selectedCategory,
                value: '',
                sort_order: (groupedOptions[selectedCategory]?.length || 0) + 1,
                is_active: true,
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingOption) {
            put(route('settings.dropdown-options.update', editingOption.id), {
                onSuccess: closeModal,
            });
        } else {
            post(route('settings.dropdown-options.store'), {
                onSuccess: closeModal,
            });
        }
    };

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [deletionProcessing, setDeletionProcessing] = useState(false);

    const handleDelete = (option) => {
        setSelectedOption(option);
        setConfirmingDeletion(true);
    };

    const confirmDeletion = () => {
        setDeletionProcessing(true);
        router.delete(route('settings.dropdown-options.destroy', selectedOption.id), {
            onFinish: () => {
                setDeletionProcessing(false);
                setConfirmingDeletion(false);
            }
        });
    };

    const handleNewCategory = () => {
        const newCategory = prompt('Enter new category name:');
        if (newCategory) {
            setSelectedCategory(newCategory);
            // In a real scenario, you might want to switch to the new category immediately
            // even if it has no options yet, but since we derive categories from options,
            // we'll just set the state and open the modal to add the first option.
            setEditingOption(null);
            setData({
                category: newCategory,
                value: '',
                sort_order: 1,
                is_active: true,
            });
            setIsModalOpen(true);
        }
    }

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-gray-800">Dropdown Settings</h2>}>
            <Head title="Dropdown Options" />

            <div className="w-full px-4 lg:px-6 py-6 space-y-6 bg-slate-50 min-h-screen">

                {/* Main Content Grid */}
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Sidebar / Category Nav */}
                    <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sticky top-24">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h3 className="text-xs font-normal text-slate-400 uppercase tracking-normal">Categories</h3>
                                <button
                                    onClick={handleNewCategory}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Add New Category"
                                >
                                    <FiPlus className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto pr-1 custom-scrollbar">
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-normal transition-all flex items-center justify-between group ${selectedCategory === category
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                                            }`}
                                    >
                                        <span>{category}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedCategory === category
                                                ? 'bg-white/20 text-white'
                                                : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                                            }`}>
                                            {groupedOptions[category]?.length || 0}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Options Grid */}
                    <div className="flex-1 space-y-6">
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h3 className="text-lg font-normal text-slate-800 tracking-normal">{selectedCategory || 'Select Category'}</h3>
                                    <p className="text-xs text-slate-500 font-normal mt-1">Manage options available for {selectedCategory}</p>
                                </div>
                                <button
                                    onClick={() => openModal()}
                                    className="bg-primary text-white px-5 py-2.5 rounded-lg text-xs font-normal uppercase tracking-normal hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                                >
                                    <FiPlus className="w-4 h-4" />
                                    Add Option
                                </button>
                            </div>

                            {/* Grid Content */}
                            <div className="p-6 flex-1 bg-slate-50/30">
                                {groupedOptions[selectedCategory] && groupedOptions[selectedCategory].length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {groupedOptions[selectedCategory].map((option) => (
                                            <div key={option.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group relative overflow-hidden">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-[10px] font-normal text-slate-500 font-mono">
                                                        {option.sort_order}
                                                    </span>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => openModal(option)}
                                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        >
                                                            <FiEdit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(option)}
                                                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                        >
                                                            <FiTrash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <h4 className="font-normal text-slate-800 text-sm mb-2 truncate" title={option.value}>{option.value}</h4>
                                                <div className="flex items-center gap-2">
                                                    {option.is_active ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-normal">
                                                            <FiCheckCircle className="w-3 h-3" /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-normal">
                                                            <FiXCircle className="w-3 h-3" /> Inactive
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                            <FiSettings className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-sm font-normal text-slate-600">No options found</p>
                                        <p className="text-xs mt-1">Get started by adding a new option to this category.</p>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

            <ConfirmationModal
                show={confirmingDeletion}
                title="Delete Option"
                message={`Are you sure you want to delete the option "${selectedOption?.value}"? This action cannot be undone.`}
                onConfirm={confirmDeletion}
                onClose={() => setConfirmingDeletion(false)}
                type="danger"
                processing={deletionProcessing}
            />

            {/* Modern Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
                    <div className="bg-white rounded-lg w-full max-w-md shadow-2xl transform transition-all scale-100">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-normal text-slate-800 tracking-normal">
                                {editingOption ? 'Edit Option' : 'New Option'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <FiXCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal mb-1.5">Category</label>
                                <input
                                    type="text"
                                    value={data.category}
                                    onChange={e => setData('category', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-100 border-slate-200 rounded-lg text-sm font-normal text-slate-600 focus:ring-0 focus:border-slate-300 transition-all cursor-not-allowed"
                                    readOnly={!!editingOption || !!selectedCategory} // Generally keep categories locked to selection context or editing context
                                />
                                {errors.category && <p className="text-xs text-rose-500 font-normal mt-1">{errors.category}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal mb-1.5">Option Value</label>
                                <input
                                    type="text"
                                    value={data.value}
                                    onChange={e => setData('value', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border-slate-200 rounded-lg text-sm font-normal focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                    placeholder="e.g. Full-Time"
                                    autoFocus
                                    required
                                />
                                {errors.value && <p className="text-xs text-rose-500 font-normal mt-1">{errors.value}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal mb-1.5">Sort Order</label>
                                    <input
                                        type="number"
                                        value={data.sort_order}
                                        onChange={e => setData('sort_order', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border-slate-200 rounded-lg text-sm font-normal focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${data.is_active ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}`}>
                                            {data.is_active && <FiCheckCircle className="w-3.5 h-3.5" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={e => setData('is_active', e.target.checked)}
                                            className="hidden"
                                        />
                                        <span className="text-sm font-normal text-slate-700">Active</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-normal uppercase tracking-normal hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 px-4 py-3 bg-primary text-white rounded-lg text-sm font-normal uppercase tracking-normal hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                                >
                                    {editingOption ? 'Save Changes' : 'Create Option'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
