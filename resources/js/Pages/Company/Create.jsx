import React from 'react';
import { useForm, Link, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    BuildingOfficeIcon, 
    ArrowLeftIcon, 
    PlusCircleIcon, 
    MapPinIcon, 
    PhoneIcon, 
    EnvelopeIcon, 
    GlobeAltIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        weekly_off_days: [],
    });

    const DAYS_OF_WEEK = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];

    const handleWeeklyOffToggle = (day) => {
        const current = [...(data.weekly_off_days || [])];
        if (current.includes(day)) {
            setData('weekly_off_days', current.filter(d => d !== day));
        } else {
            setData('weekly_off_days', [...current, day]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('companies.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-normal text-slate-900 tracking-normal leading-none">Add New Branch</h2>
                    <p className="text-[10px] text-slate-400 font-normal uppercase tracking-normal mt-1.5">Set up your new company branch</p>
                </div>
            }
        >
            <Head title="Add Branch" />

            <div className="max-w-[1600px] mx-auto py-4 px-4 sm:px-6 lg:px-5 space-y-4">
                {/* Action Bar */}
                <div className="flex items-center gap-3">
                    <Link
                        href={route('companies.index')}
                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm active:scale-95 group"
                    >
                        <ArrowLeftIcon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                    </Link>
                    <div>
                        <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal leading-none mb-1">Navigation</p>
                        <h1 className="text-sm font-normal text-slate-900 uppercase tracking-normal">Back to Branches</h1>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
                        <div className="px-8 py-6 bg-slate-50/30 border-b border-slate-100 flex items-center gap-5">
                            <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                                <PlusCircleIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-normal text-slate-900 tracking-normal leading-none uppercase">Branch Information</h3>
                                <p className="text-[10px] text-slate-400 font-normal uppercase tracking-normal mt-1.5">Enter the details for the new branch</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                {/* Identity Block */}
                                <div className="md:col-span-12 space-y-6">
                                    <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                                        <div className="w-1 h-3 bg-primary rounded-full"></div>
                                        <h4 className="text-[10px] font-normal text-slate-900 uppercase tracking-widest">Branch Details</h4>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-2.5">
                                            Official Branch Name <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <BuildingOfficeIcon className="w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                className={`w-full pl-11 pr-4 py-3 bg-slate-50/50 border-slate-200 rounded-lg text-xs font-normal text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all ${errors.name ? 'border-rose-300 ring-rose-50' : ''}`}
                                                value={data.name}
                                                onChange={e => setData('name', e.target.value)}
                                                required
                                                placeholder="e.g. Earth Doha North Wing"
                                                autoFocus
                                            />
                                        </div>
                                        {errors.name && <p className="text-rose-500 text-[10px] mt-2 font-normal uppercase tracking-normal">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-2.5">Operational Location</label>
                                        <div className="relative group">
                                            <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none">
                                                <MapPinIcon className="w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            </div>
                                            <textarea
                                                className={`w-full pl-11 pr-4 py-3 bg-slate-50/50 border-slate-200 rounded-lg text-xs font-normal text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all min-h-[100px] ${errors.address ? 'border-rose-300 ring-rose-50' : ''}`}
                                                value={data.address}
                                                onChange={e => setData('address', e.target.value)}
                                                placeholder="Specify physical coordinates and building details..."
                                            />
                                        </div>
                                        {errors.address && <p className="text-rose-500 text-[10px] mt-2 font-normal uppercase tracking-normal">{errors.address}</p>}
                                    </div>
                                </div>

                                {/* Connectivity Block */}
                                <div className="md:col-span-12 space-y-6">
                                    <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                                        <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                                        <h4 className="text-[10px] font-normal text-slate-900 uppercase tracking-widest">Contact Information</h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-2.5">Direct Line</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <PhoneIcon className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                </div>
                                                <input
                                                    type="text"
                                                    className={`w-full pl-11 pr-4 py-3 bg-slate-50/50 border-slate-200 rounded-xl text-xs font-normal text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all ${errors.phone ? 'border-rose-300 ring-rose-50' : ''}`}
                                                    value={data.phone}
                                                    onChange={e => setData('phone', e.target.value)}
                                                    placeholder="+974 XXXX XXXX"
                                                />
                                            </div>
                                            {errors.phone && <p className="text-rose-500 text-[10px] mt-2 font-normal uppercase tracking-normal">{errors.phone}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-2.5">Official Email</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <EnvelopeIcon className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                </div>
                                                <input
                                                    type="email"
                                                    className={`w-full pl-11 pr-4 py-3 bg-slate-50/50 border-slate-200 rounded-xl text-xs font-normal text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all ${errors.email ? 'border-rose-300 ring-rose-50' : ''}`}
                                                    value={data.email}
                                                    onChange={e => setData('email', e.target.value)}
                                                    placeholder="ops@earthdoha.com"
                                                />
                                            </div>
                                            {errors.email && <p className="text-rose-500 text-[10px] mt-2 font-normal uppercase tracking-normal">{errors.email}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-2.5">Website (URL)</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <GlobeAltIcon className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                            </div>
                                            <input
                                                type="url"
                                                className={`w-full pl-11 pr-4 py-3 bg-slate-50/50 border-slate-200 rounded-xl text-xs font-normal text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all ${errors.website ? 'border-rose-300 ring-rose-50' : ''}`}
                                                value={data.website}
                                                onChange={e => setData('website', e.target.value)}
                                                placeholder="https://earthdoha.com"
                                            />
                                        </div>
                                        {errors.website && <p className="text-rose-500 text-[10px] mt-2 font-normal uppercase tracking-normal">{errors.website}</p>}
                                    </div>

                                    {/* Weekly Off Days Selection */}
                                    <div className="space-y-6 pt-4">
                                        <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                                            <div className="w-1 h-3 bg-amber-500 rounded-full"></div>
                                            <h4 className="text-[10px] font-normal text-slate-900 uppercase tracking-widest">Weekly Off Days</h4>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-3">
                                                Select Weekly Off Days (Optional)
                                            </label>
                                            <div className="flex flex-wrap gap-3">
                                                {DAYS_OF_WEEK.map((day) => {
                                                    const isChecked = (data.weekly_off_days || []).includes(day);
                                                    return (
                                                        <button
                                                            key={day}
                                                            type="button"
                                                            onClick={() => handleWeeklyOffToggle(day)}
                                                            className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                                                                isChecked
                                                                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/10'
                                                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                            }`}
                                                        >
                                                            {day}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {errors.weekly_off_days && (
                                                <p className="text-rose-500 text-[10px] mt-2 font-normal uppercase tracking-normal">
                                                    {errors.weekly_off_days}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-8 border-t border-slate-50">
                                <Link
                                    href={route('companies.index')}
                                    className="px-6 py-2.5 text-[10px] font-normal text-slate-400 bg-slate-50 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-all uppercase tracking-normal active:scale-95"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-8 py-2.5 text-[10px] font-normal text-white bg-primary rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest"
                                >
                                    {processing ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowPathIcon className="w-4 h-4" /> 
                                            Save Branch
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}