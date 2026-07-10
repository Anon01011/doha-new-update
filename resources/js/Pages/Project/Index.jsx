import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index({ projects, userRole, leadProjectIds = [] }) {
    const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A';

    const getStatusColor = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'active') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (s === 'completed') return 'bg-blue-100 text-blue-700 border-blue-200';
        if (s === 'on_hold') return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleDelete = (id) => {
        setSelectedProjectId(id);
        setConfirmingDeletion(true);
    };

    const confirmDeletion = () => {
        setProcessing(true);
        router.delete(route('projects.destroy', selectedProjectId), {
            onFinish: () => {
                setProcessing(false);
                setConfirmingDeletion(false);
            }
        });
    };

    const canManageProject = (project) => {
        if (userRole === 'admin' || userRole === 'hr' || userRole === 'manager') return true;
        return leadProjectIds.includes(project.id);
    };

    const projectList = Array.isArray(projects) ? projects : (projects.data || []);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-gray-800">Projects</h2>}>
            <Head title="Projects" />
            <div className="w-full px-4 py-8 md:px-6 lg:px-8 bg-slate-50 min-h-screen">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-normal text-slate-900 tracking-normal">Project Management</h1>
                        <p className="text-slate-500 font-normal mt-1">Manage and track your ongoing projects and initiatives.</p>
                    </div>
                    {(userRole === 'admin' || userRole === 'hr' || userRole === 'manager') && (
                        <Link href={route('projects.create')} className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 text-sm font-normal uppercase tracking-normal shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            New Project
                        </Link>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {projectList.map((project) => (
                        <div key={project.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group flex flex-col h-full">
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 pr-4">
                                        <h4 className="text-xl font-normal text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors mb-1">{project.name}</h4>
                                        <p className="text-xs font-normal text-slate-400 uppercase tracking-normal flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                            {project.branch?.name || 'Main Branch'}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-normal uppercase tracking-normal border ${getStatusColor(project.status)}`}>
                                        {project.status}
                                    </span>
                                </div>

                                <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3">
                                    {project.description || 'No description provided.'}
                                </p>

                                <div className="mt-auto space-y-3 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400 font-normal uppercase tracking-normal">Timeline</span>
                                        <span className="text-slate-700 font-normal">{formatDate(project.start_date)} — {formatDate(project.end_date)}</span>
                                    </div>
                                    {/* Progress Bar Placeholder (can be real if data exists) */}
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-indigo-500 h-1.5 rounded-full w-[45%]"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                                <Link href={route('projects.show', project.id)} className="text-indigo-600 text-xs font-normal uppercase tracking-normal hover:text-indigo-800 flex items-center gap-1">
                                    View Workspace
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </Link>
                                <div className="flex gap-2">
                                    {canManageProject(project) && (
                                        <Link href={route('projects.edit', project.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </Link>
                                    )}
                                    {(userRole === 'admin' || userRole === 'hr' || userRole === 'manager') && (
                                        <button onClick={() => handleDelete(project.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {projectList.length === 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-16 text-center border border-dashed border-slate-300">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                        </div>
                        <h3 className="text-xl font-normal text-slate-900 mb-2">No Projects Found</h3>
                        <p className="text-slate-500 font-normal mb-8 max-w-md mx-auto">Get started by creating your first project to organize tasks, manage teams, and track progress.</p>
                        {(userRole === 'admin' || userRole === 'hr' || userRole === 'manager') && (
                            <Link href={route('projects.create')} className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 font-normal shadow-lg shadow-indigo-100 transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Create New Project
                            </Link>
                        )}
                    </div>
                )}
                <ConfirmationModal
                    show={confirmingDeletion}
                    title="Delete Project"
                    message="Are you sure you want to delete this project? This action cannot be undone."
                    onConfirm={confirmDeletion}
                    onClose={() => setConfirmingDeletion(false)}
                    type="danger"
                    processing={processing}
                />
            </div>
        </AuthenticatedLayout>
    );
}
