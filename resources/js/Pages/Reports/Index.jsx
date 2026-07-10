import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { FiClock, FiCalendar, FiDollarSign, FiCreditCard, FiBookOpen, FiCheckSquare, FiAlertCircle, FiChevronRight, FiTrendingUp, FiUsers, FiBarChart2, FiActivity } from 'react-icons/fi';

export default function Index() {
    const reportCards = [
        {
            title: 'Attendance',
            description: 'Track employee clock-in patterns, working hours, and overtime records.',
            href: route('reports.attendance'),
            icon: <FiClock className="w-6 h-6" />,
            gradient: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-50',
            text: 'text-blue-600',
            border: 'border-blue-100',
            badge: 'Attendance & OT',
            badgeColor: 'bg-blue-50 text-blue-600 border-blue-200',
        },
        {
            title: 'Leave',
            description: 'Monitor leave requests, balances, and absence trends.',
            href: route('reports.leave'),
            icon: <FiCalendar className="w-6 h-6" />,
            gradient: 'from-emerald-500 to-emerald-600',
            bg: 'bg-emerald-50',
            text: 'text-emerald-600',
            border: 'border-emerald-100',
            badge: 'Leave Tracking',
            badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        },
        {
            title: 'Salary & Payroll',
            description: 'Review monthly salary postings and payroll summaries.',
            href: route('reports.salary'),
            icon: <FiDollarSign className="w-6 h-6" />,
            gradient: 'from-purple-500 to-purple-600',
            bg: 'bg-purple-50',
            text: 'text-purple-600',
            border: 'border-purple-100',
            badge: 'Payroll',
            badgeColor: 'bg-purple-50 text-purple-600 border-purple-200',
        },
        {
            title: 'Loan Analytics',
            description: 'Track outstanding loans and repayment schedules.',
            href: route('reports.loan'),
            icon: <FiCreditCard className="w-6 h-6" />,
            gradient: 'from-amber-500 to-amber-600',
            bg: 'bg-amber-50',
            text: 'text-amber-600',
            border: 'border-amber-100',
            badge: 'Loans',
            badgeColor: 'bg-amber-50 text-amber-600 border-amber-200',
        },
        {
            title: 'Salary Advance',
            description: 'Manage short-term employee cash advances and repayments.',
            href: route('reports.advance'),
            icon: <FiDollarSign className="w-6 h-6" />,
            gradient: 'from-cyan-500 to-cyan-600',
            bg: 'bg-cyan-50',
            text: 'text-cyan-600',
            border: 'border-cyan-100',
            badge: 'Advances',
            badgeColor: 'bg-cyan-50 text-cyan-600 border-cyan-200',
        },
        {
            title: 'Training',
            description: 'Assess training progress, completion rates, and certifications.',
            href: route('reports.training'),
            icon: <FiBookOpen className="w-6 h-6" />,
            gradient: 'from-indigo-500 to-indigo-600',
            bg: 'bg-indigo-50',
            text: 'text-indigo-600',
            border: 'border-indigo-100',
            badge: 'Learning',
            badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
        },
        {
            title: 'Task Performance',
            description: 'Evaluate task completion rates and project milestones.',
            href: route('reports.task'),
            icon: <FiCheckSquare className="w-6 h-6" />,
            gradient: 'from-pink-500 to-pink-600',
            bg: 'bg-pink-50',
            text: 'text-pink-600',
            border: 'border-pink-100',
            badge: 'Tasks',
            badgeColor: 'bg-pink-50 text-pink-600 border-pink-200',
        },
        {
            title: 'Grievance',
            description: 'Monitor workplace issues and resolution timelines.',
            href: route('reports.grievance'),
            icon: <FiAlertCircle className="w-6 h-6" />,
            gradient: 'from-rose-500 to-rose-600',
            bg: 'bg-rose-50',
            text: 'text-rose-600',
            border: 'border-rose-100',
            badge: 'Grievances',
            badgeColor: 'bg-rose-50 text-rose-600 border-rose-200',
        },
        {
            title: 'Performance Evaluation',
            description: 'Analyze employee performance scores and growth trends.',
            href: route('reports.evaluation'),
            icon: <FiTrendingUp className="w-6 h-6" />,
            gradient: 'from-teal-500 to-teal-600',
            bg: 'bg-teal-50',
            text: 'text-teal-600',
            border: 'border-teal-100',
            badge: 'Evaluation',
            badgeColor: 'bg-teal-50 text-teal-600 border-teal-200',
        }
    ];

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-white tracking-normal">Reports & Analytics</h2>}>
            <Head title="Reports Dashboard" />

            <div className="w-full mx-auto p-6 space-y-8 bg-slate-50 min-h-screen">

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-normal text-slate-900 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <FiBarChart2 size={20} />
                            </span>
                            Intelligence Hub
                        </h1>
                        <p className="text-sm text-slate-500 mt-2 font-normal ml-14">Comprehensive analytics across all organizational modules.</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-normal text-slate-600 uppercase tracking-normal">Live Data Active</span>
                        </div>
                    </div>
                </div>

                {/* Quick Links Banner */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Attendance + OT', href: route('reports.attendance'), color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <FiClock size={16} /> },
                        { label: 'Leave Report', href: route('reports.leave'), color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <FiCalendar size={16} /> },
                        { label: 'Salary Report', href: route('reports.salary'), color: 'text-purple-600 bg-purple-50 border-purple-200', icon: <FiDollarSign size={16} /> },
                        { label: 'Performance', href: route('reports.evaluation'), color: 'text-teal-600 bg-teal-50 border-teal-200', icon: <FiActivity size={16} /> },
                    ].map((item, i) => (
                        <Link key={i} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-sm font-normal text-sm transition-all hover:shadow-md active:scale-95 ${item.color}`}>
                            {item.icon}
                            <span className="font-normal">{item.label}</span>
                            <FiChevronRight className="ml-auto w-4 h-4 opacity-60" />
                        </Link>
                    ))}
                </div>

                {/* Report Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {reportCards.map((report, index) => (
                        <Link
                            key={index}
                            href={report.href}
                            className="group bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden flex flex-col"
                        >
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-5">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm ${report.bg} ${report.text}`}>
                                        {report.icon}
                                    </div>
                                    <span className={`text-[10px] font-normal px-2.5 py-1 rounded-lg border uppercase tracking-normal ${report.badgeColor}`}>
                                        {report.badge}
                                    </span>
                                </div>
                                <h3 className="text-base font-normal text-slate-800 mb-2 group-hover:text-primary transition-colors">{report.title}</h3>
                                <p className="text-sm text-slate-500 font-normal leading-relaxed">{report.description}</p>
                            </div>
                            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-primary/5 transition-colors">
                                <span className="text-[10px] font-normal text-slate-400 uppercase tracking-normal group-hover:text-primary transition-colors">View Report</span>
                                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                                    <FiChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Info Banner */}
                <div className="bg-gradient-to-r from-primary/5 via-blue-50 to-indigo-50 rounded-2xl border border-primary/10 p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-white border border-primary/20 shadow-sm flex items-center justify-center text-primary">
                                <FiUsers size={28} />
                            </div>
                            <div>
                                <h4 className="text-base font-normal text-slate-800">Multi-Branch Analytics</h4>
                                <p className="text-sm text-slate-500 font-normal mt-0.5">All reports support branch and employee-level filtering with overtime tracking.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            {[
                                { label: 'Attendance + OT', color: 'text-blue-600', border: 'border-blue-200', href: route('reports.attendance') },
                                { label: 'Leave', color: 'text-emerald-600', border: 'border-emerald-200', href: route('reports.leave') },
                                { label: 'Payroll', color: 'text-purple-600', border: 'border-purple-200', href: route('reports.salary') },
                            ].map((item, i) => (
                                <Link key={i} href={item.href} className={`flex-1 md:flex-none px-5 py-2.5 bg-white rounded-xl border shadow-sm text-center hover:shadow-md transition-all ${item.border}`}>
                                    <div className={`text-xs font-normal uppercase tracking-normal ${item.color}`}>{item.label}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">→ Open</div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
