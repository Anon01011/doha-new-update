import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FiUser, FiMail, FiLock, FiArrowRight, FiCheckCircle, FiShield, FiBriefcase } from 'react-icons/fi';

export default function Register() {
    const { appSettings } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'employee', // Default role as requested
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };



    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
            <Head title={`Join the Team | ${appSettings?.app_name || 'Workforce Manager'}`} />

            {/* Visual Branding Side - MD+ */}
            <div className="relative hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-slate-950">
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-blue-600/20"></div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-indigo-950/40 to-transparent"></div>

                <div className="relative z-10 w-full p-16 flex flex-col justify-between">
                    <div>
                        <div className="flex flex-col items-center md:items-start gap-4 mb-12">
                            <div className="p-3 bg-white/10 rounded-lg border border-white/20 backdrop-blur-md">
                                <ApplicationLogo src={appSettings?.app_logo} className="h-10 w-auto invert brightness-0" />
                            </div>
                            <span className="text-white font-normal tracking-[0.3em] text-sm uppercase opacity-90">{appSettings?.app_name || 'EMPLOYEE MANAGEMENT'}</span>
                        </div>

                        <div className="max-w-xl">
                            <h1 className="text-6xl lg:text-7xl font-normal text-white leading-tight tracking-normal mb-8">
                                Start your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-blue-200 to-indigo-100 italic">journey</span> with us.
                            </h1>
                            <p className="text-xl text-slate-300 font-normal leading-relaxed mb-12">
                                Join our professional ecosystem built for elite performance, transparent growth, and team excellence.
                            </p>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white">
                                        <FiBriefcase className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-white font-normal">Career Growth</h4>
                                    <p className="text-slate-400 text-sm">Track your progress and unlock new opportunities within.</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white">
                                        <FiCheckCircle className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-white font-normal">Easy Onboarding</h4>
                                    <p className="text-slate-400 text-sm">Get set up in minutes and access all your resources.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-slate-500 text-sm font-normal">
                        © {new Date().getFullYear()} {appSettings?.app_name || 'HR Portal'}. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Registration Form Side */}
            <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-24 bg-slate-50 relative">
                <div className="md:hidden absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-indigo-600 to-indigo-800 -z-0"></div>

                <div className="w-full max-w-md mx-auto relative z-10">
                    <div className="mb-10 text-center md:text-left">
                        <div className="md:hidden flex flex-col items-center mb-8">
                            <div className="p-4 bg-white rounded-lg shadow-2xl mb-4 border border-slate-100">
                                <ApplicationLogo src={appSettings?.app_logo} className="h-12 w-auto" />
                            </div>
                            <span className="text-slate-900 font-normal tracking-[0.2em] text-xs uppercase">{appSettings?.app_name || 'EMPLOYEE MANAGEMENT'}</span>
                        </div>

                        <h2 className="text-4xl font-normal text-slate-900 tracking-normal mb-3">Create account</h2>
                        <p className="text-slate-500 font-normal">Please fill in your details to join the organization.</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-xl shadow-slate-200/50 p-8 border border-white">
                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <InputLabel htmlFor="name" value="Full Name" className="text-[11px] font-normal text-slate-400 uppercase tracking-normal mb-2 block" />
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-600">
                                        <FiUser className="w-5 h-5 text-slate-300" />
                                    </div>
                                    <TextInput
                                        id="name"
                                        name="name"
                                        value={data.name}
                                        className="pl-12 block w-full bg-slate-50 border-transparent rounded-lg py-3 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 placeholder:text-slate-300 text-slate-700 font-normal"
                                        placeholder="John Carter"
                                        autoComplete="name"
                                        isFocused={true}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.name} className="mt-2 text-xs font-normal" />
                            </div>

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
                                        className="pl-12 block w-full bg-slate-50 border-transparent rounded-lg py-3 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 placeholder:text-slate-300 text-slate-700 font-normal"
                                        placeholder="john@example.com"
                                        autoComplete="username"
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-2 text-xs font-normal" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password" value="Password" className="text-[11px] font-normal text-slate-400 uppercase tracking-normal mb-2 block" />
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-600">
                                        <FiLock className="w-5 h-5 text-slate-300" />
                                    </div>
                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className="pl-12 block w-full bg-slate-50 border-transparent rounded-lg py-3 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 placeholder:text-slate-300 text-slate-700 font-normal"
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.password} className="mt-2 text-xs font-normal" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password_confirmation" value="Confirm Password" className="text-[11px] font-normal text-slate-400 uppercase tracking-normal mb-2 block" />
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-600">
                                        <FiCheckCircle className="w-5 h-5 text-slate-300" />
                                    </div>
                                    <TextInput
                                        id="password_confirmation"
                                        type="password"
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        className="pl-12 block w-full bg-slate-50 border-transparent rounded-lg py-3 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 placeholder:text-slate-300 text-slate-700 font-normal"
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.password_confirmation} className="mt-2 text-xs font-normal" />
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-lg bg-primary hover:bg-slate-900 text-white font-normal tracking-normal transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-200 group active:scale-[0.98] disabled:opacity-50 mt-4"
                            >
                                {processing ? (
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        Join Workforce Now
                                        <FiArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="mt-10 text-center">
                        <p className="text-sm font-normal text-slate-400">
                            Already part of the team?{' '}
                            <Link
                                href={route('login')}
                                className="text-indigo-600 hover:text-slate-900 transition-colors underline underline-offset-4 decoration-indigo-200"
                            >
                                Log in to your portal
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
