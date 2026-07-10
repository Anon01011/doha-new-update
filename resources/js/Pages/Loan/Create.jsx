import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';
import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
    FaArrowLeft, FaPlus, FaSave, FaCheckCircle,
    FaInfoCircle, FaChartPie, FaCogs, FaUser, FaPercentage, FaMoneyBillWave, FaCalendarAlt, FaChevronDown, FaShieldAlt, FaClock, FaUniversity
} from 'react-icons/fa';

export default function Create({ employees = [], loanTypes = [], userRole = 'employee', authEmployeeId = null }) {
    const { appSettings } = usePage().props;
    const currency_symbol = appSettings?.currency_symbol || 'QAR';

    const [showNewTypeInput, setShowNewTypeInput] = useState(false);
    const [newLoanType, setNewLoanType] = useState('');
    const [isAddingType, setIsAddingType] = useState(false);

    const isEmployee = userRole === 'employee';
    const currentEmployee = useMemo(() => {
        if (!isEmployee || !authEmployeeId) return null;
        return employees.find(emp => emp.id === authEmployeeId);
    }, [employees, authEmployeeId, isEmployee]);

    const { data, setData, post, processing, errors } = useForm({
        employee_id: authEmployeeId || (employees.length > 0 ? employees[0].id : ''),
        loan_type: '',
        amount: '',
        interest_rate: isEmployee ? '0' : '',
        tenure_months: '',
        start_date: new Date().toISOString().split('T')[0],
        purpose: '',
        remarks: '',
        repayment_method: 'salary_deduction',
    });

    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: appSettings?.currency || 'QAR' 
    }).format(amount || 0);

    const calculation = useMemo(() => {
        const principal = parseFloat(data.amount) || 0;
        const rate = (parseFloat(data.interest_rate) || 0) / 100 / 12;
        const months = parseInt(data.tenure_months) || 0;

        let monthlyInstallment = 0;
        let totalRepayment = 0;

        if (principal > 0 && months > 0) {
            if (rate > 0) {
                monthlyInstallment = (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
            } else {
                monthlyInstallment = principal / months;
            }
            totalRepayment = monthlyInstallment * months;
        }

        return {
            monthly: monthlyInstallment,
            totalInterest: Math.max(0, totalRepayment - principal),
            totalRepayment: Math.max(0, totalRepayment)
        };
    }, [data.amount, data.interest_rate, data.tenure_months]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('loans.store'));
    };

    const handleAddNewType = async () => {
        if (!newLoanType.trim()) return;
        setIsAddingType(true);
        try {
            await window.axios.post(route('settings.dropdown-options.store'), {
                category: 'Loan Type', value: newLoanType, is_active: true, sort_order: 0
            });
            setData('loan_type', newLoanType);
            setNewLoanType('');
            setShowNewTypeInput(false);
            router.reload({ only: ['loanTypes'] });
        } catch (error) { console.error(error); }
        finally { setIsAddingType(false); }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">New Loan Request</h2>}>
            <Head title="Create Loan Request" />

            <div className="p-4 sm:p-6 space-y-4">
                {/* Executive Control Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <FaPlus size={120} />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <Link 
                            href={route('loans.index')} 
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-normal text-slate-900 leading-none mb-1 uppercase">Request Loan</h2>
                            <p className="text-[10px] font-normal text-slate-400 uppercase flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                                {isEmployee ? 'Employee Request' : 'Admin Request'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-normal uppercase hover:bg-primary transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {processing ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaSave size={10} />}
                            {processing ? 'Processing...' : 'Submit Request'}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    {/* Primary Configuration Core */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Borrower Identity */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 space-y-3">
                                <h3 className="text-sm font-normal text-slate-900 uppercase flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center"><FaUser size={14}/></div>
                                    Employee
                                </h3>
                                
                                {isEmployee && currentEmployee ? (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                                        <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm overflow-hidden p-1">
                                            {currentEmployee.employee_image ? <img src={`/storage/${currentEmployee.employee_image}`} className="w-full h-full object-cover rounded-lg" /> : <div className="text-xl font-normal text-primary">{currentEmployee.name.charAt(0)}</div>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-normal text-slate-900 uppercase">{currentEmployee.name}</p>
                                            <p className="text-[10px] font-normal text-slate-400 uppercase mt-1">{currentEmployee.employee_code} • {currentEmployee.designation || 'Staff'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-normal text-slate-500 uppercase ml-1">Select Employee</label>
                                        <SearchableSelect
                                            id="employee_id"
                                            name="employee_id"
                                            value={data.employee_id}
                                            onChange={(e) => setData('employee_id', e.target.value)}
                                            options={employees?.map(emp => ({ value: emp.id, label: `${emp.name.toUpperCase()} (${emp.employee_code})` })) || []}
                                            placeholder="SEARCH EMPLOYEE..."
                                        />
                                        {errors.employee_id && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 uppercase">{errors.employee_id}</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Financial Parameters */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
                            <h3 className="text-sm font-normal text-slate-900 uppercase flex items-center gap-3">
                                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><FaCogs size={14}/></div>
                                Loan Details
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase ml-1">Loan Type</label>
                                    <div className="flex gap-3">
                                        {!showNewTypeInput ? (
                                            <>
                                                <div className="relative flex-1 group">
                                                    <select
                                                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-[3px] focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none appearance-none cursor-pointer text-[11px] font-normal uppercase"
                                                        value={data.loan_type} onChange={(e) => setData('loan_type', e.target.value)} required
                                                    >
                                                        <option value="">SELECT LOAN TYPE...</option>
                                                        {loanTypes.map((type) => <option key={type} value={type}>{type.toUpperCase()}</option>)}
                                                    </select>
                                                    <FaChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
                                                </div>
                                                {!isEmployee && (
                                                    <button type="button" onClick={() => setShowNewTypeInput(true)} className="w-14 h-14 flex items-center justify-center bg-slate-50 text-primary rounded-lg border border-slate-100 hover:bg-primary hover:text-white transition-all shadow-sm">
                                                        <FaPlus size={12} />
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex-1 flex gap-3">
                                                <input
                                                    className="flex-1 px-3 py-2 bg-white border border-primary/20 rounded-[3px] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-[11px] font-normal uppercase"
                                                    value={newLoanType} onChange={(e) => setNewLoanType(e.target.value)} placeholder="ENTER LOAN TYPE..." autoFocus
                                                />
                                                <button type="button" onClick={handleAddNewType} className="px-3 py-2 bg-primary text-white rounded-lg text-[10px] font-normal uppercase">Add</button>
                                                <button type="button" onClick={() => setShowNewTypeInput(false)} className="px-3 py-2 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-normal uppercase">Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                    {errors.loan_type && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 uppercase">{errors.loan_type}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase ml-1">Amount</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-normal text-slate-400">{currency_symbol}</div>
                                        <input
                                            type="number" step="0.01" value={data.amount}
                                            className="w-full pl-10 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-[3px] focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-[11px] font-normal uppercase"
                                            onChange={(e) => setData('amount', e.target.value)} placeholder="0.00" required
                                        />
                                    </div>
                                    {errors.amount && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 uppercase">{errors.amount}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase ml-1">Tenure (Months)</label>
                                    <input
                                        type="number" value={data.tenure_months}
                                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-[3px] focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-[11px] font-normal uppercase"
                                        onChange={(e) => setData('tenure_months', e.target.value)} placeholder="e.g. 12" required
                                    />
                                    {errors.tenure_months && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 uppercase">{errors.tenure_months}</p>}
                                </div>

                                {/* Interest & Commencement */}
                                {!isEmployee && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-normal text-slate-500 uppercase ml-1">Interest Rate (%)</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-normal text-slate-400">%</div>
                                            <input
                                                type="number" step="0.01" value={data.interest_rate}
                                                className="w-full pl-10 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-[3px] focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-[11px] font-normal uppercase"
                                                onChange={(e) => setData('interest_rate', e.target.value)} placeholder="0.00" required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase ml-1">Start Date</label>
                                    <input
                                        type="date" value={data.start_date}
                                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-[3px] focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-[11px] font-normal uppercase"
                                        onChange={(e) => setData('start_date', e.target.value)} required
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-3 pt-4 border-t border-slate-50">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase ml-1">Repayment Method</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setData('repayment_method', 'salary_deduction')}
                                            className={`p-3 rounded-lg border-2 flex flex-col items-start gap-2 transition-all ${data.repayment_method === 'salary_deduction' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-slate-100 bg-slate-50/50 opacity-60 hover:opacity-100'}`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${data.repayment_method === 'salary_deduction' ? 'bg-white shadow-sm text-primary' : 'bg-slate-100 text-slate-400'}`}>
                                                <FaMoneyBillWave size={12}/>
                                            </div>
                                            <div>
                                                <span className="block text-[11px] font-normal uppercase text-slate-900">Salary Deduction</span>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setData('repayment_method', 'manual')}
                                            className={`p-3 rounded-lg border-2 flex flex-col items-start gap-2 transition-all ${data.repayment_method === 'manual' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-slate-100 bg-slate-50/50 opacity-60 hover:opacity-100'}`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${data.repayment_method === 'manual' ? 'bg-white shadow-sm text-primary' : 'bg-slate-100 text-slate-400'}`}>
                                                <FaUniversity size={12}/>
                                            </div>
                                            <div>
                                                <span className="block text-[11px] font-normal uppercase text-slate-900">Manual Payment</span>
                                            </div>
                                        </button>
                                    </div>
                                    {errors.repayment_method && <p className="text-[10px] font-normal text-rose-500 uppercase">{errors.repayment_method}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Contextual Narrative */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3">
                            <h3 className="text-sm font-normal text-slate-900 uppercase flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center"><FaInfoCircle size={14}/></div>
                                Additional Details
                            </h3>
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase ml-1">Loan Purpose</label>
                                    <textarea
                                        rows="2" value={data.purpose} onChange={(e) => setData('purpose', e.target.value)}
                                        className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-[3px] text-[11px] font-normal uppercase focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none resize-none"
                                        placeholder="STATE THE LOAN PURPOSE..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase ml-1">Remarks</label>
                                    <textarea
                                        rows="2" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)}
                                        className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-[3px] text-[11px] font-normal uppercase focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none resize-none"
                                        placeholder="OPTIONAL REMARKS..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fiscal Projection Sidebar */}
                    <div className="space-y-4 sticky top-6">
                        <div className="bg-slate-900 rounded-lg p-5 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 text-white opacity-20 group-hover:scale-110 transition-transform">
                                <FaChartPie size={80} />
                            </div>
                            <h3 className="text-[10px] font-normal uppercase mb-4 text-white flex items-center gap-2">
                                <span className="w-2 h-2 bg-white rounded-full"></span>
                                Loan Summary
                            </h3>
                            
                            <div className="space-y-4 relative z-10">
                                <div>
                                    <p className="text-[10px] font-normal text-white uppercase mb-1">Monthly Installment</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-normal text-white">{currency_symbol}</span>
                                        <h2 className="text-3xl font-normal tracking-normal">
                                            {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(calculation.monthly)}
                                        </h2>
                                    </div>
                                    <p className="text-[10px] font-normal text-white uppercase mt-1">Per Month</p>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-white/10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-normal text-white uppercase">Principal Amount</span>
                                        <span className="text-sm font-normal text-slate-200">{formatCurrency(data.amount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-normal text-white uppercase">Total Interest</span>
                                        <span className="text-sm font-normal text-emerald-400">+{formatCurrency(calculation.totalInterest)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                        <span className="text-[10px] font-normal text-white uppercase">Total Repayment</span>
                                        <span className="text-lg font-normal text-white">{formatCurrency(calculation.totalRepayment)}</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={processing}
                                    className="w-full mt-4 py-2.5 bg-primary text-white rounded-lg text-[11px] font-normal uppercase shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaSave size={12} />}
                                    <span>Submit Request</span>
                                </button>
                            </div>
                        </div>

                        {/* Integrity Guard */}
                        <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
                            <h3 className="text-[10px] font-normal text-slate-900 uppercase mb-3 flex items-center gap-2">
                                <FaShieldAlt className="text-primary" /> Loan Terms
                            </h3>
                            <div className="space-y-2">
                                {[
                                    'Repayment starts from the start date',
                                    'Automatic deduction from salary',
                                    'Subject to HR approval'
                                ].map((text, i) => (
                                    <div key={i} className="flex gap-3">
                                        <FaCheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={10} />
                                        <p className="text-[10px] font-normal text-slate-500 uppercase leading-relaxed">{text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex gap-3">
                            <FaClock className="text-primary shrink-0 mt-0.5" size={12} />
                            <p className="text-[9px] font-normal text-slate-500 uppercase leading-relaxed">
                                Your loan request will be sent for HR approval. Typical processing time is 48 hours.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
