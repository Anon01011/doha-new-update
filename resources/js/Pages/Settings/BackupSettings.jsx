import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import SettingsLayout from './SettingsLayout';
import {
    FiHardDrive,
    FiDownload,
    FiUpload,
    FiDatabase,
    FiTrash2,
    FiCheckCircle,
    FiAlertTriangle,
    FiRefreshCw,
    FiClock,
    FiFileText,
    FiLayers,
    FiShield,
    FiSave,
    FiGrid,
    FiFolder,
    FiUsers,
    FiFilePlus
} from 'react-icons/fi';
import Modal from '@/Components/Modal';

export default function BackupSettings({ backups = [], stats = {}, settings = {} }) {
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [selectedBackupForRestore, setSelectedBackupForRestore] = useState(null);
    const [restoreFile, setRestoreFile] = useState(null);
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    // Form for automated backup settings
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        auto_backup_enabled: settings.auto_backup_enabled || false,
        backup_frequency: settings.backup_frequency || 'daily',
        backup_time: settings.backup_time || '02:00',
        backup_retention_days: settings.backup_retention_days || 30,
        include_media_files: settings.include_media_files !== undefined ? settings.include_media_files : true,
        notification_email: settings.notification_email || '',
    });

    const handleSaveSettings = (e) => {
        e.preventDefault();
        post(route('settings.backup.settings'), {
            preserveScroll: true,
        });
    };

    const handleCreateBackup = (scope = 'full') => {
        if (confirm(`Are you sure you want to create a new ${scope === 'full' ? 'Full System (Database + Media)' : 'Database Only'} backup now?`)) {
            setIsCreatingBackup(true);
            router.post(route('settings.backup.create'), { scope }, {
                preserveScroll: true,
                onFinish: () => setIsCreatingBackup(false),
            });
        }
    };

    const handleDeleteBackup = (filename) => {
        if (confirm(`Are you sure you want to permanently delete backup "${filename}"?`)) {
            router.delete(route('settings.backup.destroy', { filename }), {
                preserveScroll: true,
            });
        }
    };

    const handleFileRestoreSubmit = (e) => {
        e.preventDefault();
        if (!restoreFile) return;

        if (confirm('CRITICAL WARNING: Restoring a backup will overwrite current system database records and files. Are you sure you wish to proceed?')) {
            setIsRestoring(true);
            const formData = new FormData();
            formData.append('backup_file', restoreFile);

            router.post(route('settings.backup.restore'), formData, {
                preserveScroll: true,
                onSuccess: () => {
                    setShowRestoreModal(false);
                    setRestoreFile(null);
                },
                onFinish: () => setIsRestoring(false),
            });
        }
    };

    return (
        <SettingsLayout
            activeTab="backup"
            title="System Backup & Restore"
            description="Manage complete HRMS data exports, media archives, multi-sheet spreadsheets, and automated backup schedules."
        >
            <Head title="System Backup & Restore - Settings" />

            <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                        <FiHardDrive className="w-64 h-64" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
                                <FiShield className="w-4 h-4" />
                                Enterprise Data Protection
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Full System Backup & Restore</h1>
                            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                                Backup your entire HRMS system including all Salon branches, departments, employee records, uploaded images/IDs, documents, attendance logs, and payroll.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => handleCreateBackup('full')}
                                disabled={isCreatingBackup}
                                className="bg-primary hover:brightness-110 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-primary/30 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                <FiDownload className={`w-4 h-4 ${isCreatingBackup ? 'animate-bounce' : ''}`} />
                                <span>{isCreatingBackup ? 'Generating Backup...' : 'Create Full Backup (ZIP)'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowRestoreModal(true)}
                                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 backdrop-blur-sm"
                            >
                                <FiUpload className="w-4 h-4 text-emerald-400" />
                                <span>Restore Backup</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* System Stats Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-500">Database Size</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <FiDatabase className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{stats.db_size || 'N/A'}</p>
                        <p className="text-xs text-slate-400 mt-1">{stats.total_employees || 0} Employees / {stats.total_attendances || 0} Logs</p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-500">Stored Media & Docs</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <FiFolder className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{stats.media_size || '0 MB'}</p>
                        <p className="text-xs text-slate-400 mt-1">{stats.media_files_count || 0} Images & Documents</p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-500">Total Backups</span>
                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                <FiLayers className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{stats.total_backups || 0}</p>
                        <p className="text-xs text-slate-400 mt-1">Available in local storage</p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-500">Last Backup</span>
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                <FiClock className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 truncate" title={stats.last_backup}>{stats.last_backup || 'Never'}</p>
                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                            <FiCheckCircle className="w-3.5 h-3.5" /> System Status: Healthy
                        </p>
                    </div>
                </div>

                {/* Instant Export Options Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Card 1: Full ZIP Archive */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between group">
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                <FiHardDrive className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-800">Complete System Archive</h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Bundles complete MySQL database dump and all employee photos, passport copies, QID cards, and contracts into a compressed <b>.ZIP</b> archive.
                            </p>
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => handleCreateBackup('full')}
                                disabled={isCreatingBackup}
                                className="w-full py-2 px-3 text-xs font-medium text-primary bg-indigo-50/70 hover:bg-primary hover:text-white rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                <FiDownload className="w-3.5 h-3.5" />
                                Download Full System ZIP
                            </button>
                        </div>
                    </div>

                    {/* Card 2: Database SQL Dump */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-blue-400/40 transition-all flex flex-col justify-between group">
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                <FiDatabase className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-800">Database SQL Dump</h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Lightweight standard <b>.SQL</b> file containing schema definitions and all table data rows for fast database-level backup and restoration.
                            </p>
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => handleCreateBackup('db_only')}
                                disabled={isCreatingBackup}
                                className="w-full py-2 px-3 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                <FiDownload className="w-3.5 h-3.5" />
                                Export Database (.SQL)
                            </button>
                        </div>
                    </div>

                    {/* Card 3: Multi-Sheet Excel Workbook */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-emerald-400/40 transition-all flex flex-col justify-between group">
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                <FiGrid className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-800">Complete Excel Workbook</h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Formatted multi-tab <b>.XLSX</b> spreadsheet containing separate styled sheets for Employees, Branches, Departments, Users, Attendance, and Payroll.
                            </p>
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-100">
                            <a
                                href={route('settings.backup.export-excel')}
                                className="w-full py-2 px-3 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-lg transition-all flex items-center justify-center gap-2 text-center"
                            >
                                <FiDownload className="w-3.5 h-3.5" />
                                Download Full HRMS Excel (.XLSX)
                            </a>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Automated Backup Schedule Configuration */}
                    <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 shadow-sm h-fit">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <div className="flex items-center gap-2">
                                <FiClock className="w-5 h-5 text-primary" />
                                <h3 className="text-sm font-semibold text-slate-800">Automated Backup Settings</h3>
                            </div>
                        </div>

                        <form onSubmit={handleSaveSettings} className="space-y-4">
                            {/* Toggle auto backup */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block">Auto-Backup System</label>
                                    <span className="text-[11px] text-slate-500">Run automated background backups</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.auto_backup_enabled}
                                        onChange={e => setData('auto_backup_enabled', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            {/* Frequency */}
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Frequency</label>
                                <select
                                    value={data.backup_frequency}
                                    onChange={e => setData('backup_frequency', e.target.value)}
                                    className="w-full text-xs rounded-lg border-slate-200 focus:border-primary focus:ring-primary py-2"
                                >
                                    <option value="daily">Daily (Every night)</option>
                                    <option value="weekly">Weekly (Every Sunday)</option>
                                    <option value="monthly">Monthly (1st of each month)</option>
                                </select>
                            </div>

                            {/* Time */}
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Backup Execution Time</label>
                                <input
                                    type="time"
                                    value={data.backup_time}
                                    onChange={e => setData('backup_time', e.target.value)}
                                    className="w-full text-xs rounded-lg border-slate-200 focus:border-primary focus:ring-primary py-2"
                                />
                            </div>

                            {/* Retention Days */}
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Retention Limit (Days)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={data.backup_retention_days}
                                    onChange={e => setData('backup_retention_days', parseInt(e.target.value) || 30)}
                                    className="w-full text-xs rounded-lg border-slate-200 focus:border-primary focus:ring-primary py-2"
                                    placeholder="e.g. 30"
                                />
                                <span className="text-[10px] text-slate-400 mt-0.5 block">Old backups beyond this limit are automatically cleaned up.</span>
                            </div>

                            {/* Include Media Toggle */}
                            <div className="flex items-center justify-between pt-1">
                                <div>
                                    <span className="text-xs font-medium text-slate-700 block">Include Uploaded Media</span>
                                    <span className="text-[10px] text-slate-400">Include employee photos and document scans</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={data.include_media_files}
                                    onChange={e => setData('include_media_files', e.target.checked)}
                                    className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                                />
                            </div>

                            {/* Email Notification */}
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Notification Email (Optional)</label>
                                <input
                                    type="email"
                                    value={data.notification_email}
                                    onChange={e => setData('notification_email', e.target.value)}
                                    className="w-full text-xs rounded-lg border-slate-200 focus:border-primary focus:ring-primary py-2"
                                    placeholder="admin@earth-doha.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-primary hover:brightness-110 text-white py-2 rounded-lg text-xs font-medium transition-all shadow-md flex items-center justify-center gap-2 mt-4"
                            >
                                <FiSave className="w-3.5 h-3.5" />
                                <span>{processing ? 'Saving...' : 'Save Settings'}</span>
                            </button>

                            {recentlySuccessful && (
                                <p className="text-xs text-emerald-600 text-center font-medium">Settings saved successfully!</p>
                            )}
                        </form>
                    </div>

                    {/* Backups History Table */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">Stored Backups History</h3>
                                <p className="text-xs text-slate-400">Available backup archives stored on server</p>
                            </div>
                            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                                {backups.length} Files
                            </span>
                        </div>

                        {backups.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                                    <FiHardDrive className="w-6 h-6" />
                                </div>
                                <h4 className="text-sm font-semibold text-slate-700">No backup files created yet</h4>
                                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                    Click "Create Full Backup" above to generate your first complete system snapshot.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200/80 text-slate-500 bg-slate-50/50">
                                            <th className="py-2.5 px-3 font-semibold">Backup File</th>
                                            <th className="py-2.5 px-3 font-semibold">Type</th>
                                            <th className="py-2.5 px-3 font-semibold">Size</th>
                                            <th className="py-2.5 px-3 font-semibold">Created Date</th>
                                            <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {backups.map((backup, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 px-3 font-medium text-slate-800 flex items-center gap-2">
                                                    <span className="p-1.5 rounded bg-indigo-50 text-primary">
                                                        <FiFileText className="w-4 h-4" />
                                                    </span>
                                                    <span className="truncate max-w-xs">{backup.name}</span>
                                                </td>
                                                <td className="py-3 px-3">
                                                    {backup.type === 'full' ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Full Archive
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                            Database SQL
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{backup.size}</td>
                                                <td className="py-3 px-3 text-slate-500">{backup.created_at}</td>
                                                <td className="py-3 px-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <a
                                                            href={route('settings.backup.download', { filename: backup.name })}
                                                            className="p-1.5 text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                                                            title="Download backup file"
                                                        >
                                                            <FiDownload className="w-4 h-4" />
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteBackup(backup.name)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            title="Delete backup file"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Restore Modal */}
            <Modal show={showRestoreModal} onClose={() => setShowRestoreModal(false)} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                            <FiAlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-800">Restore System Backup</h3>
                            <p className="text-xs text-slate-500">Upload a previous .ZIP archive, .SQL dump, or .JSON file</p>
                        </div>
                    </div>

                    <form onSubmit={handleFileRestoreSubmit} className="space-y-4 pt-4">
                        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-800 text-xs flex items-start gap-2">
                            <FiAlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                                <b>Warning:</b> Restoring will overwrite existing database records and media files with data from the backup. Ensure you have a recent backup before proceeding.
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Backup File (.zip, .sql, .json) *</label>
                            <div className="relative border-2 border-dashed border-slate-200 hover:border-primary/50 transition-colors rounded-xl p-6 text-center bg-slate-50/50">
                                <input
                                    type="file"
                                    accept=".zip,.sql,.json"
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            setRestoreFile(e.target.files[0]);
                                        }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={isRestoring}
                                />
                                {restoreFile ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                                            <FiFileText className="w-5 h-5" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-800">{restoreFile.name}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{(restoreFile.size / 1024 / 1024).toFixed(2)} MB — Click to replace</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                                            <FiUpload className="w-5 h-5" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-700">Choose or drag & drop backup file</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Supports .zip, .sql, .json up to 200MB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowRestoreModal(false)}
                                className="px-4 py-2 text-xs font-normal text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                disabled={isRestoring}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!restoreFile || isRestoring}
                                className="px-5 py-2 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isRestoring ? (
                                    <>
                                        <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        Restoring System Data...
                                    </>
                                ) : (
                                    <>
                                        <FiUpload className="w-3.5 h-3.5" />
                                        Start Restore
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </SettingsLayout>
    );
}
