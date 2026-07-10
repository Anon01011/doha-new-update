import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FaTasks, FaUsers, FaProjectDiagram, FaCheckCircle, FaArrowRight, FaTimes, FaFilter } from 'react-icons/fa';

export default function Assign({ tasks, employees, branches, selectedTaskId }) {
    const { data, setData, post, processing, errors } = useForm({
        task_id: selectedTaskId || '',
        employee_ids: [],
        remarks: '',
        branch_id: '', // For filtering if no task is selected
    });

    // Filter employees based on selected task or branch
    const filteredEmployees = employees.filter(emp => {
        if (data.task_id) {
            const task = tasks.find(t => t.id == data.task_id);
            return task && emp.company_id == task.branch_id;
        }
        if (data.branch_id) {
            return emp.company_id == data.branch_id;
        }
        return true;
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('task-assignments.store'));
    };

    const toggleEmployee = (id) => {
        const newIds = data.employee_ids.includes(id)
            ? data.employee_ids.filter(i => i !== id)
            : [...data.employee_ids, id];
        setData('employee_ids', newIds);
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Assign Task</h2>}>
            <Head title="Assign Task" />

            <div className="p-4 space-y-6 bg-slate-50 min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div>
                        <h1 className="text-xl font-normal text-slate-900">Assign Task</h1>
                        <p className="text-sm text-slate-500 mt-1">Select employees to assign to specific tasks.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Employee Selection */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-5">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <FaUsers size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-normal text-slate-800">Select Employees</h3>
                                        <p className="text-xs text-slate-400 font-normal">Choose employees to assign to this task</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {filteredEmployees.map(emp => (
                                        <button
                                            key={emp.id}
                                            type="button"
                                            onClick={() => toggleEmployee(emp.id)}
                                            className={`flex items-center gap-4 p-3 rounded-lg border transition-all text-left ${data.employee_ids.includes(emp.id) ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-normal text-sm overflow-hidden shrink-0 ${data.employee_ids.includes(emp.id) ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                                {emp.employee_image ? (
                                                    <img src={`/storage/${emp.employee_image}`} alt={emp.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    emp.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-normal truncate ${data.employee_ids.includes(emp.id) ? 'text-emerald-900' : 'text-slate-700'}`}>{emp.name}</p>
                                                <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal truncate">{emp.designation || 'Employee'}</p>
                                            </div>
                                            {data.employee_ids.includes(emp.id) && (
                                                <div className="text-emerald-600">
                                                    <FaCheckCircle size={16} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                    {filteredEmployees.length === 0 && (
                                        <div className="col-span-full py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <p className="text-sm font-normal text-slate-400">No employees found for the current selection.</p>
                                        </div>
                                    )}
                                </div>
                                {errors.employee_ids && <p className="text-rose-500 text-xs mt-3 font-normal">{errors.employee_ids}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal mb-2 ml-1">Remarks / Internal Note</label>
                            <textarea
                                value={data.remarks}
                                onChange={e => setData('remarks', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:border-primary outline-none transition-all min-h-[120px] resize-none shadow-sm"
                                placeholder="Add any specific instructions or notes for this assignment..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Task Selection */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-5">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-primary">
                                        <FaTasks size={18} />
                                    </div>
                                    <h3 className="text-base font-normal text-slate-800">Task Selection</h3>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal mb-2 ml-1">Select Task <span className="text-rose-500">*</span></label>
                                        <select
                                            value={data.task_id}
                                            onChange={e => {
                                                setData('task_id', e.target.value);
                                                setData('employee_ids', []);
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-primary transition-all cursor-pointer"
                                            required
                                        >
                                            <option value="">Choose a task...</option>
                                            {tasks.map(task => (
                                                <option key={task.id} value={task.id}>{task.title}</option>
                                            ))}
                                        </select>
                                        {errors.task_id && <p className="text-rose-500 text-xs mt-2 font-normal">{errors.task_id}</p>}
                                    </div>

                                    {!data.task_id && (
                                        <div>
                                            <label className="block text-xs font-normal text-slate-500 uppercase tracking-normal mb-2 ml-1">Filter by Branch</label>
                                            <select
                                                value={data.branch_id}
                                                onChange={e => {
                                                    setData('branch_id', e.target.value);
                                                    setData('employee_ids', []);
                                                }}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-primary transition-all cursor-pointer"
                                            >
                                                <option value="">All Branches</option>
                                                {branches.map(branch => (
                                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-slate-900 text-white py-4 rounded-lg font-normal uppercase tracking-normal text-xs hover:bg-primary transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 group"
                            >
                                {processing ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Assign Tasks
                                        <FaArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                            <Link
                                href={route('task-assignments.index')}
                                className="w-full flex items-center justify-center py-3 rounded-lg text-xs font-normal uppercase tracking-normal text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                            >
                                <FaTimes size={10} className="mr-2" /> Cancel
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
