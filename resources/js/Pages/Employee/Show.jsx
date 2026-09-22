import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import Lightbox from '@/Components/Lightbox';
import Avatar from '@/Components/Avatar';
import ConfirmationModal from '@/Components/ConfirmationModal';
import {
    FiUser, FiCreditCard, FiMapPin, FiBriefcase, FiClock, FiDollarSign,
    FiFileText, FiArrowLeft, FiEdit3, FiPrinter, FiTrash2, FiCheckCircle,
    FiEye, FiDownload, FiGlobe, FiShield, FiPhone, FiMail, FiCalendar,
    FiLayers, FiInfo, FiFile, FiExternalLink, FiX, FiPlus, FiUpload
} from 'react-icons/fi';

export default function ShowEmployee({ employee }) {
    const { appSettings, auth } = usePage().props;
    const isAuthorized = ['admin', 'hr', 'manager'].includes(auth.user?.role || '');
    const currency = appSettings?.currency || 'QAR';
    const appCountry = appSettings?.app_country || (currency === 'INR' ? 'IN' : 'QA');
    const isIndiaMode = appCountry === 'IN';
    const isQatarMode = appCountry === 'QA';
    const isAllMode = appCountry === 'ALL';

    const [activeTab, setActiveTab] = useState('overview');
    const [lightbox, setLightbox] = useState({ isOpen: false, src: '', title: '', type: 'auto' });

    const [confirmingApproval, setConfirmingApproval] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const canDelete = auth.user?.role === 'admin' || auth.user?.roles?.some(r => r.slug === 'admin');

    const handleApprove = () => setConfirmingApproval(true);

    const confirmApprove = () => {
        setProcessing(true);
        router.post(route('employees.approve', employee.id), {}, {
            onFinish: () => {
                setProcessing(false);
                setConfirmingApproval(false);
            }
        });
    };

    const handleDelete = () => setConfirmingDelete(true);

    const confirmDelete = () => {
        setDeleting(true);
        router.delete(route('employees.destroy', employee.id), {
            onFinish: () => {
                setDeleting(false);
                setConfirmingDelete(false);
            }
        });
    };

    const getFileUrl = (src) => {
        if (!src) return '';
        const trimmed = src.toString().trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
            return trimmed;
        }
        const clean = trimmed.replace(/^[\\/]+/, '');
        if (clean.startsWith('storage/')) {
            return `/${clean}`;
        }
        return `/storage/${clean}`;
    };

    const openLightbox = (src, title) => {
        if (!src) return;
        const fullUrl = getFileUrl(src);
        const ext = fullUrl.split('?')[0].split('.').pop().toLowerCase();
        let type = 'auto';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
            type = 'image';
        } else if (ext === 'pdf') {
            type = 'application/pdf';
        } else {
            type = 'other';
        }
        setLightbox({ isOpen: true, src: fullUrl, title, type });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const s = (status || 'active').toLowerCase();
        switch (s) {
            case 'active':
                return { bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', label: 'Active Staff' };
            case 'waiting':
                return { bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400', label: 'Pending Approval' };
            case 'inactive':
                return { bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400', label: 'Inactive' };
            case 'on leave':
                return { bg: 'bg-sky-500/10 border-sky-500/30 text-sky-400', label: 'On Leave' };
            default:
                return { bg: 'bg-slate-500/10 border-slate-500/30 text-slate-300', label: status?.toUpperCase() || 'UNKNOWN' };
        }
    };

    const statusStyle = getStatusBadge(employee.manual_status || employee.status);

    // Compute Net Salary
    const basicSalary = parseFloat(employee.basic_salary?.toString().replace(/,/g, '') || 0);
    let totalAllowances = 0;
    let totalDeductions = 0;

    (employee.salary_structures || employee.salaryStructures || []).forEach(struct => {
        const amt = parseFloat(struct.amount) || 0;
        const computedAmt = struct.value_type === 'percentage' ? (basicSalary * amt) / 100 : amt;
        if (struct.component?.type === 'allowance' || struct.type === 'allowance' || struct.type === 'earning') {
            totalAllowances += computedAmt;
        } else if (struct.component?.type === 'deduction' || struct.type === 'deduction') {
            totalDeductions += computedAmt;
        }
    });

    const netSalary = Math.max(0, basicSalary + totalAllowances - totalDeductions);

    // Document Items List for Compliance Tab
    const customDocs = (employee.documents || []).map(d => ({
        id: `custom_${d.id}`,
        title: d.document_name || d.document_type?.name || 'Custom Document',
        file: d.file_path || d.file,
        number: null,
        expiry: d.expiry_date,
        category: d.document_type?.name || 'Uploaded Document',
        notes: d.notes
    }));

    const documentsList = [
        // India Docs
        ...(isIndiaMode || isAllMode ? [
            { id: 'aadhar', title: 'Aadhar Card', file: employee.aadhar_file || employee.aadhar_file_path, number: employee.aadhar_number, category: 'Identity (India)' },
            { id: 'pan', title: 'PAN Card (Tax ID)', file: employee.pan_file || employee.pan_file_path, number: employee.pan_number, category: 'Tax ID (India)' },
            { id: 'education', title: 'Education Certificate', file: employee.education_doc || employee.education_doc_path, number: null, category: 'Education' },
            { id: 'relieving', title: 'Relieving / Experience Document', file: employee.relieving_doc || employee.relieving_doc_path, number: null, category: 'Employment Proof' },
            { id: 'bank', title: 'Bank Passbook / Cheque', file: employee.bank_doc || employee.bank_doc_path, number: employee.bank_account_number, category: 'Banking' },
        ] : []),

        // Qatar Docs
        ...(isQatarMode || isAllMode ? [
            { id: 'qid', title: 'Qatar ID (QID)', file: employee.qid_file || employee.qid_file_path, number: employee.qid_number, expiry: employee.qid_expiry_date, category: 'Identity (Qatar)' },
            { id: 'passport', title: 'Passport Document', file: employee.passport_file || employee.passport_file_path, number: employee.passport_number, expiry: employee.passport_expiry_date, category: 'Passport' },
            { id: 'health', title: 'Health Card', file: employee.health_card_file || employee.health_card_file_path, number: employee.health_card_number, expiry: employee.health_card_expiry_date, category: 'Medical' },
            { id: 'food', title: 'Food Handler Certificate', file: employee.food_handler_file || employee.food_handler_file_path, expiry: employee.food_handler_expiry_date, category: 'Hygiene Card' },
        ] : []),

        // General Docs
        { id: 'resume', title: 'Curriculum Vitae (Resume)', file: employee.resume_doc || employee.resume_doc_path, category: 'CV / Profile' },
        { id: 'agreement', title: 'Signed Contract / Agreement', file: employee.agreement_doc || employee.agreement_doc_path, category: 'Employment Contract' },
        { id: 'other', title: 'Other Supporting Documents', file: employee.other_docs || employee.other_docs_path, category: 'Miscellaneous' },

        // Custom Uploaded Docs from Employee Documents module
        ...customDocs
    ];

    const attachedDocsCount = documentsList.filter(d => d.file || d.number).length;

    const TABS = [
        { id: 'overview', label: 'Profile Overview', icon: FiUser },
        { id: 'work', label: 'Work & Placement', icon: FiBriefcase },
        { id: 'salary', label: 'Salary & Banking', icon: FiDollarSign },
        { id: 'documents', label: `Documents (${attachedDocsCount})`, icon: FiFileText },
        { id: 'schedule', label: 'Schedule & Offs', icon: FiClock },
    ];

    return (
        <AuthenticatedLayout>
            <Head title={`Employee - ${employee.name}`} />

            <div className="w-full min-h-screen bg-slate-50/60 pb-20">
                
                {/* Full Width Hero Profile Banner */}
                <div className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-b border-slate-800 relative overflow-hidden">
                    {/* Subtle geometric light patterns */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="w-full px-4 sm:px-8 lg:px-10 py-8 relative z-10">
                        {/* Top Breadcrumbs & Quick Back */}
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <Link
                                href={route('employees.index')}
                                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                            >
                                <FiArrowLeft className="w-4 h-4" />
                                <span>Back to Employee Directory</span>
                            </Link>

                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg}`}>
                                    <span className="w-2 h-2 rounded-full bg-current"></span>
                                    <span>{statusStyle.label}</span>
                                </span>
                            </div>
                        </div>

                        {/* Profile Hero Row */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                                {/* Avatar */}
                                <div className="relative group shrink-0">
                                    <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-white/20 bg-white/10 shadow-2xl flex items-center justify-center backdrop-blur-sm">
                                        <Avatar
                                            src={employee.employee_image}
                                            name={employee.name}
                                            size="xl"
                                        />
                                    </div>
                                    {employee.employee_image && (
                                        <button
                                            type="button"
                                            onClick={() => openLightbox(employee.employee_image, `${employee.name} - Profile Photo`)}
                                            className="absolute -bottom-2 -right-2 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all"
                                            title="View Full Photo"
                                        >
                                            <FiEye className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Names, Designation & Tags */}
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{employee.name}</h1>
                                        <span className="px-2.5 py-1 bg-white/10 text-indigo-200 rounded-lg text-xs font-mono font-bold border border-white/10">
                                            {employee.employee_code}
                                        </span>
                                    </div>

                                    <p className="text-sm font-medium text-slate-300">
                                        {employee.designation || 'Staff'} • <span className="text-indigo-300 font-semibold">{employee.company?.name || employee.company_name || 'Main Salon Branch'}</span>
                                    </p>

                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-400">
                                        {employee.mobile && (
                                            <span className="inline-flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                                <FiPhone className="w-3.5 h-3.5 text-indigo-400" />
                                                <span>{employee.mobile}</span>
                                            </span>
                                        )}
                                        {employee.email && (
                                            <span className="inline-flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                                <FiMail className="w-3.5 h-3.5 text-indigo-400" />
                                                <span>{employee.email}</span>
                                            </span>
                                        )}
                                        {employee.location && (
                                            <span className="inline-flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                                <FiMapPin className="w-3.5 h-3.5 text-indigo-400" />
                                                <span>{employee.location}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Quick Actions & Salary Highlight */}
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                                {/* Salary Tag */}
                                <div className="bg-white/10 border border-white/10 rounded-2xl p-4 text-center sm:text-right shrink-0 backdrop-blur-sm min-w-[170px]">
                                    <span className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider block">Net Take-Home Pay</span>
                                    <span className="text-xl font-black text-white mt-0.5 block">
                                        {currency} {netSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">Mode: {employee.payment_type || 'Bank'}</span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2 w-full sm:w-auto">
                                    {employee.manual_status === 'waiting' && isAuthorized && (
                                        <button
                                            type="button"
                                            onClick={handleApprove}
                                            disabled={processing}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
                                        >
                                            <FiCheckCircle className="w-4 h-4" />
                                            <span>Approve Profile</span>
                                        </button>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={route('employees.edit', employee.id)}
                                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
                                        >
                                            <FiEdit3 className="w-4 h-4" />
                                            <span>Edit Profile</span>
                                        </Link>

                                        {canDelete && (
                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                disabled={deleting}
                                                className="p-2.5 bg-white/10 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-colors"
                                                title="Delete Employee"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky White/Light Tab Navigation Bar */}
                <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm px-4 sm:px-8 lg:px-10 py-2.5">
                    <div className="w-full flex items-center gap-2 overflow-x-auto scrollbar-none">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                        isActive
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-600/30'
                                            : 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 hover:text-slate-950 border border-slate-200/60'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-600'}`} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Full-Width Details Content */}
                <div className="w-full px-4 sm:px-8 lg:px-10 pt-6">
                    
                    {/* ============================================================== */}
                    {/* TAB 1: OVERVIEW & PERSONAL DETAILS */}
                    {/* ============================================================== */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                            
                            {/* Personal & Demographic Card */}
                            <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <FiUser className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Personal & Legal Identity</h3>
                                        <p className="text-xs text-slate-500">Demographic info and national identity details</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                    <InfoField label="Full Legal Name" value={employee.name} icon={<FiUser />} />
                                    <InfoField label="Employee Code" value={employee.employee_code} icon={<FiShield />} isMono />
                                    <InfoField label="Gender" value={employee.gender} icon={<FiUser />} />
                                    <InfoField label="Date of Birth" value={formatDate(employee.dob)} icon={<FiCalendar />} />
                                    <InfoField label="Nationality" value={employee.nationality} icon={<FiGlobe />} />
                                    <InfoField label="Marital Status" value={employee.marital_status} icon={<FiUser />} />

                                    {/* India Identity */}
                                    {(isIndiaMode || isAllMode) && (
                                        <>
                                            <InfoField label="Aadhar Card No." value={employee.aadhar_number} icon={<FiCreditCard />} isMono />
                                            <InfoField label="PAN Card No." value={employee.pan_number} icon={<FiCreditCard />} isMono />
                                        </>
                                    )}

                                    {/* Qatar Identity */}
                                    {(isQatarMode || isAllMode) && (
                                        <>
                                            <InfoField label="Qatar ID (QID)" value={employee.qid_number} icon={<FiCreditCard />} isMono />
                                            <InfoField label="QID Expiry Date" value={formatDate(employee.qid_expiry_date)} icon={<FiCalendar />} />
                                            <InfoField label="Passport Number" value={employee.passport_number} icon={<FiGlobe />} isMono />
                                            <InfoField label="Passport Expiry" value={formatDate(employee.passport_expiry_date)} icon={<FiCalendar />} />
                                            <InfoField label="Health Card No." value={employee.health_card_number} icon={<FiShield />} isMono />
                                            <InfoField label="Health Card Expiry" value={formatDate(employee.health_card_expiry_date)} icon={<FiCalendar />} />
                                            <InfoField label="Sponsor / Kafeel" value={employee.sponsor} icon={<FiShield />} />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Contact & Quick Reach Card */}
                            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                        <FiPhone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Contact Channels</h3>
                                        <p className="text-xs text-slate-500">Official and personal reachability</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                                        <div className="p-2 bg-white text-emerald-600 rounded-lg shadow-xs">
                                            <FiPhone className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Mobile Number</span>
                                            <p className="text-sm font-bold text-slate-800">{employee.mobile || '—'}</p>
                                        </div>
                                    </div>

                                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                                        <div className="p-2 bg-white text-emerald-600 rounded-lg shadow-xs">
                                            <FiMail className="w-4 h-4" />
                                        </div>
                                        <div className="truncate">
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Email Address</span>
                                            <p className="text-sm font-bold text-slate-800 truncate">{employee.email || '—'}</p>
                                        </div>
                                    </div>

                                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                                        <div className="p-2 bg-white text-emerald-600 rounded-lg shadow-xs">
                                            <FiMapPin className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Residential Location</span>
                                            <p className="text-sm font-bold text-slate-800">{employee.location || '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============================================================== */}
                    {/* TAB 2: WORK & PLACEMENT */}
                    {/* ============================================================== */}
                    {activeTab === 'work' && (
                        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                    <FiBriefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Work Placement & System Access</h3>
                                    <p className="text-xs text-slate-500">Salon branch placement, department, designation, and supervisor</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                <InfoField label="Branch / Company" value={employee.company?.name || employee.company_name} icon={<FiBriefcase />} />
                                <InfoField label="Department" value={employee.department?.name || employee.department_name} icon={<FiLayers />} />
                                <InfoField label="Designation" value={employee.designation} icon={<FiBriefcase />} />
                                <InfoField label="Reporting Supervisor" value={employee.reported_to} icon={<FiUser />} />
                                <InfoField label="System Access Role" value={employee.role_name || 'Staff Member'} icon={<FiShield />} />
                                <InfoField label="Joined Date" value={formatDate(employee.joined_date)} icon={<FiCalendar />} />
                                <InfoField label="Rejoined Date" value={formatDate(employee.rejoined_date)} icon={<FiCalendar />} />
                                <InfoField label="Staff Category" value={employee.employee_category} icon={<FiLayers />} />
                                <InfoField label="Assigned Shift" value={employee.shift} icon={<FiClock />} />
                                <InfoField label="Visa Type" value={employee.visa_type} icon={<FiFileText />} />
                                <InfoField label="Visa Designation" value={employee.visa_designation} icon={<FiFileText />} />
                                <InfoField label="Contract Duration" value={employee.contract_duration} icon={<FiClock />} />
                            </div>
                        </div>
                    )}

                    {/* ============================================================== */}
                    {/* TAB 3: SALARY & BANKING */}
                    {/* ============================================================== */}
                    {activeTab === 'salary' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            
                            {/* Salary Summary Card */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Basic Monthly Salary</span>
                                    <p className="text-2xl font-black text-slate-900 mt-1">
                                        {currency} {basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>

                                <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-200 shadow-sm">
                                    <span className="text-xs font-semibold text-emerald-700 uppercase">+ Total Allowances</span>
                                    <p className="text-2xl font-black text-emerald-800 mt-1">
                                        {currency} {totalAllowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>

                                <div className="p-5 bg-rose-50/60 rounded-2xl border border-rose-200 shadow-sm">
                                    <span className="text-xs font-semibold text-rose-700 uppercase">- Total Deductions</span>
                                    <p className="text-2xl font-black text-rose-800 mt-1">
                                        {currency} {totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>

                                <div className="p-5 bg-indigo-900 text-white rounded-2xl shadow-md">
                                    <span className="text-xs font-semibold text-indigo-200 uppercase">Net Monthly Take-Home</span>
                                    <p className="text-2xl font-black text-white mt-1">
                                        {currency} {netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>

                            {/* Banking & Disbursement Mode Details */}
                            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                            <FiCreditCard className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">Payment & Bank Account Credentials</h3>
                                            <p className="text-xs text-slate-500">Selected mode: {employee.payment_type || 'Bank Transfer'}</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                                        {employee.payment_type || 'Bank Transfer'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    <InfoField label="Payment Method" value={employee.payment_type || 'Bank Transfer'} icon={<FiCreditCard />} />
                                    {employee.bank_name && <InfoField label="Bank / Provider Name" value={employee.bank_name} icon={<FiCreditCard />} />}
                                    {employee.bank_account_number && <InfoField label="Account Number" value={employee.bank_account_number} icon={<FiCreditCard />} isMono />}
                                    {employee.bank_code && <InfoField label={isIndiaMode ? "IFSC Code" : "SWIFT / Bank Code"} value={employee.bank_code} icon={<FiCreditCard />} isMono />}
                                    {employee.bank_branch && <InfoField label="Branch Name" value={employee.bank_branch} icon={<FiMapPin />} />}
                                    {employee.iban && <InfoField label="IBAN Number" value={employee.iban} icon={<FiCreditCard />} isMono />}
                                    {employee.upi_id && <InfoField label="UPI / VPA ID" value={employee.upi_id} icon={<FiCreditCard />} isMono />}
                                    {employee.pan_number && <InfoField label="PAN / Tax ID" value={employee.pan_number} icon={<FiCreditCard />} isMono />}
                                </div>
                            </div>

                            {/* Salary Structures Table */}
                            {(employee.salary_structures || employee.salaryStructures || []).length > 0 && (
                                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                                    <h4 className="text-sm font-bold text-slate-900">Configured Salary Components</h4>
                                    <div className="overflow-hidden border border-slate-200 rounded-xl">
                                        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                                            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-3">Component</th>
                                                    <th className="px-4 py-3">Type</th>
                                                    <th className="px-4 py-3">Calculation</th>
                                                    <th className="px-4 py-3 text-right">Amount ({currency})</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                                                {(employee.salary_structures || employee.salaryStructures).map((struct, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50">
                                                        <td className="px-4 py-3 font-semibold text-slate-900">{struct.component?.name || struct.name || 'Component'}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                (struct.component?.type || struct.type) === 'allowance' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                                            }`}>
                                                                {(struct.component?.type || struct.type)?.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-slate-500">
                                                            {struct.value_type === 'percentage' ? `${struct.amount}% of Basic` : 'Flat Amount'}
                                                        </td>
                                                        <td className={`px-4 py-3 text-right font-bold ${
                                                            (struct.component?.type || struct.type) === 'allowance' ? 'text-emerald-600' : 'text-rose-600'
                                                        }`}>
                                                            {(struct.component?.type || struct.type) === 'allowance' ? '+' : '-'} {parseFloat(struct.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ============================================================== */}
                    {/* TAB 4: COMPLIANCE & DOCUMENTS */}
                    {/* ============================================================== */}
                    {activeTab === 'documents' && (
                        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                                        <FiFileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Official Compliance & Documents</h3>
                                        <p className="text-xs text-slate-500">Preview, inspect, download, and verify employee certificates & files</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold px-3 py-1 bg-violet-50 text-violet-700 rounded-full border border-violet-200/60">
                                        {attachedDocsCount} Files Recorded
                                    </span>
                                    <Link
                                        href={route('employees.documents.index', employee.id)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                                    >
                                        <FiPlus className="w-3.5 h-3.5" />
                                        <span>Upload / Manage Documents</span>
                                    </Link>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {documentsList.map(doc => {
                                    const hasFile = !!doc.file;
                                    const hasData = hasFile || doc.number || doc.expiry;
                                    return (
                                        <div
                                            key={doc.id}
                                            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                                                hasFile
                                                    ? 'bg-white border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300'
                                                    : hasData
                                                    ? 'bg-slate-50/70 border-slate-200'
                                                    : 'bg-slate-50/40 border-dashed border-slate-200 opacity-70'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`p-2.5 rounded-xl ${hasFile ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                            <FiFileText className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{doc.category}</span>
                                                            <h4 className="text-xs font-bold text-slate-900">{doc.title}</h4>
                                                        </div>
                                                    </div>
                                                    {hasFile ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold border border-emerald-200">
                                                            <FiCheckCircle className="w-3 h-3" />
                                                            <span>Uploaded</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Pending</span>
                                                    )}
                                                </div>

                                                {/* Number / Expiry if any */}
                                                {(doc.number || doc.expiry || doc.notes) && (
                                                    <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1 mb-3">
                                                        {doc.number && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] text-slate-500">ID / Number:</span>
                                                                <span className="font-mono font-bold text-slate-800">{doc.number}</span>
                                                            </div>
                                                        )}
                                                        {doc.expiry && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] text-slate-500">Expiry Date:</span>
                                                                <span className="font-semibold text-slate-800">{formatDate(doc.expiry)}</span>
                                                            </div>
                                                        )}
                                                        {doc.notes && (
                                                            <p className="text-[11px] text-slate-500 italic mt-1">{doc.notes}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            {hasFile ? (
                                                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openLightbox(doc.file, `${employee.name} - ${doc.title}`)}
                                                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98]"
                                                    >
                                                        <FiEye className="w-4 h-4" />
                                                        <span>Preview Document</span>
                                                    </button>
                                                    <a
                                                        href={getFileUrl(doc.file)}
                                                        download
                                                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                                                        title="Download File"
                                                    >
                                                        <FiDownload className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className="pt-3 border-t border-slate-100 mt-2">
                                                    <Link
                                                        href={route('employees.documents.index', employee.id)}
                                                        className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-medium transition-colors border border-slate-200/60"
                                                    >
                                                        <FiPlus className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>Upload Document</span>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ============================================================== */}
                    {/* TAB 5: SCHEDULE & CONTRACT */}
                    {/* ============================================================== */}
                    {activeTab === 'schedule' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            
                            {/* Contract Period Card */}
                            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                                        <FiClock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Contract & Shift Schedule</h3>
                                        <p className="text-xs text-slate-500">Contract timeline, status, and shift parameters</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                    <InfoField label="Contract Duration" value={employee.contract_duration} icon={<FiClock />} />
                                    <InfoField label="Issue Date" value={formatDate(employee.contract_issue_date)} icon={<FiCalendar />} />
                                    <InfoField label="Expiry Date" value={formatDate(employee.contract_expiry_date)} icon={<FiCalendar />} />
                                    <InfoField label="Leave Status" value={employee.leave_status || 'Available'} icon={<FiClock />} />
                                </div>
                            </div>

                            {/* Staff Weekly Offs */}
                            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                                <h4 className="text-sm font-bold text-slate-900">Assigned Weekly Off Days</h4>
                                
                                {(employee.weekly_offs || employee.weeklyOffs || []).length > 0 ? (
                                    <div className="overflow-hidden border border-slate-200 rounded-xl">
                                        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                                            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-3">Weekly Off Day</th>
                                                    <th className="px-4 py-3">Effective Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                                                {(employee.weekly_offs || employee.weeklyOffs).map((off, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50">
                                                        <td className="px-4 py-3 font-bold text-indigo-700">{off.weekly_off_day}</td>
                                                        <td className="px-4 py-3">{formatDate(off.effective_date)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500">
                                        No staff-specific weekly offs configured. Standard branch schedule applies.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox / Media Viewer */}
            <Lightbox
                isOpen={lightbox.isOpen}
                onClose={() => setLightbox({ ...lightbox, isOpen: false })}
                src={lightbox.src}
                type={lightbox.type}
                title={lightbox.title}
            />

            {/* Confirmation Modals */}
            <ConfirmationModal
                show={confirmingApproval}
                title="Approve Employee"
                message={`Are you sure you want to approve ${employee.name}? Their profile will become active immediately.`}
                onConfirm={confirmApprove}
                onClose={() => setConfirmingApproval(false)}
                type="info"
            />

            <ConfirmationModal
                show={confirmingDelete}
                title="Delete Employee"
                message={`Are you sure you want to permanently delete ${employee.name}? This action cannot be undone.`}
                onConfirm={confirmDelete}
                onClose={() => setConfirmingDelete(false)}
                type="danger"
            />
        </AuthenticatedLayout>
    );

    // Reusable Info Card Helper
    function InfoField({ label, value, icon, isMono = false }) {
        return (
            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    {icon && <span className="opacity-60">{icon}</span>}
                    <span>{label}</span>
                </span>
                <p className={`text-xs font-bold text-slate-800 truncate ${isMono ? 'font-mono' : ''}`}>
                    {value || '—'}
                </p>
            </div>
        );
    }
}