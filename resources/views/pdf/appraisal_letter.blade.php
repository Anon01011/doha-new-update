<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Appraisal & Compensation Revision Letter - {{ $employee->name }}</title>
    <style>
        @page {
            margin: 30px 40px;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 12px;
            line-height: 1.55;
            color: #1e293b;
            margin: 0;
            padding: 0;
        }
        .header {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
        }
        .company-name {
            font-size: 20px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .company-sub {
            font-size: 10px;
            color: #64748b;
            margin-top: 4px;
        }
        .letter-title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 20px 0;
            color: #0f172a;
            padding: 6px;
            background-color: #f1f5f9;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
        }
        .meta-table {
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
        }
        .meta-table td {
            font-size: 11px;
            vertical-align: top;
        }
        .employee-info-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 20px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table td {
            padding: 4px 8px;
            font-size: 11px;
        }
        .info-label {
            width: 30%;
            font-weight: bold;
            color: #475569;
        }
        .info-value {
            width: 70%;
            color: #0f172a;
        }
        .letter-body {
            text-align: justify;
            margin-bottom: 18px;
            font-size: 12px;
            line-height: 1.6;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 18px 0;
        }
        .data-table th {
            background-color: #0f172a;
            color: #ffffff;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 7px 10px;
            text-align: left;
            border: 1px solid #0f172a;
        }
        .data-table td {
            padding: 7px 10px;
            border: 1px solid #cbd5e1;
            font-size: 11px;
        }
        .data-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            font-weight: bold;
            font-size: 10px;
            border-radius: 3px;
        }
        .badge-success {
            background-color: #dcfce7;
            color: #15803d;
        }
        .footer-section {
            margin-top: 35px;
            page-break-inside: avoid;
        }
        .signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25px;
        }
        .signature-cell {
            width: 50%;
            vertical-align: bottom;
        }
        .sig-line {
            width: 180px;
            border-top: 1px solid #475569;
            margin-top: 40px;
            margin-bottom: 5px;
        }
        .stamp-img {
            max-height: 70px;
            max-width: 120px;
        }
        .watermark {
            position: fixed;
            top: 40%;
            left: 20%;
            transform: rotate(-30deg);
            font-size: 65px;
            color: rgba(15, 23, 42, 0.04);
            font-weight: bold;
            text-transform: uppercase;
            z-index: -1000;
        }
        .terms-box {
            background-color: #fafaf9;
            border-left: 3px solid #64748b;
            padding: 8px 12px;
            margin-top: 15px;
            font-size: 10px;
            color: #475569;
        }
    </style>
