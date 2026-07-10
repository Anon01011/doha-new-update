import { useForm, usePage, Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import SettingsLayout from './SettingsLayout';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function SystemSettings({ systemSettings }) {
    const { flash } = usePage().props;
    const [logoPreview, setLogoPreview] = useState(systemSettings.app_logo ? `/storage/${systemSettings.app_logo}` : null);
    const [faviconPreview, setFaviconPreview] = useState(systemSettings.favicon ? `/storage/${systemSettings.favicon}` : null);
    const [stampPreview, setStampPreview] = useState(systemSettings.company_stamp ? `/storage/${systemSettings.company_stamp}` : null);

    // Flash messages should ideally be handled by a dedicated component, 
    // but we will remove the browser alert for now.
    useEffect(() => {
        if (flash?.success || flash?.error) {
            // We could show a modal here, but usually flash messages are better as toasts.
            // For now, let's just log or use the modal if it's critical.
        }
    }, [flash]);

    const { data, setData, post, processing, errors, transform } = useForm({
        app_name: systemSettings.app_name,
        app_url: systemSettings.app_url,
        app_timezone: systemSettings.app_timezone,
        app_locale: systemSettings.app_locale,
        currency: systemSettings.currency || '',
        currency_symbol: systemSettings.currency_symbol || '',
        logo: null,
        favicon: null,
        company_stamp: null,
        theme_color: systemSettings.theme_color || '#090b4e',
        secondary_color: systemSettings.secondary_color || '#103c7f',
        accent_color: systemSettings.accent_color || '#818cf8',
        app_font: systemSettings.app_font || 'Inter',
        save_to_env: "0",
    });

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('logo', file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleFaviconChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('favicon', file);
            setFaviconPreview(URL.createObjectURL(file));
        }
    };

    const handleStampChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('company_stamp', file);
            setStampPreview(URL.createObjectURL(file));
        }
    };

    const [confirmingAction, setConfirmingAction] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger'
    });

    const handleDeleteLogo = () => {
        setConfirmingAction({
            show: true,
            title: 'Delete Logo',
            message: 'Are you sure you want to delete the logo?',
            type: 'danger',
            onConfirm: () => {
                router.delete(route('settings.system.deleteLogo'), {
                    onSuccess: () => {
                        setLogoPreview(null);
                        setConfirmingAction(prev => ({ ...prev, show: false }));
                    }
                });
            }
        });
    };

    const handleDeleteFavicon = () => {
        setConfirmingAction({
            show: true,
            title: 'Delete Favicon',
            message: 'Are you sure you want to delete the favicon?',
            type: 'danger',
            onConfirm: () => {
                router.delete(route('settings.system.deleteFavicon'), {
                    onSuccess: () => {
                        setFaviconPreview(null);
                        setConfirmingAction(prev => ({ ...prev, show: false }));
                    }
                });
            }
        });
    };

    const handleDeleteStamp = () => {
        setConfirmingAction({
            show: true,
            title: 'Delete Company Stamp',
            message: 'Are you sure you want to delete the company stamp?',
            type: 'danger',
            onConfirm: () => {
                router.delete(route('settings.system.deleteStamp'), {
                    onSuccess: () => {
                        setStampPreview(null);
                        setConfirmingAction(prev => ({ ...prev, show: false }));
                    }
                });
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route('settings.system.update'), {
            data: data,
            forceFormData: true,
            preserveScroll: true,
            onError: (errors) => {
                console.error('Validation errors:', errors);
            }
        });
    };

    return (
        <SettingsLayout
            activeTab="system"
            title="System Configuration"
            description="Configure basic application settings like name, URL, timezone, and language."
        >
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {/* Main Form */}
                <div className="xl:col-span-2 space-y-5">
                    <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-primary text-white rounded-lg shadow-lg shadow-blue-200">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-normal text-gray-900 tracking-normal">Application Settings</h3>
                        </div>

                        <div className="space-y-4" onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* App Name */}
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">
                                        Application Name
                                    </label>
                                    <input
                                        type="text"
                                        value={data.app_name}
                                        onChange={(e) => setData('app_name', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                        placeholder="Your Company Name"
                                    />
                                    {errors.app_name && (
                                        <p className="text-[10px] font-normal text-rose-500 ml-1">{errors.app_name}</p>
                                    )}
                                </div>

                                {/* App URL */}
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">
                                        Application URL
                                    </label>
                                    <input
                                        type="url"
                                        value={data.app_url}
                                        onChange={(e) => setData('app_url', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                        placeholder="https://yourdomain.com"
                                    />
                                    {errors.app_url && (
                                        <p className="text-[10px] font-normal text-rose-500 ml-1">{errors.app_url}</p>
                                    )}
                                </div>

                                {/* Timezone */}
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">
                                        Timezone
                                    </label>
                                    <select
                                        value={data.app_timezone}
                                        onChange={(e) => setData('app_timezone', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                    >
                                        {Object.entries(systemSettings.available_timezones).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                    {errors.app_timezone && (
                                        <p className="text-[10px] font-normal text-rose-500 ml-1">{errors.app_timezone}</p>
                                    )}
                                </div>

                                {/* Locale */}
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">
                                        Language
                                    </label>
                                    <select
                                        value={data.app_locale}
                                        onChange={(e) => setData('app_locale', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                    >
                                        {Object.entries(systemSettings.available_locales).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                    {errors.app_locale && (
                                        <p className="text-[10px] font-normal text-rose-500 ml-1">{errors.app_locale}</p>
                                    )}
                                </div>

                                {/* Currency */}
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">
                                        Currency Code
                                    </label>
                                    <select
                                        value={data.currency}
                                        onChange={(e) => {
                                            const code = e.target.value;
                                            setData(prev => ({
                                                ...prev,
                                                currency: code,
                                                currency_symbol: {
                                                    'QAR': 'QAR',
                                                    'AED': 'AED',
                                                    'INR': '₹',
                                                    'USD': '$'
                                                }[code] || prev.currency_symbol
                                            }));
                                        }}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                    >
                                        <option value="QAR">QAR (Qatari Riyal)</option>
                                        <option value="AED">AED (United Arab Emirates Dirham)</option>
                                        <option value="INR">INR (Indian Rupee)</option>
                                        <option value="USD">USD (US Dollar)</option>
                                    </select>
                                    {errors.currency && (
                                        <p className="text-[10px] font-normal text-rose-500 ml-1">{errors.currency}</p>
                                    )}
                                </div>

                                {/* Currency Symbol */}
                                <div className="space-y-1">
                                    <label className="text-xs font-normal text-gray-700 ml-1">
                                        Currency Symbol
                                    </label>
                                    <input
                                        type="text"
                                        value={data.currency_symbol}
                                        onChange={(e) => setData('currency_symbol', e.target.value)}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                        placeholder="QAR"
                                    />
                                    {errors.currency_symbol && (
                                        <p className="text-[10px] font-normal text-rose-500 ml-1">{errors.currency_symbol}</p>
                                    )}
                                </div>
                            </div>

                            {/* Theme & Branding Configuration */}
                            <div className="pt-5 border-t border-gray-100">
                                <label className="text-xs font-normal text-gray-700 ml-1 block mb-4 uppercase tracking-normal">
                                    Theme & Branding Configuration
                                </label>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Primary Color */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-[10px] font-normal text-slate-500 uppercase tracking-normal">Primary Color</label>
                                            <span className="text-[9px] font-normal text-slate-400 font-mono">{data.theme_color}</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100/50 shadow-sm">
                                            <input
                                                type="color"
                                                value={data.theme_color}
                                                onChange={(e) => setData('theme_color', e.target.value)}
                                                className="w-10 h-10 rounded-lg border-0 p-0 cursor-pointer bg-transparent"
                                            />
                                            <div className="flex-1">
                                                <p className="text-[9px] text-slate-500 font-normal leading-tight">Buttons, active states, and primary accents.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Secondary Color */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-[10px] font-normal text-slate-500 uppercase tracking-normal">Secondary Color</label>
                                            <span className="text-[9px] font-normal text-slate-400 font-mono">{data.secondary_color}</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100/50 shadow-sm">
                                            <input
                                                type="color"
                                                value={data.secondary_color}
                                                onChange={(e) => setData('secondary_color', e.target.value)}
                                                className="w-10 h-10 rounded-lg border-0 p-0 cursor-pointer bg-transparent"
                                            />
                                            <div className="flex-1">
                                                <p className="text-[9px] text-slate-500 font-normal leading-tight">Sidebar background and dark UI surfaces.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Accent Color */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-[10px] font-normal text-slate-500 uppercase tracking-normal">Accent Color</label>
                                            <span className="text-[9px] font-normal text-slate-400 font-mono">{data.accent_color}</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100/50 shadow-sm">
                                            <input
                                                type="color"
                                                value={data.accent_color}
                                                onChange={(e) => setData('accent_color', e.target.value)}
                                                className="w-10 h-10 rounded-lg border-0 p-0 cursor-pointer bg-transparent"
                                            />
                                            <div className="flex-1">
                                                <p className="text-[9px] text-slate-500 font-normal leading-tight">Subtle highlights, badges, and "Pro" branding.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Font Selection */}
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <label className="text-[10px] font-normal text-slate-500 uppercase tracking-normal mb-3 block">Application Font Family</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100/50 shadow-sm">
                                            <select
                                                value={data.app_font}
                                                onChange={(e) => setData('app_font', e.target.value)}
                                                className="w-full rounded-lg border-gray-200 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                            >
                                                <option value="Inter">Inter (Modern & Clean)</option>
                                                <option value="Roboto">Roboto (Mechanical & Friendly)</option>
                                                <option value="Poppins">Poppins (Geometric Sans Serif)</option>
                                                <option value="Nunito">Nunito (Rounded & Friendly)</option>
                                                <option value="Outfit">Outfit (High-End & Modern)</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center">
                                            <p className="text-[10px] text-slate-500 font-normal leading-relaxed italic">
                                                Choose the primary font for the application. This selection affects all headings, body text, and UI components globally.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Branding Settings */}
                    <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-purple-600 text-white rounded-lg shadow-lg shadow-purple-200">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-normal text-gray-900 tracking-normal">Branding</h3>
                        </div>

                        <div className="space-y-4">
                            {/* Logo Upload */}
                            <div>
                                <label className="text-xs font-normal text-gray-700 ml-1 block mb-2">
                                    Application Logo
                                </label>
                                <div className="flex items-start gap-4">
                                    {logoPreview && (
                                        <div className="flex-shrink-0">
                                            <div className="w-20 h-20 border border-gray-200 rounded-lg p-2 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo Preview"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                            {systemSettings.app_logo && (
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteLogo}
                                                    className="mt-1 text-[10px] text-red-600 hover:text-red-800 font-normal w-full text-center"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                                            onChange={handleLogoChange}
                                            className="block w-full text-xs text-gray-500
                                                file:mr-3 file:py-2 file:px-4
                                                file:rounded-lg file:border-0
                                                file:text-xs file:font-normal
                                                file:bg-purple-50 file:text-purple-700
                                                hover:file:bg-purple-100
                                                cursor-pointer"
                                        />
                                        <p className="mt-1 text-[10px] text-gray-500 font-normal">
                                            PNG, JPG, JPEG, or SVG. Max 2MB.
                                        </p>
                                        {errors.logo && (
                                            <p className="mt-1 text-[10px] font-normal text-rose-500">{errors.logo}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Favicon Upload */}
                            <div>
                                <label className="text-xs font-normal text-gray-700 ml-1 block mb-2">
                                    Favicon
                                </label>
                                <div className="flex items-start gap-4">
                                    {faviconPreview && (
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 border border-gray-200 rounded-lg p-2 bg-gray-50 flex items-center justify-center">
                                                <img
                                                    src={faviconPreview}
                                                    alt="Favicon Preview"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                            {systemSettings.favicon && (
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteFavicon}
                                                    className="mt-1 text-[10px] text-red-600 hover:text-red-800 font-normal w-full text-center"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept=".ico,image/png"
                                            onChange={handleFaviconChange}
                                            className="block w-full text-xs text-gray-500
                                                file:mr-3 file:py-2 file:px-4
                                                file:rounded-lg file:border-0
                                                file:text-xs file:font-normal
                                                file:bg-purple-50 file:text-purple-700
                                                hover:file:bg-purple-100
                                                cursor-pointer"
                                        />
                                        <p className="mt-1 text-[10px] text-gray-500 font-normal">
                                            ICO or PNG. Max 512KB. Recommended: 32x32px
                                        </p>
                                        {errors.favicon && (
                                            <p className="mt-1 text-[10px] font-normal text-rose-500">{errors.favicon}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Company Stamp Upload */}
                            <div>
                                <label className="text-xs font-normal text-gray-700 ml-1 block mb-2">
                                    Company Stamp
                                </label>
                                <div className="flex items-start gap-4">
                                    {stampPreview && (
                                        <div className="flex-shrink-0">
                                            <div className="w-16 h-16 border border-gray-200 rounded-lg p-2 bg-gray-50 flex items-center justify-center">
                                                <img
                                                    src={stampPreview}
                                                    alt="Stamp Preview"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                            {systemSettings.company_stamp && (
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteStamp}
                                                    className="mt-1 text-[10px] text-red-600 hover:text-red-800 font-normal w-full text-center"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                                            onChange={handleStampChange}
                                            className="block w-full text-xs text-gray-500
                                                file:mr-3 file:py-2 file:px-4
                                                file:rounded-lg file:border-0
                                                file:text-xs file:font-normal
                                                file:bg-purple-50 file:text-purple-700
                                                hover:file:bg-purple-100
                                                cursor-pointer"
                                        />
                                        <p className="mt-1 text-[10px] text-gray-500 font-normal">
                                            PNG, JPG, JPEG, or SVG. Max 2MB. Used for payroll and official documents.
                                        </p>
                                        {errors.company_stamp && (
                                            <p className="mt-1 text-[10px] font-normal text-rose-500">{errors.company_stamp}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="px-5 py-2.5 bg-primary hover:bg-blue-500 text-white text-sm font-normal rounded-lg transition-all shadow-lg shadow-blue-900/10 active:scale-95 disabled:opacity-50"
                        >
                            {processing ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-5">
                    {/* Current Status */}
                    <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                        <h4 className="text-sm font-normal text-gray-900 tracking-normal mb-4">Current Status</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                                <span className="text-[10px] font-normal text-gray-400 uppercase tracking-normal">Debug Mode</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-normal uppercase tracking-normal ${systemSettings.app_debug ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {systemSettings.app_debug ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>

                            <div className="space-y-3 px-1">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-normal text-gray-400 uppercase tracking-normal mb-0.5">Active Timezone</span>
                                    <span className="text-xs font-normal text-gray-700">{systemSettings.app_timezone}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-normal text-gray-400 uppercase tracking-normal mb-0.5">Active Language</span>
                                    <span className="text-xs font-normal text-gray-700">{systemSettings.available_locales[systemSettings.app_locale]}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Help Tips */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg p-5 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                        <h4 className="text-sm font-normal tracking-normal mb-4 relative z-10">Configuration Tips</h4>
                        <div className="space-y-3 relative z-10">
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center font-normal text-xs">1</div>
                                <p className="text-xs text-blue-50 leading-relaxed font-normal">Ensure <span className="font-normal">App URL</span> is correct for emails and links.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmationModal
                show={confirmingAction.show}
                title={confirmingAction.title}
                message={confirmingAction.message}
                onConfirm={confirmingAction.onConfirm}
                onClose={() => setConfirmingAction(prev => ({ ...prev, show: false }))}
                type={confirmingAction.type}
            />
        </SettingsLayout>
    );
}