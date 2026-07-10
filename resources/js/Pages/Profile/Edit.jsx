import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import Avatar from '@/Components/Avatar';
import { FiUser, FiLock, FiShield, FiBriefcase, FiMail, FiSettings } from 'react-icons/fi';
import { useState } from 'react';

export default function Edit({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user;
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', label: 'Profile', icon: FiUser },
        { id: 'security', label: 'Security', icon: FiLock },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                        <FiSettings className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-normal text-slate-800">Account Settings</h2>
                        <p className="text-xs text-slate-400 font-normal">Manage your profile and preferences</p>
                    </div>
                </div>
            }
        >
            <Head title="Profile Settings" />

            <div className="max-w mx-auto">
                {/* Modern Profile Card */}
                <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden mb-6">
                    {/* Gradient Header Background */}
                    <div className="relative h-40 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6TTI0IDM0YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xL7k5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSAzLTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSAzIDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
                    </div>

                    {/* Profile Info Section */}
                    <div className="px-8 pb-6 -mt-16">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                            {/* Avatar and Info */}
                            <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
                                <div className="relative z-10">
                                    <Avatar
                                        src={user.image || user.employee?.employee_image}
                                        name={user.name}
                                        size="2xl"
                                        className="ring-4 ring-white shadow-2xl"
                                    />
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                </div>

                                <div className="text-center md:text-left">
                                    <h1 className="text-2xl font-normal text-slate-900 mb-2">{user.name}</h1>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-normal border border-indigo-100">
                                            <FiBriefcase className="w-3.5 h-3.5" />
                                            {user.employee?.designation || 'Staff Member'}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-normal border border-purple-100">
                                            <FiShield className="w-3.5 h-3.5" />
                                            {user.role}
                                        </span>
                                        {user.employee?.employee_code && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 text-slate-700 text-xs font-normal border border-slate-100">
                                                EMP-{user.employee.employee_code}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-slate-600">
                                        <FiMail className="w-4 h-4" />
                                        <span className="text-sm font-normal">{user.email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-sm font-normal text-emerald-700">Active Account</span>
                            </div>
                        </div>
                    </div>

                    {/* Modern Tabs */}
                    <div className="border-b border-slate-200 px-8">
                        <div className="flex gap-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`relative px-6 py-3 font-normal text-sm transition-all ${activeTab === tab.id
                                            ? 'text-indigo-600'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-4 h-4" />
                                            {tab.label}
                                        </div>
                                        {activeTab === tab.id && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-full"></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="animate-in fade-in duration-300">
                    {activeTab === 'profile' && (
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                    )}

                    {activeTab === 'security' && (
                        <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                                        <FiLock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-normal text-slate-800">Security Settings</h3>
                                        <p className="text-sm text-slate-500 font-normal">Manage your password and security preferences</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8">
                                <UpdatePasswordForm />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
