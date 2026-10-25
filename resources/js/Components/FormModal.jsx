import { useEffect, useRef } from 'react';

/**
 * A polished form modal used by the CRUD pages.
 *
 * Improvements over the previous inline `fixed inset-0` markup:
 *  - a gradient header with an icon badge, title and subtitle,
 *  - a scrollable body so long forms never push the actions off screen,
 *  - a sticky footer with the actions separated from the body,
 *  - Escape-to-close and background-click-to-close,
 *  - focus is moved into the dialog when it opens.
 *
 * The markup stays framework agnostic (plain React) so it can be dropped into
 * any page without pulling in extra dependencies.
 */
export default function FormModal({
    show = false,
    onClose = () => {},
    title,
    subtitle,
    icon = null,
    iconClassName = 'bg-rose-500/10 text-rose-600',
    children,
    footer = null,
    maxWidth = 'max-w-lg',
}) {
    const panelRef = useRef(null);

    // Close on Escape and move focus into the dialog when it opens.
    useEffect(() => {
        if (!show) return undefined;

        const onKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', onKeyDown);

        if (panelRef.current) {
            const focusable = panelRef.current.querySelector(
                'input:not([type="hidden"]):not([disabled]), select, textarea, button'
            );
            if (focusable) focusable.focus();
        }

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={typeof title === 'string' ? title : undefined}
                className={`my-auto flex w-full ${maxWidth} max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20`}
            >
                {/* Header */}
                <div className="relative flex items-start gap-3 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-rose-50/40 px-5 py-4">
                    {icon && (
                        <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${iconClassName}`}
                        >
                            {icon}
                        </span>
                    )}
                    <div className="min-w-0 flex-1 pt-0.5">
                        <h3 className="truncate text-base font-bold tracking-tight text-slate-900">
                            {title}
                        </h3>
                        {subtitle && (
                            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-rose-600 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
