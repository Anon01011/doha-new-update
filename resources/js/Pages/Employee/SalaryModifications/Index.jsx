import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Avatar from '@/Components/Avatar';
import Modal from '@/Components/Modal';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { resolveCurrency } from '@/helpers/currency';
import {
    FiDollarSign, FiClock, FiCheckCircle, FiXCircle, FiArrowUpRight,
    FiArrowDownRight, FiUser, FiCalendar, FiFileText, FiCheck, FiX,
    FiFilter, FiLayers, FiAlertCircle
} from 'react-icons/fi';

export default function SalaryModificationsIndex({
    requests,
    filters = {},
    companies = [],
    pendingCount = 0,
    canApprove = false,
}) {
    const { appSettings, auth } = usePage().props;
    const { code: currency } = resolveCurrency({ appSettings });
    const user = auth?.user || {};

    const [statusFilter, setStatusFilter] = useState(filters.status || 'pending');
    const [companyFilter, setCompanyFilter] = useState(filters.company_id || '');

    // Action modals state
    const [actionModal, setActionModal] = useState({
        isOpen: false,
        type: 'approve', // 'approve' | 'reject'
        request: null,
        notes: '',
        processing: false,
    });

    const handleFilterChange = (newStatus, newCompany) => {
        router.get(
            route('salary-modifications.index'),
            {
                status: newStatus !== undefined ? newStatus : statusFilter,
                company_id: newCompany !== undefined ? newCompany : companyFilter,
            },
            { preserveState: true, replace: true }
        );
    };

    const openApproveModal = (req) => {
        setActionModal({
            isOpen: true,
            type: 'approve',
            request: req,
            notes: '',
            processing: false,
        });
    };

    const openRejectModal = (req) => {
        setActionModal({
            isOpen: true,
            type: 'reject',
            request: req,
            notes: '',
            processing: false,
        });
    };

    const submitAction = () => {
        if (!actionModal.request) return;
        setActionModal((prev) => ({ ...prev, processing: true }));

        const endpoint =
            actionModal.type === 'approve'
                ? route('salary-modifications.approve', actionModal.request.id)
                : route('salary-modifications.reject', actionModal.request.id);

        router.post(
            endpoint,
            { notes: actionModal.notes },
            {
                onSuccess: () => {
                    setActionModal({ isOpen: false, type: 'approve', request: null, notes: '', processing: false });
                },
                onError: () => {
                    setActionModal((prev) => ({ ...prev, processing: false }));
                },
            }
        );
    };

    const items = requests?.data || [];

    return (
        <AuthenticatedLayout>
            <Head title="Salary Modification Approvals" />

            <div className="py-6 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                {/* Header Banner */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-2xl shadow-inner">
                            <FiDollarSign />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Salary Modification Approvals</h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Review and approve employee salary revisions requested across branches and departments.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route('employees.index')}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                        >
                            Back to Directory
                        </Link>
                    </div>
                </div>

                {/* Status Tabs and Branch Filters */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Status Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                        {[
                            { key: 'pending', label: 'Pending Approvals', count: pendingCount, icon: FiClock },
                            { key: 'approved', label: 'Approved', icon: FiCheckCircle },
                            { key: 'rejected', label: 'Rejected', icon: FiXCircle },
                            { key: 'all', label: 'All Requests', icon: FiLayers },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = statusFilter === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => {
                                        setStatusFilter(tab.key);
                                        handleFilterChange(tab.key, undefined);
                                    }}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                                        isActive
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    <span>{tab.label}</span>
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <span
                                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                isActive ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-800'
                                            }`}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Branch Filter (for Admins) */}
                    {user?.role === 'admin' && companies.length > 0 && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <FiFilter className="text-slate-400 h-4 w-4" />
                            <select
                                value={companyFilter}
                                onChange={(e) => {
                                    setCompanyFilter(e.target.value);
                                    handleFilterChange(undefined, e.target.value);
                                }}
                                className="text-xs border-slate-200 rounded-xl focus:ring-slate-900 focus:border-slate-900 py-1.5 px-3 bg-slate-50 font-medium"
                            >
                                <option value="">All Branches</option>
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Requests List */}
                {items.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
                        <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
                            <FiDollarSign />
                        </div>
                        <h3 className="text-sm font-bold text-slate-700">No Salary Modification Requests</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            There are currently no salary requests matching your selected filter.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((req) => {
                            const emp = req.employee || {};
                            const currentBasic = Number(req.current_basic_salary || 0);
                            const proposedBasic = Number(req.proposed_basic_salary || 0);
                            const diff = proposedBasic - currentBasic;
                            const diffPercent = currentBasic > 0 ? ((diff / currentBasic) * 100).toFixed(1) : null;
                            const isPending = req.status === 'pending';

                            return (
                                <div
                                    key={req.id}
                                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 hover:shadow-md transition space-y-4"
                                >
                                    {/* Top Row: Employee & Status */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                src={emp.employee_image}
                                                name={emp.name || 'Employee'}
                                                size="md"
                                                className="ring-2 ring-slate-100"
                                            />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={route('employees.show', emp.id || req.employee_id)}
                                                        className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition"
                                                    >
                                                        {emp.name}
                                                    </Link>
                                                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                                        {emp.employee_code || 'ID: ' + emp.id}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                    <span>{emp.designation || 'Staff'}</span>
                                                    <span>•</span>
                                                    <span className="font-medium text-slate-700">
                                                        {req.company?.name || emp.company?.name || 'Branch'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                    req.status === 'approved'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : req.status === 'rejected'
                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {req.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Middle: Salary Comparison Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 rounded-xl p-4 border border-slate-100">
                                        {/* Current Salary */}
                                        <div>
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                Current Basic
                                            </span>
                                            <div className="text-base font-bold text-slate-700 mt-0.5">
                                                {currency} {currentBasic.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                            <span className="text-[11px] text-slate-400">
                                                Payment: {req.current_payment_type || 'Unspecified'}
                                            </span>
                                        </div>

                                        {/* Proposed Salary */}
                                        <div>
                                            <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">
                                                Proposed Basic
                                            </span>
                                            <div className="text-base font-black text-slate-900 mt-0.5">
                                                {currency} {proposedBasic.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                            <span className="text-[11px] text-slate-600 font-medium">
                                                Payment: {req.proposed_payment_type || req.current_payment_type || 'Unspecified'}
                                            </span>
                                        </div>

                                        {/* Difference / Adjustment */}
                                        <div>
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                Net Adjustment
                                            </span>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {diff > 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600">
                                                        <FiArrowUpRight className="h-4 w-4" />
                                                        +{currency} {diff.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        {diffPercent && ` (+${diffPercent}%)`}
                                                    </span>
                                                ) : diff < 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-sm font-bold text-rose-600">
                                                        <FiArrowDownRight className="h-4 w-4" />
                                                        -{currency} {Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        {diffPercent && ` (${diffPercent}%)`}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm font-bold text-slate-500">No Change in Basic</span>
                                                )}
                                            </div>
                                            {req.proposed_bank_name && (
                                                <span className="text-[11px] text-slate-400 block truncate">
                                                    Bank: {req.proposed_bank_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Proposed Salary Components Breakdown (if any) */}
                                    {Array.isArray(req.proposed_salary_structures) && req.proposed_salary_structures.length > 0 && (
                                        <div className="space-y-1.5">
                                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                                Proposed Allowance & Deduction Structures
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {req.proposed_salary_structures.map((s, idx) => (
                                                    <span
                                                        key={idx}
                                                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                                                            s.type === 'deduction'
                                                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        }`}
                                                    >
                                                        {s.name || `Component #${s.component_id}`}: {currency}{' '}
                                                        {Number(s.amount || 0).toLocaleString()} ({s.type})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Bottom Row: Metadata & Actions */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                                        <div className="space-y-0.5">
                                            <div>
                                                Requested by:{' '}
                                                <span className="font-semibold text-slate-700">
                                                    {req.requester?.name || 'Manager'}
                                                </span>{' '}
                                                ({req.requester?.role || 'User'}) on{' '}
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </div>
                                            {req.reason && (
                                                <div className="italic text-slate-600">
                                                    Note: &quot;{req.reason}&quot;
                                                </div>
                                            )}
                                            {req.reviewed_by && (
                                                <div className="text-slate-600">
                                                    Reviewed by:{' '}
                                                    <span className="font-semibold text-slate-800">
                                                        {req.reviewer?.name || 'HR'}
                                                    </span>{' '}
                                                    on {new Date(req.reviewed_at).toLocaleDateString()}
                                                    {req.review_notes && ` — Note: "${req.review_notes}"`}
                                                </div>
                                            )}
                                        </div>

                                        {isPending && (req.can_approve ?? canApprove) && (
                                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => openRejectModal(req)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition shadow-sm"
                                                >
                                                    <FiX className="h-3.5 w-3.5" />
                                                    Reject
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openApproveModal(req)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                                                >
                                                    <FiCheck className="h-3.5 w-3.5" />
                                                    Approve & Apply
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Approve / Reject Modal */}
            <Modal
                show={actionModal.isOpen}
                onClose={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
                maxWidth="md"
            >
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold ${
                                actionModal.type === 'approve'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-rose-100 text-rose-700'
                            }`}
                        >
                            {actionModal.type === 'approve' ? <FiCheck /> : <FiX />}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                {actionModal.type === 'approve'
                                    ? 'Approve Salary Modification'
                                    : 'Reject Salary Modification'}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {actionModal.type === 'approve'
                                    ? `This will update ${actionModal.request?.employee?.name}'s basic salary to ${currency} ${Number(
                                          actionModal.request?.proposed_basic_salary || 0
                                      ).toLocaleString()} immediately.`
                                    : `Decline the proposed salary modification for ${actionModal.request?.employee?.name}.`}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Reviewer Remarks / Notes (Optional)
                        </label>
                        <textarea
                            rows={3}
                            value={actionModal.notes}
                            onChange={(e) =>
                                setActionModal((prev) => ({ ...prev, notes: e.target.value }))
                            }
                            placeholder={
                                actionModal.type === 'approve'
                                    ? 'e.g. Approved as per performance appraisal'
                                    : 'e.g. Needs departmental budget re-approval'
                            }
                            className="w-full text-xs rounded-xl border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={actionModal.processing}
                            onClick={submitAction}
                            className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition shadow-sm ${
                                actionModal.type === 'approve'
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-rose-600 hover:bg-rose-700'
                            }`}
                        >
                            {actionModal.processing
                                ? 'Processing...'
                                : actionModal.type === 'approve'
                                ? 'Confirm Approval'
                                : 'Confirm Rejection'}
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}

