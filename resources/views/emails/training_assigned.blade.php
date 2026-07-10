<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Training Assignment</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: #1e293b; padding: 28px 32px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; }
        .header p { color: #94a3b8; margin: 4px 0 0; font-size: 13px; }
        .body { padding: 32px; }
        .greeting { font-size: 15px; color: #1e293b; margin-bottom: 16px; }
        .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px 24px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
        .info-value { color: #1e293b; font-weight: 700; text-align: right; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #dbeafe; color: #1d4ed8; }
        .cta { text-align: center; margin: 28px 0 8px; }
        .cta a { display: inline-block; background: #4f46e5; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13px; }
        .footer { background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
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
