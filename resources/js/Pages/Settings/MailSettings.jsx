import SettingsLayout from './SettingsLayout';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function MailSettings({ mailSettings }) {
    const [isTesting, setIsTesting] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testResult, setTestResult] = useState(null);
    const [confirmingAction, setConfirmingAction] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'info',
        hideCancel: false
    });

    const { data, setData, post, processing, errors } = useForm({
        mail_mailer: mailSettings.mail_mailer,
        mail_host: mailSettings.mail_host,
        mail_port: mailSettings.mail_port,
        mail_username: mailSettings.mail_username,
        mail_password: mailSettings.mail_password,
        mail_encryption: mailSettings.mail_encryption,
        mail_from_address: mailSettings.mail_from_address,
        mail_from_name: mailSettings.mail_from_name,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = {
            ...data,
            save_to_env: true
        };

        try {
            const response = await window.axios.post(route('settings.mail.update'), formData);
            setConfirmingAction({
                show: true,
                title: 'Settings Updated',
                message: 'Mail settings updated successfully!',
                type: 'success',
                hideCancel: true,
                onConfirm: () => {
                    setConfirmingAction(prev => ({ ...prev, show: false }));
                    window.location.reload();
                }
            });
        } catch (error) {
            console.error('Error submitting form:', error);
            if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                setConfirmingAction({
                    show: true,
                    title: 'Applying Changes',
                    message: 'Settings saved! The server is now restarting to apply changes. The page will reload in a few seconds.',
                    type: 'info',
                    hideCancel: true,
                    onConfirm: () => {
                        setConfirmingAction(prev => ({ ...prev, show: false }));
                        window.location.reload();
                    }
                });
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            } else {
                setConfirmingAction({
                    show: true,
                    title: 'Update Error',
                    message: 'Error saving settings: ' + (error.response?.data?.message || error.message),
                    type: 'danger',
                    hideCancel: true,
                    onConfirm: () => setConfirmingAction(prev => ({ ...prev, show: false }))
                });
            }
        }
    };

    const handleTestEmail = async () => {
        if (!testEmail) {
            setTestResult({ success: false, message: 'Please enter a test email address' });
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!csrfToken) throw new Error('CSRF token not found');

            const response = await fetch(route('settings.mail.test'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    test_email: testEmail,
                    ...data
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try { errorData = JSON.parse(errorText); } catch (e) { errorData = { message: errorText || 'Server error' }; }
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const result = await response.json();
            setTestResult(result);
        } catch (error) {
            setTestResult({ success: false, message: 'Failed: ' + error.message });
        } finally {
            setIsTesting(false);
        }
    };

    const isSmtpRequired = data.mail_mailer === 'smtp';

    return (
        <SettingsLayout
            activeTab="mail"
            title="Mail Configuration"
            description="Configure your email settings for sending roster notifications and system emails."
        >
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {/* Main Form */}
                <div className="xl:col-span-2 space-y-5">
                    <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-primary text-white rounded-lg shadow-lg shadow-blue-200">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-normal text-gray-900 tracking-normal">Email Driver</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-normal text-gray-700 ml-1">
                                    Mail Driver
                                </label>
                                <select
                                    value={data.mail_mailer}
                                    onChange={(e) => setData('mail_mailer', e.target.value)}
                                    className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                >
                                    {Object.entries(mailSettings.available_mailers).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {isSmtpRequired && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-normal text-gray-700 ml-1">SMTP Host</label>
                                        <input
                                            type="text"
                                            value={data.mail_host}
                                            onChange={(e) => setData('mail_host', e.target.value)}
                                            className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                            placeholder="smtp.gmail.com"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-normal text-gray-700 ml-1">SMTP Port</label>
                                        <input
                                            type="number"
                                            value={data.mail_port}
                                            onChange={(e) => setData('mail_port', e.target.value)}
                                            className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                            placeholder="587"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-normal text-gray-700 ml-1">Username</label>
                                        <input
                                            type="text"
                                            value={data.mail_username}
                                            onChange={(e) => setData('mail_username', e.target.value)}
                                            className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                            placeholder="user@example.com"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-normal text-gray-700 ml-1">Password</label>
                                        <input
                                            type="password"
                                            value={data.mail_password}
                                            onChange={(e) => setData('mail_password', e.target.value)}
                                            className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-normal text-gray-700 ml-1">Encryption</label>
                                        <select
                                            value={data.mail_encryption}
                                            onChange={(e) => setData('mail_encryption', e.target.value)}
                                            className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
                                        >
                                            <option value="tls">TLS</option>
                                            <option value="ssl">SSL</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-primary text-white rounded-lg shadow-lg shadow-indigo-200">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-normal text-gray-900 tracking-normal">Sender Identity</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-normal text-gray-700 ml-1">From Email</label>
                                <input
                                    type="email"
                                    value={data.mail_from_address}
                                    onChange={(e) => setData('mail_from_address', e.target.value)}
                                    className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal"
                                    placeholder="noreply@company.com"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-normal text-gray-700 ml-1">From Name</label>
                                <input
                                    type="text"
                                    value={data.mail_from_name}
                                    onChange={(e) => setData('mail_from_name', e.target.value)}
                                    className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal"
                                    placeholder="Company Name"
                                />
                            </div>
                        </div>
                    </div>

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

                {/* Sidebar */}
                <div className="space-y-5">
                    <div className="glass-card premium-shadow rounded-lg p-5 border border-white/40">
                        <h4 className="text-sm font-normal text-gray-900 tracking-normal mb-4">Test Delivery</h4>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-normal text-gray-400 uppercase tracking-normal ml-1">Recipient Email</label>
                                <input
                                    type="email"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    className="w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-normal text-sm"
                                    placeholder="test@example.com"
                                />
                            </div>
                            <button
                                onClick={handleTestEmail}
                                disabled={isTesting || !testEmail}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-normal rounded-lg transition-all shadow-lg shadow-emerald-900/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isTesting ? 'Sending...' : 'Send Test Email'}
                            </button>

                            {testResult && (
                                <div className={`p-3 rounded-lg text-xs font-normal leading-relaxed ${testResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                                    }`}>
                                    {testResult.message}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg p-5 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                        <h4 className="text-sm font-normal tracking-normal mb-4 relative z-10">Common Hosts</h4>
                        <div className="space-y-3 relative z-10">
                            <div className="p-2.5 bg-white/10 rounded-lg border border-white/10">
                                <p className="text-[10px] font-normal uppercase tracking-normal text-blue-200 mb-0.5">Gmail</p>
                                <p className="text-xs font-normal">smtp.gmail.com:587</p>
                            </div>
                            <div className="p-2.5 bg-white/10 rounded-lg border border-white/10">
                                <p className="text-[10px] font-normal uppercase tracking-normal text-blue-200 mb-0.5">Outlook</p>
                                <p className="text-xs font-normal">smtp-mail.outlook.com:587</p>
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
                hideCancel={confirmingAction.hideCancel}
            />
        </SettingsLayout>
    );
}