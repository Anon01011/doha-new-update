import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Modal from '@/Components/Modal';
import { FaUser, FaCalendarAlt, FaMoneyBillWave, FaCalculator, FaPlus, FaTrash, FaArrowLeft, FaSave, FaMinus, FaInfoCircle, FaExclamationCircle, FaBuilding, FaChevronDown, FaClock, FaChartLine } from 'react-icons/fa';

/** Reusable section header row for the salary detail modal */
function SectionHeader({ icon, iconBg, iconColor, title, subtitle }) {
    return (
        <div className="flex items-start gap-3">
            <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className={`${iconColor} text-xs`}>{icon}</span>
            </div>
            <div>
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">{title}</h4>
                {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

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
    const [calculationDetails, setCalculationDetails] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
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
                setCalculationDetails(result);
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
                                        className="w-full py-3.5 bg-white text-slate-900 rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-xl hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {processing ? (
                                            <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                                        ) : (
                                            <FaSave size={14} />
                                        )}
                                        <span>Save Salary</span>
                                    </button>
                                    <Link
                                        href={route('salary-postings.index')}
                                        className="w-full flex items-center justify-center py-3 rounded-lg border border-white/20 bg-white/10 text-[10px] font-medium text-white uppercase tracking-wider hover:bg-white/20 transition-all"
                                    >
                                        Cancel
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Attendance Summary */}
                        {calculationSummary && (
                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <h3 className="text-[10px] font-normal text-slate-900 uppercase tracking-normal mb-6 flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <FaClock className="text-indigo-600" /> Attendance Summary
                                    </span>
                                    {calculationDetails && (
                                        <button
                                            type="button"
                                            onClick={() => setShowDetailsModal(true)}
                                            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[10px] font-semibold tracking-wider hover:underline uppercase"
                                        >
                                            <FaInfoCircle /> View Details
                                        </button>
                                    )}
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                        <p className="text-xl font-normal text-emerald-600">{calculationSummary.present}</p>
                                        <p className="text-[8px] font-normal text-emerald-400 uppercase tracking-normal">ACTIVE</p>
                                    </div>
                                    <div className="text-center p-4 bg-rose-50 rounded-lg border border-rose-100">
                                        <p className="text-xl font-normal text-rose-600">{calculationSummary.absent}</p>
                                        <p className="text-[8px] font-normal text-rose-400 uppercase tracking-normal">ABSENT</p>
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

            <Modal show={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="3xl">
                <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">

                    {/* ── Header ── */}
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-6 py-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold text-indigo-300 uppercase tracking-widest mb-1">Salary Audit Report</p>
                                <h3 className="text-lg font-bold text-white">
                                    {months.find(m => m.value == data.month)?.label || data.month} {data.year}
                                </h3>
                                {calculationDetails?.employee_shift_info?.primary_shift_type && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full text-[10px] text-white font-semibold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                                            {calculationDetails.employee_shift_info.primary_shift_type} Shift
                                        </span>
                                        {calculationDetails?.employee_shift_info?.primary_shift_time && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full text-[10px] text-slate-300 font-medium">
                                                🕐 {calculationDetails.employee_shift_info.primary_shift_time}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDetailsModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Quick stats bar */}
                        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/10">
                            {[
                                { label: 'Basic', value: formatCurrency(calculationDetails?.basic_salary), color: 'text-slate-200' },
                                { label: '+ Overtime', value: `+${formatCurrency(calculationDetails?.overtime_amount)}`, color: 'text-emerald-300' },
                                { label: '- Deduction', value: `-${formatCurrency(calculationDetails?.leave_deduction)}`, color: 'text-rose-300' },
                                { label: 'Net Salary', value: formatCurrency(calculationDetails?.net_salary), color: 'text-white font-black' },
                            ].map(item => (
                                <div key={item.label} className="text-center">
                                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">{item.label}</p>
                                    <p className={`text-xs font-bold mt-0.5 ${item.color}`}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Body ── */}
                    <div className="max-h-[72vh] overflow-y-auto divide-y divide-slate-100">

                        {/* ── 1. Attendance Overview ── */}
                        <div className="px-6 py-5">
                            <SectionHeader icon={<FaClock />} iconBg="bg-indigo-100" iconColor="text-indigo-600" title="Attendance Overview" subtitle={`${calculationDetails?.calendar_days || 0} calendar days · ${calculationDetails?.working_days_in_month || 0} working days · ${calculationDetails?.weekly_off_days || 0} weekly offs · ${calculationDetails?.holiday_days || 0} holidays`} />
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
                                {[
                                    { label: 'Present', value: calculationDetails?.attendance_summary?.present || 0, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                                    { label: 'Absent', value: calculationDetails?.attendance_summary?.absent || 0, bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
                                    { label: 'Half Day', value: calculationDetails?.attendance_summary?.half_day || 0, bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
                                    { label: 'Paid Leave', value: calculationDetails?.attendance_summary?.leave_paid || 0, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                                    { label: 'Unpaid Leave', value: calculationDetails?.attendance_summary?.leave_unpaid || 0, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                                    { label: 'Weekly Off', value: calculationDetails?.attendance_summary?.weekly_off || 0, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
                                ].map(item => (
                                    <div key={item.label} className={`${item.bg} border ${item.border} rounded-xl p-2.5 text-center`}>
                                        <p className={`text-lg font-black ${item.text}`}>{item.value}</p>
                                        <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider leading-tight mt-0.5">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── 2. Leave Details ── */}
                        {(() => {
                            const leaves = calculationDetails?.leave_breakdown || [];
                            const paidCount = leaves.filter(l => l.is_paid).length;
                            const unpaidCount = leaves.filter(l => !l.is_paid).length;
                            return (
                                <div className="px-6 py-5">
                                    <SectionHeader icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} iconBg="bg-blue-100" iconColor="text-blue-600" title="Leave Details" subtitle={leaves.length === 0 ? 'No leaves taken this period' : `${leaves.length} leave day(s) · ${paidCount} paid · ${unpaidCount} unpaid`} />
                                    {leaves.length === 0 ? (
                                        <div className="mt-3 flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <span className="text-xl">🎉</span>
                                            <p className="text-xs text-slate-500">No leaves taken — full attendance bonus may apply.</p>
                                        </div>
                                    ) : (
                                        <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
                                            <div className="grid grid-cols-4 bg-slate-50 px-4 py-2 border-b border-slate-200">
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Date</span>
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Leave Type</span>
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</span>
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Reason</span>
                                            </div>
                                            {leaves.map((leave, idx) => (
                                                <div key={idx} className={`grid grid-cols-4 items-center px-4 py-2.5 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 last:border-0`}>
                                                    <span className="text-[11px] text-slate-600 font-medium">
                                                        {new Date(leave.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                    <span className="text-[11px] text-slate-700 font-semibold">{leave.type}</span>
                                                    <div className="text-center">
                                                        {leave.is_paid ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold border border-emerald-200">PAID</span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-bold border border-rose-200">UNPAID</span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 truncate">{leave.reason || '—'}</span>
                                                </div>
                                            ))}
                                            {unpaidCount > 0 && (
                                                <div className="px-4 py-2.5 bg-rose-50 border-t border-rose-100 flex justify-between items-center">
                                                    <span className="text-[10px] text-rose-600 font-semibold">{unpaidCount} unpaid day(s) deducted from salary</span>
                                                    <span className="text-xs font-bold text-rose-700">-{formatCurrency((calculationDetails?.leave_deduction || 0))}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* ── 3. Shift Roster vs Attendance ── */}
                        <div className="px-6 py-5">
                            <SectionHeader icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} iconBg="bg-violet-100" iconColor="text-violet-600" title="Shift Roster vs Attendance" subtitle="Compares rostered shifts against actual clock-in records" />
                            <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
                                <div className="grid grid-cols-4 bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Shift</span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center">Rostered Days</span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center">Days Attended</span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center">OT Rate</span>
                                </div>
                                {[
                                    { key: 'Morning', label: 'Morning', icon: '🌅', otKey: 'Day', def: '1.25', badgeBg: 'bg-amber-50', badgeText: 'text-amber-700', badgeBorder: 'border-amber-200' },
                                    { key: 'Day', label: 'Day', icon: '☀️', otKey: 'Day', def: '1.25', badgeBg: 'bg-sky-50', badgeText: 'text-sky-700', badgeBorder: 'border-sky-200' },
                                    { key: 'Evening', label: 'Evening', icon: '🌆', otKey: 'Day', def: '1.25', badgeBg: 'bg-orange-50', badgeText: 'text-orange-700', badgeBorder: 'border-orange-200' },
                                    { key: 'Night', label: 'Night', icon: '🌙', otKey: 'Night', def: '1.50', badgeBg: 'bg-indigo-50', badgeText: 'text-indigo-700', badgeBorder: 'border-indigo-200' },
                                ].map((shift, idx) => {
                                    const rostered = calculationDetails?.shift_summary?.rostered?.[shift.key] || 0;
                                    const attended = calculationDetails?.shift_summary?.attended?.[shift.key] || 0;
                                    const rawMult = calculationDetails?.overtime_breakdown?.[shift.otKey]?.multiplier;
                                    const mult = rawMult ? parseFloat(rawMult).toFixed(2) : shift.def;
                                    return (
                                        <div key={shift.key} className={`grid grid-cols-4 items-center px-4 py-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 last:border-0`}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{shift.icon}</span>
                                                <span className="text-[11px] font-semibold text-slate-700">{shift.label} Shift</span>
                                            </div>
                                            <div className="text-center">
                                                <span className={`text-[13px] font-bold ${rostered > 0 ? 'text-slate-700' : 'text-slate-300'}`}>{rostered}</span>
                                                <span className="text-[9px] text-slate-400 ml-1">days</span>
                                            </div>
                                            <div className="text-center">
                                                <span className={`text-[13px] font-bold ${attended > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>{attended}</span>
                                                <span className="text-[9px] text-slate-400 ml-1">days</span>
                                            </div>
                                            <div className="text-center">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-bold ${shift.badgeBg} ${shift.badgeText} ${shift.badgeBorder}`}>{mult}×</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-[9px] text-slate-400 mt-2 px-1">
                                Night shifts use a higher OT multiplier ({parseFloat(calculationDetails?.overtime_breakdown?.Night?.multiplier || 1.50).toFixed(2)}×) vs Day shifts ({parseFloat(calculationDetails?.overtime_breakdown?.Day?.multiplier || 1.25).toFixed(2)}×). Holiday OT uses {parseFloat(calculationDetails?.overtime_breakdown?.Holiday?.multiplier || 2.25).toFixed(2)}×.
                            </p>
                        </div>

                        {/* ── 4. Salary Formula ── */}
                        <div className="px-6 py-5">
                            <SectionHeader icon={<FaMoneyBillWave />} iconBg="bg-emerald-100" iconColor="text-emerald-600" title="Salary Calculation" subtitle={`Method: ${(calculationDetails?.salary_calculation_method || 'fixed').toUpperCase()} · ${calculationDetails?.effective_days_per_month || 30} effective days/month`} />

                            {/* Formula chain */}
                            <div className="mt-3 space-y-2">
                                {/* Basic salary */}
                                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">① Basic Salary</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Fixed monthly salary</p>
                                    </div>
                                    <span className="text-sm font-bold text-slate-800">{formatCurrency(calculationDetails?.basic_salary)}</span>
                                </div>

                                {/* Daily rate */}
                                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">② Daily Rate</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{formatCurrency(calculationDetails?.basic_salary)} ÷ {calculationDetails?.effective_days_per_month || 30} days</p>
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{formatCurrency(calculationDetails?.daily_rate)} / day</span>
                                </div>

                                {/* Absent deduction */}
                                {(calculationDetails?.absent_days || 0) > 0 && (
                                    <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                                        <div>
                                            <p className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">③ Absent Deduction</p>
                                            <p className="text-[11px] text-rose-500 mt-0.5">{calculationDetails?.absent_days || 0} absent/unpaid days × {formatCurrency(calculationDetails?.daily_rate)}</p>
                                        </div>
                                        <span className="text-sm font-bold text-rose-700">-{formatCurrency(calculationDetails?.leave_deduction)}</span>
                                    </div>
                                )}

                                {/* Allowances */}
                                {Object.keys(calculationDetails?.allowances || {}).length > 0 && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                                        <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-2">④ Allowances</p>
                                        {Object.entries(calculationDetails.allowances).map(([name, amount]) => (
                                            <div key={name} className="flex justify-between items-center py-0.5">
                                                <span className="text-[11px] text-slate-600">{name}</span>
                                                <span className="text-[11px] font-semibold text-emerald-700">+{formatCurrency(amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Struct deductions */}
                                {Object.entries(calculationDetails?.deductions || {}).filter(([k]) => !['Loan Repayment','Advance Repayment'].includes(k)).length > 0 && (
                                    <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                                        <p className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider mb-2">⑤ Deductions</p>
                                        {Object.entries(calculationDetails.deductions).filter(([k]) => !['Loan Repayment','Advance Repayment'].includes(k)).map(([name, amount]) => (
                                            <div key={name} className="flex justify-between items-center py-0.5">
                                                <span className="text-[11px] text-slate-600">{name}</span>
                                                <span className="text-[11px] font-semibold text-rose-700">-{formatCurrency(amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── 5. Overtime Breakdown ── */}
                        <div className="px-6 py-5">
                            <SectionHeader icon={<FaChartLine />} iconBg="bg-indigo-100" iconColor="text-indigo-600" title="Overtime Breakdown" subtitle={`${parseFloat(calculationDetails?.overtime_hours || 0).toFixed(2)} total OT hours · Base rate: ${formatCurrency(calculationDetails?.overtime_base_rate)}/hr`} />
                            {/* OT formula cards */}
                            <div className="grid grid-cols-3 gap-2 mt-3">
                                {[
                                    { label: 'OT Hours', value: `${parseFloat(calculationDetails?.overtime_hours || 0).toFixed(2)} hrs`, icon: '⏱️' },
                                    { label: 'Base Rate / Hr', value: formatCurrency(calculationDetails?.overtime_base_rate), icon: '💵' },
                                    { label: 'Total OT Pay', value: formatCurrency(calculationDetails?.overtime_amount), icon: '✅' },
                                ].map(item => (
                                    <div key={item.label} className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
                                        <p className="text-lg">{item.icon}</p>
                                        <p className="text-xs font-bold text-indigo-800 mt-1">{item.value}</p>
                                        <p className="text-[9px] text-indigo-500 uppercase tracking-wider mt-0.5">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                            {/* OT per shift type */}
                            <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
                                {[
                                    { key: 'Day', label: 'Day/Morning/Evening OT', icon: '☀️', color: 'text-amber-600' },
                                    { key: 'Night', label: 'Night Shift OT', icon: '🌙', color: 'text-indigo-600' },
                                    { key: 'Holiday', label: 'Holiday OT', icon: '🎉', color: 'text-rose-600' },
                                ].map((row, idx) => {
                                    const ot = calculationDetails?.overtime_breakdown?.[row.key];
                                    const hrs = parseFloat(ot?.hours || 0);
                                    if (hrs === 0) return null;
                                    const mult = parseFloat(ot?.multiplier || 0).toFixed(2);
                                    const baseRate = parseFloat(calculationDetails?.overtime_base_rate || 0);
                                    return (
                                        <div key={row.key} className={`flex items-center justify-between px-4 py-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 last:border-0`}>
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-base">{row.icon}</span>
                                                <div>
                                                    <p className="text-[11px] font-semibold text-slate-700">{row.label}</p>
                                                    <p className="text-[10px] text-slate-400">{hrs.toFixed(2)} hrs × {mult}× × {formatCurrency(baseRate)}/hr</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-[10px] font-bold ${row.color}`}>{mult}×</p>
                                                <p className="text-xs font-bold text-emerald-700">+{formatCurrency(ot.amount)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {!calculationDetails?.overtime_breakdown?.Day?.hours && !calculationDetails?.overtime_breakdown?.Night?.hours && !calculationDetails?.overtime_breakdown?.Holiday?.hours && (
                                    <div className="px-4 py-5 text-center text-[11px] text-slate-400 italic">No overtime recorded this period.</div>
                                )}
                            </div>
                        </div>

                        {/* ── 6. Final Summary ── */}
                        <div className="px-6 py-5">
                            <SectionHeader icon={<FaMoneyBillWave />} iconBg="bg-slate-800" iconColor="text-white" title="Net Salary Summary" subtitle="Final calculation breakdown" />
                            <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                {[
                                    { label: 'Basic Salary', value: formatCurrency(calculationDetails?.basic_salary), color: 'text-slate-800', sign: '' },
                                    { label: 'Allowances (total)', value: formatCurrency(Object.values(calculationDetails?.allowances || {}).reduce((a, b) => a + b, 0)), color: 'text-emerald-700', sign: '+' },
                                    { label: 'Overtime Pay', value: formatCurrency(calculationDetails?.overtime_amount), color: 'text-emerald-700', sign: '+' },
                                    { label: 'Absent/Unpaid Deduction', value: formatCurrency(calculationDetails?.leave_deduction), color: 'text-rose-600', sign: '-' },
                                    { label: 'Other Deductions', value: formatCurrency(Object.values(calculationDetails?.deductions || {}).reduce((a, b) => a + b, 0)), color: 'text-rose-600', sign: '-' },
                                ].map((row, idx) => (
                                    <div key={idx} className={`flex justify-between items-center px-4 py-2.5 ${idx < 4 ? 'border-b border-slate-200' : ''}`}>
                                        <span className="text-[11px] text-slate-600">{row.label}</span>
                                        <span className={`text-[11px] font-bold ${row.color}`}>{row.sign}{row.value}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center px-4 py-3 bg-slate-800">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">🟢 Net Salary</span>
                                    <span className="text-base font-black text-emerald-400">{formatCurrency(calculationDetails?.net_salary)}</span>
                                </div>
                            </div>
                            {/* Total hours */}
                            <div className="mt-3 flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Total Hours Worked</p>
                                    <p className="text-[10px] text-indigo-400 mt-0.5">Sum of all clock-in/out punches</p>
                                </div>
                                <p className="text-xl font-black text-indigo-700">{parseFloat(calculationDetails?.total_hours_worked || 0).toFixed(2)}<span className="text-xs font-semibold ml-1">hrs</span></p>
                            </div>
                        </div>

                    </div>

                    {/* ── Footer ── */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setShowDetailsModal(false)}
                            className="px-6 py-2 bg-slate-900 hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
