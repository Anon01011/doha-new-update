import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import { FaCalendarAlt, FaUser, FaClipboardList, FaArrowLeft, FaPaperPlane, FaInfoCircle, FaCalendarCheck } from 'react-icons/fa';
import SearchableSelect from '@/Components/SearchableSelect';
import { useEffect } from 'react';

export default function Create({ employees, leaveTypes, userRole = 'employee', settings }) {
    const minDate = (userRole === 'employee' && settings?.min_notice_period)
        ? new Date(new Date().getTime() + settings.min_notice_period * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : undefined;

    const { auth } = usePage().props;

    const { data, setData, post, processing, errors, transform } = useForm({
        employee_id: auth?.user?.employee_id || (userRole === 'employee' && employees.length > 0 ? employees[0].id : ''),
        employee_ids: userRole === 'employee' && auth?.user?.employee_id ? [auth.user.employee_id] : [],
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: '',
    });

    useEffect(() => {
        transform((data) => ({
            ...data,
            employee_ids: userRole === 'employee' ? [data.employee_id] : data.employee_ids
        }));
    }, [data.employee_id, data.employee_ids]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('leave-requests.store'));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">New Leave Request</h2>}>
            <Head title="Add Leave Request" />

            <div className="py-4 px-3 sm:px-4 lg:px-6 space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <FaCalendarCheck size={120} />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <Link
                            href={route('leave-requests.index')}
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-normal text-slate-900 leading-none mb-2">Add New Leave</h2>
                            <p className="text-[10px] font-normal text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></span>
                                Submit your leave request
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Form */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 md:p-8">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    {/* Employee */}
                                    {userRole !== 'employee' && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                <FaUser className="text-slate-400" /> Select Employee(s)
                                            </label>
                                            <div className="relative z-50">
                                                <SearchableSelect
                                                    id="employee_ids"
                                                    name="employee_ids"
                                                    value={data.employee_ids}
                                                    onChange={(e) => setData('employee_ids', e.target.value)}
                                                    options={employees?.map(emp => ({ value: emp.id, label: `${emp.name} (${emp.employee_code})` })) || []}
                                                    placeholder="Search for employee(s)..."
                                                    isMulti={true}
                                                />
                                            </div>
                                            {(errors.employee_ids || errors.employee_id) && (
                                                <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 flex items-center gap-1">
                                                    <FaInfoCircle size={10} /> {errors.employee_ids || errors.employee_id}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {userRole === 'employee' && <input type="hidden" name="employee_id" value={data.employee_id} />}

                                    {/* Leave Type */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                <FaClipboardList className="text-slate-400" /> Leave Type
                                            </label>
                                            <div className="relative group">
                                                <select
                                                    className={`w-full pl-5 pr-12 py-3 bg-white border ${errors.leave_type_id ? 'border-rose-200 focus:border-rose-300' : 'border-slate-200 focus:border-slate-300'} rounded-xl appearance-none focus:ring-0 transition-all outline-none cursor-pointer text-[11px] font-normal bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.25rem_center] bg-no-repeat`}
                                                    value={data.leave_type_id}
                                                    onChange={(e) => setData('leave_type_id', e.target.value)}
                                                >
                                                    <option value="">Select Leave Type...</option>
                                                    {leaveTypes?.map((type) => (
                                                        <option key={type.id} value={type.id}>{type.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {errors.leave_type_id && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 flex items-center gap-1"><FaInfoCircle size={10} /> {errors.leave_type_id}</p>}
                                        </div>

                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-4">
                                            <div className="w-9 h-9 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                                                <FaInfoCircle size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-normal text-slate-900 mb-0.5">Leave Balance</p>
                                                <p className="text-[9px] font-normal text-slate-400">System will check balance on submit</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                <FaCalendarAlt className="text-slate-400" /> Start Date
                                            </label>
                                            <input
                                                type="date"
                                                min={minDate}
                                                className={`w-full px-5 py-3 bg-white border ${errors.start_date ? 'border-rose-200 focus:border-rose-300' : 'border-slate-200 focus:border-slate-300'} rounded-xl focus:ring-0 transition-all outline-none text-[11px] font-normal`}
                                                value={data.start_date}
                                                onChange={(e) => setData('start_date', e.target.value)}
                                            />
                                            {errors.start_date && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 flex items-center gap-1"><FaInfoCircle size={10} /> {errors.start_date}</p>}
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                <FaCalendarAlt className="text-slate-400" /> End Date
                                            </label>
                                            <input
                                                type="date"
                                                min={data.start_date || minDate}
                                                className={`w-full px-5 py-3 bg-white border ${errors.end_date ? 'border-rose-200 focus:border-rose-300' : 'border-slate-200 focus:border-slate-300'} rounded-xl focus:ring-0 transition-all outline-none text-[11px] font-normal`}
                                                value={data.end_date}
                                                onChange={(e) => setData('end_date', e.target.value)}
                                            />
                                            {errors.end_date && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 flex items-center gap-1"><FaInfoCircle size={10} /> {errors.end_date}</p>}
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                            <FaClipboardList className="text-slate-400" /> Reason for Leave
                                        </label>
                                        <textarea
                                            rows="4"
                                            placeholder="Describe the reason for your leave request..."
                                            className={`w-full px-6 py-4 bg-slate-50 border ${errors.reason ? 'border-rose-200 focus:border-rose-300' : 'border-slate-200 focus:border-slate-300'} rounded-xl focus:ring-0 transition-all outline-none text-[11px] font-normal placeholder:text-slate-300 placeholder:font-normal`}
                                            value={data.reason}
                                            onChange={(e) => setData('reason', e.target.value)}
                                        ></textarea>
                                        {errors.reason && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 flex items-center gap-1"><FaInfoCircle size={10} /> {errors.reason}</p>}
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-6 flex flex-col md:flex-row items-center gap-4">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full md:flex-1 group relative overflow-hidden bg-slate-900 text-white px-10 py-4 rounded-xl text-[11px] font-normal hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <div className="relative z-10 flex items-center justify-center gap-3">
                                                {processing ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <FaPaperPlane size={12} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                )}
                                                <span>Submit Leave Request</span>
                                            </div>
                                            <div className="absolute inset-0 bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </button>
                                        <Link
                                            href={route('leave-requests.index')}
                                            className="w-full md:w-auto px-10 py-4 bg-white text-slate-500 border border-slate-200 rounded-xl text-[11px] font-normal hover:bg-slate-50 transition-all text-center"
                                        >
                                            Cancel
                                        </Link>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Guidelines */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 rounded-xl p-6 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 text-slate-700 opacity-20 group-hover:scale-110 transition-transform">
                                <FaInfoCircle size={60} />
                            </div>
                            <h3 className="text-xs font-normal mb-5 relative z-10 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                Guidelines
                            </h3>
                            <ul className="space-y-6 relative z-10">
                                <li className="flex gap-4">
                                    <div className="w-7 h-7 bg-white/10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-normal text-[10px]">01</div>
                                    <p className="text-[10px] font-normal text-white leading-relaxed">
                                        All requests require <span className="text-white font-normal">Manager Approval</span> before they are finalized.
                                    </p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-7 h-7 bg-white/10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-normal text-[10px]">02</div>
                                    <p className="text-[10px] font-normal text-white leading-relaxed">
                                        Minimum notice period of <span className="text-white font-normal">{settings?.min_notice_period || 2} days</span> is enforced by system logic.
                                    </p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-7 h-7 bg-white/10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-normal text-[10px]">03</div>
                                    <p className="text-[10px] font-normal text-white leading-relaxed">
                                        Overlapping dates will result in <span className="text-rose-400 font-normal">Automatic Rejection</span>.
                                    </p>
                                </li>
                            </ul>

                            <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10 group-hover:bg-white/10 transition-colors">
                                <p className="text-[9px] font-normal text-white mb-1.5">System Validation</p>
                                <p className="text-[10px] font-normal text-white/90 leading-relaxed">The system checks your request against the department schedule to avoid staffing issues.</p>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-[10px] font-normal text-slate-900 mb-6 flex items-center gap-2">
                                <FaCalendarCheck className="text-slate-400" /> Summary
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                    <span className="text-[10px] font-normal text-slate-400">Duration</span>
                                    <span className="text-[11px] font-normal text-slate-900">
                                        {data.start_date && data.end_date ?
                                            Math.max(1, Math.ceil((new Date(data.end_date) - new Date(data.start_date)) / (1000 * 60 * 60 * 24)) + 1) + ' Days'
                                            : 'Pending...'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-[10px] font-normal text-slate-400">Priority</span>
                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-normal border border-amber-100">Standard</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
