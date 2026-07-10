import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import Avatar from '@/Components/Avatar';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { FiCamera, FiCheck, FiUser, FiMail, FiAlertCircle } from 'react-icons/fi';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;
    const [imagePreview, setImagePreview] = useState(null);
    const fileInput = useRef();

    const { data, setData, post, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            image: null,
            _method: 'PATCH',
        });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('profile.update'), {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    return (
        <section className={`${className} bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden`}>
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                        <FiUser className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-normal text-slate-800 tracking-normal">
                            Profile Information
                        </h2>
                        <p className="text-sm text-slate-500 font-normal">
                            Update your personal details and photo
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={submit} className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Avatar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8">
                            <div className="text-center">
                                <div className="relative inline-block group">
                                    <Avatar
                                        src={imagePreview || user.image || user.employee?.employee_image}
                                        name={user.name}
                                        size="2xl"
                                        className="shadow-2xl ring-4 ring-slate-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInput.current.click()}
                                        className="absolute bottom-2 right-2 p-3 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-lg shadow-lg border-4 border-white group-hover:scale-110 transition-all active:scale-95"
                                    >
                                        <FiCamera className="w-5 h-5" />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInput}
                                        className="hidden"
                                        onChange={handleImageChange}
                                        accept="image/*"
                                    />
                                </div>
                                <div className="mt-4">
                                    <h4 className="font-normal text-slate-800 text-sm mb-1">Profile Photo</h4>
                                    <p className="text-xs text-slate-500 font-normal">
                                        JPG, PNG or GIF. Max 2MB.
                                    </p>
                                    <InputError className="mt-2" message={errors.image} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Form Fields */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <InputLabel htmlFor="name" value="Full Name" className="text-sm font-normal text-slate-700" />
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <FiUser className="w-5 h-5" />
                                </div>
                                <TextInput
                                    id="name"
                                    className="w-full pl-12 pr-4 bg-slate-50 border-slate-200 rounded-lg text-base font-normal py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    isFocused
                                    autoComplete="name"
                                />
                            </div>
                            <InputError message={errors.name} />
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <InputLabel htmlFor="email" value="Email Address" className="text-sm font-normal text-slate-700" />
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <FiMail className="w-5 h-5" />
                                </div>
                                <TextInput
                                    id="email"
                                    type="email"
                                    className="w-full pl-12 pr-4 bg-slate-50 border-slate-200 rounded-lg text-base font-normal py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        {/* Email Verification Alert */}
                        {mustVerifyEmail && user.email_verified_at === null && (
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                        <FiAlertCircle className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-amber-800 font-normal mb-2">
                                            Your email address is unverified.
                                        </p>
                                        <Link
                                            href={route('verification.send')}
                                            method="post"
                                            as="button"
                                            className="text-sm text-amber-700 underline font-normal hover:text-amber-900 transition-colors"
                                        >
                                            Click here to resend verification email
                                        </Link>
                                    </div>
                                </div>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                        <p className="text-sm font-normal text-emerald-700 flex items-center gap-2">
                                            <FiCheck className="w-4 h-4" />
                                            Verification link sent to your email!
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                            <PrimaryButton
                                disabled={processing}
                                className="px-8 py-3 bg-primary text-white rounded-lg font-normal text-sm hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 transition-all shadow-lg shadow-indigo-200 group flex items-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FiCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        Save Changes
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
                                    Changes saved successfully!
                                </p>
                            </Transition>
                        </div>
                    </div>
                </div>
            </form>
        </section>
    );
}
