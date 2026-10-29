<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Relieving Certificate - {{ $employee->name }}</title>
    <style>
        @page {
            margin: 25px;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #334155;
            margin: 0;
            padding: 30px;
        }
        .header-bar {
            height: 6px;
            background: #0284c7;
            margin-bottom: 25px;
            border-radius: 3px;
        }
        .header-table {
            width: 100%;
            margin-bottom: 25px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 15px;
        }
        .brand-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
        }
        .brand-subtitle {
            font-size: 11px;
            color: #64748b;
            margin-top: 3px;
        }
        .meta-right {
            text-align: right;
            font-size: 11px;
            color: #64748b;
        }
        .badge {
            display: inline-block;
            padding: 4px 10px;
            background-color: #f0fdf4;
            color: #166534;
            border: 1px solid #bbf7d0;
            border-radius: 12px;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
        }
        .doc-title {
            text-align: center;
            font-size: 16px;
            font-weight: 700;
            color: #0369a1;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 25px 0 15px 0;
        }
        .intro-lead {
            font-size: 13px;
            font-weight: 500;
            color: #1e293b;
            margin-bottom: 15px;
        }
        .statement-card {
            background-color: #f8fafc;
            border-left: 4px solid #0284c7;
            padding: 14px 18px;
            margin: 15px 0 25px 0;
            border-radius: 0 8px 8px 0;
            font-size: 12.5px;
            line-height: 1.7;
            color: #1e293b;
        }
        .grid-table {
            width: 100%;
            margin: 20px 0;
            border-collapse: separate;
            border-spacing: 0;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }
        .grid-table td {
            padding: 10px 14px;
            border-bottom: 1px solid #f1f5f9;
        }
        .grid-table tr:last-child td {
            border-bottom: none;
        }
        .grid-table td.label-col {
            width: 35%;
            background-color: #f8fafc;
            font-weight: 600;
            color: #475569;
            border-right: 1px solid #e2e8f0;
        }
        .grid-table td.value-col {
            font-weight: 500;
            color: #0f172a;
        }
        .closing-text {
            margin: 20px 0;
            line-height: 1.7;
            text-align: justify;
        }
        .footer-table {
            width: 100%;
            margin-top: 45px;
            border-top: 1px solid #f1f5f9;
            padding-top: 25px;
        }
        .sig-block {
            width: 50%;
        }
        .sig-line {
            width: 180px;
            height: 1px;
            background-color: #94a3b8;
            margin: 40px 0 6px 0;
        }
        .sig-name {
            font-weight: 700;
            color: #0f172a;
            font-size: 12px;
        }
        .sig-role {
            font-size: 10.5px;
            color: #64748b;
        }
        .security-footer {
            margin-top: 35px;
            padding: 10px;
            background-color: #f8fafc;
            border-radius: 6px;
            font-size: 9.5px;
            color: #64748b;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header-bar"></div>

    <table class="header-table">
        <tr>
            <td>
                <div class="brand-title">{{ $company->name ?? 'Organization HR' }}</div>
                <div class="brand-subtitle">{{ $company->address ?? 'Corporate Offices' }} &bull; {{ $company->email ?? 'hr@company.com' }}</div>
            </td>
            <td class="meta-right">
                <span class="badge">Official Certificate</span>
                <div style="margin-top: 6px; font-weight: 600; color: #1e293b;">Ref: HR/REL/{{ ($offboarding->request_number ?? null) ?: $offboarding->id }}</div>
                <div style="margin-top: 2px;">Issued on {{ now()->format('d M, Y') }}</div>
            </td>
        </tr>
    </table>

    <div class="doc-title">Certificate of Relieving &amp; Service Experience</div>

    <div class="intro-lead">
        To Whom It May Concern,
    </div>

    <div class="statement-card">
        This document serves to certify that <strong>{{ $employee->name }}</strong> was officially engaged in full-time professional service with <strong>{{ $company->name ?? 'our company' }}</strong> from <strong>{{ $employee->joined_date ? \Carbon\Carbon::parse($employee->joined_date)->format('d F Y') : '-' }}</strong> through <strong>{{ $offboarding->actual_last_working_day ? \Carbon\Carbon::parse($offboarding->actual_last_working_day)->format('d F Y') : ($offboarding->proposed_last_working_day ? \Carbon\Carbon::parse($offboarding->proposed_last_working_day)->format('d F Y') : now()->format('d F Y')) }}</strong>.
    </div>

    <table class="grid-table">
        <tr>
            <td class="label-col">Employee Name</td>
            <td class="value-col">{{ $employee->name }}</td>
        </tr>
        <tr>
            <td class="label-col">Employee ID</td>
            <td class="value-col">{{ $employee->employee_code ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label-col">Final Designation</td>
            <td class="value-col">{{ $employee->designation ?? 'Professional' }}</td>
        </tr>
        <tr>
            <td class="label-col">Department / Business Unit</td>
            <td class="value-col">{{ $employee->department->name ?? 'Corporate Operations' }}</td>
        </tr>
        <tr>
            <td class="label-col">Tenure Duration</td>
            <td class="value-col">
                {{ $employee->joined_date ? \Carbon\Carbon::parse($employee->joined_date)->format('d M Y') : '-' }} to {{ $offboarding->actual_last_working_day ? \Carbon\Carbon::parse($offboarding->actual_last_working_day)->format('d M Y') : ($offboarding->proposed_last_working_day ? \Carbon\Carbon::parse($offboarding->proposed_last_working_day)->format('d M Y') : '-') }}
            </td>
        </tr>
        <tr>
            <td class="label-col">Separation Reason</td>
            <td class="value-col">{{ ucwords(str_replace('_', ' ', $offboarding->separation_reason ?? 'Formal Resignation')) }}</td>
        </tr>
        <tr>
            <td class="label-col">Organizational Clearances</td>
            <td class="value-col">Full and Final Settlement Cleared &bull; Company Assets Handed Over</td>
        </tr>
    </table>

    <div class="closing-text">
        <p>
            During {{ $employee->gender === 'female' ? 'her' : 'his' }} tenure with us, {{ $employee->name }} consistently demonstrated professional diligence, accountability, and strong workplace values. {{ $employee->gender === 'female' ? 'Her' : 'His' }} performance and interpersonal relations with colleagues and management were commendable throughout.
        </p>
        <p>
            {{ $employee->gender === 'female' ? 'She' : 'He' }} stands officially relieved of all operational and statutory responsibilities from {{ $company->name ?? 'our company' }} as of the closing hours of {{ $employee->gender === 'female' ? 'her' : 'his' }} final working day. We record our sincere gratitude for {{ $employee->gender === 'female' ? 'her' : 'his' }} service and wish {{ $employee->gender === 'female' ? 'her' : 'him' }} the very best in all forthcoming career pursuits.
        </p>
    </div>

    <table class="footer-table">
        <tr>
            <td class="sig-block">
                <div style="font-size: 11px; color: #475569;">Issued for &amp; on behalf of <strong>{{ $company->name ?? 'The Enterprise' }}</strong>:</div>
                <div class="sig-line"></div>
                <div class="sig-name">Authorized HR Signatory</div>
                <div class="sig-role">People Operations &amp; Talent Management</div>
            </td>
            <td class="sig-block" style="text-align: right;">
                <div style="font-size: 11px; color: #475569;">Corporate Governance:</div>
                <div class="sig-line" style="margin-left: auto;"></div>
                <div class="sig-name">Director of People &amp; Culture</div>
                <div class="sig-role">Human Resources Directorate</div>
            </td>
        </tr>
    </table>

    <div class="security-footer">
        Verification Code: REL-{{ strtoupper(substr(md5(($offboarding->id ?? '0') . ($employee->id ?? '0')), 0, 10)) }} &bull; Issued securely via {{ config('app.name', 'HR Management System') }}
    </div>
</body>
</html>
