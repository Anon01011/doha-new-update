import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaMoneyBillWave, FaCoins, FaInfoCircle, FaTag, FaChevronRight, FaFilter, FaSearch, FaCogs } from 'react-icons/fa';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index({ components }) {
    const { appSettings } = usePage().props;
    const currency = appSettings?.currency || 'QAR';

    const [modal, setModal] = useState({
        show: false,
        id: null,
        processing: false
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount || 0);
    };

    const handleDeleteClick = (id) => {
        setModal({ show: true, id, processing: false });
    };

    const confirmDelete = () => {
        setModal(prev => ({ ...prev, processing: true }));
        router.delete(route('salary-components.destroy', modal.id), {
            onFinish: () => setModal({ show: false, id: null, processing: false })
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Salary Components</h2>}>
            <Head title="Salary Components" />

            <div className="py-4 px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Executive Control Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-5 rounded-lg shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <FaCogs size={120} />
                    </div>
                    <div className="flex items-center gap-6 relative z-10">
                        <div>
                            <h2 className="text-xl font-normal text-slate-900 tracking-normal leading-none mb-2 uppercase tracking-normal">Salary Components</h2>
                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                                Manage Allowances & Deductions
                            </p>
                        </div>
                        <div className="hidden md:block h-12 w-px bg-slate-100"></div>
                        <div className="hidden md:flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center border border-slate-100">
                                <FaTag size={14} />
                            </div>
                            <div>
                                <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal leading-none mb-1">Total Items</p>
                                <p className="text-sm font-normal text-slate-900 leading-tight">{components?.data?.length || 0} Components</p>
                            </div>
                        </div>
                    </div>

                    <Link
                        href={route('salary-components.create')}
                        className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 flex items-center justify-center gap-3 relative z-10"
                    >
                        <FaPlus size={10} />
                        <span>Add New Component</span>
                    </Link>
                </div>

                {/* Analytical Grid */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-3 text-left text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Component Name</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Type</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Default Value</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Status</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {components?.data && components.data.length > 0 ? (
                                    components.data.map((component) => (
                                        <tr key={component.id} className="hover:bg-slate-50/50 transition-all group cursor-default">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs shadow-sm transition-transform group-hover:scale-110 ${
                                                        component.type === 'allowance' 
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                    }`}>
                                                        {component.type === 'allowance' ? <FaCoins size={14}/> : <FaMoneyBillWave size={14}/>}
                                                    </div>
                                                    <div>
                                                        <div className="text-[11px] font-normal text-slate-900 tracking-normal uppercase">{component.name}</div>
                                                        <div className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mt-0.5">UID: SCH-{component.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-normal uppercase tracking-normal border ${
                                                    component.type === 'allowance'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                                                }`}>
                                                    {component.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="space-y-1">
                                                    <div className="text-[11px] font-normal text-slate-900 tracking-normal">
                                                        {component.default_amount ? (
                                                            component.value_type === 'percentage' 
                                                            ? `${component.default_amount}%`
                                                            : formatCurrency(component.default_amount)
                                                        ) : '0.00'}
                                                    </div>
                                                    <div className="text-[8px] font-normal text-slate-400 uppercase tracking-[0.2em]">{component.value_type || 'FLAT'}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                    <span className="text-[10px] font-normal text-slate-600 uppercase tracking-normal">Active</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    <Link
                                                        href={route('salary-components.edit', component.id)}
                                                        className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all shadow-sm active:scale-95"
                                                        title="Edit Component"
                                                    >
                                                        <FaEdit size={12} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteClick(component.id)}
                                                        className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shadow-sm active:scale-95"
                                                        title="Delete Component"
                                                    >
                                                        <FaTrash size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <div className="max-w-xs mx-auto space-y-4">
                                                <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-lg flex items-center justify-center mx-auto border-2 border-dashed border-slate-100">
                                                    <FaMoneyBillWave size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-[11px] font-normal text-slate-900 uppercase tracking-normal">No Components</h3>
                                                    <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mt-1 leading-relaxed">Please add your first salary component.</p>
                                                </div>
                                                <Link href={route('salary-components.create')} className="inline-flex items-center gap-2 text-[9px] font-normal text-indigo-600 uppercase tracking-[0.2em] hover:gap-3 transition-all pt-2">
                                                    Define First Component <FaChevronRight size={8} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Intelligent Guidance */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-emerald-50/50 p-6 rounded-lg border border-emerald-100/50 flex gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm shrink-0 border border-emerald-50"><FaCoins size={14}/></div>
                        <div>
                            <h4 className="text-[10px] font-normal text-emerald-900 uppercase tracking-normal mb-1">Allowance</h4>
                            <p className="text-[9px] font-normal text-emerald-600/80 uppercase tracking-normal leading-relaxed">Allowances increase the total salary.</p>
                        </div>
                    </div>
                    <div className="bg-rose-50/50 p-6 rounded-lg border border-rose-100/50 flex gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-rose-600 shadow-sm shrink-0 border border-rose-50"><FaMoneyBillWave size={14}/></div>
                        <div>
                            <h4 className="text-[10px] font-normal text-rose-900 uppercase tracking-normal mb-1">Deduction</h4>
                            <p className="text-[9px] font-normal text-rose-600/80 uppercase tracking-normal leading-relaxed">Deductions decrease the final net salary.</p>
                        </div>
                    </div>
                    <div className="bg-blue-50/50 p-6 rounded-lg border border-blue-100/50 flex gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm shrink-0 border border-blue-50"><FaInfoCircle size={14}/></div>
                        <div>
                            <h4 className="text-[10px] font-normal text-blue-900 uppercase tracking-normal mb-1">Summary</h4>
                            <p className="text-[9px] font-normal text-blue-600/80 uppercase tracking-normal leading-relaxed">Updating components will affect future salary calculations.</p>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                show={modal.show}
                onClose={() => setModal({ show: false, id: null, processing: false })}
                onConfirm={confirmDelete}
                title="Delete Component"
                message="Are you sure you want to delete this component? This will affect future salary calculations."
                confirmText="DELETE COMPONENT"
                type="danger"
                processing={modal.processing}
            />
        </AuthenticatedLayout>
    );
}
