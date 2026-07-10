import React from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FiMail, FiLock, FiArrowRight, FiCheckCircle, FiShield, FiEye, FiEyeOff } from 'react-icons/fi';

export default function Login({ status, canResetPassword, quickLoginOptions }) {
    const { appSettings } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = React.useState(false);

    React.useEffect(() => {
        const savedEmail = localStorage.getItem('remember_email');
        const savedPassword = localStorage.getItem('remember_password');
        if (savedEmail) {
            setData(prev => ({
                ...prev,
                email: savedEmail,
                password: savedPassword || '',
                remember: true
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

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };



    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
            <Head title={`Login | ${appSettings?.app_name || 'Workforce Manager'}`} />

            {/* Visual Branding Side - Visible on MD+ */}
            <div className="relative hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-slate-950">
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-blue-600/20"></div>
                </div>

                {/* Gradient Overlay for Depth */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-indigo-950/40 to-transparent"></div>

                {/* Content Overlay */}
                <div className="relative z-10 w-full p-16 flex flex-col justify-between">
                    <div>
                        <div className="flex flex-col items-center md:items-start gap-4 mb-12">
                            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 backdrop-blur-md inline-block">
                                <ApplicationLogo src={appSettings?.app_logo} className="h-12 w-auto object-contain" />
                            </div>
                            <span className="text-white font-normal tracking-[0.3em] text-sm uppercase opacity-90">{appSettings?.app_name || 'EMPLOYEE MANAGEMENT'}</span>
                        </div>

                        <div className="max-w-xl">
                            <h1 className="text-6xl lg:text-7xl font-normal text-white leading-tight tracking-normal mb-8">
                                Empower your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-blue-200 to-indigo-100 italic">workforce</span> with precision.
                            </h1>
                            <p className="text-xl text-slate-300 font-normal leading-relaxed mb-12">
                                Experience the industry-leading workforce management platform designed for attendance, payroll, and team growth.
                            </p>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shadow-lg">
                                        <FiCheckCircle className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-white font-normal text-lg">Smart Attendance</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">Automated check-ins, shift rosters, and real-time tracking.</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shadow-lg">
                                        <FiShield className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-white font-normal text-lg">People-First HR</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">Streamlined payroll, document management, and leave requests.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-slate-500 text-sm font-normal">
                        © {new Date().getFullYear()} {appSettings?.app_name || 'HR Portal'}. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Login Form Side */}
            <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-24 bg-slate-50 relative">
                {/* Floating Shapes for Decoration */}
                <div className="md:hidden absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-indigo-600 to-indigo-800 -z-0"></div>

                <div className="w-full max-w-md mx-auto relative z-10">
                    <div className="mb-10 text-center md:text-left">
                        {/* Mobile Logo */}
                        <div className="md:hidden flex flex-col items-center mb-8">
                            <div className="p-4 bg-white rounded-lg shadow-2xl mb-4 border border-slate-100">
                                <ApplicationLogo src={appSettings?.app_logo} className="h-12 w-auto" />
                            </div>
                            <span className="text-slate-900 font-normal tracking-[0.2em] text-xs uppercase">{appSettings?.app_name || 'EMPLOYEE MANAGEMENT'}</span>
                        </div>

                        <h2 className="text-4xl font-normal text-slate-900 tracking-normal mb-3">Sign in</h2>
                        <p className="text-slate-500 font-normal">Enter your credentials to access your workspace.</p>
                    </div>

                    {status && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-3">
                            <FiCheckCircle className="text-emerald-500 w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-normal text-emerald-700 leading-tight">{status}</p>
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow-xl shadow-slate-200/50 p-8 border border-white">
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <InputLabel htmlFor="email" value="Email Address" className="text-[11px] font-normal text-slate-400 uppercase tracking-normal mb-2 block" />
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-600">
                                        <FiMail className="w-5 h-5 text-slate-300" />
                                    </div>
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="pl-12 block w-full bg-slate-50 border-slate-200 rounded-lg py-3.5 focus:bg-white focus:ring-1 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 placeholder:text-slate-300 text-slate-700 font-normal"
                                        placeholder="your@email.com"
                                        autoComplete="username"
                                        isFocused={true}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-2 text-xs font-normal" />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <InputLabel htmlFor="password" value="Password" className="text-[11px] font-normal text-slate-400 uppercase tracking-normal block" />
                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-xs font-normal text-indigo-600 hover:text-indigo-700 underline underline-offset-4 decoration-indigo-200"
                                        >
                                            Forgot?
                                        </Link>
                                    )}
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-600">
                                        <FiLock className="w-5 h-5 text-slate-300" />
                                    </div>
                                    <TextInput
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        className="pl-12 pr-12 block w-full bg-slate-50 border-slate-200 rounded-lg py-3.5 focus:bg-white focus:ring-1 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 placeholder:text-slate-300 text-slate-700 font-normal"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} className="mt-2 text-xs font-normal" />
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-5 w-5 bg-slate-50 border-slate-200 rounded-lg text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="remember" className="ml-3 text-sm font-normal text-slate-500 cursor-pointer select-none">Keep me signed in</label>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-lg bg-primary hover:bg-slate-900 text-white font-normal tracking-normal transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-200 group active:scale-[0.98] disabled:opacity-50"
                            >
                                {processing ? (
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        Get Started
                                        <FiArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </form>


                    </div>


                </div>
            </div>
        </div>
    );
}
