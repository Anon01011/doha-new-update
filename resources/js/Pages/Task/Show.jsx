import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { FaTasks, FaInfoCircle, FaUsers, FaProjectDiagram, FaCalendarAlt, FaClock, FaCheckCircle, FaArrowLeft, FaEdit, FaLock, FaUnlock, FaPlus, FaPaperclip, FaComment, FaPaperPlane, FaStopwatch, FaChevronRight, FaTimes, FaBan, FaHourglassHalf } from 'react-icons/fa';

export default function Show({ task, userRole = 'employee', projectMemberRole = null, settings }) {
    const { auth } = usePage().props;
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [showBlockingModal, setShowBlockingModal] = useState(false);
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [checklistInput, setChecklistInput] = useState('');
    const [activeTab, setActiveTab] = useState('activity'); // activity, subtasks, checklist

    const isLead = userRole === 'admin' || userRole === 'hr' || userRole === 'manager' || projectMemberRole === 'lead';
    const isViewer = projectMemberRole === 'viewer';

    const activeAssignment = task.assignments?.find(a => a.employee_id === (auth?.user?.employee_id || null));
    const isTimerRunning = activeAssignment?.timers?.some(t => !t.end_time);

    const { data, setData, post, processing, errors, reset } = useForm({
        rejection_reason: '',
        blocked_reason: '',
        extension_request_date: '',
        extension_reason: '',
        item_text: '',
        comment: '',
        file: null,
        progress_percentage: activeAssignment?.progress_percentage || 0
    });

    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
    const formatDateTime = (date) => date ? new Date(date).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, month: 'short', day: 'numeric' }) : 'N/A';

    const getPriorityColor = (priority) => {
        const p = priority?.toLowerCase() || '';
        if (p === 'urgent') return 'bg-rose-500 text-white';
        if (p === 'high') return 'bg-orange-500 text-white';
        if (p === 'medium') return 'bg-amber-500 text-white';
        return 'bg-sky-500 text-white';
    };

    const getStatusColor = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'completed') return 'bg-emerald-500 text-white';
        if (s === 'in_progress') return 'bg-indigo-500 text-white';
        if (s === 'cancelled') return 'bg-slate-500 text-white';
        return 'bg-amber-500 text-white';
    };

    const formatStatus = (s) => {
        if (!s) return 'Pending';
        return s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const handleAction = (route_name, params = {}) => {
        router.post(route(route_name, task.id), params);
    };

    const addChecklistItem = (e) => {
        e.preventDefault();
        if (!checklistInput.trim()) return;
        router.post(route('tasks.add-checklist', task.id), { item_text: checklistInput }, {
            onSuccess: () => setChecklistInput(''),
        });
    };

    const toggleChecklist = (id) => {
        router.post(route('tasks.toggle-checklist', id));
    };

    // Combine comments and other events for a unified feed
    const activityFeed = useMemo(() => {
        const items = [
            ...(task.comments || []).map(c => ({ ...c, type: 'comment' })),
            ...(task.assignments?.flatMap(a => (a.timers || []).map(t => ({ ...t, type: 'timer', employee: a.employee }))) || [])
        ];
        return items.sort((a, b) => new Date(b.created_at || b.start_time) - new Date(a.created_at || a.start_time));
    }, [task.comments, task.assignments]);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Task Details</h2>}>
            <Head title={task.title} />

            <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
                {/* Modern Header */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm ${getPriorityColor(task.priority)}`}>
                                <FaTasks size={18} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-normal text-slate-900">{task.title}</h1>
                                    {task.is_blocked && (
                                        <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-[10px] font-normal border border-rose-200 flex items-center gap-1">
                                            <FaLock size={8} /> BLOCKED
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                    <span className="flex items-center gap-1">
                                        <FaProjectDiagram size={10} className="text-primary" />
                                        {task.project?.name || 'Independent Task'}
                                    </span>
                                    <span className="text-slate-300">|</span>
                                    <span>{task.category || 'General'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isLead && (
                                <button
                                    onClick={() => setShowBlockingModal(true)}
                                    className={`px-4 py-2 rounded-lg text-xs font-normal transition-all border flex items-center gap-2 ${task.is_blocked ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}
                                >
                                    {task.is_blocked ? <><FaUnlock size={10} /> Resolve Block</> : <><FaLock size={10} /> Block Task</>}
                                </button>
                            )}
                            {isLead && (
                                <Link href={route('tasks.edit', task.id)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-normal transition-all flex items-center gap-2 hover:bg-slate-800">
                                    <FaEdit size={10} /> Edit
                                </Link>
                            )}
                            <Link href={route('tasks.index')} className="bg-white text-slate-500 px-4 py-2 rounded-lg text-xs font-normal border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2">
                                <FaArrowLeft size={10} /> Back
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-4">
                        {/* Description & Tabs */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-5">
                                <h3 className="text-xs font-normal text-slate-500 uppercase tracking-normal mb-3">Description</h3>
                                <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                                    {task.description || 'No description provided.'}
                                </p>
                            </div>

                            <div className="border-t border-slate-100 bg-slate-50/30">
                                <div className="flex px-4">
                                    {[
                                        { id: 'activity', label: 'Activity', icon: FaComment },
                                        { id: 'checklist', label: 'Checklist', icon: FaCheckCircle },
                                        { id: 'subtasks', label: 'Subtasks', icon: FaTasks }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`px-5 py-3 text-xs font-normal transition-all relative flex items-center gap-2 ${activeTab === tab.id ? 'text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <tab.icon size={12} />
                                            {tab.label}
                                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-5">
                                {activeTab === 'activity' && (
                                    <div className="space-y-6">
                                        {/* Activity Feed */}
                                        <div className="space-y-4">
                                            {activityFeed.map((item, idx) => (
                                                <div key={idx} className="flex gap-3 relative">
                                                    {idx !== activityFeed.length - 1 && <div className="absolute left-4 top-10 bottom-0 w-[1px] bg-slate-100"></div>}
                                                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm z-10 overflow-hidden ${item.type === 'comment' ? 'bg-primary/10 text-primary' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        {item.type === 'comment' ? (
                                                            item.user?.image ? (
                                                                <img src={`/storage/${item.user.image}`} alt={item.user.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs font-normal">{(item.user?.name || '?').charAt(0)}</span>
                                                            )
                                                        ) : (
                                                            item.employee?.employee_image ? (
                                                                <img src={`/storage/${item.employee.employee_image}`} alt={item.employee.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <FaStopwatch size={12} />
                                                            )
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-normal text-slate-900">{item.user?.name || item.employee?.name}</span>
                                                            <span className="text-[10px] font-normal text-slate-400">{formatDateTime(item.created_at || item.start_time)}</span>
                                                        </div>
                                                        {item.type === 'comment' ? (
                                                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                                                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{item.comment}</p>
                                                                {item.file_path && (
                                                                    <a href={`/storage/${item.file_path}`} target="_blank" className="mt-3 flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 group hover:border-primary transition-all">
                                                                        <FaPaperclip size={10} className="text-primary" />
                                                                        <span className="text-xs font-normal text-slate-500 group-hover:text-primary truncate">{item.file_name}</span>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-slate-500 font-normal">
                                                                Logged <span className="text-emerald-600 font-normal">{item.duration_minutes} minutes</span> of work
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {activityFeed.length === 0 && (
                                                <div className="text-center py-10">
                                                    <FaComment className="mx-auto text-slate-200 mb-2" size={24} />
                                                    <p className="text-sm font-normal text-slate-400">No activity logged yet.</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Comment Form */}
                                        {!isViewer && (
                                            <form onSubmit={(e) => {
                                                e.preventDefault();
                                                const formData = new FormData();
                                                formData.append('comment', data.comment);
                                                if (data.file) formData.append('file', data.file);
                                                router.post(route('tasks.add-comment', task.id), formData, {
                                                    onSuccess: () => {
                                                        setData({ ...data, comment: '', file: null });
                                                        reset('comment', 'file');
                                                    },
                                                });
                                            }} className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                                                <textarea
                                                    value={data.comment}
                                                    onChange={e => setData('comment', e.target.value)}
                                                    placeholder="Write a comment or update status..."
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm placeholder-slate-400 min-h-[60px] resize-none"
                                                    required
                                                ></textarea>
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                                                    <div className="flex items-center gap-3">
                                                        <label className="cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-primary/10 hover:text-primary transition-all">
                                                            <input type="file" className="hidden" onChange={e => setData('file', e.target.files[0])} />
                                                            <FaPaperclip size={14} />
                                                        </label>
                                                        {data.file && <span className="text-xs font-normal text-primary truncate max-w-[150px]">{data.file.name}</span>}
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        disabled={processing || !data.comment}
                                                        className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-normal hover:brightness-110 transition-all flex items-center gap-2"
                                                    >
                                                        <FaPaperPlane size={10} /> Send Comment
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'checklist' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-2">
                                            {task.checklists?.map(item => (
                                                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${item.is_completed ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white border-slate-200'}`}>
                                                    <button
                                                        onClick={() => !isViewer && toggleChecklist(item.id)}
                                                        disabled={isViewer}
                                                        className={`w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 ${item.is_completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}
                                                    >
                                                        {item.is_completed && <FaCheckCircle size={10} />}
                                                    </button>
                                                    <span className={`text-sm font-normal flex-1 ${item.is_completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.item_text}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {!isViewer && (
                                            <form onSubmit={addChecklistItem} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={checklistInput}
                                                    onChange={(e) => setChecklistInput(e.target.value)}
                                                    placeholder="Add a checklist item..."
                                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                                                />
                                                <button type="submit" className="bg-slate-900 text-white px-5 py-2 rounded-lg text-xs font-normal flex items-center gap-2 hover:bg-slate-800">
                                                    <FaPlus size={10} /> Add
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'subtasks' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {task.subtasks?.map(sub => (
                                                <Link key={sub.id} href={route('tasks.show', sub.id)} className="bg-white p-4 rounded-lg border border-slate-200 hover:border-primary transition-all group shadow-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-normal uppercase ${getStatusColor(sub.status)}`}>{formatStatus(sub.status)}</span>
                                                        <FaChevronRight size={10} className="text-slate-300 group-hover:text-primary transition-all" />
                                                    </div>
                                                    <h4 className="text-sm font-normal text-slate-800 group-hover:text-primary transition-all truncate">{sub.title}</h4>
                                                </Link>
                                            ))}
                                        </div>
                                        {isLead && (
                                            <Link href={route('tasks.create', { parent_id: task.id, project_id: task.project_id })} className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-lg text-sm font-normal text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all">
                                                <FaPlus size={10} /> Add Subtask
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* Status & Actions Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 space-y-5 sticky top-4">
                            <div>
                                <h3 className="text-xs font-normal text-slate-500 uppercase tracking-normal mb-3">Status</h3>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(task.status)}`}></div>
                                    <span className="text-sm font-normal text-slate-800">{formatStatus(task.status)}</span>
                                </div>
                            </div>

                            {userRole === 'employee' && activeAssignment && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-normal text-slate-500 uppercase tracking-normal mb-3">Actions</h3>
                                    {activeAssignment.acceptance_status === 'pending' ? (
                                        <div className={`grid ${settings?.allow_rejection ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                                            <button onClick={() => handleAction('tasks.accept')} className="bg-emerald-600 text-white py-2.5 rounded-lg text-xs font-normal hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                                <FaCheckCircle size={12} /> Accept Task
                                            </button>
                                            {settings?.allow_rejection && (
                                                <button onClick={() => setShowRejectionModal(true)} className="bg-rose-50 text-rose-600 py-2.5 rounded-lg text-xs font-normal hover:bg-rose-100 transition-all border border-rose-100 flex items-center justify-center gap-2">
                                                    <FaBan size={12} /> Reject
                                                </button>
                                            )}
                                        </div>
                                    ) : activeAssignment.acceptance_status === 'accepted' ? (
                                        <div className="space-y-3">
                                            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] font-normal text-slate-400 uppercase">Progress</span>
                                                        <span className="text-xs font-normal text-primary">{data.progress_percentage}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        step="5"
                                                        value={data.progress_percentage}
                                                        onChange={e => setData('progress_percentage', e.target.value)}
                                                        onMouseUp={() => handleAction('tasks.update-progress', { progress_percentage: data.progress_percentage })}
                                                        onTouchEnd={() => handleAction('tasks.update-progress', { progress_percentage: data.progress_percentage })}
                                                        className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleAction('tasks.complete')}
                                                    className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-xs font-normal hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <FaCheckCircle size={12} /> Mark as Complete
                                                </button>
                                            </div>
                                            <button onClick={() => setShowExtensionModal(true)} className="w-full bg-white text-slate-500 py-2.5 rounded-lg text-xs font-normal border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                                <FaHourglassHalf size={12} /> Request Extension
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-rose-50 rounded-lg border border-rose-100 text-center">
                                            <p className="text-xs font-normal text-rose-600 uppercase mb-1">Task Rejected</p>
                                            <p className="text-xs text-rose-400 font-normal">{activeAssignment.rejection_reason}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-4">
                                <h3 className="text-xs font-normal text-slate-500 uppercase tracking-normal mb-3">Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">Due Date</label>
                                        <p className="text-sm font-normal text-slate-900">{formatDate(task.due_date)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">Estimated</label>
                                        <p className="text-sm font-normal text-slate-900">{task.estimated_hours ? `${task.estimated_hours} hours` : 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">Priority</label>
                                        <p className="text-sm font-normal text-slate-900">{task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">Created</label>
                                        <p className="text-sm font-normal text-slate-900">{formatDate(task.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-normal text-slate-500 uppercase tracking-normal">Assigned To</h3>
                                    {isLead && <Link href={route('task-assignments.index', { task_id: task.id })} className="text-[10px] font-normal text-primary uppercase hover:underline">Manage</Link>}
                                </div>
                                <div className="space-y-2">
                                    {task.assignments?.map(assign => (
                                        <div key={assign.id} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg border border-slate-100 group">
                                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-primary font-normal text-xs overflow-hidden shrink-0">
                                                {assign.employee?.employee_image ? (
                                                    <img src={`/storage/${assign.employee.employee_image}`} alt={assign.employee.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    assign.employee?.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-normal text-slate-900 truncate mb-1">{assign.employee?.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary" style={{ width: `${assign.progress_percentage}%` }}></div>
                                                    </div>
                                                    <span className="text-[10px] font-normal text-slate-400">{assign.progress_percentage}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!task.assignments || task.assignments.length === 0) && (
                                        <p className="text-center text-xs font-normal text-slate-300 py-4">No employees assigned</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showRejectionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-normal text-slate-900">Reject Task</h3>
                            <button onClick={() => setShowRejectionModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><FaTimes size={18} /></button>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">Please provide a reason for rejecting this task.</p>
                        <textarea
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-rose-500 transition-all min-h-[120px] resize-none"
                            placeholder="Reason for rejection..."
                            value={data.rejection_reason}
                            onChange={e => setData('rejection_reason', e.target.value)}
                        ></textarea>
                        <div className="mt-6 flex gap-3">
                            <button onClick={() => setShowRejectionModal(false)} className="flex-1 px-4 py-2.5 text-slate-600 font-normal text-sm hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                            <button
                                onClick={() => {
                                    handleAction('tasks.reject', { rejection_reason: data.rejection_reason });
                                    setShowRejectionModal(false);
                                }}
                                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-lg font-normal text-sm hover:bg-rose-700 transition-all disabled:opacity-50"
                                disabled={!data.rejection_reason}
                            >Confirm Rejection</button>
                        </div>
                    </div>
                </div>
            )}

            {showBlockingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-normal text-slate-900">{task.is_blocked ? 'Resolve Block' : 'Block Task'}</h3>
                            <button onClick={() => setShowBlockingModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><FaTimes size={18} /></button>
                        </div>
                        {!task.is_blocked ? (
                            <>
                                <p className="text-sm text-slate-500 mb-4">Explain why this task is currently blocked.</p>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-rose-500 transition-all min-h-[120px] resize-none"
                                    placeholder="Reason for blocking..."
                                    value={data.blocked_reason}
                                    onChange={e => setData('blocked_reason', e.target.value)}
                                ></textarea>
                                <div className="mt-6 flex gap-3">
                                    <button onClick={() => setShowBlockingModal(false)} className="flex-1 px-4 py-2.5 text-slate-600 font-normal text-sm hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                                    <button
                                        onClick={() => {
                                            handleAction('tasks.block', { blocked_reason: data.blocked_reason });
                                            setShowBlockingModal(false);
                                        }}
                                        className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-lg font-normal text-sm hover:bg-rose-700 transition-all disabled:opacity-50"
                                        disabled={!data.blocked_reason}
                                    >Block Task</button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <p className="mb-6 text-sm text-slate-500">Has the issue blocking this task been resolved?</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowBlockingModal(false)} className="flex-1 px-4 py-2.5 text-slate-600 font-normal text-sm hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                                    <button
                                        onClick={() => {
                                            handleAction('tasks.unblock');
                                            setShowBlockingModal(false);
                                        }}
                                        className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-normal text-sm hover:bg-emerald-700 transition-all"
                                    >Unblock Task</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showExtensionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-normal text-slate-900">Extension Request</h3>
                            <button onClick={() => setShowExtensionModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><FaTimes size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal mb-2 ml-1">Proposed New Deadline</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary transition-all"
                                    value={data.extension_request_date}
                                    onChange={e => setData('extension_request_date', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal mb-2 ml-1">Reason for Extension</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-primary transition-all min-h-[100px] resize-none"
                                    placeholder="Explain why more time is needed..."
                                    value={data.extension_reason}
                                    onChange={e => setData('extension_reason', e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button onClick={() => setShowExtensionModal(false)} className="flex-1 px-4 py-2.5 text-slate-600 font-normal text-sm hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                            <button
                                onClick={() => {
                                    handleAction('tasks.request-extension', {
                                        extension_request_date: data.extension_request_date,
                                        extension_reason: data.extension_reason
                                    });
                                    setShowExtensionModal(false);
                                }}
                                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-normal text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                                disabled={!data.extension_request_date || !data.extension_reason}
                            >Submit Request</button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
