<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $warningLetter->subject }}</title>
    <style type="text/css">
        body {
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
        }
        table { border-collapse: collapse; }
        .wrapper {
            width: 100%;
            background-color: #f1f5f9;
            padding: 30px 10px;
        }
        .container {
            max-width: 620px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 4px 18px rgba(15, 23, 42, 0.06);
            border: 1px solid #e2e8f0;
        }
        .header {
            background: linear-gradient(135deg, #090b4e 0%, #1e1b4b 60%, #be123c 100%);
            padding: 26px 32px;
            color: #ffffff;
        }
        .header h1 {
            font-size: 19px;
            font-weight: 700;
            margin: 0;
            letter-spacing: 0.5px;
            color: #ffffff;
        }
        .header p {
            font-size: 12px;
            color: #fecdd3;
            margin: 4px 0 0;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }
        .badge-warning {
            display: inline-block;
            background-color: #ffe4e6;
            color: #be123c;
            border: 1px solid #fecdd3;
            padding: 3px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .body {
            padding: 28px 32px;
        }
        .meta-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px 18px;
            margin-bottom: 22px;
            font-size: 12px;
        }
        .content-box {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-left: 3px solid #e11d48;
            border-radius: 4px 8px 8px 4px;
            padding: 20px 22px;
            font-size: 13px;
            line-height: 1.7;
            color: #334155;
            margin-bottom: 24px;
        }
        .footer {
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
    <div class="wrapper">
        <div class="container">
            <!-- Header -->
            <div class="header">
                <table width="100%">
                    <tr>
                        <td>
                            <h1>{{ $warningLetter->company->name ?? config('app.name') }}</h1>
                            <p>Official Disciplinary Notice</p>
                        </td>
                        <td align="right" valign="middle">
                            <span class="badge-warning">{{ $warningLetter->type ?? 'Official Notice' }}</span>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Body -->
            <div class="body">
                <div class="meta-card">
                    <table width="100%">
                        <tr>
                            <td width="50%">
                                <strong style="color:#0f172a;">To:</strong> {{ $warningLetter->employee->name ?? 'Employee' }}
                                <div style="color:#64748b; font-size: 11px; margin-top: 2px;">
                                    ID: {{ $warningLetter->employee->employee_code ?? 'N/A' }} &bull; {{ $warningLetter->employee->department->name ?? ($warningLetter->employee->department ?? 'General') }}
                                </div>
                            </td>
                            <td width="50%" align="right">
                                <strong style="color:#0f172a;">Date:</strong> {{ $warningLetter->date ? \Carbon\Carbon::parse($warningLetter->date)->format('M d, Y') : now()->format('M d, Y') }}
                                <div style="color:#64748b; font-size: 11px; margin-top: 2px;">
                                    Ref: #{{ str_pad($warningLetter->id, 6, '0', STR_PAD_LEFT) }}
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>

                <h3 style="font-size: 15px; color: #0f172a; margin: 0 0 12px; font-weight: 700;">
                    Subject: {{ $warningLetter->subject }}
                </h3>

                <p style="font-size: 13px; color: #475569; margin: 0 0 14px;">
                    Dear {{ $warningLetter->employee->name ?? 'Employee' }},
                </p>

                <div class="content-box">
                    {!! nl2br(e($warningLetter->content)) !!}
                </div>

                <div style="font-size: 12px; color: #475569; line-height: 1.6; margin-top: 20px;">
                    Please acknowledge receipt of this formal communication. Should you have any questions or wish to present clarifications, please arrange a meeting with your HR representative.
                </div>

                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #334155;">
                    Sincerely,<br>
                    <strong style="color: #0f172a;">Management &amp; Human Resources</strong><br>
                    <span>{{ $warningLetter->company->name ?? config('app.name') }}</span>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p style="margin: 0 0 4px; font-weight: 600; color: #64748b;">
                    {{ $warningLetter->company->name ?? config('app.name') }} &bull; Confidential HR Document
                </p>
                <p style="margin: 0;">
                    This communication is intended solely for the named recipient and contains confidential disciplinary information.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
