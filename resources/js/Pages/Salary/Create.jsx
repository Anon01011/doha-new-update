import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { FaUser, FaCalendarAlt, FaMoneyBillWave, FaCalculator, FaPlus, FaTrash, FaArrowLeft, FaSave, FaMinus, FaInfoCircle, FaExclamationCircle, FaBuilding, FaChevronDown, FaClock, FaChartLine } from 'react-icons/fa';

export default function Create({ employees, salaryComponents = [], companies = [] }) {
    const { appSettings, auth } = usePage().props;
    const userRole = auth.user.role;
    const isAdminUser = ['admin', 'system admin', 'system_admin', 'super admin', 'superadmin'].includes(String(userRole).toLowerCase());
    const currency = appSettings?.currency || 'QAR';
    const currency_symbol = appSettings?.currency_symbol || 'QAR';

    const [selectedCompany, setSelectedCompany] = useState('');
    const [allowances, setAllowances] = useState([{ name: '', amount: '0', value_type: 'flat', percentage: '' }]);
    const [deductions, setDeductions] = useState([{ name: '', amount: '0', value_type: 'flat', percentage: '' }]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [calculationSummary, setCalculationSummary] = useState(null);
    const [confirmingAction, setConfirmingAction] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'warning'
    });

    const { data, setData, post, processing, errors } = useForm({
        employee_id: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        basic_salary: '',
        allowances: {},
        deductions: {},
        overtime_amount: '',
        leave_deduction: '',
    });

    const [employeeList, setEmployeeList] = useState(employees);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

    useMemo(async () => {
        if (isAdminUser && selectedCompany) {
            setIsLoadingEmployees(true);
            try {
                const response = await window.axios.get(route('api.employees.byCompany'), {
                    params: { company_id: selectedCompany }
                });
                setEmployeeList(response.data.employees);
            } catch (error) {
                console.error("Failed to fetch employees", error);
                setEmployeeList([]);
            } finally {
                setIsLoadingEmployees(false);
            }
        } else if (!isAdminUser) {
            setEmployeeList(employees);
        }
    }, [selectedCompany, isAdminUser]);

    const addAllowance = () => setAllowances([...allowances, { name: '', amount: '', value_type: 'flat', percentage: '' }]);
    const removeAllowance = (index) => {
        const updated = allowances.filter((_, i) => i !== index);
        setAllowances(updated);
        syncAllowancesToData(updated);
    };

    const updateAllowance = (index, field, value) => {
        const updated = [...allowances];
        updated[index][field] = value;
        if (field === 'percentage' || field === 'value_type' || field === 'amount') {
            const basic = parseFloat(data.basic_salary) || 0;
            if (updated[index].value_type === 'percentage') {
                const pct = parseFloat(updated[index].percentage) || 0;
                updated[index].amount = (basic * (pct / 100)).toFixed(2);
            }
        }
        setAllowances(updated);
        syncAllowancesToData(updated);
    };

    const syncAllowancesToData = (list) => {
        const allowancesObj = {};
        list.forEach((a) => {
            if (a.name && a.amount) allowancesObj[a.name] = parseFloat(a.amount) || 0;
        });
        setData('allowances', allowancesObj);
    };

    const addDeduction = () => setDeductions([...deductions, { name: '', amount: '', value_type: 'flat', percentage: '' }]);
    const removeDeduction = (index) => {
        const updated = deductions.filter((_, i) => i !== index);
        setDeductions(updated);
        syncDeductionsToData(updated);
    };

    const updateDeduction = (index, field, value) => {
        const updated = [...deductions];
        updated[index][field] = value;
        if (field === 'percentage' || field === 'value_type' || field === 'amount') {
            const basic = parseFloat(data.basic_salary) || 0;
            if (updated[index].value_type === 'percentage') {
                const pct = parseFloat(updated[index].percentage) || 0;
                updated[index].amount = (basic * (pct / 100)).toFixed(2);
            }
        }
        setDeductions(updated);
        syncDeductionsToData(updated);
    };

    const syncDeductionsToData = (list) => {
        const deductionsObj = {};
        list.forEach((d) => {
            if (d.name && d.amount) deductionsObj[d.name] = parseFloat(d.amount) || 0;
        });
        setData('deductions', deductionsObj);
    };

    const handleAutoCalculate = async (forceEmployeeId = null, forceMonth = null, forceYear = null) => {
        const empId = forceEmployeeId || data.employee_id;
        const m = forceMonth || data.month;
        const y = forceYear || data.year;

        if (!empId || !m || !y) {
            if (!forceEmployeeId && !forceMonth && !forceYear) {
                setConfirmingAction({
                    show: true,
                    title: 'Selection Required',
                    message: 'Please select an employee and month/year before calculating.',
                    type: 'warning',
                    onConfirm: () => setConfirmingAction(prev => ({ ...prev, show: false }))
                });
            }
            return;
        }
        setIsCalculating(true);
        try {
            const response = await window.axios.post(route('salary-postings.calculate'), {
                employee_id: empId,
                month: m,
                year: y
            });
            if (response.data.success) {
                const result = response.data;
                if (result.allowances) {
                    setAllowances(Object.entries(result.allowances).map(([name, amount]) => ({
                        name, amount: amount.toString(), value_type: 'flat', percentage: ''
                    })));
                }
                if (result.deductions) {
                    setDeductions(Object.entries(result.deductions).map(([name, amount]) => ({
                        name, amount: amount.toString(), value_type: 'flat', percentage: ''
                    })));
                }
                setData(prev => ({
                    ...prev,
                    employee_id: empId,
                    month: m,
                    year: y,
                    basic_salary: result.basic_salary,
                    overtime_amount: result.overtime_amount,
                    leave_deduction: result.leave_deduction,
                    allowances: result.allowances || {},
                    deductions: result.deductions || {},
                }));
                setCalculationSummary(result.attendance_summary);
            }
        } catch (error) {
            console.error(error);
            setConfirmingAction({
                show: true,
                title: 'Calculation Error',
                message: error.response?.data?.message || error.message,
                type: 'danger',
                onConfirm: () => setConfirmingAction(prev => ({ ...prev, show: false }))
            });
        } finally {
            setIsCalculating(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('salary-postings.store'));
    };

    const months = [
        { value: 1, label: 'JANUARY' }, { value: 2, label: 'FEBRUARY' }, { value: 3, label: 'MARCH' },
        { value: 4, label: 'APRIL' }, { value: 5, label: 'MAY' }, { value: 6, label: 'JUNE' },
        { value: 7, label: 'JULY' }, { value: 8, label: 'AUGUST' }, { value: 9, label: 'SEPTEMBER' },
        { value: 10, label: 'OCTOBER' }, { value: 11, label: 'NOVEMBER' }, { value: 12, label: 'DECEMBER' }
    ];

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
    const totalAllowances = allowances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    const grossSalary = (parseFloat(data.basic_salary) || 0) + totalAllowances + (parseFloat(data.overtime_amount) || 0);
    const totalDeductionsFinal = totalDeductions + (parseFloat(data.leave_deduction) || 0);
    const estimatedNet = grossSalary - totalDeductionsFinal;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount || 0);
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">New Salary Record</h2>}>
            <Head title="Create Salary" />

            <div className="py-4 px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Executive Control Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-6 rounded-lg shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <FaMoneyBillWave size={120} />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <Link
                            href={route('salary-postings.index')}
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-normal text-slate-900 tracking-normal leading-none mb-2 uppercase tracking-normal">Create Salary</h2>
                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                Create New Salary Record
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => handleAutoCalculate()}
                            disabled={isCalculating || !data.employee_id}
                            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            <FaCalculator className={`${isCalculating ? 'animate-spin' : ''}`} />
                            {isCalculating ? 'Calculating...' : 'Calculate Salary'}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Execution Core */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personnel & Period Selection */}
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {isAdminUser && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                                                Company
                                            </label>
                                            <div className="relative group">
                                                    <select
                                                        className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none cursor-pointer text-[11px] font-normal uppercase tracking-normal"
                                                        value={selectedCompany}
                                                        onChange={(e) => { setSelectedCompany(e.target.value); setData('employee_id', ''); }}
                                                        required
                                                    >
                                                        <option value="">SELECT COMPANY...</option>
                                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                                                    </select>
                                                </div>
                                        </div>
                                    )}

                                    <div className={`space-y-3 ${isAdminUser ? '' : 'md:col-span-2'}`}>
                                        <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                                            Employee
                                        </label>
                                        <div className="relative">
                                            <SearchableSelect
                                                id="employee_id"
                                                name="employee_id"
                                                value={data.employee_id}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setData('employee_id', val);
                                                    if (val) setTimeout(() => handleAutoCalculate(val), 100);
                                                }}
                                                options={employeeList?.map(emp => ({ value: emp.id, label: `${emp.name.toUpperCase()} (${emp.employee_code})` })) || []}
                                                placeholder="SEARCH EMPLOYEE..."
                                            />
                                        </div>
                                        {errors.employee_id && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 uppercase tracking-normal">{errors.employee_id}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50/50 rounded-lg border border-slate-50">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">Month</label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-5 py-3.5 bg-white border border-slate-100 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none cursor-pointer text-[11px] font-normal uppercase tracking-normal"
                                                value={data.month}
                                                onChange={(e) => { setData('month', e.target.value); if (data.employee_id) setTimeout(() => handleAutoCalculate(null, e.target.value), 100); }}
                                                required
                                            >
                                                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1">Year</label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-5 py-3.5 bg-white border border-slate-100 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none cursor-pointer text-[11px] font-normal uppercase tracking-normal"
                                                value={data.year}
                                                onChange={(e) => { setData('year', e.target.value); if (data.employee_id) setTimeout(() => handleAutoCalculate(null, null, e.target.value), 100); }}
                                                required
                                            >
                                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financial Attributes */}
                        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                            <h3 className="text-sm font-normal text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"><FaMoneyBillWave size={14} /></div>
                                Basic Salary Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1">Basic Salary</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-normal text-slate-400">{currency_symbol}</span>
                                        <input
                                            type="number" step="0.01" required
                                            className="w-full pl-16 pr-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-[11px] font-normal uppercase tracking-normal"
                                            value={data.basic_salary}
                                            onChange={(e) => setData('basic_salary', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1 text-emerald-600">Overtime</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-normal text-emerald-300">{currency_symbol}</span>
                                        <input
                                            type="number" step="0.01"
                                            className="w-full pl-16 pr-5 py-3.5 bg-emerald-50/10 border border-emerald-100/50 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-[11px] font-normal uppercase tracking-normal text-emerald-700"
                                            value={data.overtime_amount}
                                            onChange={(e) => setData('overtime_amount', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1 text-rose-600">Leave Deduction</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-normal text-rose-300">{currency_symbol}</span>
                                        <input
                                            type="number" step="0.01"
                                            className="w-full pl-16 pr-5 py-3.5 bg-rose-50/10 border border-rose-100/50 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-[11px] font-normal uppercase tracking-normal text-rose-700"
                                            value={data.leave_deduction}
                                            onChange={(e) => setData('leave_deduction', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Allowances */}
                            <div className="space-y-4 pt-6 border-t border-slate-50">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[11px] font-normal text-slate-900 uppercase tracking-normal flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                        Allowances
                                    </h4>
                                    <button type="button" onClick={addAllowance} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-normal uppercase tracking-normal hover:bg-emerald-100 border border-emerald-100 transition-all">+ Add Allowance</button>
                                </div>
                                <div className="space-y-3">
                                    {allowances.map((a, i) => (
                                        <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50/50 rounded-lg border border-slate-100 group">
                                            <div className="md:col-span-4">
                                                <select
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[10px] font-normal uppercase tracking-normal outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const updated = [...allowances];
                                                        if (val === 'custom') {
                                                            updated[i] = { ...updated[i], name: '', value_type: 'flat', percentage: '' };
                                                        } else {
                                                            const comp = salaryComponents.find(c => c.name === val);
                                                            if (comp) {
                                                                updated[i].name = comp.name;
                                                                updated[i].value_type = comp.value_type || 'flat';
                                                                if (comp.value_type === 'percentage') {
                                                                    updated[i].percentage = comp.default_amount;
                                                                    const basic = parseFloat(data.basic_salary) || 0;
                                                                    updated[i].amount = (basic * (parseFloat(comp.default_amount) / 100)).toFixed(2);
                                                                } else {
                                                                    updated[i].amount = comp.default_amount?.toString() || "0";
                                                                    updated[i].percentage = '';
                                                                }
                                                            }
                                                        }
                                                        setAllowances(updated); syncAllowancesToData(updated);
                                                    }}
                                                    value={salaryComponents.some(c => c.name === a.name) ? a.name : (a.name ? 'custom' : '')}
                                                >
                                                    <option value="">SELECT ALLOWANCE...</option>
                                                    {salaryComponents.filter(c => c.type === 'allowance').map(c => <option key={c.id} value={c.name}>{c.name.toUpperCase()}</option>)}
                                                    <option value="custom">CUSTOM ALLOWANCE</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-3">
                                                <input
                                                    type="text" placeholder="ALLOWANCE NAME"
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[10px] font-normal uppercase tracking-normal outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                                                    value={a.name}
                                                    onChange={(e) => updateAllowance(i, 'name', e.target.value)}
                                                />
                                            </div>
                                            <div className="md:col-span-4 flex items-center gap-2">
                                                <select
                                                    className="w-20 px-2 py-2.5 bg-white border border-slate-200 rounded-lg text-[9px] font-normal uppercase outline-none"
                                                    value={a.value_type}
                                                    onChange={(e) => updateAllowance(i, 'value_type', e.target.value)}
                                                >
                                                    <option value="flat">FLAT</option>
                                                    <option value="percentage">% PCT</option>
                                                </select>
                                                <input
                                                    type="number" step="0.01"
                                                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[10px] font-normal outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                                    value={a.value_type === 'percentage' ? a.percentage : a.amount}
                                                    onChange={(e) => updateAllowance(i, a.value_type === 'percentage' ? 'percentage' : 'amount', e.target.value)}
                                                />
                                            </div>
                                            <div className="md:col-span-1 flex items-center justify-end">
                                                <button type="button" onClick={() => removeAllowance(i)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><FaTrash size={12} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic Deductions */}
                            <div className="space-y-4 pt-6 border-t border-slate-50">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[11px] font-normal text-slate-900 uppercase tracking-normal flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                                        Deductions
                                    </h4>
                                    <button type="button" onClick={addDeduction} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-normal uppercase tracking-normal hover:bg-rose-100 border border-rose-100 transition-all">+ Add Deduction</button>
                                </div>
                                <div className="space-y-3">
                                    {deductions.map((d, i) => (
                                        <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50/50 rounded-lg border border-slate-100 group">
                                            <div className="md:col-span-4">
                                                <select
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[10px] font-normal uppercase tracking-normal outline-none"
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const updated = [...deductions];
                                                        if (val === 'custom') {
                                                            updated[i] = { ...updated[i], name: '', value_type: 'flat', percentage: '' };
                                                        } else {
                                                            const comp = salaryComponents.find(c => c.name === val);
                                                            if (comp) {
                                                                updated[i].name = comp.name;
                                                                updated[i].value_type = comp.value_type || 'flat';
                                                                if (comp.value_type === 'percentage') {
                                                                    updated[i].percentage = comp.default_amount;
                                                                    const basic = parseFloat(data.basic_salary) || 0;
                                                                    updated[i].amount = (basic * (parseFloat(comp.default_amount) / 100)).toFixed(2);
                                                                } else {
                                                                    updated[i].amount = comp.default_amount?.toString() || "0";
                                                                    updated[i].percentage = '';
                                                                }
                                                            }
                                                        }
                                                        setDeductions(updated); syncDeductionsToData(updated);
                                                    }}
                                                    value={salaryComponents.some(c => c.name === d.name) ? d.name : (d.name ? 'custom' : '')}
                                                >
                                                    <option value="">SELECT DEDUCTION...</option>
                                                    {salaryComponents.filter(c => c.type === 'deduction').map(c => <option key={c.id} value={c.name}>{c.name.toUpperCase()}</option>)}
                                                    <option value="custom">CUSTOM DEDUCTION</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-3">
                                                <input
                                                    type="text" placeholder="DEDUCTION NAME"
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[10px] font-normal uppercase outline-none"
                                                    value={d.name}
                                                    onChange={(e) => updateDeduction(i, 'name', e.target.value)}
                                                />
                                            </div>
                                            <div className="md:col-span-4 flex items-center gap-2">
                                                <select
                                                    className="w-20 px-2 py-2.5 bg-white border border-slate-200 rounded-lg text-[9px] font-normal uppercase outline-none"
                                                    value={d.value_type}
                                                    onChange={(e) => updateDeduction(i, 'value_type', e.target.value)}
                                                >
                                                    <option value="flat">FLAT</option>
                                                    <option value="percentage">% PCT</option>
                                                </select>
                                                <input
                                                    type="number" step="0.01"
                                                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[10px] font-normal outline-none"
                                                    value={d.value_type === 'percentage' ? d.percentage : d.amount}
                                                    onChange={(e) => updateDeduction(i, d.value_type === 'percentage' ? 'percentage' : 'amount', e.target.value)}
                                                />
                                            </div>
                                            <div className="md:col-span-1 flex items-center justify-end">
                                                <button type="button" onClick={() => removeDeduction(i)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><FaTrash size={12} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fiscal Analytics Sidebar */}
                    <div className="space-y-6 sticky top-6">
                        <div className="bg-slate-900 rounded-lg p-6 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 text-white opacity-10 group-hover:scale-110 transition-transform">
                                <FaChartLine size={120} />
                            </div>
                            <h3 className="text-[10px] font-normal uppercase tracking-[0.3em] mb-6 text-white flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                Salary Summary
                            </h3>

                            <div className="space-y-6 relative z-10">
                                <div>
                                    <p className="text-[10px] font-normal text-white uppercase tracking-normal mb-1">Net Salary</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-normal text-white">{currency_symbol}</span>
                                        <h2 className="text-4xl font-normal tracking-normal">
                                            {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(estimatedNet > 0 ? estimatedNet : 0)}
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-white/10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-normal text-white uppercase tracking-normal">Gross Salary</span>
                                        <span className="text-sm font-normal text-emerald-400">+{formatCurrency(grossSalary)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-normal text-white uppercase tracking-normal">Total Deductions</span>
                                        <span className="text-sm font-normal text-rose-400">-{formatCurrency(totalDeductionsFinal)}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-6">
                                    <button
                                        type="submit"
                                        disabled={processing || !data.employee_id}
                                        className="w-full py-3.5 bg-indigo-600 text-white rounded-lg text-[10px] font-normal uppercase tracking-normal shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {processing ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <FaSave size={14} className="text-white" />
                                        )}
                                        <span>Save Salary</span>
                                    </button>
                                    <Link
                                        href={route('salary-postings.index')}
                                        className="w-full flex items-center justify-center py-3 rounded-lg border border-white/10 text-[10px] font-normal text-white uppercase tracking-normal hover:bg-white/5 transition-all"
                                    >
                                        Cancel
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Attendance Summary */}
                        {calculationSummary && (
                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <h3 className="text-[10px] font-normal text-slate-900 uppercase tracking-normal mb-6 flex items-center gap-2">
                                    <FaClock className="text-indigo-600" /> Attendance Summary
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                        <p className="text-xl font-normal text-emerald-600">{calculationSummary.present}</p>
                                        <p className="text-[8px] font-normal text-emerald-400 uppercase tracking-normal">ACTIVE</p>
                                    </div>
                                    <div className="text-center p-4 bg-rose-50 rounded-lg border border-rose-100">
                                        <p className="text-xl font-normal text-rose-600">{calculationSummary.absent}</p>
                                        <p className="text-[8px] font-normal text-rose-400 uppercase tracking-normal">VOID</p>
                                    </div>
                                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <p className="text-xl font-normal text-blue-600">{calculationSummary.leave}</p>
                                        <p className="text-[8px] font-normal text-blue-400 uppercase tracking-normal">AUTH</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-50 p-6 rounded-lg flex gap-4">
                            <FaInfoCircle className="text-indigo-600 shrink-0 mt-1" size={14} />
                            <p className="text-[9px] font-normal text-slate-500 uppercase tracking-normal leading-relaxed">
                                SAVING THIS WILL NOTIFY THE EMPLOYEE AND KEEP A RECORD.
                            </p>
                        </div>
                    </div>
                </form>
            </div>

            <ConfirmationModal
                show={confirmingAction.show}
                title={confirmingAction.title}
                message={confirmingAction.message}
                onConfirm={confirmingAction.onConfirm}
                onClose={() => setConfirmingAction(prev => ({ ...prev, show: false }))}
                type={confirmingAction.type}
                hideCancel={true}
                confirmText="ACKNOWLEDGE"
            />
        </AuthenticatedLayout>
    );
}
