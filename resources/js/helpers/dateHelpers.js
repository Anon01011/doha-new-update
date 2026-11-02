/**
 * dateHelpers.js — Centralised, timezone-safe date formatting utilities.
 *
 * ═══════════════════════════════════════════════════════════════
 * ROOT CAUSE OF THE DATE-SHIFT BUG
 * ═══════════════════════════════════════════════════════════════
 * ECMAScript spec (§21.4.1.15) treats a "date-only" ISO string such as
 * "2026-10-28" as **UTC midnight**.  In a UTC+3 or UTC+5:30 browser,
 * calling `new Date("2026-10-28").toLocaleDateString()` produces
 * "27 Oct 2026" — one day behind.
 *
 * Full ISO-8601 timestamps that include a time component
 * ("2026-10-28T21:00:00.000000Z") are parsed correctly as UTC and then
 * displayed in the browser's local timezone — which may not match the
 * app's configured timezone (e.g. Asia/Qatar UTC+3).
 *
 * ═══════════════════════════════════════════════════════════════
 * SOLUTION
 * ═══════════════════════════════════════════════════════════════
 * 1. For DATE-ONLY strings (YYYY-MM-DD): treat them as LOCAL calendar
 *    dates by appending "T00:00:00" before parsing, bypassing UTC-midnight.
 * 2. For full DATETIME strings: use `Intl.DateTimeFormat` with the app's
 *    configured `timeZone` so display always matches the server timezone,
 *    regardless of the visitor's device timezone.
 * 3. The app timezone is read from Inertia's shared `appSettings.timezone`
 *    prop (set by HandleInertiaRequests). Defaults to 'Asia/Qatar'.
 *
 * ═══════════════════════════════════════════════════════════════
 * USAGE
 * ═══════════════════════════════════════════════════════════════
 * import { formatDate, formatDateTime, formatDateShort } from '@/helpers/dateHelpers';
 *
 * // Date-only string (no shift, displays the correct calendar day):
 * formatDate('2026-10-28')                      // "28 Oct 2026"
 *
 * // UTC timestamp — displayed in app timezone:
 * formatDate('2026-10-28T21:00:00.000000Z')     // "29 Oct 2026" (UTC+3)
 *
 * // With time:
 * formatDateTime('2026-10-28T21:00:00.000000Z') // "29 Oct 2026, 12:00 AM"
 *
 * // Short date:
 * formatDateShort('2026-10-28')                 // "28 Oct"
 *
 * // Relative:
 * formatRelative('2026-10-28T21:00:00.000000Z') // "3 days ago"
 */

// ─── App timezone resolution ───────────────────────────────────────────────────

/**
 * Read the app-configured timezone from Inertia's shared props.
 * Falls back to 'Asia/Qatar' when the prop is absent.
 *
 * This is a plain function (not a hook) so it can be called outside React.
 *
 * @returns {string}  IANA timezone identifier, e.g. "Asia/Qatar"
 */
export function getAppTimezone() {
    try {
        if (typeof window !== 'undefined' && window.__inertia_app_timezone) {
            return window.__inertia_app_timezone;
        }

        // 1. Read from Inertia initial page dataset in DOM
        if (typeof document !== 'undefined') {
            const appEl = document.getElementById('app');
            if (appEl && appEl.dataset && appEl.dataset.page) {
                try {
                    const parsed = JSON.parse(appEl.dataset.page);
                    const tz = parsed.props?.appSettings?.timezone || parsed.props?.appSettings?.app_timezone;
                    if (tz) {
                        window.__inertia_app_timezone = tz;
                        return tz;
                    }
                } catch (_) {}
            }
        }

        // 2. Read from window.__page if set by Inertia
        if (typeof window !== 'undefined' && window.__page?.props?.appSettings) {
            const tz = window.__page.props.appSettings.timezone || window.__page.props.appSettings.app_timezone;
            if (tz) {
                window.__inertia_app_timezone = tz;
                return tz;
            }
        }
    } catch (_) {
        // ignore
    }
    return 'Asia/Qatar';
}

/**
 * Call this in your app bootstrap (app.jsx) and on navigation
 * so the app timezone is kept reactive to settings.
 *
 * @param {string} tz
 */
export function setAppTimezone(tz) {
    if (typeof window !== 'undefined' && tz) {
        window.__inertia_app_timezone = tz;
    }
}

// ─── Internal parser ───────────────────────────────────────────────────────────

/**
 * Parse a date/datetime string into a Date object, fixing the UTC-midnight
 * shift for date-only strings.
 *
 * @param {string|Date|null|undefined} value
 * @returns {Date|null}
 */
export function parseDate(value) {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

    const str = String(value).trim();
    if (!str) return null;

    // Date-only pattern "YYYY-MM-DD" → parse as local midnight (NOT UTC midnight)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [y, m, d] = str.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return isNaN(date.getTime()) ? null : date;
    }

    // Full ISO datetime ("T" present) → parse normally; JS handles UTC correctly.
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
}

// ─── Core formatter ───────────────────────────────────────────────────────────

/**
 * Internal: format a Date using Intl.DateTimeFormat with the app timezone.
 *
 * @param {Date} d
 * @param {Intl.DateTimeFormatOptions} options
 * @param {string|undefined} locale
 * @param {boolean} useAppTimezone  — false for date-only values (already local)
 * @returns {string}
 */
