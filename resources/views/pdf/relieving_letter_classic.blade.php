<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Relieving & Experience Certificate - {{ $employee->name }}</title>
    <style>
        @page {
            margin: 30px;
        }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 13px;
            line-height: 1.6;
            color: #1a1a1a;
            margin: 0;
            padding: 30px;
            box-sizing: border-box;
        }
        .outer-border {
            border: 3px double #1e3a8a;
            padding: 25px;
            min-height: 950px;
            box-sizing: border-box;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 12px;
            margin-bottom: 25px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .company-sub {
            font-size: 11px;
            color: #4b5563;
            margin-top: 4px;
        }
        .ref-date-row {
            width: 100%;
            margin-bottom: 20px;
        }
        .ref-no {
            float: left;
            font-size: 11px;
            color: #374151;
        }
        .date {
            float: right;
            font-size: 11px;
            font-weight: bold;
            color: #374151;
        }
        .clear {
            clear: both;
        }
        .title-box {
            text-align: center;
            margin: 25px 0 20px 0;
        }
        .cert-title {
            display: inline-block;
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #1e3a8a;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 4px;
        }
        .salutation {
            font-weight: bold;
            margin-bottom: 15px;
            font-size: 13px;
        }
        .content {
            text-align: justify;
            text-justify: inter-word;
            margin-bottom: 18px;
            font-size: 13px;
            line-height: 1.8;
        }
        .details-table {
            width: 100%;
            margin: 20px 0;
            border-collapse: collapse;
        }
        .details-table td {
            padding: 8px 12px;
            border: 1px solid #cbd5e1;
            font-size: 12px;
        }
        .details-table td.label {
            background-color: #f1f5f9;
            font-weight: bold;
            width: 38%;
            color: #1e293b;
        }
        .footer-table {
            width: 100%;
            margin-top: 50px;
        }
        .signature-box {
            width: 45%;
            text-align: center;
        }
        .signature-line {
            border-top: 1px solid #1e293b;
            margin: 50px auto 6px auto;
            width: 180px;
        }
        .seal-box {
            width: 110px;
            height: 110px;
            border: 2px dashed #94a3b8;
            border-radius: 50%;
            margin: 10px auto;
            text-align: center;
            line-height: 110px;
            color: #94a3b8;
            font-size: 10px;
            text-transform: uppercase;
        }
        .signatory-name {
            font-weight: bold;
            font-size: 13px;
            color: #0f172a;
        }
        .signatory-title {
            font-size: 11px;
            color: #475569;
        }
        .disclaimer {
            margin-top: 30px;
            font-size: 9px;
            color: #64748b;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
        }
    </style>
</head>
<body>
    <div class="outer-border">
        <div class="header">
            <div class="company-name">{{ $company->name ?? 'Company HR Department' }}</div>
            <div class="company-sub">{{ $company->address ?? 'Corporate Headquarters' }} | Email: {{ $company->email ?? 'hr@company.com' }}</div>
        </div>

        <div class="ref-date-row">
            <div class="ref-no">Ref: HR/REL/{{ ($offboarding->request_number ?? null) ?: $offboarding->id }}/{{ now()->format('Y') }}</div>
            <div class="date">Date: {{ now()->format('d F Y') }}</div>
            <div class="clear"></div>
        </div>

        <div class="salutation">TO WHOMSOEVER IT MAY CONCERN</div>

        <div class="title-box">
            <span class="cert-title">Service &amp; Relieving Certificate</span>
        </div>

        <div class="content">
            <p>
                This is to certify that <strong>{{ $employee->name }}</strong> (Employee Code: <strong>{{ $employee->employee_code ?? '-' }}</strong>) was employed with <strong>{{ $company->name ?? 'our organization' }}</strong> as a regular employee from 
                <strong>{{ $employee->joined_date ? \Carbon\Carbon::parse($employee->joined_date)->format('d F Y') : '-' }}</strong> to 
                <strong>{{ $offboarding->actual_last_working_day ? \Carbon\Carbon::parse($offboarding->actual_last_working_day)->format('d F Y') : ($offboarding->proposed_last_working_day ? \Carbon\Carbon::parse($offboarding->proposed_last_working_day)->format('d F Y') : now()->format('d F Y')) }}</strong>.
            </p>
            <p>
                At the time of {{ $employee->gender === 'female' ? 'her' : 'his' }} relieving, {{ $employee->gender === 'female' ? 'she' : 'he' }} held the substantive designation of <strong>{{ $employee->designation ?? 'Team Member' }}</strong> in the Department of <strong>{{ $employee->department->name ?? 'Operations' }}</strong>.
            </p>
        </div>

        <table class="details-table">
            <tr>
                <td class="label">Full Name of Employee</td>
                <td>{{ $employee->name }}</td>
            </tr>
            <tr>
                <td class="label">Employee Identification Number</td>
                <td>{{ $employee->employee_code ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Designation at Separation</td>
                <td>{{ $employee->designation ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Department / Division</td>
                <td>{{ $employee->department->name ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Date of Commencement</td>
                <td>{{ $employee->joined_date ? \Carbon\Carbon::parse($employee->joined_date)->format('d F Y') : '-' }}</td>
            </tr>
            <tr>
                <td class="label">Date of Separation / Relieving</td>
                <td>{{ $offboarding->actual_last_working_day ? \Carbon\Carbon::parse($offboarding->actual_last_working_day)->format('d F Y') : ($offboarding->proposed_last_working_day ? \Carbon\Carbon::parse($offboarding->proposed_last_working_day)->format('d F Y') : '-') }}</td>
            </tr>
            <tr>
                <td class="label">Mode of Separation</td>
                <td>{{ ucwords(str_replace('_', ' ', $offboarding->separation_reason ?? 'Resignation')) }}</td>
            </tr>
            <tr>
                <td class="label">Statutory &amp; Company Clearance</td>
                <td>Full &amp; Final Clearance Completed. No Pending Liabilities.</td>
            </tr>
        </table>

        <div class="content">
            <p>
                During {{ $employee->gender === 'female' ? 'her' : 'his' }} period of tenure with the organization, we found {{ $employee->gender === 'female' ? 'her' : 'him' }} to be dedicated, sincere, and professional in discharging the duties entrusted to {{ $employee->gender === 'female' ? 'her' : 'him' }}. {{ $employee->gender === 'female' ? 'Her' : 'His' }} conduct and character were exemplary throughout.
            </p>
            <p>
                {{ $employee->gender === 'female' ? 'She' : 'He' }} has been relieved from all company services and organizational responsibilities with effect from the close of business hours on the relieving date noted above. We thank {{ $employee->gender === 'female' ? 'her' : 'him' }} for {{ $employee->gender === 'female' ? 'her' : 'his' }} valuable service and extend our best wishes for future career success.
            </p>
        </div>

        <table class="footer-table">
            <tr>
                <td class="signature-box" style="text-align: left;">
                    <div style="font-size: 11px;">For <strong>{{ $company->name ?? 'The Management' }}</strong></div>
                    <div class="signature-line" style="margin-left: 0;"></div>
                    <div class="signatory-name">Authorized Signatory</div>
                    <div class="signatory-title">Human Resources &amp; Personnel Operations</div>
                </td>
                <td style="text-align: center; vertical-align: middle;">
                    <div class="seal-box">Official Seal</div>
                </td>
                <td class="signature-box" style="text-align: right;">
                    <div style="font-size: 11px;">Verified &amp; Recorded</div>
                    <div class="signature-line" style="margin-right: 0;"></div>
                    <div class="signatory-name">Head of Human Resources</div>
                    <div class="signatory-title">Executive Operations Directorate</div>
                </td>
            </tr>
        </table>

        <div class="disclaimer">
            This document is an official certificate issued by {{ $company->name ?? 'Organization' }} under authorization. Any alteration or unauthorized reproduction renders this document invalid.
        </div>
    </div>
</body>
</html>
