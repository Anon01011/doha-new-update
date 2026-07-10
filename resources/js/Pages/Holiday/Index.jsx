import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaInfoCircle, FaClock } from 'react-icons/fa';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index({ holidays, companies, filters, auth }) {
    const userRole = auth.user.role;
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [selectedHoliday, setSelectedHoliday] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleDelete = (holiday) => {
        setSelectedHoliday(holiday);
        setConfirmingDeletion(true);
    };

    const confirmDeletion = () => {
        setProcessing(true);
        router.delete(route('holidays.destroy', selectedHoliday.id), {
            onFinish: () => {
                setProcessing(false);
                setConfirmingDeletion(false);
            }
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return {
            day: date.getDate(),
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
            full: date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            })
        };
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Holiday List</h2>}>
            <Head title="Holiday Management" />

            <div className="py-4 px-3 sm:px-4 lg:px-6 space-y-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center shadow-inner">
                            <FaCalendarAlt size={16} />
                        </div>
                        <div>
                            <h2 className="text-xl font-normal text-slate-900 leading-none mb-2">Holiday List</h2>
                             <p className="text-[10px] font-normal text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></span>
                                Official Holidays
                            </p>
                        </div>
                    </div>

                    {['admin', 'hr', 'manager'].includes(userRole) && (
                        <Link
                            href={route('holidays.create')}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-normal hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95"
                        >
                            <FaPlus size={10} />
                            Add Holiday
                        </Link>
                    )}
                </div>

                {/* Holidays */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50/30">
                                     <th className="px-5 py-3 text-left text-[10px] font-normal text-slate-400 border-b border-slate-100">Holiday Name</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-normal text-slate-400 border-b border-slate-100">Date</th>
                                    <th className="px-5 py-3 text-center text-[10px] font-normal text-slate-400 border-b border-slate-100">Type</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-normal text-slate-400 border-b border-slate-100">Description</th>
                                     {['admin', 'hr', 'manager'].includes(userRole) && (
                                        <th className="px-5 py-3 text-right text-[10px] font-normal text-slate-400 border-b border-slate-100">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {holidays?.data && holidays.data.length > 0 ? (
                                    holidays.data.map((holiday) => {
                                        const startDt = formatDate(holiday.start_date);
                                        const endDt = formatDate(holiday.end_date);
                                        const isSameDay = holiday.start_date === holiday.end_date;

                                        return (
                                            <tr key={holiday.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col items-center justify-center w-10 h-10 bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden shrink-0 group-hover:scale-105 transition-transform relative">
                                                            <div className="bg-slate-700 w-full text-center py-0.5">
                                                                <span className="text-[7px] font-normal text-white">{startDt.month}</span>
                                                            </div>
                                                            <div className="flex-1 flex items-center justify-center">
                                                                <span className="text-xs font-normal text-white leading-none">{startDt.day}</span>
                                                            </div>
                                                            {!isSameDay && (
                                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm" title={`Ends ${endDt.full}`}>
                                                                    <FaCalendarAlt className="text-white text-[6px]" />
                                                                </div>
                                                            )}
                                                        </div>
                                                         <div>
                                                            <span className="text-[13px] font-normal text-slate-900 block">{holiday.name}</span>
                                                            <p className="text-[8px] font-normal text-slate-400 mt-0.5">
                                                                {isSameDay ? startDt.weekday : `${startDt.weekday} - ${endDt.weekday}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                 <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <FaClock size={9} className="text-slate-400" />
                                                        <span className="text-[10px] font-normal text-slate-500">
                                                            {isSameDay ? startDt.full : `${startDt.full} to ${endDt.full}`}
                                                        </span>
                                                    </div>
                                                </td>
                                                 <td className="px-5 py-3 text-center">
                                                    {holiday.is_recurring ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-normal border border-slate-100">
                                                             Recurring
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-normal border border-slate-100">
                                                            One-time
                                                        </span>
                                                    )}
                                                </td>
                                                 <td className="px-5 py-3">
                                                    <p className="text-[10px] font-normal text-slate-400 max-w-[200px] truncate leading-relaxed italic">
                                                        {holiday.description || "No description provided."}
                                                    </p>
                                                </td>
                                                 {['admin', 'hr', 'manager'].includes(userRole) && (
                                                    <td className="px-5 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Link
                                                                href={route('holidays.edit', holiday.id)}
                                                                className="p-1.5 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
                                                            >
                                                                <FaEdit size={11} />
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(holiday)}
                                                                className="p-1.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                                                            >
                                                                <FaTrash size={11} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                                                    <FaCalendarAlt size={28} />
                                                </div>
                                                 <h3 className="text-sm font-normal text-slate-400">No Holidays Found</h3>
                                                <p className="text-[10px] font-normal text-slate-300 mt-2 max-w-[200px] leading-relaxed">
                                                    There are currently no holidays added to the calendar.
                                                </p>
                                                {['admin', 'hr', 'manager'].includes(userRole) && (
                                                    <Link
                                                        href={route('holidays.create')}
                                                        className="mt-8 flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-normal hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95"
                                                    >
                                                        <FaPlus size={10} />
                                                         Add Holiday
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    {holidays?.data && holidays.data.length > 0 && (
                         <div className="bg-slate-50/30 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-[10px] font-normal text-slate-400">
                                Total Holidays: <span className="text-slate-900">{holidays.data.length}</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></span>
                                <span className="text-[9px] font-normal text-slate-400">System Synchronized</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                show={confirmingDeletion}
                onClose={() => setConfirmingDeletion(false)}
                onConfirm={confirmDeletion}
                title="Delete Holiday"
                message={`Confirm you want to delete the "${selectedHoliday?.name}" holiday?`}
                confirmText="Delete Holiday"
                type="danger"
                processing={processing}
            />
        </AuthenticatedLayout>
    );
}
