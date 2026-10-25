import { useCurrency } from '@/helpers/currency';

/**
 * Currency display helpers shared across the app.
 *
 * The tenant can configure any currency via `settings.currency` and
 * `settings.currency_symbol`. Depending on the tenant, the symbol is either a
 * glyph ("$", "\u20B9", "\u20AC") or the ISO code itself ("QAR", "AED", "SAR").
 * Rendering both side by side therefore produces redundant labels such as
 * "QAR QAR".
 *
 * These helpers collapse the code/symbol pair into a single readable token and
 * expose a reusable amount input so the symbol never overlaps the placeholder
 * or the entered value.
 */

/**
 * A single, non-redundant currency label.
 *
 * Returns the ISO code when the symbol is missing or identical to the code
 * (e.g. "QAR" / "QAR"), otherwise the symbol.
 *
 * @param {string} code
 * @param {string} symbol
 * @returns {string}
 */
export function currencyLabel(code, symbol) {
    const safeCode = (code || '').trim();
    const safeSymbol = (symbol || '').trim();

    if (!safeSymbol) return safeCode;
    if (!safeCode) return safeSymbol;
    if (safeSymbol.toUpperCase() === safeCode.toUpperCase()) return safeCode;

    return safeSymbol;
}

/**
 * A full currency caption for column headers and page descriptions, e.g.
 * "QAR" or "USD ($)".
 *
 * @param {string} code
 * @param {string} symbol
 * @returns {string}
 */
export function currencyCaption(code, symbol) {
    const safeCode = (code || '').trim();
    const safeSymbol = (symbol || '').trim();

    if (!safeSymbol) return safeCode;
    if (!safeCode) return safeSymbol;
    if (safeSymbol.toUpperCase() === safeCode.toUpperCase()) return safeCode;

    return `${safeCode} (${safeSymbol})`;
}

/**
 * Hook returning the resolved currency label/caption for the active tenant.
 *
 * @returns {{ code: string, symbol: string, label: string, caption: string, format: Function }}
 */
export function useCurrencyLabel() {
    const { code, symbol, format } = useCurrency();

    return {
        code,
        symbol,
        label: currencyLabel(code, symbol),
        caption: currencyCaption(code, symbol),
        format,
    };
}

/**
 * A currency aware amount input.
 *
 * The currency symbol is rendered in its own flex track instead of being
 * absolutely positioned over the field. This is what prevents the overlap:
 * with an absolutely positioned span the symbol sat on top of the placeholder
 * (and of the typed value) whenever the tenant used a multi-character symbol
 * such as "QAR", because the fixed `pl-*` padding was too small for it.
 *
 * Here the symbol occupies its own bordered cell, so the input always starts
 * after it no matter how long the symbol is.
 *
 * @param {Object} props
 */
export function CurrencyAmountInput({
    value,
    onChange,
    symbol,
    code,
    placeholder = '0.00',
    className = '',
    inputClassName = '',
    id,
    name,
    required = false,
    min,
    max,
    step = '0.01',
    disabled = false,
    tone = 'slate',
}) {
    const resolved = (symbol || '').trim() || (code || '').trim();

    const tones = {
        slate: {
            shell: 'border-slate-200 bg-slate-50 focus-within:border-rose-500 focus-within:ring-rose-500/20',
            badge: 'bg-slate-100/80 border-slate-200 text-slate-500',
        },
        emerald: {
            shell: 'border-emerald-100 bg-emerald-50/40 focus-within:border-emerald-500 focus-within:ring-emerald-500/20',
            badge: 'bg-emerald-100/70 border-emerald-200 text-emerald-600',
        },
        rose: {
            shell: 'border-rose-100 bg-rose-50/40 focus-within:border-rose-500 focus-within:ring-rose-500/20',
            badge: 'bg-rose-100/70 border-rose-200 text-rose-600',
        },
    };

    const t = tones[tone] || tones.slate;

    return (
        <div
            className={`flex items-stretch overflow-hidden rounded-lg border transition-all ${t.shell} ${disabled ? 'opacity-60' : ''} ${className}`}
        >
            {resolved && (
                <span
                    aria-hidden="true"
                    className={`flex shrink-0 items-center justify-center border-r px-2.5 text-[10px] font-bold uppercase tracking-wide select-none ${t.badge}`}
                >
                    {resolved}
                </span>
            )}
            <input
                id={id}
                name={name}
                type="number"
                inputMode="decimal"
                step={step}
                min={min}
                max={max}
                required={required}
                disabled={disabled}
                value={value}
                placeholder={placeholder}
                onChange={onChange}
                className={`min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-xs font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-0 ${inputClassName}`}
            />
        </div>
    );
}

/**
 * A currency prefixed input that keeps the caller's own visual language.
 *
 * Same guarantee as `CurrencyAmountInput` (the symbol lives in its own flex
 * track, so it can never overlap the placeholder or the typed value), but the
 * shell / prefix / input styling is supplied by the caller. This is used by
 * the pages that have a bespoke field design (uppercase, emerald / rose
 * tints, square corners) where the default styling would be a regression.
 *
 * @param {Object} props
 */
export function CurrencyPrefixedInput({
    value,
    onChange,
    symbol,
    code,
    placeholder = '0.00',
    className = '',
    prefixClassName = 'text-[10px] font-normal text-slate-400',
    inputClassName = '',
    inputProps = {},
}) {
    const resolved = (symbol || '').trim() || (code || '').trim();

    return (
        <div className={`flex items-stretch overflow-hidden ${className}`}>
            {resolved && (
                <span
                    aria-hidden="true"
                    className={`flex shrink-0 items-center px-3 select-none ${prefixClassName}`}
                >
                    {resolved}
                </span>
            )}
            <input
                type="number"
                step="0.01"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                {...inputProps}
                className={`min-w-0 flex-1 bg-transparent focus:outline-none focus:ring-0 ${inputClassName}`}
            />
        </div>
    );
}
