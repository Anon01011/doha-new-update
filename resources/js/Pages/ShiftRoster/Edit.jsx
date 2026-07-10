import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function getWeekDays(startDate) {
    const days = [];
    const start = new Date(startDate + 'T00:00:00');
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push({
            date: formatDate(d),
            label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            day: d.toLocaleDateString('en-US', { weekday: 'long' })
        });
    }
    return days;
}

export default function Edit({ roster }) {
    // Assume roster is a single day's entry, so fetch all for the week/employee if needed
    // For now, just allow editing the single day's entry
    const [entry, setEntry] = useState({
        shift_time: roster.shift_time || '',
        shift_type: roster.shift_type || '',
        designation: roster.designation || '',
        notes: roster.notes || '',
    });

    const handleChange = (field, value) => {
        setEntry(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        router.put(route('shift-rosters.update', { shift_roster: roster.id }), entry);
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-gray-800">Edit Shift Roster</h2>}>
            <Head title="Edit Shift Roster" />
            <div className="max-w mx-auto p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-white rounded-lg shadow p-8">
                        <h1 className="text-2xl font-normal mb-4 text-gradient">Edit Shift Roster</h1>
                        <div className="mb-4">
                            <label className="block text-sm font-normal mb-1">Shift Time</label>
                            <input type="text" className="border rounded px-2 py-1 w-full" value={entry.shift_time} onChange={e => handleChange('shift_time', e.target.value)} />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-normal mb-1">Type</label>
                            <input type="text" className="border rounded px-2 py-1 w-full" value={entry.shift_type} onChange={e => handleChange('shift_type', e.target.value)} />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-normal mb-1">Designation</label>
                            <input type="text" className="border rounded px-2 py-1 w-full" value={entry.designation} onChange={e => handleChange('designation', e.target.value)} />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-normal mb-1">Notes</label>
                            <input type="text" className="border rounded px-2 py-1 w-full" value={entry.notes} onChange={e => handleChange('notes', e.target.value)} />
                        </div>
                        <div className="flex justify-end mt-4">
                            <button type="submit" className="bg-primary text-white px-6 py-2 rounded hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95">Update Roster</button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
} 