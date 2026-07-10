import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { FaUser, FaSearch, FaFilter, FaPlus, FaCheckCircle, FaTrash, FaEye, FaEdit, FaMoneyBillWave, FaCalendarAlt, FaTimesCircle, FaClock, FaChevronRight, FaArrowUp, FaShieldAlt, FaChartLine } from 'react-icons/fa';
import Avatar from '@/Components/Avatar';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index({ advances, status, userRole = 'employee', search: initialSearch = '' }) {
    const { auth, appSettings } = usePage().props;
    const permissions = auth.user?.permissions || [];
    const hasPermission = (slug) => permissions.includes(slug);
    const isAdmin = auth.user?.role === 'admin';
    const currency = appSettings?.currency || 'QAR';

    const [searchTerm, setSearchTerm] = useState(initialSearch || '');
    const [modal, setModal] = useState({
        show: false,
        id: null,
        processing: false
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('advances.index'), { search: searchTerm, status }, { preserveState: true });
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: currency 
    }).format(amount || 0);

    const getStatusStyles = (status) => {
        const s = status?.toLowerCase() || '';
        const styles = {
            approved: { 
                bg: 'bg-emerald-500/10', 
                text: 'text-emerald-600', 
                border: 'border-emerald-500/20', 
                label: 'AUTHORIZED' 
            },
            repaid: { 
                bg: 'bg-indigo-500/10', 
                text: 'text-indigo-600', 
                border: 'border-indigo-500/20', 
                label: 'FULLY RECOUPED' 
            },
            rejected: { 
                bg: 'bg-rose-500/10', 
                text: 'text-rose-600', 
                border: 'border-rose-500/20', 
                label: 'REJECTED' 
            },
            pending: { 
                bg: 'bg-amber-500/10', 
                text: 'text-amber-600', 
                border: 'border-amber-500/20', 
                label: 'AWAITING AUDIT' 
            },
        };
        return styles[s] || styles.pending;
    };

    const handleDeleteClick = (id) => {
        setModal({ show: true, id, processing: false });
    };

    const confirmDelete = () => {
        setModal(prev => ({ ...prev, processing: true }));
        router.delete(route('advances.destroy', modal.id), {
            onFinish: () => setModal({ show: false, id: null, processing: false })
        });
    };

    const StatusTab = ({ label, value }) => {
        const isActive = status === value || (!status && !value);
        return (
            <Link
                href={route('advances.index', { status: value, search: searchTerm })}
                className={`px-6 py-2 text-[10px] font-normal uppercase tracking-normal rounded-lg transition-all ${isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                    : 'text-slate-400 hover:text-primary hover:bg-primary/5'
                    }`}
            >
                {label}
            </Link>
        );
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Salary Advances</h2>}>
            <Head title="Salary Advances" />

            <div className="p-4 sm:p-6 space-y-4">
                {/* Executive Dashboard Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 text-emerald-500 opacity-10 group-hover:scale-110 transition-transform">
                            <FaArrowUp size={40} />
                        </div>
                        <p className="text-[10px] font-normal text-slate-400 uppercase mb-1">Total Advances</p>
                        <h3 className="text-2xl font-normal text-slate-900 tracking-normal">{formatCurrency(advances?.data?.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0))}</h3>
                        <p className="text-[9px] font-normal text-emerald-500 uppercase mt-1 flex items-center gap-1">
                            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                            ACTIVE ADVANCES
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 text-amber-500 opacity-10 group-hover:scale-110 transition-transform">
                            <FaClock size={40} />
                        </div>
                        <p className="text-[10px] font-normal text-slate-400 uppercase mb-1">Pending Requests</p>
                        <h3 className="text-2xl font-normal text-slate-900 tracking-normal">{advances?.data?.filter(a => a.status?.toLowerCase() === 'pending').length || 0} Requests</h3>
                        <p className="text-[9px] font-normal text-amber-500 uppercase mt-1 flex items-center gap-1">
                            <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></span>
                            AWAITING APPROVAL
                        </p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg shadow-xl shadow-slate-200 relative overflow-hidden group md:col-span-2">
                        <div className="absolute top-0 right-0 p-4 text-primary opacity-20 group-hover:scale-110 transition-transform">
                            <FaChartLine size={80} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-normal text-slate-500 uppercase mb-1">Advance Overview</p>
                            <h3 className="text-2xl font-normal text-white tracking-normal">Advance Statistics</h3>
                            <div className="mt-4 flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    <span className="text-[10px] font-normal text-slate-300 uppercase">Total Recovered</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <span className="text-[10px] font-normal text-slate-300 uppercase">Outstanding Balance</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Executive Control Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-2 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100 overflow-x-auto no-scrollbar relative z-10">
                        <StatusTab label="All Advances" value="" />
                        <StatusTab label="Pending" value="pending" />
                        <StatusTab label="Approved" value="approved" />
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto relative z-10">
                        <form onSubmit={handleSearch} className="relative group flex-1 sm:flex-none">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={12} />
                            <input
                                type="text"
                                placeholder="SEARCH..."
                                className="w-full sm:w-64 pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-[3px] text-[10px] font-normal uppercase focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </form>
                        
                        {(isAdmin || hasPermission('create-advances') || userRole === 'employee') && (
                            <Link
                                href={route('advances.create')}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-[10px] font-normal uppercase hover:brightness-110 transition-all shadow-xl shadow-primary/10 active:scale-95 flex items-center justify-center gap-3 whitespace-nowrap"
                            >
                                <FaPlus size={10} />
                                <span>Request Advance</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Tactical Data Grid */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-3 text-left text-[10px] font-normal text-slate-400 uppercase border-b border-slate-100">Employee</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-normal text-slate-400 uppercase border-b border-slate-100">Amount</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-normal text-slate-400 uppercase border-b border-slate-100">Date</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-normal text-slate-400 uppercase border-b border-slate-100">Status</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-normal text-slate-400 uppercase border-b border-slate-100">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {advances?.data && advances.data.length > 0 ? (
                                    advances.data.map((advance) => {
                                        const statusStyle = getStatusStyles(advance.status);
                                        return (
                                            <tr key={advance.id} className="hover:bg-slate-50/50 transition-all group cursor-default">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar 
                                                            src={advance.employee?.employee_image}
                                                            name={advance.employee?.name}
                                                            size="md"
                                                            className="rounded-lg shadow-sm border border-slate-100 group-hover:scale-105 transition-transform"
                                                        />
                                                        <div>
                                                            <div className="text-[11px] font-normal text-slate-900 tracking-normal uppercase">{advance.employee?.name}</div>
                                                            <div className="text-[9px] font-normal text-slate-400 uppercase mt-0.5">ID: {advance.employee?.employee_code || 'N/A'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
                                                            <FaMoneyBillWave size={12}/>
                                                        </div>
                                                        <div className="text-[12px] font-normal text-slate-900">{formatCurrency(advance.amount)}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <FaCalendarAlt className="text-slate-300" size={10} />
                                                        <span className="text-[10px] font-normal text-slate-600 uppercase">{new Date(advance.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-normal uppercase border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                                        {statusStyle.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                        <Link
                                                            href={route('advances.show', advance.id)}
                                                            className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5 rounded-lg transition-all shadow-sm active:scale-95"
                                                        >
                                                            <FaEye size={12} />
                                                        </Link>
                                                        {(isAdmin || hasPermission('edit-advances')) && advance.status?.toLowerCase() === 'pending' && (
                                                            <Link
                                                                href={route('advances.edit', advance.id)}
                                                                className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-100 hover:bg-amber-50 rounded-lg transition-all shadow-sm active:scale-95"
                                                            >
                                                                <FaEdit size={12} />
                                                            </Link>
                                                        )}
                                                        {(isAdmin || hasPermission('delete-advances')) && advance.status?.toLowerCase() === 'pending' && (
                                                            <button
                                                                onClick={() => handleDeleteClick(advance.id)}
                                                                className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 rounded-lg transition-all shadow-sm active:scale-95"
                                                            >
                                                                <FaTrash size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <div className="max-w-xs mx-auto space-y-4">
                                                <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-lg flex items-center justify-center mx-auto border-2 border-dashed border-slate-100">
                                                    <FaMoneyBillWave size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-[11px] font-normal text-slate-900 uppercase">No Advance Records</h3>
                                                    <p className="text-[10px] font-normal text-slate-400 uppercase mt-1 leading-relaxed">No advance requests found matching the criteria.</p>
                                                </div>
                                                {(isAdmin || hasPermission('create-advances') || userRole === 'employee') && (
                                                    <Link href={route('advances.create')} className="inline-flex items-center gap-2 text-[9px] font-normal text-primary uppercase hover:gap-3 transition-all pt-2">
                                                        Initiate New Request <FaChevronRight size={8} />
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Intelligent Guidance */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100/50 flex gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm shrink-0 border border-emerald-50"><FaMoneyBillWave size={14}/></div>
                        <div>
                            <h4 className="text-[10px] font-normal text-emerald-900 uppercase mb-1">Repayment</h4>
                            <p className="text-[9px] font-normal text-emerald-600/80 uppercase leading-relaxed">Salary advances are deducted in the next payroll cycle.</p>
                        </div>
                    </div>
                    <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100/50 flex gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-amber-600 shadow-sm shrink-0 border border-amber-50"><FaClock size={14}/></div>
                        <div>
                            <h4 className="text-[10px] font-normal text-amber-900 uppercase mb-1">Approval Process</h4>
                            <p className="text-[9px] font-normal text-amber-600/80 uppercase leading-relaxed">Requests are reviewed within 24 hours.</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm shrink-0 border border-slate-50"><FaShieldAlt size={14}/></div>
                        <div>
                            <h4 className="text-[10px] font-normal text-slate-900 uppercase mb-1">Limits</h4>
                            <p className="text-[9px] font-normal text-slate-500 uppercase leading-relaxed">Employees can only have one active advance at a time.</p>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                show={modal.show}
                onClose={() => setModal({ show: false, id: null, processing: false })}
                onConfirm={confirmDelete}
                title="Archive Protocol"
                message="Confirm intent to archive this liquidity request. This action is recorded in the integrity audit trail."
                confirmText="ARCHIVE PROTOCOL"
                type="danger"
                processing={modal.processing}
            />
        </AuthenticatedLayout>
    );
}
