import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { 
    FaChalkboardTeacher, FaUsers, FaSearch, FaCheckCircle, FaTimesCircle, 
    FaSave, FaArrowLeft, FaShieldAlt, FaInfoCircle, FaLayerGroup, 
    FaChevronDown, FaPlusCircle, FaMinusCircle, FaUserGraduate
} from 'react-icons/fa';
import Avatar from '@/Components/Avatar';

export default function Assign({ trainings, employees, selectedTrainingId }) {
    const { data, setData, post, processing, errors } = useForm({
        training_id: selectedTrainingId || '',
        employee_ids: [],
        remarks: ''
    });

    const [searchTerm, setSearchTerm] = useState('');

    const filteredEmployees = useMemo(() => {
        if (!employees) return [];
        return employees.filter(employee =>
            employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employees, searchTerm]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('training-assignments.store'));
    };

    const toggleEmployee = (employeeId) => {
        const currentIds = data.employee_ids;
        setData('employee_ids',
            currentIds.includes(employeeId)
                ? currentIds.filter(id => id !== employeeId)
                : [...currentIds, employeeId]
        );
    };

    const selectAllFiltered = () => {
        const idsToAdd = filteredEmployees.map(e => e.id);
        const newIds = [...new Set([...data.employee_ids, ...idsToAdd])];
        setData('employee_ids', newIds);
    };

    const deselectAllFiltered = () => {
        const idsToRemove = filteredEmployees.map(e => e.id);
        const newIds = data.employee_ids.filter(id => !idsToRemove.includes(id));
        setData('employee_ids', newIds);
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Assign Training</h2>}>
            <Head title="Assign Training" />

            <div className="py-4 px-4 sm:px-6 lg:px-8 space-y-4">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <FaUserGraduate size={100} />
                    </div>
                    <div className="flex items-center gap-3 relative z-10">
                        <Link 
                            href={route('trainings.index')} 
                            className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={13} />
                        </Link>
                        <div>
                            <h2 className="text-base font-normal text-slate-900 uppercase">Assign Training</h2>
                            <p className="text-[10px] font-normal text-slate-400 uppercase flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                                Select employees to enroll
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="w-full sm:w-auto px-5 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:bg-primary transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                        >
                            {processing ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaSave size={10} className="text-white" />}
                            {processing ? 'Saving...' : 'Save Assignments'}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    {/* Employee Selection */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <h3 className="text-sm font-normal text-slate-900 uppercase flex items-center gap-2">
                                    <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center"><FaUsers size={13}/></div>
                                    Select Employees
                                    <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-normal tracking-normal ml-1">
                                        {data.employee_ids.length} Selected
                                    </span>
                                </h3>

                                <div className="relative group w-full md:w-72">
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={11} />
                                    <input
                                        type="text"
                                        placeholder="Search employees..."
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-normal uppercase focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50 flex flex-col h-[500px]">
                                {/* Toolbar */}
                                <div className="bg-white px-4 py-2.5 border-b border-slate-100 flex justify-between items-center">
                                    <span className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">
                                        {filteredEmployees.length} employees shown
                                    </span>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={selectAllFiltered} className="text-[9px] font-normal text-primary uppercase tracking-normal hover:brightness-110 transition-all flex items-center gap-1.5">
                                            <FaPlusCircle size={9} /> Select All
                                        </button>
                                        <span className="text-slate-200">|</span>
                                        <button type="button" onClick={deselectAllFiltered} className="text-[9px] font-normal text-rose-500 uppercase tracking-normal hover:brightness-110 transition-all flex items-center gap-1.5">
                                            <FaMinusCircle size={9} /> Deselect All
                                        </button>
                                    </div>
                                </div>

                                {/* Employee List */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                    {filteredEmployees.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {filteredEmployees.map(employee => {
                                                const isSelected = data.employee_ids.includes(employee.id);
                                                return (
                                                    <label
                                                        key={employee.id}
                                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 relative overflow-hidden group ${isSelected
                                                            ? 'bg-primary/5 border-primary shadow-sm shadow-primary/5'
                                                            : 'bg-white border-transparent hover:border-slate-200'
                                                            }`}
                                                    >
                                                        <div className="relative flex-shrink-0">
                                                            <Avatar 
                                                                name={employee.name} 
                                                                src={employee.profile_photo_url} 
                                                                size="h-9 w-9" 
                                                                className={`rounded-lg transition-all ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`} 
                                                            />
                                                            {isSelected && (
                                                                <div className="absolute -top-1 -right-1 bg-primary text-white rounded-lg p-0.5 shadow border-2 border-white">
                                                                    <FaCheckCircle size={8} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-[11px] font-normal uppercase tracking-normal truncate ${isSelected ? 'text-primary' : 'text-slate-900'}`}>{employee.name}</p>
                                                            <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">{employee.employee_code}</p>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleEmployee(employee.id)}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200">
                                                <FaSearch size={20} />
                                            </div>
                                            <p className="text-[10px] font-normal uppercase tracking-normal text-slate-400">No employees found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {errors.employee_ids && <p className="text-[10px] font-normal text-rose-500 mt-1 uppercase flex items-center gap-1.5"><FaTimesCircle size={10} /> {errors.employee_ids}</p>}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4 sticky top-4">
                        {/* Training Selection */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
                            <h3 className="text-sm font-normal text-slate-900 uppercase flex items-center gap-2">
                                <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center"><FaChalkboardTeacher size={13}/></div>
                                Select Training
                            </h3>

                            <div className="space-y-2">
                                <label className="text-[10px] font-normal text-slate-500 uppercase ml-1">Training Program</label>
                                <div className="relative group">
                                    <FaLayerGroup className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={11} />
                                    <select
                                        value={data.training_id}
                                        onChange={(e) => setData('training_id', e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none appearance-none cursor-pointer text-[10px] font-normal uppercase"
                                        required
                                    >
                                        <option value="">Select training...</option>
                                        {trainings?.map(training => (
                                            <option key={training.id} value={training.id}>
                                                {training.title.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                    <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={9} />
                                </div>
                                {errors.training_id && <p className="text-[10px] font-normal text-rose-500 mt-1 uppercase flex items-center gap-1.5"><FaTimesCircle size={10} /> {errors.training_id}</p>}
                            </div>
                        </div>

                        {/* Remarks */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
                            <h3 className="text-sm font-normal text-slate-900 uppercase flex items-center gap-2">
                                <div className="w-7 h-7 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center"><FaInfoCircle size={13}/></div>
                                Remarks
                            </h3>

                            <div className="space-y-2">
                                <label className="text-[10px] font-normal text-slate-500 uppercase ml-1">Notes (optional)</label>
                                <textarea
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-normal uppercase focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none resize-none min-h-[100px]"
                                    placeholder="ADD NOTES FOR THIS ASSIGNMENT..."
                                />
                                {errors.remarks && <p className="text-[10px] font-normal text-rose-500 mt-1 uppercase">{errors.remarks}</p>}
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="bg-slate-900 rounded-lg p-4 shadow-sm">
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={processing}
                                className="w-full py-2.5 bg-primary text-white rounded-lg text-[10px] font-normal uppercase tracking-normal hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaSave size={12} className="text-white" />}
                                <span>{processing ? 'Saving...' : 'Save Assignments'}</span>
                            </button>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex gap-3">
                            <FaShieldAlt className="text-primary shrink-0 mt-0.5" size={13} />
                            <p className="text-[9px] font-normal text-slate-500 uppercase leading-relaxed">
                                Assigned employees will be notified. Cancellations require admin approval.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
