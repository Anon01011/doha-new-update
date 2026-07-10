import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    FaSave, FaArrowLeft, FaCheckDouble, FaSearch, FaUserClock, 
    FaCalendarCheck, FaUsers, FaShieldAlt, FaInfoCircle, FaChevronDown,
    FaClipboardCheck, FaHistory, FaCheckCircle, FaTimesCircle, FaClock
} from 'react-icons/fa';
import ConfirmationModal from '@/Components/ConfirmationModal';
import Avatar from '@/Components/Avatar';

export default function SessionAttendance({ session, attendance, assignedEmployees }) {
    const [searchTerm, setSearchTerm] = useState('');

    // Initialize form data
    const { data, setData, post, processing, wasSuccessful } = useForm({
        attendance: assignedEmployees.map(emp => {
            const existing = attendance.find(a => a.employee_id === emp.id);
            return {
                employee_id: emp.id,
                status: existing ? existing.attendance_status : 'present', // Default to present
                notes: existing ? existing.notes : '',
            };
        }),
    });

    const handleStatusChange = (employeeId, status) => {
        setData('attendance', data.attendance.map(item =>
            item.employee_id === employeeId ? { ...item, status } : item
        ));
    };

    const handleNotesChange = (employeeId, notes) => {
        setData('attendance', data.attendance.map(item =>
            item.employee_id === employeeId ? { ...item, notes } : item
        ));
    };

    const [confirmingMarkAll, setConfirmingMarkAll] = useState({
        show: false,
        status: ''
    });

    const markAll = (status) => {
        setConfirmingMarkAll({ show: true, status });
    };

    const confirmMarkAll = () => {
        const { status } = confirmingMarkAll;
        const visibleIds = filteredEmployees.map(e => e.id);

        setData('attendance', data.attendance.map(item =>
            visibleIds.includes(item.employee_id) ? { ...item, status } : item
        ));
        setConfirmingMarkAll({ show: false, status: '' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('training-sessions.attendance.store', session.id));
    };

    const filteredEmployees = assignedEmployees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (date) => {
        if (!date) return 'N/A';
        const d = new Date(date);
        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
    };

    const formatTime = (time) => {
        if (!time) return 'N/A';
        return time.substring(0, 5);
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Attendance Verification</h2>}>
            <Head title={`Attendance - ${session.training.title}`} />

            <div className="py-4 px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Executive Control Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 bg-primary h-full"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <Link 
                            href={route('trainings.show', session.training_id)} 
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-normal text-slate-900 tracking-normal leading-none mb-2 uppercase tracking-normal">Attendance Verification</h2>
                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                                Session: {session.training.title?.toUpperCase()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => markAll('present')}
                            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <FaCheckDouble size={12} />
                            Mark All Present
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-primary transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
                        >
                            {processing ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaSave size={10} />}
                            {processing ? 'Synchronizing...' : 'Commit Attendance'}
                        </button>
                    </div>
                </div>

                {/* Session Context Bar */}
                <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-primary opacity-20 group-hover:scale-110 transition-transform">
                        <FaCalendarCheck size={80} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/10 rounded-lg flex flex-col items-center justify-center border border-white/10 backdrop-blur-sm">
                                <span className="text-[10px] font-normal uppercase tracking-normal opacity-60">
                                    {new Date(session.session_date).toLocaleString('default', { month: 'short' }).toUpperCase()}
                                </span>
                                <span className="text-2xl font-normal tracking-normal">
                                    {new Date(session.session_date).getDate()}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-normal text-slate-500 uppercase tracking-normal">Protocol Segment</p>
                                <h3 className="text-xl font-normal uppercase tracking-normal">{session.training.title}</h3>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-8 text-[10px] font-normal text-slate-400 uppercase tracking-normal">
                            <div className="flex items-center gap-3">
                                <FaClock className="text-primary" size={14} />
                                <div>
                                    <p className="text-slate-500 text-[8px] mb-0.5">TEMPORAL WINDOW</p>
                                    <p className="text-slate-100">{formatTime(session.start_time)} — {formatTime(session.end_time)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <FaUsers className="text-primary" size={14} />
                                <div>
                                    <p className="text-slate-500 text-[8px] mb-0.5">PERSONNEL UNITS</p>
                                    <p className="text-slate-100">{assignedEmployees.length} ASSIGNED</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attendance Interface Grid */}
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                    {/* Interface Controls */}
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
                        <h3 className="text-sm font-normal text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center"><FaUsers size={12}/></div>
                            Personnel Ledger
                        </h3>
                        <div className="relative group w-full md:w-80">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={12} />
                            <input
                                type="text"
                                placeholder="SEARCH PERSONNEL..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-100 rounded-lg text-[10px] font-normal uppercase tracking-normal focus:border-primary/20 focus:ring-8 focus:ring-primary/5 transition-all outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-slate-50/30">
                                        <th className="px-8 py-5 text-[10px] font-normal text-slate-400 uppercase tracking-normal border-b border-slate-100">Personnel Unit</th>
                                        <th className="px-8 py-5 text-[10px] font-normal text-slate-400 uppercase tracking-normal border-b border-slate-100">Verification Status</th>
                                        <th className="px-8 py-5 text-[10px] font-normal text-slate-400 uppercase tracking-normal border-b border-slate-100">Tactical Observations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredEmployees.map((emp) => {
                                        const record = data.attendance.find(a => a.employee_id === emp.id);
                                        if (!record) return null;

                                        return (
                                            <tr key={emp.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar
                                                            src={emp.employee_image}
                                                            name={emp.name}
                                                            size="h-10 w-10"
                                                            className="rounded-lg shadow-sm border border-slate-200 group-hover:scale-110 transition-transform"
                                                        />
                                                        <div>
                                                            <span className="text-sm font-normal text-slate-900 uppercase tracking-normal block leading-none mb-1">{emp.name}</span>
                                                            <span className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">ID: {emp.employee_code || emp.id}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex bg-slate-100 p-1.5 rounded-lg w-fit border border-slate-200 shadow-inner">
                                                        {[
                                                            { id: 'present', color: 'emerald' },
                                                            { id: 'late', color: 'amber' },
                                                            { id: 'excused', color: 'blue' },
                                                            { id: 'absent', color: 'rose' }
                                                        ].map(status => (
                                                            <button
                                                                key={status.id}
                                                                type="button"
                                                                onClick={() => handleStatusChange(emp.id, status.id)}
                                                                className={`px-4 py-2 rounded-lg text-[9px] font-normal uppercase tracking-normal transition-all ${record.status === status.id
                                                                    ? `bg-white text-${status.color}-600 shadow-xl shadow-slate-200 border border-slate-100 scale-105 z-10`
                                                                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                                                    }`}
                                                            >
                                                                {status.id}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="relative group/input">
                                                        <input
                                                            type="text"
                                                            value={record.notes || ''}
                                                            onChange={(e) => handleNotesChange(emp.id, e.target.value)}
                                                            className="w-full max-w-sm px-5 py-3 bg-slate-50/50 border-2 border-slate-100 rounded-lg text-[10px] font-normal uppercase tracking-normal focus:bg-white focus:border-primary/20 transition-all outline-none"
                                                            placeholder="LOG OBSERVATION..."
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredEmployees.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="px-8 py-24 text-center">
                                                <div className="flex flex-col items-center justify-center gap-4 max-w-xs mx-auto">
                                                    <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-100">
                                                        <FaSearch size={32} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-normal text-slate-900 uppercase tracking-normal">Null Registry</h3>
                                                        <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mt-2">No personnel units found matching current search parameters.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Commit Footer */}
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center sticky bottom-0 z-10 backdrop-blur-md">
                            <div className="text-[10px] font-normal uppercase tracking-normal">
                                {wasSuccessful && <span className="text-emerald-600 flex items-center gap-2 animate-bounce"><FaCheckDouble /> Ledger Synchronized Successfully</span>}
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-12 py-4 bg-slate-900 text-white rounded-lg text-[11px] font-normal uppercase tracking-[0.3em] shadow-2xl shadow-slate-200 hover:bg-primary transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                            >
                                {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaSave size={14} />}
                                <span>Commit Attendance Ledger</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Integrity Guard */}
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex gap-4">
                    <FaShieldAlt className="text-primary shrink-0 mt-1" size={14} />
                    <p className="text-[9px] font-normal text-slate-500 uppercase tracking-normal leading-relaxed">
                        ATTENDANCE VERIFICATION DATA IMPACTS PERSONNEL CAPABILITY SCORING AND ELIGIBILITY FOR CREDENTIAL AUTHORIZATION. MODIFICATIONS ARE LOGGED IN THE AUDIT TRAIL.
                    </p>
                </div>
            </div>

            <ConfirmationModal
                show={confirmingMarkAll.show}
                title="Batch Protocol"
                message={`Confirm intent to mark all ${filteredEmployees.length} visible personnel units as "${confirmingMarkAll.status?.toUpperCase()}".`}
                onConfirm={confirmMarkAll}
                onClose={() => setConfirmingMarkAll({ show: false, status: '' })}
                type="info"
                confirmText={`BATCH: ${confirmingMarkAll.status?.toUpperCase()}`}
            />
        </AuthenticatedLayout>
    );
}
