<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Setting;
use Carbon\Carbon;

class WhatsAppService
{
    /**
     * Send a WhatsApp notification using the configured provider.
     */
    public function sendRosterNotification($employee, $company, $employeeRoster, $dateRange)
    {
        $companyId = $company->id;
        $provider  = Setting::get('whatsapp_provider', 'custom', $companyId);
        $mobile    = $this->formatPhoneNumber($employee->mobile);

        if (empty($mobile)) {
            Log::warning("WhatsApp send skipped for employee {$employee->name} (ID: {$employee->id}): Mobile number is empty or invalid.");
            return false;
        }

        Log::info("Attempting to send WhatsApp roster to {$employee->name} ({$mobile}) via {$provider}");

        switch ($provider) {
            case 'meta':
                return $this->sendMetaTemplate($mobile, $employee, $company, $employeeRoster, $dateRange);

            case 'custom':
                return $this->sendCustomMessage($mobile, $employee, $company, $employeeRoster, $dateRange);

            default:
                Log::error("WhatsApp provider '{$provider}' not yet implemented in WhatsAppService.");
                return false;
        }
    }

    /**
     * Send message via Meta WhatsApp Business API using a template.
     *
     * Template parameters:
     *   {{1}} = Employee Name
     *   {{2}} = Date Range  (e.g. "Apr 27, 2026 - May 31, 2026")
     *   {{3}} = Company Name
     *   {{4}} = Roster Summary (compact, no newlines, ≤1024 chars)
     */
    protected function sendMetaTemplate($mobile, $employee, $company, $employeeRoster, $dateRange)
    {
        $token   = trim((string) Setting::get('whatsapp_api_token', '', $company->id));
        // In case the user accidentally pasted "Bearer " along with the token
        if (str_starts_with(strtolower($token), 'bearer ')) {
            $token = trim(substr($token, 7));
        }
        $phoneId = trim((string) Setting::get('meta_phone_number_id', '', $company->id));

        if (!$token || !$phoneId) {
            Log::error("Meta WhatsApp credentials missing for company {$company->id}");
            return false;
        }

        $url          = "https://graph.facebook.com/v21.0/{$phoneId}/messages";
        $templateName = trim((string) Setting::get('whatsapp_template_name', 'shift_roster_notification', $company->id));
        $templateLang = trim((string) Setting::get('whatsapp_template_language', 'en_US', $company->id));

        // Build the roster summary for template param {{4}}.
        // Meta rejects params with newlines/tabs/4+ consecutive spaces; max ~1024 chars.
        $rosterSummary = $this->buildMetaRosterSummary($employeeRoster);

        // DEBUG: Log the token prefix and suffix to verify the correct token is loaded
        $tokenPrefix = substr($token, 0, 5);
        $tokenSuffix = substr($token, -5);
        Log::info("DEBUG - Sending Meta WhatsApp template with token starting with {$tokenPrefix} and ending with {$tokenSuffix}");

        $response = Http::withoutVerifying()
            ->withToken($token)
            ->post($url, [
                'messaging_product' => 'whatsapp',
                'to'                => $mobile,
                'type'              => 'template',
                'template'          => [
                    'name'       => $templateName,
                    'language'   => ['code' => $templateLang],
                    'components' => [
                        [
                            'type'       => 'body',
                            'parameters' => [
                                ['type' => 'text', 'text' => $this->sanitizeTemplateParam($employee->name)],
                                ['type' => 'text', 'text' => $this->sanitizeTemplateParam($dateRange)],
                                ['type' => 'text', 'text' => $this->sanitizeTemplateParam($company->name)],
                                ['type' => 'text', 'text' => $this->sanitizeTemplateParam($rosterSummary)],
                            ],
                        ],
                    ],
                ],
            ]);

        if ($response->failed()) {
            Log::error("Meta WhatsApp API error for {$employee->name}: " . $response->body(), [
                'url'     => $url,
                'status'  => $response->status(),
                'payload' => ['to' => $mobile, 'template' => $templateName],
            ]);
            return false;
        }

        Log::info("Meta WhatsApp message sent successfully to {$employee->name}", [
            'shifts'     => count($employeeRoster),
            'date_range' => $dateRange,
        ]);
        return true;
    }

