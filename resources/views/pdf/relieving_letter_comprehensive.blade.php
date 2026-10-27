<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Comprehensive Service Certificate - {{ $employee->name }}</title>
    <style>
        @page {
            margin: 20px;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            line-height: 1.5;
            color: #1e293b;
            margin: 0;
            padding: 25px;
        }
        .cert-container {
            border: 2px solid #047857;
            padding: 20px;
            min-height: 980px;
            box-sizing: border-box;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #047857;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .co-title {
            font-size: 22px;
            font-weight: bold;
            color: #065f46;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .co-address {
            font-size: 10px;
            color: #64748b;
            margin-top: 3px;
        }
        .ref-bar {
            width: 100%;
            margin-bottom: 15px;
            font-size: 10.5px;
            font-weight: bold;
            color: #334155;
        }
        .doc-header {
            text-align: center;
            background-color: #ecfdf5;
            border: 1px solid #a7f3d0;
            padding: 8px;
            border-radius: 4px;
            margin-bottom: 18px;
        }
        .doc-header h2 {
            margin: 0;
            font-size: 14px;
            color: #065f46;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }
        .section-title {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            color: #065f46;
            margin: 14px 0 6px 0;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 3px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        .data-table td {
            padding: 6px 10px;
            border: 1px solid #cbd5e1;
            font-size: 10.5px;
        }
        .data-table td.hdr {
            background-color: #f8fafc;
            font-weight: bold;
            width: 25%;
            color: #334155;
        }
        .clearance-grid {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        .clearance-grid th {
            background-color: #f1f5f9;
            padding: 6px;
            border: 1px solid #cbd5e1;
            font-size: 10px;
            text-align: left;
            text-transform: uppercase;
        }
        .clearance-grid td {
            padding: 5px 8px;
            border: 1px solid #cbd5e1;
            font-size: 10px;
        }
        .status-ok {
            color: #15803d;
            font-weight: bold;
        }
        .text-body {
            text-align: justify;
            margin: 10px 0;
            font-size: 11px;
            line-height: 1.6;
        }
        .footer-table {
            width: 100%;
            margin-top: 35px;
        }
        .footer-table td {
            vertical-align: top;
        }
        .sign-line {
            width: 160px;
            border-top: 1px solid #334155;
            margin-top: 35px;
            margin-bottom: 4px;
        }
        .seal-circle {
            width: 90px;
            height: 90px;
            border: 2px dashed #059669;
            border-radius: 50%;
            margin: 0 auto;
            text-align: center;
            line-height: 90px;
            color: #059669;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .footnote {
            margin-top: 25px;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
            font-size: 8.5px;
            color: #64748b;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="cert-container">
        <div class="header">
            <div class="co-title">{{ $company->name ?? 'Organization HR Directorate' }}</div>
            <div class="co-address">{{ $company->address ?? 'Corporate Complex' }} &bull; Phone: {{ $company->phone ?? '+974 4400 0000' }} &bull; Email: {{ $company->email ?? 'hr@company.com' }}</div>
        </div>

        <table style="width: 100%;" class="ref-bar">
            <tr>
                <td>Serial: CER/{{ $offboarding->id }}/{{ now()->format('Ymd') }}</td>
                <td style="text-align: right;">Issue Date: {{ now()->format('d F Y') }}</td>
            </tr>
        </table>

        <div class="doc-header">
            <h2>Comprehensive Certificate of Service &amp; Final Relieving</h2>
        </div>

        <div class="section-title">1. Employee Credentials &amp; Engagement Profile</div>
        <table class="data-table">
            <tr>
                <td class="hdr">Employee Name</td>
                <td style="width: 35%;"><strong>{{ $employee->name }}</strong></td>
                <td class="hdr">Staff ID / Code</td>
                <td>{{ $employee->employee_code ?? '-' }}</td>
            </tr>
            <tr>
                <td class="hdr">Designation</td>
                <td>{{ $employee->designation ?? 'Team Member' }}</td>
                <td class="hdr">Department / Branch</td>
                <td>{{ $employee->department->name ?? 'Operations' }} / {{ $company->name ?? '-' }}</td>
            </tr>
            <tr>
                <td class="hdr">Date of Engagement</td>
                <td>{{ $employee->joined_date ? \Carbon\Carbon::parse($employee->joined_date)->format('d F Y') : '-' }}</td>
                <td class="hdr">Final Working Date</td>
                <td>{{ $offboarding->actual_last_working_day ? \Carbon\Carbon::parse($offboarding->actual_last_working_day)->format('d F Y') : ($offboarding->proposed_last_working_day ? \Carbon\Carbon::parse($offboarding->proposed_last_working_day)->format('d F Y') : now()->format('d F Y')) }}</td>
            </tr>
            <tr>
                <td class="hdr">Type of Separation</td>
                <td>{{ ucwords(str_replace('_', ' ', $offboarding->separation_reason ?? 'Resignation')) }}</td>
                <td class="hdr">Offboarding Case Ref</td>
                <td>#{{ ($offboarding->request_number ?? null) ?: $offboarding->id }}</td>
            </tr>
        </table>

        <div class="section-title">2. Inter-Departmental Clearance Verification</div>
        <table class="clearance-grid">
            <thead>
                <tr>
                    <th>Department</th>
                    <th>Clearance Scope</th>
                    <th>Verification Officer</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>IT &amp; Systems</strong></td>
                    <td>Hardware returned, email/VPN/ERP access revoked</td>
                    <td>IT Support Lead</td>
                    <td class="status-ok">&check; Cleared</td>
                </tr>
                <tr>
                    <td><strong>Finance &amp; Payroll</strong></td>
                    <td>Travel advances, loans, salary settlement</td>
                    <td>Finance Controller</td>
                    <td class="status-ok">&check; Cleared</td>
                </tr>
                <tr>
                    <td><strong>Administration</strong></td>
                    <td>Access cards, security tokens, company property</td>
                    <td>Facilities Admin</td>
                    <td class="status-ok">&check; Cleared</td>
                </tr>
                <tr>
                    <td><strong>Human Resources</strong></td>
                    <td>Exit interview, document handover, statutory files</td>
                    <td>HR Business Partner</td>
                    <td class="status-ok">&check; Cleared</td>
                </tr>
            </tbody>
        </table>

        <div class="section-title">3. Conduct Appraisal &amp; Formal Relieving Declaration</div>
        <div class="text-body">
            <p>
                We hereby verify that <strong>{{ $employee->name }}</strong> was relieved of all service obligations, employment responsibilities, and corporate authorities with <strong>{{ $company->name ?? 'this organization' }}</strong> effective at the end of business hours on <strong>{{ $offboarding->actual_last_working_day ? \Carbon\Carbon::parse($offboarding->actual_last_working_day)->format('d F Y') : ($offboarding->proposed_last_working_day ? \Carbon\Carbon::parse($offboarding->proposed_last_working_day)->format('d F Y') : now()->format('d F Y')) }}</strong>.
            </p>
            <p>
                Throughout {{ $employee->gender === 'female' ? 'her' : 'his' }} service, {{ $employee->gender === 'female' ? 'she' : 'he' }} carried out duties with integrity, diligence, and professional discipline. There are no outstanding liabilities, financial encumbrances, or disciplinary actions pending against {{ $employee->gender === 'female' ? 'her' : 'him' }}.
            </p>
            <p>
                We record our sincere appreciation for {{ $employee->gender === 'female' ? 'her' : 'his' }} dedicated contributions to the organization and wish {{ $employee->gender === 'female' ? 'her' : 'him' }} the best of success in all prospective professional endeavors.
            </p>
        </div>

        <table class="footer-table">
            <tr>
                <td style="width: 35%;">
                    <div style="font-size: 10px; color: #475569;">Prepared &amp; Verified By:</div>
                    <div class="sign-line"></div>
                    <div style="font-weight: bold; font-size: 11px;">HR Operations Manager</div>
                    <div style="font-size: 9.5px; color: #64748b;">Human Capital Department</div>
                </td>
                <td style="width: 30%; text-align: center; vertical-align: middle;">
                    <div class="seal-circle">Authorized<br>Seal</div>
                </td>
                <td style="width: 35%; text-align: right;">
                    <div style="font-size: 10px; color: #475569;">Approved for Discharge:</div>
                    <div class="sign-line" style="margin-left: auto;"></div>
                    <div style="font-weight: bold; font-size: 11px;">Director of Human Resources</div>
                    <div style="font-size: 9.5px; color: #64748b;">Executive Management Board</div>
                </td>
            </tr>
        </table>

        <div class="footnote">
            Certificate ID: COMP-{{ strtoupper(substr(sha1(($offboarding->id ?? '0') . ($employee->employee_code ?? 'EMP')), 0, 12)) }} &bull; Verified electronically by {{ config('app.name', 'HRMS') }} &bull; Valid without physical stamp where certified digitally.
        </div>
    </div>
</body>
</html>
