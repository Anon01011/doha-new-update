import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Show({ employee, company, week_start, rosters, days }) {
    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-gray-800">Roster for {employee.name} ({company.name})</h2>}>
            <Head title="Employee Roster" />
            <div className="max-w mx-auto bg-white rounded-lg shadow p-8 mt-10">
                <h1 className="text-2xl font-normal mb-4">{employee.name} - {company.name}</h1>
                <table className="min-w-full border-separate border-spacing-y-1">
                    <thead>
                        <tr>
                            {days.map(day => (
                                <th key={day} className="px-2 py-2 text-center">{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            {days.map(day => {
                                const r = rosters[day];
                                return (
                                    <td key={day} className="px-1 py-1 text-xs min-w-[180px]">
                                        {r ? (
                                            <div>
                                                <div className="font-normal">{r.shift_time}</div>
                                                <div className="text-xs text-gray-500">{r.shift_type}</div>
                                                <div className="text-xs text-gray-500">{r.designation}</div>
                                                <div className="text-xs text-gray-400">{r.notes}</div>
                                            </div>
                                        ) : (
                                            <div className="text-gray-400 italic">No shift</div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
} 