    /**
     * Build a compact roster summary for the Meta template {{4}} parameter.
     *
     * Week view  (≤ 7 shifts): "Apr 27: 8AM-5PM | Apr 28: 8AM-5PM | ..."
     * Month/range (> 7 shifts): "Wk Apr 27 (7d): 8AM-5PM | Wk May 04 (7d): 8AM-5PM | ..."
     *
     * Always a single line, no newlines, capped at 1000 chars.
     */
    protected function buildMetaRosterSummary(array $employeeRoster): string
    {
        $total = count($employeeRoster);

        if ($total === 0) {
            return 'No shifts scheduled.';
        }

        // --- Week view: show each day individually ---
        if ($total <= 7) {
            $parts = [];
            foreach ($employeeRoster as $shift) {
                $date    = Carbon::parse($shift['date'])->format('M d');
                $time    = $this->compactTime($shift['shift_time']);
                $parts[] = "{$date}: {$time}";
            }
            return implode(' | ', $parts);
        }

        // --- Month / custom range: group by week, compact summary ---
        $weeks = [];
        foreach ($employeeRoster as $shift) {
            $monday          = Carbon::parse($shift['date'])->startOfWeek(Carbon::MONDAY)->format('M d');
            $weeks[$monday][] = $shift;
        }

        $parts = [];
        foreach ($weeks as $weekOf => $shifts) {
            $count   = count($shifts);
            $times   = array_unique(array_column($shifts, 'shift_time'));
            $timeStr = implode(', ', array_map([$this, 'compactTime'], $times));
            $parts[] = "Wk {$weekOf} ({$count}d): {$timeStr}";
        }

        $summary = implode(' | ', $parts);

        // Hard cap at 1000 chars (Meta's limit is 1024; leave margin for sanitize)
        if (mb_strlen($summary) > 1000) {
            $summary = mb_substr($summary, 0, 997) . '...';
        }

        return $summary;
    }

    /**
     * Compact a shift time string for display.
     * "8:00 AM - 5:00 PM" → "8AM-5PM"
     */
    protected function compactTime(string $time): string
    {
        $time = preg_replace('/:00/', '', $time);           // "8 AM - 5 PM"
        $time = preg_replace('/\s*-\s*/', '-', $time);      // "8 AM-5 PM"
        $time = preg_replace('/\s+(AM|PM)/i', '$1', $time); // "8AM-5PM"
        return trim($time);
    }

