import React, { useState } from 'react';
import { Link, usePage, router, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    BuildingOfficeIcon,
    MapPinIcon,
    PhoneIcon,
    GlobeAltIcon,
    UserGroupIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
    CheckBadgeIcon,
    InboxIcon
} from '@heroicons/react/24/outline';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index() {
    const { companies, flash } = usePage().props;
    const [searchQuery, setSearchQuery] = useState('');

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleDelete = (branch) => {
        setSelectedBranch(branch);
        setConfirmingDeletion(true);
    };

    const confirmDeletion = () => {
        setProcessing(true);
        router.delete(route('companies.destroy', selectedBranch.id), {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setConfirmingDeletion(false);
            }
        });
    };

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (company.email && company.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-normal text-slate-900 tracking-normal leading-none">Branches</h2>
                    <p className="text-[10px] text-slate-400 font-normal uppercase tracking-normal mt-1.5">Manage all your company branches</p>
                </div>
            }
        >
            <Head title="Branches" />

            <div className="max-w-[1600px] mx-auto py-4 px-4 sm:px-6 lg:px-5 space-y-4">
                {/* Top Action Bar */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-slate-900 rounded-lg shadow-lg shadow-slate-200">
                            <BuildingOfficeIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900 tracking-normal leading-none">All Branches</h1>
                            <p className="text-[10px] text-slate-500 font-normal uppercase tracking-normal mt-1">View and manage your branches and their locations</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative group">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search branches..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-white border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-[11px] font-normal text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all w-full md:w-56 shadow-sm placeholder:text-slate-400"
                            />
                        </div>
                        <Link
                            href={route('companies.create')}
                            className="bg-primary hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 text-white px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 text-[10px] font-normal uppercase tracking-normal"
                        >
                            <PlusIcon className="w-3.5 h-3.5" />
                            Add Branch
                        </Link>
                    </div>
                </div>

                {/* Notification */}
                {(flash && flash.success) && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-normal uppercase tracking-normal flex items-center gap-2 shadow-lg shadow-emerald-200">
                        <CheckBadgeIcon className="w-4 h-4" />
                        {flash.success}
                    </div>
                )}

                {/* Main Table Card */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
                    <div className="px-5 py-3.5 bg-slate-50/30 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <BuildingOfficeIcon className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <h3 className="text-[10px] font-normal text-slate-800 uppercase tracking-normal">Branch List</h3>
                        </div>
                        <span className="text-[9px] font-normal text-slate-400 uppercase tracking-normal bg-white px-2 py-0.5 rounded-full border border-slate-100">{filteredCompanies.length} Active Branches</span>
                    </div>

                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    <th className="w-[300px] px-5 py-2.5 text-[9px] font-normal uppercase tracking-normal border-r border-slate-800">Branch Name</th>
                                    <th className="px-5 py-2.5 text-[9px] font-normal uppercase tracking-normal border-r border-slate-800">Address</th>
                                    <th className="w-[200px] px-5 py-2.5 text-[9px] font-normal uppercase tracking-normal border-r border-slate-800">Contact</th>
                                    <th className="w-[120px] px-5 py-2.5 text-[9px] font-normal uppercase tracking-normal border-r border-slate-800 text-center">Employees</th>
                                    <th className="w-[120px] px-5 py-2.5 text-[9px] font-normal uppercase tracking-normal text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredCompanies.map((branch) => (
                                    <tr key={branch.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center transition-all shadow-md border border-primary shrink-0 overflow-hidden">
                                                    {branch.company_logo ? (
                                                        <img src={`/storage/${branch.company_logo}`} alt={branch.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <BuildingOfficeIcon className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-[11px] font-semibold text-slate-900 leading-none truncate tracking-normal">{branch.name}</div>
                                                    <div className="flex items-center gap-1.5 mt-1.5">
                                                        <span className={`w-1 h-1 rounded-full ${branch.status !== 'inactive' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                        <span className="text-[8px] font-normal text-slate-500 uppercase tracking-normal truncate">{branch.status || 'Active Operation'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-start gap-2 max-w-[250px]">
                                                <MapPinIcon className="w-3 h-3 text-slate-300 shrink-0 mt-0.5" />
                                                <p className="text-[10px] text-slate-600 font-semibold leading-relaxed line-clamp-2 uppercase tracking-normal">
                                                    {branch.address || 'No location logged'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="space-y-1.5">
                                                {branch.company_phone && (
                                                    <div className="flex items-center gap-2">
                                                        <PhoneIcon className="w-2.5 h-2.5 text-indigo-600" />
                                                        <span className="text-[9px] text-slate-900 font-semibold tracking-normal">{branch.company_phone}</span>
                                                    </div>
                                                )}
                                                {branch.website_url && (
                                                    <div className="flex items-center gap-2">
                                                        <GlobeAltIcon className="w-2.5 h-2.5 text-cyan-400" />
                                                        <a href={branch.website_url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-primary font-normal hover:underline truncate">
                                                            Visit Website
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <div className="inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
                                                <UserGroupIcon className="w-3 h-3 text-slate-400" />
                                                <span className="text-[10px] font-normal text-slate-700">{branch.employees_count || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link
                                                    href={route('companies.show', branch.id)}
                                                    className="p-1.5 bg-slate-50 text-slate-400 hover:bg-primary hover:text-white rounded-md border border-slate-200 transition-all shadow-sm active:scale-90"
                                                    title="View"
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={route('companies.edit', branch.id)}
                                                    className="p-1.5 bg-slate-50 text-slate-400 hover:bg-amber-500 hover:text-white rounded-md border border-slate-200 transition-all shadow-sm active:scale-90"
                                                    title="Edit"
                                                >
                                                    <PencilSquareIcon className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(branch)}
                                                    className="p-1.5 bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white rounded-md border border-slate-200 transition-all shadow-sm active:scale-90"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredCompanies.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-5 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-20">
                                                <InboxIcon className="w-10 h-10 text-slate-400" />
                                                <p className="text-[10px] font-normal text-slate-500 uppercase tracking-[0.2em]">No branch nodes detected</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                show={confirmingDeletion}
                title="Delete Branch"
                message={`Are you sure you want to delete "${selectedBranch?.name}"? This action cannot be undone.`}
                onConfirm={confirmDeletion}
                onClose={() => setConfirmingDeletion(false)}
                type="danger"
                processing={processing}
            />
        </AuthenticatedLayout>
    );
}