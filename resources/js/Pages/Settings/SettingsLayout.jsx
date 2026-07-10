import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function SettingsLayout({ children, activeTab, title, description }) {
    const navigation = [
        {
            id: 'overview',
            name: 'Overview',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            ),
            href: route('settings.index'),
        },
        {
            id: 'system',
            name: 'System',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
            ),
            href: route('settings.system'),
        },
        {
            id: 'mail',
            name: 'Mail',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            href: route('settings.mail'),
        },
        {
            id: 'integrations',
            name: 'Integrations',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            href: route('settings.integrations'),
        },
        {
            id: 'attendance',
            name: 'Attendance',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            href: route('settings.attendance'),
        },
        {
            id: 'leave',
            name: 'Leave',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            href: route('settings.leave'),
        },
        {
            id: 'payroll',
            name: 'Payroll',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            href: route('settings.payroll'),
        },
        {
            id: 'training',
            name: 'Training',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            href: route('settings.training'),
        },
        {
            id: 'tasks',
            name: 'Tasks',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
            href: route('settings.tasks'),
        },
        {
            id: 'projects',
            name: 'Projects',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            href: route('settings.projects'),
        },
        {
            id: 'grievances',
            name: 'Grievances',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
            ),
            href: route('settings.grievances'),
        },
        {
            id: 'documents',
            name: 'Documents',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            href: route('settings.documents'),
        },
        {
            id: 'loans',
            name: 'Loans',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            href: route('settings.loans'),
        },
        {
            id: 'employee',
            name: 'Employee',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            href: route('settings.employee'),
        },
        {
            id: 'dropdown-options',
            name: 'Dropdowns',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            ),
            href: route('settings.dropdown-options.index'),
        },
    ];

    return (
        <AuthenticatedLayout header={title}>
            <Head title={title} />

            <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-gray-50/50">
                {/* Settings Sidebar */}
                <aside className="w-full lg:w-56 bg-white border-r border-gray-200 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] overflow-y-auto">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-700">
                        <h2 className="text-xs font-normal text-white tracking-normal leading-tight">Settings</h2>
                        <p className="text-[10px] text-blue-100 opacity-80 leading-tight">Manage preferences</p>
                    </div>
                    <nav className="p-1.5 space-y-0.5">
                        {navigation.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all duration-200 group ${activeTab === item.id
                                    ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                                    }`}
                            >
                                <div className={`p-1 rounded-md transition-colors ${activeTab === item.id
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500'
                                    }`}>
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {item.icon.props.children}
                                    </svg>
                                </div>
                                <span className="text-xs font-normal">{item.name}</span>
                                {activeTab === item.id && (
                                    <div className="ml-auto w-1 h-1 rounded-full bg-blue-600 animate-pulse"></div>
                                )}
                            </Link>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 p-3 lg:p-5 overflow-x-hidden">
                    <div className="max-w-full mx-auto">
                        <div className="mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-xl font-normal text-gray-900 tracking-normal mb-1">{title}</h1>
                            {description && (
                                <p className="text-gray-500 text-xs max-w-3xl leading-relaxed">{description}</p>
                            )}
                        </div>

                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                            {children}
                        </div>
                    </div>
                </main>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .glass-card {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                .premium-shadow {
                    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
                }
                .premium-shadow-hover:hover {
                    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                }
            `}} />
        </AuthenticatedLayout>
    );
}
