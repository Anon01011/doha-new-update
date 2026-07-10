import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';
import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { 
    FaArrowLeft, FaPlus, FaSave, FaCheckCircle, 
    FaInfoCircle, FaChartPie, FaCogs, FaUser, FaPercentage, FaMoneyBillWave, FaCalendarAlt, FaChevronDown, FaShieldAlt, FaClock, FaEdit, FaHistory, FaUniversity
} from 'react-icons/fa';

export default function Edit({ loan, employees, loanTypes = [], userRole = 'employee' }) {
    const { appSettings } = usePage().props;
    const currency_symbol = appSettings?.currency_symbol || 'QAR';

    const [showNewTypeInput, setShowNewTypeInput] = useState(false);
    const [newLoanType, setNewLoanType] = useState('');
    const [isAddingType, setIsAddingType] = useState(false);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dateString.split('T')[0];
    };

    const { data, setData, put, processing, errors } = useForm({
        employee_id: loan.employee_id || '',
        loan_type: loan.loan_type || '',
        amount: loan.amount || '',
        interest_rate: loan.interest_rate || '',
        tenure_months: loan.tenure_months || '',
        start_date: formatDate(loan.start_date),
        purpose: loan.purpose || '',
        remarks: loan.remarks || '',
        repayment_method: loan.repayment_method || 'salary_deduction',
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
        put(route('loans.update', loan.id));
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
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Edit Loan Request</h2>}>
            <Head title="Edit Loan Request" />

            <div className="py-4 px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Executive Control Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <FaEdit size={120} />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <Link 
                            href={route('loans.index')} 
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-normal text-slate-900 tracking-normal leading-none mb-2 uppercase tracking-normal">Edit Loan</h2>
                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                Updating: {loan.loan_type?.toUpperCase()} - {loan.employee?.name?.toUpperCase()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-primary transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {processing ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaSave size={10} />}
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Primary Configuration Core */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Borrower Identity */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-8 space-y-6">
                                <h3 className="text-sm font-normal text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center"><FaUser size={14}/></div>
                                    Employee
                                </h3>
                                
                                {userRole === 'employee' ? (
                                    <div className="flex items-center gap-6 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                                        <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm overflow-hidden p-1">
                                            {loan.employee?.employee_image ? <img src={`/storage/${loan.employee?.employee_image}`} className="w-full h-full object-cover rounded-lg" /> : <div className="text-xl font-normal text-primary">{loan.employee?.name.charAt(0)}</div>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-normal text-slate-900 uppercase tracking-normal">{loan.employee?.name}</p>
                                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mt-1">{loan.employee?.employee_code} • {loan.employee?.designation || 'Operational Staff'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1">Select Employee</label>
                                        <SearchableSelect
                                            id="employee_id"
                                            name="employee_id"
                                            value={data.employee_id}
                                            onChange={(e) => setData('employee_id', e.target.value)}
                                            options={employees?.map(emp => ({ value: emp.id, label: `${emp.name.toUpperCase()} (${emp.employee_code})` })) || []}
                                            placeholder="SEARCH EMPLOYEE..."
                                        />
                                        {errors.employee_id && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 uppercase tracking-normal">{errors.employee_id}</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Financial Parameters */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 space-y-8">
                            <h3 className="text-sm font-normal text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><FaCogs size={14}/></div>
                                Loan Details
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Assistance Category */}
                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1">Loan Type</label>
                                    <div className="flex gap-3">
                                        {!showNewTypeInput ? (
                                            <>
                                                <div className="relative flex-1 group">
                                                    <select
                                                        className="w-full px-5 py-3.5 bg-slate-50/50 border-2 border-slate-100 rounded-lg focus:ring-8 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none appearance-none cursor-pointer text-[11px] font-normal uppercase tracking-normal"
                                                        value={data.loan_type} onChange={(e) => setData('loan_type', e.target.value)} required
                                                    >
                                                        <option value="">SELECT CATEGORY...</option>
                                                        {loanTypes.map((type) => <option key={type} value={type}>{type.toUpperCase()}</option>)}
                                                        {data.loan_type && !loanTypes.includes(data.loan_type) && (
                                                            <option value={data.loan_type}>{data.loan_type.toUpperCase()}</option>
                                                        )}
                                                    </select>
                                                    <FaChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
                                                </div>
                                                {userRole !== 'employee' && (
                                                    <button type="button" onClick={() => setShowNewTypeInput(true)} className="w-14 h-14 flex items-center justify-center bg-slate-50 text-primary rounded-lg border border-slate-100 hover:bg-primary hover:text-white transition-all shadow-sm">
                                                        <FaPlus size={12} />
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex-1 flex gap-3">
                                                <input
                                                    className="flex-1 px-5 py-3.5 bg-white border-2 border-primary/20 rounded-lg focus:ring-8 focus:ring-primary/5 outline-none text-[11px] font-normal uppercase tracking-normal"
                                                    value={newLoanType} onChange={(e) => setNewLoanType(e.target.value)} placeholder="ENTER CATEGORY..." autoFocus
                                                />
                                                <button type="button" onClick={handleAddNewType} className="px-6 py-3.5 bg-primary text-white rounded-lg text-[10px] font-normal uppercase tracking-normal">Commit</button>
                                                <button type="button" onClick={() => setShowNewTypeInput(false)} className="px-6 py-3.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-normal uppercase tracking-normal">Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                    {errors.loan_type && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 uppercase tracking-normal">{errors.loan_type}</p>}
                                </div>

                                {/* Capital Quantum */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1">Amount</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-normal text-slate-400">{currency_symbol}</div>
                                        <input
                                            type="number" step="0.01" value={data.amount}
                                            className="w-full pl-16 pr-5 py-3.5 bg-slate-50/50 border-2 border-slate-100 rounded-lg focus:ring-8 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none text-[11px] font-normal uppercase tracking-normal"
                                            onChange={(e) => setData('amount', e.target.value)} placeholder="0.00" required
                                        />
                                    </div>
                                    {errors.amount && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 uppercase tracking-normal">{errors.amount}</p>}
                                </div>

                                {/* Temporal Term */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1">Tenure (Months)</label>
                                    <input
                                        type="number" value={data.tenure_months}
                                        className="w-full px-5 py-3.5 bg-slate-50/50 border-2 border-slate-100 rounded-lg focus:ring-8 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none text-[11px] font-normal uppercase tracking-normal"
                                        onChange={(e) => setData('tenure_months', e.target.value)} placeholder="E.G. 12" required
                                    />
                                    {errors.tenure_months && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 uppercase tracking-normal">{errors.tenure_months}</p>}
                                </div>

                                {/* Interest & Commencement */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1">Interest Rate (%)</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-normal text-slate-400">%</div>
                                        <input
                                            type="number" step="0.01" value={data.interest_rate}
                                            className="w-full pl-12 pr-5 py-3.5 bg-slate-50/50 border-2 border-slate-100 rounded-lg focus:ring-8 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none text-[11px] font-normal uppercase tracking-normal"
                                            onChange={(e) => setData('interest_rate', e.target.value)} placeholder="0.00" required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1">Start Date</label>
                                    <input
                                        type="date" value={data.start_date}
                                        className="w-full px-5 py-3.5 bg-slate-50/50 border-2 border-slate-100 rounded-lg focus:ring-8 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none text-[11px] font-normal uppercase tracking-normal"
                                        onChange={(e) => setData('start_date', e.target.value)} required
                                    />
                                </div>

                                {/* Recoupment Protocol */}
                                <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-50">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1">Repayment Method</label>
                                    <div className="grid grid-cols-2 gap-6">
                                        <button
                                            type="button"
                                            onClick={() => setData('repayment_method', 'salary_deduction')}
                                            className={`p-6 rounded-lg border-2 flex flex-col items-start gap-3 transition-all ${data.repayment_method === 'salary_deduction' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-slate-100 bg-slate-50/50 opacity-60 hover:opacity-100'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data.repayment_method === 'salary_deduction' ? 'bg-white shadow-sm text-primary' : 'bg-slate-100 text-slate-400'}`}>
                                                <FaMoneyBillWave size={14}/>
                                            </div>
                                            <div>
                                                <span className="block text-[11px] font-normal uppercase tracking-normal text-slate-900">Payroll Division</span>
                                                <span className="block text-[8px] font-normal text-slate-400 uppercase tracking-normal mt-1">Automatic deduction cycle</span>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setData('repayment_method', 'manual')}
                                            className={`p-6 rounded-lg border-2 flex flex-col items-start gap-3 transition-all ${data.repayment_method === 'manual' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-slate-100 bg-slate-50/50 opacity-60 hover:opacity-100'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data.repayment_method === 'manual' ? 'bg-white shadow-sm text-primary' : 'bg-slate-100 text-slate-400'}`}>
                                                <FaUniversity size={14}/>
                                            </div>
                                            <div>
                                                <span className="block text-[11px] font-normal uppercase tracking-normal text-slate-900">Manual Remittance</span>
                                                <span className="block text-[8px] font-normal text-slate-400 uppercase tracking-normal mt-1">External protocol execution</span>
                                            </div>
                                        </button>
                                    </div>
                                    {errors.repayment_method && <p className="text-[10px] font-normal text-rose-500 uppercase tracking-normal">{errors.repayment_method}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Contextual Narrative */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 space-y-6">
                            <h3 className="text-sm font-normal text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center"><FaInfoCircle size={14}/></div>
                                Protocol Narrative
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1">Assistance Objective</label>
                                    <textarea
                                        rows="3" value={data.purpose} onChange={(e) => setData('purpose', e.target.value)}
                                        className="w-full p-5 bg-slate-50/50 border-2 border-slate-100 rounded-lg text-[11px] font-normal uppercase tracking-normal focus:bg-white focus:border-primary/20 focus:ring-8 focus:ring-primary/5 transition-all outline-none resize-none"
                                        placeholder="STATE THE OBJECTIVE FOR FISCAL ASSISTANCE..."
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em] ml-1">Ancillary Remarks</label>
                                    <textarea
                                        rows="3" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)}
                                        className="w-full p-5 bg-slate-50/50 border-2 border-slate-100 rounded-lg text-[11px] font-normal uppercase tracking-normal focus:bg-white focus:border-primary/20 focus:ring-8 focus:ring-primary/5 transition-all outline-none resize-none"
                                        placeholder="OPTIONAL ANCILLARY PROTOCOL NOTES..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fiscal Projection Sidebar */}
                    <div className="space-y-6 sticky top-6">
                        {/* Current Status Badge */}
                        <div className="bg-white rounded-lg border border-slate-200 p-8 flex flex-col items-center justify-center text-center shadow-sm">
                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-4">Current Status</p>
                            <span className="inline-flex items-center px-6 py-2 rounded-lg text-[10px] font-normal bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase tracking-[0.2em]">
                                {loan.status?.toUpperCase()}
                            </span>
                        </div>

                        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 text-primary opacity-20 group-hover:scale-110 transition-transform">
                                <FaChartPie size={120} />
                            </div>
                            <h3 className="text-[10px] font-normal uppercase tracking-[0.3em] mb-10 text-white flex items-center gap-2">
                                <span className="w-2 h-2 bg-primary rounded-full"></span>
                                Loan Summary
                            </h3>
                            
                            <div className="space-y-8 relative z-10">
                                <div>
                                    <p className="text-[10px] font-normal text-white uppercase tracking-normal mb-2">Monthly Installment</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-normal text-primary">{currency_symbol}</span>
                                        <h2 className="text-5xl font-normal tracking-normal">
                                            {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(calculation.monthly)}
                                        </h2>
                                    </div>
                                    <p className="text-[10px] font-normal text-white uppercase tracking-normal mt-2">Per Month</p>
                                </div>

                                <div className="space-y-4 pt-8 border-t border-white/10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-normal text-white uppercase tracking-normal">Principal Amount</span>
                                        <span className="text-sm font-normal text-slate-200">{formatCurrency(data.amount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-normal text-white uppercase tracking-normal">Total Interest</span>
                                        <span className="text-sm font-normal text-emerald-400">+{formatCurrency(calculation.totalInterest)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                        <span className="text-[10px] font-normal text-white uppercase tracking-normal">Total Repayment</span>
                                        <span className="text-lg font-normal text-primary">{formatCurrency(calculation.totalRepayment)}</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={processing}
                                    className="w-full mt-10 py-5 bg-primary text-white rounded-lg text-[11px] font-normal uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaSave size={14} />}
                                    <span>Save Changes</span>
                                </button>
                            </div>
                        </div>

                        {/* Audit Log Placeholder */}
                        <div className="bg-white rounded-lg p-8 border border-slate-200 shadow-sm">
                            <h3 className="text-[10px] font-normal text-slate-900 uppercase tracking-normal mb-6 flex items-center gap-2">
                                <FaHistory className="text-primary" /> Integrity Trail
                            </h3>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0"><FaClock size={12}/></div>
                                    <div>
                                        <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">Protocol Generation</p>
                                        <p className="text-[10px] font-normal text-slate-900 uppercase">{new Date(loan.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0"><FaHistory size={12}/></div>
                                    <div>
                                        <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">Last Amendment</p>
                                        <p className="text-[10px] font-normal text-slate-900 uppercase">{new Date(loan.updated_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 flex gap-4">
                            <FaShieldAlt className="text-primary shrink-0 mt-1" size={14} />
                            <p className="text-[9px] font-normal text-slate-500 uppercase tracking-normal leading-relaxed">
                                AMENDING CORE PROTOCOLS MAY IMPACT HISTORICAL AUDIT TRAILS AND PENDING RECOUPMENT CYCLES.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
