import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import { FaMoneyBillWave, FaCalendarAlt, FaUser, FaInfoCircle, FaSave, FaArrowLeft, FaCheck, FaShieldAlt, FaClock, FaEdit, FaChevronDown, FaHistory, FaChartPie } from 'react-icons/fa';

export default function Edit({ advance, employees, userRole = 'employee' }) {
    const { appSettings } = usePage().props;
    const currency = appSettings?.currency || 'QAR';
    const currency_symbol = appSettings?.currency_symbol || 'QAR';

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dateString.split('T')[0];
    };

    const { data, setData, put, processing, errors } = useForm({
        employee_id: advance.employee_id || '',
        amount: advance.amount || '',
        request_date: formatDate(advance.request_date) || new Date().toISOString().split('T')[0],
        purpose: advance.purpose || '',
        repayment_date: formatDate(advance.repayment_date),
    });

    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: currency 
    }).format(amount || 0);

    const formatDisplayDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A';

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('advances.update', advance.id));
    };

    const currentEmployee = employees.find(emp => emp.id === parseInt(data.employee_id));

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Edit Advance</h2>}>
            <Head title="Edit Salary Advance" />

            <div className="p-4 sm:p-6 space-y-4">
                {/* Executive Control Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <FaEdit size={120} />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <Link 
                            href={route('advances.index')} 
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-normal text-slate-900 tracking-normal leading-none mb-2 uppercase">Edit Advance</h2>
                            <p className="text-[10px] font-normal text-slate-400 uppercase flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                Editing for: {advance.employee?.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-lg text-[10px] font-normal uppercase hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-primary/10"
                        >
                            {processing ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaSave size={10} />}
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    {/* Primary Configuration Core */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Borrower Identity */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 space-y-4">
                                <h3 className="text-sm font-normal text-slate-900 uppercase flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center"><FaUser size={14}/></div>
                                    Employee
                                </h3>
                                
                                {userRole === 'employee' && currentEmployee ? (
                                    <div className="flex items-center gap-6 p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                                        <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm overflow-hidden p-1">
                                            {currentEmployee.employee_image ? <img src={`/storage/${currentEmployee.employee_image}`} className="w-full h-full object-cover rounded-lg" /> : <div className="text-xl font-normal text-primary">{currentEmployee.name.charAt(0)}</div>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-normal text-slate-900 uppercase tracking-normal">{currentEmployee.name}</p>
                                            <p className="text-[10px] font-normal text-slate-400 uppercase mt-1">{currentEmployee.employee_code} • {currentEmployee.designation || 'Staff'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-normal text-slate-500 uppercase ml-1">Select Employee</label>
                                        <SearchableSelect
                                            id="employee_id"
                                            name="employee_id"
                                            value={data.employee_id}
                                            onChange={(e) => setData('employee_id', e.target.value)}
                                            options={employees?.map(emp => ({ value: emp.id, label: `${emp.name.toUpperCase()} (${emp.employee_code})` })) || []}
                                            placeholder="SEARCH..."
                                        />
                                        {errors.employee_id && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 uppercase">{errors.employee_id}</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Financial Parameters */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
                            <h3 className="text-sm font-normal text-slate-900 uppercase flex items-center gap-3">
                                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><FaMoneyBillWave size={14}/></div>
                                Advance Details
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Capital Quantum */}
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase ml-1">Amount</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-normal text-slate-400">{currency_symbol}</div>
                                        <input
                                            type="number" step="0.01" value={data.amount}
                                            className="w-full pl-10 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-[3px] focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-xl font-normal tracking-normal"
                                            onChange={(e) => setData('amount', e.target.value)} placeholder="0.00" required
                                        />
                                    </div>
                                    {errors.amount && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 uppercase">{errors.amount}</p>}
                                </div>

                                {/* Request Date */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase ml-1">Request Date</label>
                                    <div className="relative">
                                        <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={10} />
                                        <input
                                            type="date"
                                            className="w-full pl-10 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-[3px] focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-[11px] font-normal uppercase"
                                            value={data.request_date}
                                            onChange={(e) => setData('request_date', e.target.value)}
                                            required
                                        />
                                    </div>
                                    {errors.request_date && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 uppercase">{errors.request_date}</p>}
                                </div>

                                {/* Expected Repayment */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase ml-1">Expected Repayment</label>
                                    <div className="relative">
                                        <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={10} />
                                        <input
                                            type="date"
                                            className="w-full pl-10 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-[3px] focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-[11px] font-normal uppercase"
                                            value={data.repayment_date}
                                            onChange={(e) => setData('repayment_date', e.target.value)}
                                            min={data.request_date}
                                        />
                                    </div>
                                    {errors.repayment_date && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 uppercase">{errors.repayment_date}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Narrative Context */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
                            <h3 className="text-sm font-normal text-slate-900 uppercase flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center"><FaInfoCircle size={14}/></div>
                                Purpose & Details
                            </h3>
                            <div className="space-y-2">
                                <label className="text-[10px] font-normal text-slate-500 uppercase ml-1">Reason for Advance</label>
                                <textarea
                                    rows="3" value={data.purpose} onChange={(e) => setData('purpose', e.target.value)}
                                    className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-[3px] text-[11px] font-normal uppercase focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none resize-none"
                                    placeholder="STATE THE REASON FOR ADVANCE..."
                                />
                                {errors.purpose && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 uppercase">{errors.purpose}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Fiscal Synopsis Sidebar */}
                    <div className="space-y-4 sticky top-6">
                        {/* Status Badge */}
                        <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col items-center justify-center text-center shadow-sm">
                            <p className="text-[10px] font-normal text-slate-400 uppercase mb-2">Status</p>
                            <span className="inline-flex items-center px-4 py-1.5 rounded text-[9px] font-normal bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase">
                                {advance.status?.toUpperCase()}
                            </span>
                        </div>

                        <div className="bg-slate-900 rounded-lg p-5 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 text-white opacity-20 group-hover:scale-110 transition-transform">
                                <FaChartPie size={80} />
                            </div>
                            <h3 className="text-[10px] font-normal uppercase mb-6 opacity-60 flex items-center gap-2">
                                <span className="w-2 h-2 bg-white rounded-full"></span>
                                Summary
                            </h3>
                            
                            <div className="space-y-6 relative z-10">
                                <div>
                                    <p className="text-[10px] font-normal text-slate-500 uppercase mb-1">Advance Amount</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-normal text-white">{currency_symbol}</span>
                                        <h2 className="text-4xl font-normal tracking-normal">
                                            {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(data.amount || 0)}
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-white/10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-normal text-slate-500 uppercase">Request Date</span>
                                        <span className="text-[10px] font-normal text-slate-200 uppercase">{formatDisplayDate(data.request_date)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-normal text-slate-500 uppercase">Expected Repayment</span>
                                        <span className="text-[10px] font-normal text-slate-200 uppercase">{formatDisplayDate(data.repayment_date)}</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={processing}
                                    className="w-full mt-6 py-2.5 bg-primary text-white rounded-lg text-[11px] font-normal uppercase shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaSave size={12} />}
                                    <span>Save Changes</span>
                                </button>
                            </div>
                        </div>

                        {/* History Trail */}
                        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                            <h3 className="text-[10px] font-normal text-slate-900 uppercase mb-4 flex items-center gap-2">
                                <FaHistory className="text-primary" /> History
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0"><FaClock size={12}/></div>
                                    <div>
                                        <p className="text-[9px] font-normal text-slate-400 uppercase">Requested On</p>
                                        <p className="text-[10px] font-normal text-slate-900 uppercase">{new Date(advance.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0"><FaHistory size={12}/></div>
                                    <div>
                                        <p className="text-[9px] font-normal text-slate-400 uppercase">Last Edit</p>
                                        <p className="text-[10px] font-normal text-slate-900 uppercase">{new Date(advance.updated_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex gap-4">
                            <FaShieldAlt className="text-primary shrink-0 mt-1" size={14} />
                            <p className="text-[9px] font-normal text-slate-500 uppercase leading-relaxed">
                                EDITS MAY IMPACT AUDIT TRAILS AND PENDING CYCLES.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
