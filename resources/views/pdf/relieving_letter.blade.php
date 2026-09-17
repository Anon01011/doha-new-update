<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Experience & Relieving Letter - {{ $employee->name }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 13px;
            line-height: 1.6;
            color: #1e293b;
            margin: 40px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 15px;
            margin-bottom: 30px;
        }
        .company-name {
            font-size: 22px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
        }
        .company-sub {
            font-size: 11px;
            color: #64748b;
        }
        .title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 25px 0;
            color: #0f172a;
            text-decoration: underline;
        }
        .date {
            text-align: right;
            margin-bottom: 20px;
            font-weight: 500;
        }
        .recipient {
            margin-bottom: 25px;
            font-weight: bold;
        }
        .content {
            text-align: justify;
            margin-bottom: 20px;
        }
        .details-table {
            width: 100%;
            margin: 20px 0;
            border-collapse: collapse;
        }
        .details-table td {
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
        }
        .details-table td.label {
            background-color: #f8fafc;
            font-weight: bold;
            width: 35%;
            color: #475569;
        }
        .footer {
            margin-top: 60px;
        }
        .signature-line {
            width: 200px;
            border-top: 1px solid #334155;
            margin-top: 50px;
            margin-bottom: 5px;
        }
        .signatory-title {
            font-weight: bold;
            color: #0f172a;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{ $company->name ?? 'Company HR Department' }}</div>
        <div class="company-sub">{{ $company->address ?? 'Human Resources Department' }} | Email: {{ $company->email ?? 'hr@company.com' }}</div>
    </div>

    <div class="date">
        Date: {{ now()->format('d F Y') }}
    </div>

    <div class="recipient">
        TO WHOMSOEVER IT MAY CONCERN
    </div>

    <div class="title">
        EXPERIENCE &amp; RELIEVING LETTER
    </div>

    <div class="content">
        <p>
            This is to certify that <strong>{{ $employee->name }}</strong> (Employee Code: <strong>{{ $employee->employee_code ?? '-' }}</strong>) 
            was employed with <strong>{{ $company->name ?? 'our organization' }}</strong> from 
            <strong>{{ $employee->joined_date ? \Carbon\Carbon::parse($employee->joined_date)->format('d F Y') : 'the commencement of employment' }}</strong> 
            to <strong>{{ $offboarding->actual_last_working_day ? \Carbon\Carbon::parse($offboarding->actual_last_working_day)->format('d F Y') : ($offboarding->proposed_last_working_day ? \Carbon\Carbon::parse($offboarding->proposed_last_working_day)->format('d F Y') : now()->format('d F Y')) }}</strong>.
        </p>

        <p>
            At the time of relieving, {{ $employee->gender === 'female' ? 'she' : 'he' }} was serving as 
            <strong>{{ $employee->designation ?? 'Team Member' }}</strong> in the <strong>{{ $employee->department->name ?? 'Operations' }}</strong> department.
        </p>
    </div>

    <table class="details-table">
        <tr>
            <td class="label">Employee Name</td>
            <td>{{ $employee->name }}</td>
        </tr>
        <tr>
            <td class="label">Employee ID</td>
            <td>{{ $employee->employee_code ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Designation</td>
            <td>{{ $employee->designation ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Department / Branch</td>
            <td>{{ $employee->department->name ?? '-' }} / {{ $company->name ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Date of Joining</td>
            <td>{{ $employee->joined_date ? \Carbon\Carbon::parse($employee->joined_date)->format('d M Y') : '-' }}</td>
        </tr>
        <tr>
            <td class="label">Last Working Day</td>
            <td>{{ $offboarding->actual_last_working_day ? \Carbon\Carbon::parse($offboarding->actual_last_working_day)->format('d M Y') : ($offboarding->proposed_last_working_day ? \Carbon\Carbon::parse($offboarding->proposed_last_working_day)->format('d M Y') : '-') }}</td>
        </tr>
        <tr>
            <td class="label">Clearance Status</td>
            <td>Completed (All company dues, assets &amp; access cleared)</td>
        </tr>
    </table>

    <div class="content">
        <p>
            {{ $employee->gender === 'female' ? 'She' : 'He' }} has been officially relieved of all duties and responsibilities effective from the close of business hours on the last working day mentioned above.
        </p>
        <p>
            During {{ $employee->gender === 'female' ? 'her' : 'his' }} tenure with us, {{ $employee->gender === 'female' ? 'her' : 'his' }} conduct was found to be satisfactory and professional. We appreciate {{ $employee->gender === 'female' ? 'her' : 'his' }} contributions and wish {{ $employee->gender === 'female' ? 'her' : 'him' }} every success in all future endeavors.
        </p>
    </div>

    <div class="footer">
        <div>For <strong>{{ $company->name ?? 'Organization HR' }}</strong>,</div>
        <div class="signature-line"></div>
        <div class="signatory-title">Authorized Signatory</div>
        <div style="font-size: 11px; color: #64748b;">Human Resources &amp; People Operations</div>
    </div>
</body>
</html>
