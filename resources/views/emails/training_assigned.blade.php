<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Training Assignment</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 0; color: #1e293b; }
        .wrapper { max-width: 620px; margin: 30px auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 18px rgba(15,23,42,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #090b4e 0%, #0f172a 60%, #0d9488 100%); padding: 26px 32px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 19px; font-weight: 700; letter-spacing: 0.5px; }
        .header p { color: #99f6e4; margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.8px; }
        .body { padding: 28px 32px; }
        .greeting { font-size: 15px; color: #0f172a; margin-bottom: 14px; font-weight: 600; }
        .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 22px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
        .info-value { color: #0f172a; font-weight: 700; text-align: right; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #f0fdfa; color: #0d9488; border: 1px solid #ccfbf1; }
        .cta { text-align: center; margin: 26px 0 8px; }
        .cta a { display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #fff !important; padding: 11px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13px; box-shadow: 0 3px 10px rgba(13,148,136,0.25); }
        .footer { background: #f8fafc; padding: 18px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #94a3b8; font-size: 11px; margin: 0; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>Training Assignment</h1>
            <p>You have been enrolled in a new training program</p>
        </div>
        <div class="body">
            <p class="greeting">Dear <strong>{{ $assignment->employee->name ?? 'Employee' }}</strong>,</p>
            <p style="color:#475569;font-size:14px;line-height:1.6;">
                You have been assigned to the following training program. Please review the details below and make sure to attend on time.
            </p>

            <div class="info-box">
                <div class="info-row">
                    <span class="info-label">Training</span>
                    <span class="info-value">{{ $assignment->training->title ?? 'N/A' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Category</span>
                    <span class="info-value">{{ $assignment->training->category ?? 'General' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Trainer</span>
                    <span class="info-value">{{ $assignment->training->trainer_name ?? 'N/A' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Location</span>
                    <span class="info-value">{{ $assignment->training->location ?? 'Online / Virtual' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Start Date</span>
                    <span class="info-value">
                        {{ $assignment->training->start_date ? \Carbon\Carbon::parse($assignment->training->start_date)->format('d M Y') : 'N/A' }}
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">End Date</span>
                    <span class="info-value">
                        {{ $assignment->training->end_date ? \Carbon\Carbon::parse($assignment->training->end_date)->format('d M Y') : 'N/A' }}
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status</span>
                    <span class="info-value"><span class="badge">{{ ucfirst($assignment->status) }}</span></span>
                </div>
                @if($assignment->remarks)
                <div class="info-row">
                    <span class="info-label">Remarks</span>
                    <span class="info-value" style="max-width:60%;text-align:right;">{{ $assignment->remarks }}</span>
                </div>
                @endif
            </div>

            <p style="color:#475569;font-size:13px;line-height:1.6;">
                If you have any questions about this assignment, please contact your HR department or manager.
            </p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply directly to this email.</p>
            <p style="margin-top:4px;">© {{ date('Y') }} {{ $assignment->training->company->name ?? config('app.name') }}</p>
        </div>
    </div>
</body>
</html>
