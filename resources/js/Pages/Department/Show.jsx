import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import Avatar from '@/Components/Avatar';
import {
    FaLayerGroup,
    FaBuilding,
    FaArrowLeft,
    FaEdit,
    FaUsers,
    FaEnvelope,
    FaPhone,
    FaUserTie,
    FaChevronRight,
    FaShieldAlt,
    FaChartLine,
    FaDatabase,
    FaPlus
} from 'react-icons/fa';

export default function Show({ department, employees = [] }) {
    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800 tracking-normal">Department Insights</h2>}>
            <Head title={`${department.name} - Unit Analysis`} />
            
            <div className="py-4 px-3 sm:px-4 lg:px-6 space-y-4">
                {/* Tactical Navigation */}
                <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm p-4 rounded-lg border border-slate-200">
                    <Link
                        href={route('departments.index')}
                        className="group flex items-center gap-3 px-6 py-3 bg-white hover:bg-slate-900 text-slate-600 hover:text-white rounded-lg text-[10px] font-normal uppercase tracking-normal transition-all border border-slate-200 shadow-sm active:scale-95"
                    >
                        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                        Return to Ledger
                    </Link>
                    <div className="hidden sm:flex items-center gap-3 text-[10px] font-normal text-slate-400 uppercase tracking-normal">
                        Taxonomy <FaChevronRight size={8} /> <span className="text-primary">Unit Insights</span> <FaChevronRight size={8} /> <span className="text-slate-900 font-normal">{department.name}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Left Column: Department Intelligence */}
                    <div className="xl:col-span-4 space-y-8">
                        <div className="bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden group">
                            {/* Executive Branding Banner */}
                            <div className="h-32 bg-slate-900 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"></div>
                                <div className="absolute -right-10 -bottom-10 text-white opacity-5 group-hover:scale-110 transition-transform duration-700">
                                    <FaLayerGroup size={180} />
                                </div>
                            </div>

                            <div className="px-6 pb-6 relative">
                                {/* Unit Icon Projection */}
                                <div className="flex justify-between items-end -mt-12 mb-8">
                                    <div className="w-16 h-16 bg-white rounded-lg p-1 shadow-2xl ring-8 ring-white/50 relative overflow-hidden group/icon">
                                        <div className="w-full h-full bg-slate-50 rounded-md flex items-center justify-center text-primary text-2xl group-hover/icon:scale-110 transition-transform">
                                            <FaLayerGroup />
                                        </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-lg text-[9px] font-normal uppercase tracking-normal border ${department.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                        {department.status === 'active' ? 'Operational' : 'Inactive'}
                                    </div>
                                </div>

                                <div className="space-y-2 mb-10">
                                    <h1 className="text-2xl font-normal text-slate-900 leading-tight uppercase tracking-normal">{department.name}</h1>
                                    <div className="flex items-center gap-2 text-[9px] font-normal text-slate-400 uppercase tracking-normal">
                                        <FaDatabase size={10} /> Taxonomy ID: #{department.id.toString().padStart(4, '0')}
                                    </div>
                                </div>

                                {/* Analytics Matrix */}
                                <div className="space-y-6">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-white shadow-sm text-primary flex items-center justify-center shrink-0">
                                                <FaBuilding size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-2">Branch Associations</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {department.companies && department.companies.length > 0 ? (
                                                        department.companies.map(c => (
                                                            <span key={c.id} className="inline-flex items-center px-3 py-1.5 rounded-lg text-[9px] font-normal bg-white text-slate-700 border border-slate-200 shadow-sm uppercase tracking-normal">
                                                                {c.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[9px] font-normal text-rose-400 uppercase tracking-normal">UNMAPPED</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-white shadow-sm text-indigo-500 flex items-center justify-center shrink-0">
                                                <FaUsers size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">Personnel Matrix</p>
                                                <p className="text-xl font-normal text-slate-900 mt-1">{employees.length} Active Members</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-900 rounded-xl text-white relative overflow-hidden group/audit">
                                        <div className="absolute top-0 right-0 p-6 text-white/5 group-hover/audit:scale-110 transition-transform">
                                            <FaShieldAlt size={40} />
                                        </div>
                                        <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-1">Audit Protocol</p>
                                        <p className="text-[11px] font-normal text-slate-300 leading-relaxed uppercase tracking-normal">All changes to this unit are indexed in the executive structural audit log.</p>
                                    </div>
                                </div>

                                {/* Modification Trigger */}
                                <div className="mt-10">
                                    <Link
                                        href={route('departments.edit', department.id)}
                                        className="flex items-center justify-center gap-3 w-full bg-primary hover:brightness-110 text-white py-3.5 rounded-xl text-[10px] font-normal uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/20 active:scale-95"
                                    >
                                        <FaEdit size={14} /> Update Configuration
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Personnel Reconnaissance */}
                    <div className="xl:col-span-8 space-y-8">
                        {/* Executive Stats Bar */}
                        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/5 text-primary rounded-lg flex items-center justify-center text-xl">
                                    <FaUsers />
                                </div>
                                <div>
                                    <h2 className="text-lg font-normal text-slate-900 uppercase tracking-normal">Personnel Roster</h2>
                                    <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mt-0.5">Verified unit members</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">Enrollment Status</p>
                                    <p className="text-xs font-normal text-emerald-500 uppercase tracking-normal mt-1">VERIFIED PERSONNEL</p>
                                </div>
                                <div className="w-[1px] h-10 bg-slate-100 hidden sm:block mx-2"></div>
                                <div className="w-12 h-12 bg-slate-900 text-white rounded-lg flex items-center justify-center text-lg shadow-lg">
                                    <FaChartLine size={16} />
                                </div>
                            </div>
                        </div>

                        {employees.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {employees.map((emp) => (
                                    <div key={emp.id} className="group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 flex items-center gap-4 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-6 text-primary opacity-0 group-hover:opacity-5 transition-transform translate-x-4 group-hover:translate-x-0 duration-500">
                                            <FaUserTie size={60} />
                                        </div>
                                        
                                        <Avatar
                                            src={emp.employee_image || emp.user?.image}
                                            name={emp.name}
                                            size="xl"
                                            className="shadow-2xl ring-4 ring-slate-50 group-hover:scale-105 transition-transform duration-500"
                                        />
                                        
                                        <div className="flex-1 min-w-0 relative">
                                            <div className="flex flex-col">
                                                <h3 className="text-sm font-normal text-slate-900 uppercase tracking-normal truncate group-hover:text-primary transition-colors">
                                                    {emp.name}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-normal text-primary bg-primary/5 px-2 py-0.5 rounded-lg uppercase tracking-normal">
                                                        {emp.designation || 'Employee'}
                                                    </span>
                                                    <span className="text-[9px] font-normal text-slate-400 uppercase tracking-normal truncate max-w-[120px]">
                                                        {emp.employee_code}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4 flex items-center gap-4">
                                                <Link
                                                    href={route('employees.show', emp.id)}
                                                    className="flex items-center justify-center w-full bg-slate-50 hover:bg-slate-900 text-slate-400 hover:text-white py-2.5 rounded-lg text-[9px] font-normal uppercase tracking-normal transition-all active:scale-95 border border-slate-100"
                                                >
                                                    Analysis Profile <FaChevronRight className="ml-2" size={8} />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-[3rem] p-20 border-2 border-slate-100 border-dashed text-center">
                                <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                                    <FaUsers size={40} />
                                </div>
                                <h3 className="text-xl font-normal text-slate-900 uppercase tracking-normal">Personnel Grid Vacant</h3>
                                <p className="text-slate-400 text-[10px] font-normal uppercase tracking-[0.3em] mt-2 max-w-sm mx-auto">No verified personnel identified within this taxonomy unit definition.</p>
                                <div className="mt-10">
                                    <Link
                                        href={route('employees.create')}
                                        className="inline-flex items-center gap-4 bg-slate-900 hover:brightness-110 text-white px-8 py-3 rounded-lg text-[10px] font-normal uppercase tracking-normal shadow-2xl shadow-slate-200 transition-all active:scale-95"
                                    >
                                        <FaPlus size={10} /> Enroll New Personnel
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Tactical Note */}
                        <div className="bg-primary/5 rounded-xl p-6 border border-primary/10 flex items-center gap-6">
                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
                                <FaShieldAlt size={24} />
                            </div>
                            <div>
                                <p className="text-[11px] font-normal text-primary uppercase tracking-normal leading-relaxed">
                                    This unit matrix is restricted. Personnel reallocations and structural shifts are audited in real-time to maintain organizational integrity across the global salon network.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}