function _fmt(d, options, locale, useAppTimezone) {
    const tz = useAppTimezone ? getAppTimezone() : undefined;
    try {
        return new Intl.DateTimeFormat(locale || 'en-GB', {
            ...(tz ? { timeZone: tz } : {}),
            ...options,
        }).format(d);
    } catch (_) {
        // Fallback if IANA timezone not supported in this environment
        return d.toLocaleDateString(locale, options);
    }
}

// ─── Public formatters ────────────────────────────────────────────────────────

/**
 * Format as a date string.  Default output: "28 Oct 2026".
 *
 * Date-only strings are treated as local calendar dates (no UTC shift).
 * Datetime strings are displayed in the app's configured timezone.
 *
 * @param {string|Date|null|undefined} value
 * @param {Intl.DateTimeFormatOptions} [options]   — merged with defaults
 * @param {string} [locale]                         — e.g. 'en-GB', 'en-IN'
 * @param {string} [fallback]
 * @returns {string}
 */
export function formatDate(value, options = {}, locale = undefined, fallback = '—') {
    const d = parseDate(value);
    if (!d) return fallback;

    // Is the original value a date-only string?
    const isDateOnly = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());

    const defaultOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return _fmt(d, { ...defaultOptions, ...options }, locale, !isDateOnly);
}

/**
 * Format as a date + time string.  Default: "28 Oct 2026, 09:30 AM".
 *
 * @param {string|Date|null|undefined} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @param {string} [locale]
 * @param {string} [fallback]
 * @returns {string}
 */
export function formatDateTime(value, options = {}, locale = undefined, fallback = '—') {
    const d = parseDate(value);
    if (!d) return fallback;

    const isDateOnly = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());

    const defaultOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    };
    return _fmt(d, { ...defaultOptions, ...options }, locale, !isDateOnly);
}

/**
 * Short date without year: "28 Oct".
 *
 * @param {string|Date|null|undefined} value
 * @param {string} [locale]
 * @param {string} [fallback]
 * @returns {string}
 */
export function formatDateShort(value, locale = undefined, fallback = '—') {
    return formatDate(value, { day: '2-digit', month: 'short', year: undefined }, locale, fallback);
}

/**
 * Weekday label: "Mon", "Tuesday", "T", etc.
 *
 * @param {string|Date|null|undefined} value
 * @param {'long'|'short'|'narrow'} [style]
 * @param {string} [locale]
 * @param {string} [fallback]
 * @returns {string}
 */
export function formatWeekday(value, style = 'short', locale = undefined, fallback = '—') {
    return formatDate(value, { weekday: style, year: undefined, month: undefined, day: undefined }, locale, fallback);
}

/**
 * Month + Year: "Oct 2026".
 *
 * @param {string|Date|null|undefined} value
 * @param {string} [locale]
 * @param {string} [fallback]
 * @returns {string}
 */
export function formatMonthYear(value, locale = undefined, fallback = '—') {
    return formatDate(value, { month: 'short', year: 'numeric', day: undefined }, locale, fallback);
}

/**
 * Produce an ISO date string "YYYY-MM-DD" for use in `<input type="date">`.
 * Uses LOCAL date parts from parseDate, so date-only strings are never shifted.
 *
 * @param {string|Date|null|undefined} value
 * @param {string} [fallback]
 * @returns {string}
 */
export function toInputDate(value, fallback = '') {
    const d = parseDate(value);
    if (!d) return fallback;

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/**
 * Today as "YYYY-MM-DD" in LOCAL time.
 * Safe drop-in for `new Date().toISOString().split('T')[0]`.
 *
 * @returns {string}
 */
export function todayInputDate() {
    return toInputDate(new Date());
}

/**
 * Relative time: "3 days ago", "in 2 hours", "just now".
 * Uses native Intl.RelativeTimeFormat when available.
 *
 * @param {string|Date|null|undefined} value
 * @param {string} [locale]
 * @param {string} [fallback]
 * @returns {string}
 */
export function formatRelative(value, locale = undefined, fallback = '—') {
    const d = parseDate(value);
    if (!d) return fallback;

    const diffMs  = d.getTime() - Date.now();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHr  = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHr  / 24);
    const diffWk  = Math.round(diffDay / 7);
    const diffMon = Math.round(diffDay / 30);
    const diffYr  = Math.round(diffDay / 365);

    if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
        const rtf = new Intl.RelativeTimeFormat(locale || 'en', { numeric: 'auto' });
        if (Math.abs(diffSec) < 60)  return rtf.format(diffSec, 'second');
        if (Math.abs(diffMin) < 60)  return rtf.format(diffMin, 'minute');
        if (Math.abs(diffHr)  < 24)  return rtf.format(diffHr,  'hour');
        if (Math.abs(diffDay) < 7)   return rtf.format(diffDay, 'day');
        if (Math.abs(diffWk)  < 5)   return rtf.format(diffWk,  'week');
        if (Math.abs(diffMon) < 12)  return rtf.format(diffMon, 'month');
        return rtf.format(diffYr, 'year');
    }

    // Fallback
    if (Math.abs(diffDay) < 1)  return 'Today';
    if (diffDay === -1)         return 'Yesterday';
    if (diffDay === 1)          return 'Tomorrow';
    return formatDate(value, {}, locale, fallback);
}

/**
 * Number of calendar days between two date values.
 *
 * @param {string|Date|null|undefined} from
 * @param {string|Date|null|undefined} to
 * @returns {number}
 */
export function daysBetween(from, to) {
    const a = parseDate(from);
    const b = parseDate(to);
    if (!a || !b) return NaN;
    return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
