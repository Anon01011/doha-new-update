<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Performance Appraisal & Salary Revision</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 0; color: #1e293b; }
        .wrapper { max-width: 620px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
        .header p { color: #94a3b8; margin: 6px 0 0; font-size: 13px; }
        .body { padding: 32px; }
        .greeting { font-size: 16px; color: #0f172a; margin-bottom: 16px; font-weight: 600; }
        .intro-text { color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
        
        .highlight-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .row:last-child { border-bottom: none; }
        .label { color: #64748b; font-weight: 600; }
        .val { color: #0f172a; font-weight: 700; text-align: right; }
        
        .badge-success { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; background: #dcfce7; color: #15803d; text-transform: uppercase; }
        .badge-score { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; background: #e0e7ff; color: #4338ca; }
        
        .cta-container { text-align: center; margin: 30px 0 10px; }
        .cta-btn { display: inline-block; background: #059669; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 2px 6px rgba(5,150,105,0.25); }
        
        .footer { background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5; }
        .sign-off { margin-top: 24px; font-size: 13px; color: #475569; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>{{ $settings['appraisal_letter_header'] ?? ($company->name ?? config('app.name', 'HRMS')) }}</h1>
            <p>Annual / Periodic Performance Appraisal & Compensation Revision</p>
        </div>
        <div class="body">
            <p class="greeting">Dear {{ $employee->name ?? 'Team Member' }},</p>
            <p class="intro-text">
                We are pleased to inform you that your performance appraisal for the <strong>{{ ucfirst($evaluation->cycle_type ?? 'Annual') }} Cycle ({{ $evaluation->year ?? date('Y') }})</strong> has been successfully reviewed and approved. We appreciate your dedication, contributions, and hard work towards achieving our organizational goals.
            </p>

            <div class="highlight-card">
                <div class="row">
                    <span class="label">Employee ID & Name:</span>
                    <span class="val">{{ $employee->employee_code ?? '' }} - {{ $employee->name ?? '' }}</span>
                </div>
                <div class="row">
                    <span class="label">Department / Branch:</span>
                    <span class="val">{{ $employee->department->name ?? 'General' }} | {{ $company->name ?? 'Main Branch' }}</span>
                </div>
                <div class="row">
                    <span class="label">Appraisal Period:</span>
                    <span class="val">{{ ucfirst($evaluation->cycle_type ?? 'Annual') }} {{ $evaluation->year ?? date('Y') }}</span>
                </div>
                @if($evaluation->overall_score)
                <div class="row">
                    <span class="label">Performance Score:</span>
                    <span class="val"><span class="badge-score">{{ $evaluation->overall_score }} / 5.0</span></span>
                </div>
                @endif

                @if($evaluation->promotion_recommended && $evaluation->recommended_designation)
                <div class="row">
                    <span class="label">Designation / Role:</span>
                    <span class="val"><strong style="color: #4338ca;">{{ $evaluation->recommended_designation }}</strong> (Promoted)</span>
                </div>
                @else
                <div class="row">
                    <span class="label">Designation / Role:</span>
                    <span class="val">{{ $employee->designation ?? 'N/A' }}</span>
                </div>
                @endif

                @if($evaluation->increment_recommended > 0 || $evaluation->increment_percentage > 0)
                <div class="row">
                    <span class="label">Salary Revision:</span>
                    <span class="val">
                        @if($evaluation->increment_recommended > 0)
                            <span class="badge-success">+{{ $currencySymbol }}{{ number_format($evaluation->increment_recommended, 2) }}</span> (Fixed)
                        @else
                            <span class="badge-success">+{{ $evaluation->increment_percentage }}%</span>
                        @endif
                    </span>
                </div>
                <div class="row">
                    <span class="label">Revised Basic Salary:</span>
                    <span class="val" style="color: #059669; font-size: 14px;">{{ $currencySymbol }}{{ number_format($employee->basic_salary ?? 0, 2) }} / month</span>
                </div>
                @endif
                <div class="row">
                    <span class="label">Status:</span>
                    <span class="val"><span class="badge-success">APPROVED & FINALIZED</span></span>
                </div>
            </div>

            <p style="color:#475569;font-size:13px;line-height:1.6;">
                {{ $settings['appraisal_letter_footer_text'] ?? 'We look forward to your continued contribution and growth with us. Your revised compensation details are updated in your employee profile.' }}
            </p>

            <div class="cta-container">
                <a href="{{ url('/evaluations/' . $evaluation->id . '/appraisal-letter') }}" class="cta-btn" target="_blank">
                    Download Official Appraisal Letter (PDF)
                </a>
            </div>

            <div class="sign-off">
                <p style="margin-bottom:4px;">Sincerely,</p>
                <strong>{{ $settings['appraisal_letter_signatory_name'] ?? 'Management & HR Team' }}</strong><br>
                <span style="color:#64748b;font-size:12px;">{{ $settings['appraisal_letter_signatory_title'] ?? ($company->name ?? config('app.name')) }}</span>
            </div>
        </div>
        <div class="footer">
            <p>This is an official communication regarding your compensation and appraisal review.</p>
            <p style="margin-top:4px;">© {{ date('Y') }} {{ $company->name ?? config('app.name') }}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
