import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { FaPlus, FaSearch, FaHistory, FaCalendarCheck, FaCalendarAlt, FaUser, FaInfoCircle, FaEdit, FaTrash, FaEye, FaTimesCircle } from 'react-icons/fa';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Avatar from '@/Components/Avatar';

export default function Index({ leaveRequests, leaveBalances, status, userRole = 'employee', search: initialSearch = '' }) {
    const { auth } = usePage().props;
    const permissions = auth.user?.permissions || [];
    const hasPermission = (slug) => permissions.includes(slug);
    const isAdmin = auth.user?.role === 'admin';

    const [searchTerm, setSearchTerm] = useState(initialSearch || '');
    const [requestAction, setRequestAction] = useState({ type: null, request: null });
    const [processing, setProcessing] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkRejectModal, setBulkRejectModal] = useState({ show: false, reason: '', error: '' });

    const canUserApprove = (request) => {
        if (request.status === 'approved' || request.status === 'rejected' || request.status === 'cancelled') {
            return false;
        }
        if (isAdmin || auth.user?.role === 'hr' || hasPermission('approve-leave-requests') || hasPermission('manage-leaves')) {
            return true;
        }
        if (auth.user?.employee_id && request.manager_id && auth.user.employee_id == request.manager_id && request.manager_approval_status === 'pending') {
            return true;
        }
        return false;
    };

    const approvableRequests = leaveRequests.data?.filter(canUserApprove) || [];
    const allSelected = approvableRequests.length > 0 && approvableRequests.every(req => selectedIds.includes(req.id));

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !approvableRequests.map(r => r.id).includes(id)));
        } else {
            const newSelected = [...selectedIds];
            approvableRequests.forEach(req => {
                if (!newSelected.includes(req.id)) {
                    newSelected.push(req.id);
                }
            });
            setSelectedIds(newSelected);
        }
    };

    const handleBulkApprove = () => {
        if (selectedIds.length === 0) return;

        setProcessing(true);
        router.post(route('leave-requests.bulk-approve'), {
            ids: selectedIds
        }, {
            onSuccess: () => {
                setSelectedIds([]);
            },
            onFinish: () => {
                setProcessing(false);
            }
        });
    };

    const handleBulkReject = () => {
        if (selectedIds.length === 0) return;
        setBulkRejectModal({ show: true, reason: '', error: '' });
    };

    const confirmBulkReject = () => {
        if (!bulkRejectModal.reason.trim()) {
            setBulkRejectModal(prev => ({ ...prev, error: 'Rejection reason is required.' }));
            return;
        }

        setProcessing(true);
        router.post(route('leave-requests.bulk-reject'), {
            ids: selectedIds,
            rejection_reason: bulkRejectModal.reason.trim()
        }, {
            onSuccess: () => {
                setSelectedIds([]);
                setBulkRejectModal({ show: false, reason: '', error: '' });
            },
            onFinish: () => {
                setProcessing(false);
            }
        });
    };

    const handleAction = () => {
        if (!requestAction.request) return;

        setProcessing(true);
        const url = requestAction.type === 'delete'
            ? route('leave-requests.destroy', requestAction.request.id)
            : route('leave-requests.cancel', requestAction.request.id);

        router.post(url, {
            _method: requestAction.type === 'delete' ? 'DELETE' : 'POST',
        }, {
            onFinish: () => {
                setProcessing(false);
                setRequestAction({ type: null, request: null });
            }
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('leave-requests.index'), { search: searchTerm, status }, { preserveState: true });
    };

    const getStatusStyle = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'approved') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (s === 'rejected') return 'bg-rose-50 text-rose-600 border-rose-100';
        if (s === 'pending') return 'bg-amber-50 text-amber-600 border-amber-100';
        if (s.includes('manager')) return 'bg-blue-50 text-blue-600 border-blue-100';
        if (s.includes('hr')) return 'bg-purple-50 text-purple-600 border-purple-100';
        if (s === 'cancelled') return 'bg-slate-50 text-slate-500 border-slate-100';
        return 'bg-slate-50 text-slate-500 border-slate-100';
    };

    const getDetailedStatus = (request) => {
        if (request.status === 'approved') return 'Approved';
        if (request.status === 'rejected') return 'Rejected';
        if (request.status === 'cancelled') return 'Cancelled';
        if (request.manager_approval_status === 'pending') return 'Pending Manager';
        if (request.manager_approval_status === 'approved' && request.hr_approval_status === 'pending') return 'Pending HR';
        return 'Pending';
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const canCancel = (request) => {
        if (request.status !== 'approved') return false;
        const startDate = new Date(request.start_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return startDate > today;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Leave Management" />

            <div className="w-full p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                {/* Balances */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {leaveBalances && Object.entries(leaveBalances).map(([type, balance]) => (
                        <div key={type} className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group min-w-0">
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                    <FaCalendarCheck size={13} />
                                </div>
                                <span className="text-[10px] font-normal text-slate-400 truncate ml-2">{type}</span>
                            </div>
                            <div className="flex items-end justify-between min-w-0">
                                <div className="text-xl sm:text-2xl font-normal text-slate-900 tracking-normal leading-none truncate">{balance}</div>
                                <div className="text-[8px] sm:text-[9px] font-normal text-slate-400 mb-0.5 whitespace-nowrap">Available</div>
                            </div>
                        </div>
                    ))}
                    {(!leaveBalances || Object.keys(leaveBalances).length === 0) && (
                        <div className="col-span-full py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <FaInfoCircle className="mx-auto text-slate-300 mb-2" size={24} />
                            <p className="text-[10px] font-normal text-slate-400">No active balances</p>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <form onSubmit={handleSearch} className="relative flex-1 sm:flex-none">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full sm:w-56 pl-9 pr-4 py-2 bg-slate-50 border-slate-200 rounded-xl text-[11px] font-normal focus:ring-0 focus:border-slate-300 transition-all outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </form>
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
                            {['all', 'pending', 'approved', 'rejected'].map((tab) => (
                                <Link
                                    key={tab}
                                    href={route('leave-requests.index', { status: tab === 'all' ? '' : tab })}
                                    className={`px-3 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-normal transition-all whitespace-nowrap ${
                                        (status === tab || (tab === 'all' && !status)) 
                                        ? 'bg-slate-900 text-white shadow-md' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <Link
                        href={route('leave-requests.create')}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-normal hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <FaPlus size={10} />
                        <span>Add Leave</span>
                    </Link>
                </div>

                {/* Bulk Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-xl shadow-sm animate-fadeIn">
                        <div className="text-[11px] font-normal text-slate-600">
                            Selected <span className="font-semibold text-slate-900">{selectedIds.length}</span> request(s) for bulk action.
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => setSelectedIds([])}
                                className="flex-1 sm:flex-initial px-3.5 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-normal hover:bg-slate-50 transition-all"
                            >
                                Clear Selection
                            </button>
                             <button
                                onClick={handleBulkReject}
                                disabled={processing}
                                className="flex-1 sm:flex-initial px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-normal hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <FaTrash size={10} />
                                Reject
                            </button>
                            <button
                                onClick={handleBulkApprove}
                                disabled={processing}
                                className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-normal hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <FaCalendarCheck size={12} />
                                Approve
                            </button>
                        </div>
                    </div>
                )}

                {/* Records */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    {approvableRequests.length > 0 && (
                                        <th className="pl-6 py-4 text-left border-b border-slate-100 w-12">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={toggleSelectAll}
                                                className="rounded border-slate-300 text-slate-950 focus:ring-0 cursor-pointer"
                                            />
                                        </th>
                                    )}
                                    <th className="px-6 py-4 text-left text-[10px] font-normal text-slate-400 border-b border-slate-100">Employee</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-normal text-slate-400 border-b border-slate-100">Leave Type</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-normal text-slate-400 border-b border-slate-100">Dates</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-normal text-slate-400 border-b border-slate-100">Days</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-normal text-slate-400 border-b border-slate-100">Status</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-normal text-slate-400 border-b border-slate-100">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {leaveRequests.data && leaveRequests.data.length > 0 ? (
                                    leaveRequests.data.map((request) => (
                                        <tr key={request.id} className="group hover:bg-slate-50/50 transition-colors">
                                            {approvableRequests.length > 0 && (
                                                <td className="pl-6 py-4 border-b border-slate-50 w-12">
                                                    {canUserApprove(request) ? (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(request.id)}
                                                            onChange={() => toggleSelect(request.id)}
                                                            className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                                                        />
                                                    ) : (
                                                        <div className="w-4 h-4" />
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <Avatar
                                                        src={request.employee?.employee_image}
                                                        name={request.employee?.name}
                                                        size="sm"
                                                        className="rounded-xl border border-slate-100"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-normal text-slate-900 leading-none">{request.employee?.name}</p>
                                                        <p className="text-[10px] font-normal text-slate-400 mt-1.5">{request.employee?.employee_code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[11px] font-normal text-slate-900">{request.leave_type?.name}</p>
                                                <p className="text-[10px] text-slate-400 font-normal line-clamp-1 mt-1 max-w-[200px]">{request.reason || 'N/A'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-normal text-slate-900 leading-none">{formatDate(request.start_date)}</span>
                                                    <span className="text-[10px] font-normal text-slate-300 mt-1">To {formatDate(request.end_date)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-1 bg-slate-50 text-slate-900 rounded-xl text-[10px] font-normal border border-slate-100">
                                                    {request.number_of_days} Days
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[9px] font-normal border ${getStatusStyle(getDetailedStatus(request))}`}>
                                                    {getDetailedStatus(request)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                     <Link
                                                        href={route('leave-requests.show', request.id)}
                                                        className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
                                                    >
                                                        <FaEye size={12} />
                                                     </Link>
                                                    {(hasPermission('manage-leaves') || (userRole === 'employee' && request.status === 'pending')) && (
                                                        <Link
                                                            href={route('leave-requests.edit', request.id)}
                                                            className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
                                                        >
                                                            <FaEdit size={12} />
                                                        </Link>
                                                    )}
                                                    {(isAdmin || hasPermission('manage-leaves') || (userRole === 'employee' && (request.status === 'pending' || request.status === 'rejected'))) && (
                                                        <button
                                                            onClick={() => setRequestAction({ type: 'delete', request })}
                                                            className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    )}
                                                    {canCancel(request) && (
                                                        <button
                                                            onClick={() => setRequestAction({ type: 'cancel', request })}
                                                            className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[9px] font-normal hover:bg-rose-100 transition-all"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={approvableRequests.length > 0 ? 7 : 6} className="px-6 py-12 text-center">
                                            <FaCalendarAlt className="mx-auto text-slate-200 mb-4" size={48} />
                                            <p className="text-base font-normal text-slate-400">No Leave Requests</p>
                                            <p className="text-[10px] font-normal text-slate-300 mt-2">No leave applications detected in current dataset</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                     {/* Pagination */}
                    <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] font-normal text-slate-400">
                            Showing: <span className="text-slate-900">{leaveRequests.from || 0} - {leaveRequests.to || 0} of {leaveRequests.total} requests</span>
                        </p>
                         <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-100">
                            {leaveRequests.links && leaveRequests.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`px-3.5 py-2 rounded-xl text-[10px] font-normal transition-all ${
                                        link.active ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' :
                                        !link.url ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                show={!!requestAction.request}
                title={requestAction.type === 'delete' ? 'Delete Request' : 'Cancel Request'}
                message={`Confirm you want to ${requestAction.type === 'delete' ? 'delete' : 'cancel'} this leave application? This cannot be undone.`}
                onConfirm={handleAction}
                onClose={() => setRequestAction({ type: null, request: null })}
                confirmText={requestAction.type === 'delete' ? 'Delete' : 'Cancel'}
                type="danger"
                processing={processing}
            />

            <Modal
                show={bulkRejectModal.show}
                onClose={() => setBulkRejectModal({ show: false, reason: '', error: '' })}
                maxWidth="md"
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-full bg-rose-50 text-rose-600">
                            <FaTimesCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-normal text-slate-900">Reject Selected Requests</h3>
                            <p className="text-xs text-slate-500">Provide a reason for rejecting {selectedIds.length} leave application(s)</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-normal text-slate-700">Rejection Reason <span className="text-rose-500">*</span></label>
                        <textarea
                            value={bulkRejectModal.reason}
                            onChange={(e) => setBulkRejectModal(prev => ({ ...prev, reason: e.target.value, error: '' }))}
                            rows={3}
                            placeholder="State the reason for rejecting these applications..."
                            className="w-full text-xs rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0"
                        />
                        {bulkRejectModal.error && (
                            <p className="text-[11px] text-rose-600 font-normal">{bulkRejectModal.error}</p>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <SecondaryButton
                            onClick={() => setBulkRejectModal({ show: false, reason: '', error: '' })}
                            disabled={processing}
                        >
                            Cancel
                        </SecondaryButton>
                        <DangerButton
                            onClick={confirmBulkReject}
                            disabled={processing}
                        >
                            {processing ? 'Processing...' : 'Confirm Rejection'}
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
