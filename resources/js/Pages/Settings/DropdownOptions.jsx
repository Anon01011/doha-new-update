import React, { useState, useMemo } from 'react';
import SettingsLayout from './SettingsLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    FiPlus, FiEdit2, FiTrash2, FiCheckCircle, FiXCircle, 
    FiGrid, FiList, FiSettings, FiSearch, FiLayers, FiTag, FiHash, FiArrowRight 
} from 'react-icons/fi';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function DropdownOptions({ groupedOptions = {}, standardCategories = [] }) {
    // Collect all unique categories
    const allCategories = useMemo(() => {
        const set = new Set([
            ...standardCategories,
            ...Object.keys(groupedOptions || {})
        ]);
        return Array.from(set).filter(Boolean).sort();
    }, [groupedOptions, standardCategories]);

    const [selectedCategory, setSelectedCategory] = useState(
        allCategories[0] || 'Employee Category'
    );
    const [categorySearch, setCategorySearch] = useState('');
    const [optionSearch, setOptionSearch] = useState('');

    // Modals
    const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingOption, setEditingOption] = useState(null);

    // Delete confirmation
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [deletionProcessing, setDeletionProcessing] = useState(false);

    // Filter categories for sidebar
    const filteredCategories = useMemo(() => {
        if (!categorySearch.trim()) return allCategories;
        return allCategories.filter(c => 
            c.toLowerCase().includes(categorySearch.toLowerCase().trim())
        );
    }, [allCategories, categorySearch]);

    // Current category options
    const currentOptions = useMemo(() => {
        const list = groupedOptions[selectedCategory] || [];
        if (!optionSearch.trim()) return list;
        return list.filter(item => 
            (item.value || '').toLowerCase().includes(optionSearch.toLowerCase().trim())
        );
    }, [groupedOptions, selectedCategory, optionSearch]);

    // Form for option creation / editing
    const { 
        data, setData, post, put, processing, errors, reset, clearErrors 
    } = useForm({
        category: '',
        value: '',
        sort_order: 1,
        is_active: true,
    });

    // Form for new category creation
    const categoryForm = useForm({
        category: '',
        value: '',
        sort_order: 1,
        is_active: true,
    });

    const openOptionModal = (option = null) => {
        clearErrors();
        if (option) {
            setEditingOption(option);
            setData({
                category: option.category || selectedCategory,
                value: option.value || '',
                sort_order: option.sort_order ?? 1,
                is_active: Boolean(option.is_active),
            });
        } else {
            setEditingOption(null);
            const nextSort = (groupedOptions[selectedCategory]?.length || 0) + 1;
            setData({
                category: selectedCategory,
                value: '',
                sort_order: nextSort,
                is_active: true,
            });
        }
        setIsOptionModalOpen(true);
    };

    const closeOptionModal = () => {
        setIsOptionModalOpen(false);
        setEditingOption(null);
        reset();
    };

    const handleOptionSubmit = (e) => {
        e.preventDefault();
        if (editingOption) {
            put(route('settings.dropdown-options.update', editingOption.id), {
                preserveScroll: true,
                onSuccess: () => closeOptionModal(),
            });
        } else {
            post(route('settings.dropdown-options.store'), {
                preserveScroll: true,
                onSuccess: () => closeOptionModal(),
            });
        }
    };

    const openCategoryModal = () => {
        categoryForm.clearErrors();
        categoryForm.reset();
        categoryForm.setData({
            category: '',
            value: '',
            sort_order: 1,
            is_active: true,
        });
        setIsCategoryModalOpen(true);
    };

    const closeCategoryModal = () => {
        setIsCategoryModalOpen(false);
        categoryForm.reset();
    };

    const handleCategorySubmit = (e) => {
        e.preventDefault();
        const trimmedCat = categoryForm.data.category.trim();
        if (!trimmedCat) return;

        categoryForm.post(route('settings.dropdown-options.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedCategory(trimmedCat);
                closeCategoryModal();
            },
        });
    };

    const handleDelete = (option) => {
        setSelectedOption(option);
        setConfirmingDeletion(true);
    };

    const confirmDeletion = () => {
        if (!selectedOption) return;
        setDeletionProcessing(true);
        router.delete(route('settings.dropdown-options.destroy', selectedOption.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeletionProcessing(false);
                setConfirmingDeletion(false);
                setSelectedOption(null);
            }
        });
    };

    return (
        <SettingsLayout
            activeTab="dropdown-options"
            title="Dropdown Settings"
            description="Manage dynamic dropdown categories and selectable options used across Employee profiles, attendance, visas, and HR forms."
        >
            <Head title="Dropdown Settings" />

            <div className="w-full space-y-5">
                {/* Main Content Grid */}
                <div className="flex flex-col lg:flex-row gap-5 items-start">

                    {/* Sidebar: Categories */}
                    <div className="w-full lg:w-72 flex-shrink-0 space-y-3">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 sticky top-20">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <FiLayers className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Categories
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={openCategoryModal}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm transition-all active:scale-95"
                                    title="Add New Category"
                                >
                                    <FiPlus className="w-3.5 h-3.5" />
                                    <span>New</span>
                                </button>
                            </div>

                            {/* Category Search */}
                            <div className="relative mb-3">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                                <input
                                    type="text"
                                    value={categorySearch}
                                    onChange={(e) => setCategorySearch(e.target.value)}
                                    placeholder="Search categories..."
                                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                />
                            </div>

                            {/* Category list */}
                            <div className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                                {filteredCategories.length > 0 ? (
                                    filteredCategories.map((category) => {
                                        const count = groupedOptions[category]?.length || 0;
                                        const isSelected = selectedCategory === category;

                                        return (
                                            <button
                                                key={category}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCategory(category);
                                                    setOptionSearch('');
                                                }}
                                                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between group ${
                                                    isSelected
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                                                }`}
                                            >
                                                <span className="truncate pr-2">{category}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                                    isSelected
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                                                }`}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-6 text-slate-400 text-xs">
                                        No categories found.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Options Panel */}
                    <div className="flex-1 w-full space-y-4">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden min-h-[480px] flex flex-col">
                            {/* Header Bar */}
                            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="p-1.5 bg-indigo-100/70 text-indigo-700 rounded-md text-xs font-semibold">
                                            {selectedCategory}
                                        </span>
                                        <h3 className="text-sm font-semibold text-slate-800">
                                            Options
                                        </h3>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {currentOptions.length} option{currentOptions.length === 1 ? '' : 's'} defined for this category
                                    </p>
                                </div>

                                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                    {/* Option search */}
                                    <div className="relative flex-1 sm:w-56">
                                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                                        <input
                                            type="text"
                                            value={optionSearch}
                                            onChange={(e) => setOptionSearch(e.target.value)}
                                            placeholder="Search options..."
                                            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => openOptionModal()}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-medium shadow-sm transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0"
                                    >
                                        <FiPlus className="w-4 h-4" />
                                        <span>Add Option</span>
                                    </button>
                                </div>
                            </div>

                            {/* Content Grid */}
                            <div className="p-5 flex-1 bg-slate-50/20">
                                {currentOptions && currentOptions.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                                        {currentOptions.map((option) => (
                                            <div 
                                                key={option.id} 
                                                className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group relative flex flex-col justify-between"
                                            >
                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600 font-mono">
                                                            <FiHash className="w-2.5 h-2.5" /> {option.sort_order}
                                                        </span>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                type="button"
                                                                onClick={() => openOptionModal(option)}
                                                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                                title="Edit"
                                                            >
                                                                <FiEdit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(option)}
                                                                className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                                                                title="Delete"
                                                            >
                                                                <FiTrash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <h4 className="font-semibold text-slate-800 text-sm mb-2 break-words" title={option.value}>
                                                        {option.value}
                                                    </h4>
                                                </div>

                                                <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                                                    {option.is_active ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                            <FiCheckCircle className="w-3 h-3" /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                                            <FiXCircle className="w-3 h-3" /> Inactive
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-slate-300 font-mono">
                                                        ID: {option.id}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-400 space-y-3">
                                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                            <FiTag className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">
                                                No options in "{selectedCategory}"
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Click "Add Option" above to create your first option value.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => openOptionModal()}
                                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 mt-2"
                                        >
                                            <FiPlus className="w-4 h-4" />
                                            Add First Option
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deletion Confirmation Modal */}
            <ConfirmationModal
                show={confirmingDeletion}
                title="Delete Dropdown Option"
                message={`Are you sure you want to delete "${selectedOption?.value}" from "${selectedOption?.category}"? This action cannot be undone.`}
                onConfirm={confirmDeletion}
                onClose={() => setConfirmingDeletion(false)}
                type="danger"
                processing={deletionProcessing}
            />

            {/* Add / Edit Option Modal */}
            {isOptionModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-base font-semibold text-slate-800">
                                    {editingOption ? 'Edit Dropdown Option' : 'Add Dropdown Option'}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {editingOption ? 'Update option details below.' : `Add a new choice to ${data.category || selectedCategory}.`}
                                </p>
                            </div>
                            <button 
                                onClick={closeOptionModal} 
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <FiXCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleOptionSubmit} className="p-6 space-y-4">
                            {/* Category Selector */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Category <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {allCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                {errors.category && <p className="text-xs text-rose-500 font-normal mt-1">{errors.category}</p>}
                            </div>

                            {/* Option Value */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Option Value <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.value}
                                    onChange={(e) => setData('value', e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                    placeholder="e.g. Senior Stylist, Work Visa..."
                                    autoFocus
                                    required
                                />
                                {errors.value && <p className="text-xs text-rose-500 font-normal mt-1">{errors.value}</p>}
                            </div>

                            {/* Sort Order & Active */}
                            <div className="grid grid-cols-2 gap-4 pt-1">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                        Sort Order
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.sort_order}
                                        onChange={(e) => setData('sort_order', e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all select-none">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                        />
                                        <span className="text-xs font-semibold text-slate-700">Active</span>
                                    </label>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeOptionModal}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider shadow-md shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : (editingOption ? 'Save Changes' : 'Create Option')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create New Category Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-base font-semibold text-slate-800">
                                    Create New Category
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Add a new dropdown category with an initial option.
                                </p>
                            </div>
                            <button 
                                onClick={closeCategoryModal} 
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <FiXCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Category Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={categoryForm.data.category}
                                    onChange={(e) => categoryForm.setData('category', e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                    placeholder="e.g. Uniform Size, Certification Type"
                                    autoFocus
                                    required
                                />
                                {categoryForm.errors.category && (
                                    <p className="text-xs text-rose-500 font-normal mt-1">{categoryForm.errors.category}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                    First Option Value <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={categoryForm.data.value}
                                    onChange={(e) => categoryForm.setData('value', e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                    placeholder="e.g. Medium, Level 1..."
                                    required
                                />
                                {categoryForm.errors.value && (
                                    <p className="text-xs text-rose-500 font-normal mt-1">{categoryForm.errors.value}</p>
                                )}
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeCategoryModal}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={categoryForm.processing}
                                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider shadow-md shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {categoryForm.processing ? 'Creating...' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SettingsLayout>
    );
}
