import React, { useState } from 'react';
import SettingsLayout from './SettingsLayout';
import { useForm } from '@inertiajs/react';
import { FiSave, FiMessageSquare, FiMail, FiPhone, FiInfo, FiCopy, FiCheck } from 'react-icons/fi';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';
import { Transition } from '@headlessui/react';
import Modal from '@/Components/Modal';export default function IntegrationSettings({ settings }) {
    const [showMetaTemplateModal, setShowMetaTemplateModal] = useState(false);
    const [showSmsTemplateModal, setShowSmsTemplateModal] = useState(false);
    const [copiedRoster, setCopiedRoster] = useState(false);
    const [copiedLoan, setCopiedLoan] = useState(false);

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'roster') {
            setCopiedRoster(true);
            setTimeout(() => setCopiedRoster(false), 2000);
        } else {
            setCopiedLoan(true);
            setTimeout(() => setCopiedLoan(false), 2000);
        }
    };

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        roster_send_email: settings?.roster_send_email ?? true,
        roster_send_whatsapp: settings?.roster_send_whatsapp ?? false,
        roster_send_sms: settings?.roster_send_sms ?? false,
        loan_send_email: settings?.loan_send_email ?? true,
        loan_send_whatsapp: settings?.loan_send_whatsapp ?? false,
        loan_send_sms: settings?.loan_send_sms ?? false,
        
        whatsapp_provider: settings?.whatsapp_provider ?? 'custom',
        whatsapp_api_url: settings?.whatsapp_api_url ?? '',
        whatsapp_api_token: settings?.whatsapp_api_token ?? '',
        whatsapp_sender_number: settings?.whatsapp_sender_number ?? '',
        meta_phone_number_id: settings?.meta_phone_number_id ?? '',
        meta_waba_id: settings?.meta_waba_id ?? '',
        whatsapp_template_name: settings?.whatsapp_template_name ?? 'shift_roster_notification',
        whatsapp_loan_template_name: settings?.whatsapp_loan_template_name ?? '',
        whatsapp_template_language: settings?.whatsapp_template_language ?? 'en_US',
        whatsapp_loan_template_language: settings?.whatsapp_loan_template_language ?? '',
        
        sms_provider: settings?.sms_provider ?? 'custom',
        sms_api_url: settings?.sms_api_url ?? '',
        sms_api_token: settings?.sms_api_token ?? '',
        sms_sender_id: settings?.sms_sender_id ?? '',
        sms_template_roster: settings?.sms_template_roster ?? '',
        sms_template_id_roster: settings?.sms_template_id_roster ?? '',
        sms_template_loan: settings?.sms_template_loan ?? '',
        sms_template_id_loan: settings?.sms_template_id_loan ?? '',

        twilio_sid: settings?.twilio_sid ?? '',
        twilio_token: settings?.twilio_token ?? '',
        twilio_sms_from: settings?.twilio_sms_from ?? '',
        twilio_whatsapp_from: settings?.twilio_whatsapp_from ?? '',

        vonage_api_key: settings?.vonage_api_key ?? '',
        vonage_api_secret: settings?.vonage_api_secret ?? '',
        vonage_sms_from: settings?.vonage_sms_from ?? '',
        vonage_whatsapp_from: settings?.vonage_whatsapp_from ?? '',

        infobip_base_url: settings?.infobip_base_url ?? '',
        infobip_api_key: settings?.infobip_api_key ?? '',
        infobip_sms_from: settings?.infobip_sms_from ?? '',
        infobip_whatsapp_from: settings?.infobip_whatsapp_from ?? '',

        messagebird_access_key: settings?.messagebird_access_key ?? '',
        messagebird_sms_from: settings?.messagebird_sms_from ?? '',
        messagebird_whatsapp_from: settings?.messagebird_whatsapp_from ?? '',

        plivo_auth_id: settings?.plivo_auth_id ?? '',
        plivo_auth_token: settings?.plivo_auth_token ?? '',
        plivo_sms_from: settings?.plivo_sms_from ?? '',
        plivo_whatsapp_from: settings?.plivo_whatsapp_from ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.integrations.update'), {
            preserveScroll: true,
        });
    };

    return (
        <SettingsLayout
            activeTab="integrations"
            title="Integrations & Notifications"
            description="Manage third-party API integrations and notification channels."
        >
            <form onSubmit={submit} className="space-y-6">
                {/* Notification Preferences */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                            <FiMessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-normal text-gray-900 tracking-normal">Notification Channels</h2>
                            <p className="text-sm text-gray-500">Enable or disable notification methods for rosters.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className={`flex flex-col p-5 border rounded-lg cursor-pointer transition-all duration-200 ${data.roster_send_email ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2.5 rounded-lg ${data.roster_send_email ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                                    <FiMail className="w-5 h-5" />
                                </div>
                                <Checkbox
                                    name="roster_send_email"
                                    checked={data.roster_send_email}
                                    onChange={(e) => setData('roster_send_email', e.target.checked)}
                                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <span className={`block text-sm font-normal mb-1 ${data.roster_send_email ? 'text-indigo-900' : 'text-gray-900'}`}>Email</span>
                                <span className="block text-xs text-gray-500 leading-relaxed">Send shift rosters via standard Email.</span>
                            </div>
                        </label>
                        
                        <label className={`flex flex-col p-5 border rounded-lg cursor-pointer transition-all duration-200 ${data.roster_send_whatsapp ? 'border-green-500 bg-green-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2.5 rounded-lg ${data.roster_send_whatsapp ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                    <FiPhone className="w-5 h-5" />
                                </div>
                                <Checkbox
                                    name="roster_send_whatsapp"
                                    checked={data.roster_send_whatsapp}
                                    onChange={(e) => setData('roster_send_whatsapp', e.target.checked)}
                                    className="w-5 h-5 rounded text-green-600 focus:ring-green-500"
                                />
                            </div>
                            <div>
                                <span className={`block text-sm font-normal mb-1 ${data.roster_send_whatsapp ? 'text-green-900' : 'text-gray-900'}`}>WhatsApp</span>
                                <span className="block text-xs text-gray-500 leading-relaxed">Send rosters directly to WhatsApp.</span>
                            </div>
                        </label>

                        <label className={`flex flex-col p-5 border rounded-lg cursor-pointer transition-all duration-200 ${data.roster_send_sms ? 'border-purple-500 bg-purple-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2.5 rounded-lg ${data.roster_send_sms ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                                    <FiMessageSquare className="w-5 h-5" />
                                </div>
                                <Checkbox
                                    name="roster_send_sms"
                                    checked={data.roster_send_sms}
                                    onChange={(e) => setData('roster_send_sms', e.target.checked)}
                                    className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <span className={`block text-sm font-normal mb-1 ${data.roster_send_sms ? 'text-purple-900' : 'text-gray-900'}`}>Text SMS</span>
                                <span className="block text-xs text-gray-500 leading-relaxed">Send short text updates to phones.</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Loan Notification Channels */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                            <FiMessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-normal text-gray-900 tracking-normal">Loan Notification Channels</h2>
                            <p className="text-sm text-gray-500">Choose how employees are notified on loan disbursement and installment payments.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className={`flex flex-col p-5 border rounded-lg cursor-pointer transition-all duration-200 ${data.loan_send_email ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2.5 rounded-lg ${data.loan_send_email ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                                    <FiMail className="w-5 h-5" />
                                </div>
                                <Checkbox
                                    name="loan_send_email"
                                    checked={data.loan_send_email}
                                    onChange={(e) => setData('loan_send_email', e.target.checked)}
                                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <span className={`block text-sm font-normal mb-1 ${data.loan_send_email ? 'text-indigo-900' : 'text-gray-900'}`}>Email</span>
                                <span className="block text-xs text-gray-500 leading-relaxed">Send loan updates via Email.</span>
                            </div>
                        </label>

                        <label className={`flex flex-col p-5 border rounded-lg cursor-pointer transition-all duration-200 ${data.loan_send_whatsapp ? 'border-green-500 bg-green-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2.5 rounded-lg ${data.loan_send_whatsapp ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                    <FiPhone className="w-5 h-5" />
                                </div>
                                <Checkbox
                                    name="loan_send_whatsapp"
                                    checked={data.loan_send_whatsapp}
                                    onChange={(e) => setData('loan_send_whatsapp', e.target.checked)}
                                    className="w-5 h-5 rounded text-green-600 focus:ring-green-500"
                                />
                            </div>
                            <div>
                                <span className={`block text-sm font-normal mb-1 ${data.loan_send_whatsapp ? 'text-green-900' : 'text-gray-900'}`}>WhatsApp</span>
                                <span className="block text-xs text-gray-500 leading-relaxed">Send loan updates via WhatsApp.</span>
                            </div>
                        </label>

                        <label className={`flex flex-col p-5 border rounded-lg cursor-pointer transition-all duration-200 ${data.loan_send_sms ? 'border-purple-500 bg-purple-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2.5 rounded-lg ${data.loan_send_sms ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                                    <FiMessageSquare className="w-5 h-5" />
                                </div>
                                <Checkbox
                                    name="loan_send_sms"
                                    checked={data.loan_send_sms}
                                    onChange={(e) => setData('loan_send_sms', e.target.checked)}
                                    className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <span className={`block text-sm font-normal mb-1 ${data.loan_send_sms ? 'text-purple-900' : 'text-gray-900'}`}>Text SMS</span>
                                <span className="block text-xs text-gray-500 leading-relaxed">Send loan updates via SMS.</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* WhatsApp Integration */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                        <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
                            <FiPhone className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-normal text-gray-900 tracking-normal">WhatsApp API Integration</h2>
                            <p className="text-sm text-gray-500">Configure your WhatsApp API provider settings.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-full">
                            <InputLabel htmlFor="whatsapp_provider" value="Provider" />
                            <select
                                id="whatsapp_provider"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                value={data.whatsapp_provider}
                                onChange={(e) => setData('whatsapp_provider', e.target.value)}
                            >
                                <option value="custom">Custom API</option>
                                <option value="twilio">Twilio</option>
                                <option value="vonage">Vonage (Nexmo)</option>
                                <option value="infobip">InfoBip</option>
                                <option value="messagebird">MessageBird</option>
                                <option value="plivo">Plivo</option>
                                <option value="meta">Meta (Official WhatsApp API)</option>
                            </select>
                        </div>

                        {(() => {
                            switch (data.whatsapp_provider) {
                                case 'twilio':
                                    return (
                                        <>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="twilio_sid" value="Twilio Account SID" />
                                                <TextInput id="twilio_sid" type="text" className="mt-1 block w-full" value={data.twilio_sid} onChange={(e) => setData('twilio_sid', e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                                                <InputError message={errors.twilio_sid} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="twilio_token" value="Twilio Auth Token" />
                                                <TextInput id="twilio_token" type="password" className="mt-1 block w-full" value={data.twilio_token} onChange={(e) => setData('twilio_token', e.target.value)} placeholder="Enter your Auth Token" />
                                                <InputError message={errors.twilio_token} className="mt-2" />
                                            </div>
                                            <div className="col-span-full">
                                                <InputLabel htmlFor="twilio_whatsapp_from" value="Twilio WhatsApp Number" />
                                                <TextInput id="twilio_whatsapp_from" type="text" className="mt-1 block w-full" value={data.twilio_whatsapp_from} onChange={(e) => setData('twilio_whatsapp_from', e.target.value)} placeholder="whatsapp:+14155238886" />
                                                <InputError message={errors.twilio_whatsapp_from} className="mt-2" />
                                            </div>
                                        </>
                                    );
                                case 'vonage':
                                    return (
                                        <>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="vonage_api_key" value="Vonage API Key" />
                                                <TextInput id="vonage_api_key" type="text" className="mt-1 block w-full" value={data.vonage_api_key} onChange={(e) => setData('vonage_api_key', e.target.value)} placeholder="Enter API Key" />
                                                <InputError message={errors.vonage_api_key} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="vonage_api_secret" value="Vonage API Secret" />
                                                <TextInput id="vonage_api_secret" type="password" className="mt-1 block w-full" value={data.vonage_api_secret} onChange={(e) => setData('vonage_api_secret', e.target.value)} placeholder="Enter API Secret" />
                                                <InputError message={errors.vonage_api_secret} className="mt-2" />
                                            </div>
                                            <div className="col-span-full">
                                                <InputLabel htmlFor="vonage_whatsapp_from" value="Vonage WhatsApp Sender" />
                                                <TextInput id="vonage_whatsapp_from" type="text" className="mt-1 block w-full" value={data.vonage_whatsapp_from} onChange={(e) => setData('vonage_whatsapp_from', e.target.value)} placeholder="e.g. +1234567890" />
                                                <InputError message={errors.vonage_whatsapp_from} className="mt-2" />
                                            </div>
                                        </>
                                    );
                                case 'infobip':
                                    return (
                                        <>
                                            <div className="col-span-full">
                                                <InputLabel htmlFor="infobip_base_url" value="InfoBip Base URL" />
                                                <TextInput id="infobip_base_url" type="url" className="mt-1 block w-full" value={data.infobip_base_url} onChange={(e) => setData('infobip_base_url', e.target.value)} placeholder="https://xxxxx.api.infobip.com" />
                                                <InputError message={errors.infobip_base_url} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="infobip_api_key" value="InfoBip API Key" />
                                                <TextInput id="infobip_api_key" type="password" className="mt-1 block w-full" value={data.infobip_api_key} onChange={(e) => setData('infobip_api_key', e.target.value)} placeholder="Enter API Key" />
                                                <InputError message={errors.infobip_api_key} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="infobip_whatsapp_from" value="InfoBip WhatsApp Sender" />
                                                <TextInput id="infobip_whatsapp_from" type="text" className="mt-1 block w-full" value={data.infobip_whatsapp_from} onChange={(e) => setData('infobip_whatsapp_from', e.target.value)} placeholder="e.g. 447860099299" />
                                                <InputError message={errors.infobip_whatsapp_from} className="mt-2" />
                                            </div>
                                        </>
                                    );
                                case 'messagebird':
                                    return (
                                        <>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="messagebird_access_key" value="MessageBird Access Key" />
                                                <TextInput id="messagebird_access_key" type="password" className="mt-1 block w-full" value={data.messagebird_access_key} onChange={(e) => setData('messagebird_access_key', e.target.value)} placeholder="Enter Access Key" />
                                                <InputError message={errors.messagebird_access_key} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="messagebird_whatsapp_from" value="MessageBird WhatsApp Channel ID" />
                                                <TextInput id="messagebird_whatsapp_from" type="text" className="mt-1 block w-full" value={data.messagebird_whatsapp_from} onChange={(e) => setData('messagebird_whatsapp_from', e.target.value)} placeholder="e.g. Channel ID" />
                                                <InputError message={errors.messagebird_whatsapp_from} className="mt-2" />
                                            </div>
                                        </>
                                    );
                                case 'plivo':
                                    return (
                                        <>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="plivo_auth_id" value="Plivo Auth ID" />
                                                <TextInput id="plivo_auth_id" type="text" className="mt-1 block w-full" value={data.plivo_auth_id} onChange={(e) => setData('plivo_auth_id', e.target.value)} placeholder="Enter Auth ID" />
                                                <InputError message={errors.plivo_auth_id} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="plivo_auth_token" value="Plivo Auth Token" />
                                                <TextInput id="plivo_auth_token" type="password" className="mt-1 block w-full" value={data.plivo_auth_token} onChange={(e) => setData('plivo_auth_token', e.target.value)} placeholder="Enter Auth Token" />
                                                <InputError message={errors.plivo_auth_token} className="mt-2" />
                                            </div>
                                            <div className="col-span-full">
                                                <InputLabel htmlFor="plivo_whatsapp_from" value="Plivo WhatsApp Sender" />
                                                <TextInput id="plivo_whatsapp_from" type="text" className="mt-1 block w-full" value={data.plivo_whatsapp_from} onChange={(e) => setData('plivo_whatsapp_from', e.target.value)} placeholder="e.g. +1234567890" />
                                                <InputError message={errors.plivo_whatsapp_from} className="mt-2" />
                                            </div>
                                        </>
                                    );
                                case 'meta':
                                    return (
                                        <>
                                            <div className="col-span-full">
                                                <InputLabel htmlFor="whatsapp_api_token_meta" value="Meta Permanent Access Token" />
                                                <TextInput id="whatsapp_api_token_meta" type="password" className="mt-1 block w-full" value={data.whatsapp_api_token} onChange={(e) => setData('whatsapp_api_token', e.target.value)} placeholder="EAAB..." />
                                                <p className="mt-1 text-[10px] text-gray-500">Generate a permanent token in your Meta App Settings.</p>
                                                <InputError message={errors.whatsapp_api_token} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="meta_phone_number_id" value="Phone Number ID" />
                                                <TextInput id="meta_phone_number_id" type="text" className="mt-1 block w-full" value={data.meta_phone_number_id} onChange={(e) => setData('meta_phone_number_id', e.target.value)} placeholder="e.g. 1065..." />
                                                <InputError message={errors.meta_phone_number_id} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="meta_waba_id" value="WhatsApp Business Account ID" />
                                                <TextInput id="meta_waba_id" type="text" className="mt-1 block w-full" value={data.meta_waba_id} onChange={(e) => setData('meta_waba_id', e.target.value)} placeholder="e.g. 1099..." />
                                                <InputError message={errors.meta_waba_id} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="whatsapp_template_name" value="Template Name" />
                                                <TextInput id="whatsapp_template_name" type="text" className="mt-1 block w-full" value={data.whatsapp_template_name} onChange={(e) => setData('whatsapp_template_name', e.target.value)} placeholder="e.g. shift_roster_notification" />
                                                <p className="mt-1 text-[10px] text-gray-500">The name of your approved template in Meta.</p>
                                                <InputError message={errors.whatsapp_template_name} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="whatsapp_loan_template_name" value="Loan Template Name" />
                                                <TextInput id="whatsapp_loan_template_name" type="text" className="mt-1 block w-full" value={data.whatsapp_loan_template_name} onChange={(e) => setData('whatsapp_loan_template_name', e.target.value)} placeholder="e.g. loan_notification" />
                                                <p className="mt-1 text-[10px] text-gray-500">The name of your approved loan template in Meta.</p>
                                                <InputError message={errors.whatsapp_loan_template_name} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="whatsapp_template_language" value="Roster Template Language" />
                                                <TextInput id="whatsapp_template_language" type="text" className="mt-1 block w-full" value={data.whatsapp_template_language} onChange={(e) => setData('whatsapp_template_language', e.target.value)} placeholder="e.g. en_US" />
                                                <InputError message={errors.whatsapp_template_language} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="whatsapp_loan_template_language" value="Loan Template Language" />
                                                <TextInput id="whatsapp_loan_template_language" type="text" className="mt-1 block w-full" value={data.whatsapp_loan_template_language} onChange={(e) => setData('whatsapp_loan_template_language', e.target.value)} placeholder="e.g. en or en_US" />
                                                <p className="mt-1 text-[10px] text-gray-500">Language code for your loan template (defaults to roster language if empty).</p>
                                                <InputError message={errors.whatsapp_loan_template_language} className="mt-2" />
                                            </div>
                                            <div className="col-span-full mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowMetaTemplateModal(true)}
                                                    className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900 transition-colors"
                                                >
                                                    <FiInfo className="w-4 h-4 mr-1.5" />
                                                    View Meta Template Format Requirements
                                                </button>
                                            </div>
                                        </>
                                    );
                                default:
                                    return (
                                        <>
                                            <div className="col-span-full">
                                                <InputLabel htmlFor="whatsapp_api_url" value="API URL" />
                                                <TextInput id="whatsapp_api_url" type="url" className="mt-1 block w-full" value={data.whatsapp_api_url} onChange={(e) => setData('whatsapp_api_url', e.target.value)} placeholder="https://api.whatsapp.provider.com/v1/messages" />
                                                <InputError message={errors.whatsapp_api_url} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="whatsapp_api_token" value="API Token / Auth Key" />
                                                <TextInput id="whatsapp_api_token" type="password" className="mt-1 block w-full" value={data.whatsapp_api_token} onChange={(e) => setData('whatsapp_api_token', e.target.value)} placeholder="Enter your API token" />
                                                <InputError message={errors.whatsapp_api_token} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="whatsapp_sender_number" value="Sender Number / Phone ID" />
                                                <TextInput id="whatsapp_sender_number" type="text" className="mt-1 block w-full" value={data.whatsapp_sender_number} onChange={(e) => setData('whatsapp_sender_number', e.target.value)} placeholder="e.g. +1234567890 or 1002345" />
                                                <InputError message={errors.whatsapp_sender_number} className="mt-2" />
                                            </div>
                                        </>
                                    );
                            }
                        })()}
                    </div>
                </div>

                {/* SMS Integration */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                            <FiMessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-normal text-gray-900 tracking-normal">SMS API Integration</h2>
                            <p className="text-sm text-gray-500">Configure your SMS API provider settings.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-full">
                            <InputLabel htmlFor="sms_provider" value="Provider" />
                            <select
                                id="sms_provider"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                value={data.sms_provider}
                                onChange={(e) => setData('sms_provider', e.target.value)}
                            >
                                <option value="custom">Custom API</option>
                                <option value="twilio">Twilio</option>
                                <option value="vonage">Vonage (Nexmo)</option>
                                <option value="infobip">InfoBip</option>
                                <option value="messagebird">MessageBird</option>
                                <option value="plivo">Plivo</option>
                            </select>
                        </div>

                        {(() => {
                            switch (data.sms_provider) {
                                case 'twilio':
                                    return (
                                        <>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="twilio_sid_sms" value="Twilio Account SID" />
                                                <TextInput id="twilio_sid_sms" type="text" className="mt-1 block w-full" value={data.twilio_sid} onChange={(e) => setData('twilio_sid', e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                                                <InputError message={errors.twilio_sid} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="twilio_token_sms" value="Twilio Auth Token" />
                                                <TextInput id="twilio_token_sms" type="password" className="mt-1 block w-full" value={data.twilio_token} onChange={(e) => setData('twilio_token', e.target.value)} placeholder="Enter your Auth Token" />
                                                <InputError message={errors.twilio_token} className="mt-2" />
                                            </div>
                                            <div className="col-span-full">
                                                <InputLabel htmlFor="twilio_sms_from" value="Twilio SMS Sender ID / Number" />
                                                <TextInput id="twilio_sms_from" type="text" className="mt-1 block w-full" value={data.twilio_sms_from} onChange={(e) => setData('twilio_sms_from', e.target.value)} placeholder="e.g. +1234567890 or MYCOMPANY" />
                                                <InputError message={errors.twilio_sms_from} className="mt-2" />
                                            </div>
                                        </>
                                    );
                                case 'vonage':
                                    return (
                                        <>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="vonage_api_key_sms" value="Vonage API Key" />
                                                <TextInput id="vonage_api_key_sms" type="text" className="mt-1 block w-full" value={data.vonage_api_key} onChange={(e) => setData('vonage_api_key', e.target.value)} placeholder="Enter API Key" />
                                                <InputError message={errors.vonage_api_key} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="vonage_api_secret_sms" value="Vonage API Secret" />
                                                <TextInput id="vonage_api_secret_sms" type="password" className="mt-1 block w-full" value={data.vonage_api_secret} onChange={(e) => setData('vonage_api_secret', e.target.value)} placeholder="Enter API Secret" />
                                                <InputError message={errors.vonage_api_secret} className="mt-2" />
                                            </div>
                                            <div className="col-span-full">
                                                <InputLabel htmlFor="vonage_sms_from" value="Vonage SMS Sender ID" />
                                                <TextInput id="vonage_sms_from" type="text" className="mt-1 block w-full" value={data.vonage_sms_from} onChange={(e) => setData('vonage_sms_from', e.target.value)} placeholder="e.g. MYCOMPANY" />
                                                <InputError message={errors.vonage_sms_from} className="mt-2" />
                                            </div>
                                        </>
                                    );
                                case 'infobip':
                                    return (
                                        <>
                                            <div className="col-span-full">
                                                <InputLabel htmlFor="infobip_base_url_sms" value="InfoBip Base URL" />
                                                <TextInput id="infobip_base_url_sms" type="url" className="mt-1 block w-full" value={data.infobip_base_url} onChange={(e) => setData('infobip_base_url', e.target.value)} placeholder="https://xxxxx.api.infobip.com" />
                                                <InputError message={errors.infobip_base_url} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="infobip_api_key_sms" value="InfoBip API Key" />
                                                <TextInput id="infobip_api_key_sms" type="password" className="mt-1 block w-full" value={data.infobip_api_key} onChange={(e) => setData('infobip_api_key', e.target.value)} placeholder="Enter API Key" />
                                                <InputError message={errors.infobip_api_key} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="infobip_sms_from" value="InfoBip SMS Sender ID" />
                                                <TextInput id="infobip_sms_from" type="text" className="mt-1 block w-full" value={data.infobip_sms_from} onChange={(e) => setData('infobip_sms_from', e.target.value)} placeholder="e.g. MYCOMPANY" />
                                                <InputError message={errors.infobip_sms_from} className="mt-2" />
                                            </div>
                                        </>
                                    );
                                case 'messagebird':
                                    return (
                                        <>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="messagebird_access_key_sms" value="MessageBird Access Key" />
                                                <TextInput id="messagebird_access_key_sms" type="password" className="mt-1 block w-full" value={data.messagebird_access_key} onChange={(e) => setData('messagebird_access_key', e.target.value)} placeholder="Enter Access Key" />
                                                <InputError message={errors.messagebird_access_key} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="messagebird_sms_from" value="MessageBird SMS Sender ID" />
                                                <TextInput id="messagebird_sms_from" type="text" className="mt-1 block w-full" value={data.messagebird_sms_from} onChange={(e) => setData('messagebird_sms_from', e.target.value)} placeholder="e.g. MYCOMPANY" />
                                                <InputError message={errors.messagebird_sms_from} className="mt-2" />
                                            </div>
                                        </>
                                    );
                                case 'plivo':
                                    return (
                                        <>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="plivo_auth_id_sms" value="Plivo Auth ID" />
                                                <TextInput id="plivo_auth_id_sms" type="text" className="mt-1 block w-full" value={data.plivo_auth_id} onChange={(e) => setData('plivo_auth_id', e.target.value)} placeholder="Enter Auth ID" />
                                                <InputError message={errors.plivo_auth_id} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="plivo_auth_token_sms" value="Plivo Auth Token" />
                                                <TextInput id="plivo_auth_token_sms" type="password" className="mt-1 block w-full" value={data.plivo_auth_token} onChange={(e) => setData('plivo_auth_token', e.target.value)} placeholder="Enter Auth Token" />
                                                <InputError message={errors.plivo_auth_token} className="mt-2" />
                                            </div>
                                            <div className="col-span-full">
                                                <InputLabel htmlFor="plivo_sms_from" value="Plivo SMS Sender ID / Number" />
                                                <TextInput id="plivo_sms_from" type="text" className="mt-1 block w-full" value={data.plivo_sms_from} onChange={(e) => setData('plivo_sms_from', e.target.value)} placeholder="e.g. +1234567890" />
                                                <InputError message={errors.plivo_sms_from} className="mt-2" />
                                            </div>
                                        </>
                                    );
                                default:
                                    return (
                                        <>
                                            <div className="col-span-full">
                                                <InputLabel htmlFor="sms_api_url" value="API URL" />
                                                <TextInput id="sms_api_url" type="url" className="mt-1 block w-full" value={data.sms_api_url} onChange={(e) => setData('sms_api_url', e.target.value)} placeholder="https://api.sms.provider.com/v1/send" />
                                                <InputError message={errors.sms_api_url} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="sms_api_token" value="API Token / Auth Key" />
                                                <TextInput id="sms_api_token" type="password" className="mt-1 block w-full" value={data.sms_api_token} onChange={(e) => setData('sms_api_token', e.target.value)} placeholder="Enter your API token" />
                                                <InputError message={errors.sms_api_token} className="mt-2" />
                                            </div>
                                            <div className="col-span-full md:col-span-1">
                                                <InputLabel htmlFor="sms_sender_id" value="Sender ID / From Number" />
                                                <TextInput id="sms_sender_id" type="text" className="mt-1 block w-full" value={data.sms_sender_id} onChange={(e) => setData('sms_sender_id', e.target.value)} placeholder="e.g. COMPANY_NAME or +1234567890" />
                                                <InputError message={errors.sms_sender_id} className="mt-2" />
                                            </div>
                                        </>
                                    );
                            }
                        })()}
                        
                        {/* Global SMS Templates */}
                        <div className="col-span-full border-t border-gray-100 pt-6 mt-2">
                            <h3 className="text-sm font-normal text-gray-800 mb-4">SMS Templates</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-full md:col-span-1 space-y-4">
                                    <div>
                                        <InputLabel htmlFor="sms_template_id_roster" value="Shift Roster Template ID (e.g., DLT)" />
                                        <TextInput
                                            id="sms_template_id_roster"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.sms_template_id_roster}
                                            onChange={(e) => setData('sms_template_id_roster', e.target.value)}
                                            placeholder="e.g. 100716... (Optional)"
                                        />
                                        <InputError message={errors.sms_template_id_roster} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="sms_template_roster" value="Shift Roster Template Format" />
                                        <TextInput
                                            id="sms_template_roster"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.sms_template_roster}
                                            onChange={(e) => setData('sms_template_roster', e.target.value)}
                                            placeholder="e.g. Hi {#var#}, your shift is ready."
                                        />
                                        <InputError message={errors.sms_template_roster} className="mt-2" />
                                    </div>
                                </div>
                                <div className="col-span-full md:col-span-1 space-y-4">
                                    <div>
                                        <InputLabel htmlFor="sms_template_id_loan" value="Loan Template ID (e.g., DLT)" />
                                        <TextInput
                                            id="sms_template_id_loan"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.sms_template_id_loan}
                                            onChange={(e) => setData('sms_template_id_loan', e.target.value)}
                                            placeholder="e.g. 100716... (Optional)"
                                        />
                                        <InputError message={errors.sms_template_id_loan} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="sms_template_loan" value="Loan Template Format" />
                                        <TextInput
                                            id="sms_template_loan"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.sms_template_loan}
                                            onChange={(e) => setData('sms_template_loan', e.target.value)}
                                            placeholder="e.g. Dear {#var#}, loan processed."
                                        />
                                        <InputError message={errors.sms_template_loan} className="mt-2" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowSmsTemplateModal(true)}
                                    className="inline-flex items-center text-sm text-purple-600 hover:text-purple-900 transition-colors"
                                >
                                    <FiInfo className="w-4 h-4 mr-1.5" />
                                    View SMS Template Examples & DLT Requirements
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-green-600">Saved.</p>
                    </Transition>
                    <PrimaryButton
                        type="submit"
                        disabled={processing}
                        className="bg-primary hover:bg-primary-dark"
                    >
                        <FiSave className="w-4 h-4 mr-2" />
                        Save Settings
                    </PrimaryButton>
                </div>
            </form>

            <Modal show={showMetaTemplateModal} onClose={() => setShowMetaTemplateModal(false)} maxWidth="2xl">
                <div className="p-6">
                    <h2 className="text-lg font-normal text-gray-900 mb-4 flex items-center">
                        <FiInfo className="mr-2 text-indigo-500" /> Meta WhatsApp Template Formats
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                        To use Meta WhatsApp notifications, you must create templates in your Facebook Business Manager that exactly match these formats. Use the copy buttons below to grab the exact text for the template body.
                    </p>

                    <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3 border-b pb-2">
                            <h3 className="font-normal text-gray-800">1. Shift Roster Notification</h3>
                            <button
                                onClick={() => copyToClipboard('Hi {{1}},\n\nHere is your shift roster for {{2}} at {{3}}:\n\n{{4}}\n\nPlease arrive 10 mins early. Contact HR for any queries.', 'roster')}
                                className="flex items-center text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-indigo-600 transition-colors font-normal"
                            >
                                {copiedRoster ? <><FiCheck className="mr-1.5" /> Copied!</> : <><FiCopy className="mr-1.5" /> Copy Body</>}
                            </button>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200 text-sm font-mono text-gray-700 whitespace-pre-wrap leading-relaxed">
                            Hi {'{{1}}'},{'\n\n'}
                            Here is your shift roster for {'{{2}}'} at {'{{3}}'}:{'\n\n'}
                            {'{{4}}'}{'\n\n'}
                            Please arrive 10 mins early. Contact HR for any queries.
                        </div>
                        <ul className="text-xs text-gray-500 mt-3 list-disc pl-5 space-y-1">
                            <li><strong>{`{{1}}`}</strong>: Employee Name</li>
                            <li><strong>{`{{2}}`}</strong>: Date Range</li>
                            <li><strong>{`{{3}}`}</strong>: Company Name</li>
                            <li><strong>{`{{4}}`}</strong>: Roster Summary List</li>
                        </ul>
                    </div>

                    <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3 border-b pb-2">
                            <h3 className="font-normal text-gray-800">2. Loan Notification</h3>
                            <button
                                onClick={() => copyToClipboard('Dear {{1}},\n\nYour loan transaction of {{2}} has been processed by {{3}}.\n\nDetails: {{4}}\n\nPlease contact HR for any queries.', 'loan')}
                                className="flex items-center text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-indigo-600 transition-colors font-normal"
                            >
                                {copiedLoan ? <><FiCheck className="mr-1.5" /> Copied!</> : <><FiCopy className="mr-1.5" /> Copy Body</>}
                            </button>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200 text-sm font-mono text-gray-700 whitespace-pre-wrap leading-relaxed">
                            Dear {'{{1}}'},{'\n\n'}
                            Your loan transaction of {'{{2}}'} has been processed by {'{{3}}'}.{'\n\n'}
                            Details: {'{{4}}'}{'\n\n'}
                            Please contact HR for any queries.
                        </div>
                        <ul className="text-xs text-gray-500 mt-3 list-disc pl-5 space-y-1">
                            <li><strong>{`{{1}}`}</strong>: Employee Name</li>
                            <li><strong>{`{{2}}`}</strong>: Amount</li>
                            <li><strong>{`{{3}}`}</strong>: Company Name</li>
                            <li><strong>{`{{4}}`}</strong>: Extra Details</li>
                        </ul>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <PrimaryButton
                            onClick={() => setShowMetaTemplateModal(false)}
                            className="bg-gray-800 hover:bg-gray-700"
                        >
                            Close
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            {/* SMS Templates Modal */}
            <Modal show={showSmsTemplateModal} onClose={() => setShowSmsTemplateModal(false)} maxWidth="2xl">
                <div className="p-6">
                    <h2 className="text-lg font-normal text-gray-900 mb-4 flex items-center">
                        <FiInfo className="mr-2 text-purple-500" /> SMS Template Formats & DLT
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                        For SMS, depending on your provider and region (e.g., TRAI DLT in India), you may need to register specific template formats and provide a Template ID, or just pass the body text.
                    </p>

                    <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3 border-b pb-2">
                            <h3 className="font-normal text-gray-800">1. Shift Roster SMS</h3>
                            <button
                                onClick={() => copyToClipboard('Hi {#var#}, your shift for {#var#} at {#var#} is ready. Please check portal. Regards, HR', 'roster')}
                                className="flex items-center text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-purple-600 transition-colors font-normal"
                            >
                                {copiedRoster ? <><FiCheck className="mr-1.5" /> Copied!</> : <><FiCopy className="mr-1.5" /> Copy Body</>}
                            </button>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200 text-sm font-mono text-gray-700 whitespace-pre-wrap leading-relaxed">
                            Hi {'{#var#}'}, your shift for {'{#var#}'} at {'{#var#}'} is ready. Please check portal. Regards, HR
                        </div>
                        <ul className="text-xs text-gray-500 mt-3 list-disc pl-5 space-y-1">
                            <li><strong>DLT Variables</strong>: Often use {'{#var#}'} or similar placeholder syntax depending on your gateway.</li>
                            <li><strong>Variables Order</strong>: Employee Name, Date Range, Company Name.</li>
                        </ul>
                    </div>

                    <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3 border-b pb-2">
                            <h3 className="font-normal text-gray-800">2. Loan Notification SMS</h3>
                            <button
                                onClick={() => copyToClipboard('Dear {#var#}, your loan of {#var#} is processed by {#var#}. Details: {#var#}.', 'loan')}
                                className="flex items-center text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-purple-600 transition-colors font-normal"
                            >
                                {copiedLoan ? <><FiCheck className="mr-1.5" /> Copied!</> : <><FiCopy className="mr-1.5" /> Copy Body</>}
                            </button>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200 text-sm font-mono text-gray-700 whitespace-pre-wrap leading-relaxed">
                            Dear {'{#var#}'}, your loan of {'{#var#}'} is processed by {'{#var#}'}. Details: {'{#var#}'}.
                        </div>
                        <ul className="text-xs text-gray-500 mt-3 list-disc pl-5 space-y-1">
                            <li><strong>Variables Order</strong>: Employee Name, Amount, Company Name, Extra Details.</li>
                        </ul>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <PrimaryButton
                            onClick={() => setShowSmsTemplateModal(false)}
                            className="bg-gray-800 hover:bg-gray-700"
                        >
                            Close
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </SettingsLayout>
    );
}
