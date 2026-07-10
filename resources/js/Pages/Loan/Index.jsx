import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { FaSearch, FaPlus, FaFilter, FaEye, FaEdit, FaTrash, FaMoneyBillWave, FaCalendarAlt, FaUser, FaCheckCircle, FaTimesCircle, FaClock, FaUniversity, FaChevronRight, FaArrowUp, FaArrowDown, FaChartLine, FaShieldAlt } from 'react-icons/fa';
import Avatar from '@/Components/Avatar';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index({ loans, status, userRole = 'employee', search: initialSearch = '' }) {
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
        router.get(route('loans.index'), { search: searchTerm, status }, { preserveState: true });
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount || 0);

    const getStatusStyles = (status) => {
        const s = status?.toLowerCase() || '';
        const styles = {
            approved: {
                bg: 'bg-emerald-500/10',
                text: 'text-emerald-600',
                border: 'border-emerald-500/20',
                label: 'AUTHORIZED'
            },
            disbursed: {
                bg: 'bg-blue-500/10',
                text: 'text-blue-600',
                border: 'border-blue-500/20',
                label: 'DISBURSED'
            },
            completed: {
                bg: 'bg-indigo-500/10',
                text: 'text-indigo-600',
                border: 'border-indigo-500/20',
                label: 'REPAID'
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
                label: 'AUDIT PENDING'
            },
        };
        return styles[s] || styles.pending;
    };

    const handleDeleteClick = (id) => {
        setModal({ show: true, id, processing: false });
    };

    const confirmDelete = () => {
        setModal(prev => ({ ...prev, processing: true }));
        router.delete(route('loans.destroy', modal.id), {
            onFinish: () => setModal({ show: false, id: null, processing: false })
        });
    };

    const StatusTab = ({ label, value }) => {
        const isActive = status === value || (!status && !value);
        return (
            <Link
                href={route('loans.index', { status: value, search: searchTerm })}
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
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Assistance Ledger</h2>}>
            <Head title="Financial Assistance" />

            <div className="py-4 px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Executive Dashboard Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 text-emerald-500 opacity-10 group-hover:scale-110 transition-transform">
                            <FaArrowUp size={32} />
                        </div>
                        <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-0.5">Total Allocated</p>
                        <h3 className="text-xl font-normal text-slate-900 tracking-normal">{formatCurrency(loans?.data?.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0))}</h3>
                        <p className="text-[9px] font-normal text-emerald-500 uppercase tracking-normal mt-1 flex items-center gap-1">
                            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                            ACTIVE CAPITAL DISBURSEMENT
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 text-amber-500 opacity-10 group-hover:scale-110 transition-transform">
                            <FaClock size={32} />
                        </div>
                        <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-0.5">Audit Queue</p>
                        <h3 className="text-xl font-normal text-slate-900 tracking-normal">{loans?.data?.filter(l => l.status?.toLowerCase() === 'pending').length || 0} Entities</h3>
                        <p className="text-[9px] font-normal text-amber-500 uppercase tracking-normal mt-1 flex items-center gap-1">
                            <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></span>
                            AWAITING VERIFICATION
                        </p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg shadow-xl shadow-slate-200 relative overflow-hidden group md:col-span-2">
                        <div className="absolute top-0 right-0 p-4 text-primary opacity-20 group-hover:scale-110 transition-transform">
                            <FaChartLine size={60} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-normal text-slate-500 uppercase tracking-normal mb-0.5">Assistance Overview</p>
                            <h3 className="text-xl font-normal text-white tracking-normal">Financial Health Indicator</h3>
                            <div className="mt-2 flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    <span className="text-[10px] font-normal text-slate-300 uppercase">Sustainable</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <span className="text-[10px] font-normal text-slate-300 uppercase">Balanced Distribution</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Executive Control Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-2 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100 overflow-x-auto no-scrollbar relative z-10">
                        <StatusTab label="Aggregate" value="" />
                        <StatusTab label="Audit Queue" value="pending" />
                        <StatusTab label="Authorized" value="approved" />
                        <StatusTab label="Disbursed" value="disbursed" />
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto relative z-10">
                        <form onSubmit={handleSearch} className="relative group flex-1 sm:flex-none">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={12} />
                            <input
                                type="text"
                                placeholder="SEARCH ASSISTANCE..."
                                className="w-full sm:w-64 pl-12 pr-4 py-2.5 bg-slate-50/50 border-2 border-slate-100 rounded-lg text-[10px] font-normal uppercase tracking-normal focus:bg-white focus:border-primary/20 focus:ring-8 focus:ring-primary/5 transition-all outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </form>
                        
                        {(isAdmin || hasPermission('create-loans') || userRole === 'employee') && (
                            <Link
                                href={route('loans.create')}
                                className="px-6 py-2.5 bg-primary text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:brightness-110 transition-all shadow-xl shadow-primary/10 active:scale-95 flex items-center justify-center gap-3 whitespace-nowrap"
                            >
                                <FaPlus size={10} />
                                <span>Initiate Request</span>
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
                                    <th className="px-6 py-3 text-left text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Personnel Entity</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Assistance Logic</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Capital Quantum</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Fiscal Period</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Audit Status</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-normal text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Protocol Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loans?.data && loans.data.length > 0 ? (
                                    loans.data.map((loan) => {
                                        const statusStyle = getStatusStyles(loan.status);
                                        return (
                                            <tr key={loan.id} className="hover:bg-slate-50/50 transition-all group cursor-default">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar 
                                                            src={loan.employee?.employee_image}
                                                            name={loan.employee?.name}
                                                            size="md"
                                                            className="rounded-lg shadow-sm border border-slate-100 group-hover:scale-105 transition-transform"
                                                        />
                                                        <div>
                                                            <div className="text-[11px] font-normal text-slate-900 tracking-normal uppercase">{loan.employee?.name}</div>
                                                            <div className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mt-0.5">ID: {loan.employee?.employee_code || 'N/A'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100">
                                                            <FaMoneyBillWave size={10}/>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-normal text-slate-900 uppercase tracking-normal">{loan.loan_type?.name}</div>
                                                            <div className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">Type: ASSISTANCE</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="space-y-1">
                                                        <div className="text-[12px] font-normal text-slate-900">{formatCurrency(loan.amount)}</div>
                                                        <div className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">{loan.installments || 1} DIVISIONS</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <FaCalendarAlt className="text-slate-300" size={10} />
                                                        <span className="text-[10px] font-normal text-slate-600 uppercase tracking-normal">{new Date(loan.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-normal uppercase tracking-normal border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                                        {statusStyle.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                        <Link
                                                            href={route('loans.show', loan.id)}
                                                            className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5 rounded-lg transition-all shadow-sm active:scale-95"
                                                        >
                                                            <FaEye size={12} />
                                                        </Link>
                                                        {(isAdmin || hasPermission('edit-loans')) && loan.status?.toLowerCase() === 'pending' && (
                                                            <Link
                                                                href={route('loans.edit', loan.id)}
                                                                className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-100 hover:bg-amber-50 rounded-lg transition-all shadow-sm active:scale-95"
                                                            >
                                                                <FaEdit size={12} />
                                                            </Link>
                                                        )}
                                                        {(isAdmin || hasPermission('delete-loans')) && loan.status?.toLowerCase() === 'pending' && (
                                                            <button
                                                                onClick={() => handleDeleteClick(loan.id)}
                                                                className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 rounded-lg transition-all shadow-sm active:scale-95"
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
                                        <td colSpan="6" className="px-8 py-20 text-center">
                                            <div className="max-w-xs mx-auto space-y-4">
                                                <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-lg flex items-center justify-center mx-auto border-2 border-dashed border-slate-100">
                                                    <FaUniversity size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-[11px] font-normal text-slate-900 uppercase tracking-normal">No Assistance Records</h3>
                                                    <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mt-1 leading-relaxed">No financial assistance protocols match the current criteria.</p>
                                                </div>
                                                {(isAdmin || hasPermission('create-loans') || userRole === 'employee') && (
                                                    <Link href={route('loans.create')} className="inline-flex items-center gap-2 text-[9px] font-normal text-primary uppercase tracking-[0.2em] hover:gap-3 transition-all pt-2">
                                                        Initiate New Protocol <FaChevronRight size={8} />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50/50 p-6 rounded-lg border border-blue-100/50 flex gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm shrink-0 border border-blue-50"><FaUniversity size={14}/></div>
                        <div>
                            <h4 className="text-[10px] font-normal text-blue-900 uppercase tracking-normal mb-1">Fiscal Responsibility</h4>
                            <p className="text-[9px] font-normal text-blue-600/80 uppercase tracking-normal leading-relaxed">Financial assistance is subject to eligibility criteria and internal audit verification.</p>
                        </div>
                    </div>
                    <div className="bg-amber-50/50 p-6 rounded-lg border border-amber-100/50 flex gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-amber-600 shadow-sm shrink-0 border border-amber-50"><FaClock size={14}/></div>
                        <div>
                            <h4 className="text-[10px] font-normal text-amber-900 uppercase tracking-normal mb-1">Audit Protocol</h4>
                            <p className="text-[9px] font-normal text-amber-600/80 uppercase tracking-normal leading-relaxed">Pending requests are typically reviewed within 48 operational hours.</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 flex gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm shrink-0 border border-slate-50"><FaShieldAlt size={14}/></div>
                        <div>
                            <h4 className="text-[10px] font-normal text-slate-900 uppercase tracking-normal mb-1">Data Integrity</h4>
                            <p className="text-[9px] font-normal text-slate-500 uppercase tracking-normal leading-relaxed">Disbursed loans are archived for regulatory compliance and audit purposes.</p>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                show={modal.show}
                onClose={() => setModal({ show: false, id: null, processing: false })}
                onConfirm={confirmDelete}
                title="Archive Protocol"
                message="Confirm intent to archive this assistance request. This action is recorded in the integrity audit trail."
                confirmText="ARCHIVE PROTOCOL"
                type="danger"
                processing={modal.processing}
            />
        </AuthenticatedLayout>
    );
}
