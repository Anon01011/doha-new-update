import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import {
    FiArrowLeft, FiUserMinus, FiCalendar, FiFileText,
    FiUploadCloud, FiAlertCircle, FiInfo, FiSearch,
    FiBriefcase, FiLayers, FiUser, FiCheck, FiShield,
    FiUserCheck, FiClock, FiMail, FiPhone
} from 'react-icons/fi';

const SEPARATION_REASONS = [
    { value: 'resignation', label: 'Resignation (Voluntary Resignation)' },
    { value: 'retirement', label: 'Retirement' },
    { value: 'termination', label: 'Termination' },
    { value: 'contract_completion', label: 'Contract Completion / Expiry' },
    { value: 'redundancy', label: 'Redundancy / Restructuring' },
    { value: 'mutual_separation', label: 'Mutual Separation Agreement' },
    { value: 'absconding', label: 'Absconding / Abandonment' },
    { value: 'other', label: 'Other' },
];

const EMPLOYEE_SEPARATION_REASONS = [
    { value: 'resignation', label: 'Resignation (Personal / Career Move)' },
    { value: 'retirement', label: 'Retirement' },
    { value: 'mutual_separation', label: 'Mutual Separation Agreement' },
    { value: 'other', label: 'Other Reason' },
];

export default function Create({
    employees = [],
    preselected = null,
    currentEmployee = null,
    userRole = 'employee',
    companies = [],
    departments = []
}) {
    const isManagementRole = ['admin', 'hr', 'manager'].includes(userRole);
    const activeTargetEmployee = preselected || (!isManagementRole ? currentEmployee : null);

    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(activeTargetEmployee);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        employee_id: activeTargetEmployee?.id || '',
        separation_reason: 'resignation',
        proposed_last_working_day: '',
        notice_pay_applicable: false,
        notice_pay_amount: '',
        remarks: '',
        supporting_document: null,
    });

    // Filter available departments based on selected company (for management)
    const filteredDepartments = useMemo(() => {
        if (!selectedCompany) return departments;
        return departments.filter(d => !d.company_id || String(d.company_id) === String(selectedCompany));
    }, [departments, selectedCompany]);

    // Filter employees based on Company, Department, and Search query (for management)
    const filteredEmployees = useMemo(() => {
        if (!isManagementRole) return employees;
        return employees.filter(emp => {
            if (selectedCompany && String(emp.company_id) !== String(selectedCompany)) {
                return false;
            }
            if (selectedDepartment && String(emp.department_id) !== String(selectedDepartment)) {
                return false;
            }
            if (employeeSearch.trim()) {
                const q = employeeSearch.toLowerCase();
                const nameMatch = emp.name?.toLowerCase().includes(q);
                const codeMatch = emp.employee_code?.toLowerCase().includes(q);
                const desigMatch = emp.designation?.toLowerCase().includes(q);
                if (!nameMatch && !codeMatch && !desigMatch) return false;
            }
            return true;
        });
    }, [employees, selectedCompany, selectedDepartment, employeeSearch, isManagementRole]);

    const selectEmployee = (emp) => {
        setSelectedEmployee(emp);
        setData('employee_id', emp.id);
        setIsDropdownOpen(false);
        setEmployeeSearch('');
    };

    const handleClearEmployee = () => {
        setSelectedEmployee(null);
        setData('employee_id', '');
        setEmployeeSearch('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('offboarding.store'), { forceFormData: true });
    };

    // Calculate notice period preview
    const noticeDays = data.proposed_last_working_day
        ? Math.max(0, Math.ceil((new Date(data.proposed_last_working_day) - new Date()) / (1000 * 60 * 60 * 24)))
        : null;

    // Years of service
    const joiningDate = selectedEmployee?.joined_date || selectedEmployee?.joining_date;
    const yearsOfService = joiningDate
        ? Math.floor((new Date() - new Date(joiningDate)) / (1000 * 60 * 60 * 24 * 365))
        : null;

    const availableReasons = isManagementRole ? SEPARATION_REASONS : EMPLOYEE_SEPARATION_REASONS;

    return (
        <AuthenticatedLayout>
            <Head title={isManagementRole ? "Initiate Offboarding" : "Submit Resignation / Offboarding"} />

            {/* In-Page Header */}
            <div className="w-full bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('offboarding.index')}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                <FiUserMinus className="text-rose-500 w-5 h-5" />
                                {isManagementRole ? 'Initiate Employee Separation' : 'Submit Resignation / Offboarding Request'}
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {isManagementRole
                                    ? 'Create a formal offboarding request to begin the employee exit process'
                                    : 'Submit your formal resignation or separation notice to management and HR'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto p-3 sm:p-6 lg:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left Column (2 cols): Employee Particulars & Separation Form */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Employee Identification Card */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <FiUser className="text-rose-500 w-4 h-4" />
                                        {isManagementRole ? 'Target Employee' : 'Your Employee Profile'}
                                    </h2>
                                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                        {isManagementRole ? 'Management Mode' : 'Self-Initiated'}
                                    </span>
                                </div>

                                {!isManagementRole ? (
                                    /* Employee View: Clean, dedicated read-only profile card */
                                    !selectedEmployee ? (
                                        <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                                            <div className="flex items-center gap-2.5 text-amber-800 font-bold text-sm">
                                                <FiAlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                                <span>No Employee Profile Linked</span>
                                            </div>
                                            <p className="text-xs text-amber-700 leading-relaxed">
                                                Your login account is not currently linked to an active employee record. Please contact your Company Manager or HR Administrator to link your staff record to submit a separation notice.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-4 sm:p-5 bg-gradient-to-br from-rose-50/50 via-slate-50/80 to-pink-50/30 border border-rose-100 rounded-xl space-y-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-3.5">
                                                    {selectedEmployee.employee_image ? (
                                                        <img
                                                            src={`/storage/${selectedEmployee.employee_image}`}
                                                            alt={selectedEmployee.name}
                                                            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-rose-100"
                                                        />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                                                            {selectedEmployee.name?.charAt(0)?.toUpperCase() || 'E'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="font-bold text-slate-900 text-base">{selectedEmployee.name}</h3>
                                                            {selectedEmployee.employee_code && (
                                                                <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                                                                    {selectedEmployee.employee_code}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                                                            {selectedEmployee.designation || 'Staff'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold self-start sm:self-center">
                                                    <FiShield className="w-3.5 h-3.5" />
                                                    <span>Verified Employee</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-rose-100/80 text-xs">
                                                <div>
                                                    <span className="block text-[11px] text-slate-400 font-medium">Department</span>
                                                    <span className="font-semibold text-slate-700">{selectedEmployee.department?.name || 'General'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[11px] text-slate-400 font-medium">Branch / Company</span>
                                                    <span className="font-semibold text-slate-700">{selectedEmployee.company?.name || 'Main Branch'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[11px] text-slate-400 font-medium">Service Tenure</span>
                                                    <span className="font-semibold text-emerald-600">
                                                        {yearsOfService !== null ? `${yearsOfService} yr${yearsOfService !== 1 ? 's' : ''}` : 'Active'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    /* Management View: Filters & Search Dropdown */
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60">
                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                                                    <FiBriefcase className="text-slate-400 w-3.5 h-3.5" /> Filter by Company
                                                </label>
                                                <select
                                                    value={selectedCompany}
                                                    onChange={(e) => {
                                                        setSelectedCompany(e.target.value);
                                                        setSelectedDepartment('');
                                                    }}
                                                    className="w-full py-2 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 transition-all font-medium text-slate-700"
                                                >
                                                    <option value="">All Companies / Branches</option>
                                                    {companies.map((c) => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                                                    <FiLayers className="text-slate-400 w-3.5 h-3.5" /> Filter by Department
                                                </label>
                                                <select
                                                    value={selectedDepartment}
                                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                                    className="w-full py-2 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 transition-all font-medium text-slate-700"
                                                >
                                                    <option value="">All Departments</option>
                                                    {filteredDepartments.map((d) => (
                                                        <option key={d.id} value={d.id}>{d.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {selectedEmployee ? (
                                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-rose-50/60 to-pink-50/40 border border-rose-200/70 rounded-xl">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-200 flex-shrink-0 flex items-center justify-center font-bold text-rose-600 text-sm">
                                                        {selectedEmployee.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-slate-800 text-sm truncate">{selectedEmployee.name}</p>
                                                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-rose-100 text-rose-700 flex-shrink-0">
                                                                {selectedEmployee.employee_code}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5 truncate">
                                                            <span>{selectedEmployee.designation || 'Staff'}</span>
                                                            {selectedEmployee.department?.name && (
                                                                <>
                                                                    <span>·</span>
                                                                    <span className="text-slate-600 font-medium">{selectedEmployee.department.name}</span>
                                                                </>
                                                            )}
                                                            {selectedEmployee.company?.name && (
                                                                <>
                                                                    <span>·</span>
                                                                    <span className="text-slate-400 font-medium">{selectedEmployee.company.name}</span>
                                                                </>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleClearEmployee}
                                                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100/60 rounded-lg transition-colors border border-rose-200 flex-shrink-0 ml-3"
                                                >
                                                    Change
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                    Search & Select Employee *
                                                </label>
                                                <div className="relative">
                                                    <FiSearch className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                                                    <input
                                                        type="text"
                                                        placeholder="Type employee name, code, or designation…"
                                                        value={employeeSearch}
                                                        onFocus={() => setIsDropdownOpen(true)}
                                                        onChange={(e) => {
                                                            setEmployeeSearch(e.target.value);
                                                            setIsDropdownOpen(true);
                                                        }}
                                                        className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 focus:bg-white transition-all"
                                                    />
                                                </div>

                                                {isDropdownOpen && (
                                                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-30 divide-y divide-slate-100">
                                                        {filteredEmployees.length === 0 ? (
                                                            <div className="p-4 text-center text-xs text-slate-400">
                                                                No employees found matching the filters.
                                                            </div>
                                                        ) : (
                                                            filteredEmployees.slice(0, 30).map((emp) => (
                                                                <button
                                                                    key={emp.id}
                                                                    type="button"
                                                                    onClick={() => selectEmployee(emp)}
                                                                    className="w-full text-left px-4 py-3 text-xs hover:bg-rose-50/50 flex items-center justify-between transition-colors group"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-rose-100 text-slate-600 group-hover:text-rose-600 flex items-center justify-center font-bold text-xs transition-colors">
                                                                            {emp.name?.charAt(0)?.toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-semibold text-slate-800 group-hover:text-rose-700">{emp.name}</span>
                                                                                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                                                    {emp.employee_code}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                                                {emp.designation || 'Staff'}
                                                                                {emp.department?.name && ` · ${emp.department.name}`}
                                                                                {emp.company?.name && ` · ${emp.company.name}`}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <FiCheck className="w-4 h-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                                {errors.employee_id && <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.employee_id}</p>}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Separation Details */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-4">
                                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <FiFileText className="text-rose-500 w-4 h-4" /> Separation Details
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Separation Reason *
                                        </label>
                                        <select
                                            value={data.separation_reason}
                                            onChange={(e) => setData('separation_reason', e.target.value)}
                                            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 font-medium text-slate-700"
                                        >
                                            {availableReasons.map((r) => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                        {errors.separation_reason && <p className="text-[10px] text-rose-500 mt-1">{errors.separation_reason}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Proposed Last Working Day *
                                        </label>
                                        <div className="relative">
                                            <FiCalendar className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                                            <input
                                                type="date"
                                                required
                                                value={data.proposed_last_working_day}
                                                onChange={(e) => setData('proposed_last_working_day', e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 font-medium text-slate-700"
                                            />
                                        </div>
                                        {noticeDays !== null && (
                                            <p className="text-[10px] text-slate-500 mt-1">
                                                Notice period: <span className="font-semibold text-slate-700">{noticeDays} day{noticeDays !== 1 ? 's' : ''}</span>
                                            </p>
                                        )}
                                        {errors.proposed_last_working_day && <p className="text-[10px] text-rose-500 mt-1">{errors.proposed_last_working_day}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        {isManagementRole ? 'Remarks / Internal Notes' : 'Reason / Handover Context'}
                                    </label>
                                    <textarea
                                        rows="4"
                                        placeholder={
                                            isManagementRole
                                                ? "Add any notes, context, or instructions for the offboarding team…"
                                                : "Provide reason details, transition/handover summary, or any special requests for HR…"
                                        }
                                        value={data.remarks}
                                        onChange={(e) => setData('remarks', e.target.value)}
                                        className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
                                    />
                                    {errors.remarks && <p className="text-[10px] text-rose-500 mt-1">{errors.remarks}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Right Column (1 col): Notice Pay, Document Upload & Submission */}
                        <div className="space-y-6">

                            {/* Notice Pay Card (Only for Management or if configured) */}
                            {isManagementRole && (
                                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-4">
                                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <FiAlertCircle className="text-amber-500 w-4 h-4" /> Notice Pay & Terms
                                    </h3>

                                    <div className="flex items-start gap-3 p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl">
                                        <input
                                            type="checkbox"
                                            id="notice_pay"
                                            checked={data.notice_pay_applicable}
                                            onChange={(e) => setData('notice_pay_applicable', e.target.checked)}
                                            className="mt-0.5 rounded text-rose-600 focus:ring-rose-400"
                                        />
                                        <div className="flex-1">
                                            <label htmlFor="notice_pay" className="text-xs font-bold text-slate-800 cursor-pointer">Notice Pay Applicable</label>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Enable if employee is being paid in lieu of notice period</p>
                                        </div>
                                    </div>

                                    {data.notice_pay_applicable && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Notice Pay Amount (₹)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0.00"
                                                    value={data.notice_pay_amount}
                                                    onChange={(e) => setData('notice_pay_amount', e.target.value)}
                                                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Document Upload */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-3">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <FiUploadCloud className="text-rose-500 w-4 h-4" />
                                    {isManagementRole ? 'Supporting Document' : 'Resignation Letter / File'}
                                </h3>
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-rose-400 hover:bg-rose-50/20 rounded-xl p-5 cursor-pointer transition-all text-center">
                                    <FiUploadCloud className="w-7 h-7 text-slate-400 mb-1.5" />
                                    <p className="text-xs text-slate-700 font-medium truncate max-w-[200px]">
                                        {data.supporting_document ? data.supporting_document.name : 'Upload Resignation or Letter'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1">PDF, DOC, JPG — Max 5MB</p>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        className="hidden"
                                        onChange={(e) => setData('supporting_document', e.target.files[0] || null)}
                                    />
                                </label>
                                {errors.supporting_document && <p className="text-[10px] text-rose-500 mt-1">{errors.supporting_document}</p>}
                            </div>

                            {/* Info Banner & Actions */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-4">
                                <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
                                    <FiInfo className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                                    <p className="text-[11px] leading-relaxed">
                                        {isManagementRole
                                            ? 'Submitting this will initiate clearance checklists, exit interview scheduling, and final settlement calculations.'
                                            : 'Your resignation request will be routed to your Branch Manager and HR Department for formal review and clearance schedule.'}
                                    </p>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <button
                                        type="submit"
                                        disabled={processing || !data.employee_id}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        <FiUserMinus className="w-4 h-4" />
                                        {processing
                                            ? 'Submitting…'
                                            : (isManagementRole ? 'Submit Separation Request' : 'Submit Resignation Request')}
                                    </button>
                                    <Link
                                        href={route('offboarding.index')}
                                        className="block text-center py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                                    >
                                        Cancel & Back
                                    </Link>
                                </div>
                            </div>
                        </div>

                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
