<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Official Relieving &amp; Experience Certificate</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f1f5f9;
            margin: 0;
            padding: 20px;
            color: #334155;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #0f172a;
            color: #ffffff;
            padding: 24px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
            letter-spacing: 0.5px;
        }
        .body-content {
            padding: 24px;
            line-height: 1.6;
            font-size: 14px;
        }
        .details-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
        }
        .details-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
        }
        .details-row:last-child {
            margin-bottom: 0;
        }
        .details-label {
            color: #64748b;
            font-weight: 500;
        }
        .details-value {
            color: #0f172a;
            font-weight: 600;
        }
        .footer {
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 16px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ $company->name ?? 'Organization HR' }}</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Human Resources Directorate</p>
        </div>

        <div class="body-content">
            <p>Dear <strong>{{ $employee->name }}</strong>,</p>

            <p>
                We hope this email finds you well. As part of your formal separation process with <strong>{{ $company->name ?? 'our company' }}</strong>, please find attached your official <strong>Experience &amp; Relieving Certificate</strong>.
            </p>

            <div class="details-card">
                <div class="details-row">
                    <span class="details-label">Employee ID:</span>
                    <span class="details-value">{{ $employee->employee_code ?? '-' }}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Designation:</span>
                    <span class="details-value">{{ $employee->designation ?? '-' }}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Last Working Day:</span>
                    <span class="details-value">{{ $offboarding->actual_last_working_day ? \Carbon\Carbon::parse($offboarding->actual_last_working_day)->format('d F Y') : ($offboarding->proposed_last_working_day ? \Carbon\Carbon::parse($offboarding->proposed_last_working_day)->format('d F Y') : 'Completed') }}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Settlement Status:</span>
                    <span class="details-value" style="color: #166534;">Final Clearances Completed</span>
                </div>
            </div>

            <p>
                The attached PDF document is an authorized, official certificate for your employment records.
            </p>

            <p>
                We sincerely thank you for your contributions during your tenure with us and wish you the very best in all your future professional and personal endeavors.
            </p>

            <p style="margin-top: 24px;">
                Warm regards,<br>
                <strong>Human Resources &amp; People Operations</strong><br>
                {{ $company->name ?? config('app.name', 'HR Management System') }}
            </p>
        </div>

        <div class="footer">
            &copy; {{ date('Y') }} {{ $company->name ?? config('app.name', 'HRMS') }}. All rights reserved.
        </div>
    </div>
</body>
</html>
