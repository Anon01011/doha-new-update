<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use App\Models\Setting;

class SettingsController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/Index', [
            'mailSettings' => $this->getMailSettings(),
            'systemSettings' => $this->getSystemSettings(),
        ]);
    }

    public function mailSettings()
    {
        return Inertia::render('Settings/MailSettings', [
            'mailSettings' => $this->getMailSettings(),
        ]);
    }

    public function updateMailSettings(Request $request)
    {
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Unauthorized. Only Super Admin can modify mail settings.');
        }

        $request->validate([
            'mail_mailer' => 'required|in:smtp,mailgun,ses,postmark,resend,sendmail,log,array',
            'mail_host' => 'required_if:mail_mailer,smtp',
            'mail_port' => 'required_if:mail_mailer,smtp|integer|min:1|max:65535',
            'mail_username' => 'required_if:mail_mailer,smtp',
            'mail_password' => 'required_if:mail_mailer,smtp',
            'mail_encryption' => 'required_if:mail_mailer,smtp|in:tls,ssl',
            'mail_from_address' => 'required|email',
            'mail_from_name' => 'required|string|max:255',
        ]);

        try {
            $this->updateEnvironmentFile([
                'MAIL_MAILER' => $request->mail_mailer,
                'MAIL_HOST' => $request->mail_host,
                'MAIL_PORT' => $request->mail_port,
                'MAIL_USERNAME' => $request->mail_username,
                'MAIL_PASSWORD' => $request->mail_password,
                'MAIL_ENCRYPTION' => $request->mail_encryption,
                'MAIL_FROM_ADDRESS' => $request->mail_from_address,
                'MAIL_FROM_NAME' => $request->mail_from_name,
            ]);

            return back()->with('success', 'Mail settings updated successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to update mail settings: ' . $e->getMessage());
        }
    }

    public function testMailSettings(Request $request)
    {
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Unauthorized.');
        }

        $request->validate([
            'test_email' => 'required|email',
        ]);

        try {
            // Send test email
            Mail::raw('This is a test email from your application.', function ($message) use ($request) {
                $message->to($request->test_email)
                    ->subject('Test Email from ' . config('app.name'));
            });

            return response()->json([
                'success' => true,
                'message' => 'Test email sent successfully!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send test email: ' . $e->getMessage()
            ], 500);
        }
    }

    public function systemSettings()
    {
        return Inertia::render('Settings/SystemSettings', [
            'systemSettings' => $this->getSystemSettings(),
        ]);
    }

    public function updateSystemSettings(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'admin' && !$request->has('company_id')) {
            // Managers must have a company_id context for branding
            $companyId = $user->employee_id ? $user->employee->company_id : null;
        } else {
            $companyId = $request->input('company_id');
        }

        // Only Super Admin can save to .env
        $saveToEnv = $request->input('save_to_env');
        if ($saveToEnv && $user->role !== 'admin') {
            abort(403, 'Unauthorized. Only Super Admin can save settings to the environment file.');
        }

        $request->validate([
            'app_name' => 'required|string|max:255',
            'app_url' => 'required|url',
            'app_timezone' => 'required|string',
            'app_locale' => 'required|string|max:10',
            'currency' => 'required|string|max:10',
            'currency_symbol' => 'required|string|max:10',
            'logo' => 'nullable|image|mimes:png,jpg,jpeg,svg|max:2048',
            'favicon' => 'nullable|mimes:ico,png|max:512',
            'company_stamp' => 'nullable|image|mimes:png,jpg,jpeg,svg|max:2048',
            'theme_color' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'secondary_color' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'accent_color' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'app_font' => 'nullable|string|in:Inter,Roboto,Poppins,Nunito,Outfit',
        ]);

        try {
            // Handle logo upload
            if ($request->hasFile('logo')) {
                // Delete old logo if exists
                $oldLogo = Setting::get('app_logo', null, $companyId);
                if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
                    Storage::disk('public')->delete($oldLogo);
                }

                // Store new logo
                $logoPath = $request->file('logo')->store('branding', 'public');
                Setting::set('app_logo', $logoPath, 'branding', 'string', $companyId);
            }

            // Handle favicon upload
            if ($request->hasFile('favicon')) {
                // Delete old favicon if exists
                $oldFavicon = Setting::get('favicon', null, $companyId);
                if ($oldFavicon && Storage::disk('public')->exists($oldFavicon)) {
                    Storage::disk('public')->delete($oldFavicon);
                }

                // Store new favicon
                $faviconPath = $request->file('favicon')->store('branding', 'public');
                Setting::set('favicon', $faviconPath, 'branding', 'string', $companyId);
            }

            // Handle company stamp upload
            if ($request->hasFile('company_stamp')) {
                // Delete old stamp if exists
                $oldStamp = Setting::get('company_stamp', null, $companyId);
                if ($oldStamp && Storage::disk('public')->exists($oldStamp)) {
                    Storage::disk('public')->delete($oldStamp);
                }

                // Store new stamp
                $stampPath = $request->file('company_stamp')->store('branding', 'public');
                Setting::set('company_stamp', $stampPath, 'branding', 'string', $companyId);
            }

            // Store branding settings in Setting model
            Setting::set('app_name', $request->app_name, 'branding', 'string', $companyId);
            Setting::set('app_url', $request->app_url, 'branding', 'string', $companyId);
            Setting::set('app_timezone', $request->app_timezone, 'branding', 'string', $companyId);
            Setting::set('app_locale', $request->app_locale, 'branding', 'string', $companyId);
            Setting::set('currency', $request->currency, 'branding', 'string', $companyId);
            Setting::set('currency_symbol', $request->currency_symbol, 'branding', 'string', $companyId);
            Setting::set('theme_color', $request->theme_color ?: '#090b4e', 'branding', 'string', $companyId);
            Setting::set('secondary_color', $request->secondary_color ?: '#103c7f', 'branding', 'string', $companyId);
            Setting::set('accent_color', $request->accent_color ?: '#818cf8', 'branding', 'string', $companyId);
            Setting::set('app_font', $request->app_font ?: 'Inter', 'branding', 'string', $companyId);

            if ($saveToEnv === true || $saveToEnv === 'true' || $saveToEnv === '1' || $saveToEnv === 1) {
                $this->updateEnvironmentFile([
                    'APP_NAME' => $request->app_name,
                    'APP_URL' => $request->app_url,
                    'APP_TIMEZONE' => $request->app_timezone,
                    'APP_LOCALE' => $request->app_locale,
                ]);
            }

            return back()->with('success', 'System settings updated successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to update system settings: ' . $e->getMessage());
        }
    }

    public function deleteSystemLogo()
    {
        try {
            $logo = Setting::get('app_logo');
            if ($logo && Storage::disk('public')->exists($logo)) {
                Storage::disk('public')->delete($logo);
            }
            Setting::set('app_logo', null, 'branding', 'string');

            return back()->with('success', 'Logo deleted successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete logo: ' . $e->getMessage());
        }
    }

    public function deleteSystemFavicon()
    {
        try {
            $favicon = Setting::get('favicon');
            if ($favicon && Storage::disk('public')->exists($favicon)) {
                Storage::disk('public')->delete($favicon);
            }
            Setting::set('favicon', null, 'branding', 'string');

            return back()->with('success', 'Favicon deleted successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete favicon: ' . $e->getMessage());
        }
    }

    public function deleteSystemStamp()
    {
        try {
            $stamp = Setting::get('company_stamp');
            if ($stamp && Storage::disk('public')->exists($stamp)) {
                Storage::disk('public')->delete($stamp);
            }
            Setting::set('company_stamp', null, 'branding', 'string');

            return back()->with('success', 'Company stamp deleted successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete company stamp: ' . $e->getMessage());
        }
    }

    private function getMailSettings()
    {
        return [
            'mail_mailer' => env('MAIL_MAILER', 'log'),
            'mail_host' => env('MAIL_HOST', '127.0.0.1'),
            'mail_port' => env('MAIL_PORT', 2525),
            'mail_username' => env('MAIL_USERNAME', ''),
            'mail_password' => env('MAIL_PASSWORD', ''),
            'mail_encryption' => env('MAIL_ENCRYPTION', 'tls'),
            'mail_from_address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
            'mail_from_name' => env('MAIL_FROM_NAME', 'Example'),
            'has_session_settings' => false,
            'available_mailers' => [
                'smtp' => 'SMTP',
                'mailgun' => 'Mailgun',
                'ses' => 'Amazon SES',
                'postmark' => 'Postmark',
                'resend' => 'Resend',
                'sendmail' => 'Sendmail',
                'log' => 'Log (for testing)',
                'array' => 'Array (for testing)',
            ],
        ];
    }

    public function clearSessionSettings()
    {
        session()->forget('temp_mail_settings');
        session()->forget('temp_system_settings');
        return back()->with('success', 'Session settings cleared successfully!');
    }

    private function getSystemSettings()
    {
        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        return [
            'app_name' => Setting::get('app_name', env('APP_NAME', 'Laravel'), $companyId),
            'app_url' => Setting::get('app_url', env('APP_URL', 'http://localhost'), $companyId),
            'app_timezone' => Setting::get('app_timezone', env('APP_TIMEZONE', 'UTC'), $companyId),
            'app_locale' => Setting::get('app_locale', env('APP_LOCALE', 'en'), $companyId),
            'currency' => Setting::get('currency', 'QAR', $companyId),
            'currency_symbol' => Setting::get('currency_symbol', 'QAR', $companyId),
            'app_logo' => Setting::get('app_logo', null, $companyId),
            'favicon' => Setting::get('favicon', null, $companyId),
            'company_stamp' => Setting::get('company_stamp', null, $companyId),
            'theme_color' => Setting::get('theme_color', '#090b4e', $companyId),
            'secondary_color' => Setting::get('secondary_color', '#103c7f', $companyId),
            'accent_color' => Setting::get('accent_color', '#818cf8', $companyId),
            'app_font' => Setting::get('app_font', 'Inter', $companyId),
            'app_debug' => env('APP_DEBUG', false),
            'has_session_settings' => false,
            'available_timezones' => $this->getAvailableTimezones(),
            'available_locales' => [
                'en' => 'English',
                'es' => 'Spanish',
                'fr' => 'French',
                'de' => 'German',
                'ar' => 'Arabic',
            ],
        ];
    }

    private function getAvailableTimezones()
    {
        $timezones = [];
        $identifiers = timezone_identifiers_list();

        foreach ($identifiers as $identifier) {
            $timezones[$identifier] = $identifier . ' (' . $this->getTimezoneOffset($identifier) . ')';
        }

        return $timezones;
    }

    private function getTimezoneOffset($timezone)
    {
        $dateTimeZone = new \DateTimeZone($timezone);
        $dateTime = new \DateTime('now', $dateTimeZone);
        return $dateTime->format('P');
    }

    private function updateEnvironmentFile($data)
    {
        $path = base_path('.env');

        if (!File::exists($path)) {
            throw new \Exception('.env file not found');
        }

        $content = File::get($path);

        foreach ($data as $key => $value) {
            // Escape special characters in the value
            $value = str_replace('"', '\\"', $value);

            // Check if the key exists in the .env file
            if (preg_match("/^{$key}=/m", $content)) {
                // Update existing key
                $content = preg_replace("/^{$key}=.*/m", "{$key}=\"{$value}\"", $content);
            } else {
                // Add new key at the end
                $content .= "\n{$key}=\"{$value}\"";
            }
        }

        File::put($path, $content);
    }

    // ==================== Attendance Settings ====================

    public function attendanceSettings()
    {
        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        $settings = $this->getModuleSettings('attendance', $companyId);

        return Inertia::render('Settings/AttendanceSettings', [
            'settings' => $settings,
        ]);
    }

    public function updateAttendanceSettings(Request $request)
    {
        $validated = $request->validate([
            'clock_in_grace_period' => 'nullable|integer|min:0',
            'late_arrival_threshold' => 'nullable|integer|min:0',
            'early_departure_threshold' => 'nullable|integer|min:0',
            'auto_clock_out_time' => 'nullable|date_format:H:i',
            'max_break_duration' => 'nullable|integer|min:0',
            'overtime_calculation_method' => 'nullable|in:hourly,daily,weekly',
            'overtime_approval_required' => 'nullable|boolean',
            'weekend_days' => 'nullable|array',
            'company_opening_time' => 'nullable|string',
            'company_closing_time' => 'nullable|string',
            'standard_working_hours' => 'nullable|numeric|min:1|max:24',
        ]);

        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        foreach ($validated as $key => $value) {
            Setting::set($key, $value, 'attendance', $this->getSettingType($value), $companyId);
        }

        return back()->with('success', 'Attendance settings updated successfully!');
    }

    // ==================== Leave Settings ====================

    public function leaveSettings()
    {
        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        $settings = $this->getModuleSettings('leave', $companyId);

        return Inertia::render('Settings/LeaveSettings', [
            'settings' => $settings,
        ]);
    }

    public function updateLeaveSettings(Request $request)
    {
        $validated = $request->validate([
            'leave_accrual_method' => 'nullable|in:monthly,yearly,custom',
            'carry_forward_enabled' => 'nullable|boolean',
            'max_carry_forward_days' => 'nullable|integer|min:0',
            'leave_approval_workflow' => 'nullable|in:single,multi',
            'minimum_notice_period' => 'nullable|integer|min:0',
            'max_consecutive_days' => 'nullable|integer|min:0',
            'negative_balance_allowed' => 'nullable|boolean',
            'probation_leave_eligibility' => 'nullable|boolean',
        ]);

        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        foreach ($validated as $key => $value) {
            Setting::set($key, $value, 'leave', $this->getSettingType($value), $companyId);
        }

        return back()->with('success', 'Leave settings updated successfully!');
    }

    // ==================== Payroll Settings ====================

    public function payrollSettings()
    {
        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        $settings = $this->getModuleSettings('payroll', $companyId);

        return Inertia::render('Settings/PayrollSettings', [
            'settings' => $settings,
        ]);
    }

    public function updatePayrollSettings(Request $request)
    {
        $validated = $request->validate([
            'pay_period' => 'nullable|in:weekly,bi-weekly,monthly',
            'salary_calculation_method' => 'nullable|in:attendance,fixed',
            'overtime_rate_multiplier' => 'nullable|numeric|min:0',
            'payroll_overtime_rate' => 'nullable|numeric|min:0',
            'default_working_hours_per_day' => 'nullable|integer|min:0',
            'default_working_days_per_month' => 'nullable|integer|min:0',
            'loan_deduction_priority' => 'nullable|integer|min:1',
            'advance_deduction_priority' => 'nullable|integer|min:1',
            'tax_calculation_method' => 'nullable|in:percentage,slab',
            'tax_percentage' => 'nullable|numeric|min:0|max:100',
            'provident_fund_percentage' => 'nullable|numeric|min:0|max:100',
            'salary_slip_template' => 'nullable|string',
            'salary_slip_stamp' => 'nullable|image|mimes:png,jpg,jpeg,svg|max:2048',
            'salary_slip_show_photo' => 'nullable|boolean',
            'salary_slip_show_charts' => 'nullable|boolean',
            'payment_methods' => 'nullable|string',
            'default_payment_method' => 'nullable|string',
        ]);

        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        if ($request->hasFile('salary_slip_stamp')) {
            $oldStamp = Setting::get('salary_slip_stamp', null, $companyId);
            if ($oldStamp && \Illuminate\Support\Facades\Storage::disk('public')->exists($oldStamp)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldStamp);
            }
            $stampPath = $request->file('salary_slip_stamp')->store('branding', 'public');
            Setting::set('salary_slip_stamp', $stampPath, 'payroll', 'string', $companyId);
            unset($validated['salary_slip_stamp']);
        }

        foreach ($validated as $key => $value) {
            Setting::set($key, $value, 'payroll', $this->getSettingType($value), $companyId);
        }

        return back()->with('success', 'Payroll settings updated successfully!');
    }

    // ==================== Training Settings ====================

    public function trainingSettings()
    {
        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        $settings = $this->getModuleSettings('training', $companyId);

        return Inertia::render('Settings/TrainingSettings', [
            'settings' => $settings,
        ]);
    }

    public function updateTrainingSettings(Request $request)
    {
        $validated = $request->validate([
            'certificate_auto_generation' => 'nullable|boolean',
            'minimum_attendance_percentage' => 'nullable|integer|min:0|max:100',
            'evaluation_required' => 'nullable|boolean',
            'passing_score_percentage' => 'nullable|integer|min:0|max:100',
            'certificate_validity_months' => 'nullable|integer|min:0',
            'expiry_reminder_days' => 'nullable|integer|min:0',
            'assignment_notification' => 'nullable|boolean',
            'session_reminder_hours' => 'nullable|integer|min:0',
        ]);

        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        foreach ($validated as $key => $value) {
            Setting::set($key, $value, 'training', $this->getSettingType($value), $companyId);
        }

        return back()->with('success', 'Training settings updated successfully!');
    }

    // ==================== Task Settings ====================

    public function taskSettings()
    {
        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        $settings = $this->getModuleSettings('task', $companyId);

        return Inertia::render('Settings/TaskSettings', [
            'settings' => $settings,
        ]);
    }

    public function updateTaskSettings(Request $request)
    {
        $validated = $request->validate([
            'default_task_priority' => 'nullable|in:low,medium,high,urgent',
            'auto_assignment_enabled' => 'nullable|boolean',
            'task_overdue_notification' => 'nullable|boolean',
            'reminder_days_before_due' => 'nullable|integer|min:0',
            'allow_task_rejection' => 'nullable|boolean',
            'require_completion_notes' => 'nullable|boolean',
            'time_tracking_mandatory' => 'nullable|boolean',
            'subtask_inherit_priority' => 'nullable|boolean',
        ]);

        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        foreach ($validated as $key => $value) {
            Setting::set($key, $value, 'task', $this->getSettingType($value), $companyId);
        }

        return back()->with('success', 'Task settings updated successfully!');
    }

    // ==================== Project Settings ====================

    public function projectSettings()
    {
        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        $settings = $this->getModuleSettings('project', $companyId);

        return Inertia::render('Settings/ProjectSettings', [
            'settings' => $settings,
        ]);
    }

    public function updateProjectSettings(Request $request)
    {
        $validated = $request->validate([
            'default_visibility' => 'nullable|in:public,private',
            'budget_tracking_enabled' => 'nullable|boolean',
            'budget_alert_threshold' => 'nullable|integer|min:0|max:100',
            'milestone_notifications' => 'nullable|boolean',
            'completion_requires_all_tasks' => 'nullable|boolean',
            'project_time_tracking' => 'nullable|boolean',
            'default_member_role' => 'nullable|in:member,viewer,lead',
        ]);

        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        foreach ($validated as $key => $value) {
            Setting::set($key, $value, 'project', $this->getSettingType($value), $companyId);
        }

        return back()->with('success', 'Project settings updated successfully!');
    }

    // ==================== Grievance Settings ====================

    public function grievanceSettings()
    {
        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        $settings = $this->getModuleSettings('grievance', $companyId);

        return Inertia::render('Settings/GrievanceSettings', [
            'settings' => $settings,
        ]);
    }

    public function updateGrievanceSettings(Request $request)
    {
        $validated = $request->validate([
            'response_sla_hours' => 'nullable|integer|min:0',
            'escalation_enabled' => 'nullable|boolean',
            'escalation_after_hours' => 'nullable|integer|min:0',
            'anonymous_submission_allowed' => 'nullable|boolean',
            'require_evidence_attachment' => 'nullable|boolean',
            'auto_close_after_days' => 'nullable|integer|min:0',
            'notify_on_status_change' => 'nullable|boolean',
            'warning_letter_types' => 'nullable|array',
            'warning_letter_types.*' => 'string|distinct|max:255',
            'grievance_categories' => 'nullable|array',
            'grievance_categories.*' => 'string|distinct|max:255',
        ]);

        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        foreach ($validated as $key => $value) {
            Setting::set($key, $value, 'grievance', $this->getSettingType($value), $companyId);
        }

        return back()->with('success', 'Grievance settings updated successfully!');
    }

    // ==================== Document Settings ====================

    public function documentSettings()
    {
        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        $settings = $this->getModuleSettings('document', $companyId);

        return Inertia::render('Settings/DocumentSettings', [
            'settings' => $settings,
        ]);
    }

    public function updateDocumentSettings(Request $request)
    {
        $validated = $request->validate([
            'expiry_notification_days' => 'nullable|integer|min:0',
            'second_reminder_days' => 'nullable|integer|min:0',
            'retention_period_years' => 'nullable|integer|min:0',
            'require_verification' => 'nullable|boolean',
            'max_file_size_mb' => 'nullable|integer|min:1',
            'allowed_file_types' => 'nullable|array',
            'auto_archive_expired' => 'nullable|boolean',
        ]);

        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        foreach ($validated as $key => $value) {
            Setting::set($key, $value, 'document', $this->getSettingType($value), $companyId);
        }

        return back()->with('success', 'Document settings updated successfully!');
    }

    // ==================== Loan Settings ====================

    public function loanSettings()
    {
        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        $settings = $this->getModuleSettings('loan', $companyId);

        return Inertia::render('Settings/LoanSettings', [
            'settings' => $settings,
        ]);
    }

    public function updateLoanSettings(Request $request)
    {
        $validated = $request->validate([
            'max_loan_amount' => 'nullable|numeric|min:0',
            'maximum_active_loans' => 'nullable|integer|min:0',
            'interest_rate_default' => 'nullable|numeric|min:0|max:100',
            'max_tenure_months' => 'nullable|integer|min:1',
            'approval_workflow_level' => 'nullable|integer|min:1',
        ]);

        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        foreach ($validated as $key => $value) {
            Setting::set($key, $value, 'loan', $this->getSettingType($value), $companyId);
        }

        return back()->with('success', 'Loan settings updated successfully!');
    }

    // ==================== Employee Settings ====================

    public function employeeSettings()
    {
        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        $settings = $this->getModuleSettings('employee', $companyId);

        return Inertia::render('Settings/EmployeeSettings', [
            'settings' => $settings,
        ]);
    }

    public function updateEmployeeSettings(Request $request)
    {
        $validated = $request->validate([
            'employee_code_prefix' => 'nullable|string|max:10',
            'default_probation_months' => 'nullable|integer|min:0',
            'retirement_age' => 'nullable|integer|min:0',
            'allow_duplicate_mobile' => 'nullable|boolean',
            'allow_duplicate_email' => 'nullable|boolean',
        ]);

        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        foreach ($validated as $key => $value) {
            Setting::set($key, $value, 'employee', $this->getSettingType($value), $companyId);
        }

        return back()->with('success', 'Employee settings updated successfully!');
    }

    // ==================== Integration Settings ====================

    public function integrationSettings()
    {
        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        $settings = $this->getModuleSettings('integration', $companyId);

        return Inertia::render('Settings/IntegrationSettings', [
            'settings' => $settings,
        ]);
    }

    public function updateIntegrationSettings(Request $request)
    {
        $validated = $request->validate([
            'roster_send_email'    => 'nullable|boolean',
            'roster_send_whatsapp' => 'nullable|boolean',
            'roster_send_sms'      => 'nullable|boolean',
            'loan_send_email'      => 'nullable|boolean',
            'loan_send_whatsapp'   => 'nullable|boolean',
            'loan_send_sms'        => 'nullable|boolean',
            'whatsapp_provider' => 'nullable|string|in:custom,twilio,vonage,infobip,messagebird,plivo,meta',
            'whatsapp_api_url' => 'nullable|string|max:255',
            'whatsapp_api_token' => 'nullable|string|max:2000',
            'whatsapp_sender_number' => 'nullable|string|max:255',
            'meta_phone_number_id' => 'nullable|string|max:255',
            'meta_waba_id' => 'nullable|string|max:255',
            'whatsapp_template_name' => 'nullable|string|max:255',
            'whatsapp_loan_template_name' => 'nullable|string|max:255',
            'whatsapp_template_language' => 'nullable|string|max:255',
            'whatsapp_loan_template_language' => 'nullable|string|max:255',
            
            'sms_provider' => 'nullable|string|in:custom,twilio,vonage,infobip,messagebird,plivo',
            'sms_api_url' => 'nullable|string|max:255',
            'sms_api_token' => 'nullable|string|max:1000',
            'sms_sender_id' => 'nullable|string|max:255',
            'sms_template_roster' => 'nullable|string|max:2000',
            'sms_template_id_roster' => 'nullable|string|max:255',
            'sms_template_loan' => 'nullable|string|max:2000',
            'sms_template_id_loan' => 'nullable|string|max:255',
            
            // Twilio
            'twilio_sid' => 'nullable|string|max:255',
            'twilio_token' => 'nullable|string|max:1000',
            'twilio_sms_from' => 'nullable|string|max:255',
            'twilio_whatsapp_from' => 'nullable|string|max:255',

            // Vonage
            'vonage_api_key' => 'nullable|string|max:255',
            'vonage_api_secret' => 'nullable|string|max:1000',
            'vonage_sms_from' => 'nullable|string|max:255',
            'vonage_whatsapp_from' => 'nullable|string|max:255',

            // InfoBip
            'infobip_base_url' => 'nullable|string|max:255',
            'infobip_api_key' => 'nullable|string|max:1000',
            'infobip_sms_from' => 'nullable|string|max:255',
            'infobip_whatsapp_from' => 'nullable|string|max:255',

            // MessageBird
            'messagebird_access_key' => 'nullable|string|max:1000',
            'messagebird_sms_from' => 'nullable|string|max:255',
            'messagebird_whatsapp_from' => 'nullable|string|max:255',

            // Plivo
            'plivo_auth_id' => 'nullable|string|max:255',
            'plivo_auth_token' => 'nullable|string|max:1000',
            'plivo_sms_from' => 'nullable|string|max:255',
            'plivo_whatsapp_from' => 'nullable|string|max:255',
        ]);

        $user = auth()->user();
        $companyId = $user->employee_id ? $user->employee->company_id : null;

        foreach ($validated as $key => $value) {
            Setting::set($key, $value, 'integration', $this->getSettingType($value), $companyId);
        }

        return back()->with('success', 'Integration settings updated successfully!');
    }

    // ==================== Helper Methods ====================

    /**
     * Get all settings for a specific module/category.
     */
    private function getModuleSettings($category, $companyId = null)
    {
        $query = Setting::byCategory($category);

        if ($companyId !== null) {
            $query->where('company_id', $companyId);
        } else {
            $query->whereNull('company_id');
        }

        $settings = $query->get();

        // Convert to key-value array with typed values
        $result = [];
        /** @var \App\Models\Setting $setting */
        foreach ($settings as $setting) {
            $result[$setting->key] = $setting->getValue();
        }

        return $result;
    }

    /**
     * Determine the setting type based on value.
     */
    private function getSettingType($value)
    {
        if (is_bool($value)) {
            return 'boolean';
        }
        if (is_numeric($value)) {
            return 'number';
        }
        if (is_array($value)) {
            return 'json';
        }
        return 'string';
    }
}
