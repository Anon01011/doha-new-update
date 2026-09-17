import React, { useState, useEffect } from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    FiMail, FiLock, FiArrowRight, FiCheckCircle, FiShield,
    FiEye, FiEyeOff, FiUsers, FiUserCheck, FiDollarSign,
    FiBriefcase, FiAward, FiCheck, FiKey, FiZap,
    FiBarChart2, FiClock, FiGlobe
} from 'react-icons/fi';

export default function Login({ status, canResetPassword }) {
    const { appSettings } = usePage().props;

    // Derive primary color from settings with fallback
    const primary   = appSettings?.theme_color     || '#090b4e';
    const secondary = appSettings?.secondary_color  || '#103c7f';
    const accent    = appSettings?.accent_color     || '#818cf8';
    const appName   = appSettings?.app_name         || 'HRMS Enterprise';
    const appLogo   = appSettings?.app_logo;

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const [showPassword, setShowPassword]   = useState(false);
    const [selectedRole, setSelectedRole]   = useState(null);
    const [mounted, setMounted]             = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const demoRoles = [
        {
            id: 'admin',
            title: 'Super Admin',
            email: 'admin@earth.com',
            password: 'password',
            icon: FiShield,
            desc: 'Full system access',
        },
        {
            id: 'hr',
            title: 'HR Manager',
            email: 'hr@earth.com',
            password: 'password',
            icon: FiAward,
            desc: 'People & talent ops',
        },
        {
            id: 'manager',
            title: 'Branch Manager',
            email: 'manager@earth.com',
            password: 'password',
            icon: FiBriefcase,
            desc: 'Operations & shifts',
        },
        {
            id: 'finance',
            title: 'Finance Lead',
            email: 'finance@earth.com',
            password: 'password',
            icon: FiDollarSign,
            desc: 'Payroll & expenses',
        },
        {
            id: 'employee',
            title: 'Employee',
            email: 'employee@earth.com',
            password: 'password',
            icon: FiUsers,
            desc: 'Self-service portal',
        },
    ];

    const applyDemoRole = (role) => {
        setSelectedRole(role.id);
        setData({ email: role.email, password: role.password, remember: true });
    };

    useEffect(() => {
        const savedEmail = localStorage.getItem('remember_email');
        if (savedEmail) {
            setData(prev => ({
                ...prev,
                email: savedEmail,
                password: localStorage.getItem('remember_password') || '',
                remember: true,
            }));
        }
    }, []);

    const submit = (e) => {
        e.preventDefault();
        if (data.remember) {
            localStorage.setItem('remember_email', data.email);
            localStorage.setItem('remember_password', data.password);
        } else {
            localStorage.removeItem('remember_email');
            localStorage.removeItem('remember_password');
        }
        post(route('login'), { onFinish: () => reset('password') });
    };

    // Features shown on the left panel
    const features = [
        { icon: FiUsers,     label: 'Multi-Company Workforce',   desc: 'Manage thousands of employees across unlimited branches from one platform.' },
        { icon: FiBarChart2, label: 'Real-Time Analytics',        desc: 'Attendance trends, payroll reports, and HR insights updated live.' },
        { icon: FiClock,     label: 'Shift & Attendance Control', desc: 'Rosters, biometric punch-in, overtime, and absence tracking.' },
        { icon: FiGlobe,     label: 'Multi-Tenant SaaS',          desc: 'Isolated data per company with role-based access on every level.' },
    ];

    return (
        <div
            className="min-h-screen flex overflow-hidden"
            style={{ fontFamily: appSettings?.app_font ? `'${appSettings.app_font}', sans-serif` : 'Inter, sans-serif' }}
        >
            <Head title={`Sign In — ${appName}`} />

            {/* ─── LEFT PANEL ─── */}
            <div
                className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between overflow-hidden"
                style={{ background: `linear-gradient(145deg, ${primary} 0%, ${secondary} 60%, ${primary}cc 100%)` }}
            >
                {/* Decorative shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full opacity-10"
                        style={{ background: accent }} />
                    <div className="absolute top-1/2 -right-24 w-[340px] h-[340px] rounded-full opacity-10"
                        style={{ background: accent }} />
                    <div className="absolute -bottom-20 left-1/4 w-[280px] h-[280px] rounded-full opacity-[0.07]"
                        style={{ background: accent }} />
                    {/* Dot grid */}
                    <div className="absolute inset-0 opacity-[0.04]"
                        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                </div>

                {/* Top: logo + app name */}
                <div className="relative z-10 px-12 pt-12">
                    <div className="flex items-center gap-3 mb-16">
                        {appLogo ? (
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center">
                                <ApplicationLogo src={appLogo} className="h-8 w-auto object-contain" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20"
                                style={{ background: `${accent}30` }}>
                                <FiZap className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <div>
                            <span className="text-white font-bold text-base tracking-wide block">{appName}</span>
                            <span className="text-white/50 text-[11px] tracking-widest uppercase">Enterprise Suite</span>
                        </div>
                    </div>

                    {/* Headline */}
                    <div className="mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 text-white/70 text-[11px] font-medium mb-5"
                            style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
                            Trusted by 10,000+ organisations worldwide
                        </div>
                        <h1 className="text-white font-extrabold text-4xl xl:text-5xl leading-[1.15] tracking-tight">
                            One platform.<br />
                            <span style={{ color: accent }}>Complete HR control.</span>
                        </h1>
                        <p className="mt-5 text-white/60 text-sm leading-relaxed max-w-md">
                            Payroll, attendance, appraisals, expense management, offboarding —
                            all unified in a secure, multi-tenant architecture built to scale.
                        </p>
                    </div>

                    {/* Feature list */}
                    <div className="space-y-5">
                        {features.map((f, i) => {
                            const Icon = f.icon;
                            return (
                                <div key={i} className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border border-white/15"
                                        style={{ background: 'rgba(255,255,255,0.08)' }}>
                                        <Icon className="w-4 h-4 text-white/80" />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-semibold leading-tight">{f.label}</p>
                                        <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom footer */}
                <div className="relative z-10 px-12 pb-10">
                    <div className="border-t border-white/10 pt-6 flex items-center justify-between">
                        <span className="text-white/40 text-xs">© {new Date().getFullYear()} {appName}. All rights reserved.</span>
                        <div className="flex items-center gap-1.5 text-white/40 text-xs">
                            <FiShield className="w-3.5 h-3.5" />
                            <span>SOC 2 Ready</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── RIGHT PANEL ─── */}
            <div className="flex-1 flex flex-col justify-center items-center bg-slate-50 px-5 sm:px-10 py-12 overflow-y-auto">

                {/* Mobile logo */}
                <div className="lg:hidden flex flex-col items-center mb-8 gap-2">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow"
                        style={{ background: primary }}>
                        {appLogo
                            ? <ApplicationLogo src={appLogo} className="h-8 w-auto object-contain" />
                            : <FiZap className="w-6 h-6 text-white" />
                        }
                    </div>
                    <span className="font-bold text-slate-800 text-lg tracking-wide">{appName}</span>
                    <span className="text-xs text-slate-500">Enterprise HR Platform</span>
                </div>

                <div className="w-full max-w-md">

                    {/* Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/5 p-7 sm:p-9">

                        {/* Header */}
                        <div className="mb-7">
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
                            <p className="text-slate-500 text-sm mt-1">Sign in to your workspace to continue.</p>
                        </div>

                        {/* Status message */}
                        {status && (
                            <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                                <FiCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <p className="text-xs font-medium text-emerald-700">{status}</p>
                            </div>
                        )}

                        {/* Demo accounts */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                    <FiKey className="w-3 h-3" style={{ color: primary }} />
                                    Demo Accounts
                                </span>
                                <span className="text-[10px] text-slate-400">Click to auto-fill</span>
                            </div>
                            <div className="grid grid-cols-5 gap-1.5">
                                {demoRoles.map((role) => {
                                    const Icon = role.icon;
                                    const isSelected = selectedRole === role.id;
                                    return (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => applyDemoRole(role)}
                                            title={`${role.title} — ${role.email}`}
                                            className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border text-center transition-all cursor-pointer"
                                            style={isSelected ? {
                                                background: `${primary}12`,
                                                borderColor: primary,
                                                color: primary,
                                            } : {
                                                background: '#f8fafc',
                                                borderColor: '#e2e8f0',
                                                color: '#64748b',
                                            }}
                                        >
                                            <div
                                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                                style={isSelected
                                                    ? { background: `${primary}20`, color: primary }
                                                    : { background: '#f1f5f9', color: '#94a3b8' }
                                                }
                                            >
                                                {isSelected
                                                    ? <FiCheck className="w-3.5 h-3.5" />
                                                    : <Icon className="w-3.5 h-3.5" />
                                                }
                                            </div>
                                            <span className="text-[10px] font-semibold leading-tight" style={isSelected ? { color: primary } : { color: '#475569' }}>
                                                {role.title}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex-1 h-px bg-slate-100" />
                            <span className="text-[11px] text-slate-400 font-medium">or enter credentials</span>
                            <div className="flex-1 h-px bg-slate-100" />
                        </div>

                        {/* Form */}
                        <form onSubmit={submit} className="space-y-4">

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <FiMail className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        autoComplete="username"
                                        required
                                        placeholder="you@company.com"
                                        onChange={(e) => { setData('email', e.target.value); setSelectedRole(null); }}
                                        className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all placeholder:text-slate-400"
                                        onFocus={e => { e.target.style.borderColor = primary; e.target.style.boxShadow = `0 0 0 3px ${primary}18`; e.target.style.background = '#fff'; }}
                                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                                    />
                                </div>
                                {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="password" className="text-xs font-semibold text-slate-700">
                                        Password
                                    </label>
                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-xs font-medium transition-colors hover:underline"
                                            style={{ color: primary }}
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <FiLock className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        autoComplete="current-password"
                                        required
                                        placeholder="••••••••"
                                        onChange={(e) => { setData('password', e.target.value); setSelectedRole(null); }}
                                        className="w-full pl-10 pr-11 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all placeholder:text-slate-400"
                                        onFocus={e => { e.target.style.borderColor = primary; e.target.style.boxShadow = `0 0 0 3px ${primary}18`; e.target.style.background = '#fff'; }}
                                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
                            </div>

                            {/* Remember */}
                            <div className="flex items-center justify-between pt-0.5">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        id="remember"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                                        style={{ accentColor: primary }}
                                    />
                                    <span className="text-xs text-slate-600 font-medium">Keep me signed in</span>
                                </label>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full mt-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold shadow-lg transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                                style={{
                                    background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
                                    boxShadow: `0 8px 24px ${primary}40`,
                                }}
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Authenticating…
                                    </span>
                                ) : (
                                    <>
                                        Sign In to Workspace
                                        <FiArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Security note */}
                    <div className="mt-5 flex items-center justify-center gap-2 text-slate-400 text-[11px]">
                        <FiShield className="w-3.5 h-3.5" />
                        <span>256-bit encrypted · Role-based access · Multi-tenant isolation</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
