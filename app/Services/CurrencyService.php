<?php

namespace App\Services;

use App\Models\Setting;

/**
 * Resolves the active currency for a company/tenant.
 *
 * The currency is a tenant level setting (`settings.currency` and
 * `settings.currency_symbol`). `Setting::get()` resolves it with the
 * department -> company -> global hierarchy, so the same value the frontend
 * receives through `HandleInertiaRequests` (as `appSettings`) is used here.
 *
 * This service exists so that no server side code path (validation messages,
 * Excel exports, PDF reports, mailers) has to hardcode "INR" / "₹".
 * When the setting is missing we fall back to USD / "$".
 */
class CurrencyService
{
    public const DEFAULT_CODE = 'USD';
    public const DEFAULT_SYMBOL = '$';

    /**
     * Singular currency names, used when an amount has to be spelled out.
     *
     * @var array<string, string>
     */
    public const NAME_MAP = [
        'INR' => 'Indian Rupee',
        'QAR' => 'Qatari Riyal',
        'AED' => 'UAE Dirham',
        'SAR' => 'Saudi Riyal',
        'USD' => 'US Dollar',
        'GBP' => 'British Pound',
        'EUR' => 'Euro',
    ];

    /**
     * Currency sub-unit names, used when an amount has to be spelled out.
     *
     * @var array<string, string>
     */
    public const SUB_UNIT_MAP = [
        'INR' => 'Paisa',
        'QAR' => 'Dirham',
        'AED' => 'Fils',
        'SAR' => 'Halala',
        'USD' => 'Cent',
        'GBP' => 'Penny',
        'EUR' => 'Cent',
    ];

    /**
     * The compliance country implied by each currency.
     *
     * @var array<string, string>
     */
    public const COUNTRY_MAP = [
        'INR' => 'IN',
        'QAR' => 'QA',
        'AED' => 'AE',
        'SAR' => 'SA',
        'USD' => 'US',
        'GBP' => 'GB',
    ];

    /**
     * The currencies that can be configured, with their default symbol and
     * display name. Used to render the currency picker in the settings UI.
     *
     * @var array<string, array{symbol: string, name: string}>
     */
    public const SUPPORTED = [
        'QAR' => ['symbol' => 'QAR', 'name' => 'Qatari Riyal'],
        'INR' => ['symbol' => '₹', 'name' => 'Indian Rupee'],
        'AED' => ['symbol' => 'AED', 'name' => 'UAE Dirham'],
        'SAR' => ['symbol' => 'SAR', 'name' => 'Saudi Riyal'],
        'USD' => ['symbol' => '$', 'name' => 'US Dollar'],
        'GBP' => ['symbol' => '£', 'name' => 'British Pound'],
        'EUR' => ['symbol' => '€', 'name' => 'Euro'],
    ];

    /**
     * Normalise a currency code coming from the settings table.
     * Guards against empty strings, nulls and obviously invalid values.
     *
     * @param  mixed  $code
     */
    public static function normalizeCode($code): string
    {
        if (! is_string($code)) {
            return self::DEFAULT_CODE;
        }

        $trimmed = strtoupper(trim($code));

        if (! preg_match('/^[A-Z]{3}$/', $trimmed)) {
            return self::DEFAULT_CODE;
        }

        return $trimmed;
    }

    /**
     * Normalise a currency symbol. Symbols are free-form (e.g. "₹", "$", "QAR"),
     * so we only guard against empty/blank values.
     *
     * @param  mixed  $symbol
     */
    public static function normalizeSymbol($symbol): string
    {
        if (! is_string($symbol)) {
            return self::DEFAULT_SYMBOL;
        }

        $trimmed = trim($symbol);

        return $trimmed !== '' ? $trimmed : self::DEFAULT_SYMBOL;
    }

    /**
     * The ISO currency code configured for the given company.
     */
    public static function code($companyId = null): string
    {
        return self::normalizeCode(Setting::get('currency', self::DEFAULT_CODE, $companyId));
    }

    /**
     * The display symbol configured for the given company.
     */
    public static function symbol($companyId = null): string
    {
        return self::normalizeSymbol(Setting::get('currency_symbol', self::DEFAULT_SYMBOL, $companyId));
    }

    /**
     * A human readable label such as "QAR (QAR)" or "INR (₹)".
     */
    public static function label($companyId = null): string
    {
        return self::code($companyId) . ' (' . self::symbol($companyId) . ')';
    }

    /**
     * The singular name of the currency, e.g. "Indian Rupee" or "Qatari Riyal".
     */
    public static function name($companyId = null): string
    {
        return self::NAME_MAP[self::code($companyId)] ?? self::code($companyId);
    }

    /**
     * The name of the currency sub-unit, e.g. "Paisa" or "Dirham".
     */
    public static function subUnitName($companyId = null): string
    {
        return self::SUB_UNIT_MAP[self::code($companyId)] ?? 'Cent';
    }

    /**
     * The default compliance country implied by the configured currency.
     * Used when no explicit `app_country` has been chosen yet.
     */
    public static function defaultCountry($companyId = null): string
    {
        return self::countryForCode(self::code($companyId));
    }

    /**
     * The default compliance country implied by an explicit currency code.
     */
    public static function countryForCode($code): string
    {
        return self::COUNTRY_MAP[self::normalizeCode($code)] ?? 'QA';
    }

    /**
     * Format an amount using the tenant currency symbol.
     *
     * @param  mixed  $amount
     */
    public static function format($amount, $companyId = null, int $decimals = 2): string
    {
        $numeric = is_numeric($amount) ? (float) $amount : 0.0;

        return self::symbol($companyId) . number_format($numeric, $decimals);
    }

    /**
     * Resolve the currency for the company the currently authenticated user
     * belongs to. Falls back to the global setting when the user is not
     * linked to an employee record.
     */
    public static function forCurrentUser(): array
    {
        $companyId = null;
        $user = auth()->user();

        if ($user) {
            $companyId = $user->employee_id && $user->employee
                ? $user->employee->company_id
                : $user->company_id;
        }

        return [
            'code' => self::code($companyId),
            'symbol' => self::symbol($companyId),
            'company_id' => $companyId,
        ];
    }
}
