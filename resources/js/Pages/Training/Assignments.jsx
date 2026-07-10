import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { 
    FaPlus, FaSearch, FaCheckCircle, FaSpinner, FaUserClock, 
    FaExclamationCircle, FaArrowLeft, FaShieldAlt, 
    FaHistory, FaUserGraduate, FaChevronRight, FaTimes, FaEnvelope
} from 'react-icons/fa';
import { useState } from 'react';
import Avatar from '@/Components/Avatar';

export default function Assignments({ assignments, trainingId, status }) {
    const { props } = usePage();
    const emailWarning = props.flash?.email_warning || null;
    const [showWarning, setShowWarning] = useState(!!emailWarning);
    const [searchTerm, setSearchTerm] = useState('');

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    };

    const getStatusBadge = (status) => {
        const s = status?.toLowerCase() || '';
        switch (s) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-normal bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-normal">
                        <FaCheckCircle size={9} /> Completed
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-normal bg-primary/10 text-primary border border-primary/20 uppercase tracking-normal">
                        <FaSpinner className="animate-spin" size={9} /> In Progress
                    </span>
                );
            case 'assigned':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-normal bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase tracking-normal">
                        <FaUserClock size={9} /> Assigned
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-normal bg-rose-500/10 text-rose-600 border border-rose-500/20 uppercase tracking-normal">
                        <FaExclamationCircle size={9} /> Cancelled
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-normal bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-normal">
                        {status?.toUpperCase()}
                    </span>
                );
        }
    };

    const tabs = [
        { id: '', label: 'All', icon: FaHistory },
        { id: 'assigned', label: 'Assigned', icon: FaUserClock },
        { id: 'in_progress', label: 'In Progress', icon: FaSpinner },
        { id: 'completed', label: 'Completed', icon: FaCheckCircle },
    ];

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Training Assignments</h2>}>
            <Head title="Training Assignments" />

            <div className="py-4 px-4 sm:px-6 lg:px-8 space-y-4">

                {/* Email Warning Modal */}
                {showWarning && emailWarning && (
                    <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg flex-shrink-0">
                            <FaEnvelope size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-normal text-amber-800">⚠️ Email Notification Issue</p>
                            <p className="text-xs text-amber-700 mt-1 leading-relaxed">{emailWarning}</p>
                            <a
                                href={route('settings.mail')}
                                className="inline-block mt-2 text-[10px] font-normal text-amber-700 underline uppercase tracking-normal hover:text-amber-900 transition-colors"
                            >
                                Go to Mail Settings →
                            </a>
                        </div>
                        <button
                            onClick={() => setShowWarning(false)}
                            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-100 transition-colors"
                        >
                            <FaTimes size={12} />
                        </button>
                    </div>
                )}
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 text-primary opacity-10 group-hover:scale-110 transition-transform">
                            <FaUserGraduate size={36} />
                        </div>
                        <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-1">Total Enrolled</p>
                        <h3 className="text-2xl font-normal text-slate-900 tracking-normal">{assignments?.total || 0}</h3>
                        <p className="text-[9px] font-normal text-primary uppercase tracking-normal mt-1 flex items-center gap-1">
                            <span className="w-1 h-1 bg-primary rounded-full animate-pulse"></span>
                            Active Enrollments
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 text-emerald-500 opacity-10 group-hover:scale-110 transition-transform">
                            <FaCheckCircle size={36} />
                        </div>
                        <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-1">Completion Rate</p>
                        <h3 className="text-2xl font-normal text-slate-900 tracking-normal">
                            {assignments?.total > 0 ? Math.round((assignments.data.filter(a => a.status === 'completed').length / assignments.data.length) * 100) : 0}%
                        </h3>
                        <p className="text-[9px] font-normal text-emerald-500 uppercase tracking-normal mt-1 flex items-center gap-1">
                            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                            Completion Rate
                        </p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg shadow-xl shadow-slate-200 relative overflow-hidden group md:col-span-2">
                        <div className="absolute top-0 right-0 p-4 text-primary opacity-20 group-hover:scale-110 transition-transform">
                            <FaShieldAlt size={60} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-1">Training Overview</p>
                            <h3 className="text-xl font-normal text-white tracking-normal">Assignment Tracker</h3>
                            <div className="mt-3 flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    <span className="text-[10px] font-normal text-slate-300 uppercase">Completed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <span className="text-[10px] font-normal text-slate-300 uppercase">In Progress</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                    <span className="text-[10px] font-normal text-slate-300 uppercase">Assigned</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Control Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Link 
                            href={route('trainings.index')} 
                            className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={13} />
                        </Link>
                        <div className="hidden sm:block">
                            <h2 className="text-base font-normal text-slate-900 uppercase">Training Assignments</h2>
                            <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">Enrollment & Progress</p>
                        </div>
                        <form className="relative group w-full sm:w-72 sm:ml-2">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={11} />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-normal uppercase focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </form>
                    </div>

                    <Link
                        href={route('training-assignments.create', trainingId ? { training_id: trainingId } : {})}
                        className="w-full sm:w-auto px-5 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-primary transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                    >
                        <FaPlus size={9} />
                        Add Assignment
                    </Link>
                </div>

                {/* Table Card */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                    {/* Filter Tabs */}
                    <div className="border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-1 p-2">
                        {tabs.map((tab) => (
                            <Link
                                key={tab.id || 'all'}
                                href={route('training-assignments.index', { status: tab.id, training_id: trainingId })}
                                className={`flex items-center gap-2 px-4 py-2 text-[10px] font-normal uppercase tracking-normal transition-all rounded-lg ${
                                    (status === tab.id || (!status && !tab.id))
                                        ? 'bg-white text-primary shadow-sm border border-slate-200'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                }`}
                            >
                                <tab.icon size={10} />
                                {tab.label}
                            </Link>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50/30">
                                    <th className="px-5 py-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal border-b border-slate-100">Employee</th>
                                    <th className="px-5 py-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal border-b border-slate-100">Training</th>
                                    <th className="px-5 py-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal border-b border-slate-100 text-center">Progress</th>
                                    <th className="px-5 py-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal border-b border-slate-100">Dates</th>
                                    <th className="px-5 py-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal border-b border-slate-100 text-center">Score</th>
                                    <th className="px-5 py-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal border-b border-slate-100 text-center">Status</th>
                                    <th className="px-5 py-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal border-b border-slate-100 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {assignments?.data && assignments.data.length > 0 ? (
                                    assignments.data.map((assignment) => (
                                        <tr key={assignment.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar 
                                                        name={assignment.employee?.name} 
                                                        src={assignment.employee?.profile_photo_url} 
                                                        size="h-9 w-9" 
                                                        className="rounded-lg shadow-sm border border-slate-200"
                                                    />
                                                    <div>
                                                        <span className="text-[11px] font-normal text-slate-900 uppercase block leading-none mb-0.5">{assignment.employee?.name}</span>
                                                        <span className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">{assignment.employee?.employee_code || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="max-w-[180px]">
                                                    <span className="text-[10px] font-normal text-slate-900 uppercase block leading-tight mb-1 truncate">{assignment.training?.title}</span>
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-normal uppercase tracking-normal">{assignment.training?.category || 'General'}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="w-full max-w-[120px] mx-auto space-y-1.5">
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="text-[8px] font-normal text-slate-400 uppercase">Progress</span>
                                                        <span className="text-[10px] font-normal text-primary">{assignment.progress_percentage || 0}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ${(assignment.progress_percentage || 0) === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                                                            style={{ width: `${assignment.progress_percentage || 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[8px] font-normal text-slate-400 uppercase w-12">Assigned</span>
                                                        <span className="text-[9px] font-normal text-slate-700">{formatDate(assignment.assigned_date)}</span>
                                                    </div>
                                                    {assignment.completion_date && (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[8px] font-normal text-emerald-500 uppercase w-12">Done</span>
                                                            <span className="text-[9px] font-normal text-emerald-600">{formatDate(assignment.completion_date)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                {assignment.score ? (
                                                    <span className={`text-sm font-normal ${assignment.score >= 70 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                        {assignment.score}%
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-normal text-slate-300 uppercase">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                {getStatusBadge(assignment.status)}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <Link 
                                                    href={route('trainings.show', assignment.training_id)} 
                                                    className="w-8 h-8 inline-flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5 rounded-lg transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                                                >
                                                    <FaChevronRight size={10} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3 max-w-xs mx-auto">
                                                <div className="w-14 h-14 bg-slate-50 text-slate-200 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-100">
                                                    <FaSearch size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-normal text-slate-900 uppercase tracking-normal">No Assignments</h3>
                                                    <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mt-1">No training assignments found.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-auto px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                        {assignments?.links && assignments.links.length > 3 && (
                            <div className="flex justify-center gap-1.5">
                                {assignments.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-normal uppercase tracking-normal transition-all ${link.active
                                                ? 'bg-slate-900 text-white'
                                                : 'bg-white text-slate-400 hover:text-primary hover:bg-primary/5 border border-slate-200'
                                            } ${!link.url && 'opacity-30 cursor-not-allowed pointer-events-none'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Note */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex gap-3">
                    <FaShieldAlt className="text-primary shrink-0 mt-0.5" size={13} />
                    <p className="text-[9px] font-normal text-slate-500 uppercase leading-relaxed">
                        Training assignments are saved permanently. Cancellations require admin approval.
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
