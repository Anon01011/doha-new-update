import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    FaLayerGroup,
    FaBuilding,
    FaSearch,
    FaEllipsisV,
    FaPlus,
    FaUsers,
    FaExchangeAlt,
    FaToggleOn,
    FaToggleOff,
    FaChevronRight,
    FaTrash,
    FaEdit,
    FaEye,
    FaCogs,
    FaFilter,
    FaChartPie
} from 'react-icons/fa';
import Dropdown from '@/Components/Dropdown';
import Modal from '@/Components/Modal';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index({ departments = [] }) {
    const { auth } = usePage().props;
    const [searchQuery, setSearchQuery] = useState('');
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [selectedDept, setSelectedDept] = useState(null);
    const [targetDeptId, setTargetDeptId] = useState('');

    const filteredDepartments = useMemo(() => {
        return departments.filter(dept =>
            dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (dept.companies && dept.companies.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())))
        );
    }, [departments, searchQuery]);

    const stats = useMemo(() => {
        return {
            total: departments.length,
            active: departments.filter(d => d.status === 'active').length,
            staffTotal: departments.reduce((acc, curr) => acc + (curr.employees_count || 0), 0),
            avgStaff: departments.length > 0 ? Math.round(departments.reduce((acc, curr) => acc + (curr.employees_count || 0), 0) / departments.length) : 0
        };
    }, [departments]);

    const [confirmingAction, setConfirmingAction] = useState({
        show: false,
        type: 'danger',
        title: '',
        message: '',
        onConfirm: null,
        processing: false
    });

    const handleDelete = (id) => {
        setConfirmingAction({
            show: true,
            type: 'danger',
            title: 'PURGE DEPARTMENT ENTITY',
            message: 'Confirm intent to purge this department entity and all associated taxonomy data. This action is immutable.',
            onConfirm: () => {
                setConfirmingAction(prev => ({ ...prev, processing: true }));
                router.delete(route('departments.destroy', id), {
                    preserveScroll: true,
                    onFinish: () => setConfirmingAction(prev => ({ ...prev, show: false, processing: false }))
                });
            }
        });
    };

    const handleToggleStatus = (dept) => {
        const newStatus = dept.status === 'active' ? 'inactive' : 'active';
        setConfirmingAction({
            show: true,
            type: newStatus === 'active' ? 'success' : 'warning',
            title: `${newStatus === 'active' ? 'AUTHORIZE' : 'DECOMMISSION'} DEPARTMENT`,
            message: `Confirm transition of this department to ${newStatus === 'active' ? 'ACTIVE' : 'INACTIVE'} state.`,
            onConfirm: () => {
                setConfirmingAction(prev => ({ ...prev, processing: true }));
                router.patch(route('departments.toggle-status', dept.id), {
                    status: newStatus
                }, {
                    preserveScroll: true,
                    onFinish: () => setConfirmingAction(prev => ({ ...prev, show: false, processing: false }))
                });
            }
        });
    };

    const openTransferModal = (dept) => {
        setSelectedDept(dept);
        setShowTransferModal(true);
    };

    const handleTransferStaff = (e) => {
        e.preventDefault();
        router.post(route('departments.transfer-staff', selectedDept.id), {
            target_department_id: targetDeptId
        }, {
            onSuccess: () => {
                setShowTransferModal(false);
                setSelectedDept(null);
                setTargetDeptId('');
            }
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800 tracking-normal">Organization Taxonomy</h2>}>
            <Head title="Departments" />

            <div className="py-2 px-3 sm:px-4 lg:px-6 space-y-4">
                {/* Executive Dashboard Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 text-primary opacity-10 group-hover:scale-110 transition-transform">
                            <FaLayerGroup size={40} />
                        </div>
                        <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-0.5">Total Divisions</p>
                        <h4 className="text-2xl font-normal text-slate-900 tracking-normal">{stats.total}</h4>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-[9px] font-normal text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-normal">{stats.active} ACTIVE</span>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 text-indigo-500 opacity-10 group-hover:scale-110 transition-transform">
                            <FaUsers size={40} />
                        </div>
                        <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-0.5">Cumulative Staff</p>
                        <h4 className="text-2xl font-normal text-slate-900 tracking-normal">{stats.staffTotal}</h4>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-[9px] font-normal text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-normal">VERIFIED PERSONNEL</span>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 text-amber-500 opacity-10 group-hover:scale-110 transition-transform">
                            <FaChartPie size={40} />
                        </div>
                        <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-0.5">Mean Allocation</p>
                        <h4 className="text-2xl font-normal text-slate-900 tracking-normal">{stats.avgStaff}</h4>
                        <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mt-2">PERSONNEL PER UNIT</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 text-slate-900 opacity-10 group-hover:scale-110 transition-transform">
                            <FaCogs size={40} />
                        </div>
                        <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-0.5">System State</p>
                        <h4 className="text-xl font-normal text-slate-900 tracking-normal uppercase tracking-normal">OPERATIONAL</h4>
                        <p className="text-[9px] font-normal text-emerald-500 uppercase tracking-normal mt-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            STABLE
                        </p>
                    </div>
                </div>

                {/* Executive Control Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl shadow-xl shadow-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <FaLayerGroup size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-normal text-white uppercase tracking-normal">Tactical Taxonomy Ledger</h3>
                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-[0.3em] mt-1">Management of Organizational Units</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                            <input
                                type="text"
                                placeholder="IDENTIFY UNIT..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-6 py-3 bg-white/5 border border-white/10 rounded-lg text-[10px] font-normal text-white placeholder:text-slate-600 focus:bg-white/10 focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all outline-none uppercase tracking-normal"
                            />
                        </div>
                        <Link
                            href={route('departments.create')}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-primary hover:brightness-110 text-white px-8 py-3.5 rounded-lg text-[10px] font-normal uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-primary/20"
                        >
                            <FaPlus size={10} />
                            Initiate Unit
                        </Link>
                    </div>
                </div>

                {/* Tactical Ledger Pattern */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em]">
                                    <th className="px-5 py-4">Division Identity</th>
                                    <th className="px-5 py-4">Branch Association</th>
                                    <th className="px-5 py-4 text-center">Personnel Count</th>
                                    <th className="px-5 py-4 text-center">Operational State</th>
                                    <th className="px-5 py-4 text-right">Ledger Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredDepartments.length > 0 ? (
                                    filteredDepartments.map((dept) => (
                                        <tr key={dept.id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-5 py-2">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${dept.status === 'active' ? 'bg-primary/5 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                                                        <FaLayerGroup size={14} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-normal text-slate-900 uppercase tracking-normal group-hover:text-primary transition-colors">{dept.name}</div>
                                                        <div className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mt-1">ID: {dept.id.toString().padStart(4, '0')}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-2">
                                                <div className="flex flex-wrap gap-2">
                                                    {dept.companies && dept.companies.length > 0 ? (
                                                        dept.companies.map(c => (
                                                            <span key={c.id} className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md text-[8px] font-normal text-slate-600 uppercase tracking-normal shadow-sm">
                                                                <FaBuilding size={7} className="text-slate-400" />
                                                                {c.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[9px] font-normal text-rose-400 uppercase tracking-normal bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">UNASSIGNED</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-2 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-base font-normal text-slate-900">{dept.employees_count || 0}</span>
                                                    <span className="text-[8px] font-normal text-slate-400 uppercase tracking-normal">ACTIVE STAFF</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-2 text-center">
                                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-normal uppercase tracking-normal border transition-all ${
                                                    dept.status === 'active' 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                                    : 'bg-slate-100 text-slate-400 border-slate-200 grayscale'
                                                }`}>
                                                    <span className={`w-1 h-1 rounded-full ${dept.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                                    {dept.status === 'active' ? 'OPERATIONAL' : 'OFFLINE'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-2">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                    <Link
                                                        href={route('departments.show', dept.id)}
                                                        className="p-1.5 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100 rounded-md transition-all shadow-sm active:scale-95"
                                                        title="VIEW INSIGHTS"
                                                    >
                                                        <FaEye size={12} />
                                                    </Link>
                                                    <Link
                                                        href={route('departments.edit', dept.id)}
                                                        className="p-1.5 bg-white text-slate-400 hover:text-primary hover:bg-primary/5 border border-slate-100 rounded-md transition-all shadow-sm active:scale-95"
                                                        title="MODIFY CONFIG"
                                                    >
                                                        <FaEdit size={12} />
                                                    </Link>
                                                    <button
                                                        onClick={() => openTransferModal(dept)}
                                                        className="p-1.5 bg-white text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-slate-100 rounded-md transition-all shadow-sm active:scale-95"
                                                        title="TRANSFER PERSONNEL"
                                                    >
                                                        <FaExchangeAlt size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(dept)}
                                                        className={`p-1.5 bg-white border border-slate-100 rounded-md transition-all shadow-sm active:scale-95 ${
                                                            dept.status === 'active' ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                                        }`}
                                                        title={dept.status === 'active' ? 'DECOMMISSION' : 'AUTHORIZE'}
                                                    >
                                                        {dept.status === 'active' ? <FaToggleOn size={12} /> : <FaToggleOff size={12} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(dept.id)}
                                                        className="p-1.5 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-100 rounded-md transition-all shadow-sm active:scale-95"
                                                        title="PURGE ENTITY"
                                                    >
                                                        <FaTrash size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-5 py-10 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-20">
                                                <FaLayerGroup size={48} className="text-slate-900" />
                                                <p className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.3em]">No taxonomy records identified</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - Professional */}
                    {departments.links && departments.links.length > 3 && (
                        <div className="bg-slate-50/50 px-8 py-6 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-[9px] font-normal text-slate-400 uppercase tracking-[0.2em]">
                                Page Record: <span className="text-slate-900">{filteredDepartments.length} UNITSIDENTIFIED</span>
                            </p>
                            <div className="flex items-center gap-1.5">
                                {departments.links.map((link, i) => (
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={`min-w-[36px] h-9 flex items-center justify-center rounded-lg text-[10px] font-normal transition-all ${link.active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-slate-500 border border-slate-100 hover:border-primary/40 hover:text-primary'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="min-w-[36px] h-9 flex items-center justify-center rounded-lg text-[10px] font-normal text-slate-200 bg-slate-50 border border-transparent cursor-not-allowed"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Integrity Guard */}
                <div className="bg-slate-50 rounded-lg p-5 border border-slate-200 flex flex-col md:flex-row items-center gap-4 justify-between">
                    <div className="flex items-center gap-4 text-slate-500">
                        <FaLayerGroup size={24} className="opacity-20" />
                        <p className="text-[10px] font-normal uppercase tracking-normal leading-relaxed max-w-xl">
                            The taxonomy ledger represents the structural integrity of the organization. Modifications to division state or personnel allocation directly impact operational analytics and historical audit trails.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-normal text-slate-400 uppercase tracking-normal">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        Taxonomy Verified
                    </div>
                </div>
            </div>

            {/* Transfer Staff Modal */}
            <Modal show={showTransferModal} onClose={() => setShowTransferModal(false)}>
                <div className="bg-slate-900 px-10 py-8 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-normal text-white uppercase tracking-normal flex items-center gap-3">
                            <FaExchangeAlt className="text-primary" /> PERSONNEL REALLOCATION
                        </h2>
                        <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mt-1">Transfer of Departmental Staff</p>
                    </div>
                    <button onClick={() => setShowTransferModal(false)} className="w-10 h-10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg flex items-center justify-center transition-all">
                        <FaChevronRight className="rotate-90" size={12}/>
                    </button>
                </div>
                <div className="p-10 space-y-8">
                    <div className="p-6 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-normal text-slate-500 uppercase tracking-normal leading-relaxed">
                            Moving personnel from <span className="text-slate-900">{selectedDept?.name}</span> to the target unit. This action updates all associated employee records in real-time.
                        </p>
                    </div>

                    <form onSubmit={handleTransferStaff} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[9px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1">Target Taxonomy Unit</label>
                            <div className="relative">
                                <select
                                    value={targetDeptId}
                                    onChange={(e) => setTargetDeptId(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-lg text-[10px] font-normal uppercase tracking-normal focus:bg-white focus:border-primary/20 transition-all outline-none appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="">SELECT DESTINATION UNIT</option>
                                    {departments
                                        .filter(d => {
                                            if (d.id === selectedDept?.id) return false;
                                            const shared = d.companies?.some(c1 =>
                                                selectedDept?.companies?.some(c2 => c1.id === c2.id)
                                            );
                                            return shared;
                                        })
                                        .map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))
                                    }
                                </select>
                                <FaChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" size={10} />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setShowTransferModal(false)}
                                className="flex-1 px-8 py-4 border border-slate-200 rounded-lg text-slate-900 text-[10px] font-normal uppercase tracking-normal hover:bg-slate-50 transition-all active:scale-95"
                            >
                                ABORT TRANSFER
                            </button>
                            <button
                                type="submit"
                                disabled={!targetDeptId}
                                className="flex-1 px-8 py-4 bg-primary text-white rounded-lg text-[10px] font-normal uppercase tracking-normal shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                            >
                                COMMIT ALLOCATIONS
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmationModal
                show={confirmingAction.show}
                title={confirmingAction.title}
                message={confirmingAction.message}
                onConfirm={confirmingAction.onConfirm}
                onClose={() => setConfirmingAction(prev => ({ ...prev, show: false }))}
                type={confirmingAction.type}
                processing={confirmingAction.processing}
            />
        </AuthenticatedLayout>
    );
}