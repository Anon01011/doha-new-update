import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    FaSearch, FaPlus, FaEdit, FaTrash, FaTag, FaCheckCircle, FaTimesCircle, 
    FaShieldAlt, FaLayerGroup
} from 'react-icons/fa';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index({ categories, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        description: '',
        color_code: '#6366f1',
        is_active: true,
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('training-categories.index'), { search: searchTerm }, { preserveState: true });
    };

    const openCreateModal = () => {
        setEditingCategory(null);
        reset();
        clearErrors();
        setShowModal(true);
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setData({
            name: category.name,
            description: category.description || '',
            color_code: category.color_code || '#6366f1',
            is_active: Boolean(category.is_active),
        });
        clearErrors();
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingCategory) {
            put(route('training-categories.update', editingCategory.id), {
                onSuccess: () => setShowModal(false),
            });
        } else {
            post(route('training-categories.store'), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [deletionProcessing, setDeletionProcessing] = useState(false);

    const handleDelete = (category) => {
        setSelectedCategory(category);
        setConfirmingDeletion(true);
    };

    const confirmDeletion = () => {
        setDeletionProcessing(true);
        router.delete(route('training-categories.destroy', selectedCategory.id), {
            onFinish: () => { setDeletionProcessing(false); setConfirmingDeletion(false); }
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Training Categories</h2>}>
            <Head title="Training Categories" />

            <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <p className="text-xs font-normal text-slate-400 mb-1">Total Categories</p>
                        <h3 className="text-2xl font-normal text-slate-900">{categories?.total || 0}</h3>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <p className="text-xs font-normal text-slate-400 mb-1">Active</p>
                        <h3 className="text-2xl font-normal text-slate-900">
                            {categories?.data?.filter(c => c.is_active).length || 0}
                        </h3>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg shadow-sm md:col-span-2 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-normal text-slate-400 mb-1">Categories</p>
                            <h3 className="text-lg font-normal text-white">Organize Training Topics</h3>
                        </div>
                        <FaLayerGroup className="text-white opacity-10" size={32} />
                    </div>
                </div>

                {/* Search & Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <form onSubmit={handleSearch} className="relative group w-full sm:w-80">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-primary transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </form>

                    <button
                        onClick={openCreateModal}
                        className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg text-sm font-normal hover:brightness-110 transition-all flex items-center justify-center gap-2"
                    >
                        <FaPlus size={11} />
                        Add Category
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="px-5 py-3 text-xs font-normal text-slate-500 border-b border-slate-100">Category</th>
                                    <th className="px-5 py-3 text-xs font-normal text-slate-500 border-b border-slate-100">Description</th>
                                    <th className="px-5 py-3 text-xs font-normal text-slate-500 border-b border-slate-100 text-center">Status</th>
                                    <th className="px-5 py-3 text-xs font-normal text-slate-500 border-b border-slate-100 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {categories.data.map((category) => (
                                    <tr key={category.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                                                    style={{ backgroundColor: category.color_code || '#6366f1' }}
                                                >
                                                    <FaTag size={11} />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-normal text-slate-800 block">{category.name}</span>
                                                    <span className="text-xs text-slate-400">#{String(category.id).padStart(4, '0')}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <p className="text-sm text-slate-500 line-clamp-1 max-w-sm">
                                                {category.description || 'No description.'}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            {category.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-normal bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <FaCheckCircle size={9} /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-normal bg-slate-50 text-slate-400 border border-slate-200">
                                                    <FaTimesCircle size={9} /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => openEditModal(category)}
                                                    className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5 rounded-lg transition-all"
                                                >
                                                    <FaEdit size={11} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category)}
                                                    className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <FaTrash size={11} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {categories.data.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 bg-slate-50 text-slate-200 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-100">
                                                    <FaTag size={18} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-normal text-slate-700">No Categories Found</h3>
                                                    <p className="text-xs text-slate-400 mt-1">Create your first training category to get started.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {categories.links && categories.links.length > 3 && (
                    <div className="flex justify-center pt-4">
                        <div className="flex gap-1 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                            {categories.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-normal transition-all ${link.active
                                        ? 'bg-slate-900 text-white'
                                        : !link.url
                                            ? 'text-slate-300 cursor-not-allowed'
                                            : 'text-slate-400 hover:text-primary hover:bg-primary/5'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex gap-3">
                    <FaShieldAlt className="text-primary shrink-0 mt-0.5" size={14} />
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Changes to categories may affect existing training records and reports.
                    </p>
                </div>
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-base font-normal text-slate-900">
                                    {editingCategory ? 'Edit Category' : 'Add Category'}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {editingCategory ? 'Update category details.' : 'Create a new training category.'}
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <FaTimesCircle size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-normal text-slate-600">Category Name <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                                    placeholder="e.g. Technical Skills"
                                    required
                                />
                                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-normal text-slate-600">Description</label>
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none resize-none min-h-[80px]"
                                    placeholder="Describe what this category covers..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-normal text-slate-600">Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={data.color_code}
                                            onChange={e => setData('color_code', e.target.value)}
                                            className="h-10 w-10 rounded-lg border border-slate-200 cursor-pointer p-1 bg-white"
                                        />
                                        <input
                                            type="text"
                                            value={data.color_code}
                                            onChange={e => setData('color_code', e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                                            maxLength="7"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-white transition-all">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={e => setData('is_active', e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                                        />
                                        <span className="text-sm font-normal text-slate-600">Active</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-normal hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-normal hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {processing
                                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        : (editingCategory ? 'Save Changes' : 'Add Category')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                show={confirmingDeletion}
                title="Delete Category"
                message={`Are you sure you want to delete the category "${selectedCategory?.name}"? This may affect existing training records.`}
                onConfirm={confirmDeletion}
                onClose={() => setConfirmingDeletion(false)}
                type="danger"
                confirmText="Delete"
                processing={deletionProcessing}
            />
        </AuthenticatedLayout>
    );
}
