import React from 'react';
import { Link, usePage, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    BuildingOfficeIcon,
    PencilSquareIcon,
    ArrowLeftIcon,
    MapPinIcon,
    PhoneIcon,
    GlobeAltIcon,
    EnvelopeIcon,
    CalendarDaysIcon,
    Squares2X2Icon,
    UserGroupIcon,
    IdentificationIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function Show() {
    const { company, departments = [] } = usePage().props;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-normal text-slate-900 tracking-normal leading-none">Branch Details</h2>
                    <p className="text-[10px] text-slate-400 font-normal uppercase tracking-normal mt-1.5">View detailed information about this branch</p>
                </div>
            }
        >
            <Head title={`Branch - ${company.name}`} />

            <div className="max-w-[1600px] mx-auto py-4 px-4 sm:px-6 lg:px-5 space-y-4">
                {/* Action Bar */}
                <div className="flex items-center justify-between gap-4">
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

                    <Link
                        href={route('companies.edit', company.id)}
                        className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-lg text-[10px] font-normal uppercase tracking-normal transition-all shadow-lg shadow-slate-200 flex items-center gap-2 active:scale-95"
                    >
                        <PencilSquareIcon className="w-4 h-4" />
                        Edit Branch
                    </Link>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Left Column: Identity Card */}
                    <div className="xl:col-span-4 space-y-6">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden relative">
                            {/* Decorative Header */}
                            <div className="h-32 bg-slate-900 relative">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                                <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                    <span className="text-[8px] font-normal text-white uppercase tracking-normal leading-none">Branch</span>
                                </div>
                            </div>

                            <div className="px-8 pb-8 relative">
                                {/* Logo & Status */}
                                <div className="flex justify-between items-end -mt-12 mb-6">
                                    <div className="w-24 h-24 bg-white rounded-lg p-1.5 shadow-2xl ring-8 ring-white overflow-hidden border border-slate-100 flex items-center justify-center">
                                        {company.company_logo ? (
                                            <img src={`/storage/${company.company_logo}`} alt={company.name} className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <BuildingOfficeIcon className="w-10 h-10 text-primary" />
                                        )}
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-lg text-[10px] font-normal uppercase tracking-normal shadow-sm border ${company.status !== 'inactive' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                        {company.status || 'Active'}
                                    </div>
                                </div>

                                {/* Title Block */}
                                <div className="mb-8">
                                    <h1 className="text-2xl font-normal text-slate-900 leading-tight tracking-normal">{company.name}</h1>
                                    <div className="flex items-center gap-2 mt-2">
                                        <IdentificationIcon className="w-3.5 h-3.5 text-slate-400" />
                                        <p className="text-[10px] text-slate-400 font-normal uppercase tracking-normal">Branch ID: #{company.id.toString().padStart(4, '0')}</p>
                                    </div>
                                </div>

                                {/* Data Points */}
                                <div className="space-y-5">
                                    <div className="group flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                        <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 transition-all shadow-md">
                                            <MapPinIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-normal text-slate-500 uppercase tracking-normal mb-1">Address</p>
                                            <p className="text-[11px] font-semibold text-slate-900 leading-relaxed uppercase tracking-normal">{company.address || 'No address provided'}</p>
                                        </div>
                                    </div>

                                    <div className="group flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                        <div className="w-9 h-9 rounded-lg bg-indigo-500 text-white flex items-center justify-center shrink-0 transition-all shadow-md">
                                            <PhoneIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-normal text-slate-500 uppercase tracking-normal mb-1">Phone Number</p>
                                            <p className="text-[11px] font-semibold text-slate-900 tracking-normal">{company.company_phone || 'No phone number'}</p>
                                        </div>
                                    </div>

                                    <div className="group flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                        <div className="w-9 h-9 rounded-lg bg-cyan-500 text-white flex items-center justify-center shrink-0 transition-all shadow-md">
                                            <EnvelopeIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-normal text-slate-500 uppercase tracking-normal mb-1">Email Address</p>
                                            <p className="text-[11px] font-semibold text-slate-900 lowercase tracking-normal">{company.company_email || 'branch@earthdoha.com'}</p>
                                        </div>
                                    </div>

                                    <div className="group flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                        <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 transition-all shadow-md">
                                            <CalendarDaysIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-normal text-slate-500 uppercase tracking-normal mb-1">Created On</p>
                                            <p className="text-[11px] font-semibold text-slate-900 uppercase tracking-normal">{new Date(company.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Node Infrastructure */}
                    <div className="xl:col-span-8 space-y-6">
                        {/* Summary Header */}
                        <div className="bg-slate-900 rounded-lg p-8 border border-slate-800 shadow-xl relative overflow-hidden group">
                            <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform duration-700 text-white">
                                <Squares2X2Icon className="w-48 h-48" />
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                <div>
                                    <h2 className="text-xl font-normal text-white tracking-normal leading-none uppercase">Branch Departments</h2>
                                    <p className="text-[10px] text-slate-400 font-normal uppercase tracking-normal mt-2">Overview of departments and staff in this branch</p>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-center">
                                        <p className="text-[9px] font-normal text-slate-500 uppercase tracking-normal mb-1">Units</p>
                                        <p className="text-2xl font-normal text-white leading-none">{departments.length}</p>
                                    </div>
                                    <div className="w-px h-8 bg-slate-800"></div>
                                    <div className="text-center">
                                        <p className="text-[9px] font-normal text-slate-500 uppercase tracking-normal mb-1">Staff</p>
                                        <p className="text-2xl font-normal text-primary leading-none">{company.employees_count || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Departments Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {departments.length > 0 ? (
                                departments.map((dept) => (
                                    <div key={dept.id} className="group bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary transition-all duration-300 relative overflow-hidden">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="w-12 h-12 rounded-lg bg-primary text-white flex items-center justify-center transition-all shadow-md">
                                                <Squares2X2Icon className="w-6 h-6" />
                                            </div>
                                            <span className="text-[8px] font-normal text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 uppercase tracking-normal">ID: {dept.id}</span>
                                        </div>
                                        <h3 className="font-normal text-slate-900 text-lg mb-1 group-hover:text-primary transition-colors tracking-normal uppercase">{dept.name}</h3>
                                        <p className="text-[9px] text-slate-400 font-normal uppercase tracking-normal mb-6">Active Department</p>

                                        <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                                            <div className="flex items-center gap-1.5">
                                                <UserGroupIcon className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-normal">Active Staff</span>
                                            </div>
                                            <Link 
                                                href={route('departments.show', dept.id)} 
                                                className="inline-flex items-center gap-1.5 text-[9px] font-normal text-primary hover:text-primary-dark uppercase tracking-normal group/link"
                                            >
                                                View Department
                                                <ChevronRightIcon className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full bg-white rounded-lg p-16 border border-slate-200 border-dashed text-center">
                                    <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Squares2X2Icon className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-lg font-normal text-slate-900 uppercase tracking-normal">No Departments Found</h3>
                                    <p className="text-[10px] text-slate-400 font-normal uppercase tracking-normal mt-2 max-w-sm mx-auto leading-relaxed">
                                        There are no departments in this branch yet.
                                    </p>
                                    <Link
                                        href={route('departments.create')}
                                        className="inline-flex items-center gap-2 mt-8 bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-lg text-[10px] font-normal uppercase tracking-normal shadow-lg shadow-slate-100 transition-all active:scale-95"
                                    >
                                        <PlusIcon className="w-3.5 h-3.5" /> Add Department
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function PlusIcon(props) {
    return <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
}