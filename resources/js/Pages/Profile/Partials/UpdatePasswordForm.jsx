import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';
import { FiLock, FiCheck } from 'react-icons/fi';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <form onSubmit={updatePassword} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <InputLabel
                            htmlFor="current_password"
                            value="Current Password"
                            className="text-sm font-normal text-slate-700"
                        />
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <FiLock className="w-5 h-5" />
                            </div>
                            <TextInput
                                id="current_password"
                                ref={currentPasswordInput}
                                value={data.current_password}
                                onChange={(e) =>
                                    setData('current_password', e.target.value)
                                }
                                type="password"
                                className="w-full pl-12 pr-4 bg-slate-50 border-slate-200 rounded-lg text-base font-normal py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                autoComplete="current-password"
                                placeholder="Enter your current password"
                            />
                        </div>
                        <InputError
                            message={errors.current_password}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <InputLabel htmlFor="password" value="New Password" className="text-sm font-normal text-slate-700" />
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <FiLock className="w-5 h-5" />
                                </div>
                                <TextInput
                                    id="password"
                                    ref={passwordInput}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    type="password"
                                    className="w-full pl-12 pr-4 bg-slate-50 border-slate-200 rounded-lg text-base font-normal py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    autoComplete="new-password"
                                    placeholder="Enter new password"
                                />
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        <div className="space-y-2">
                            <InputLabel
                                htmlFor="password_confirmation"
                                value="Confirm New Password"
                                className="text-sm font-normal text-slate-700"
                            />
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <FiLock className="w-5 h-5" />
                                </div>
                                <TextInput
                                    id="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData('password_confirmation', e.target.value)
                                    }
                                    type="password"
                                    className="w-full pl-12 pr-4 bg-slate-50 border-slate-200 rounded-lg text-base font-normal py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    autoComplete="new-password"
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                    <PrimaryButton
                        disabled={processing}
                        className="px-8 py-3 bg-primary text-white rounded-lg font-normal text-sm hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 transition-all shadow-lg shadow-indigo-200 group flex items-center gap-2"
                    >
                        {processing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Updating...
                            </>
                        ) : (
                            <>
                                <FiCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Update Password
                            </>
                        )}
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm font-normal text-emerald-600 flex items-center gap-2">
                            <FiCheck className="w-4 h-4" />
                            Password updated successfully!
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
