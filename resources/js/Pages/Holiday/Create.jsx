import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import { FaCalendarAlt, FaBuilding, FaArrowLeft, FaSave, FaFileAlt, FaInfoCircle, FaCheckCircle, FaClock, FaHistory, FaChevronDown } from 'react-icons/fa';

export default function Create({ companies, auth }) {
    const userRole = auth.user.role;
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        start_date: '',
        end_date: '',
        is_recurring: false,
        company_ids: [],
        description: '',
    });

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('holidays.store'));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Add New Holiday</h2>}>
            <Head title="Create Holiday" />

            <div className="py-4 px-3 sm:px-4 lg:px-6 space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <FaCalendarAlt size={120} />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <Link
                            href={route('holidays.index')}
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-normal text-slate-900 leading-none mb-2">Add Holiday</h2>
                            <p className="text-[10px] font-normal text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></span>
                                Official Holidays
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                        <button
                            form="holiday-create-form"
                            type="submit"
                            disabled={processing}
                            className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-normal hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {processing ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <FaSave size={12} />
                            )}
                            <span>Save Holiday</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Form */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 md:p-8">
                                <form id="holiday-create-form" onSubmit={handleSubmit} className="space-y-8">
                                    {/* Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                Holiday Name
                                            </label>
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    className={`w-full px-5 py-3 bg-slate-50 border ${errors.name ? 'border-rose-200 focus:border-rose-300' : 'border-slate-200 focus:border-slate-300'} rounded-xl focus:ring-0 transition-all outline-none text-[11px] font-normal placeholder:text-slate-300`}
                                                    value={data.name}
                                                    onChange={e => setData('name', e.target.value)}
                                                    required
                                                    placeholder="e.g. Founder's Day"
                                                />
                                            </div>
                                            {errors.name && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 flex items-center gap-1"><FaInfoCircle size={10} /> {errors.name}</p>}
                                        </div>

                                        {userRole === 'admin' ? (
                                            <div className="space-y-3 relative" ref={dropdownRef}>
                                                <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                    Select Companies
                                                </label>
                                                
                                                <div 
                                                    className={`w-full px-5 py-3 bg-slate-50 border ${errors.company_ids ? 'border-rose-200' : 'border-slate-200'} rounded-xl cursor-pointer flex justify-between items-center transition-all`}
                                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                >
                                                    <span className="text-[11px] font-normal text-slate-700">
                                                        {data.company_ids.length === 0 
                                                            ? 'Select companies...' 
                                                            : `${data.company_ids.length} compan${data.company_ids.length === 1 ? 'y' : 'ies'} selected`}
                                                    </span>
                                                    <FaChevronDown size={10} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                                </div>

                                                {isDropdownOpen && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden">
                                                        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                                            <span className="text-[10px] font-normal text-slate-500">Available Companies</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (data.company_ids.length === companies.length) {
                                                                        setData('company_ids', []);
                                                                    } else {
                                                                        setData('company_ids', companies.map(c => c.id));
                                                                    }
                                                                }}
                                                                className="text-[9px] font-normal text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                                            >
                                                                {data.company_ids.length === companies.length ? 'Deselect All' : 'Select All'}
                                                            </button>
                                                        </div>
                                                        <div className="max-h-[200px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                                            {companies.map(company => (
                                                                <label key={company.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
                                                                    <div className="relative flex items-center justify-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 transition-all cursor-pointer peer"
                                                                            checked={data.company_ids.includes(company.id)}
                                                                            onChange={(e) => {
                                                                                if (e.target.checked) {
                                                                                    setData('company_ids', [...data.company_ids, company.id]);
                                                                                } else {
                                                                                    setData('company_ids', data.company_ids.filter(id => id !== company.id));
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-[11px] font-normal text-slate-700 group-hover:text-slate-900">{company.name}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {errors.company_ids && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 flex items-center gap-1"><FaInfoCircle size={10} /> {errors.company_ids}</p>}
                                                {Object.keys(errors).some(key => key.startsWith('company_ids.')) && (
                                                    <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 flex items-center gap-1">
                                                        <FaInfoCircle size={10} /> Please select valid companies.
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-3 opacity-60">
                                                <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                    Company
                                                </label>
                                                <div className="px-5 py-3 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-normal text-slate-400 cursor-not-allowed">
                                                    {auth.user.employee?.company?.name || 'Local Entity'}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                     {/* Schedule */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                        <FaCalendarAlt className="text-slate-400" /> Start Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className={`w-full px-5 py-3 bg-white border ${errors.start_date ? 'border-rose-200 focus:border-rose-300' : 'border-slate-200 focus:border-slate-300'} rounded-xl focus:ring-0 transition-all outline-none text-[11px] font-normal`}
                                                        value={data.start_date}
                                                        onChange={e => setData('start_date', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                                        End Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className={`w-full px-5 py-3 bg-white border ${errors.end_date ? 'border-rose-200 focus:border-rose-300' : 'border-slate-200 focus:border-slate-300'} rounded-xl focus:ring-0 transition-all outline-none text-[11px] font-normal`}
                                                        value={data.end_date}
                                                        onChange={e => setData('end_date', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            {errors.start_date && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 flex items-center gap-1"><FaInfoCircle size={10} /> {errors.start_date}</p>}
                                            {errors.end_date && <p className="text-[10px] font-normal text-rose-500 mt-2 ml-1 flex items-center gap-1"><FaInfoCircle size={10} /> {errors.end_date}</p>}
                                        </div>

                                        <div className="flex items-center">
                                             <div
                                                className={`w-full p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${data.is_recurring ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'}`}
                                                onClick={() => setData('is_recurring', !data.is_recurring)}
                                            >
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${data.is_recurring ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    <FaHistory size={16} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-normal text-slate-900">Every Year</p>
                                                    <p className="text-[9px] font-normal text-slate-400">Recurring Holiday</p>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-4 transition-all ${data.is_recurring ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-100'}`}></div>
                                            </div>
                                        </div>
                                    </div>

                                     {/* Description */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-normal text-slate-500 flex items-center gap-2 ml-1">
                                            Description
                                        </label>
                                        <textarea
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-300 focus:ring-0 transition-all outline-none text-[11px] font-normal placeholder:text-slate-300 resize-none"
                                            rows={3}
                                            value={data.description}
                                            onChange={e => setData('description', e.target.value)}
                                            placeholder="Describe the holiday and its impact..."
                                        />
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                     {/* Guidelines */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 rounded-xl p-6 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 text-slate-700 opacity-20 group-hover:scale-110 transition-transform">
                                <FaInfoCircle size={60} />
                            </div>
                            <h3 className="text-xs font-normal mb-5 relative z-10 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                Guidelines
                            </h3>
                            <ul className="space-y-6 relative z-10">
                                 <li className="flex gap-4">
                                    <div className="w-7 h-7 bg-white/10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-normal text-[10px]">01</div>
                                    <p className="text-[10px] font-normal text-slate-200 leading-relaxed">
                                        Holidays are <span className="text-white font-normal">Blocked</span> on the employee schedule.
                                    </p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-7 h-7 bg-white/10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-normal text-[10px]">02</div>
                                    <p className="text-[10px] font-normal text-slate-200 leading-relaxed">
                                        <span className="text-white font-normal">Recurring Holidays</span> repeat every year automatically.
                                    </p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-7 h-7 bg-white/10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-normal text-[10px]">03</div>
                                    <p className="text-[10px] font-normal text-slate-200 leading-relaxed">
                                        Employees will get <span className="text-white font-normal">Auto Notifications</span> once saved.
                                    </p>
                                </li>
                            </ul>
                        </div>

                         {/* Impact */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-[10px] font-normal text-slate-900 mb-6 flex items-center gap-2">
                                <FaClock className="text-slate-400" /> Impact
                            </h3>
                            <div className="space-y-4">
                                <span className="text-[10px] font-normal text-slate-400">Scope</span>
                                <span className="text-[11px] font-normal text-slate-900">Whole Company</span>
                            </div>
                             <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                <span className="text-[10px] font-normal text-slate-400">Roster Override</span>
                                <span className="text-[11px] font-normal text-emerald-600">Enabled</span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-[10px] font-normal text-slate-400">System Priority</span>
                                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-normal border border-amber-100">Critical</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
