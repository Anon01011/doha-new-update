import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
    FiArrowLeft, FiUploadCloud, FiFile, FiTrash2,
    FiAlertCircle, FiCheckCircle, FiInfo, FiTag, FiCalendar,
    FiDollarSign, FiCreditCard, FiFolder, FiUser, FiBriefcase, FiLayers, FiSearch, FiCheck
} from 'react-icons/fi';
import Avatar from '@/Components/Avatar';

export default function Create({
    categories = [],
    projects = [],
    companies = [],
    departments = [],
    employees = [],
    currentEmployee,
    userRole = 'employee'
}) {
    const fileInputRef = useRef();
    const [previewUrl, setPreviewUrl] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(categories.length > 0 ? categories[0] : null);

    const isManagementRole = ['admin', 'hr', 'manager'].includes(userRole);

    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState(
        currentEmployee ? employees.find(e => e.id === currentEmployee.id) || currentEmployee : employees[0] || null
    );

    const { data, setData, post, processing, errors } = useForm({
        employee_id: currentEmployee ? currentEmployee.id : (employees.length > 0 ? employees[0].id : ''),
        expense_category_id: categories.length > 0 ? categories[0].id : '',
        expense_date: new Date().toISOString().split('T')[0],
        amount: '',
        tax_amount: '',
        tax_rate: '',
        tax_invoice_number: '',
        vendor_name: '',
        business_purpose: '',
        cost_center: '',
        project_name: '',
        payment_method: 'personal_card',
        receipt: null,
        submit_now: true,
    });

    useEffect(() => {
        if (selectedEmp) {
            setData('employee_id', selectedEmp.id);
        }
    }, [selectedEmp]);

    const filteredDepartments = useMemo(() => {
        if (!selectedCompany) return departments;
        return departments.filter(d => String(d.company_id) === String(selectedCompany));
    }, [departments, selectedCompany]);

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesCompany = !selectedCompany || String(emp.company_id) === String(selectedCompany);
            const matchesDept = !selectedDepartment || String(emp.department_id) === String(selectedDepartment);
            const matchesSearch = !employeeSearch ||
                emp.name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                emp.employee_code?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                emp.designation?.toLowerCase().includes(employeeSearch.toLowerCase());
            return matchesCompany && matchesDept && matchesSearch;
        });
    }, [employees, selectedCompany, selectedDepartment, employeeSearch]);

    const handleCategoryChange = (catId) => {
        setData('expense_category_id', catId);
        const cat = categories.find((c) => String(c.id) === String(catId));
        setSelectedCategory(cat || null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('receipt', file);
            if (file.type.startsWith('image/')) {
                setPreviewUrl(URL.createObjectURL(file));
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const removeFile = () => {
        setData('receipt', null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = (submitDirectly) => {
        setData('submit_now', submitDirectly);
        post(route('expenses.store'), {
            forceFormData: true,
        });
    };

    const formatINR = (val) => {
        return '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    };

    const isExceedingLimit = selectedCategory?.policy_limit_amount && data.amount && Number(data.amount) > Number(selectedCategory.policy_limit_amount);

    return (
        <AuthenticatedLayout>
            <Head title="New Expense Claim" />

            {/* In-Page Header */}
            <div className="w-full bg-white border-b border-slate-100 px-3 sm:px-6 lg:px-8 py-3.5 sm:py-4">
                <div className="flex items-center gap-3">
                    <Link
                        href={route('expenses.index')}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-lg sm:text-xl font-semibold text-slate-800 tracking-tight">New Expense Claim</h1>
                        <p className="text-xs text-slate-500 font-normal mt-0.5">Submit business expenses with supporting invoice/receipt for approval</p>
                    </div>
                </div>
            </div>

            <div className="w-full p-3 sm:p-6 lg:p-8">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(true); }} className="space-y-4 sm:space-y-6">

                    {/* Policy Limit Alert Card */}
                    {selectedCategory && (
                        <div className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${isExceedingLimit ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                            <FiInfo className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isExceedingLimit ? 'text-amber-600' : 'text-slate-400'}`} />
                            <div className="text-xs space-y-1">
                                <p className="font-semibold">
                                    Policy guideline for {selectedCategory.name}:
                                    {selectedCategory.policy_limit_amount ? (
                                        <span className="ml-1 text-slate-900 font-bold">Standard Limit: {formatINR(selectedCategory.policy_limit_amount)}</span>
                                    ) : (
                                        <span className="ml-1 text-slate-500">No strict limit</span>
                                    )}
                                    {selectedCategory.requires_receipt && (
                                        <span className="ml-2 text-rose-600">(Receipt Mandated)</span>
                                    )}
                                </p>
                                {selectedCategory.description && (
                                    <p className="text-slate-500">{selectedCategory.description}</p>
                                )}
                                {isExceedingLimit && (
                                    <p className="text-amber-700 font-medium">
                                        ⚠ Note: Your claim of {formatINR(data.amount)} exceeds the standard policy limit. It will be flagged for Manager & Finance review.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* Main Claim Information (3 cols on XL, 2 cols on LG) */}
                        <div className="lg:col-span-2 xl:col-span-3 space-y-6">

                            {/* Employee Selection / Profile Card */}
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                        <FiUser className="text-primary" />
                                        Employee Information
                                    </h3>
                                    {isManagementRole && (
                                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                            {userRole} Mode
                                        </span>
                                    )}
                                </div>

                                {isManagementRole ? (
                                    <div className="space-y-4">
                                        {/* Company / Branch & Department Filter Bar */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                                            {companies.length > 0 && (
                                                <div>
                                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                                                        <FiBriefcase className="text-slate-400 w-3.5 h-3.5" /> Filter by Branch / Company
                                                    </label>
                                                    <select
                                                        value={selectedCompany}
                                                        onChange={(e) => {
                                                            setSelectedCompany(e.target.value);
                                                            setSelectedDepartment('');
                                                        }}
                                                        className="w-full py-2 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary font-medium text-slate-700"
                                                    >
                                                        <option value="">All Branches / Companys</option>
                                                        {companies.map((c) => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                                                    <FiLayers className="text-slate-400 w-3.5 h-3.5" /> Filter by Department
                                                </label>
                                                <select
                                                    value={selectedDepartment}
                                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                                    className="w-full py-2 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary font-medium text-slate-700"
                                                >
                                                    <option value="">All Departments</option>
                                                    {filteredDepartments.map((d) => (
                                                        <option key={d.id} value={d.id}>{d.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Searchable Employee Dropdown */}
                                        <div className="relative">
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Select Employee for Expense Claim <span className="text-rose-500">*</span>
                                            </label>

                                            <div
                                                onClick={() => setIsEmpDropdownOpen(!isEmpDropdownOpen)}
                                                className="w-full p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                                            >
                                                {selectedEmp ? (
                                                    <div className="flex items-center gap-3">
                                                        <Avatar src={selectedEmp.employee_image} name={selectedEmp.name} size="sm" />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-semibold text-slate-900">{selectedEmp.name}</span>
                                                                <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">{selectedEmp.employee_code}</span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500">
                                                                {selectedEmp.designation || 'Staff'} • {selectedEmp.department?.name || 'General'} ({selectedEmp.company?.name || 'Main Branch'})
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">Select an employee...</span>
                                                )}
                                                <FiSearch className="text-slate-400 w-4 h-4" />
                                            </div>

                                            {isEmpDropdownOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2 max-h-72 overflow-y-auto">
                                                    <div className="p-2 border-b border-slate-100 mb-1 sticky top-0 bg-white">
                                                        <input
                                                            type="text"
                                                            placeholder="Type employee name, code, or designation..."
                                                            value={employeeSearch}
                                                            onChange={(e) => setEmployeeSearch(e.target.value)}
                                                            className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary"
                                                            autoFocus
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        {filteredEmployees.map((emp) => (
                                                            <div
                                                                key={emp.id}
                                                                onClick={() => {
                                                                    setSelectedEmp(emp);
                                                                    setIsEmpDropdownOpen(false);
                                                                    setEmployeeSearch('');
                                                                }}
                                                                className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${selectedEmp?.id === emp.id ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 text-slate-700'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    <Avatar src={emp.employee_image} name={emp.name} size="xs" />
                                                                    <div>
                                                                        <p className="text-xs font-semibold">{emp.name} <span className="font-mono text-[10px] text-slate-400">({emp.employee_code})</span></p>
                                                                        <p className="text-[10px] text-slate-400">{emp.designation || 'Staff'} • {emp.department?.name || 'Department'} • {emp.company?.name || 'Branch'}</p>
                                                                    </div>
                                                                </div>
                                                                {selectedEmp?.id === emp.id && <FiCheck className="w-4 h-4 text-primary" />}
                                                            </div>
                                                        ))}
                                                        {filteredEmployees.length === 0 && (
                                                            <div className="p-4 text-center text-xs text-slate-400">No employees match filter</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {errors.employee_id && <p className="text-[10px] text-rose-500">{errors.employee_id}</p>}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                                        <Avatar src={selectedEmp?.employee_image} name={selectedEmp?.name} size="md" />
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-800">{selectedEmp?.name}</h4>
                                            <p className="text-xs text-slate-500 font-normal">
                                                Code: <span className="font-mono text-slate-700 font-medium">{selectedEmp?.employee_code}</span> • {selectedEmp?.designation || 'Staff'}
                                            </p>
                                            <p className="text-[11px] text-slate-400">
                                                {selectedEmp?.department?.name || 'General Department'} • {selectedEmp?.company?.name || 'Branch'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                    <FiTag className="text-primary" />
                                    Expense Particulars
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Category */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Expense Category <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={data.expense_category_id}
                                            onChange={(e) => handleCategoryChange(e.target.value)}
                                            className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        {errors.expense_category_id && <p className="text-[10px] text-rose-500 mt-1">{errors.expense_category_id}</p>}
                                    </div>

                                    {/* Expense Date */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Expense Date <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            max={new Date().toISOString().split('T')[0]}
                                            value={data.expense_date}
                                            onChange={(e) => setData('expense_date', e.target.value)}
                                            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white"
                                        />
                                        {errors.expense_date && <p className="text-[10px] text-rose-500 mt-1">{errors.expense_date}</p>}
                                    </div>

                                    {/* Amount in INR */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Total Claim Amount (INR ₹) <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="1"
                                                placeholder="0.00"
                                                value={data.amount}
                                                onChange={(e) => setData('amount', e.target.value)}
                                                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white font-semibold"
                                            />
                                        </div>
                                        {errors.amount && <p className="text-[10px] text-rose-500 mt-1">{errors.amount}</p>}
                                    </div>

                                    {/* Vendor Name */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Vendor / Merchant Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Indigo Airlines, Uber, Company Supplies Ltd"
                                            value={data.vendor_name}
                                            onChange={(e) => setData('vendor_name', e.target.value)}
                                            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white"
                                        />
                                        {errors.vendor_name && <p className="text-[10px] text-rose-500 mt-1">{errors.vendor_name}</p>}
                                    </div>
                                </div>

                                {/* Business Purpose */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Business Purpose & Details <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows="3"
                                        placeholder="Describe the business reason for this expense..."
                                        value={data.business_purpose}
                                        onChange={(e) => setData('business_purpose', e.target.value)}
                                        className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white"
                                    ></textarea>
                                    {errors.business_purpose && <p className="text-[10px] text-rose-500 mt-1">{errors.business_purpose}</p>}
                                </div>
                            </div>

                            {/* Accounting & Tax Fields */}
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                    <FiDollarSign className="text-emerald-600" />
                                    Accounting, Tax & Project Coding
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Payment Method <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={data.payment_method}
                                            onChange={(e) => setData('payment_method', e.target.value)}
                                            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white"
                                        >
                                            <option value="personal_card">Personal Card</option>
                                            <option value="cash">Cash Out of Pocket</option>
                                            <option value="upi">UPI / Online</option>
                                            <option value="corporate_card">Company Card</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Cost Centre / Branch
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Operations, Branch A"
                                            value={data.cost_center}
                                            onChange={(e) => setData('cost_center', e.target.value)}
                                            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Project / Campaign
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Company Launch, Promo 2026"
                                            value={data.project_name}
                                            onChange={(e) => setData('project_name', e.target.value)}
                                            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Tax Amount (GST ₹)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={data.tax_amount}
                                            onChange={(e) => setData('tax_amount', e.target.value)}
                                            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Tax Rate (%)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="e.g. 18"
                                            value={data.tax_rate}
                                            onChange={(e) => setData('tax_rate', e.target.value)}
                                            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Tax Invoice No.
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. INV-98124"
                                            value={data.tax_invoice_number}
                                            onChange={(e) => setData('tax_invoice_number', e.target.value)}
                                            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Receipt Upload & Actions (1 col) */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                    <FiUploadCloud className="text-primary" />
                                    Receipt & Documents
                                </h3>

                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-200 hover:border-primary/50 bg-slate-50 hover:bg-slate-50/80 rounded-xl p-6 text-center cursor-pointer transition-all"
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,application/pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <FiUploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                                    <p className="text-xs font-semibold text-slate-700">Click to upload receipt</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Supports JPG, PNG, WEBP, PDF (Max 10MB)</p>
                                </div>

                                {data.receipt && (
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 truncate">
                                            <FiFile className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                            <span className="text-xs text-slate-700 truncate font-medium">{data.receipt.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeFile}
                                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {previewUrl && (
                                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                        <img src={previewUrl} alt="Receipt preview" className="w-full h-40 object-cover" />
                                    </div>
                                )}

                                {errors.receipt && (
                                    <p className="text-[10px] text-rose-500">{errors.receipt}</p>
                                )}
                            </div>

                            {/* Submission Buttons */}
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-3 bg-slate-900 hover:bg-primary text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <FiCheckCircle className="w-4 h-4" />
                                    Submit Claim for Approval
                                </button>

                                <button
                                    type="button"
                                    disabled={processing}
                                    onClick={() => handleSubmit(false)}
                                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                                >
                                    Save as Draft
                                </button>

                                <Link
                                    href={route('expenses.index')}
                                    className="block text-center text-xs text-slate-400 hover:text-slate-600 transition-colors pt-1"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
