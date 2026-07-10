import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function BrandingSettings({ settings }) {
    const { flash } = usePage().props;
    const [logoPreview, setLogoPreview] = useState(settings.app_logo ? `/storage/${settings.app_logo}` : null);
    const [faviconPreview, setFaviconPreview] = useState(settings.favicon ? `/storage/${settings.favicon}` : null);

    const { data, setData, post, processing, errors } = useForm({
        app_name: settings.app_name || '',
        logo: null,
        favicon: null,
        theme_color: settings.theme_color || '#4f46e5',
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

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.branding.update'), {
            forceFormData: true,
        });
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
                router.delete(route('settings.branding.deleteLogo'), {
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
                router.delete(route('settings.branding.deleteFavicon'), {
                    onSuccess: () => {
                        setFaviconPreview(null);
                        setConfirmingAction(prev => ({ ...prev, show: false }));
                    }
                });
            }
        });
    };

    return (
        <AuthenticatedLayout
            header="Branding Settings"
        >
            <Head title="Branding Settings" />

            <div className="py-6">
                <div className="max-w-4xl mx-auto">
                    {flash?.success && (
                        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                            {flash.success}
                        </div>
                    )}

                    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-normal text-gray-900">Application Branding</h2>
                            <p className="mt-1 text-sm text-gray-600">
                                Customize your application's name, logo, and favicon
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Application Name */}
                            <div>
                                <label htmlFor="app_name" className="block text-sm font-normal text-gray-700 mb-2">
                                    Application Name
                                </label>
                                <input
                                    type="text"
                                    id="app_name"
                                    value={data.app_name}
                                    onChange={(e) => setData('app_name', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Employee Management System"
                                />
                                {errors.app_name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.app_name}</p>
                                )}
                            </div>

                            {/* Logo Upload */}
                            <div>
                                <label className="block text-sm font-normal text-gray-700 mb-2">
                                    Application Logo
                                </label>
                                <div className="flex items-start space-x-4">
                                    {logoPreview && (
                                        <div className="flex-shrink-0">
                                            <div className="w-32 h-32 border-2 border-gray-200 rounded-lg p-2 bg-gray-50 flex items-center justify-center">
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo Preview"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                            {settings.app_logo && (
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteLogo}
                                                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                                                >
                                                    Delete Logo
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                                            onChange={handleLogoChange}
                                            className="block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-lg file:border-0
                                                file:text-sm file:font-normal
                                                file:bg-indigo-50 file:text-indigo-700
                                                hover:file:bg-indigo-100
                                                cursor-pointer"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">
                                            PNG, JPG, JPEG, or SVG. Max 2MB. Recommended: 200x50px
                                        </p>
                                        {errors.logo && (
                                            <p className="mt-1 text-sm text-red-600">{errors.logo}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Favicon Upload */}
                            <div>
                                <label className="block text-sm font-normal text-gray-700 mb-2">
                                    Favicon
                                </label>
                                <div className="flex items-start space-x-4">
                                    {faviconPreview && (
                                        <div className="flex-shrink-0">
                                            <div className="w-16 h-16 border-2 border-gray-200 rounded-lg p-2 bg-gray-50 flex items-center justify-center">
                                                <img
                                                    src={faviconPreview}
                                                    alt="Favicon Preview"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                            {settings.favicon && (
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteFavicon}
                                                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                                                >
                                                    Delete Favicon
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept=".ico,image/png"
                                            onChange={handleFaviconChange}
                                            className="block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-lg file:border-0
                                                file:text-sm file:font-normal
                                                file:bg-indigo-50 file:text-indigo-700
                                                hover:file:bg-indigo-100
                                                cursor-pointer"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">
                                            ICO or PNG. Max 512KB. Recommended: 32x32px or 16x16px
                                        </p>
                                        {errors.favicon && (
                                            <p className="mt-1 text-sm text-red-600">{errors.favicon}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Theme Color */}
                            <div>
                                <label className="block text-sm font-normal text-gray-700 mb-2">
                                    Primary Theme Color
                                </label>
                                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <input
                                        type="color"
                                        value={data.theme_color}
                                        onChange={(e) => setData('theme_color', e.target.value)}
                                        className="h-10 w-20 border-0 rounded cursor-pointer"
                                    />
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={data.theme_color}
                                            onChange={(e) => setData('theme_color', e.target.value)}
                                            className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500"
                                            placeholder="#4f46e5"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            This color will be used for buttons, icons, and primary accents across the entire application.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex items-center justify-end pt-4 border-t border-gray-200">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2 bg-primary text-white font-normal rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Preview Section */}
                    <div className="mt-6 bg-white shadow-sm rounded-lg overflow-hidden p-6">
                        <h3 className="text-lg font-normal text-gray-900 mb-4">Preview</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-2">Application Name:</p>
                                <p className="text-xl font-normal text-gray-900">{data.app_name || 'Not set'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-2">Logo:</p>
                                {logoPreview ? (
                                    <div className="inline-block p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                                        <img src={logoPreview} alt="Logo" className="h-10" />
                                    </div>
                                ) : (
                                    <p className="text-gray-400 italic">No logo uploaded</p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-2">Favicon:</p>
                                {faviconPreview ? (
                                    <img src={faviconPreview} alt="Favicon" className="w-8 h-8" />
                                ) : (
                                    <p className="text-gray-400 italic">No favicon uploaded</p>
                                )}
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
        </AuthenticatedLayout>
    );
}
