import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FiMail, FiArrowRight, FiCheckCircle, FiShield, FiArrowLeft } from 'react-icons/fi';

export default function ForgotPassword({ status }) {
    const { appSettings } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };



    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
            <Head title={`Forgot Password | ${appSettings?.app_name || 'Workforce Manager'}`} />

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
                            <div className="p-3 bg-white/10 rounded-lg border border-white/20 backdrop-blur-md">
                                <ApplicationLogo src={appSettings?.app_logo} className="h-10 w-auto invert brightness-0" />
                            </div>
                            <span className="text-white font-normal tracking-[0.3em] text-sm uppercase opacity-90">{appSettings?.app_name || 'EMPLOYEE MANAGEMENT'}</span>
                        </div>

                        <div className="max-w-xl">
                            <h1 className="text-6xl lg:text-7xl font-normal text-white leading-tight tracking-normal mb-8">
                                Secure your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-blue-200 to-indigo-100 italic">account</span> access.
                            </h1>
                            <p className="text-xl text-slate-300 font-normal leading-relaxed mb-12">
                                Don't worry, it happens to the best of us. We'll help you get back to managing your workforce in no time.
                            </p>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white">
                                        <FiCheckCircle className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-white font-normal">Secure Recovery</h4>
                                    <p className="text-slate-400 text-sm">Safe and industry-standard password reset process.</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white">
                                        <FiShield className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-white font-normal">Account Protection</h4>
                                    <p className="text-slate-400 text-sm">Your data security is our top priority.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-slate-500 text-sm font-normal">
                        © {new Date().getFullYear()} {appSettings?.app_name || 'HR Portal'}. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Form Side */}
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

                        <Link
                            href={route('login')}
                            className="inline-flex items-center gap-2 text-sm font-normal text-slate-400 hover:text-indigo-600 transition-colors mb-6 group"
                        >
                            <FiArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Back to Login
                        </Link>
                        <h2 className="text-4xl font-normal text-slate-900 tracking-normal mb-3">Recover Password</h2>
                        <p className="text-slate-500 font-normal">
                            Forgot your password? No problem. Just let us know your email address and we will email you a password reset link.
                        </p>
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
                                        className="pl-12 block w-full bg-slate-50 border-transparent rounded-lg py-3.5 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 placeholder:text-slate-300 text-slate-700 font-normal"
                                        placeholder="your@email.com"
                                        isFocused={true}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-2 text-xs font-normal" />
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
                                        Email Password Reset Link
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
