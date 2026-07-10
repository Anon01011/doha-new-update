import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

// Helper to get week days from a start date
function getWeekDays(startDate) {
    const days = [];
    const start = new Date(startDate);
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push({
            date: d.toISOString().slice(0, 10),
            label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        });
    }
    return days;
}

const attendanceOptions = ['', 'Present', 'Absent', 'Leave', 'Late', 'Half Day'];

export default function Edit({ companies = [], employees = [], initialCompanyId = null, initialEmployeeId = null, initialWeekStart = null, attendances = [] }) {
    const today = new Date();
    const getMonday = (d) => {
        d = new Date(d);
        const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };
    const [selectedCompany, setSelectedCompany] = useState(initialCompanyId || (companies[0]?.id ?? ''));
    const [selectedEmployee, setSelectedEmployee] = useState(initialEmployeeId || (employees[0]?.id ?? ''));
    const [weekStart, setWeekStart] = useState(initialWeekStart || getMonday(today).toISOString().slice(0, 10));
    const weekDays = getWeekDays(weekStart);

    const [confirmingAction, setConfirmingAction] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'info',
        hideCancel: false
    });

    const closeModal = () => setConfirmingAction(prev => ({ ...prev, show: false }));

    // Build a map for quick lookup
    const attendanceMap = {};
    attendances.forEach(a => {
        attendanceMap[a.date] = a;
    });

    // State for batch editing
    const [batchData, setBatchData] = useState(() => {
        const data = {};
        weekDays.forEach(day => {
            data[day.date] = attendanceMap[day.date] || {
                from_time: '',
                to_time: '',
                hours_worked: '',
                normal_hours: '',
                ot: '',
                ot_amt: '',
                attendance: '',
                reason: '',
            };
        });
        return data;
    });

    const { post, processing } = useForm();

    const handleCellChange = (date, field, value) => {
        setBatchData(prev => ({
            ...prev,
            [date]: {
                ...prev[date],
                [field]: value
            }
        }));
    };

    const handleWeekChange = (direction) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + direction * 7);
        setWeekStart(d.toISOString().slice(0, 10));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!selectedEmployee || !selectedCompany) {
            setConfirmingAction({
                show: true,
                title: 'Missing Selection',
                message: 'Please select company and employee before updating.',
                type: 'warning',
                hideCancel: true,
                onConfirm: closeModal
            });
            return;
        }

        // Convert batchData to array format for backend
        const attendances = Object.entries(batchData)
            .filter(([date, data]) => data.attendance) // Only submit days with attendance marked
            .map(([date, data]) => ({
                date,
                employee_id: selectedEmployee,
                company_id: selectedCompany,
                from_time: data.from_time || null,
                to_time: data.to_time || null,
                hours_worked: data.hours_worked || null,
                normal_hours: data.normal_hours || null,
                ot: data.ot || null,
                ot_amt: data.ot_amt || null,
                attendance: data.attendance,
                reason: data.reason || null,
            }));

        if (attendances.length === 0) {
            setConfirmingAction({
                show: true,
                title: 'No Data',
                message: 'Please mark attendance for at least one day before updating.',
                type: 'warning',
                hideCancel: true,
                onConfirm: closeModal
            });
            return;
        }

        post(route('employee-attendances.batchStore'), {
            data: { attendances },
            onSuccess: () => {
                // Redirect to index page on success
                window.location.href = route('employee-attendances.index');
            },
            onError: (errors) => {
                console.error('Batch update failed:', errors);
                setConfirmingAction({
                    show: true,
                    title: 'Update Error',
                    message: 'Failed to update attendance. Please check the form and try again.',
                    type: 'danger',
                    hideCancel: true,
                    onConfirm: closeModal
                });
            }
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-white">Edit Attendance (Week View)</h2>}>
            <Head title="Edit Attendance (Week View)" />
            <div className="bg-white rounded-lg shadow p-6 full-w mx-auto mt-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-end md:space-x-6 space-y-2 md:space-y-0 mb-4">
                        <div className="flex flex-col">
                            <label className="text-gray-700 text-sm font-normal mb-1">Select Company <span className="text-red-500">*</span></label>
                            <select className="rounded border-gray-300 px-2 py-1 text-sm" value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-gray-700 text-sm font-normal mb-1">Select Employee <span className="text-red-500">*</span></label>
                            <select className="rounded border-gray-300 px-2 py-1 text-sm" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-gray-700 text-sm font-normal mb-1">Week</label>
                            <div className="flex items-center space-x-2">
                                <button type="button" className="bg-gray-200 text-gray-700 px-2 py-1 rounded" onClick={() => handleWeekChange(-1)}>&lt;</button>
                                <span className="text-gray-700 text-sm font-normal">{weekDays[0].label} - {weekDays[6].label}</span>
                                <button type="button" className="bg-gray-200 text-gray-700 px-2 py-1 rounded" onClick={() => handleWeekChange(1)}>&gt;</button>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-y-1">
                            <thead className="bg-blue-700 text-white text-xs">
                                <tr>
                                    {weekDays.map(day => (
                                        <th key={day.date} className="px-2 py-2 text-center">{day.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    {weekDays.map(day => {
                                        const cell = batchData[day.date] || {};
                                        return (
                                            <td key={day.date} className="px-1 py-1 text-xs min-w-[180px]">
                                                <div className="flex flex-col gap-1">
                                                    <select className="border rounded px-1 py-0.5 text-xs bg-gray-50" value={cell.attendance} onChange={e => handleCellChange(day.date, 'attendance', e.target.value)}>
                                                        {attendanceOptions.map(opt => <option key={opt} value={opt}>{opt ? opt : '--'}</option>)}
                                                    </select>
                                                    <div className="flex gap-1">
                                                        <input type="time" className="border rounded px-1 py-0.5 text-xs w-20" value={cell.from_time} onChange={e => handleCellChange(day.date, 'from_time', e.target.value)} placeholder="From" />
                                                        <input type="time" className="border rounded px-1 py-0.5 text-xs w-20" value={cell.to_time} onChange={e => handleCellChange(day.date, 'to_time', e.target.value)} placeholder="To" />
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <input type="number" className="border rounded px-1 py-0.5 text-xs w-12" value={cell.hours_worked} onChange={e => handleCellChange(day.date, 'hours_worked', e.target.value)} placeholder="Hrs" />
                                                        <input type="number" className="border rounded px-1 py-0.5 text-xs w-12" value={cell.ot} onChange={e => handleCellChange(day.date, 'ot', e.target.value)} placeholder="OT" />
                                                    </div>
                                                    <input type="text" className="border rounded px-1 py-0.5 text-xs w-full" value={cell.reason} onChange={e => handleCellChange(day.date, 'reason', e.target.value)} placeholder="Reason" />
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button type="submit" className="bg-primary text-white px-6 py-2 rounded hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95">Update Attendance</button>
                    </div>
                </form>
            </div>
            <ConfirmationModal
                show={confirmingAction.show}
                title={confirmingAction.title}
                message={confirmingAction.message}
                onConfirm={confirmingAction.onConfirm}
                onClose={closeModal}
                type={confirmingAction.type}
                hideCancel={confirmingAction.hideCancel}
            />
        </AuthenticatedLayout>
    );
} 