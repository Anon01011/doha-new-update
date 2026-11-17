import React, { useState } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import PinInput from '@/Components/PinInput';
import {
    FiShield, FiSmartphone, FiMonitor, FiTablet, FiTrash2,
    FiCheckCircle, FiLock, FiAlertCircle, FiRefreshCw, FiKey, FiSlash
} from 'react-icons/fi';

export default function UpdatePinSecurityForm({ pinSecurity, className = '' }) {
    const isEligible = pinSecurity?.isEligible ?? true;
    const hasPin = pinSecurity?.hasPin ?? false;
    const trustedDevices = pinSecurity?.trustedDevices ?? [];

    const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
        pin: '',
        pin_confirmation: '',
        current_password: '',
        register_device: true,
        device_name: '',
    });

    const [isRevoking, setIsRevoking] = useState(null);
    const [isDisabling, setIsDisabling] = useState(false);
    const [showDisableConfirm, setShowDisableConfirm] = useState(false);

    const submitPin = (e) => {
        e.preventDefault();
        post(route('user.pin.setup'), {
            preserveScroll: true,
            onSuccess: () => {
                reset('pin', 'pin_confirmation', 'current_password');
            },
        });
    };

    const handleDisablePin = () => {
        setIsDisabling(true);
        router.post(route('user.pin.disable'), {}, {
            preserveScroll: true,
            onFinish: () => {
                setIsDisabling(false);
                setShowDisableConfirm(false);
            },
        });
    };

    const handleRevokeDevice = (deviceId) => {
        if (!confirm('Are you sure you want to revoke this trusted device? You will need to log in with your password next time on that device.')) {
            return;
        }

        setIsRevoking(deviceId);
        router.delete(route('user.devices.revoke', deviceId), {
            preserveScroll: true,
            onFinish: () => setIsRevoking(null),
        });
    };

    if (!isEligible) {
        return (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs">
                <div className="flex items-center gap-2.5">
                    <FiShield className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>PIN authentication is restricted for your role level. Standard secure credentials remain active.</span>
                </div>
            </div>
        );
    }

    const isComplete = data.pin.length === 6 && data.pin_confirmation.length === 6;

    return (
        <section className={`space-y-6 ${className}`}>
            {/* Header & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <FiShield className="w-4 h-4 text-indigo-600" />
                        6-Digit PIN Security
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Faster, passwordless authentication on your verified company devices.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {hasPin ? (
                        <>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                PIN Active
                            </span>
                            {!showDisableConfirm ? (
                                <button
                                    type="button"
                                    onClick={() => setShowDisableConfirm(true)}
                                    className="text-xs text-slate-500 hover:text-red-600 transition ml-1"
                                >
                                    Disable
                                </button>
                            ) : (
                                <div className="flex items-center gap-1.5 text-xs bg-red-50 p-1 rounded-lg border border-red-200">
                                    <span className="text-[11px] text-red-700 font-medium">Disable PIN?</span>
                                    <button
                                        type="button"
                                        onClick={handleDisablePin}
                                        disabled={isDisabling}
                                        className="text-[11px] font-bold text-red-700 hover:underline"
                                    >
                                        Yes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowDisableConfirm(false)}
                                        className="text-[11px] text-slate-500 hover:text-slate-800"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <FiAlertCircle className="w-3.5 h-3.5" />
                            Not Configured
                        </span>
                    )}
                </div>
            </div>

            {/* PIN Configuration Form */}
            <form onSubmit={submitPin} className="space-y-4 max-w-xl">
                {hasPin && (
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                        <InputLabel htmlFor="current_password" value="Confirm Password to Change PIN" className="text-xs font-medium text-slate-700" />
                        <div className="relative mt-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <FiKey className="w-3.5 h-3.5" />
                            </div>
                            <TextInput
                                id="current_password"
                                type="password"
                                value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                className="pl-9 w-full text-xs py-1.5 rounded-md"
                                placeholder="Enter current account password"
                            />
                        </div>
                        <InputError message={errors.current_password} className="mt-1 text-xs" />
                    </div>
                )}

                {/* Side-by-side PIN & Confirm PIN inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50/70 rounded-md border border-slate-200/80">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                                {hasPin ? 'New 6-Digit PIN' : 'Create 6-Digit PIN'}
                            </label>
                            {data.pin.length === 6 && (
                                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                        </div>
                        <PinInput
                            value={data.pin}
                            onChange={(val) => setData('pin', val)}
                            disabled={processing}
                            error={Boolean(errors.pin)}
                            size="sm"
                        />
                        <InputError message={errors.pin} className="mt-1.5 text-center text-[11px]" />
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-md border border-slate-200/80">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                                Confirm 6-Digit PIN
                            </label>
                            {data.pin && data.pin_confirmation && (
                                <span className={`text-[10px] font-medium ${data.pin === data.pin_confirmation ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {data.pin === data.pin_confirmation ? 'Matches' : 'Differs'}
                                </span>
                            )}
                        </div>
                        <PinInput
                            value={data.pin_confirmation}
                            onChange={(val) => setData('pin_confirmation', val)}
                            disabled={processing}
                            error={Boolean(errors.pin_confirmation)}
                            size="sm"
                        />
                        <InputError message={errors.pin_confirmation} className="mt-1.5 text-center text-[11px]" />
                    </div>
                </div>

                {/* Trusted Device Checkbox */}
                <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={data.register_device}
                            onChange={(e) => setData('register_device', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        <span className="text-xs text-slate-700 font-medium">
                            Register this workstation as a trusted device
                        </span>
                    </label>

                    {data.register_device && (
                        <div className="mt-2 pl-5">
                            <TextInput
                                type="text"
                                value={data.device_name}
                                onChange={(e) => setData('device_name', e.target.value)}
                                placeholder="Device nickname (e.g. Office Laptop, Reception Desk)"
                                className="w-full text-xs py-1.5 px-3 rounded-md border-slate-200"
                            />
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-3 pt-1">
                    <PrimaryButton
                        disabled={processing || !isComplete || data.pin !== data.pin_confirmation || (hasPin && !data.current_password)}
                        className="text-xs py-2 px-4 rounded-md"
                    >
                        {processing ? 'Saving...' : hasPin ? 'Update PIN' : 'Save & Enable PIN'}
                    </PrimaryButton>

                    {recentlySuccessful && (
                        <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 animate-fade-in">
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            PIN saved successfully!
                        </p>
                    )}
                </div>
            </form>

            {/* Trusted Devices Section */}
            <div className="pt-4 border-t border-slate-100 max-w-xl">
                <div className="flex items-center justify-between mb-2.5">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <FiMonitor className="w-3.5 h-3.5 text-slate-500" />
                        Trusted Devices ({trustedDevices.length})
                    </h5>
                </div>

                {trustedDevices.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-md border border-slate-100">
                        No trusted devices currently registered. Check "Register this workstation" above to enable quick PIN login here.
                    </p>
                ) : (
                    <div className="overflow-hidden border border-slate-200 rounded-md divide-y divide-slate-100 bg-white">
                        {trustedDevices.map((dev) => (
                            <div key={dev.id} className="p-2.5 sm:px-3 sm:py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                        {dev.device_type === 'mobile' ? (
                                            <FiSmartphone className="w-3.5 h-3.5" />
                                        ) : dev.device_type === 'tablet' ? (
                                            <FiTablet className="w-3.5 h-3.5" />
                                        ) : (
                                            <FiMonitor className="w-3.5 h-3.5" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-800 truncate">
                                            {dev.device_name}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {dev.ip_address || 'IP Unknown'} • Last used: {dev.last_used_at ? new Date(dev.last_used_at).toLocaleDateString() : 'Never'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleRevokeDevice(dev.id)}
                                    disabled={isRevoking === dev.id}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                    title="Revoke device"
                                >
                                    {isRevoking === dev.id ? (
                                        <FiRefreshCw className="w-3.5 h-3.5 animate-spin text-red-500" />
                                    ) : (
                                        <FiTrash2 className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
