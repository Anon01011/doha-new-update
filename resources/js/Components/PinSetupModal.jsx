import React, { useState } from 'react';
import Modal from '@/Components/Modal';
import PinInput from '@/Components/PinInput';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { useForm, router, usePage } from '@inertiajs/react';
import { FiShield, FiX, FiCheckCircle, FiLock, FiSmartphone } from 'react-icons/fi';

export default function PinSetupModal({ show = false, onClose = () => {} }) {
    const { appSettings } = usePage().props;
    const primary = appSettings?.theme_color || '#090b4e';
    const secondary = appSettings?.secondary_color || '#103c7f';

    const { data, setData, post, processing, errors, reset } = useForm({
        pin: '',
        pin_confirmation: '',
        register_device: true,
        device_name: '',
    });

    const [dismissing, setDismissing] = useState(false);

    const handleSkip = () => {
        setDismissing(true);
        router.post(route('user.pin.skip'), {}, {
            preserveScroll: true,
            onFinish: () => {
                setDismissing(false);
                onClose();
            },
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('user.pin.setup'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const isComplete = data.pin.length === 6 && data.pin_confirmation.length === 6;

    return (
        <Modal show={show} onClose={handleSkip} maxWidth="sm" roundedClass="rounded-lg" closeable={true}>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl border border-slate-200">
                {/* Compact Header */}
                <div
                    className="px-5 py-3.5 text-white relative flex items-center justify-between"
                    style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
                            <FiShield className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white tracking-tight leading-tight">
                                Quick PIN Setup
                            </h3>
                            <p className="text-[11px] text-white/80 leading-tight">
                                Fast & secure login on this device
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSkip}
                        className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition"
                        title="Skip for now"
                    >
                        <FiX className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
                    {/* Create PIN */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                                Create 6-Digit PIN
                            </label>
                            {data.pin.length === 6 && (
                                <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                                    <FiCheckCircle className="w-3 h-3" /> Ready
                                </span>
                            )}
                        </div>
                        <PinInput
                            value={data.pin}
                            onChange={(val) => setData('pin', val)}
                            disabled={processing}
                            error={Boolean(errors.pin)}
                            size="sm"
                        />
                        <InputError message={errors.pin} className="mt-1 text-center text-[11px]" />
                    </div>

                    {/* Confirm PIN */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                                Confirm 6-Digit PIN
                            </label>
                            {data.pin && data.pin_confirmation && (
                                <span className={`text-[10px] font-medium flex items-center gap-1 ${
                                    data.pin === data.pin_confirmation ? 'text-emerald-600' : 'text-amber-600'
                                }`}>
                                    {data.pin === data.pin_confirmation ? (
                                        <><FiCheckCircle className="w-3 h-3" /> Matches</>
                                    ) : (
                                        'Does not match'
                                    )}
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
                        <InputError message={errors.pin_confirmation} className="mt-1 text-center text-[11px]" />
                    </div>

                    {/* Register Device Checkbox */}
                    <div className="pt-2 border-t border-slate-100">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={data.register_device}
                                onChange={(e) => setData('register_device', e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            <span className="text-xs text-slate-700 font-medium flex items-center gap-1">
                                <FiSmartphone className="w-3.5 h-3.5 text-slate-400" />
                                Remember this device as trusted
                            </span>
                        </label>

                        {data.register_device && (
                            <div className="mt-2 pl-5">
                                <TextInput
                                    type="text"
                                    value={data.device_name}
                                    onChange={(e) => setData('device_name', e.target.value)}
                                    placeholder="Device nickname (e.g. My Laptop)"
                                    className="w-full text-xs py-1.5 px-2.5 rounded-md border-slate-200"
                                />
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2.5 flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={handleSkip}
                            disabled={dismissing || processing}
                            className="px-3 py-1.5 rounded-md text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                        >
                            Skip for now
                        </button>

                        <button
                            type="submit"
                            disabled={processing || !isComplete || data.pin !== data.pin_confirmation}
                            className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-white shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                            style={{
                                background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`
                            }}
                        >
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            <span>{processing ? 'Saving...' : 'Enable PIN'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
