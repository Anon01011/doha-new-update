import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm, Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Lightbox from '@/Components/Lightbox';
import Avatar from '@/Components/Avatar';
import ConfirmationModal from '@/Components/ConfirmationModal';
import {
    FiUser, FiCreditCard, FiMapPin, FiBriefcase, FiClock, FiDollarSign,
    FiFileText, FiPlus, FiTrash2, FiArrowRight, FiArrowLeft, FiEye,
    FiMaximize2, FiFile, FiAlertCircle, FiCheckCircle, FiUploadCloud,
    FiShield, FiCalendar, FiMail, FiPhone, FiGlobe, FiLayers, FiCheck,
    FiX, FiInfo
} from 'react-icons/fi';

export default function CreateEmployee(props) {
    const { appSettings } = usePage().props;
    const currency = appSettings?.currency || 'QAR';
    const appCountry = appSettings?.app_country || (currency === 'INR' ? 'IN' : 'QA');
    const isIndiaMode = appCountry === 'IN';
    const isQatarMode = appCountry === 'QA';
    const isAllMode = appCountry === 'ALL';

    const {
        companies = [],
        departments = [],
        constants = {},
        salaryComponents = [],
        availableRoles = [],
        leadershipEmployees = [],
        managerEmployees = []
    } = props;

    // Active Navigation Tab: 1: Personal, 2: Work, 3: Salary, 4: Documents, 5: Schedule
    const [activeTab, setActiveTab] = useState('personal');

    const [filteredDepartments, setFilteredDepartments] = useState([]);
    const [autoGenerate, setAutoGenerate] = useState(false);
    const [departmentEmployees, setDepartmentEmployees] = useState([]);
    const [branchManagers, setBranchManagers] = useState([]);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxMedia, setLightboxMedia] = useState({ url: null, type: 'auto', title: '' });
    const [imagePreview, setImagePreview] = useState(null);

    // File name and preview tracking for enhanced dropzones
    const [fileDetails, setFileDetails] = useState({});

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
        payment_type: 'Bank Transfer',
        bank_name: '',
        bank_account_number: '',
        bank_code: '',
        bank_branch: '',
        iban: '',
        upi_id: '',
        pan_number: '',
        aadhar_number: '',
        leave_status: '',
        basic_salary: '',
        reported_to: '',
        manual_status: 'active',
        employee_image: null,
        agreement_doc: null,
        resume_doc: null,
        other_docs: null,
        aadhar_file: null,
        pan_file: null,
        education_doc: null,
        relieving_doc: null,
        bank_doc: null,
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

    // Fetch branches departments
    useEffect(() => {
        if (data.company_id) {
            axios.get(route('api.departments.byBranch', { branch_id: data.company_id }))
                .then(res => setFilteredDepartments(res.data.departments || []))
                .catch(() => setFilteredDepartments([]));
        } else {
            setFilteredDepartments([]);
        }
    }, [data.company_id]);

    // Fetch employees for reporting manager selection
    useEffect(() => {
        if (data.department_id || data.company_id) {
            axios.get(route('api.employees.byDepartment', {
                department_id: data.department_id,
                company_id: data.company_id
            }))
                .then(res => {
                    setDepartmentEmployees(res.data.employees || []);
                    setBranchManagers(res.data.branch_managers || []);
                })
                .catch(() => {
                    setDepartmentEmployees([]);
                    setBranchManagers([]);
                });
        } else {
            setDepartmentEmployees([]);
            setBranchManagers([]);
        }
    }, [data.department_id, data.company_id]);

    const isHrOrManager = useMemo(() => {
        const role = (data.role || '').toLowerCase();
        const desig = (data.designation || '').toLowerCase();
        return role === 'hr' || role === 'manager' || role === 'branch-manager' ||
            desig.includes('hr') || desig.includes('manager') || desig.includes('coo') || desig.includes('director') || desig.includes('head');
    }, [data.role, data.designation]);

    const executiveLeaders = useMemo(() => leadershipEmployees || [], [leadershipEmployees]);

    const designationList = useMemo(() => {
        return constants.designations || [
            'Owner / Founder',
            'Chief Operating Officer',
            'Founder / CEO',
            'General Manager',
            'HR Manager',
            'HR Executive',
            'Branch Manager',
            'Operations Manager',
            'Department Head',
            'Supervisor / Team Lead',
            'Stylist / Senior Specialist',
            'Beautician / Technician',
            'Receptionist / Front Desk',
            'Accountant',
            'Administrative Assistant',
            'Sales Executive',
            'Office Assistant / Helper',
        ];
    }, [constants.designations]);

    // Auto-assign default reporting person based on role and branch/department
    useEffect(() => {
        if (isHrOrManager) {
            if (executiveLeaders.length > 0) {
                const isCurrentlyExecutive = executiveLeaders.some(e => e.name === data.reported_to);
                if (!isCurrentlyExecutive) {
                    setData('reported_to', executiveLeaders[0].name);
                }
            }
        } else {
            if (!data.reported_to) {
                const deptManager = departmentEmployees.find(e =>
                    (e.designation || '').toLowerCase().includes('manager') ||
                    (e.designation || '').toLowerCase().includes('lead') ||
                    (e.designation || '').toLowerCase().includes('supervisor')
                );
                if (deptManager) {
                    setData('reported_to', deptManager.name);
                } else if (branchManagers.length > 0) {
                    const brManager = branchManagers.find(m =>
                        (m.designation || '').toLowerCase().includes('manager') ||
                        (m.designation || '').toLowerCase().includes('lead') ||
                        (m.designation || '').toLowerCase().includes('supervisor')
                    ) || branchManagers[0];
                    if (brManager) {
                        setData('reported_to', brManager.name);
                    }
                } else if (departmentEmployees.length > 0) {
                    setData('reported_to', departmentEmployees[0].name);
                } else if (executiveLeaders.length > 0) {
                    setData('reported_to', executiveLeaders[0].name);
                }
            }
        }
    }, [isHrOrManager, executiveLeaders, departmentEmployees, branchManagers]);

    // Auto-update status based on exit status
    useEffect(() => {
        if (['Abscond', 'Terminated', 'Resigned', 'End of Contract'].includes(data.exit_status)) {
            setData('manual_status', 'inactive');
        }
    }, [data.exit_status]);

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
        weekly_off_day: 'Friday',
        effective_date: new Date().toISOString().split('T')[0]
    });

    const addWeeklyOff = () => {
        if (!newWeeklyOff.weekly_off_day || !newWeeklyOff.effective_date) return;
        setData('weekly_offs', [
            ...data.weekly_offs,
            { ...newWeeklyOff }
        ]);
        setNewWeeklyOff({ weekly_off_day: 'Friday', effective_date: new Date().toISOString().split('T')[0] });
    };

    const removeWeeklyOff = (index) => {
        setData('weekly_offs', data.weekly_offs.filter((_, i) => i !== index));
    };

    const handleFileDropChange = (field, e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setConfirmingAction({
                show: true,
                title: 'File Too Large',
                message: 'File size exceeds 10MB limit. Please upload a smaller file.',
                type: 'warning',
                hideCancel: true,
                onConfirm: closeModal
            });
            e.target.value = '';
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setData(field, file);
        setFileDetails(prev => ({
            ...prev,
            [field]: {
                name: file.name,
                size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                type: file.type,
                url: previewUrl
            }
        }));

        if (field === 'employee_image') {
            setImagePreview(previewUrl);
        }
    };

    const removeSelectedFile = (field) => {
        setData(field, null);
        setFileDetails(prev => {
            const copy = { ...prev };
            delete copy[field];
            return copy;
        });
        if (field === 'employee_image') {
            setImagePreview(null);
        }
    };

    const previewSelectedFile = (field, title) => {
        const info = fileDetails[field];
        if (info && info.url) {
            setLightboxMedia({
                url: info.url,
                type: info.type,
                title: title || info.name
            });
            setIsLightboxOpen(true);
        }
    };

    // Salary Structure Helpers
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

    // Live Total Salary Calculation
    const salarySummary = useMemo(() => {
        const basic = parseFloat(data.basic_salary) || 0;
        let allowances = 0;
        let deductions = 0;

        data.salary_structures.forEach(item => {
            const amt = parseFloat(item.amount) || 0;
            const computedAmt = item.value_type === 'percentage' ? (basic * amt) / 100 : amt;
            if (item.type === 'allowance' || item.type === 'earning') {
                allowances += computedAmt;
            } else if (item.type === 'deduction') {
                deductions += computedAmt;
            }
        });

        const gross = basic + allowances;
        const net = Math.max(0, gross - deductions);

        return { basic, allowances, deductions, gross, net };
    }, [data.basic_salary, data.salary_structures]);

    // Count uploaded documents for progress
    const uploadedDocsCount = useMemo(() => {
        const docFields = [
            'aadhar_file', 'pan_file', 'education_doc', 'relieving_doc', 'bank_doc',
            'passport_file', 'qid_file', 'food_handler_file', 'agreement_doc', 'resume_doc', 'other_docs'
        ];
        return docFields.filter(f => data[f]).length;
    }, [data]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Auto-add pending weekly off if present
        if (newWeeklyOff.weekly_off_day && newWeeklyOff.effective_date) {
            const exists = data.weekly_offs.some(
                off => off.weekly_off_day === newWeeklyOff.weekly_off_day &&
                    off.effective_date === newWeeklyOff.effective_date
            );
            if (!exists) {
                data.weekly_offs.push({ ...newWeeklyOff });
            }
        }

        if (autoGenerate) {
            data.employee_code = '';
        }

        post(route('employees.store'), {
            forceFormData: true,
            onError: () => {
                // If there are errors, automatically navigate to the first tab that has an error
                const errorKeys = Object.keys(errors);
                if (errorKeys.some(k => ['name', 'employee_code', 'gender', 'dob', 'mobile', 'email', 'location', 'nationality'].includes(k))) {
                    setActiveTab('personal');
                } else if (errorKeys.some(k => ['company_id', 'department_id', 'designation', 'role', 'joined_date'].includes(k))) {
                    setActiveTab('work');
                } else if (errorKeys.some(k => ['basic_salary', 'payment_type', 'bank_name', 'bank_account_number', 'upi_id'].includes(k))) {
                    setActiveTab('salary');
                } else if (errorKeys.some(k => ['aadhar_file', 'pan_file', 'passport_file', 'qid_file'].includes(k))) {
                    setActiveTab('documents');
                } else {
                    setActiveTab('schedule');
                }
            }
        });
    };

    // Tab Navigation Configuration
    const TABS = [
        { id: 'personal', label: 'Personal & Contact', icon: FiUser, badge: (errors.name || errors.email || errors.mobile) ? 'error' : null },
        { id: 'work', label: 'Work & Role', icon: FiBriefcase, badge: (errors.company_id || errors.department_id || errors.designation) ? 'error' : null },
        { id: 'salary', label: 'Salary & Bank', icon: FiDollarSign, badge: (errors.basic_salary || errors.payment_type) ? 'error' : null },
        { id: 'documents', label: 'Documents', icon: FiFileText, badge: uploadedDocsCount > 0 ? `${uploadedDocsCount}` : null },
        { id: 'schedule', label: 'Schedule & Contract', icon: FiClock, badge: null },
    ];

    const currentTabIndex = TABS.findIndex(t => t.id === activeTab);
    const goNextTab = () => {
        if (currentTabIndex < TABS.length - 1) {
            setActiveTab(TABS[currentTabIndex + 1].id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    const goPrevTab = () => {
        if (currentTabIndex > 0) {
            setActiveTab(TABS[currentTabIndex - 1].id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Add New Employee" />

            <div className={`min-h-screen bg-slate-50/60 pb-24 relative ${processing ? 'pointer-events-none opacity-60' : ''}`}>
                
                {/* Full-screen Loading Overlay */}
                {processing && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                            <div className="w-14 h-14 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-slate-800">Creating Employee Record...</p>
                                <p className="text-xs text-slate-500 mt-0.5">Setting up profile, access, and compliance files</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Sticky Header */}
                <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-4 shadow-sm">
                    <div className="w-full px-2 sm:px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Link
                                href={route('employees.index')}
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                                title="Back to Employee Directory"
                            >
                                <FiArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Add New Employee</h1>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                                        {isIndiaMode ? '🇮🇳 India Compliance' : (isQatarMode ? '🇶🇦 Qatar Compliance' : '🌐 Global Mode')}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">Fill in personal details, work role, salary structure, and official documents</p>
                            </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-3">
                            <Link
                                href={route('employees.index')}
                                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
                            >
                                Cancel
                            </Link>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={processing}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                <FiCheck className="w-4 h-4" />
                                <span>{processing ? 'Saving...' : 'Save & Create Employee'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Step Tabs Navigation */}
                    <div className="w-full px-2 sm:px-4 mt-4">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 pt-3">
                            {TABS.map((tab, idx) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                            isActive
                                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 ring-2 ring-indigo-600/20'
                                                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                                        }`}
                                    >
                                        <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {idx + 1}
                                        </span>
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                        <span>{tab.label}</span>
                                        {tab.badge && (
                                            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                                tab.badge === 'error'
                                                    ? 'bg-rose-500 text-white animate-pulse'
                                                    : 'bg-indigo-100 text-indigo-800'
                                            }`}>
                                                {tab.badge === 'error' ? '!' : tab.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main Form Content */}
                <div className="w-full px-4 sm:px-8 lg:px-10 pt-8">
                    <form onSubmit={handleSubmit}>
                        
                        {/* ============================================================== */}
                        {/* TAB 1: PERSONAL & CONTACT INFORMATION */}
                        {/* ============================================================== */}
                        {activeTab === 'personal' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                
                                {/* Profile Avatar & Primary Identity Card */}
                                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <FiUser className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">Personal Identity</h3>
                                            <p className="text-xs text-slate-500">Employee photo, official name, and basic demographics</p>
                                        </div>
                                    </div>

                                    {/* Photo Upload Box */}
                                    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 mb-8 rounded-2xl bg-slate-50/70 border border-slate-100">
                                        <div className="relative group shrink-0">
                                            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-200 bg-white shadow-sm flex items-center justify-center">
                                                {imagePreview ? (
                                                    <img src={imagePreview} alt="Employee Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Avatar name={data.name || 'New Staff'} size="lg" />
                                                )}
                                            </div>
                                            {imagePreview && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSelectedFile('employee_image')}
                                                    className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition-colors"
                                                    title="Remove Image"
                                                >
                                                    <FiX className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-1.5 text-center sm:text-left">
                                            <label className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all hover:border-indigo-300">
                                                <FiUploadCloud className="w-4 h-4" />
                                                <span>Upload Profile Photo</span>
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/webp"
                                                    className="hidden"
                                                    onChange={e => handleFileDropChange('employee_image', e)}
                                                />
                                            </label>
                                            <p className="text-[11px] text-slate-400">Supported formats: JPG, PNG, WEBP. Max file size: 5MB.</p>
                                        </div>
                                    </div>

                                    {/* Form Fields Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        
                                        {/* Full Name */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <FiUser className="w-3.5 h-3.5 text-indigo-500" />
                                                <span>Full Legal Name</span>
                                                <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                value={data.name}
                                                onChange={e => setData('name', e.target.value)}
                                                placeholder="e.g. John Doe / Priya Sharma"
                                                required
                                            />
                                            {errors.name && <p className="text-xs font-medium text-rose-500">{errors.name}</p>}
                                        </div>

                                        {/* Employee Code */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                    <FiShield className="w-3.5 h-3.5 text-indigo-500" />
                                                    <span>Employee ID / Code</span>
                                                </label>
                                                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-indigo-600 font-medium">
                                                    <input
                                                        type="checkbox"
                                                        checked={autoGenerate}
                                                        onChange={e => setAutoGenerate(e.target.checked)}
                                                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span>Auto-generate</span>
                                                </label>
                                            </div>
                                            <input
                                                type="text"
                                                className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all ${
                                                    autoGenerate ? 'bg-slate-100 text-slate-400 cursor-not-allowed font-mono' : 'bg-slate-50/50 focus:bg-white'
                                                }`}
                                                value={autoGenerate ? 'AUTO-GENERATED' : data.employee_code}
                                                onChange={e => !autoGenerate && setData('employee_code', e.target.value)}
                                                readOnly={autoGenerate}
                                                placeholder="e.g. EMP-0012"
                                            />
                                            {errors.employee_code && <p className="text-xs font-medium text-rose-500">{errors.employee_code}</p>}
                                        </div>

                                        {/* Gender */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <FiUser className="w-3.5 h-3.5 text-indigo-500" />
                                                <span>Gender</span>
                                                <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                value={data.gender}
                                                onChange={e => setData('gender', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Gender</option>
                                                {(constants.genders || ['Male', 'Female', 'Other']).map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                            {errors.gender && <p className="text-xs font-medium text-rose-500">{errors.gender}</p>}
                                        </div>

                                        {/* Date of Birth */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <FiCalendar className="w-3.5 h-3.5 text-indigo-500" />
                                                <span>Date of Birth</span>
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                value={data.dob}
                                                onChange={e => setData('dob', e.target.value)}
                                            />
                                            {errors.dob && <p className="text-xs font-medium text-rose-500">{errors.dob}</p>}
                                        </div>

                                        {/* Nationality */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <FiGlobe className="w-3.5 h-3.5 text-indigo-500" />
                                                <span>Nationality</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                value={data.nationality}
                                                onChange={e => setData('nationality', e.target.value)}
                                                placeholder={isIndiaMode ? "Indian" : (isQatarMode ? "Qatari / Expat" : "e.g. Indian, Qatari")}
                                            />
                                            {errors.nationality && <p className="text-xs font-medium text-rose-500">{errors.nationality}</p>}
                                        </div>

                                        {/* Sponsor (for Qatar) */}
                                        {(isQatarMode || isAllMode) && (
                                            <div className="space-y-1.5">
                                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                    <FiShield className="w-3.5 h-3.5 text-indigo-500" />
                                                    <span>Sponsor / Kafeel</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                    value={data.sponsor}
                                                    onChange={e => setData('sponsor', e.target.value)}
                                                    placeholder="Company / Sponsor Name"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Contact & Location Card */}
                                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                            <FiPhone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">Contact & Address</h3>
                                            <p className="text-xs text-slate-500">Reachability and residential location</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {/* Mobile */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <FiPhone className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>Mobile Number</span>
                                            </label>
                                            <input
                                                type="tel"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                                value={data.mobile}
                                                onChange={e => setData('mobile', e.target.value)}
                                                placeholder={isIndiaMode ? "+91 98765 43210" : "+974 3344 5566"}
                                            />
                                            {errors.mobile && <p className="text-xs font-medium text-rose-500">{errors.mobile}</p>}
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <FiMail className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>Work / Personal Email</span>
                                                {data.role && <span className="text-rose-500" title="Required for system login">*</span>}
                                            </label>
                                            <input
                                                type="email"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                                value={data.email}
                                                onChange={e => setData('email', e.target.value)}
                                                placeholder="employee@company.com"
                                                required={!!data.role}
                                            />
                                            {errors.email && <p className="text-xs font-medium text-rose-500">{errors.email}</p>}
                                        </div>

                                        {/* Location */}
                                        <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <FiMapPin className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>Current Address / City</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                                value={data.location}
                                                onChange={e => setData('location', e.target.value)}
                                                placeholder={isIndiaMode ? "Mumbai, Maharashtra" : "Doha, Qatar"}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ============================================================== */}
                        {/* TAB 2: WORK, ROLE & ASSIGNMENT */}
                        {/* ============================================================== */}
                        {activeTab === 'work' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                            <FiBriefcase className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">Work Assignment & Role</h3>
                                            <p className="text-xs text-slate-500">Branch placement, department, designation, and supervisor hierarchy</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        
                                        {/* Branch / Company */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <FiBriefcase className="w-3.5 h-3.5 text-blue-500" />
                                                <span>Branch / Company</span>
                                                <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                value={data.company_id}
                                                onChange={e => setData('company_id', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Branch</option>
                                                {companies.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            {errors.company_id && <p className="text-xs font-medium text-rose-500">{errors.company_id}</p>}
                                        </div>

                                        {/* Department */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <FiLayers className="w-3.5 h-3.5 text-blue-500" />
                                                <span>Department</span>
                                            </label>
                                            <select
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50"
                                                value={data.department_id}
                                                onChange={e => setData('department_id', e.target.value)}
                                                disabled={!data.company_id}
                                            >
                                                <option value="">{data.company_id ? 'Select Department' : 'Select Branch First'}</option>
                                                {filteredDepartments.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Designation */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <FiBriefcase className="w-3.5 h-3.5 text-blue-500" />
                                                <span>Designation</span>
                                            </label>
                                            <select
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                value={data.designation}
                                                onChange={e => setData('designation', e.target.value)}
                                            >
                                                <option value="">Select Designation</option>
                                                {designationList.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                                {data.designation && !designationList.includes(data.designation) && (
                                                    <option value={data.designation}>{data.designation}</option>
                                                )}
                                            </select>
                                        </div>

                                        {/* Reporting Officer */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <FiUser className="w-3.5 h-3.5 text-blue-500" />
                                                <span>Reports To (Supervisor)</span>
                                            </label>
                                            <select
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                value={data.reported_to}
                                                onChange={e => setData('reported_to', e.target.value)}
                                            >
                                                <option value="">{isHrOrManager ? 'Select Executive Authority (CEO / Founder)' : 'Select Reporting Person'}</option>
                                                {isHrOrManager ? (
                                                    executiveLeaders.length > 0 && (
                                                        <optgroup label="Executive Leadership">
                                                            {executiveLeaders.map(exec => (
                                                                <option key={exec.id} value={exec.name}>
                                                                    {exec.name} ({exec.designation || 'Executive Leader'})
                                                                </option>
                                                            ))}
                                                        </optgroup>
                                                    )
                                                ) : (
                                                    <>
                                                        {departmentEmployees.length > 0 && (
                                                            <optgroup label="Department Staff">
                                                                {departmentEmployees.map(emp => (
                                                                    <option key={emp.id} value={emp.name}>
                                                                        {emp.name} {emp.designation ? `(${emp.designation})` : ''}
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                        {branchManagers.length > 0 && (
                                                            <optgroup label="Branch Management">
                                                                {branchManagers.map(mgr => (
                                                                    <option key={mgr.id} value={mgr.name}>
                                                                        {mgr.name} {mgr.designation ? `(${mgr.designation})` : ''}
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                        {executiveLeaders.length > 0 && (
                                                            <optgroup label="Executive Leadership">
                                                                {executiveLeaders.map(exec => (
                                                                    <option key={exec.id} value={exec.name}>
                                                                        {exec.name} ({exec.designation || 'Executive'})
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                    </>
                                                )}
                                            </select>
                                        </div>

                                        {/* System Role */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <FiShield className="w-3.5 h-3.5 text-blue-500" />
                                                <span>System Access Role</span>
                                            </label>
                                            <select
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                value={data.role}
                                                onChange={e => setData('role', e.target.value)}
                                            >
                                                <option value="">No System Access (Staff Only)</option>
                                                {availableRoles.map(r => (
                                                    <option key={r.id} value={r.slug}>{r.name}</option>
                                                ))}
                                            </select>
                                            {data.role && (
                                                <p className="text-[11px] text-amber-600 font-medium">
                                                    * An active email address is required for portal login.
                                                </p>
                                            )}
                                        </div>

                                        {/* Joining Date */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <FiCalendar className="w-3.5 h-3.5 text-blue-500" />
                                                <span>Joining Date</span>
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                value={data.joined_date}
                                                onChange={e => setData('joined_date', e.target.value)}
                                            />
                                        </div>

                                        {/* Shift */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <FiClock className="w-3.5 h-3.5 text-blue-500" />
                                                <span>Assigned Shift</span>
                                            </label>
                                            <select
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                value={data.shift}
                                                onChange={e => setData('shift', e.target.value)}
                                            >
                                                <option value="">Select Shift</option>
                                                {(constants.shifts || ['Morning', 'Evening', 'General', 'Rotational']).map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Employee Category */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <FiLayers className="w-3.5 h-3.5 text-blue-500" />
                                                <span>Staff Category</span>
                                            </label>
                                            <select
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                value={data.employee_category}
                                                onChange={e => setData('employee_category', e.target.value)}
                                            >
                                                <option value="">Select Category</option>
                                                {(constants.employee_categories || ['Permanent', 'Contract', 'Probation', 'Intern']).map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ============================================================== */}
                        {/* TAB 3: SALARY & PAYMENT MODE DETAILS */}
                        {/* ============================================================== */}
                        {activeTab === 'salary' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                
                                {/* Salary Summary Live Calculation Card */}
                                <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                                        <div>
                                            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Payroll Estimation</span>
                                            <h3 className="text-2xl font-black mt-1">
                                                {currency} {salarySummary.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                <span className="text-xs font-normal text-indigo-200 ml-2">/ Month Net Take-Home</span>
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-medium backdrop-blur-sm border border-white/10">
                                                Mode: {data.payment_type || 'Unspecified'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                                        <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
                                            <span className="text-[11px] text-slate-300">Basic Salary</span>
                                            <p className="text-base font-bold mt-1">{currency} {salarySummary.basic.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
                                            <span className="text-[11px] text-emerald-300">+ Allowances</span>
                                            <p className="text-base font-bold text-emerald-400 mt-1">{currency} {salarySummary.allowances.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
                                            <span className="text-[11px] text-rose-300">- Deductions</span>
                                            <p className="text-base font-bold text-rose-400 mt-1">{currency} {salarySummary.deductions.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white/10 rounded-xl p-3.5 border border-white/10">
                                            <span className="text-[11px] text-indigo-200">Gross Monthly</span>
                                            <p className="text-base font-bold text-indigo-200 mt-1">{currency} {salarySummary.gross.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Base Salary & Payment Method Setup */}
                                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                            <FiDollarSign className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">Compensation & Disbursement</h3>
                                            <p className="text-xs text-slate-500">Base salary and disbursement mode configuration</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Basic Salary */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <FiDollarSign className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>Basic Monthly Salary ({currency})</span>
                                                <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                                    {currency}
                                                </span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full pl-14 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                                    value={data.basic_salary}
                                                    onChange={e => setData('basic_salary', e.target.value)}
                                                    placeholder="0.00"
                                                    required
                                                />
                                            </div>
                                            {errors.basic_salary && <p className="text-xs font-medium text-rose-500">{errors.basic_salary}</p>}
                                        </div>

                                        {/* Payment Mode Selection */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <FiCreditCard className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>Disbursement / Payment Mode</span>
                                                <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                                value={data.payment_type}
                                                onChange={e => setData('payment_type', e.target.value)}
                                                required
                                            >
                                                <option value="Bank Transfer">Bank Transfer / Direct Deposit</option>
                                                <option value="Cash">Cash in Hand</option>
                                                <option value="Cheque">Cheque Payment</option>
                                                <option value="UPI / Digital Wallet">UPI / Digital Wallet</option>
                                                <option value="WPS / Exchange">WPS / Exchange Transfer</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Dynamic Bank / Payment Details Fields */}
                                    <div className="mt-8 pt-6 border-t border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <FiCreditCard className="w-4 h-4 text-indigo-600" />
                                            <span>Payment Mode Specific Details ({data.payment_type})</span>
                                        </h4>

                                        {/* Bank Transfer Fields */}
                                        {(data.payment_type.toLowerCase().includes('bank') || data.payment_type.toLowerCase().includes('wps') || data.payment_type.toLowerCase().includes('wire') || data.payment_type.toLowerCase().includes('direct')) && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 rounded-xl bg-slate-50/60 border border-slate-100">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-700">Bank Name</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500/20"
                                                        value={data.bank_name}
                                                        onChange={e => setData('bank_name', e.target.value)}
                                                        placeholder={isIndiaMode ? "e.g. State Bank of India / HDFC" : "e.g. QNB / CBQ"}
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-700">Account Number</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:ring-2 focus:ring-indigo-500/20"
                                                        value={data.bank_account_number}
                                                        onChange={e => setData('bank_account_number', e.target.value)}
                                                        placeholder="e.g. 123456789012"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-700">
                                                        {isIndiaMode ? "IFSC / Bank Code" : "SWIFT / Bank Code"}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:ring-2 focus:ring-indigo-500/20"
                                                        value={data.bank_code}
                                                        onChange={e => setData('bank_code', e.target.value)}
                                                        placeholder={isIndiaMode ? "SBIN0001234" : "QNBAQAQA"}
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-700">Branch Name</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500/20"
                                                        value={data.bank_branch}
                                                        onChange={e => setData('bank_branch', e.target.value)}
                                                        placeholder="e.g. Main Branch"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-700">IBAN Number (if applicable)</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:ring-2 focus:ring-indigo-500/20"
                                                        value={data.iban}
                                                        onChange={e => setData('iban', e.target.value)}
                                                        placeholder="QA00QNBA00000000123456"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* UPI Fields */}
                                        {(data.payment_type.toLowerCase().includes('upi') || data.payment_type.toLowerCase().includes('wallet')) && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50/60 border border-slate-100">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-700">UPI ID / VPA</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:ring-2 focus:ring-indigo-500/20"
                                                        value={data.upi_id}
                                                        onChange={e => setData('upi_id', e.target.value)}
                                                        placeholder="name@okaxis / mobile@upi"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-700">Linked Bank / Provider Name</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500/20"
                                                        value={data.bank_name}
                                                        onChange={e => setData('bank_name', e.target.value)}
                                                        placeholder="e.g. Google Pay / HDFC UPI"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Cash Payment */}
                                        {data.payment_type.toLowerCase() === 'cash' && (
                                            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-3 text-amber-800 text-xs">
                                                <FiInfo className="w-5 h-5 text-amber-600 shrink-0" />
                                                <span>Cash in Hand selected. Salary will be paid directly in cash against official salary slip receipt.</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Dynamic Salary Components Sub-section */}
                                    <div className="mt-8 pt-6 border-t border-slate-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Salary Components Breakup</h4>
                                                <p className="text-xs text-slate-500">Allowances (HRA, Transport) and Deductions</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addSalaryStructure}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors border border-indigo-200/60"
                                            >
                                                <FiPlus className="w-3.5 h-3.5" />
                                                <span>Add Component</span>
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {data.salary_structures.map((item, index) => (
                                                <div key={index} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 bg-slate-50/60 rounded-xl border border-slate-200/80">
                                                    <div className="flex-1 min-w-[200px]">
                                                        <select
                                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium"
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

                                                    <div className="w-28">
                                                        <select
                                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium"
                                                            value={item.value_type || 'flat'}
                                                            onChange={e => updateSalaryStructure(index, 'value_type', e.target.value)}
                                                        >
                                                            <option value="flat">Flat ({currency})</option>
                                                            <option value="percentage">Percentage (%)</option>
                                                        </select>
                                                    </div>

                                                    <div className="w-32 relative">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-right"
                                                            value={item.amount}
                                                            onChange={e => updateSalaryStructure(index, 'amount', e.target.value)}
                                                            placeholder="0.00"
                                                            required
                                                        />
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeSalaryStructure(index)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Delete Component"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}

                                            {data.salary_structures.length === 0 && (
                                                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                                                    <p className="text-xs text-slate-400">No additional allowances or deductions configured.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ============================================================== */}
                        {/* TAB 4: COMPLIANCE & DOCUMENTS */}
                        {/* ============================================================== */}
                        {activeTab === 'documents' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                                                <FiFileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900">
                                                    {isIndiaMode ? '🇮🇳 India Compliance Documents' : (isQatarMode ? '🇶🇦 Qatar Compliance Documents' : '🌐 Identity & Official Documents')}
                                                </h3>
                                                <p className="text-xs text-slate-500">Upload identity proofs, certificates, and compliance files (PDF, JPG, PNG)</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold px-3 py-1 bg-violet-50 text-violet-700 rounded-full border border-violet-200/60">
                                            {uploadedDocsCount} Files Attached
                                        </span>
                                    </div>

                                    {/* Document Upload Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        
                                        {/* INDIA SPECIFIC DOCS */}
                                        {(isIndiaMode || isAllMode) && (
                                            <>
                                                {/* Aadhar Card */}
                                                <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <FiCreditCard className="w-4 h-4 text-indigo-600" />
                                                            <span className="text-xs font-bold text-slate-900 uppercase">Aadhar Card</span>
                                                        </div>
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-200">India Required</span>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-600 font-medium">Aadhar Card Number</label>
                                                        <input
                                                            type="text"
                                                            className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono"
                                                            value={data.aadhar_number}
                                                            onChange={e => setData('aadhar_number', e.target.value)}
                                                            placeholder="e.g. 1234 5678 9012"
                                                        />
                                                    </div>
                                                    {renderDropzone('aadhar_file', 'Aadhar Card Document (PDF/Image)')}
                                                </div>

                                                {/* PAN Card */}
                                                <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <FiCreditCard className="w-4 h-4 text-indigo-600" />
                                                            <span className="text-xs font-bold text-slate-900 uppercase">PAN Card (Tax ID)</span>
                                                        </div>
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-200">India Required</span>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-600 font-medium">PAN Card Number</label>
                                                        <input
                                                            type="text"
                                                            className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono uppercase"
                                                            value={data.pan_number}
                                                            onChange={e => setData('pan_number', e.target.value)}
                                                            placeholder="e.g. ABCDE1234F"
                                                        />
                                                    </div>
                                                    {renderDropzone('pan_file', 'PAN Card Document (PDF/Image)')}
                                                </div>

                                                {/* Education Document */}
                                                <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <FiFileText className="w-4 h-4 text-indigo-600" />
                                                            <span className="text-xs font-bold text-slate-900 uppercase">Education Certificate</span>
                                                        </div>
                                                    </div>
                                                    {renderDropzone('education_doc', 'Degree / Diploma Certificate')}
                                                </div>

                                                {/* Relieving Document */}
                                                <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <FiFileText className="w-4 h-4 text-indigo-600" />
                                                            <span className="text-xs font-bold text-slate-900 uppercase">Relieving / Experience Letter</span>
                                                        </div>
                                                    </div>
                                                    {renderDropzone('relieving_doc', 'Relieving / Experience Certificate')}
                                                </div>

                                                {/* Bank Passbook / Cheque */}
                                                <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <FiCreditCard className="w-4 h-4 text-indigo-600" />
                                                            <span className="text-xs font-bold text-slate-900 uppercase">Bank Proof / Cheque / Passbook</span>
                                                        </div>
                                                    </div>
                                                    {renderDropzone('bank_doc', 'Passbook Copy / Cancelled Cheque')}
                                                </div>
                                            </>
                                        )}

                                        {/* QATAR SPECIFIC DOCS */}
                                        {(isQatarMode || isAllMode) && (
                                            <>
                                                {/* QID Document */}
                                                <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <FiCreditCard className="w-4 h-4 text-indigo-600" />
                                                            <span className="text-xs font-bold text-slate-900 uppercase">Qatar ID (QID)</span>
                                                        </div>
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">Qatar Required</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-xs text-slate-600 font-medium">QID Number</label>
                                                            <input
                                                                type="text"
                                                                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono"
                                                                value={data.qid_number}
                                                                onChange={e => setData('qid_number', e.target.value)}
                                                                placeholder="e.g. 29012345678"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-slate-600 font-medium">QID Expiry Date</label>
                                                            <input
                                                                type="date"
                                                                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                                                                value={data.qid_expiry_date}
                                                                onChange={e => setData('qid_expiry_date', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    {renderDropzone('qid_file', 'QID Copy (Front & Back)')}
                                                </div>

                                                {/* Passport */}
                                                <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <FiGlobe className="w-4 h-4 text-indigo-600" />
                                                            <span className="text-xs font-bold text-slate-900 uppercase">Passport Details</span>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-xs text-slate-600 font-medium">Passport Number</label>
                                                            <input
                                                                type="text"
                                                                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono uppercase"
                                                                value={data.passport_number}
                                                                onChange={e => setData('passport_number', e.target.value)}
                                                                placeholder="e.g. N1234567"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-slate-600 font-medium">Passport Expiry</label>
                                                            <input
                                                                type="date"
                                                                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                                                                value={data.passport_expiry_date}
                                                                onChange={e => setData('passport_expiry_date', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    {renderDropzone('passport_file', 'Passport Main Copy')}
                                                </div>

                                                {/* Health Card */}
                                                <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <FiShield className="w-4 h-4 text-indigo-600" />
                                                            <span className="text-xs font-bold text-slate-900 uppercase">Health Card / Medical</span>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-xs text-slate-600 font-medium">Health Card No.</label>
                                                            <input
                                                                type="text"
                                                                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono"
                                                                value={data.health_card_number}
                                                                onChange={e => setData('health_card_number', e.target.value)}
                                                                placeholder="e.g. HC-00129"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-slate-600 font-medium">Expiry Date</label>
                                                            <input
                                                                type="date"
                                                                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                                                                value={data.health_card_expiry_date}
                                                                onChange={e => setData('health_card_expiry_date', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Food Handler Certificate */}
                                                <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <FiFileText className="w-4 h-4 text-indigo-600" />
                                                            <span className="text-xs font-bold text-slate-900 uppercase">Food Handler / Hygiene Card</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-600 font-medium">Food Handler Expiry Date</label>
                                                        <input
                                                            type="date"
                                                            className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                                                            value={data.food_handler_expiry_date}
                                                            onChange={e => setData('food_handler_expiry_date', e.target.value)}
                                                        />
                                                    </div>
                                                    {renderDropzone('food_handler_file', 'Food Handler Card Document')}
                                                </div>
                                            </>
                                        )}

                                        {/* GENERAL SUPPORTING DOCUMENTS */}
                                        {/* Resume */}
                                        <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FiFileText className="w-4 h-4 text-indigo-600" />
                                                    <span className="text-xs font-bold text-slate-900 uppercase">Curriculum Vitae (Resume)</span>
                                                </div>
                                            </div>
                                            {renderDropzone('resume_doc', 'Employee Resume / CV (PDF)')}
                                        </div>

                                        {/* Employment Agreement */}
                                        <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FiFileText className="w-4 h-4 text-indigo-600" />
                                                    <span className="text-xs font-bold text-slate-900 uppercase">Signed Employment Contract</span>
                                                </div>
                                            </div>
                                            {renderDropzone('agreement_doc', 'Signed Agreement / Offer Letter')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ============================================================== */}
                        {/* TAB 5: SCHEDULE, CONTRACT & WEEKLY OFFS */}
                        {/* ============================================================== */}
                        {activeTab === 'schedule' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                
                                {/* Contract Duration & Status Card */}
                                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                                            <FiClock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">Contract & Status</h3>
                                            <p className="text-xs text-slate-500">Contract term, status, and leave allowance</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {/* Contract Duration */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700">Contract Duration</label>
                                            <select
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white"
                                                value={data.contract_duration}
                                                onChange={e => setData('contract_duration', e.target.value)}
                                            >
                                                <option value="">Select Duration</option>
                                                {(constants.contract_durations || ['1 Year', '2 Years', '3 Years', '5 Years', 'Unlimited']).map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Contract Issue Date */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700">Contract Issue Date</label>
                                            <input
                                                type="date"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white"
                                                value={data.contract_issue_date}
                                                onChange={e => setData('contract_issue_date', e.target.value)}
                                            />
                                        </div>

                                        {/* Contract Expiry Date */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700">Contract Expiry Date</label>
                                            <input
                                                type="date"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white"
                                                value={data.contract_expiry_date}
                                                onChange={e => setData('contract_expiry_date', e.target.value)}
                                            />
                                        </div>

                                        {/* Employee Status */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700">Initial Account Status</label>
                                            <select
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white"
                                                value={data.manual_status}
                                                onChange={e => setData('manual_status', e.target.value)}
                                            >
                                                <option value="active">Active (Full Access)</option>
                                                <option value="waiting">Pending Review / Onboarding</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>

                                        {/* Leave Status */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700">Leave Status</label>
                                            <select
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white"
                                                value={data.leave_status}
                                                onChange={e => setData('leave_status', e.target.value)}
                                            >
                                                <option value="">Select Status</option>
                                                {(constants.leave_statuses || ['Available', 'On Leave', 'Sick Leave', 'Unpaid Leave']).map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Staff-wise Weekly Offs Scheduler */}
                                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                                <FiCalendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900">Custom Staff Weekly Offs</h3>
                                                <p className="text-xs text-slate-500">Overrides branch weekly offs for this individual employee</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Add New Weekly Off Row */}
                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-6">
                                        <div className="flex-1 min-w-[160px]">
                                            <label className="text-[11px] font-semibold text-slate-600 uppercase">Day of Week</label>
                                            <select
                                                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium"
                                                value={newWeeklyOff.weekly_off_day}
                                                onChange={e => setNewWeeklyOff(prev => ({ ...prev, weekly_off_day: e.target.value }))}
                                            >
                                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex-1 min-w-[160px]">
                                            <label className="text-[11px] font-semibold text-slate-600 uppercase">Effective Date</label>
                                            <input
                                                type="date"
                                                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium"
                                                value={newWeeklyOff.effective_date}
                                                onChange={e => setNewWeeklyOff(prev => ({ ...prev, effective_date: e.target.value }))}
                                            />
                                        </div>

                                        <div className="self-end mt-2 sm:mt-0">
                                            <button
                                                type="button"
                                                onClick={addWeeklyOff}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                                            >
                                                <FiPlus className="w-3.5 h-3.5" />
                                                <span>Add Off Day</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Table of Assigned Weekly Offs */}
                                    {data.weekly_offs.length > 0 ? (
                                        <div className="overflow-hidden border border-slate-200 rounded-xl">
                                            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                                                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                    <tr>
                                                        <th className="px-4 py-3">Assigned Day</th>
                                                        <th className="px-4 py-3">Effective Date</th>
                                                        <th className="px-4 py-3 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                                                    {data.weekly_offs.map((off, index) => (
                                                        <tr key={index} className="hover:bg-slate-50/50">
                                                            <td className="px-4 py-3 font-bold text-indigo-700">{off.weekly_off_day}</td>
                                                            <td className="px-4 py-3 text-slate-600">{off.effective_date}</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeWeeklyOff(index)}
                                                                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                                                                >
                                                                    <FiTrash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                                            <p className="text-xs text-slate-400">No staff-specific weekly offs added. Standard branch schedule applies.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Sticky Bottom Navigation Bar */}
                        <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-200">
                            {currentTabIndex > 0 ? (
                                <button
                                    type="button"
                                    onClick={goPrevTab}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold border border-slate-200 shadow-sm transition-all"
                                >
                                    <FiArrowLeft className="w-4 h-4" />
                                    <span>Previous: {TABS[currentTabIndex - 1].label}</span>
                                </button>
                            ) : <div></div>}

                            <div className="flex items-center gap-3">
                                {currentTabIndex < TABS.length - 1 && (
                                    <button
                                        type="button"
                                        onClick={goNextTab}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold border border-indigo-200/60 shadow-sm transition-all"
                                    >
                                        <span>Next: {TABS[currentTabIndex + 1].label}</span>
                                        <FiArrowRight className="w-4 h-4" />
                                    </button>
                                )}

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    <FiCheck className="w-4 h-4" />
                                    <span>{processing ? 'Processing...' : 'Save & Create Employee'}</span>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Lightbox / Media Viewer */}
            <Lightbox
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                src={lightboxMedia.url}
                type={lightboxMedia.type}
                title={lightboxMedia.title}
            />

            {/* Confirmation / Alert Modal */}
            <ConfirmationModal
                show={confirmingAction.show}
                title={confirmingAction.title}
                message={confirmingAction.message}
                onConfirm={confirmingAction.onConfirm}
                onClose={closeModal}
                type={confirmingAction.type}
                hideCancel={confirmingAction.hideCancel}
            />
        </AuthenticatedLayout>
    );

    // Reusable Modern Dropzone Component Render Helper
    function renderDropzone(field, placeholder) {
        const fileInfo = fileDetails[field];
        return (
            <div className="mt-2">
                {fileInfo ? (
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-indigo-200 shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                                <FiFile className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                                <p className="text-xs font-semibold text-slate-800 truncate">{fileInfo.name}</p>
                                <p className="text-[10px] text-slate-400">{fileInfo.size}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            {fileInfo.url && (
                                <button
                                    type="button"
                                    onClick={() => previewSelectedFile(field, placeholder)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Preview Document"
                                >
                                    <FiEye className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => removeSelectedFile(field)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Remove File"
                            >
                                <FiTrash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-xl cursor-pointer transition-all group">
                        <FiUploadCloud className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        <span className="text-xs font-semibold text-slate-600 group-hover:text-indigo-600 mt-1">
                            Click to upload document
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">PDF, PNG, JPG (Max 10MB)</span>
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={e => handleFileDropChange(field, e)}
                        />
                    </label>
                )}
            </div>
        );
    }
}
