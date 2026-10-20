import { FaExclamationCircle } from 'react-icons/fa';

/**
 * Shared form primitives for the Leave Type create/edit screens.
 * Keeps field, input and switch markup identical across both pages.
 */

/** Label + control + inline validation message / hint. */
export function Field({ label, htmlFor, error, hint, required, children }) {
    return (
        <div className="space-y-2">
            <label
                htmlFor={htmlFor}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600"
            >
                {label}
                {required && <span className="text-rose-500">*</span>}
            </label>

            {children}

            {error ? (
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600">
                    <FaExclamationCircle size={11} className="flex-shrink-0" />
                    <span>{error}</span>
                </p>
            ) : hint ? (
                <p className="text-[11px] leading-relaxed text-slate-400">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

/** Shared input styling so every control in the form looks the same. */
export function inputClass(error, extra = '') {
    const base =
        'w-full rounded-xl border px-4 text-sm text-slate-900 transition placeholder:text-slate-300 ' +
        'focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';
    const state = error
        ? 'border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-100'
        : 'border-slate-200 bg-white focus:border-primary focus:ring-slate-200';

    return `${base} ${state} ${extra}`;
}

/** Accessible on/off switch used for the boolean policy rules. */
export function ToggleSwitch({ id, checked, onChange, label }) {
    return (
        <button
            type="button"
            id={id}
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 ${
                checked ? 'bg-primary' : 'bg-slate-200'
            }`}
        >
            <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    checked ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
}

/** A labelled switch row with an icon, title and supporting description. */
export function SwitchRow({
    id,
    icon,
    title,
    description,
    badge,
    checked,
    onChange,
}) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
            <div className="flex min-w-0 items-center gap-3.5">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    {icon}
                </span>
                <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                        {title}
                        {badge}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                        {description}
                    </p>
                </div>
            </div>

            <ToggleSwitch
                id={id}
                checked={checked}
                onChange={onChange}
                label={title}
            />
        </div>
    );
}

/** Card shell used for each form section. */
export function SectionCard({
    icon,
    title,
    description,
    children,
    className = '',
}) {
    return (
        <section
            className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
        >
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
                {icon && (
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        {icon}
                    </span>
                )}
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-slate-900">
                        {title}
                    </h2>
                    {description && (
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            <div className="p-6">{children}</div>
        </section>
    );
}

/** Compact label/value pair used in the live summary panel. */
export function SummaryRow({ label, value, accent = false }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <dt className="text-[11px] font-medium text-slate-400">{label}</dt>
            <dd
                className={`truncate text-right text-xs font-semibold ${accent ? 'text-primary' : 'text-slate-900'}`}
            >
                {value}
            </dd>
        </div>
    );
}
