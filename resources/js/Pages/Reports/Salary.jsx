import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { FiArrowLeft, FiFilter, FiDownload, FiFileText, FiTable, FiDollarSign, FiUsers, FiPlusCircle, FiMinusCircle } from 'react-icons/fi';
import MultiCheckboxSelect from '@/Components/MultiCheckboxSelect';

export default function Salary({ salaryPostings, summary, month, year, companyId, companies, employees, employeeId }) {
    const [filters, setFilters] = useState({
        month: month 
            ? (Array.isArray(month) ? month.map(String) : [String(month)]) 
            : [String(new Date().getMonth() + 1)],
        year: year || new Date().getFullYear(),
        company_id: companyId 
            ? (Array.isArray(companyId) ? companyId.map(String) : [String(companyId)])
            : [],
        employee_id: employeeId 
            ? (Array.isArray(employeeId) ? employeeId.map(String) : [String(employeeId)])
            : []
    });

    // Filter employees based on selected company_id
    const filteredEmployees = (() => {
        if (!employees) return [];
        if (!filters.company_id || filters.company_id.length === 0) {
            return employees;
        }
        return employees.filter(emp => filters.company_id.includes(String(emp.company_id)));
    })();

    // Remove any selected employee IDs that do not belong to the selected branches
    useEffect(() => {
        if (filters.company_id && filters.company_id.length > 0) {
            const allowedEmpIds = employees
                .filter(emp => filters.company_id.includes(String(emp.company_id)))
                .map(emp => String(emp.id));
            
            const newEmployeeIds = filters.employee_id.filter(id => allowedEmpIds.includes(id));
            if (newEmployeeIds.length !== filters.employee_id.length) {
                setFilters(prev => ({ ...prev, employee_id: newEmployeeIds }));
            }
        }
    }, [filters.company_id, employees]);

    const handleFilter = () => {
        router.get(route('reports.salary'), filters, { preserveState: true });
    };

    const handleExport = (type) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(v => params.append(`${key}[]`, v));
            } else {
                params.append(key, value);
            }
        });
        const queryParams = params.toString();
        const baseUrl = route(`reports.salary.export.${type}`);
        window.open(`${baseUrl}?${queryParams}`, '_blank');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'QAR' }).format(amount || 0);
    };

    const months = [
        { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
        { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
        { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800 tracking-normal">Payroll Analysis</h2>}>
            <Head title="Salary Report" />

            <div className="w-full mx-auto p-6 space-y-6 bg-slate-50 min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={route('reports.index')} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-all shadow-sm">
                            <FiArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-normal text-slate-900">Salary Report</h1>
                            <p className="text-sm text-slate-500 mt-0.5 font-normal">Review monthly disbursements, allowances, and deductions.</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => handleExport('pdf')}
                            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-normal uppercase tracking-normal hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center gap-2"
                        >
                            <FiFileText size={14} /> Export PDF
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-normal uppercase tracking-normal hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
                        >
                            <FiTable size={14} /> Export Excel
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <FiFilter size={16} />
                        </div>
                        <h3 className="text-base font-normal text-slate-800">Parameters</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">Month</label>
                            <MultiCheckboxSelect
                                value={filters.month}
                                options={months.map(m => ({ value: String(m.value), label: m.label }))}
                                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                                placeholder="Select Months"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">Year</label>
                            <select
                                value={filters.year}
                                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                                className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-sm bg-slate-50/50 py-2.5"
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">Branch</label>
                            <MultiCheckboxSelect
                                value={filters.company_id}
                                options={companies?.map(c => ({ value: String(c.id), label: c.name })) || []}
                                onChange={(e) => setFilters({ ...filters, company_id: e.target.value })}
                                placeholder="Select Branches"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal ml-1">Employee</label>
                            <MultiCheckboxSelect
                                value={filters.employee_id}
                                options={filteredEmployees?.map(emp => ({ value: String(emp.id), label: emp.name })) || []}
                                onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })}
                                placeholder="Select Employees"
                            />
                        </div>
                        <div>
                            <button
                                onClick={handleFilter}
                                className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-normal hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                            >
                                Apply Analytics
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiUsers size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Employees</div>
                                <div className="text-xl font-normal text-slate-800">{summary.total_employees || 0}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiPlusCircle size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Allowances</div>
                                <div className="text-xl font-normal text-emerald-600">{formatCurrency(summary.total_allowances)}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiMinusCircle size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Deductions</div>
                                <div className="text-xl font-normal text-rose-600">{formatCurrency(summary.total_deductions)}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <FiDollarSign size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-normal text-slate-400 uppercase tracking-normal">Total Net</div>
                                <div className="text-xl font-normal text-blue-600">{formatCurrency(summary.total_net_salary)}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Salary List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-base font-normal text-slate-800">Payroll Records</h3>
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                            <FiDollarSign size={16} />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal">Employee</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-right">Basic</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-right">Allowances</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-right">Deductions</th>
                                    <th className="px-6 py-4 text-xs font-normal text-slate-500 uppercase tracking-normal text-right">Net Salary</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-50">
                                {salaryPostings && salaryPostings.length > 0 ? (
                                    salaryPostings.map((posting) => {
                                        const is_array = (val) => Array.isArray(val) || (typeof val === 'object' && val !== null);
                                        const array_sum = (obj) => Object.values(obj || {}).reduce((a, b) => (parseFloat(a) || 0) + (parseFloat(b) || 0), 0);

                                        const allowances = is_array(posting.allowances) ? array_sum(posting.allowances) : 0;
                                        const deductions = is_array(posting.deductions) ? array_sum(posting.deductions) : 0;

                                        return (
                                            <tr key={posting.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-normal text-slate-500 border border-slate-200 shadow-sm">
                                                            {posting.employee?.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-normal text-slate-700">{posting.employee?.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-normal uppercase tracking-normal">{posting.employee?.employee_code || '-'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-slate-600 text-right">
                                                    {formatCurrency(posting.basic_salary)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-emerald-600 text-right">
                                                    +{formatCurrency(allowances)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-rose-600 text-right">
                                                    -{formatCurrency(deductions)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-slate-900 text-right">
                                                    <span className="bg-slate-100 px-3 py-1 rounded-lg">
                                                        {formatCurrency(posting.net_salary)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200 border border-slate-100 shadow-inner">
                                                    <FiDollarSign size={24} />
                                                </div>
                                                <p className="text-slate-400 text-sm font-normal">No payroll records found for the selected month.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