    /**
     * Send message via Custom API (Generic POST request).
     */
    protected function sendCustomMessage($mobile, $employee, $company, $employeeRoster, $dateRange)
    {
        $url    = Setting::get('whatsapp_api_url', null, $company->id);
        $token  = Setting::get('whatsapp_api_token', null, $company->id);
        $sender = Setting::get('whatsapp_sender_number', null, $company->id);

        if (!$url || !$token) return false;

        $message = $this->buildRosterTextMessage($employee, $company, $employeeRoster, $dateRange);

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Content-Type'  => 'application/json',
        ])->post($url, [
            'to'      => $mobile,
            'from'    => $sender,
            'message' => $message,
            'type'    => 'text',
        ]);

        return $response->successful();
    }

    /**
     * Build the full text message for custom providers.
     *
     * Week view  (≤ 7 shifts): lists each shift individually.
     * Month/range (> 7 shifts): groups shifts by week for readability.
     */
    protected function buildRosterTextMessage($employee, $company, $employeeRoster, $dateRange)
    {
        $total   = count($employeeRoster);
        $message = "📅 *Your Shift Roster*\n\nHi *{$employee->name}*,\n"
                 . "Here is your shift roster for *{$dateRange}* at {$company->name}:\n\n";

        if ($total <= 7) {
            // Individual day listing for week view
            foreach ($employeeRoster as $shift) {
                $message .= "🔹 *{$shift['date']}* ({$shift['day']})\n";
                $message .= "⏰ {$shift['shift_time']}\n";
                if (!empty($shift['designation'])) {
                    $message .= "💼 {$shift['designation']}\n";
                }
                if (!empty($shift['notes']) && $shift['notes'] !== '-') {
                    $message .= "📝 {$shift['notes']}\n";
                }
                $message .= "\n";
            }
        } else {
            // Group by week for month / custom range
            $weeks = [];
            foreach ($employeeRoster as $shift) {
                $monday          = Carbon::parse($shift['date'])->startOfWeek(Carbon::MONDAY)->format('M d, Y');
                $weeks[$monday][] = $shift;
            }

            foreach ($weeks as $weekOf => $shifts) {
                $endOfWeek = Carbon::parse($weekOf)->addDays(6)->format('M d, Y');
                $message  .= "📆 *Week: {$weekOf} - {$endOfWeek}*\n";
                foreach ($shifts as $shift) {
                    $message .= "  🔹 {$shift['date']} ({$shift['day']}): {$shift['shift_time']}\n";
                }
                $message .= "\n";
            }

            $message .= "_Total: {$total} shifts_\n\n";
        }

        $message .= "Please arrive 10 mins early. Contact HR for any queries.";
        return $message;
    }

    /**
     * Sanitize a string for use as a Meta WhatsApp template parameter.
     * Meta rejects params that contain newlines, tabs, or 4+ consecutive spaces.
     */
    protected function sanitizeTemplateParam(string $value): string
    {
        $value = preg_replace('/[\r\n\t]+/', ' ', $value);
        $value = preg_replace('/ {4,}/', '   ', $value);
        return trim($value);
    }

    protected function formatPhoneNumber($number)
    {
        // Remove non-numeric characters.
        // Meta/WhatsApp requires country code prefix.
        $clean = preg_replace('/[^0-9]/', '', $number);
        return $clean;
    }

    /**
     * Send a WhatsApp loan notification to an employee.
     * Uses the "custom" provider text message approach so it doesn't
     * conflict with the Meta roster template.
     *
     * @param mixed  $employee
     * @param mixed  $company
     * @param object $loan
     * @param string $type        'disbursed' | 'installment_paid' | 'completed'
     * @param float  $installmentAmount
     */
    public function sendLoanNotification($employee, $company, $loan, string $type, float $installmentAmount = 0): bool
    {
        $mobile = $this->formatPhoneNumber($employee->mobile ?? '');

        if (empty($mobile)) {
            Log::warning("Loan WhatsApp skipped for employee {$employee->name}: no mobile.");
            return false;
        }

        $companyId = $company->id;
        $provider  = Setting::get('whatsapp_provider', 'custom', $companyId);
        $message   = $this->buildLoanTextMessage($employee, $company, $loan, $type, $installmentAmount);

        Log::info("Sending loan WhatsApp ({$type}) to {$employee->name} via {$provider}");

        switch ($provider) {
            case 'meta':
                // Meta requires a pre-approved template.
                // We fall through to custom text if no loan template exists or if it fails.
                $loanTemplateName = trim((string) Setting::get('whatsapp_loan_template_name', '', $companyId));
                if ($loanTemplateName) {
                    $success = $this->sendMetaLoanTemplate($mobile, $employee, $company, $loan, $type, $installmentAmount, $loanTemplateName);
                    if ($success) {
                        return true;
                    }
                    Log::warning("Meta loan template failed for company {$companyId}, falling back to custom message.");
                } else {
                    Log::warning("Meta loan template not configured for company {$companyId}, falling back to custom.");
                }
                return $this->sendCustomLoanMessage($mobile, $employee, $company, $message);

            case 'custom':
            default:
                return $this->sendCustomLoanMessage($mobile, $employee, $company, $message);
        }
    }

    /**
     * Build human-readable loan WhatsApp message text.
     */
    protected function buildLoanTextMessage($employee, $company, $loan, string $type, float $installmentAmount): string
    {
        $amount   = number_format($loan->amount, 2);
        $monthly  = number_format($loan->monthly_installment, 2);
        $instAmt  = number_format($installmentAmount, 2);

        switch ($type) {
            case 'disbursed':
                return "💰 *Loan Disbursed*\n\nDear *{$employee->name}*,\n\nYour loan of *{$amount}* has been successfully disbursed by *{$company->name}*.\n\n📋 Details:\n• Loan Type: {$loan->loan_type}\n• Amount: {$amount}\n• Monthly Installment: {$monthly}\n• Tenure: {$loan->tenure_months} months\n\nPlease contact HR for any queries.";

            case 'installment_paid':
                return "✅ *Installment Paid*\n\nDear *{$employee->name}*,\n\nYour loan installment of *{$instAmt}* has been marked as paid by *{$company->name}*.\n\n📋 Loan Details:\n• Loan Type: {$loan->loan_type}\n• Installment: {$instAmt}\n• Date: " . now()->format('d M Y') . "\n\nThank you! Contact HR for any queries.";

            case 'completed':
                return "🎉 *Loan Fully Repaid!*\n\nDear *{$employee->name}*,\n\nCongratulations! Your loan of *{$amount}* with *{$company->name}* has been fully repaid. All installments have been cleared.\n\nThank you for your timely payments!";

            default:
                return "Dear *{$employee->name}*, your loan status has been updated to *{$type}*. Contact HR for details.";
        }
    }

    /**
     * Send via custom API for loan messages.
     */
    protected function sendCustomLoanMessage($mobile, $employee, $company, string $message): bool
    {
        $url    = Setting::get('whatsapp_api_url', null, $company->id);
        $token  = Setting::get('whatsapp_api_token', null, $company->id);
        $sender = Setting::get('whatsapp_sender_number', null, $company->id);

        if (!$url || !$token) {
            Log::warning("Custom WhatsApp not configured for company {$company->id} – loan notification skipped.");
            return false;
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Content-Type'  => 'application/json',
        ])->post($url, [
            'to'      => $mobile,
            'from'    => $sender,
            'message' => $message,
            'type'    => 'text',
        ]);

        if (!$response->successful()) {
            Log::error("Custom WhatsApp loan message failed for {$employee->name}: " . $response->body());
            return false;
        }

        Log::info("Custom WhatsApp loan notification sent to {$employee->name}");
        return true;
    }

    /**
     * Send via Meta template for loan (if a pre-approved loan template exists).
     * Template params: {{1}} = Employee Name, {{2}} = Amount, {{3}} = Company Name, {{4}} = Details
     */
    protected function sendMetaLoanTemplate($mobile, $employee, $company, $loan, string $type, float $installmentAmount, string $templateName): bool
    {
        $token   = trim((string) Setting::get('whatsapp_api_token', '', $company->id));
        // In case the user accidentally pasted "Bearer " along with the token
        if (str_starts_with(strtolower($token), 'bearer ')) {
            $token = trim(substr($token, 7));
        }
        $phoneId = trim((string) Setting::get('meta_phone_number_id', '', $company->id));

        if (!$token || !$phoneId) {
            Log::error("Meta WhatsApp credentials missing for company {$company->id}");
            return false;
        }

        $templateLang = trim((string) Setting::get('whatsapp_loan_template_language', Setting::get('whatsapp_template_language', 'en_US', $company->id), $company->id));
        $url          = "https://graph.facebook.com/v21.0/{$phoneId}/messages";

        $details = $type === 'installment_paid'
            ? "Installment: " . number_format($installmentAmount, 2)
            : "Amount: " . number_format($loan->amount, 2) . ", Tenure: {$loan->tenure_months}m";

        $response = Http::withoutVerifying()
            ->withToken($token)
            ->post($url, [
                'messaging_product' => 'whatsapp',
                'to'                => $mobile,
                'type'              => 'template',
                'template'          => [
                    'name'       => $templateName,
                    'language'   => ['code' => $templateLang],
                    'components' => [[
                        'type'       => 'body',
                        'parameters' => [
                            ['type' => 'text', 'text' => $this->sanitizeTemplateParam($employee->name)],
                            ['type' => 'text', 'text' => $this->sanitizeTemplateParam(number_format($loan->amount, 2))],
                            ['type' => 'text', 'text' => $this->sanitizeTemplateParam($company->name)],
                            ['type' => 'text', 'text' => $this->sanitizeTemplateParam($details)],
                        ],
                    ]],
                ],
            ]);

        if ($response->failed()) {
            Log::error("Meta loan template failed for {$employee->name}: " . $response->body());
            return false;
        }

        Log::info("Meta loan template sent to {$employee->name}");
        return true;
    }
}
