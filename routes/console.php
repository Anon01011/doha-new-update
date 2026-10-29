<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ── Daily Maintenance ────────────────────────────────────────────────────────
// Process recurring tasks (e.g. auto-generate recurring task instances)
Schedule::command('tasks:process-recurring')->dailyAt('00:30');

// Scan employee documents table for expiry alerts (EmployeeDocument model)
Schedule::command('documents:check-expiry')->dailyAt('07:00');

// Comprehensive workflow reminders:
//   - Loan installment due reminders (3 days, today)
//   - Advance repayment reminders
//   - Stale pending leave approvals (> 48h)
//   - Contract expiry reminders (7 / 14 / 30 days)
//   - Probation ending reminders (7 days)
//   - Internship ending reminders (7 days)
//   - Food handler / health card expiry (14 days)
Schedule::command('reminders:send')->dailyAt('08:00');

// Prune old database notifications (keep 90 days)
Schedule::command('model:prune', ['--model' => 'Illuminate\Notifications\DatabaseNotification'])
    ->weeklyOn(0, '02:00')
    ->withoutOverlapping();

// Clear expired password reset tokens
Schedule::command('auth:clear-resets')->weekly();
