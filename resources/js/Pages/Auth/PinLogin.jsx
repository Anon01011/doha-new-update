import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import PinInput from '@/Components/PinInput';
import InputError from '@/Components/InputError';
import ApplicationLogo from '@/Components/ApplicationLogo';
import {
    FiLock, FiShield, FiArrowLeft, FiEye, FiEyeOff,
    FiDelete, FiCheck, FiRefreshCw, FiAlertTriangle, FiUser, FiGrid
} from 'react-icons/fi';

export default function PinLogin({ user, hasDevice = false, isLocked = false, lockSeconds = 0, status }) {
    const { appSettings } = usePage().props;

    const primary   = appSettings?.theme_color    || '#090b4e';
    const secondary = appSettings?.secondary_color || '#103c7f';
    const accent    = appSettings?.accent_color    || '#6366f1';
    const appName   = appSettings?.app_name        || 'HRMS Enterprise';
    const appLogo   = appSettings?.app_logo;

    const { data, setData, post, processing, errors, reset } = useForm({
        login_identifier: '',
        pin: '',
    });

    const [masked, setMasked] = useState(true);
    const [remainingSeconds, setRemainingSeconds] = useState(lockSeconds);
    const [showKeypad, setShowKeypad] = useState(false);

    // Countdown timer for lockout
    useEffect(() => {
        if (remainingSeconds <= 0) return;
        const interval = setInterval(() => {
            setRemainingSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    window.location.reload();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [remainingSeconds]);

    // Format remaining lockout time
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Auto-submit when exactly 6 digits are entered and identifier is ready
    useEffect(() => {
        if (data.pin.length === 6 && !processing && remainingSeconds <= 0) {
            if (hasDevice || data.login_identifier.trim().length > 0) {
                submitForm();
            }
        }
    }, [data.pin]);

    const submitForm = (e) => {
        if (e) e.preventDefault();
        if (data.pin.length !== 6 || processing || remainingSeconds > 0) return;
        if (!hasDevice && data.login_identifier.trim().length === 0) return;

        post(route('login.pin.store'), {
            onFinish: () => reset('pin'),
        });
    };

    // Virtual keypad handler
    const handleKeypadPress = (digit) => {
        if (remainingSeconds > 0 || processing) return;

        if (digit === 'backspace') {
            setData('pin', data.pin.slice(0, -1));
        } else if (digit === 'clear') {
            setData('pin', '');
        } else if (data.pin.length < 6) {
            setData('pin', data.pin + digit);
        }
    };

    const isLockedOut = remainingSeconds > 0 || isLocked;
    const canSubmit = hasDevice
        ? data.pin.length === 6 && !processing && !isLockedOut
        : data.login_identifier.trim().length > 0 && data.pin.length === 6 && !processing && !isLockedOut;

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 bg-slate-900"
            style={{
                background: `radial-gradient(ellipse at top, ${secondary} 0%, ${primary} 60%, #030712 100%)`,
                fontFamily: appSettings?.app_font ? `'${appSettings.app_font}', sans-serif` : 'Inter, sans-serif'
            }}
        >
            <Head title={`PIN Login — ${appName}`} />

            <div className="w-full max-w-[360px] bg-white rounded-lg shadow-xl border border-slate-200/80 overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-5 pb-3.5 text-center border-b border-slate-100">
                    <div className="flex items-center justify-center mb-2.5">
                        {appLogo ? (
                            <ApplicationLogo src={appLogo} className="h-7 w-auto object-contain" />
                        ) : (
                            <div
                                className="w-8 h-8 rounded-md flex items-center justify-center text-white shadow-xs"
                                style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}
                            >
                                <FiShield className="w-4 h-4" />
                            </div>
                        )}
                    </div>

                    <h2 className="text-base font-bold text-slate-800 tracking-tight">
                        PIN Sign In
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {hasDevice ? 'Unlock with your 6-digit PIN' : 'Enter credentials & 6-digit PIN'}
                    </p>

                    {/* Pre-Recognized User Card */}
                    {hasDevice && user && (
                        <div className="mt-3 p-2 bg-slate-50 rounded-md border border-slate-200/70 flex items-center gap-2.5 text-left">
                            {user?.image ? (
                                <img
                                    src={user.image}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                            ) : (
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                                    style={{ background: primary }}
                                >
                                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                                    {user?.name}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate font-mono">
                                    {user?.email_masked}
                                </p>
                            </div>
                            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <FiCheck className="w-2.5 h-2.5" /> Trusted
                            </span>
                        </div>
                    )}
                </div>

                {/* Form Body */}
                <div className="p-4 sm:p-5 space-y-3">
                    {status && (
                        <div className="text-xs font-medium text-emerald-700 bg-emerald-50 p-2 rounded-md border border-emerald-200">
                            {status}
                        </div>
                    )}

                    {isLockedOut ? (
                        <div className="text-center p-3.5 bg-red-50 rounded-md border border-red-200">
                            <FiAlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-1 animate-bounce" />
                            <h3 className="font-bold text-red-900 text-xs uppercase tracking-wider">Account Locked</h3>
                            <p className="text-[11px] text-red-700 mt-0.5">
                                Too many failed attempts. Try again in:
                            </p>
                            <div className="text-xl font-mono font-extrabold text-red-600 mt-1">
                                {formatTime(remainingSeconds)}
                            </div>
                            <div className="mt-2.5">
                                <Link
                                    href={route('login', { mode: 'password' })}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-md shadow-xs hover:bg-slate-50 transition"
                                >
                                    <FiLock className="w-3 h-3" />
                                    Sign in with Password
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={submitForm} className="space-y-3">
                            {/* Identifier Input when device is not pre-recognized */}
                            {!hasDevice && (
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                        Email or Employee Code
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                                            <FiUser className="w-3.5 h-3.5" />
                                        </div>
                                        <input
                                            type="text"
                                            value={data.login_identifier}
                                            onChange={(e) => setData('login_identifier', e.target.value)}
                                            placeholder="you@company.com or EMP-101"
                                            required
                                            autoFocus
                                            className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-md outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-100"
                                        />
                                    </div>
                                    <InputError message={errors.login_identifier} className="mt-1 text-[11px]" />
                                </div>
                            )}

                            {/* 6-Digit PIN input boxes */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[11px] font-semibold text-slate-600">
                                        6-Digit Security PIN
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setMasked(!masked)}
                                            className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition"
                                        >
                                            {masked ? <FiEye className="w-3 h-3" /> : <FiEyeOff className="w-3 h-3" />}
                                            <span>{masked ? 'Show' : 'Hide'}</span>
                                        </button>
                                        <span className="text-slate-200">|</span>
                                        <button
                                            type="button"
                                            onClick={() => setShowKeypad(!showKeypad)}
                                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition"
                                            title="Toggle on-screen keypad"
                                        >
                                            <FiGrid className="w-3 h-3" />
                                            <span>{showKeypad ? 'Hide Keypad' : 'Keypad'}</span>
                                        </button>
                                    </div>
                                </div>

                                <PinInput
                                    value={data.pin}
                                    onChange={(val) => setData('pin', val)}
                                    masked={masked}
                                    disabled={processing || isLockedOut}
                                    error={Boolean(errors.pin)}
                                    size="sm"
                                />

                                <InputError message={errors.pin} className="mt-1 text-center text-[11px]" />
                            </div>

                            {/* Sleek On-Screen Keypad (Toggled or Touch) */}
                            {showKeypad && (
                                <div className="grid grid-cols-3 gap-1 pt-1 animate-fade-in">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                                        <button
                                            key={digit}
                                            type="button"
                                            onClick={() => handleKeypadPress(String(digit))}
                                            disabled={processing || isLockedOut}
                                            className="h-8 rounded-md bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors border border-slate-200/60 flex items-center justify-center disabled:opacity-40"
                                        >
                                            {digit}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => handleKeypadPress('clear')}
                                        disabled={processing || isLockedOut || data.pin.length === 0}
                                        className="h-8 rounded-md bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-400 font-medium text-[9px] tracking-wider transition-colors border border-slate-200/60 flex items-center justify-center disabled:opacity-30"
                                    >
                                        CLEAR
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleKeypadPress('0')}
                                        disabled={processing || isLockedOut}
                                        className="h-8 rounded-md bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors border border-slate-200/60 flex items-center justify-center disabled:opacity-40"
                                    >
                                        0
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleKeypadPress('backspace')}
                                        disabled={processing || isLockedOut || data.pin.length === 0}
                                        className="h-8 rounded-md bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-600 transition-colors border border-slate-200/60 flex items-center justify-center disabled:opacity-30"
                                        aria-label="Backspace"
                                    >
                                        <FiDelete className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            {/* Unlock Button */}
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="w-full py-2.5 px-4 rounded-md text-white font-semibold text-xs shadow-xs transition duration-150 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                                style={{
                                    background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`
                                }}
                            >
                                {processing ? (
                                    <>
                                        <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Verifying PIN...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiLock className="w-3.5 h-3.5" />
                                        <span>Unlock Workspace</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Footer Links */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <Link
                            href={route('login', { mode: 'password' })}
                            className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 transition"
                        >
                            <FiArrowLeft className="w-3 h-3" />
                            <span>Password login</span>
                        </Link>

                        <Link
                            href={route('password.request')}
                            className="text-indigo-600 hover:text-indigo-800 font-medium transition"
                        >
                            Forgot PIN?
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
