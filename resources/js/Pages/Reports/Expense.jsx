import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    FiArrowLeft, FiDownload, FiFileText, FiFilter,
    FiTrendingUp, FiPieChart, FiUsers, FiTag, FiBriefcase,
    FiAlertTriangle, FiCheckCircle, FiDollarSign, FiCalendar,
    FiClock, FiShield, FiBarChart2, FiMapPin, FiRepeat
} from 'react-icons/fi';

export default function ExpenseReport({
    claims = [],
    summary = {},
    employeeWise = [],
    departmentWise = [],
    categoryWise = [],
    monthlyTrend = [],
    projectWise = [],
    year,
    month,
    companyId,
    categoryId,
    status,
    reportType: initialReportType = 'all',
    companies = [],
    categories = [],
    departments = [],
}) {
    const [selectedYear, setSelectedYear] = useState(year || new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(month || '');
    const [selectedCompany, setSelectedCompany] = useState(companyId || '');
    const [selectedCategory, setSelectedCategory] = useState(categoryId || '');
    const [selectedStatus, setSelectedStatus] = useState(status || '');
    const [activeTab, setActiveTab] = useState(initialReportType || 'all'); // all, employee, department, category, pending, rejected, reimbursement, violations, trend, project

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('reports.expense'), {
            year: selectedYear,
            month: selectedMonth,
            company_id: selectedCompany,
            category_id: selectedCategory,
            status: selectedStatus,
            report_type: activeTab,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const formatINR = (val) => {
        return '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    };

    const tabs = [
        { id: 'all', label: 'All Claims Register' },
        { id: 'employee', label: 'Employee-Wise' },
        { id: 'department', label: 'Department & Cost-Centre' },
        { id: 'category', label: 'Category-Wise' },
        { id: 'trend', label: 'Monthly Trend' },
        { id: 'project', label: 'Project-Wise' },
        { id: 'pending', label: 'Pending Approvals' },
        { id: 'rejected', label: 'Rejected / Returned' },
        { id: 'violations', label: 'Policy Violations' },
    ];

    const getFilteredClaims = () => {
        if (activeTab === 'pending') return claims.filter((c) => ['submitted', 'manager_approved'].includes(c.status));
        if (activeTab === 'rejected') return claims.filter((c) => ['rejected', 'returned_to_employee'].includes(c.status));
        if (activeTab === 'violations') return claims.filter((c) => c.policy_violation_flag);
        return claims;
    };

    const displayClaims = getFilteredClaims();

    return (
        <AuthenticatedLayout>
            <Head title="Expense Reports & Analytics" />

            {/* In-Page Header */}
            <div className="w-full bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('reports.index')}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Employee Expense & Reimbursement Analytics</h1>
                            <p className="text-xs text-slate-500 font-normal mt-0.5">Comprehensive audit reports across employees, branches, categories, and policy adherence in INR (₹)</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href={route('reports.expense.export.excel', { year: selectedYear, month: selectedMonth, company_id: selectedCompany })}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                        >
                            <FiDownload className="w-3.5 h-3.5" />
                            Export Excel
                        </a>
                        <a
                            href={route('reports.expense.export.pdf', { year: selectedYear, month: selectedMonth, company_id: selectedCompany })}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                        >
                            <FiDownload className="w-3.5 h-3.5" />
                            Export PDF
                        </a>
                    </div>
                </div>
            </div>

            <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/50 min-h-screen">

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                            <FiDollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">Total Claims Value</p>
                            <h4 className="text-2xl font-bold text-slate-900">{formatINR(summary.total_claimed_amount)}</h4>
                            <p className="text-[10px] text-slate-400">{summary.total_claims || 0} claims logged</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                            <FiCheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">Total Reimbursed</p>
                            <h4 className="text-2xl font-bold text-emerald-700">{formatINR(summary.total_reimbursed)}</h4>
                            <p className="text-[10px] text-emerald-600">{formatINR(summary.payroll_reimbursements)} via payroll</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                            <FiClock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">Pending Approval</p>
                            <h4 className="text-2xl font-bold text-amber-700">
                                {(summary.pending_manager_approval || 0) + (summary.pending_finance_review || 0)}
                            </h4>
                            <p className="text-[10px] text-amber-600">Mgr: {summary.pending_manager_approval || 0} · Fin: {summary.pending_finance_review || 0}</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
                            <FiAlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">Exceptions & Violations</p>
                            <h4 className="text-2xl font-bold text-rose-600">{summary.policy_violations_count || 0}</h4>
                            <p className="text-[10px] text-rose-500">Exceeded limit / Duplicates</p>
                        </div>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white"
                        >
                            {[2024, 2025, 2026, 2027].map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white"
                        >
                            <option value="">Full Year (All Months)</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>
                            ))}
                        </select>

                        {companies.length > 0 && (
                            <select
                                value={selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white"
                            >
                                <option value="">All Companys / Branches</option>
                                {companies.map((co) => (
                                    <option key={co.id} value={co.id}>{co.name}</option>
                                ))}
                            </select>
                        )}

                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white"
                        >
                            <option value="">All Categories</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        <button
                            type="submit"
                            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                            Generate Report
                        </button>
                    </form>
                </div>

                {/* Report Section Tabs */}
                <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 1. Employee-wise Summary View */}
                {activeTab === 'employee' && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 font-semibold text-xs text-slate-800">
                            Employee-wise Spending & Reimbursement Breakdown
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-600">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] uppercase text-slate-400 font-semibold border-b border-slate-100">
                                        <th className="py-3 px-4">Employee Code</th>
                                        <th className="py-3 px-4">Employee Name</th>
                                        <th className="py-3 px-4">Department</th>
                                        <th className="py-3 px-4 text-center">Total Claims</th>
                                        <th className="py-3 px-4 text-right">Total Claimed (INR)</th>
                                        <th className="py-3 px-4 text-right">Approved Amount</th>
                                        <th className="py-3 px-4 text-right">Settled Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {employeeWise.map((emp) => (
                                        <tr key={emp.employee_id} className="hover:bg-slate-50/60">
                                            <td className="py-3 px-4 font-mono font-bold text-slate-700">{emp.employee_code}</td>
                                            <td className="py-3 px-4 font-semibold text-slate-800">{emp.employee_name}</td>
                                            <td className="py-3 px-4">{emp.department}</td>
                                            <td className="py-3 px-4 text-center">{emp.total_claims}</td>
                                            <td className="py-3 px-4 text-right font-semibold text-slate-900">{formatINR(emp.total_amount)}</td>
                                            <td className="py-3 px-4 text-right text-indigo-600">{formatINR(emp.approved_amount)}</td>
                                            <td className="py-3 px-4 text-right text-emerald-600 font-bold">{formatINR(emp.paid_amount)}</td>
                                        </tr>
                                    ))}
                                    {employeeWise.length === 0 && (
                                        <tr><td colSpan="7" className="py-8 text-center text-slate-400 italic">No employee data found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 2. Department & Cost-Centre View */}
                {activeTab === 'department' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
                            <h3 className="text-sm font-semibold text-slate-800">Department Allocations</h3>
                            <div className="space-y-3">
                                {departmentWise.map((dept, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-xs text-slate-800">{dept.department_name}</p>
                                            <p className="text-[10px] text-slate-400">{dept.total_claims} claims</p>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">{formatINR(dept.total_amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
                            <h3 className="text-sm font-semibold text-slate-800">Cost Centres Identified</h3>
                            <div className="flex flex-wrap gap-2">
                                {departmentWise.flatMap((d) => d.cost_centres).filter(Boolean).map((cc, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100">
                                        {cc}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Category-wise Distribution View */}
                {activeTab === 'category' && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-800">Category Expense Distribution</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoryWise.map((cat, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                                    <p className="text-xs font-semibold text-slate-700">{cat.category_name}</p>
                                    <h4 className="text-xl font-bold text-slate-900">{formatINR(cat.total_amount)}</h4>
                                    <p className="text-[10px] text-slate-400">{cat.total_claims} claims · Avg: {formatINR(cat.avg_claim)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. Monthly Trend View */}
                {activeTab === 'trend' && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-800">12-Month Expense & Settlement Trend ({selectedYear})</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                            {monthlyTrend.map((m) => (
                                <div key={m.month} className="p-3 bg-slate-50 rounded-lg text-center border border-slate-100">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">{m.month_name}</p>
                                    <p className="text-sm font-bold text-slate-900 mt-1">{formatINR(m.total_amount)}</p>
                                    <p className="text-[9px] text-emerald-600 mt-0.5">Paid: {formatINR(m.paid_amount)}</p>
                                    <span className="text-[9px] text-slate-400">({m.count} claims)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. Project-Wise View */}
                {activeTab === 'project' && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-800">Project-Specific Expense Allocations</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {projectWise.map((proj, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-xs font-semibold text-indigo-700">{proj.project_name}</p>
                                    <h4 className="text-lg font-bold text-slate-900 mt-1">{formatINR(proj.total_amount)}</h4>
                                    <p className="text-[10px] text-slate-400">{proj.total_claims} claims</p>
                                </div>
                            ))}
                            {projectWise.length === 0 && (
                                <p className="text-xs text-slate-400 italic col-span-3">No project-allocated expenses found.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* 6. Default / Filtered Claims Register (All, Pending, Rejected, Violations) */}
                {inArray(activeTab, ['all', 'pending', 'rejected', 'violations']) && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-600">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] uppercase text-slate-400 font-semibold border-b border-slate-100">
                                        <th className="py-3 px-4">Claim #</th>
                                        <th className="py-3 px-4">Employee</th>
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4">Category</th>
                                        <th className="py-3 px-4">Purpose</th>
                                        <th className="py-3 px-4 text-right">Amount (INR)</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                        <th className="py-3 px-4 text-center">Reimbursement</th>
                                        <th className="py-3 px-4 text-center">Policy Warning</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {displayClaims.map((claim) => (
                                        <tr key={claim.id} className="hover:bg-slate-50/60">
                                            <td className="py-3 px-4 font-semibold text-slate-800">
                                                <Link href={route('expenses.show', claim.id)} className="hover:text-primary">
                                                    {claim.claim_number}
                                                </Link>
                                            </td>
                                            <td className="py-3 px-4 font-semibold text-slate-800">{claim.employee?.name}</td>
                                            <td className="py-3 px-4">{claim.expense_date}</td>
                                            <td className="py-3 px-4">{claim.category?.name || 'General'}</td>
                                            <td className="py-3 px-4 max-w-xs truncate">{claim.business_purpose}</td>
                                            <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(claim.amount)}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="capitalize text-[10px] font-semibold">{claim.status ? claim.status.replace('_', ' ') : '-'}</span>
                                            </td>
                                            <td className="py-3 px-4 text-center text-[10px] font-semibold uppercase text-indigo-700">
                                                {claim.reimbursement_status ? claim.reimbursement_status.replace('_', ' ') : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {claim.policy_violation_flag ? (
                                                    <span className="text-[9px] px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-semibold">
                                                        VIOLATION
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {displayClaims.length === 0 && (
                                        <tr><td colSpan="9" className="py-8 text-center text-slate-400 italic">No expense claims match this report view.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function inArray(val, arr) {
    return Array.isArray(arr) && arr.includes(val);
}