</head>
<body>
    <div class="watermark">CONFIDENTIAL</div>

    <div class="header">
        <table class="header-table">
            <tr>
                <td style="width: 70%; vertical-align: middle;">
                    <div class="company-name">{{ $settings['appraisal_letter_header'] ?? ($company->name ?? config('app.name', 'HRMS')) }}</div>
                    <div class="company-sub">
                        {{ $company->address ?? 'Corporate Head Office' }} 
                        @if($company->email) | Email: {{ $company->email }} @endif 
                        @if($company->phone) | Phone: {{ $company->phone }} @endif
                    </div>
                </td>
                <td style="width: 30%; text-align: right; vertical-align: middle;">
                    @if(!empty($companyLogoPath) && file_exists($companyLogoPath))
                        <img src="{{ $companyLogoPath }}" style="max-height: 50px; max-width: 140px;">
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <table class="meta-table">
        <tr>
            <td style="width: 50%;">
                <strong>Ref:</strong> APP/{{ $evaluation->year ?? date('Y') }}/{{ str_pad($evaluation->id, 5, '0', STR_PAD_LEFT) }}<br>
                <strong>Date:</strong> {{ $evaluation->approved_at ? \Carbon\Carbon::parse($evaluation->approved_at)->format('d F Y') : now()->format('d F Y') }}
            </td>
            <td style="width: 50%; text-align: right;">
                <strong>Evaluation Cycle:</strong> {{ ucfirst($evaluation->cycle_type ?? 'Annual') }} {{ $evaluation->year ?? date('Y') }}<br>
                <strong>Status:</strong> <span class="badge badge-success">APPROVED &amp; FINALIZED</span>
            </td>
        </tr>
    </table>

    <div class="employee-info-box">
        <table class="info-table">
            <tr>
                <td class="info-label">Employee Name:</td>
                <td class="info-value"><strong>{{ $employee->name }}</strong></td>
                <td class="info-label">Employee Code:</td>
                <td class="info-value"><strong>{{ $employee->employee_code }}</strong></td>
            </tr>
            <tr>
                <td class="info-label">Department:</td>
                <td class="info-value">{{ $employee->department->name ?? 'General' }}</td>
                <td class="info-label">Branch / Company:</td>
                <td class="info-value">{{ $company->name ?? 'Headquarters' }}</td>
            </tr>
            <tr>
                <td class="info-label">Current Designation:</td>
                <td class="info-value">{{ $employee->designation ?? 'N/A' }}</td>
                <td class="info-label">Date of Joining:</td>
                <td class="info-value">{{ $employee->date_of_joining ? \Carbon\Carbon::parse($employee->date_of_joining)->format('d M Y') : 'N/A' }}</td>
            </tr>
        </table>
    </div>

    <div class="letter-title">
        LETTER OF PERFORMANCE APPRAISAL &amp; SALARY REVISION
    </div>

    <div class="letter-body">
        <p>Dear <strong>{{ $employee->name }}</strong>,</p>
        
        <p>
            Following the completion of your performance review for the <strong>{{ ucfirst($evaluation->cycle_type ?? 'Annual') }} Cycle ({{ $evaluation->year ?? date('Y') }})</strong>, the management has completed the assessment of your professional contributions, achievements, and overall standing with <strong>{{ $company->name ?? config('app.name') }}</strong>.
        </p>

        <p>
            We are pleased to formally communicate the outcome of your evaluation and commend your dedication towards the organization. Based on your performance appraisal, management has approved the following revisions:
        </p>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 35%;">Component / Attribute</th>
                <th style="width: 35%;">Evaluation Details</th>
                <th style="width: 30%;">Remarks / Outcome</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Performance Rating / Score</strong></td>
                <td>
                    @if($evaluation->overall_score)
                        <strong>{{ number_format($evaluation->overall_score, 1) }} / 5.0</strong>
                        @if($evaluation->overall_score >= 4.0) (Outstanding)
                        @elseif($evaluation->overall_score >= 3.0) (Above Standards)
                        @elseif($evaluation->overall_score >= 2.0) (Meets Expectations)
                        @else (Needs Development)
                        @endif
                    @else
                        Standard Review
                    @endif
                </td>
                <td><span class="badge badge-success">Approved</span></td>
            </tr>
            @if($evaluation->promotion_recommended && $evaluation->recommended_designation)
            <tr>
                <td><strong>Designation / Promotion</strong></td>
                <td><strong style="color: #0f172a;">{{ $evaluation->recommended_designation }}</strong></td>
                <td>Promoted from {{ $employee->designation ?? 'Previous Role' }}</td>
            </tr>
            @endif
            @if($evaluation->increment_recommended > 0 || $evaluation->increment_percentage > 0)
            <tr>
                <td><strong>Salary Increment</strong></td>
                <td>
                    @if($evaluation->increment_recommended > 0)
                        <strong>{{ $currencySymbol }}{{ number_format($evaluation->increment_recommended, 2) }}</strong> (Fixed Increment)
                    @else
                        <strong>{{ $evaluation->increment_percentage }}%</strong> (Percentage Increment)
                    @endif
                </td>
                <td>Applied to Basic Salary</td>
            </tr>
            <tr>
                <td><strong>Revised Basic Salary</strong></td>
                <td><strong style="font-size: 12px; color: #0f172a;">{{ $currencySymbol }}{{ number_format($employee->basic_salary ?? 0, 2) }}</strong> / month</td>
                <td>Effective from Appraisal Date</td>
            </tr>
            @endif
            <tr>
                <td><strong>Evaluator / Appraiser</strong></td>
                <td>{{ $evaluation->evaluator->name ?? 'Direct Supervisor' }}</td>
                <td>Appraisal Reviewed</td>
            </tr>
        </tbody>
    </table>

    <div class="letter-body">
        <p>
            {{ $settings['appraisal_letter_footer_text'] ?? 'All other terms and conditions of your employment contract remain unchanged. Please note that compensation details are strictly confidential and must not be discussed with other employees.' }}
        </p>
        <p>
            We appreciate your continued commitment and look forward to your valuable contributions in achieving new milestones with us.
        </p>
    </div>

    <div class="footer-section">
        <table class="signature-table">
            <tr>
                <td class="signature-cell">
                    @if(!empty($companyStampPath) && file_exists($companyStampPath))
                        <img src="{{ $companyStampPath }}" class="stamp-img"><br>
                    @endif
                    <div class="sig-line"></div>
                    <strong>{{ $settings['appraisal_letter_signatory_name'] ?? 'Authorized Signatory' }}</strong><br>
                    <span style="color: #64748b; font-size: 10px;">{{ $settings['appraisal_letter_signatory_title'] ?? ($company->name ?? 'Human Resources Department') }}</span>
                </td>
                <td class="signature-cell" style="text-align: right;">
                    <div style="display: inline-block; text-align: left;">
                        <div class="sig-line"></div>
                        <strong>Employee Signature / Acknowledgment</strong><br>
                        <span style="color: #64748b; font-size: 10px;">{{ $employee->name }} ({{ $employee->employee_code }})</span>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="terms-box">
        This document is an electronically generated and certified record of {{ $company->name ?? config('app.name') }}. Generated on {{ now()->format('d-m-Y H:i') }}.
    </div>
</body>
</html>
