import SettingsLayout from './SettingsLayout';
import { useForm } from '@inertiajs/react';
import { FaHdd, FaBell, FaInfoCircle, FaFileContract, FaCheckCircle, FaSave } from 'react-icons/fa';

export default function DocumentSettings({ settings }) {
    const { data, setData, post, processing } = useForm({
        expiry_notification_days: settings.expiry_notification_days || 30,
        second_reminder_days: settings.second_reminder_days || 7,
        retention_period_years: settings.retention_period_years || 7,
        require_verification: settings.require_verification || true,
        max_file_size_mb: settings.max_file_size_mb || 10,
        allowed_file_types: settings.allowed_file_types || ['pdf', 'doc', 'docx', 'jpg', 'png'],
        auto_archive_expired: settings.auto_archive_expired || false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.documents.update'));
    };

    return (
        <SettingsLayout
            activeTab="documents"
            title="Document Management"
            description="Configure expiry alerts, required documents, and retention policies."
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    {/* Main Form Area */}
                    <div className="xl:col-span-8 space-y-4">
                        
                        {/* Storage & Retention Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-900 p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                                    <FaHdd size={18} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-normal text-white uppercase tracking-normal">Storage & Retention</h3>
                                    <p className="text-[9px] text-slate-400 font-normal uppercase">Binary asset constraints and lifecycle rules</p>
                                </div>
                            </div>
                            <div className="p-5 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal ml-1">Max File Size (MB)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.max_file_size_mb}
                                            onChange={(e) => setData('max_file_size_mb', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-800 focus:ring-primary focus:border-primary transition-all uppercase tracking-normal"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal ml-1">Retention Period (YRS)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={data.retention_period_years}
                                            onChange={(e) => setData('retention_period_years', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-800 focus:ring-primary focus:border-primary transition-all uppercase tracking-normal"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal ml-1 block">Authorized File Formats</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => {
                                                    if (data.allowed_file_types.includes(type)) {
                                                        setData('allowed_file_types', data.allowed_file_types.filter(t => t !== type));
                                                    } else {
                                                        setData('allowed_file_types', [...data.allowed_file_types, type]);
                                                    }
                                                }}
                                                className={`px-3 py-1.5 rounded-lg border text-[9px] font-normal uppercase tracking-normal transition-all ${data.allowed_file_types.includes(type)
                                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                                                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-400'
                                                    }`}
                                            >
                                                .{type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expiry & Verification Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-900 p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
                                    <FaBell size={18} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-normal text-white uppercase tracking-normal">Alerts & Compliance</h3>
                                    <p className="text-[9px] text-slate-400 font-normal uppercase">Notification thresholds and audit requirements</p>
                                </div>
                            </div>
                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal ml-1">Primary Alert (DAYS)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={data.expiry_notification_days}
                                            onChange={(e) => setData('expiry_notification_days', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-800 focus:ring-primary focus:border-primary transition-all uppercase tracking-normal"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-normal ml-1">Secondary Warning (DAYS)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={data.second_reminder_days}
                                            onChange={(e) => setData('second_reminder_days', e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-lg text-xs font-normal text-slate-800 focus:ring-primary focus:border-primary transition-all uppercase tracking-normal"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <FaCheckCircle size={10} className={data.require_verification ? 'text-primary' : 'text-slate-300'} />
                                            <span className="text-[9px] font-normal text-slate-700 uppercase tracking-normal">Audit Verification</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setData('require_verification', !data.require_verification)}
                                            className={`w-8 h-4 rounded-full relative transition-all ${data.require_verification ? 'bg-primary' : 'bg-slate-200'}`}
                                        >
                                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${data.require_verification ? 'right-0.5' : 'left-0.5'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <FaFileContract size={10} className={data.auto_archive_expired ? 'text-amber-500' : 'text-slate-300'} />
                                            <span className="text-[9px] font-normal text-slate-700 uppercase tracking-normal">Auto-Archive Logic</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setData('auto_archive_expired', !data.auto_archive_expired)}
                                            className={`w-8 h-4 rounded-full relative transition-all ${data.auto_archive_expired ? 'bg-amber-500' : 'bg-slate-200'}`}
                                        >
                                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${data.auto_archive_expired ? 'right-0.5' : 'left-0.5'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Analysis Sidebar */}
                    <div className="xl:col-span-4 space-y-4">
                        <div className="bg-slate-900 rounded-lg p-5 text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform duration-500">
                                <FaInfoCircle size={60} />
                            </div>
                            <div className="relative z-10 space-y-4">
                                <h4 className="text-[10px] font-normal uppercase tracking-normal border-b border-white/10 pb-2 flex items-center gap-2">
                                    <FaInfoCircle className="text-primary" /> Configuration Insight
                                </h4>
                                <p className="text-[9px] text-slate-400 leading-relaxed font-normal uppercase tracking-normal">
                                    Adjusting these parameters will propagate across the entire employee document vault immediately. 
                                    Ensure the maximum file size matches your server's POST upload limits.
                                </p>
                                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                    <p className="text-[8px] text-slate-500 font-normal uppercase tracking-normal">Current Status: Operative</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl text-[11px] font-normal uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                            >
                                <FaSave size={12} /> {processing ? 'Syncing...' : 'Sync Configuration'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </SettingsLayout>
    );
}
