import SettingsLayout from './SettingsLayout';
import { useForm, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { FiCreditCard, FiLayers, FiSun, FiMoon, FiGlobe, FiMapPin, FiBriefcase } from 'react-icons/fi';

export default function PayrollSettings({ settings, companies = [], departments = [], selected_company_id = null, selected_department_id = null }) {
    const { appSettings } = usePage().props;
    const currency_symbol = appSettings?.currency_symbol || '$';

    const [scopeType, setScopeType] = useState(
        selected_department_id ? 'department' : (selected_company_id ? 'company' : 'global')
    );
    const [selectedCompany, setSelectedCompany] = useState(selected_company_id || (companies[0]?.id || ''));
    const [selectedDepartment, setSelectedDepartment] = useState(selected_department_id || (departments[0]?.id || ''));

    const { data, setData, post, processing, errors } = useForm({
        scope_type: scopeType,
        company_id: selectedCompany,
        department_id: selectedDepartment,
        pay_period: settings.pay_period || 'monthly',
        salary_calculation_method: settings.salary_calculation_method || 'attendance',
        overtime_calculation_mode: settings.overtime_calculation_mode || 'base_salary',
        overtime_rate_multiplier: settings.overtime_rate_multiplier || 1.5,
        overtime_morning_multiplier: settings.overtime_morning_multiplier || settings.overtime_day_multiplier || 1.25,
        overtime_day_multiplier: settings.overtime_day_multiplier || 1.25,
        overtime_evening_multiplier: settings.overtime_evening_multiplier || settings.overtime_day_multiplier || 1.25,
        overtime_night_multiplier: settings.overtime_night_multiplier || 1.50,
        overtime_holiday_multiplier: settings.overtime_holiday_multiplier || 2.25,
        default_working_hours_per_day: settings.default_working_hours_per_day || 8,
        default_working_days_per_month: settings.default_working_days_per_month || 26,
        payroll_overtime_rate: settings.payroll_overtime_rate || '',
        loan_deduction_priority: settings.loan_deduction_priority || 1,
        advance_deduction_priority: settings.advance_deduction_priority || 2,
        tax_calculation_method: settings.tax_calculation_method || 'percentage',
        tax_percentage: settings.tax_percentage || 0,
        provident_fund_percentage: settings.provident_fund_percentage || 0,
        salary_slip_template: settings.salary_slip_template || '',
        salary_slip_stamp: null,
        salary_slip_show_photo: settings.salary_slip_show_photo === '0' ? false : true,
        salary_slip_show_charts: settings.salary_slip_show_charts === '0' ? false : true,
        payment_methods: settings.payment_methods || 'Bank Transfer,Cash,Cheque,WPS',
        default_payment_method: settings.default_payment_method || 'Bank Transfer',
    });

    useEffect(() => {
        setData(d => ({
            ...d,
            scope_type: scopeType,
            company_id: scopeType !== 'global' ? selectedCompany : null,
            department_id: scopeType === 'department' ? selectedDepartment : null,
        }));
    }, [scopeType, selectedCompany, selectedDepartment]);

    const handleScopeChange = (newScope) => {
        setScopeType(newScope);
        let params = {};
        if (newScope === 'company') {
            params.company_id = selectedCompany;
        } else if (newScope === 'department') {
            params.company_id = selectedCompany;
            params.department_id = selectedDepartment;
        }
        router.get(route('settings.payroll'), params, { preserveState: false });
    };

    const handleCompanySelect = (cId) => {
        setSelectedCompany(cId);
        let params = {};
        if (scopeType === 'company') {
            params.company_id = cId;
        } else if (scopeType === 'department') {
            params.company_id = cId;
            params.department_id = selectedDepartment;
        }
        router.get(route('settings.payroll'), params, { preserveState: false });
    };

    const handleDepartmentSelect = (dId) => {
        setSelectedDepartment(dId);
        if (scopeType === 'department') {
            router.get(route('settings.payroll'), { company_id: selectedCompany, department_id: dId }, { preserveState: false });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.payroll.update'));
    };

    return (
        <SettingsLayout
            activeTab="payroll"
            title="Payroll & Overtime Configuration"
            description="Configure pay periods, shift-based overtime multipliers, and branch/department level rules."
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Scope Selection Card */}
                <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40 bg-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-200">
                                <FiLayers className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Payroll Setting Scope</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Apply rules globally across all company branches or customize specifically for a Branch or Department.
                                </p>
                            </div>
                        </div>

                        {/* Scope Pills */}
                        <div className="inline-flex rounded-lg bg-gray-100 p-1 border border-gray-200 text-xs">
                            <button
                                type="button"
                                onClick={() => handleScopeChange('global')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                                    scopeType === 'global'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                                }`}
                            >
                                <FiGlobe size={13} /> Global System
                            </button>

                            {companies.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => handleScopeChange('company')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                                        scopeType === 'company'
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                                    }`}
                                >
                                    <FiMapPin size={13} /> Branch Specific
                                </button>
                            )}

                            {departments.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => handleScopeChange('department')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                                        scopeType === 'department'
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                                    }`}
                                >
                                    <FiBriefcase size={13} /> Department Specific
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Dropdowns for Branch & Department */}
                    {scopeType !== 'global' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                            {(scopeType === 'company' || scopeType === 'department') && (
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Select Branch</label>
                                    <select
                                        value={selectedCompany}
                                        onChange={(e) => handleCompanySelect(e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-normal text-gray-900"
                                    >
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {scopeType === 'department' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Select Department</label>
                                    <select
                                        value={selectedDepartment}
                                        onChange={(e) => handleDepartmentSelect(e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-normal text-gray-900"
                                    >
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    {/* Main Form */}
                    <div className="xl:col-span-2 space-y-5">
                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Salary & Cycles</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Pay Period</label>
                                    <select
                                        value={data.pay_period}
                                        onChange={(e) => setData('pay_period', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-normal"
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="bi-weekly">Bi-Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Calculation Basis</label>
                                    <select
                                        value={data.salary_calculation_method}
                                        onChange={(e) => setData('salary_calculation_method', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-normal"
                                    >
                                        <option value="attendance">Attendance Based</option>
                                        <option value="fixed">Fixed</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Working Hours/Day</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.default_working_hours_per_day}
                                        onChange={(e) => setData('default_working_hours_per_day', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-normal"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Working Days/Month</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.default_working_days_per_month}
                                        onChange={(e) => setData('default_working_days_per_month', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-normal"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-primary text-white rounded-lg shadow-lg shadow-blue-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Taxes & Deductions</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Tax Method</label>
                                    <select
                                        value={data.tax_calculation_method}
                                        onChange={(e) => setData('tax_calculation_method', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                    >
                                        <option value="percentage">Percentage</option>
                                        <option value="slab">Slab</option>
                                    </select>
                                </div>

                                {data.tax_calculation_method === 'percentage' && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-normal text-gray-700 ml-1">Tax Percentage (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="100"
                                            value={data.tax_percentage || ''}
                                            onChange={(e) => setData('tax_percentage', e.target.value)}
                                            className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                        />
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">PF Percentage (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        value={data.provident_fund_percentage}
                                        onChange={(e) => setData('provident_fund_percentage', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Loan Priority</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.loan_deduction_priority}
                                        onChange={(e) => setData('loan_deduction_priority', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Advance Priority</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.advance_deduction_priority}
                                        onChange={(e) => setData('advance_deduction_priority', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Salary Slip Formatting */}
                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-purple-600 text-white rounded-lg shadow-lg shadow-purple-200">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Salary Slip Formatting</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Acknowledgement Template</label>
                                    <textarea
                                        value={data.salary_slip_template}
                                        onChange={(e) => setData('salary_slip_template', e.target.value)}
                                        rows="4"
                                        placeholder="e.g. I hereby acknowledge and confirm that I have received..."
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-normal"
                                    ></textarea>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Company Stamp (Optional)</label>
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg"
                                        onChange={(e) => setData('salary_slip_stamp', e.target.files[0])}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-normal file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                    />
                                    {settings.salary_slip_stamp && (
                                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            Current stamp is uploaded. Uploading a new one will replace it.
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 border-t border-gray-100 pt-4 mt-4">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="salary_slip_show_photo"
                                            checked={data.salary_slip_show_photo}
                                            onChange={(e) => setData('salary_slip_show_photo', e.target.checked)}
                                            className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                        />
                                        <label htmlFor="salary_slip_show_photo" className="text-sm font-normal text-gray-700">
                                            Show Employee Photo on Salary Slip
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="salary_slip_show_charts"
                                            checked={data.salary_slip_show_charts}
                                            onChange={(e) => setData('salary_slip_show_charts', e.target.checked)}
                                            className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                        />
                                        <label htmlFor="salary_slip_show_charts" className="text-sm font-normal text-gray-700">
                                            Show Analytics Charts on Salary Slip
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-amber-600 text-white rounded-lg shadow-lg shadow-amber-200">
                                    <FiCreditCard className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal">Payment Methods</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Available Payment Methods (Comma Separated)</label>
                                    <input
                                        type="text"
                                        value={data.payment_methods}
                                        onChange={(e) => setData('payment_methods', e.target.value)}
                                        placeholder="e.g. Bank Transfer, Cash, WPS"
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-normal"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">These options will appear in Employee registration.</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">Default Method for Slip</label>
                                    <select
                                        value={data.default_payment_method}
                                        onChange={(e) => setData('default_payment_method', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-normal"
                                    >
                                        {data.payment_methods.split(',').map(m => (
                                            <option key={m.trim()} value={m.trim()}>{m.trim()}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Shift-Based Overtime Multipliers */}
                    <div className="space-y-5">
                        <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                            <h4 className="text-sm font-semibold text-gray-900 tracking-normal mb-1">Shift-Based Overtime Settings</h4>
                            <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">
                                Overtime multipliers apply automatically according to employee roster & attendance shift type.
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-normal text-gray-400 uppercase tracking-normal ml-1">Calculation Mode</label>
                                    <div className="space-y-2 mt-1">
                                        <label className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                            data.overtime_calculation_mode === 'base_salary'
                                                ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-normal'
                                                : 'border-gray-200 hover:bg-gray-50 text-gray-700 font-normal'
                                        }`}>
                                            <span className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="overtime_calculation_mode"
                                                    value="base_salary"
                                                    checked={data.overtime_calculation_mode === 'base_salary'}
                                                    onChange={(e) => setData('overtime_calculation_mode', e.target.value)}
                                                    className="text-emerald-600 focus:ring-emerald-500"
                                                />
                                                Base Salary Rate (Hourly)
                                            </span>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-normal">Auto</span>
                                        </label>

                                        <label className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                            data.overtime_calculation_mode === 'fixed'
                                                ? 'border-purple-500 bg-purple-50/40 text-purple-900 font-normal'
                                                : 'border-gray-200 hover:bg-gray-50 text-gray-700 font-normal'
                                        }`}>
                                            <span className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="overtime_calculation_mode"
                                                    value="fixed"
                                                    checked={data.overtime_calculation_mode === 'fixed'}
                                                    onChange={(e) => setData('overtime_calculation_mode', e.target.value)}
                                                    className="text-purple-600 focus:ring-purple-500"
                                                />
                                                Fixed Hourly Rate
                                            </span>
                                        </label>

                                        <label className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                            data.overtime_calculation_mode === 'none'
                                                ? 'border-rose-500 bg-rose-50/40 text-rose-900 font-normal'
                                                : 'border-gray-200 hover:bg-gray-50 text-gray-700 font-normal'
                                        }`}>
                                            <span className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="overtime_calculation_mode"
                                                    value="none"
                                                    checked={data.overtime_calculation_mode === 'none'}
                                                    onChange={(e) => setData('overtime_calculation_mode', e.target.value)}
                                                    className="text-rose-600 focus:ring-rose-500"
                                                />
                                                No Overtime (Do not pay OT)
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Shift Multipliers Inputs */}
                                <div className="space-y-3 pt-3 border-t border-gray-100">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-amber-700 uppercase tracking-normal ml-1 flex items-center gap-1">
                                            <FiSun size={11} className="text-amber-500" /> Morning Shift Multiplier
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.05"
                                                min="0"
                                                disabled={data.overtime_calculation_mode === 'none' || data.overtime_calculation_mode === 'fixed'}
                                                value={data.overtime_morning_multiplier}
                                                onChange={(e) => setData('overtime_morning_multiplier', e.target.value)}
                                                className={`w-full rounded-lg border-gray-200 px-3 py-2 transition-all font-normal text-sm ${
                                                    data.overtime_calculation_mode === 'none' || data.overtime_calculation_mode === 'fixed'
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 opacity-60'
                                                        : 'bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500'
                                                }`}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-normal text-xs">x</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-sky-700 uppercase tracking-normal ml-1 flex items-center gap-1">
                                            <FiSun size={11} className="text-sky-500" /> Day Shift Multiplier
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.05"
                                                min="0"
                                                disabled={data.overtime_calculation_mode === 'none' || data.overtime_calculation_mode === 'fixed'}
                                                value={data.overtime_day_multiplier}
                                                onChange={(e) => setData('overtime_day_multiplier', e.target.value)}
                                                className={`w-full rounded-lg border-gray-200 px-3 py-2 transition-all font-normal text-sm ${
                                                    data.overtime_calculation_mode === 'none' || data.overtime_calculation_mode === 'fixed'
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 opacity-60'
                                                        : 'bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500'
                                                }`}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-normal text-xs">x</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-orange-700 uppercase tracking-normal ml-1 flex items-center gap-1">
                                            <FiSun size={11} className="text-orange-500" /> Evening Shift Multiplier
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.05"
                                                min="0"
                                                disabled={data.overtime_calculation_mode === 'none' || data.overtime_calculation_mode === 'fixed'}
                                                value={data.overtime_evening_multiplier}
                                                onChange={(e) => setData('overtime_evening_multiplier', e.target.value)}
                                                className={`w-full rounded-lg border-gray-200 px-3 py-2 transition-all font-normal text-sm ${
                                                    data.overtime_calculation_mode === 'none' || data.overtime_calculation_mode === 'fixed'
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 opacity-60'
                                                        : 'bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500'
                                                }`}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-normal text-xs">x</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-indigo-700 uppercase tracking-normal ml-1 flex items-center gap-1">
                                            <FiMoon size={11} className="text-indigo-500" /> Night Shift Multiplier
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.05"
                                                min="0"
                                                disabled={data.overtime_calculation_mode === 'none' || data.overtime_calculation_mode === 'fixed'}
                                                value={data.overtime_night_multiplier}
                                                onChange={(e) => setData('overtime_night_multiplier', e.target.value)}
                                                className={`w-full rounded-lg border-gray-200 px-3 py-2 transition-all font-normal text-sm ${
                                                    data.overtime_calculation_mode === 'none' || data.overtime_calculation_mode === 'fixed'
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 opacity-60'
                                                        : 'bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500'
                                                }`}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-normal text-xs">x</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-rose-700 uppercase tracking-normal ml-1 flex items-center gap-1">
                                            <FiCreditCard size={11} className="text-rose-500" /> Holiday Overtime Multiplier
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.05"
                                                min="0"
                                                disabled={data.overtime_calculation_mode === 'none' || data.overtime_calculation_mode === 'fixed'}
                                                value={data.overtime_holiday_multiplier}
                                                onChange={(e) => setData('overtime_holiday_multiplier', e.target.value)}
                                                className={`w-full rounded-lg border-gray-200 px-3 py-2 transition-all font-normal text-sm ${
                                                    data.overtime_calculation_mode === 'none' || data.overtime_calculation_mode === 'fixed'
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 opacity-60'
                                                        : 'bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500'
                                                }`}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-normal text-xs">x</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1 pt-3 border-t border-gray-100">
                                    <label className="text-[10px] font-normal text-gray-400 uppercase tracking-normal ml-1">Fixed OT Rate (Hourly)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <span className="text-gray-400 font-normal text-xs">{currency_symbol}</span>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            disabled={data.overtime_calculation_mode !== 'fixed'}
                                            value={data.payroll_overtime_rate || ''}
                                            onChange={(e) => setData('payroll_overtime_rate', e.target.value)}
                                            className={`w-full rounded-lg border-gray-200 pl-8 pr-3 py-2 transition-all font-normal text-sm ${
                                                data.overtime_calculation_mode !== 'fixed'
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 opacity-60'
                                                    : 'bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500'
                                            }`}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-normal px-1 leading-relaxed">
                                        {data.overtime_calculation_mode === 'base_salary' 
                                            ? 'Disabled: Base Salary Hourly rate active.'
                                            : data.overtime_calculation_mode === 'none'
                                            ? 'Disabled: Overtime payment is disabled.'
                                            : 'Set a fixed hourly rate instead of multiplier.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-lg p-5 text-white shadow-xl shadow-emerald-200 relative overflow-hidden">
                            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                            <h4 className="text-sm font-normal tracking-normal mb-2 relative z-10">Payroll Tip</h4>
                            <p className="text-xs text-emerald-50 leading-relaxed font-normal relative z-10">
                                Attendance & roster based calculation ensures accuracy by applying exact shift multipliers (Morning, Day, Evening, Night, Holiday).
                            </p>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-normal rounded-lg transition-all shadow-lg shadow-emerald-900/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                            >
                                {processing ? 'Saving Settings...' : `Save ${scopeType.charAt(0).toUpperCase() + scopeType.slice(1)} Settings`}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </SettingsLayout>
    );
}

