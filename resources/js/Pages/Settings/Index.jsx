import SettingsLayout from './SettingsLayout';
import { Link } from '@inertiajs/react';

export default function Index({ mailSettings, systemSettings }) {
    const settingsSections = [
        {
            id: 'system',
            name: 'System Settings',
            description: 'Application name, URL, timezone, and locale configuration',
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
            ),
            href: route('settings.system'),
            color: 'blue'
        },
        {
            id: 'mail',
            name: 'Mail Settings',
            description: 'Configure SMTP, PHP mail, and email providers',
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            href: route('settings.mail'),
            color: 'indigo'
        },
        {
            id: 'attendance',
            name: 'Attendance',
            description: 'Clock-in/out rules, overtime, and break policies',
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            href: route('settings.attendance'),
            color: 'emerald'
        },
        {
            id: 'leave',
            name: 'Leave Management',
            description: 'Leave accrual, carry-forward, and approval workflow',
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            href: route('settings.leave'),
            color: 'rose'
        },
        {
            id: 'payroll',
            name: 'Payroll Configuration',
            description: 'Pay periods, deductions, and salary calculations',
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            href: route('settings.payroll'),
            color: 'amber'
        },
        {
            id: 'training',
            name: 'Training Settings',
            description: 'Certificates, evaluations, and completion rules',
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            href: route('settings.training'),
            color: 'purple'
        },
        {
            id: 'tasks',
            name: 'Task Management',
            description: 'Priorities, assignments, and notifications',
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
            href: route('settings.tasks'),
            color: 'cyan'
        },
        {
            id: 'projects',
            name: 'Project Settings',
            description: 'Roles, milestones, and budget tracking',
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            href: route('settings.projects'),
            color: 'violet'
        },
        {
            id: 'grievances',
            name: 'Grievance Settings',
            description: 'SLA, escalation rules, and privacy options',
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
            ),
            href: route('settings.grievances'),
            color: 'orange'
        },
        {
            id: 'documents',
            name: 'Document Management',
            description: 'Expiry alerts, required docs, and retention',
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            href: route('settings.documents'),
            color: 'slate'
        },
        {
            id: 'dropdown-options',
            name: 'Dropdown Options',
            description: 'Manage dropdown values for all modules',
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            ),
            href: route('settings.dropdown-options.index'),
            color: 'gray'
        },
        {
            id: 'integrations',
            name: 'Integrations & Notifications',
            description: 'Manage third-party API integrations and notification channels',
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            href: route('settings.integrations'),
            color: 'emerald'
        },
        {
            id: 'employee',
            name: 'Employee Configuration',
            description: 'Employee code prefixes, probation periods, and data integrity',
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            href: route('settings.employee'),
            color: 'indigo'
        },
        {
            id: 'loans',
            name: 'Loan Configuration',
            description: 'Loan limits, interest rates, and approval workflows',
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            href: route('settings.loans'),
            color: 'emerald'
        }
    ];

    const colorMap = {
        blue: 'from-blue-500 to-blue-600 shadow-blue-100 text-blue-600 bg-blue-50',
        indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-100 text-indigo-600 bg-indigo-50',
        emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-100 text-emerald-600 bg-emerald-50',
        rose: 'from-rose-500 to-rose-600 shadow-rose-100 text-rose-600 bg-rose-50',
        amber: 'from-amber-500 to-amber-600 shadow-amber-100 text-amber-600 bg-amber-50',
        purple: 'from-purple-500 to-purple-600 shadow-purple-100 text-purple-600 bg-purple-50',
        cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-100 text-cyan-600 bg-cyan-50',
        violet: 'from-violet-500 to-violet-600 shadow-violet-100 text-violet-600 bg-violet-50',
        orange: 'from-orange-500 to-orange-600 shadow-orange-100 text-orange-600 bg-orange-50',
        slate: 'from-slate-500 to-slate-600 shadow-slate-100 text-slate-600 bg-slate-50',
        gray: 'from-gray-500 to-gray-600 shadow-gray-100 text-gray-600 bg-gray-50',
    };

    return (
        <SettingsLayout
            activeTab="overview"
            title="Settings Overview"
            description="Manage your application configuration, mail settings, and system preferences from a central dashboard."
        >
            {/* Quick Stats/Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="glass-card premium-shadow p-4 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-normal text-blue-500 uppercase tracking-normal bg-blue-50 px-2 py-0.5 rounded-full">Active</span>
                    </div>
                    <p className="text-xs font-normal text-gray-500 uppercase tracking-normal mb-0.5">Mail Driver</p>
                    <p className="text-lg font-normal text-gray-900 tracking-normal">{mailSettings.mail_mailer}</p>
                </div>

                <div className="glass-card premium-shadow p-4 rounded-lg border-l-4 border-emerald-500">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-normal text-emerald-500 uppercase tracking-normal bg-emerald-50 px-2 py-0.5 rounded-full">System</span>
                    </div>
                    <p className="text-xs font-normal text-gray-500 uppercase tracking-normal mb-0.5">App Name</p>
                    <p className="text-lg font-normal text-gray-900 tracking-normal truncate">{systemSettings.app_name}</p>
                </div>

                <div className="glass-card premium-shadow p-4 rounded-lg border-l-4 border-purple-500">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-normal text-purple-500 uppercase tracking-normal bg-purple-50 px-2 py-0.5 rounded-full">Global</span>
                    </div>
                    <p className="text-xs font-normal text-gray-500 uppercase tracking-normal mb-0.5">Timezone</p>
                    <p className="text-lg font-normal text-gray-900 tracking-normal truncate">{systemSettings.app_timezone}</p>
                </div>

                <div className="glass-card premium-shadow p-4 rounded-lg border-l-4 border-amber-500">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-normal text-amber-500 uppercase tracking-normal bg-amber-50 px-2 py-0.5 rounded-full">Contact</span>
                    </div>
                    <p className="text-xs font-normal text-gray-500 uppercase tracking-normal mb-0.5">From Email</p>
                    <p className="text-lg font-normal text-gray-900 tracking-normal truncate">{mailSettings.mail_from_address}</p>
                </div>
            </div>

            {/* Settings Grid */}
            <h2 className="text-xl font-normal text-gray-900 tracking-normal mb-4">Configuration Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {settingsSections.map((section) => (
                    <Link
                        key={section.id}
                        href={section.href}
                        className="group relative bg-white p-5 rounded-lg premium-shadow premium-shadow-hover transition-all duration-300 border border-gray-100 overflow-hidden"
                    >
                        {/* Background Gradient Blob */}
                        <div className={`absolute -right-12 -top-12 w-32 h-32 bg-gradient-to-br ${colorMap[section.color].split(' ').slice(0, 2).join(' ')} opacity-[0.03] group-hover:opacity-[0.08] rounded-full transition-opacity duration-500`}></div>

                        <div className="relative flex items-start space-x-4">
                            <div className={`flex-shrink-0 p-3 rounded-lg bg-gradient-to-br ${colorMap[section.color].split(' ').slice(0, 2).join(' ')} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                {section.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-normal text-gray-900 tracking-normal mb-1 group-hover:text-blue-600 transition-colors">
                                    {section.name}
                                </h3>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {section.description}
                                </p>
                                <div className="mt-3 flex items-center text-[10px] font-normal text-blue-600 uppercase tracking-normal opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                                    <span>Configure Now</span>
                                    <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick Actions Footer */}
            <div className="mt-10 bg-gradient-to-br from-gray-900 to-slate-800 rounded-[2rem] p-6 text-white premium-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 blur-[60px] rounded-full"></div>

                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-lg font-normal tracking-normal mb-1">Need help with configuration?</h3>
                        <p className="text-sm text-gray-400 max-w-md">Check our documentation or view system logs to troubleshoot any issues with your settings.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => window.open('/storage/logs/laravel.log', '_blank')}
                            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-sm font-normal rounded-lg transition-all border border-white/10 flex items-center gap-2"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            View Logs
                        </button>
                        <Link
                            href={route('settings.system')}
                            className="px-5 py-2.5 bg-primary hover:bg-blue-500 text-white text-sm font-normal rounded-lg transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            </svg>
                            System Status
                        </Link>
                    </div>
                </div>
            </div>
        </SettingsLayout>
    );
}