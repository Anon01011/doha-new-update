import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm, Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import EmployeeFieldIcons from '@/Components/EmployeeFieldIcons';
import Lightbox from '@/Components/Lightbox';
import Avatar from '@/Components/Avatar';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { FiUser, FiCreditCard, FiMapPin, FiBriefcase, FiClock, FiDollarSign, FiFileText, FiPlus, FiTrash2, FiArrowRight, FiEye, FiMaximize2, FiFile, FiAlertCircle } from 'react-icons/fi';

// ... SectionHeader and InputWrapper same as before ...

const SectionHeader = ({ title, icon, color = "indigo" }) => (
    <div className="relative mb-8 mt-12 first:mt-0">
        <div className={`absolute -left-4 top-0 bottom-0 w-1 bg-${color}-600 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]`}></div>
        <div className="flex items-center gap-3 px-2">
            <span className={`p-2 bg-${color}-600 rounded-lg text-xl shadow-md border border-${color}-700 flex items-center justify-center text-white`}>{icon}</span>
            <h3 className="text-xl font-semibold text-slate-900 tracking-normal">{title}</h3>
        </div>
    </div>
);

const InputWrapper = ({ label, icon, error, children, required = false }) => (
    <div className="space-y-1.5 group">
        <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 uppercase tracking-normal ml-1 group-focus-within:text-indigo-600 transition-colors">
            {icon && <span className="opacity-70">{icon}</span>}
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <div className="relative">
            {children}
        </div>
        {error && <p className="text-[10px] font-normal text-rose-500 mt-1 ml-1 animate-pulse">{error}</p>}
    </div>
);

const inputClasses = "block w-full rounded-lg border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-slate-700 transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400 hover:border-slate-300";

