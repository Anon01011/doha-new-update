import React from 'react';
import { useForm, Link, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    BuildingOfficeIcon,
    ArrowLeftIcon,
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    GlobeAltIcon,
    PlusCircleIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';

const DAYS_OF_WEEK = [
    { key: 'Sunday',    abbr: 'Sun' },
    { key: 'Monday',    abbr: 'Mon' },
    { key: 'Tuesday',  abbr: 'Tue' },
    { key: 'Wednesday',abbr: 'Wed' },
    { key: 'Thursday', abbr: 'Thu' },
    { key: 'Friday',   abbr: 'Fri' },
    { key: 'Saturday', abbr: 'Sat' },
];

function FieldGroup({ label, required, error, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            {children}
            {error && (
                <p className="text-rose-500 text-[10px] font-normal uppercase tracking-wide flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-rose-400 inline-block" />
                    {error}
                </p>
            )}
        </div>
    );
}

function IconInput({ icon: Icon, accent = 'primary', error, children, ...inputProps }) {
    const accentRing = accent === 'indigo'
        ? 'focus:ring-indigo-500/10 focus:border-indigo-400'
        : 'focus:ring-primary/10 focus:border-primary';
    const iconHover = accent === 'indigo'
        ? 'group-focus-within:text-indigo-500'
        : 'group-focus-within:text-primary';

    return (
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Icon className={`w-4 h-4 text-slate-400 transition-colors ${iconHover}`} />
            </div>
            <input
                {...inputProps}
                className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                    error
                        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10'
                        : `border-slate-200 ${accentRing}`
                }`}
            />
        </div>
    );
}

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        weekly_off_days: [],
    });

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

    const offDays = data.weekly_off_days || [];
    const initials = data.name
        ? data.name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('')
        : null;

    return (
        <AuthenticatedLayout>
            <Head title="Add Branch" />

            <div className="w-full py-4 px-4 sm:px-6 lg:px-8 space-y-5">

                {/* ─── Page Header ───────────────────────────────────── */}
                <div className="flex items-center gap-3">
                    <Link
                        href={route('companies.index')}
                        className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 group shrink-0"
                    >
                        <ArrowLeftIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/10 shrink-0">
                            <BuildingOfficeIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                                Add New Branch
                            </h1>
                            <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                                Register a new branch with its contact details and schedule.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ─── Main Layout: Form + Preview ──────────────────── */}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">

                    {/* ── Left: Form Cards (2/3 width) ─────────────────── */}
                    <div className="xl:col-span-2 space-y-4">

                        {/* Card 1 – Branch Identity */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                                <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                                    <BuildingOfficeIcon className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-800 uppercase tracking-wider">Branch Identity</p>
                                    <p className="text-[10px] text-slate-400 font-normal">Name and physical address of the branch</p>
                                </div>
                            </div>
                            <div className="p-5 space-y-4">
                                <FieldGroup label="Official Branch Name" required error={errors.name}>
                                    <IconInput
                                        icon={BuildingOfficeIcon}
                                        type="text"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder="e.g. Earth Doha — North Wing"
                                        autoFocus
                                        required
                                        error={errors.name}
                                    />
                                </FieldGroup>

                                <FieldGroup label="Operational Address" error={errors.address}>
                                    <div className="relative group">
                                        <div className="absolute top-3 left-3.5 pointer-events-none">
                                            <MapPinIcon className="w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <textarea
                                            value={data.address}
                                            onChange={e => setData('address', e.target.value)}
                                            rows={3}
                                            placeholder="Building number, street, area, city..."
                                            className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm resize-none ${
                                                errors.address
                                                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10'
                                                    : 'border-slate-200 focus:ring-primary/10 focus:border-primary'
                                            }`}
                                        />
                                    </div>
                                </FieldGroup>
                            </div>
                        </div>

                        {/* Card 2 – Contact Information */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 bg-indigo-50/40">
                                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                                    <PhoneIcon className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-800 uppercase tracking-wider">Contact Information</p>
                                    <p className="text-[10px] text-slate-400 font-normal">Phone, email and web presence</p>
                                </div>
                            </div>
                            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FieldGroup label="Phone Number" error={errors.phone}>
                                    <IconInput
                                        icon={PhoneIcon}
                                        accent="indigo"
                                        type="tel"
                                        value={data.phone}
                                        onChange={e => setData('phone', e.target.value)}
                                        placeholder="+974 XXXX XXXX"
                                        error={errors.phone}
                                    />
                                </FieldGroup>

                                <FieldGroup label="Official Email" error={errors.email}>
                                    <IconInput
                                        icon={EnvelopeIcon}
                                        accent="indigo"
                                        type="email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        placeholder="ops@company.com"
                                        error={errors.email}
                                    />
                                </FieldGroup>

                                <div className="sm:col-span-2">
                                    <FieldGroup label="Website URL" error={errors.website}>
                                        <IconInput
                                            icon={GlobeAltIcon}
                                            accent="indigo"
                                            type="url"
                                            value={data.website}
                                            onChange={e => setData('website', e.target.value)}
                                            placeholder="https://yourcompany.com"
                                            error={errors.website}
                                        />
                                    </FieldGroup>
                                </div>
                            </div>
                        </div>

                        {/* Card 3 – Weekly Off Days */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 bg-amber-50/40">
                                <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                                    <CalendarDaysIcon className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-800 uppercase tracking-wider">Weekly Off Days</p>
                                    <p className="text-[10px] text-slate-400 font-normal">Select which days this branch is closed</p>
                                </div>
                            </div>
                            <div className="p-5 space-y-3">
                                <div className="grid grid-cols-7 gap-2">
                                    {DAYS_OF_WEEK.map(({ key, abbr }) => {
                                        const isSelected = offDays.includes(key);
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                title={key}
                                                onClick={() => handleWeeklyOffToggle(key)}
                                                className={`flex flex-col items-center justify-center py-3 rounded-xl border text-[10px] font-semibold uppercase tracking-wide transition-all select-none ${
                                                    isSelected
                                                        ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-400/20 scale-105'
                                                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700'
                                                }`}
                                            >
                                                <span className="text-[9px] opacity-70 font-normal normal-case mb-0.5">{abbr}</span>
                                                <span>{key.slice(0, 1)}</span>
                                                {isSelected && <CheckCircleIcon className="w-3 h-3 mt-1 opacity-80" />}
                                            </button>
                                        );
                                    })}
                                </div>
                                {offDays.length > 0 && (
                                    <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                        <strong>{offDays.length}</strong> day{offDays.length > 1 ? 's' : ''} off — {offDays.join(', ')}
                                    </p>
                                )}
                                {errors.weekly_off_days && (
                                    <p className="text-rose-500 text-[10px] uppercase tracking-wide">{errors.weekly_off_days}</p>
                                )}
                            </div>
                        </div>

                        {/* ── Form Actions ── */}
                        <div className="flex items-center justify-end gap-3 pt-1">
                            <Link
                                href={route('companies.index')}
                                className="px-5 py-2.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-95 shadow-sm"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 active:scale-95 disabled:opacity-60 transition-all"
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Saving Branch...
                                    </>
                                ) : (
                                    <>
                                        <PlusCircleIcon className="w-4 h-4" />
                                        Save Branch
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* ── Right: Live Preview Card (1/3 width) ─────────── */}
                    <div className="xl:col-span-1 space-y-4 sticky top-6">
                        {/* Branch Preview */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                <SparklesIcon className="w-3.5 h-3.5 text-slate-400" />
                                <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Live Preview</p>
                            </div>
                            <div className="p-5 space-y-4">
                                {/* Avatar / Initials */}
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/15 shrink-0">
                                        {initials ? (
                                            <span className="text-white font-bold text-lg tracking-tight">{initials}</span>
                                        ) : (
                                            <BuildingOfficeIcon className="w-6 h-6 text-slate-500" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 leading-tight truncate">
                                            {data.name || <span className="text-slate-300 font-normal italic">Branch name...</span>}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">New Branch</p>
                                    </div>
                                </div>

                                {/* Detail Rows */}
                                <div className="space-y-2.5 pt-1">
                                    {[
                                        { icon: MapPinIcon, value: data.address, placeholder: 'Address not set' },
                                        { icon: PhoneIcon,  value: data.phone,   placeholder: 'Phone not set'   },
                                        { icon: EnvelopeIcon,value: data.email,  placeholder: 'Email not set'   },
                                        { icon: GlobeAltIcon,value: data.website,placeholder: 'Website not set' },
                                    ].map(({ icon: Icon, value, placeholder }) => (
                                        <div key={placeholder} className="flex items-start gap-2.5">
                                            <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                            <span className={`text-[11px] leading-snug break-all ${value ? 'text-slate-700' : 'text-slate-300 italic'}`}>
                                                {value || placeholder}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Off Days Preview */}
                                {offDays.length > 0 && (
                                    <div className="pt-2 border-t border-slate-100">
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Off Days</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {offDays.map(d => (
                                                <span key={d} className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold rounded-lg">
                                                    {d.slice(0, 3)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tip Card */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-2">
                            <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Quick Tips</p>
                            <ul className="space-y-1.5 text-[11px] text-indigo-600">
                                <li className="flex items-start gap-1.5"><span className="mt-0.5 shrink-0">•</span>Branch name must be unique across all companies.</li>
                                <li className="flex items-start gap-1.5"><span className="mt-0.5 shrink-0">•</span>Weekly off days affect leave and attendance calculations.</li>
                                <li className="flex items-start gap-1.5"><span className="mt-0.5 shrink-0">•</span>You can add departments and employees after saving.</li>
                            </ul>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
