import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

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

export default function Show({ employee = {}, company = {}, weekStart = null, attendances = [] }) {
    const today = new Date();
    const getMonday = (d) => {
        d = new Date(d);
        const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };
    const weekStartDate = weekStart || getMonday(today).toISOString().slice(0, 10);
    const weekDays = getWeekDays(weekStartDate);

    // Build a map for quick lookup
    const attendanceMap = {};
    attendances.forEach(a => {
        attendanceMap[a.date] = a;
    });

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-white">Attendance Details (Week View)</h2>}>
            <Head title="Attendance Details (Week View)" />
            <div className="bg-white rounded-lg shadow p-6 full-w mx-auto mt-8">
                <div className="mb-4">
                    <div className="text-lg font-normal text-gray-800">{employee.name}</div>
                    <div className="text-sm text-gray-500">{company.name}</div>
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
                                    const cell = attendanceMap[day.date] || {};
                                    return (
                                        <td key={day.date} className="px-1 py-1 text-xs min-w-[180px]">
                                            <div className="flex flex-col gap-1">
                                                <div className="font-normal text-gray-700">{cell.attendance || '--'}</div>
                                                <div className="flex gap-1 text-xs text-gray-600">
                                                    <span>From: {cell.from_time || '--'}</span>
                                                    <span>To: {cell.to_time || '--'}</span>
                                                </div>
                                                <div className="flex gap-1 text-xs text-gray-600">
                                                    <span>Hrs: {cell.hours_worked || '--'}</span>
                                                    <span>OT: {cell.ot || '--'}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">{cell.reason || ''}</div>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 