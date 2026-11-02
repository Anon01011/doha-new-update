<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Shift Roster Notification</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td, p, a { font-family: Arial, sans-serif !important; }
    </style>
    <![endif]-->
    <style type="text/css">
        body {
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            color: #1e293b;
        }
        table { border-collapse: collapse; }
        img { border: 0; outline: none; text-decoration: none; }
        .email-wrapper {
            width: 100%;
            background-color: #f1f5f9;
            padding: 30px 10px;
        }
        .email-container {
            max-width: 620px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 4px 18px rgba(15, 23, 42, 0.06);
            border: 1px solid #e2e8f0;
        }
        .brand-header {
            background: linear-gradient(135deg, #090b4e 0%, #0f172a 60%, #0d9488 100%);
            padding: 26px 32px;
            color: #ffffff;
            text-align: left;
        }
        .brand-title {
            font-size: 19px;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin: 0;
            color: #ffffff;
        }
        .brand-subtitle {
            font-size: 12px;
            color: #99f6e4;
            margin: 4px 0 0;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }
        .body-card {
            padding: 28px 32px;
        }
        .emp-banner {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px 18px;
            margin-bottom: 22px;
        }
        .emp-name {
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 4px;
        }
        .emp-meta {
            font-size: 11px;
            color: #64748b;
            margin: 0;
        }
        .badge-pill {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .badge-date {
            background-color: #f0fdfa;
            color: #0d9488;
            border: 1px solid #ccfbf1;
        }
        .badge-work {
            background-color: #ecfdf5;
            color: #047857;
            border: 1px solid #a7f3d0;
        }
        .badge-off {
            background-color: #f8fafc;
            color: #64748b;
            border: 1px solid #cbd5e1;
        }
        .badge-type {
            background-color: #f1f5f9;
            color: #334155;
            font-size: 10px;
            padding: 2px 8px;
            border-radius: 6px;
        }
        .roster-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin: 16px 0 24px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
        }
        .roster-table th {
            background-color: #f8fafc;
            padding: 10px 14px;
            font-size: 11px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        .roster-table td {
            padding: 11px 14px;
            font-size: 12px;
            border-bottom: 1px solid #f1f5f9;
            color: #1e293b;
        }
        .roster-table tr:last-child td {
            border-bottom: none;
        }
        .day-name {
            font-weight: 700;
            color: #0f172a;
            font-size: 13px;
        }
        .day-date {
            font-size: 11px;
            color: #64748b;
        }
        .time-box {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-weight: 600;
            color: #0f172a;
            font-size: 12px;
        }
        .info-panel {
            background-color: #f0fdfa;
            border-left: 3px solid #0d9488;
            border-radius: 0 8px 8px 0;
            padding: 14px 18px;
            margin: 22px 0;
        }
        .info-panel-title {
            font-size: 12px;
            font-weight: 700;
            color: #0f766e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 6px;
        }
        .info-panel-list {
            margin: 0;
            padding-left: 18px;
            font-size: 12px;
            color: #134e4a;
            line-height: 1.6;
        }
        .cta-wrapper {
            text-align: center;
            margin: 24px 0 16px;
        }
        .btn-primary {
            display: inline-block;
            background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 11px 28px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.4px;
            box-shadow: 0 3px 10px rgba(13, 148, 136, 0.25);
        }
        .contact-grid {
            border-top: 1px solid #e2e8f0;
            padding-top: 18px;
            margin-top: 24px;
        }
        .footer-note {
            background-color: #f8fafc;
            padding: 18px 32px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            font-size: 11px;
            color: #94a3b8;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <!-- Header -->
            <div class="brand-header">
                <table width="100%">
                    <tr>
                        <td>
                            <h1 class="brand-title">{{ $company->name ?? config('app.name', 'Worklance') }}</h1>
                            <p class="brand-subtitle">Official Shift Roster Notification</p>
                        </td>
                        <td align="right" valign="middle">
                            <span class="badge-pill badge-date">{{ $dateRange }}</span>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Body -->
            <div class="body-card">
                <!-- Employee Summary -->
                <div class="emp-banner">
                    <table width="100%">
                        <tr>
                            <td>
                                <p class="emp-name">{{ $employee->name }}</p>
                                <p class="emp-meta">
                                    ID: <strong>{{ $employee->employee_code ?? 'N/A' }}</strong> &bull;
                                    Dept: <strong>{{ $employee->department->name ?? ($employee->department ?? 'General') }}</strong> &bull;
                                    Role: <strong>{{ $employee->designation->name ?? ($employee->designation ?? 'Staff') }}</strong>
                                </p>
                            </td>
                        </tr>
                    </table>
                </div>

                <p style="font-size: 13px; color: #475569; line-height: 1.5; margin: 0 0 14px;">
                    Please find your assigned work shift schedule for the week of <strong>{{ $dateRange }}</strong> below. Kindly verify your reporting timings.
                </p>

                <!-- Shift Table -->
                @if(!empty($roster) && count($roster) > 0)
                <table class="roster-table">
                    <thead>
                        <tr>
                            <th width="32%">Day &amp; Date</th>
                            <th width="36%">Shift Timing</th>
                            <th width="32%">Type / Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($roster as $shift)
                        @php
                            $isOff = stripos($shift['shift_time'] ?? '', 'off') !== false || ($shift['shift_type'] ?? '') === 'weekly_off';
                        @endphp
                        <tr style="{{ $isOff ? 'background-color: #fafafa;' : '' }}">
                            <td>
                                <div class="day-name">{{ $shift['day'] ?? 'N/A' }}</div>
                                <div class="day-date">{{ $shift['date'] ?? '' }}</div>
                            </td>
                            <td>
                                @if($isOff)
                                    <span class="badge-pill badge-off">Weekly Off</span>
                                @else
                                    <div class="time-box">&#128337; {{ $shift['shift_time'] ?? 'Standard' }}</div>
                                @endif
                            </td>
                            <td>
                                <span class="badge-type">{{ ucfirst(str_replace('_', ' ', $shift['shift_type'] ?? ($isOff ? 'Off' : 'Regular'))) }}</span>
                                @if(!empty($shift['notes']))
                                    <div style="font-size: 10px; color: #64748b; margin-top: 3px;">{{ $shift['notes'] }}</div>
                                @endif
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
                @else
                <div style="text-align: center; padding: 24px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; margin: 16px 0;">
                    <p style="font-size: 13px; color: #64748b; margin: 0;">No active shifts scheduled for this week.</p>
                </div>
                @endif

                <!-- Instructions / Reminders -->
                <div class="info-panel">
                    <div class="info-panel-title">Important Guidelines</div>
                    <ul class="info-panel-list">
                        <li>Please report to your duty post at least <strong>10 minutes prior</strong> to your scheduled shift time.</li>
                        <li>Maintain company dress code and carry your valid employee identification badge.</li>
                        <li>If you anticipate an unavoidable absence, notify your supervisor at the earliest convenience.</li>
                    </ul>
                </div>

                <!-- Call to action -->
                @if(config('app.url'))
                <div class="cta-wrapper">
                    <a href="{{ config('app.url') }}/shift-rosters" class="btn-primary" target="_blank">
                        View Complete Roster Online &rarr;
                    </a>
                </div>
                @endif

                <!-- Contact Grid -->
                <div class="contact-grid">
                    <table width="100%">
                        <tr>
                            <td width="50%" valign="top">
                                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Reporting Supervisor</div>
                                <div style="font-size: 12px; color: #1e293b; font-weight: 600; margin-top: 2px;">
                                    {{ $employee->reported_to ?? ($employee->reportingManager->name ?? 'Direct Manager') }}
                                </div>
                            </td>
                            <td width="50%" valign="top" align="right">
                                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">HR &amp; Operations Support</div>
                                <div style="font-size: 12px; color: #0d9488; font-weight: 600; margin-top: 2px;">
                                    {{ $company->email ?? 'hr@company.com' }}
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer-note">
                <p style="margin: 0 0 4px; font-weight: 600; color: #64748b;">
                    {{ $company->name ?? config('app.name') }} &bull; Human Resources &amp; Workforce Management
                </p>
                <p style="margin: 0;">
                    This is an automated operational notification generated by {{ config('app.name') }}. Please do not reply directly to this email.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
