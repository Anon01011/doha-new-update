import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    FiPlus, FiFilter, FiSearch, FiFileText, FiCheckCircle,
    FiClock, FiAlertTriangle, FiDollarSign, FiArrowRight,
    FiEye, FiEdit2, FiTrash2, FiTag, FiDownload, FiCreditCard,
    FiPaperclip, FiShield, FiTrendingUp
} from 'react-icons/fi';
import Avatar from '@/Components/Avatar';

export default function Index({
    claims,
    summary = {},
    categories = [],
    companies = [],
    departments = [],
    filters = {},
    userRole,
    userEmployeeId
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [categoryId, setCategoryId] = useState(filters.category_id || '');
    const [reimbursementStatus, setReimbursementStatus] = useState(filters.reimbursement_status || '');
    const [companyId, setCompanyId] = useState(filters.company_id || '');
    const [departmentId, setDepartmentId] = useState(filters.department_id || '');

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('expenses.index'), {
            search,
            status,
            category_id: categoryId,
            reimbursement_status: reimbursementStatus,
            company_id: companyId,
            department_id: departmentId,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setCategoryId('');
        setReimbursementStatus('');
        setCompanyId('');
        setDepartmentId('');
        router.get(route('expenses.index'));
    };

    const formatINR = (val) => {
        return '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    };

    const statusBadge = (s) => {
        const map = {
            draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600 border-slate-200' },
            submitted: { label: 'Submitted (Mgr Review)', color: 'bg-amber-100 text-amber-800 border-amber-200' },
            manager_approved: { label: 'Manager Approved', color: 'bg-blue-100 text-blue-800 border-blue-200' },
            finance_approved: { label: 'Finance Approved', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
            rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-800 border-rose-200' },
            returned_to_employee: { label: 'Returned for Edit', color: 'bg-orange-100 text-orange-800 border-orange-200' },
            paid: { label: 'Paid / Reimbursed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
        };
        const cfg = map[s] || { label: s, color: 'bg-slate-100 text-slate-600 border-slate-200' };
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-normal uppercase tracking-normal border ${cfg.color}`}>
                {cfg.label}
            </span>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Employee Expenses & Claims" />

            <div className="w-full p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 bg-slate-50/50 min-h-screen">
                {/* In-Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div>
                        <h1 className="text-lg sm:text-2xl font-normal text-slate-900 tracking-normal">Employee Expenses & Claims</h1>
                        <p className="text-xs text-slate-500 font-normal mt-0.5">Submit claims with receipts, track approval workflows, and manage payroll reimbursements in INR (₹)</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {['admin', 'hr'].includes(userRole) && (
                            <Link
                                href={route('expense-categories.index')}
                                className="inline-flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-normal shadow-sm transition-all flex-1 sm:flex-initial justify-center"
                            >
                                <FiTag className="w-3.5 h-3.5 text-slate-400" />
                                Categories & Limits
                            </Link>
                        )}
                        <Link
                            href={route('reports.expense')}
                            className="inline-flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-normal shadow-sm transition-all flex-1 sm:flex-initial justify-center"
                        >
                            <FiTrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                            Analytics Reports
                        </Link>
                        <Link
                            href={route('expenses.create')}
                            className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-slate-900 hover:bg-primary text-white rounded-xl text-xs font-normal shadow-lg shadow-indigo-100 transition-all active:scale-95 flex-1 sm:flex-initial justify-center"
                        >
                            <FiPlus className="w-4 h-4" />
                            New Claim
                        </Link>
                    </div>
                </div>
                {/* Top Summary Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
                    <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="p-2 sm:p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                            <FiFileText className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] sm:text-[10px] font-normal text-slate-400 uppercase tracking-normal truncate">Total Claims</p>
                            <h4 className="text-base sm:text-xl font-normal text-slate-800 truncate">{summary.total_claims || 0}</h4>
                            <p className="text-[9px] sm:text-[10px] text-slate-500 truncate">{formatINR(summary.total_amount)}</p>
                        </div>
                    </div>

                    <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="p-2 sm:p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                            <FiClock className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] sm:text-[10px] font-normal text-slate-400 uppercase tracking-normal truncate">Pending Manager</p>
                            <h4 className="text-base sm:text-xl font-normal text-slate-800 truncate">{summary.pending_manager || 0}</h4>
                            <p className="text-[9px] sm:text-[10px] text-amber-600 truncate">Awaiting review</p>
                        </div>
                    </div>

                    <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                            <FiShield className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] sm:text-[10px] font-normal text-slate-400 uppercase tracking-normal truncate">Pending Finance</p>
                            <h4 className="text-base sm:text-xl font-normal text-slate-800 truncate">{summary.pending_finance || 0}</h4>
                            <p className="text-[9px] sm:text-[10px] text-blue-600 truncate">Awaiting coding</p>
                        </div>
                    </div>

                    <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                            <FiDollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] sm:text-[10px] font-normal text-slate-400 uppercase tracking-normal truncate">Total Reimbursed</p>
                            <h4 className="text-base sm:text-xl font-normal text-emerald-700 truncate">{formatINR(summary.total_paid)}</h4>
                            <p className="text-[9px] sm:text-[10px] text-slate-500 truncate">Paid / In Payroll</p>
                        </div>
                    </div>

                    <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4 min-w-0 col-span-2 sm:col-span-2 md:col-span-1">
                        <div className="p-2 sm:p-3 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                            <FiAlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] sm:text-[10px] font-normal text-slate-400 uppercase tracking-normal truncate">Policy Warnings</p>
                            <h4 className="text-base sm:text-xl font-normal text-rose-600 truncate">{summary.violations_count || 0}</h4>
                            <p className="text-[9px] sm:text-[10px] text-rose-500 truncate">Limit / Dup alerts</p>
                        </div>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                        <div className="relative md:col-span-2">
                            <FiSearch className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Claim #, staff, purpose..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white transition-colors"
                            />
                        </div>

                        {companies.length > 0 && (
                            <select
                                value={companyId}
                                onChange={(e) => setCompanyId(e.target.value)}
                                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white transition-colors"
                            >
                                <option value="">All Companys / Branches</option>
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        )}

                        {departments.length > 0 && (
                            <select
                                value={departmentId}
                                onChange={(e) => setDepartmentId(e.target.value)}
                                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white transition-colors"
                            >
                                <option value="">All Departments</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        )}

                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white transition-colors"
                        >
                            <option value="">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted (Manager Review)</option>
                            <option value="manager_approved">Manager Approved</option>
                            <option value="finance_approved">Finance Approved</option>
                            <option value="returned_to_employee">Returned for Edit</option>
                            <option value="rejected">Rejected</option>
                            <option value="paid">Paid</option>
                        </select>

                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white transition-colors"
                        >
                            <option value="">All Categories</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        <select
                            value={reimbursementStatus}
                            onChange={(e) => setReimbursementStatus(e.target.value)}
                            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white transition-colors"
                        >
                            <option value="">All Reimbursements</option>
                            <option value="pending">Pending Payment</option>
                            <option value="included_in_payroll">Included in Payroll</option>
                            <option value="paid">Paid Separately</option>
                        </select>

                        <div className="flex items-center gap-2">
                            <button
                                type="submit"
                                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-normal transition-colors"
                            >
                                Apply Filters
                            </button>
                            {(search || status || categoryId || reimbursementStatus || companyId || departmentId) && (
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-normal transition-colors"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Expense Claims Table */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-normal text-slate-400 uppercase tracking-normal">
                                    <th className="py-3.5 px-4">Claim #</th>
                                    <th className="py-3.5 px-4">Employee</th>
                                    <th className="py-3.5 px-4">Date & Category</th>
                                    <th className="py-3.5 px-4">Purpose & Project</th>
                                    <th className="py-3.5 px-4 text-right">Amount (INR ₹)</th>
                                    <th className="py-3.5 px-4 text-center">Receipt</th>
                                    <th className="py-3.5 px-4 text-center">Status</th>
                                    <th className="py-3.5 px-4 text-center">Reimbursement</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                                {claims.data && claims.data.length > 0 ? (
                                    claims.data.map((claim) => (
                                        <tr key={claim.id} className="hover:bg-slate-50/60 transition-colors group">
                                            <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                                                <Link
                                                    href={route('expenses.show', claim.id)}
                                                    className="hover:text-primary transition-colors flex items-center gap-1.5"
                                                >
                                                    {claim.claim_number}
                                                    {claim.policy_violation_flag && (
                                                        <span title={claim.violation_reason || 'Policy alert'} className="text-rose-500">
                                                            <FiAlertTriangle className="w-3.5 h-3.5 inline" />
                                                        </span>
                                                    )}
                                                </Link>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar
                                                        src={claim.employee?.employee_image}
                                                        name={claim.employee?.name}
                                                        size="xs"
                                                    />
                                                    <div>
                                                        <p className="font-normal text-slate-800">{claim.employee?.name || 'Unknown'}</p>
                                                        <p className="text-[10px] text-slate-400">{claim.employee?.department?.name || 'General'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <p className="font-normal text-slate-700">{claim.expense_date}</p>
                                                <span className="inline-flex items-center text-[10px] text-slate-400 mt-0.5">
                                                    <FiTag className="w-2.5 h-2.5 mr-1" />
                                                    {claim.category?.name || 'General'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 max-w-xs">
                                                <p className="truncate text-slate-700 font-normal" title={claim.business_purpose}>
                                                    {claim.business_purpose}
                                                </p>
                                                {claim.project_name && (
                                                    <p className="text-[10px] text-indigo-600">Proj: {claim.project_name}</p>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-normal text-slate-900 whitespace-nowrap">
                                                <span className="text-sm font-semibold">{formatINR(claim.amount)}</span>
                                                {claim.tax_amount > 0 && (
                                                    <p className="text-[9px] text-slate-400">Tax: {formatINR(claim.tax_amount)}</p>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                {claim.receipt_path ? (
                                                    <a
                                                        href={`/storage/${claim.receipt_path}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                                                        title="View Receipt"
                                                    >
                                                        <FiPaperclip className="w-3.5 h-3.5" />
                                                    </a>
                                                ) : (
                                                    <span className="text-[10px] text-slate-300">—</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                {statusBadge(claim.status)}
                                            </td>
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-normal uppercase ${claim.reimbursement_status === 'included_in_payroll' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                                        claim.reimbursement_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                            'bg-slate-50 text-slate-500 border border-slate-200'
                                                    }`}>
                                                    {claim.reimbursement_status === 'included_in_payroll' ? 'In Payroll' :
                                                        claim.reimbursement_status === 'paid' ? 'Direct Paid' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link
                                                        href={route('expenses.show', claim.id)}
                                                        className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <FiEye className="w-3.5 h-3.5" />
                                                    </Link>
                                                    {inArray(claim.status, ['draft', 'returned_to_employee']) && (
                                                        <Link
                                                            href={route('expenses.edit', claim.id)}
                                                            className="p-1.5 bg-slate-50 hover:bg-amber-50 text-slate-500 hover:text-amber-600 rounded-lg transition-colors"
                                                            title="Edit Claim"
                                                        >
                                                            <FiEdit2 className="w-3.5 h-3.5" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="py-12 text-center text-slate-400 italic">
                                            No expense claims found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {claims.links && claims.links.length > 3 && (
                        <div className="bg-white px-4 sm:px-5 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">
                                PAGE: <span className="text-slate-900">{claims.from}-{claims.to}</span> / TOTAL {claims.total}
                            </p>
                            <div className="flex items-center gap-1 flex-wrap justify-center">
                                {claims.links.map((link, i) => (
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={`min-w-[28px] h-7 px-2 flex items-center justify-center rounded-lg text-xs font-normal transition-all ${link.active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-white hover:text-indigo-600'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="min-w-[28px] h-7 px-2 flex items-center justify-center rounded-lg text-xs font-normal text-slate-300 bg-slate-50 border border-transparent cursor-not-allowed opacity-50"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function inArray(val, arr) {
    return Array.isArray(arr) && arr.includes(val);
}
