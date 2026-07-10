import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import EmployeeFieldIcons from '@/Components/EmployeeFieldIcons';
import Lightbox from '@/Components/Lightbox';
import Avatar from '@/Components/Avatar';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function ShowEmployee({ employee }) {
    const { appSettings, auth } = usePage().props;
    const isAuthorized = ['admin', 'hr', 'manager'].includes(auth.user.role);
    const currency = appSettings?.currency || 'QAR';
    const [lightbox, setLightbox] = useState({ isOpen: false, src: '', title: '', type: 'auto' });

    const [confirmingApproval, setConfirmingApproval] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handleApprove = () => {
        setConfirmingApproval(true);
    };

    const confirmApprove = () => {
        setProcessing(true);
        router.post(route('employees.approve', employee.id), {}, {
            onFinish: () => {
                setProcessing(false);
                setConfirmingApproval(false);
            }
        });
    };

    const openLightbox = (src, title) => {
        if (!src) return;
        const ext = src.split('.').pop().toLowerCase();
        let type = 'auto';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
            type = 'image';
        } else if (ext === 'pdf') {
            type = 'application/pdf';
        } else {
            type = 'other';
        }
        setLightbox({ isOpen: true, src: `/storage/${src}`, title, type });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };


    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'bg-emerald-400 text-white';
            case 'inactive': return 'bg-rose-400 text-white';
            case 'on leave': return 'bg-sky-400 text-white';
            default: return 'bg-slate-400 text-white';
        }
    };

    const InfoItem = ({ icon, label, value, className = "" }) => (
        <div className={`group flex items-center p-3 bg-white rounded-lg border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 ${className}`}>
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                <span className="scale-75">{icon}</span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
                <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-0">{label}</p>
                <p className="text-xs font-normal text-slate-700 truncate">{value || '—'}</p>
            </div>
        </div>
    );

    const SectionTitle = ({ title, icon, color = "primary" }) => (
        <div className="flex items-center gap-2 mb-4">
            <div className={`w-1 h-4 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-color-rgb),0.2)]`}></div>
            <h3 className="text-[10px] font-normal text-slate-800 uppercase tracking-[0.15em] flex items-center gap-2">
                <span className="opacity-50">{icon}</span>
                {title}
            </h3>
        </div>
    );

    return (
        <AuthenticatedLayout header={
            <div className="flex justify-between items-center w-full px-2">
                <div className="flex items-center gap-3">
                    <Link href={route('employees.index')} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors group">
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <h2 className="text-lg font-normal text-slate-800 tracking-normal">Employee Dossier</h2>
                </div>
            </div>
        }>
            <Head title={`Employee - ${employee.name}`} />

            <div className="w-full p-4 md:p-6 lg:p-8 bg-slate-50/30 min-h-[calc(100vh-64px)]">
                <div className="w-full mx-auto space-y-6">

                    {/* Hero Profile Section - Full Width */}
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg shadow-xl border border-slate-700 overflow-hidden relative">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent opacity-50 blur-2xl transform translate-x-1/4"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/30 rounded-full blur-3xl opacity-50"></div>

                        <div className="relative p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-stretch gap-6 sm:gap-8">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <Avatar
                                    src={employee.employee_image}
                                    name={employee.name}
                                    size="xl"
                                    className="ring-4 ring-slate-800 shadow-2xl h-28 w-28 text-3xl"
                                />
                                <div className={`absolute -bottom-2 right-0 px-3 py-1 rounded-full border-2 border-slate-800 shadow-lg text-[9px] font-normal uppercase tracking-normal ${getStatusColor(employee.manual_status)}`}>
                                    {employee.manual_status || 'ACTIVE'}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 flex flex-col justify-center text-center sm:text-left min-w-0 z-10">
                                <h1 className="text-3xl sm:text-4xl font-normal text-white tracking-normal mb-2 truncate drop-shadow-md">{employee.name}</h1>
                                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-5">
                                    <span className="px-3 py-1.5 bg-white/10 text-indigo-100 rounded-lg text-[10px] font-normal uppercase tracking-normal border border-white/10 backdrop-blur-sm">
                                        {employee.designation || 'Specialist'}
                                    </span>
                                    <span className="px-3 py-1.5 bg-white/5 text-slate-300 rounded-lg text-[10px] font-normal uppercase tracking-normal border border-white/5 backdrop-blur-sm">
                                        ID: {employee.employee_code}
                                    </span>
                                    {employee.role_name && (
                                        <span className="px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-lg text-[10px] font-normal uppercase tracking-normal border border-amber-500/30 backdrop-blur-sm">
                                            {employee.role_name}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-5 border-t border-white/10">
                                    <div>
                                        <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-1">Department</p>
                                        <p className="text-sm font-normal text-slate-200 truncate">{employee.department_name || 'General'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-1">Branch</p>
                                        <p className="text-sm font-normal text-slate-200 truncate">{employee.company_name || 'Main Branch'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-1">Joined</p>
                                        <p className="text-sm font-normal text-slate-200 truncate">{formatDate(employee.joined_date)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Column */}
                            <div className="w-full sm:w-64 flex flex-col justify-between gap-4 z-10 sm:border-l sm:border-white/10 sm:pl-8">
                                <div className="space-y-2">
                                    {employee.manual_status === 'waiting' && isAuthorized && (
                                        <button
                                            onClick={handleApprove}
                                            className="w-full bg-emerald-500 text-white px-4 py-2.5 rounded-lg font-normal text-[10px] uppercase tracking-normal shadow-lg hover:bg-emerald-400 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            Approve
                                        </button>
                                    )}

                                    <Link
                                        href={route('employees.edit', employee.id)}
                                        className="w-full bg-white text-slate-900 px-4 py-2.5 rounded-lg font-normal text-[10px] uppercase tracking-normal shadow-lg hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        Edit Profile
                                    </Link>
                                </div>

                                <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10 backdrop-blur-sm">
                                    <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal mb-1">Basic Salary</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl font-normal text-white tracking-normal">
                                            {employee.basic_salary ? parseFloat(employee.basic_salary.toString().replace(/,/g, '')).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                                        </span>
                                        <span className="text-[10px] font-normal text-indigo-300 uppercase">{currency}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Split Layout Section */}
                    <div className="flex flex-col lg:flex-row gap-6">

                        {/* Left Column - Details (55%) */}
                        <div className="w-full lg:w-[55%] space-y-8">

                            {/* Personal & Employment Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Personal Info */}
                                <div className="space-y-4">
                                    <SectionTitle title="Personal Identity" icon="👤" color="blue" />
                                    <div className="grid grid-cols-1 gap-3">
                                        <InfoItem icon={EmployeeFieldIcons.gender} label="Gender" value={employee.gender} />
                                        <InfoItem icon={EmployeeFieldIcons.dob} label="Date of Birth" value={formatDate(employee.dob)} />
                                        <InfoItem icon={EmployeeFieldIcons.nationality} label="Nationality" value={employee.nationality} />
                                        <InfoItem icon={EmployeeFieldIcons.marital_status} label="Marital Status" value={employee.marital_status} />
                                        <InfoItem icon={EmployeeFieldIcons.mobile} label="Mobile" value={employee.mobile} />
                                        <InfoItem icon={EmployeeFieldIcons.email} label="Email" value={employee.email} />
                                        <InfoItem icon={EmployeeFieldIcons.location} label="Current Location" value={employee.location} />
                                        <InfoItem icon={EmployeeFieldIcons.passport} label="Passport No." value={employee.passport_number} />
                                        <InfoItem icon={EmployeeFieldIcons.passport} label="Passport Exp." value={formatDate(employee.passport_expiry_date)} />
                                        <InfoItem icon={EmployeeFieldIcons.card} label="QID No." value={employee.qid_number} />
                                        <InfoItem icon={EmployeeFieldIcons.card} label="QID Exp." value={formatDate(employee.qid_expiry_date)} />
                                        <InfoItem icon={EmployeeFieldIcons.card} label="Health Card No." value={employee.health_card_number} />
                                        <InfoItem icon={EmployeeFieldIcons.card} label="Health Card Exp." value={formatDate(employee.health_card_expiry_date)} />
                                        <InfoItem icon={EmployeeFieldIcons.card} label="Food Handler Exp." value={formatDate(employee.food_handler_expiry_date)} />
                                    </div>
                                </div>

                                {/* Employment Info */}
                                <div className="space-y-4">
                                    <SectionTitle title="Employment Details" icon="💼" color="emerald" />
                                    <div className="grid grid-cols-1 gap-3">
                                        <InfoItem icon={EmployeeFieldIcons.employee_category} label="Category" value={employee.employee_category} />
                                        <InfoItem icon={EmployeeFieldIcons.contract_duration} label="Contract" value={employee.contract_duration} />
                                        <InfoItem icon={EmployeeFieldIcons.contract_duration} label="Contract Issued" value={formatDate(employee.contract_issue_date)} />
                                        <InfoItem icon={EmployeeFieldIcons.contract_duration} label="Contract Exp." value={formatDate(employee.contract_expiry_date)} />
                                        <InfoItem icon={EmployeeFieldIcons.shift} label="Shift" value={employee.shift} />
                                        <InfoItem icon={EmployeeFieldIcons.reported_to} label="Reported To" value={employee.reported_to} />
                                        <InfoItem icon={EmployeeFieldIcons.joined_date} label="Joined Date" value={formatDate(employee.joined_date)} />
                                        <InfoItem icon={EmployeeFieldIcons.rejoined_date} label="Rejoined Date" value={formatDate(employee.rejoined_date)} />
                                        <InfoItem icon={EmployeeFieldIcons.visa_type} label="Visa Type" value={employee.visa_type} />
                                        <InfoItem icon={EmployeeFieldIcons.visa_designation} label="Visa Designation" value={employee.visa_designation} />
                                        <InfoItem icon={EmployeeFieldIcons.sponsor} label="Sponsor" value={employee.sponsor} />
                                        <InfoItem icon={EmployeeFieldIcons.employee_category} label="System Role" value={employee.role_name} />
                                    </div>
                                </div>
                            </div>

                            {/* Work Schedule (Weekly Offs) */}
                            <div className="bg-white rounded-lg border border-slate-100 shadow-lg shadow-slate-200/20 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
                                    <SectionTitle title="Work Schedule & Weekly Offs" icon="📅" color="amber" />
                                </div>
                                <div className="p-6 space-y-4">
                                    {/* Branch default fallback */}
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Branch Default Weekly Off Days</p>
                                        {employee.company?.weekly_off_days && employee.company.weekly_off_days.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {employee.company.weekly_off_days.map(day => (
                                                    <span key={day} className="px-3 py-1 bg-slate-200/60 text-slate-700 text-xs font-semibold rounded-lg">
                                                        {day}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">No default weekly off days configured for this branch.</p>
                                        )}
                                    </div>

                                    {/* Staff-specific configurations */}
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Staff-Specific Weekly Offs</p>
                                        {(employee.weekly_offs || employee.weeklyOffs || []).length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase text-left">
                                                            <th className="pb-2">Day of Week</th>
                                                            <th className="pb-2">Effective Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-55 text-xs font-normal text-slate-700">
                                                        {(employee.weekly_offs || employee.weeklyOffs).map((off, idx) => (
                                                            <tr key={idx}>
                                                                <td className="py-2.5 font-semibold text-primary">{off.weekly_off_day}</td>
                                                                <td className="py-2.5">{formatDate(off.effective_date)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">No staff-specific configurations. Using branch defaults.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Salary Structure Breakdown */}
                            {employee.salary_structures && employee.salary_structures.length > 0 && (
                                <div className="bg-white rounded-lg border border-slate-100 shadow-lg shadow-slate-200/20 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
                                        <SectionTitle title="Salary Components" icon="📊" color="blue" />
                                    </div>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {employee.salary_structures.map((struct) => (
                                            <div key={struct.id} className="flex justify-between items-center p-3.5 bg-slate-50/50 rounded-lg border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${struct.component?.type === 'allowance' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                                    <span className="text-[10px] font-normal text-slate-600 uppercase tracking-normal">{struct.component?.name}</span>
                                                </div>
                                                <span className={`text-[11px] font-normal ${struct.component?.type === 'allowance' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {struct.component?.type === 'allowance' ? '+' : '-'}{parseFloat(struct.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Sticky Resume Preview (45%) */}
                        <div className="w-full lg:w-[45%]">
                            <div className="sticky top-6 space-y-6">
                                <SectionTitle title="Performance & Documents" icon="📈" color="slate" />

                                <div className="bg-white rounded-lg border border-slate-100 shadow-xl shadow-slate-200/20 p-6 space-y-6">
                                    {/* Performance Evaluations */}
                                    <div>
                                        <h4 className="text-sm font-normal text-slate-700 mb-4 flex items-center gap-2">
                                            <span className="text-lg">🎯</span>
                                            Performance Evaluations
                                        </h4>
                                        <div className="space-y-4">
                                            {employee.evaluations && employee.evaluations.length > 0 ? (
                                                employee.evaluations.slice(0, 5).map((evalItem, idx) => (
                                                    <div key={idx} className="p-4 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-lg hover:shadow-lg transition-all group">
                                                        {/* Header */}
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-normal uppercase tracking-normal text-slate-700">
                                                                    {evalItem.month} {evalItem.year}
                                                                </span>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Avatar
                                                                        src={evalItem.evaluator?.image}
                                                                        name={evalItem.evaluator?.name}
                                                                        size="xs"
                                                                    />
                                                                    <span className="text-[10px] font-normal text-slate-500">
                                                                        {evalItem.evaluator?.name || 'Unknown'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className={`px-4 py-2 rounded-lg text-sm font-normal shadow-sm ${evalItem.overall_score >= 90 ? 'bg-emerald-500 text-white' :
                                                                evalItem.overall_score >= 75 ? 'bg-primary text-white' :
                                                                    evalItem.overall_score >= 60 ? 'bg-amber-500 text-white' :
                                                                        'bg-rose-500 text-white'
                                                                }`}>
                                                                {evalItem.overall_score}%
                                                            </div>
                                                        </div>

                                                        {/* Criteria Scores */}
                                                        {evalItem.criteria_scores && Object.keys(evalItem.criteria_scores).length > 0 && (
                                                            <div className="mb-3 space-y-2">
                                                                {Object.entries(evalItem.criteria_scores).map(([criterion, score], i) => (
                                                                    <div key={i} className="flex items-center gap-2">
                                                                        <span className="text-[9px] font-normal text-slate-600 w-32 truncate">{criterion}</span>
                                                                        <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                                                            <div
                                                                                className={`h-full rounded-full transition-all ${score >= 8 ? 'bg-emerald-500' :
                                                                                    score >= 6 ? 'bg-primary' :
                                                                                        score >= 4 ? 'bg-amber-500' :
                                                                                            'bg-rose-500'
                                                                                    }`}
                                                                                style={{ width: `${(score / 10) * 100}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-[9px] font-normal text-slate-700 w-8 text-right">{score}/10</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Comments */}
                                                        {evalItem.comments && (
                                                            <div className="mt-3 pt-3 border-t border-slate-200">
                                                                <p className="text-[10px] text-slate-600 italic leading-relaxed">
                                                                    💬 "{evalItem.comments}"
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                                                    <span className="text-4xl mb-3">📋</span>
                                                    <span className="text-sm font-normal text-slate-400 uppercase tracking-normal">No Evaluations Yet</span>
                                                    <span className="text-xs text-slate-400 mt-1">Performance reviews will appear here</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Documents Section */}
                                    <div className="pt-4 border-t border-slate-200">
                                        <h4 className="text-sm font-normal text-slate-700 mb-4 flex items-center gap-2">
                                            <span className="text-lg">📄</span>
                                            Documents
                                        </h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {employee.passport_file_path && (
                                                <button
                                                    onClick={() => openLightbox(employee.passport_file_path, 'Passport Document')}
                                                    className="w-full flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100 hover:bg-white hover:shadow-md transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-white rounded-lg shadow-sm group-hover:text-primary">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                                        </div>
                                                        <span className="text-[9px] font-normal text-slate-600 uppercase tracking-normal">Passport</span>
                                                    </div>
                                                    <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>
                                            )}

                                            {employee.qid_file_path && (
                                                <button
                                                    onClick={() => openLightbox(employee.qid_file_path, 'QID Document')}
                                                    className="w-full flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100 hover:bg-white hover:shadow-md transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-white rounded-lg shadow-sm group-hover:text-primary">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .884-.25 1.705-.667 2.417C12.56 9.696 11.232 10 9.771 10c-1.462 0-2.79-.304-3.562-1.583A5.002 5.002 0 015.539 6H10" /></svg>
                                                        </div>
                                                        <span className="text-[9px] font-normal text-slate-600 uppercase tracking-normal">QID Card</span>
                                                    </div>
                                                    <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>
                                            )}
                                            {employee.food_handler_file_path && (
                                                <button
                                                    onClick={() => openLightbox(employee.food_handler_file_path, 'Food Handler Document')}
                                                    className="w-full flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100 hover:bg-white hover:shadow-md transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-white rounded-lg shadow-sm group-hover:text-primary">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        </div>
                                                        <span className="text-[9px] font-normal text-slate-600 uppercase tracking-normal">Food Handler</span>
                                                    </div>
                                                    <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>
                                            )}
                                            {employee.agreement_doc && (
                                                <button
                                                    onClick={() => openLightbox(employee.agreement_doc, 'Contract Document')}
                                                    className="w-full flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100 hover:bg-white hover:shadow-md transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-white rounded-lg shadow-sm group-hover:text-primary">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        </div>
                                                        <span className="text-[9px] font-normal text-slate-600 uppercase tracking-normal">Contract</span>
                                                    </div>
                                                    <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>
                                            )}

                                            {employee.other_docs && (
                                                <button
                                                    onClick={() => openLightbox(employee.other_docs, 'Other Documents')}
                                                    className="w-full flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100 hover:bg-white hover:shadow-md transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-white rounded-lg shadow-sm group-hover:text-primary">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        </div>
                                                        <span className="text-[9px] font-normal text-slate-600 uppercase tracking-normal">Other Docs</span>
                                                    </div>
                                                    <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Lightbox
                    isOpen={lightbox.isOpen}
                    onClose={() => setLightbox({ ...lightbox, isOpen: false })}
                    src={lightbox.src}
                    type={lightbox.type}
                    title={lightbox.title}
                />
                <ConfirmationModal
                    show={confirmingApproval}
                    title="Approve Employee"
                    message={`Are you sure you want to approve ${employee.name}? This will grant them system access.`}
                    onConfirm={confirmApprove}
                    onClose={() => setConfirmingApproval(false)}
                    confirmText="Approve"
                    type="success"
                    processing={processing}
                />
            </div>
        </AuthenticatedLayout>
    );
}