import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { FaChalkboardTeacher, FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaArrowLeft, FaSave, FaLayerGroup, FaShieldAlt, FaClock } from 'react-icons/fa';

export default function Create({ companies, categories }) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        category: '',
        trainer_name: '',
        duration_hours: '',
        location: '',
        start_date: '',
        end_date: '',
        max_participants: '',
        company_id: companies.length === 1 ? companies[0].id : '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('trainings.store'));
    };

    const inputClass = (field) =>
        `w-full px-3 py-2 bg-white border rounded-lg text-sm transition-all outline-none ${
            errors[field]
                ? 'border-rose-400 focus:ring-1 focus:ring-rose-400'
                : 'border-slate-200 focus:ring-1 focus:ring-primary focus:border-primary'
        }`;

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-slate-800">Create Training</h2>}>
            <Head title="Create Training" />

            <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('trainings.index')}
                            className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all border border-slate-200"
                        >
                            <FaArrowLeft size={12} />
                        </Link>
                        <div>
                            <h2 className="text-base font-normal text-slate-900">New Training</h2>
                            <p className="text-xs text-slate-400">Fill in the details below to create a training record.</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={processing}
                        className="w-full sm:w-auto px-5 py-2 bg-primary text-white rounded-lg text-sm font-normal hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaSave size={12} />}
                        {processing ? 'Saving...' : 'Save Training'}
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
                            <h3 className="text-sm font-normal text-slate-800 flex items-center gap-2">
                                <FaChalkboardTeacher size={14} className="text-primary" />
                                Training Details
                            </h3>

                            <div className="space-y-1">
                                <label className="text-sm font-normal text-slate-600">Training Title <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    className={inputClass('title')}
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Advanced Communication Skills"
                                    required
                                />
                                {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-normal text-slate-600">Description</label>
                                <textarea
                                    rows="3"
                                    className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none resize-none"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Describe the training objectives and content..."
                                />
                                {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-normal text-slate-600">Category <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <FaLayerGroup className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                                        <input
                                            type="text"
                                            list="categories-list"
                                            className={`${inputClass('category')} pl-9`}
                                            value={data.category}
                                            onChange={(e) => setData('category', e.target.value)}
                                            placeholder="Select or type a category"
                                            required
                                        />
                                        <datalist id="categories-list">
                                            {categories?.map((cat) => (
                                                <option key={cat.id} value={cat.name} />
                                            ))}
                                        </datalist>
                                    </div>
                                    {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-normal text-slate-600">Trainer Name <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <FaUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                                        <input
                                            type="text"
                                            className={`${inputClass('trainer_name')} pl-9`}
                                            value={data.trainer_name}
                                            onChange={(e) => setData('trainer_name', e.target.value)}
                                            placeholder="Enter trainer's full name"
                                            required
                                        />
                                    </div>
                                    {errors.trainer_name && <p className="text-xs text-rose-500 mt-1">{errors.trainer_name}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4 sticky top-4">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
                            <h3 className="text-sm font-normal text-slate-800 flex items-center gap-2">
                                <FaCalendarAlt size={13} className="text-slate-400" />
                                Schedule & Location
                            </h3>

                            {companies.length > 1 && (
                                <div className="space-y-1">
                                    <label className="text-sm font-normal text-slate-600">Company</label>
                                    <select
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                                        value={data.company_id}
                                        onChange={(e) => setData('company_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Select company...</option>
                                        {companies.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    {errors.company_id && <p className="text-xs text-rose-500 mt-1">{errors.company_id}</p>}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-normal text-slate-600">Start Date <span className="text-rose-500">*</span></label>
                                    <input
                                        type="date"
                                        className={inputClass('start_date')}
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        required
                                    />
                                    {errors.start_date && <p className="text-xs text-rose-500 mt-1">{errors.start_date}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-normal text-slate-600">End Date <span className="text-rose-500">*</span></label>
                                    <input
                                        type="date"
                                        className={inputClass('end_date')}
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                        min={data.start_date}
                                        required
                                    />
                                    {errors.end_date && <p className="text-xs text-rose-500 mt-1">{errors.end_date}</p>}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-normal text-slate-600">Duration (Hours) <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                                    <input
                                        type="number"
                                        step="0.5"
                                        className={`${inputClass('duration_hours')} pl-9`}
                                        value={data.duration_hours}
                                        onChange={(e) => setData('duration_hours', e.target.value)}
                                        placeholder="e.g. 8"
                                        required
                                    />
                                </div>
                                {errors.duration_hours && <p className="text-xs text-rose-500 mt-1">{errors.duration_hours}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-normal text-slate-600">Location</label>
                                <div className="relative">
                                    <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                                    <input
                                        type="text"
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                                        value={data.location}
                                        onChange={(e) => setData('location', e.target.value)}
                                        placeholder="e.g. Conference Room A"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-normal text-slate-600">Max Participants</label>
                                <div className="relative">
                                    <FaUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                                    <input
                                        type="number"
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                                        value={data.max_participants}
                                        onChange={(e) => setData('max_participants', e.target.value)}
                                        placeholder="Leave blank for unlimited"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="bg-slate-900 rounded-lg p-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-normal hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaSave size={13} />}
                                {processing ? 'Saving...' : 'Save Training'}
                            </button>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex gap-3">
                            <FaShieldAlt className="text-primary shrink-0 mt-0.5" size={14} />
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Assigned employees will be notified after the training is saved.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
