<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Alert: Unsuccessful PIN Login</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f1f5f9;
            margin: 0;
            padding: 24px 12px;
            color: #1e293b;
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
        }
        .header {
            background: #090b4e;
            padding: 20px 24px;
            text-align: left;
        }
        .header-title {
            color: #ffffff;
            font-size: 15px;
            font-weight: 700;
            margin: 0 0 6px 0;
            letter-spacing: 0.3px;
        }
        .badge {
            display: inline-block;
            background: rgba(239, 68, 68, 0.2);
            color: #fca5a5;
            border: 1px solid rgba(239, 68, 68, 0.4);
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            padding: 3px 8px;
            border-radius: 4px;
        }
        .content {
            padding: 24px;
        }
        .greeting {
            font-size: 14px;
            font-weight: 600;
            color: #0f172a;
            margin: 0 0 10px 0;
        }
        .intro {
            font-size: 13px;
            line-height: 1.6;
            color: #475569;
            margin: 0 0 18px 0;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            margin: 0 0 18px 0;
            overflow: hidden;
        }
        .details-table td {
            padding: 8px 12px;
            font-size: 12px;
            border-bottom: 1px solid #edf2f7;
            vertical-align: middle;
        }
        .details-table tr:last-child td {
            border-bottom: none;
        }
        .label {
            color: #64748b;
            font-weight: 600;
            width: 38%;
        }
        .value {
            color: #0f172a;
            font-weight: 500;
        }
        .ip-code {
            font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            background: #e2e8f0;
            color: #0f172a;
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 11px;
        }
        .status-danger {
            color: #b91c1c;
            font-weight: 700;
        }
        .lockout-box {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-left: 3px solid #dc2626;
            border-radius: 4px;
            padding: 10px 12px;
            font-size: 12px;
            color: #991b1b;
            line-height: 1.5;
            margin: 0 0 18px 0;
        }
        .cta-container {
            text-align: center;
            margin: 20px 0 16px 0;
        }
        .cta-button {
            display: inline-block;
            background: #090b4e;
            color: #ffffff !important;
            text-decoration: none;
            padding: 9px 20px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.3px;
        }
        .notice {
            font-size: 11px;
            line-height: 1.5;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 14px;
            margin: 0;
        }
        .footer {
            background: #f8fafc;
            padding: 12px 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1 class="header-title">{{ $appName }}</h1>
        <span class="badge">Security Alert</span>
    </div>

    <div class="content">
        <p class="greeting">Dear {{ $user->name }},</p>
        <p class="intro">
            We detected an unsuccessful PIN login attempt on your account. Please review the details below:
        </p>

        <table class="details-table">
            <tr>
                <td class="label">Date & Time</td>
                <td class="value">{{ $time }}</td>
            </tr>
            <tr>
                <td class="label">IP Address</td>
                <td class="value"><span class="ip-code">{{ $ipAddress }}</span></td>
            </tr>
            <tr>
                <td class="label">Device / Browser</td>
                <td class="value">{{ $userAgent }}</td>
            </tr>
            <tr>
                <td class="label">Attempt Status</td>
                <td class="value"><span class="status-danger">{{ $statusMessage }}</span></td>
            </tr>
        </table>

        @if($isLocked)
        <div class="lockout-box">
            <strong>Account Locked:</strong> PIN authentication has been temporarily locked for 15 minutes due to consecutive failed attempts. You can still sign in using your account password.
        </div>
        @endif

        <div class="cta-container">
            <a href="{{ $securityUrl }}" class="cta-button">
                Review Account Security &rarr;
            </a>
        </div>

        <p class="notice">
            <strong>Did not attempt this?</strong> Someone may be attempting to access your account. Please sign in with your password and update your credentials immediately in <strong>Profile &rarr; Security</strong>. If this was you, no action is needed.
        </p>
    </div>

    <div class="footer">
        &copy; {{ date('Y') }} {{ $appName }} &middot; Automated Security Notification
    </div>
</div>
</body>
</html>
