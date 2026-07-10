import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { FaPlus, FaSearch, FaEye, FaEdit, FaTrash, FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaClock, FaChevronDown, FaFileInvoiceDollar } from 'react-icons/fa';
import Avatar from '@/Components/Avatar';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index({ salaryPostings, month, year, userRole = 'employee' }) {
    const { appSettings } = usePage().props;
    const currency = appSettings?.currency || 'QAR';

    const [modal, setModal] = useState({
        show: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: () => { },
        processing: false
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusStyles = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'approved') return {
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-600',
            border: 'border-emerald-500/20',
            icon: <FaCheckCircle size={10} />
        };
        if (s === 'posted') return {
            bg: 'bg-blue-500/10',
            text: 'text-blue-600',
            border: 'border-blue-500/20',
            icon: <FaFileInvoiceDollar size={10} />
        };
        if (s === 'rejected') return {
            bg: 'bg-rose-500/10',
            text: 'text-rose-600',
            border: 'border-rose-500/20',
            icon: <FaTimesCircle size={10} />
        };
        return {
            bg: 'bg-amber-500/10',
            text: 'text-amber-600',
            border: 'border-amber-500/20',
            icon: <FaClock size={10} />
        };
    };

    const closeModal = () => setModal(prev => ({ ...prev, show: false }));

    const handleDelete = (id) => {
        setModal({
            show: true,
            title: 'Delete Record',
            message: 'Are you sure you want to delete this salary record? This action cannot be undone.',
            type: 'danger',
            onConfirm: () => {
                setModal(prev => ({ ...prev, processing: true }));
                router.delete(route('salary-postings.destroy', id), {
                    onFinish: () => closeModal()
                });
            }
        });
    };

    const months = [
        { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
        { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
        { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    const [selectedIds, setSelectedIds] = React.useState([]);

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(salaryPostings.data.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(itemId => itemId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkAction = (action) => {
        setModal({
            show: true,
            title: 'Bulk Action',
            message: `Are you sure you want to ${action} ${selectedIds.length} selected records?`,
            type: action === 'delete' ? 'danger' : 'warning',
            onConfirm: () => {
                setModal(prev => ({ ...prev, processing: true }));
                router.post(route('salary-postings.bulk-action'), {
                    ids: selectedIds,
                    action: action
                }, {
                    onSuccess: () => {
                        setSelectedIds([]);
                        closeModal();
                    },
                    onFinish: () => closeModal()
                });
            }
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-base font-normal text-slate-800">Salary Records</h2>}>
            <Head title="Salary Management" />

            <div className="py-3 px-4 sm:px-6 lg:px-8 space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="rounded-lg p-4 text-white shadow-md relative overflow-hidden group" style={{ backgroundColor: 'var(--secondary-color)' }}>
                        <div className="absolute -right-3 -bottom-3 opacity-10 group-hover:scale-110 transition-transform">
                            <FaMoneyBillWave size={60} />
                        </div>
                        <p className="text-[11px] font-normal text-slate-300 uppercase tracking-normal mb-1">Total Salary</p>
                        <h3 className="text-xl font-normal text-white">
                            {formatCurrency(salaryPostings.data.reduce((acc, curr) => acc + parseFloat(curr.net_salary || 0), 0))}
                        </h3>
                        <div className="mt-3">
                            <span className="text-[10px] font-normal uppercase tracking-normal bg-white/10 px-2 py-0.5 rounded text-white/80">Live Data</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                        <p className="text-[11px] font-normal text-slate-400 uppercase tracking-normal mb-1">Total</p>
                        <h3 className="text-xl font-normal text-slate-900">{salaryPostings.total} <span className="text-xs text-slate-400 font-normal">records</span></h3>
                        <div className="mt-3 flex -space-x-1.5">
                            {salaryPostings.data.slice(0, 4).map((p, i) => (
                                <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-normal text-slate-600">
                                    {p.employee?.name?.charAt(0)}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                        <p className="text-[11px] font-normal text-slate-400 uppercase tracking-normal mb-1">Period</p>
                        <h3 className="text-xl font-normal text-slate-900">
                            {months.find(m => m.value == month)?.label || 'Period'}
                        </h3>
                        <p className="text-xs font-normal text-primary mt-1">{year}</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                        <p className="text-[11px] font-normal text-slate-400 uppercase tracking-normal mb-1">Status</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-sm font-normal text-slate-700">Active</span>
                        </div>
                    </div>
                </div>

                {/* Filter / Controls */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-56">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={11} />
                            <input
                                type="text"
                                placeholder="Search records..."
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-all outline-none"
                            />
                        </div>
                        <div className="relative">
                            <select
                                className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-primary/30 focus:border-primary/40 cursor-pointer transition-all"
                                value={month}
                                onChange={(e) => router.get(route('salary-postings.index'), { month: e.target.value, year }, { preserveState: true })}
                            >
                                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={9} />
                        </div>
                        <div className="relative">
                            <select
                                className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-primary/30 focus:border-primary/40 cursor-pointer transition-all"
                                value={year}
                                onChange={(e) => router.get(route('salary-postings.index'), { month, year: e.target.value }, { preserveState: true })}
                            >
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={9} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
                                <span className="text-xs font-normal text-primary">{selectedIds.length} selected</span>
                                <button onClick={() => handleBulkAction('approve')} className="p-1.5 bg-white text-emerald-600 rounded hover:bg-emerald-50 border border-emerald-100 transition-all"><FaCheckCircle size={11} /></button>
                                <button onClick={() => handleBulkAction('delete')} className="p-1.5 bg-white text-rose-600 rounded hover:bg-rose-50 border border-rose-100 transition-all"><FaTrash size={11} /></button>
                            </div>
                        )}
                        {['admin', 'hr', 'manager'].includes(userRole) && (
                            <Link
                                href={route('salary-postings.create')}
                                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-xs font-normal hover:brightness-110 shadow shadow-primary/20 transition-all active:scale-95"
                            >
                                <FaPlus size={10} />
                                Calculate Salary
                            </Link>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="px-4 py-2.5 text-left border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary"
                                                onChange={toggleSelectAll}
                                                checked={selectedIds.length === salaryPostings.data.length && salaryPostings.data.length > 0}
                                            />
                                            <span className="text-[11px] font-normal text-slate-500 uppercase tracking-normal">Employee</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-[11px] font-normal text-slate-500 uppercase tracking-normal border-b border-slate-100">Salary</th>
                                    <th className="px-4 py-2.5 text-left text-[11px] font-normal text-slate-500 uppercase tracking-normal border-b border-slate-100">Deductions</th>
                                    <th className="px-4 py-2.5 text-left text-[11px] font-normal text-slate-500 uppercase tracking-normal border-b border-slate-100">Net Pay</th>
                                    <th className="px-4 py-2.5 text-left text-[11px] font-normal text-slate-500 uppercase tracking-normal border-b border-slate-100">Status</th>
                                    <th className="px-4 py-2.5 text-right text-[11px] font-normal text-slate-500 uppercase tracking-normal border-b border-slate-100">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {salaryPostings.data.length > 0 ? (
                                    salaryPostings.data.map((posting) => {
                                        const statusStyle = getStatusStyles(posting.status);
                                        return (
                                            <tr key={posting.id} className="group hover:bg-slate-50/60 transition-colors">
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <input
                                                            type="checkbox"
                                                            className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary"
                                                            checked={selectedIds.includes(posting.id)}
                                                            onChange={() => toggleSelect(posting.id)}
                                                        />
                                                        <Avatar
                                                            src={posting.employee?.employee_image}
                                                            name={posting.employee?.name}
                                                            size="sm"
                                                            className="rounded-lg ring-1 ring-slate-100"
                                                        />
                                                        <div>
                                                            <span className="text-xs font-normal text-slate-800 block leading-tight">{posting.employee?.name}</span>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">{posting.employee?.employee_code || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <p className="text-xs font-normal text-slate-800">{formatCurrency(posting.basic_salary)}</p>
                                                    <p className="text-[10px] text-emerald-600 mt-0.5">+{formatCurrency(posting.allowances)} <span className="text-slate-400">allowances</span></p>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="text-xs font-normal text-rose-600">-{formatCurrency(posting.deductions)}</span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="text-xs font-normal text-slate-800 block">{formatCurrency(posting.net_salary)}</span>
                                                    <p className="text-[10px] text-primary mt-0.5">Ready</p>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-normal border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                                        {statusStyle.icon}
                                                        {posting.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Link
                                                            href={route('salary-postings.show', posting.id)}
                                                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded transition-all"
                                                        >
                                                            <FaEye size={12} />
                                                        </Link>
                                                        <Link
                                                            href={route('salary-postings.edit', posting.id)}
                                                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded transition-all"
                                                        >
                                                            <FaEdit size={12} />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(posting.id)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                                                    <FaFileInvoiceDollar size={24} />
                                                </div>
                                                <h3 className="text-sm font-normal text-slate-400">No salary records found</h3>
                                                <p className="text-xs text-slate-300 mt-1 max-w-xs">
                                                    No records found for the selected period.
                                                </p>
                                                <Link
                                                    href={route('salary-postings.create')}
                                                    className="mt-5 flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-xs font-normal hover:brightness-110 shadow shadow-primary/20 transition-all active:scale-95"
                                                >
                                                    <FaPlus size={10} />
                                                    Calculate Salary
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {salaryPostings.links && salaryPostings.links.length > 3 && (
                        <div className="bg-slate-50/50 px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-xs text-slate-400">
                                Total: <span className="font-normal text-slate-600">{salaryPostings.total} records</span>
                            </p>
                            <div className="flex gap-1">
                                {salaryPostings.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`px-3 py-1.5 rounded text-xs font-normal transition-all ${link.active ? 'bg-primary text-white shadow shadow-primary/20' :
                                                !link.url ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100 hover:text-primary'
                                            }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                show={modal.show}
                onClose={closeModal}
                onConfirm={modal.onConfirm}
                title={modal.title}
                message={modal.message}
                confirmText={modal.type === 'danger' ? 'Delete' : 'Confirm'}
                type={modal.type}
                processing={modal.processing}
            />
        </AuthenticatedLayout>
    );
}
