import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    FaSearch, FaPlus, FaChalkboardTeacher, FaCalendarAlt, FaClock,
    FaArrowRight, FaGraduationCap, FaShieldAlt, FaHourglassHalf, FaMedal, FaChevronRight
} from 'react-icons/fa';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index({ trainings, status, userRole = 'employee', search: initialSearch = '', filters = {} }) {
    const [searchTerm, setSearchTerm] = useState(initialSearch || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('trainings.index'), { search: searchTerm, status, company_id: filters?.company_id }, { preserveState: true });
    };

    const formatDate = (date) => {
        if (!date) return 'TBA';
        return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getStatusStyles = (s) => {
        const val = s?.toLowerCase() || '';
        if (val === 'completed') return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed' };
        if (val === 'ongoing')   return { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  label: 'Ongoing'   };
        if (val === 'cancelled') return { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    label: 'Cancelled' };
        return                          { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   label: 'Scheduled' };
    };

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [selectedTrainingId, setSelectedTrainingId] = useState(null);
    const [processing, setProcessing] = useState(false);

    const confirmDeletion = () => {
        setProcessing(true);
        router.delete(route('trainings.destroy', selectedTrainingId), {
            onFinish: () => { setProcessing(false); setConfirmingDeletion(false); }
        });
    };

    const StatusTab = ({ label, value }) => {
        const isActive = status === value || (!status && !value);
        return (
            <Link
                href={route('trainings.index', { status: value, search: searchTerm })}
                className={`px-4 py-1.5 text-sm font-normal rounded transition-all ${isActive
                    ? 'bg-slate-900 text-white shadow'
                    : 'text-slate-500 hover:text-primary hover:bg-primary/5'
                }`}
            >
                {label}
            </Link>
        );
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Trainings</h2>}>
            <Head title="Trainings" />

            <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 text-primary opacity-5">
                            <FaGraduationCap size={40} />
                        </div>
                        <p className="text-xs font-normal text-slate-400 mb-1">Total Trainings</p>
                        <h3 className="text-2xl font-normal text-slate-900">{trainings?.total || 0}</h3>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 text-amber-500 opacity-5">
                            <FaHourglassHalf size={40} />
                        </div>
                        <p className="text-xs font-normal text-slate-400 mb-1">Active Sessions</p>
                        <h3 className="text-2xl font-normal text-slate-900">
                            {trainings?.data?.filter(t => t.status === 'ongoing').length || 0}
                        </h3>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg shadow-sm relative overflow-hidden md:col-span-2 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-normal text-slate-400 mb-1">Training Overview</p>
                            <h3 className="text-lg font-normal text-white">Competency & Skills</h3>
                        </div>
                        <FaMedal size={40} className="text-white opacity-10" />
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded overflow-x-auto no-scrollbar">
                        <StatusTab label="All" value="" />
                        <StatusTab label="Scheduled" value="scheduled" />
                        <StatusTab label="Ongoing" value="ongoing" />
                        <StatusTab label="Completed" value="completed" />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <form onSubmit={handleSearch} className="relative group flex-1 sm:flex-none">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={12} />
                            <input
                                type="text"
                                placeholder="Search trainings..."
                                className="w-full sm:w-56 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-primary transition-all outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </form>

                        {userRole !== 'employee' && (
                            <Link
                                href={route('trainings.create')}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-normal hover:brightness-110 transition-all flex items-center gap-2 whitespace-nowrap"
                            >
                                <FaPlus size={11} />
                                Add Training
                            </Link>
                        )}
                    </div>
                </div>

                {/* Training Cards */}
                {trainings?.data && trainings.data.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trainings.data.map((training) => {
                            const statusStyle = getStatusStyles(training.status);
                            return (
                                <div key={training.id} className="group bg-white rounded-lg border border-slate-200 shadow-sm hover:border-primary transition-all flex flex-col">
                                    <div className="p-4 pb-3">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-normal border border-slate-200">
                                                {training.category || 'General'}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-normal border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                                {statusStyle.label}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-normal text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                                            <Link href={route('trainings.show', training.id)}>{training.title}</Link>
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed h-8">
                                            {training.description || 'No description provided.'}
                                        </p>
                                    </div>

                                    <div className="px-4 py-2 bg-slate-50 border-t border-b border-slate-100 grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-[10px] text-slate-400 mb-0.5">Start Date</p>
                                            <div className="flex items-center gap-1.5">
                                                <FaCalendarAlt className="text-primary" size={10} />
                                                <span className="text-xs font-normal text-slate-700">{formatDate(training.start_date)}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 mb-0.5">Duration</p>
                                            <div className="flex items-center gap-1.5">
                                                <FaClock className="text-primary" size={10} />
                                                <span className="text-xs font-normal text-slate-700">{training.duration_hours || '—'} hrs</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-normal">
                                                {training.trainer_name ? training.trainer_name.charAt(0).toUpperCase() : 'T'}
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 leading-none">Trainer</p>
                                                <p className="text-xs font-normal text-slate-800 truncate max-w-[90px]">{training.trainer_name || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <Link
                                            href={route('trainings.show', training.id)}
                                            className="w-8 h-8 bg-white border border-slate-200 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg flex items-center justify-center transition-all active:scale-90"
                                        >
                                            <FaArrowRight size={11} />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-slate-200 p-20 text-center">
                        <div className="max-w-xs mx-auto space-y-4">
                            <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-lg flex items-center justify-center mx-auto border-2 border-dashed border-slate-100">
                                <FaGraduationCap size={32} />
                            </div>
                            <div>
                                <h3 className="text-base font-normal text-slate-700">No Trainings Found</h3>
                                <p className="text-sm text-slate-400 mt-1">No training records match your filters.</p>
                            </div>
                            {userRole !== 'employee' && (
                                <Link href={route('trainings.create')} className="inline-flex items-center gap-2 text-sm font-normal text-primary hover:underline pt-2">
                                    Create a training <FaChevronRight size={11} />
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {trainings?.links && trainings.links.length > 3 && (
                    <div className="flex justify-center pt-4">
                        <div className="flex gap-1.5 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                            {trainings.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-normal transition-all ${link.active
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-400 hover:text-primary hover:bg-primary/5'
                                    } ${!link.url && 'opacity-30 cursor-not-allowed pointer-events-none'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex gap-3">
                    <FaShieldAlt className="text-primary shrink-0 mt-0.5" size={14} />
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Training records are retained for compliance and audit purposes.
                    </p>
                </div>
            </div>

            <ConfirmationModal
                show={confirmingDeletion}
                title="Delete Training"
                message="Are you sure you want to delete this training? This action cannot be undone."
                onConfirm={confirmDeletion}
                onClose={() => setConfirmingDeletion(false)}
                type="danger"
                confirmText="Delete"
                processing={processing}
            />
        </AuthenticatedLayout>
    );
}