export default function CreateEmployee(props) {
    const { appSettings } = usePage().props;
    const currency = appSettings?.currency || 'QAR';

    const { companies = [], departments = [], constants = {}, salaryComponents = [], availableRoles = [] } = props;
    const [filteredDepartments, setFilteredDepartments] = useState([]);
    const [autoGenerate, setAutoGenerate] = useState(false);
    const [resumePreviewUrl, setResumePreviewUrl] = useState(null);
    const [departmentEmployees, setDepartmentEmployees] = useState([]);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        employee_code: '',
        gender: '',
        dob: '',
        mobile: '',
        email: '',
        designation: '',
        nationality: '',
        sponsor: '',
        company_id: '',
        department_id: '',
        location: '',
        joined_date: '',
        rejoined_date: '',
        shift: '',
        visa_type: '',
        visa_designation: '',
        employee_category: '',
        contract_duration: '',
        exit_status: '',
        payment_type: '',
        leave_status: '',
        basic_salary: '',
        reported_to: '',
        manual_status: '',
        employee_image: null,
        agreement_doc: null,
        resume_doc: null,

        other_docs: null,
        passport_number: '',
        passport_expiry_date: '',
        passport_file: null,
        qid_number: '',
        qid_expiry_date: '',
        qid_file: null,
        role: '',
        salary_structures: [],
        food_handler_file: null,
        food_handler_expiry_date: '',
        health_card_number: '',
        health_card_expiry_date: '',
        contract_issue_date: '',
        contract_expiry_date: '',
        weekly_offs: [],
    });

    useEffect(() => {
        if (data.company_id) {
            axios.get(route('api.departments.byBranch', { branch_id: data.company_id }))
                .then(res => setFilteredDepartments(res.data.departments))
                .catch(() => setFilteredDepartments([]));
        } else {
            setFilteredDepartments([]);
        }
    }, [data.company_id]);

    useEffect(() => {
        if (data.department_id) {
            axios.get(route('api.employees.byDepartment', { department_id: data.department_id }))
                .then(res => setDepartmentEmployees(res.data.employees))
                .catch(() => setDepartmentEmployees([]));
        } else {
            setDepartmentEmployees([]);
        }
    }, [data.department_id]);

    // Auto-update status based on exit status
    useEffect(() => {
        if (['Abscond', 'Terminated', 'Resigned', 'End of Contract'].includes(data.exit_status)) {
            setData('manual_status', 'inactive');
        }
    }, [data.exit_status]);

    const [previewType, setPreviewType] = useState('auto');

    const [confirmingAction, setConfirmingAction] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'info',
        hideCancel: false
    });

    const closeModal = () => setConfirmingAction(prev => ({ ...prev, show: false }));

    const [newWeeklyOff, setNewWeeklyOff] = useState({
        weekly_off_day: '',
        effective_date: ''
    });

    const addWeeklyOff = () => {
        if (!newWeeklyOff.weekly_off_day || !newWeeklyOff.effective_date) return;
        setData('weekly_offs', [
            ...data.weekly_offs,
            { ...newWeeklyOff }
        ]);
        setNewWeeklyOff({ weekly_off_day: '', effective_date: '' });
    };

    const removeWeeklyOff = (index) => {
        setData('weekly_offs', data.weekly_offs.filter((_, i) => i !== index));
    };

    const handleResumeChange = (e) => {
        const file = e.target.files[0];
        setData('resume_doc', file);
        if (file) {
            setResumePreviewUrl(URL.createObjectURL(file));
            setPreviewType(file.type);
        } else {
            setResumePreviewUrl(null);
            setPreviewType('auto');
        }
    };

    const handleFileChange = (field, e) => {
        const file = e.target.files[0];
        if (file && file.size > 10 * 1024 * 1024) { // 10MB
            setConfirmingAction({
                show: true,
                title: 'File Too Large',
                message: 'File size exceeds 10MB limit. Please upload a smaller file.',
                type: 'warning',
                hideCancel: true,
                onConfirm: closeModal
            });
            e.target.value = ''; // Reset input
            return;
        }
        setData(field, file);
        if (field === 'employee_image' && file) {
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const addSalaryStructure = () => {
        setData('salary_structures', [
            ...data.salary_structures,
            { component_id: '', amount: 0, name: '', type: '', value_type: 'flat' }
        ]);
    };

    const removeSalaryStructure = (index) => {
        const updated = [...data.salary_structures];
        updated.splice(index, 1);
        setData('salary_structures', updated);
    };

    const updateSalaryStructure = (index, field, value) => {
        const updated = [...data.salary_structures];
        if (field === 'component_id') {
            const comp = salaryComponents.find(c => c.id == value);
            updated[index].component_id = value;
            updated[index].name = comp?.name;
            updated[index].type = comp?.type;
            updated[index].value_type = comp?.value_type || 'flat';
            updated[index].amount = comp?.default_amount || 0;
        } else {
            updated[index][field] = value;
        }
        setData('salary_structures', updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Auto-add pending weekly off if the user selected one but forgot to click "Add Entry"
        if (newWeeklyOff.weekly_off_day && newWeeklyOff.effective_date) {
            const exists = data.weekly_offs.some(
                off => off.weekly_off_day === newWeeklyOff.weekly_off_day && 
                       off.effective_date === newWeeklyOff.effective_date
            );
            if (!exists) {
                data.weekly_offs.push({ ...newWeeklyOff });
            }
        }

        // If autoGenerate is on, ensure employee_code is sent as empty
        if (autoGenerate) {
            data.employee_code = '';
        }
        
        post(route('employees.store'));
    };

    const isPreviewable = previewType?.includes('pdf') || previewType?.includes('image') || ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].some(ext => resumePreviewUrl?.toLowerCase().endsWith(ext));

    return (
        <AuthenticatedLayout header={
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-normal text-slate-800 tracking-normal">Add Employee</h2>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 text-sm font-normal text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        }>
            <Head title="Create Employee" />

            <div className={`min-h-[calc(100vh-120px)] bg-slate-50/50 relative ${processing ? 'pointer-events-none opacity-60' : ''}`}>
                {processing && (
                    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
                        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                            <div className="text-center">
                                <p className="text-sm font-normal text-slate-800 uppercase tracking-normal">Processing</p>
                                <p className="text-[10px] text-slate-400 font-normal mt-1">Please wait while we save the record...</p>
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex flex-col lg:flex-row h-full">

                    {/* Left Column - Form (55%) */}
                    <div className="w-full lg:w-[55%] p-6 md:p-10 lg:p-12 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-12">

                            {/* Personal Info Section */}
                            <section>
                                <SectionHeader title="Personal Details" icon={<FiUser />} color="indigo" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputWrapper label="Full Name" icon={EmployeeFieldIcons.name} error={errors.name} required>
                                        <input type="text" className={inputClasses} value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. John Doe" required />
                                    </InputWrapper>

                                    <InputWrapper label="Employee Code" icon={EmployeeFieldIcons.employee_code} error={errors.employee_code}>
                                        <div className="flex flex-col gap-2">
                                            <input
                                                type="text"
                                                className={`${inputClasses} ${autoGenerate ? 'bg-slate-100 text-slate-400' : ''}`}
                                                value={autoGenerate ? 'SYSTEM GENERATED' : data.employee_code}
                                                onChange={e => !autoGenerate && setData('employee_code', e.target.value)}
                                                readOnly={autoGenerate}
                                                placeholder="EMP-001"
                                            />
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={autoGenerate}
                                                    onChange={e => setAutoGenerate(e.target.checked)}
                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                                                />
                                                <span className="text-[10px] font-normal text-slate-500 uppercase">Auto-generate code</span>
                                            </label>
                                        </div>
                                    </InputWrapper>

                                    <InputWrapper label="Gender" icon={EmployeeFieldIcons.gender} error={errors.gender} required>
                                        <select className={inputClasses} value={data.gender} onChange={e => setData('gender', e.target.value)} required>
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </InputWrapper>

                                    <InputWrapper label="Date of Birth" icon={EmployeeFieldIcons.dob} error={errors.dob}>
                                        <input type="date" className={inputClasses} value={data.dob} onChange={e => setData('dob', e.target.value)} />
                                    </InputWrapper>

                                    <InputWrapper label="Nationality" icon={EmployeeFieldIcons.nationality} error={errors.nationality}>
                                        <input type="text" className={inputClasses} value={data.nationality} onChange={e => setData('nationality', e.target.value)} placeholder="e.g. Qatari" />
                                    </InputWrapper>

                                    <InputWrapper label="Profile Image" icon={EmployeeFieldIcons.employee_image} error={errors.employee_image}>
                                        <input type="file" className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-normal file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all" onChange={e => handleFileChange('employee_image', e)} />
                                        {imagePreview && (
                                            <div className="mt-3 flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-100 shadow-sm w-fit">
                                                <Avatar
                                                    src={imagePreview}
                                                    name={data.name}
                                                    size="sm"
                                                    isLocal={true}
                                                />
                                                <span className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">New Identity</span>
                                            </div>
                                        )}
                                    </InputWrapper>
                                </div>

                            </section>

                            {/* Identity Documents Section */}
                            <section>
                                <SectionHeader title="Documents" icon={<FiCreditCard />} color="indigo" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputWrapper label="Passport Number" icon={EmployeeFieldIcons.passport} error={errors.passport_number}>
                                        <input type="text" className={inputClasses} value={data.passport_number} onChange={e => setData('passport_number', e.target.value)} placeholder="Enter Passport No." />
                                    </InputWrapper>

                                    <InputWrapper label="Passport Expiry" error={errors.passport_expiry_date}>
                                        <input type="date" className={inputClasses} value={data.passport_expiry_date} onChange={e => setData('passport_expiry_date', e.target.value)} />
                                    </InputWrapper>

                                    <InputWrapper label="Passport Copy" error={errors.passport_file} className="md:col-span-2">
                                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-normal file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all" onChange={e => handleFileChange('passport_file', e)} />
                                    </InputWrapper>

                                    <InputWrapper label="QID Number" icon={EmployeeFieldIcons.card} error={errors.qid_number}>
                                        <input type="text" className={inputClasses} value={data.qid_number} onChange={e => setData('qid_number', e.target.value)} placeholder="Enter QID No." />
                                    </InputWrapper>

                                    <InputWrapper label="QID Expiry" error={errors.qid_expiry_date}>
                                        <input type="date" className={inputClasses} value={data.qid_expiry_date} onChange={e => setData('qid_expiry_date', e.target.value)} />
                                    </InputWrapper>

                                    <InputWrapper label="QID Copy" error={errors.qid_file} className="md:col-span-2">
                                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-normal file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all" onChange={e => handleFileChange('qid_file', e)} />
                                    </InputWrapper>

                                    {/* New Documents */}
                                    <InputWrapper label="Health Card Number" icon={EmployeeFieldIcons.card} error={errors.health_card_number}>
                                        <input type="text" className={inputClasses} value={data.health_card_number} onChange={e => setData('health_card_number', e.target.value)} placeholder="Enter Health Card No." />
                                    </InputWrapper>

                                    <InputWrapper label="Health Card Expiry" error={errors.health_card_expiry_date}>
                                        <input type="date" className={inputClasses} value={data.health_card_expiry_date} onChange={e => setData('health_card_expiry_date', e.target.value)} />
                                    </InputWrapper>

                                    <InputWrapper label="Food Handler Expiry" error={errors.food_handler_expiry_date}>
                                        <input type="date" className={inputClasses} value={data.food_handler_expiry_date} onChange={e => setData('food_handler_expiry_date', e.target.value)} />
                                    </InputWrapper>

                                    <InputWrapper label="Food Handler Copy" error={errors.food_handler_file}>
                                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-normal file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all" onChange={e => handleFileChange('food_handler_file', e)} />
                                    </InputWrapper>
                                </div>
                            </section>

                            {/* Contact & Location Section */}
                            <section>
                                <SectionHeader title="Contact Information" icon={<FiMapPin />} color="rose" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputWrapper label="Mobile Number" icon={EmployeeFieldIcons.mobile} error={errors.mobile}>
                                        <input type="text" className={inputClasses} value={data.mobile} onChange={e => setData('mobile', e.target.value)} placeholder="+974 XXXX XXXX" />
                                    </InputWrapper>
                                    <InputWrapper label="Email Address" icon={EmployeeFieldIcons.email} error={errors.email}>
                                        <input type="email" className={inputClasses} value={data.email} onChange={e => setData('email', e.target.value)} placeholder="john@example.com" />
                                    </InputWrapper>
                                    <InputWrapper label="Current Location" icon={EmployeeFieldIcons.location} error={errors.location} className="md:col-span-2">
                                        <input type="text" className={inputClasses} value={data.location} onChange={e => setData('location', e.target.value)} placeholder="e.g. Doha, Qatar" />
                                    </InputWrapper>
                                </div>
                            </section>

                            {/* Employment Details Section */}
                            <section>
                                <SectionHeader title="Work Information" icon={<FiBriefcase />} color="emerald" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputWrapper label="Branch / Company" icon={EmployeeFieldIcons.company} error={errors.company_id} required>
                                        <select className={inputClasses} value={data.company_id} onChange={e => setData('company_id', e.target.value)} required>
                                            <option value="">Select Branch</option>
                                            {companies.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                                        </select>
                                    </InputWrapper>

                                    <InputWrapper label="Department" icon={EmployeeFieldIcons.department} error={errors.department_id}>
                                        <select className={inputClasses} value={data.department_id} onChange={e => setData('department_id', e.target.value)} disabled={!data.company_id}>
                                            <option value="">Select Department</option>
                                            {filteredDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </InputWrapper>

                                    <InputWrapper label="Designation" icon={EmployeeFieldIcons.designation} error={errors.designation}>
                                        <input type="text" className={inputClasses} value={data.designation} onChange={e => setData('designation', e.target.value)} placeholder="e.g. Senior Manager" />
                                    </InputWrapper>

                                    <InputWrapper label="Reported To" icon={EmployeeFieldIcons.reported_to} error={errors.reported_to}>
                                        <select className={inputClasses} value={data.reported_to} onChange={e => setData('reported_to', e.target.value)} disabled={!data.department_id}>
                                            <option value="">Select Manager</option>
                                            {departmentEmployees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                                        </select>
                                    </InputWrapper>

                                    <InputWrapper label="System Role" icon={EmployeeFieldIcons.employee_category} error={errors.role}>
                                        <select className={inputClasses} value={data.role} onChange={e => setData('role', e.target.value)}>
                                            <option value="">No System Role</option>
                                            {availableRoles.map(role => (
                                                <option key={role.id} value={role.slug}>{role.name}</option>
                                            ))}
                                        </select>
                                        {data.role && (
                                            <p className="text-[10px] font-normal text-amber-500 mt-1 ml-1">
                                                * Providing an email is required to create a system user account.
                                            </p>
                                        )}
                                    </InputWrapper>

                                    <InputWrapper label="Joined Date" icon={EmployeeFieldIcons.joined_date} error={errors.joined_date}>
                                        <input type="date" className={inputClasses} value={data.joined_date} onChange={e => setData('joined_date', e.target.value)} />
                                    </InputWrapper>

                                    <InputWrapper label="Rejoined Date" icon={EmployeeFieldIcons.rejoined_date} error={errors.rejoined_date}>
                                        <input type="date" className={inputClasses} value={data.rejoined_date} onChange={e => setData('rejoined_date', e.target.value)} />
                                    </InputWrapper>
                                </div>
                            </section>

                            {/* Work & Shift Section */}
                            <section>
                                <SectionHeader title="Work Schedule" icon={<FiClock />} color="amber" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputWrapper label="Shift" icon={EmployeeFieldIcons.shift} error={errors.shift}>
                                        <select className={inputClasses} value={data.shift} onChange={e => setData('shift', e.target.value)}>
                                            <option value="">Select Shift</option>
                                            {(constants.shifts || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </InputWrapper>

                                    <InputWrapper label="Employee Category" icon={EmployeeFieldIcons.employee_category} error={errors.employee_category}>
                                        <select className={inputClasses} value={data.employee_category} onChange={e => setData('employee_category', e.target.value)}>
                                            <option value="">Select Category</option>
                                            {(constants.employee_categories || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </InputWrapper>

                                    <InputWrapper label="Contract Duration" icon={EmployeeFieldIcons.contract_duration} error={errors.contract_duration}>
                                        <select className={inputClasses} value={data.contract_duration} onChange={e => setData('contract_duration', e.target.value)}>
                                            <option value="">Select Duration</option>
                                            {(constants.contract_durations || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </InputWrapper>

                                    <InputWrapper label="Contract Issue Date" error={errors.contract_issue_date}>
                                        <input type="date" className={inputClasses} value={data.contract_issue_date} onChange={e => setData('contract_issue_date', e.target.value)} />
                                    </InputWrapper>

                                    <InputWrapper label="Contract Expiry Date" error={errors.contract_expiry_date}>
                                        <input type="date" className={inputClasses} value={data.contract_expiry_date} onChange={e => setData('contract_expiry_date', e.target.value)} />
                                    </InputWrapper>

                                    <InputWrapper label="Status" error={errors.manual_status}>
                                        <select className={inputClasses} value={data.manual_status} onChange={e => setData('manual_status', e.target.value)}>
                                            <option value="">Auto (by attendance)</option>
                                            <option value="active">Active</option>
                                            <option value="waiting">Pending Approval</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </InputWrapper>

                                    {/* Staff-wise Weekly Offs Sub-section */}
                                    <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-4 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-800 uppercase tracking-normal">Staff-wise Weekly Off Configurations</span>
                                            <span className="text-[10px] text-slate-400 font-normal">(Overrides branch settings)</span>
                                        </div>

                                        {data.weekly_offs.length > 0 ? (
                                            <div className="overflow-hidden border border-slate-200 rounded-xl bg-slate-50/20">
                                                <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-normal">
                                                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                        <tr>
                                                            <th className="px-4 py-2">Weekly Off Day</th>
                                                            <th className="px-4 py-2">Effective Date</th>
                                                            <th className="px-4 py-2 text-right">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                                                        {data.weekly_offs.map((off, index) => (
                                                            <tr key={index}>
                                                                <td className="px-4 py-2.5 font-semibold text-primary">{off.weekly_off_day}</td>
                                                                <td className="px-4 py-2.5">{off.effective_date}</td>
                                                                <td className="px-4 py-2.5 text-right">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeWeeklyOff(index)}
                                                                        className="text-rose-500 hover:text-rose-700 font-medium"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 font-normal italic">No staff-wise weekly off configured. Falls back to branch setting.</p>
                                        )}

                                        <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 mt-2">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Add Weekly Off Entry</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                                <div className="space-y-1">
                                                    <label className="block text-[9px] font-normal text-slate-400 uppercase tracking-normal">Weekly Off Day</label>
                                                    <select
                                                        value={newWeeklyOff.weekly_off_day}
                                                        onChange={e => setNewWeeklyOff({ ...newWeeklyOff, weekly_off_day: e.target.value })}
                                                        className={inputClasses}
                                                    >
                                                        <option value="">Select Day</option>
                                                        <option value="Sunday">Sunday</option>
                                                        <option value="Monday">Monday</option>
                                                        <option value="Tuesday">Tuesday</option>
                                                        <option value="Wednesday">Wednesday</option>
                                                        <option value="Thursday">Thursday</option>
                                                        <option value="Friday">Friday</option>
                                                        <option value="Saturday">Saturday</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="block text-[9px] font-normal text-slate-400 uppercase tracking-normal">Effective Date</label>
                                                    <input
                                                        type="date"
                                                        value={newWeeklyOff.effective_date}
                                                        onChange={e => setNewWeeklyOff({ ...newWeeklyOff, effective_date: e.target.value })}
                                                        className={inputClasses}
                                                    />
                                                </div>
                                                <div>
                                                    <button
                                                        type="button"
                                                        onClick={addWeeklyOff}
                                                        disabled={!newWeeklyOff.weekly_off_day || !newWeeklyOff.effective_date}
                                                        className="w-full bg-primary text-white py-2.5 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
                                                    >
                                                        Add Entry
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Visa & Financial Section */}
                            <section>
                                <SectionHeader title="Salary & Visa" icon={<FiDollarSign />} color="blue" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputWrapper label="Visa Type" icon={EmployeeFieldIcons.visa_type} error={errors.visa_type}>
                                        <select className={inputClasses} value={data.visa_type} onChange={e => setData('visa_type', e.target.value)}>
                                            <option value="">Select Visa Type</option>
                                            {(constants.visa_types || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </InputWrapper>

                                    <InputWrapper label="Visa Designation" icon={EmployeeFieldIcons.visa_designation} error={errors.visa_designation}>
                                        <select className={inputClasses} value={data.visa_designation} onChange={e => setData('visa_designation', e.target.value)}>
                                            <option value="">Select Visa Designation</option>
                                            {(constants.visa_designations || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </InputWrapper>

                                    <InputWrapper label="Sponsor" icon={EmployeeFieldIcons.sponsor} error={errors.sponsor}>
                                        <input type="text" className={inputClasses} value={data.sponsor} onChange={e => setData('sponsor', e.target.value)} placeholder="e.g. Earth Doha" />
                                    </InputWrapper>

                                    <InputWrapper label="Payment Type" icon={EmployeeFieldIcons.payment_type} error={errors.payment_type}>
                                        <select className={inputClasses} value={data.payment_type} onChange={e => setData('payment_type', e.target.value)}>
                                            <option value="">Select Payment Type</option>
                                            {(appSettings?.payment_methods 
                                                ? appSettings.payment_methods.split(',').map(m => m.trim()) 
                                                : (constants.payment_types || [])
                                            ).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </InputWrapper>

                                    <InputWrapper label={`Basic Salary (${currency})`} error={errors.basic_salary}>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-normal text-xs">{currency}</span>
                                            <input type="number" step="0.01" className={`${inputClasses} pl-12 font-normal text-indigo-600`} value={data.basic_salary} onChange={e => setData('basic_salary', e.target.value)} placeholder="0.00" />
                                        </div>
                                    </InputWrapper>
                                </div>

                                {/* Dynamic Salary Structures */}
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h4 className="text-[10px] font-normal text-slate-800 uppercase tracking-[0.2em]">Salary Components</h4>
                                            <p className="text-[9px] text-slate-400 font-normal mt-0.5">Automated components for monthly payroll</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addSalaryStructure}
                                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-normal transition-all border border-indigo-100 shadow-sm flex items-center gap-1.5 hover:bg-indigo-100"
                                        >
                                            <FiPlus className="w-4 h-4" />
                                            Add Component
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {data.salary_structures.map((item, index) => (
                                            <div key={index} className="flex flex-wrap md:flex-nowrap items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="flex-1 min-w-[200px]">
                                                    <select
                                                        className={`${inputClasses} py-2 text-xs`}
                                                        value={item.component_id}
                                                        onChange={e => updateSalaryStructure(index, 'component_id', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Select Component...</option>
                                                        {salaryComponents.map(c => (
                                                            <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-24">
                                                    <select
                                                        className={`${inputClasses} py-2 text-xs font-normal`}
                                                        value={item.value_type || 'flat'}
                                                        onChange={e => updateSalaryStructure(index, 'value_type', e.target.value)}
                                                    >
                                                        <option value="flat">Flat</option>
                                                        <option value="percentage">%</option>
                                                    </select>
                                                </div>
                                                <div className="w-full md:w-32 relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-normal text-[10px] uppercase">
                                                        {item.value_type === 'percentage' ? '%' : currency}
                                                    </span>
                                                    <input
                                                        type="number" step="0.01"
                                                        className={`${inputClasses} py-2 pl-12 text-xs font-normal ${item.type === 'deduction' ? 'text-rose-600' : 'text-emerald-600'}`}
                                                        value={item.amount}
                                                        onChange={e => updateSalaryStructure(index, 'amount', e.target.value)}
                                                        placeholder="0.00"
                                                        required
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSalaryStructure(index)}
                                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {data.salary_structures.length === 0 && (
                                            <div className="text-center py-8 bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-200">
                                                <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal">No regular components assigned</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Documents Section */}
                            <section>
                                <SectionHeader title="Supporting Documents" icon={<FiFileText />} color="slate" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputWrapper label="Contract Document" error={errors.agreement_doc}>
                                        <input type="file" className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-normal file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-all" onChange={e => setData('agreement_doc', e.target.files[0])} />
                                    </InputWrapper>

                                    <InputWrapper label="Resume Document" error={errors.resume_doc}>
                                        <input type="file" className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-normal file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-all" onChange={handleResumeChange} />
                                    </InputWrapper>

                                    <InputWrapper label="Other Documents" error={errors.other_docs}>
                                        <input type="file" className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-normal file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-all" onChange={e => setData('other_docs', e.target.files[0])} />
                                    </InputWrapper>
                                </div>
                            </section>

                            {/* Footer Actions */}
                            <div className="flex justify-end items-center pt-12 border-t border-slate-200">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="relative group overflow-hidden bg-slate-900 text-white px-10 py-4 rounded-lg font-normal text-sm uppercase tracking-normal shadow-2xl shadow-slate-900/20 hover:shadow-indigo-500/40 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {processing ? 'Processing...' : 'Add Employee'}
                                        {!processing && <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column - Resume Preview (45%) */}
                    <div className="w-full lg:w-[45%] bg-slate-100/50 border-l border-slate-200 lg:sticky lg:top-0 h-[500px] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
                        <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <FiEye className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h3 className="text-sm font-normal text-slate-800 uppercase tracking-normal">Resume Preview</h3>
                            </div>
                            {resumePreviewUrl && (
                                <button
                                    onClick={() => setIsLightboxOpen(true)}
                                    className="p-2 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 rounded-lg transition-all group"
                                    title="Expand View"
                                >
                                    <FiMaximize2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </button>
                            )}
                        </div>

                        <div className="flex-1 relative group bg-slate-200/50">
                            {resumePreviewUrl ? (
                                <>
                                    {isPreviewable ? (
                                        previewType?.includes('pdf') || resumePreviewUrl?.toLowerCase().endsWith('.pdf') ? (
                                            <iframe
                                                src={resumePreviewUrl}
                                                className="w-full h-full border-none"
                                                title="Resume Preview"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center p-8">
                                                <img
                                                    src={resumePreviewUrl}
                                                    className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                                                    alt="Resume Preview"
                                                />
                                            </div>
                                        )
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
                                            <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center text-indigo-500 shadow-xl">
                                                <FiFile className="w-10 h-10" />
                                            </div>
                                            <div>
                                                <p className="text-slate-600 font-normal text-sm uppercase tracking-normal">Preview Unavailable</p>
                                                <p className="text-slate-400 text-xs mt-1 font-normal">This file type cannot be previewed. Please download to view.</p>
                                            </div>
                                            <a
                                                href={resumePreviewUrl}
                                                download
                                                className="px-6 py-2 bg-primary text-white rounded-lg text-[10px] font-normal uppercase tracking-normal shadow-lg shadow-indigo-200 hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 transition-all active:scale-95"
                                            >
                                                Download File
                                            </a>
                                        </div>
                                    )}
                                    <div
                                        className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 cursor-pointer transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                        onClick={() => setIsLightboxOpen(true)}
                                    >
                                        <div className="bg-white px-6 py-3 rounded-lg shadow-2xl font-normal text-xs text-indigo-600 uppercase tracking-normal transform translate-y-4 group-hover:translate-y-0 transition-all">
                                            Click to Expand
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
                                    <div className="w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                                        <FiFileText className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-normal text-sm">No Document Selected</p>
                                        <p className="text-slate-400 text-xs mt-1">Upload a resume to see a live preview here</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div >
            </div >

            <Lightbox
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                src={resumePreviewUrl}
                type={previewType}
                title="Resume Preview"
            />
            <ConfirmationModal
                show={confirmingAction.show}
                title={confirmingAction.title}
                message={confirmingAction.message}
                onConfirm={confirmingAction.onConfirm}
                onClose={closeModal}
                type={confirmingAction.type}
                hideCancel={confirmingAction.hideCancel}
            />
        </AuthenticatedLayout >
    );
}
