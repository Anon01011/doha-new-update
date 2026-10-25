import { usePage } from '@inertiajs/react';

/**
 * Shared currency helper.
 *
 * The active currency is a company/tenant level setting (`settings.currency` and
 * `settings.currency_symbol`) which is shared with the frontend through
 * `HandleInertiaRequests` as `page.props.appSettings`.
 *
 * These helpers read that value so no screen has to hardcode "INR" / "₹".
 * When the setting is missing we fall back to USD / "$".
 */

export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_CURRENCY_SYMBOL = '$';

/**
 * The single source of truth for the configurable currencies.
 *
 * Mirrors the backend `App\Services\CurrencyService::SUPPORTED` so the
 * settings picker and the backend can never drift apart.
 *
 * The `country` value is the compliance country implied by the currency,
 * matching `CurrencyService::countryForCode()`.
 *
 * @type {Array<{ code: string, symbol: string, name: string, country: string, timezone: string }>}
 */
export const CURRENCY_CATALOG = [
    { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', country: 'QA', timezone: 'Asia/Qatar' },
    { code: 'INR', symbol: '\u20B9', name: 'Indian Rupee', country: 'IN', timezone: 'Asia/Kolkata' },
    { code: 'AED', symbol: 'AED', name: 'UAE Dirham', country: 'AE', timezone: 'Asia/Dubai' },
    { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', country: 'SA', timezone: 'Asia/Riyadh' },
    { code: 'USD', symbol: '$', name: 'US Dollar', country: 'US', timezone: 'America/New_York' },
    { code: 'GBP', symbol: '\u00A3', name: 'British Pound', country: 'GB', timezone: 'Europe/London' },
    { code: 'EUR', symbol: '\u20AC', name: 'Euro', country: 'QA', timezone: 'Europe/Berlin' },
];

/**
 * Lookup table built from {@link CURRENCY_CATALOG}, keyed by currency code.
 */
export const CURRENCY_BY_CODE = CURRENCY_CATALOG.reduce((acc, entry) => {
    acc[entry.code] = entry;
    return acc;
}, {});

/**
 * The compliance country implied by each currency.
 * Mirrors the backend `App\Services\CurrencyService::COUNTRY_MAP`.
 */
export const COUNTRY_BY_CURRENCY = {
    INR: 'IN',
    QAR: 'QA',
    AED: 'AE',
    SAR: 'SA',
    USD: 'US',
    GBP: 'GB',
};

/**
 * Singular currency names, used when an amount has to be spelled out.
 * Mirrors the backend `App\Services\CurrencyService::NAME_MAP`.
 */
export const CURRENCY_NAMES = {
    INR: 'Indian Rupee',
    QAR: 'Qatari Riyal',
    AED: 'UAE Dirham',
    SAR: 'Saudi Riyal',
    USD: 'US Dollar',
    GBP: 'British Pound',
    EUR: 'Euro',
};

/**
 * Currency sub-unit names, used when an amount has to be spelled out.
 * Mirrors the backend `App\Services\CurrencyService::SUB_UNIT_MAP`.
 */
export const CURRENCY_SUB_UNITS = {
    INR: 'Paisa',
    QAR: 'Dirham',
    AED: 'Fils',
    SAR: 'Halala',
    USD: 'Cent',
    GBP: 'Penny',
    EUR: 'Cent',
};

/**
 * Normalise a currency code coming from the settings table.
 * Guards against empty strings, nulls and obviously invalid values.
 *
 * @param {*} code
 * @returns {string}
 */
export function normalizeCurrencyCode(code) {
    if (typeof code !== 'string') return DEFAULT_CURRENCY;

    const trimmed = code.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(trimmed)) return DEFAULT_CURRENCY;

    return trimmed;
}

/**
 * Normalise a currency symbol. Symbols are free-form (e.g. "₹", "$", "QAR"),
 * so we only guard against empty/blank values.
 *
 * @param {*} symbol
 * @returns {string}
 */
export function normalizeCurrencySymbol(symbol) {
    if (typeof symbol !== 'string') return DEFAULT_CURRENCY_SYMBOL;

    const trimmed = symbol.trim();
    if (!trimmed) return DEFAULT_CURRENCY_SYMBOL;

    return trimmed;
}

/**
 * The default display symbol for a currency code.
 *
 * Returns `fallback` when the code is not part of the catalog, so callers can
 * keep a previously configured symbol instead of silently resetting it.
 *
 * @param {*} code
 * @param {string} [fallback]
 * @returns {string}
 */
export function defaultSymbolFor(code, fallback = '') {
    const entry = CURRENCY_BY_CODE[normalizeCurrencyCode(code)];

    return entry ? entry.symbol : fallback;
}

/**
 * Build a currency formatter bound to a given code/symbol.
 *
 * @param {string} code   ISO currency code, e.g. "QAR"
 * @param {string} symbol  Display symbol, e.g. "QAR"
 * @returns {(amount: number|string|null|undefined, options?: Object) => string}
 */
export function createCurrencyFormatter(code, symbol) {
    const currencyCode = normalizeCurrencyCode(code);
    const currencySymbol = normalizeCurrencySymbol(symbol);

    return function formatCurrency(amount, options = {}) {
        const {
            decimals = 2,
            locale = 'en-IN',
            withSymbol = true,
        } = options;

        const numeric = Number(amount);
        const safe = Number.isFinite(numeric) ? numeric : 0;

        const formatted = safe.toLocaleString(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });

        if (!withSymbol) return formatted;

        return `${currencySymbol}${formatted}`;
    };
}

/**
 * Resolve currency settings from a set of Inertia page props.
 * Accepts the whole props bag or just the `appSettings` slice.
 *
 * @param {Object} props
 * @returns {{ code: string, symbol: string, formatter: Function }}
 */
export function resolveCurrency(props) {
    const settings = (props && props.appSettings) || props || {};

    const code = normalizeCurrencyCode(settings.currency);
    const symbol = normalizeCurrencySymbol(settings.currency_symbol);

    return {
        code,
        symbol,
        formatter: createCurrencyFormatter(code, symbol),
    };
}

/**
 * React hook returning the active currency for the current tenant.
 * Must be called inside a component (it uses `usePage`).
 *
 * @returns {{ code: string, symbol: string, format: Function }}
 */
export function useCurrency() {
    const page = usePage();
    const { code, symbol, formatter } = resolveCurrency(page ? page.props : null);

    return {
        code,
        symbol,
        format: formatter,
    };
}

/**
 * Resolve the compliance country for a set of Inertia page props.
 * Falls back to the country implied by the configured currency when no
 * explicit `app_country` has been chosen.
 *
 * @param {Object} props
 * @returns {string}
 */
export function resolveCountry(props) {
    const settings = (props && props.appSettings) || props || {};

    if (typeof settings.app_country === 'string' && settings.app_country.trim()) {
        return settings.app_country.trim();
    }

    const { code } = resolveCurrency(settings);

    return COUNTRY_BY_CURRENCY[code] || 'QA';
}
