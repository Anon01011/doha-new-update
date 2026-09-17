<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Employee Expense Claims Report</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10px;
            color: #1e293b;
            margin: 0;
            padding: 15px;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 10px;
        }

        .header h1 {
            margin: 0 0 4px 0;
            font-size: 18px;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .header p {
            margin: 0;
            color: #64748b;
            font-size: 10px;
        }

        .kpi-container {
            width: 100%;
            margin-bottom: 15px;
        }

        .kpi-table {
            width: 100%;
            border-collapse: collapse;
        }

        .kpi-cell {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 10px;
            text-align: center;
            width: 25%;
        }

        .kpi-value {
            font-size: 14px;
            font-weight: bold;
            color: #0f172a;
        }

        .kpi-label {
            font-size: 8px;
            color: #64748b;
            text-transform: uppercase;
            margin-top: 2px;
        }

        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        table.data-table th {
            background-color: #0f172a;
            color: #ffffff;
            font-size: 8px;
            text-transform: uppercase;
            padding: 6px 4px;
            text-align: left;
            border: 1px solid #0f172a;
        }

        table.data-table td {
            padding: 5px 4px;
            font-size: 8px;
            border: 1px solid #e2e8f0;
        }

        table.data-table tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .badge {
            display: inline-block;
            padding: 2px 4px;
            border-radius: 3px;
            font-size: 7px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .badge-approved {
            background-color: #dcfce7;
            color: #15803d;
        }

        .badge-pending {
            background-color: #fef3c7;
            color: #b45309;
        }

        .badge-paid {
            background-color: #ede9fe;
            color: #6d28d9;
        }

        .badge-rejected {
            background-color: #fee2e2;
            color: #b91c1c;
        }

        .footer {
            margin-top: 20px;
            text-align: right;
            font-size: 8px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
        }
    </style>
</head>

<body>

    <div class="header">
        <h1>{{ $settings['app_name'] ?? 'Company HRMS' }}</h1>
        <p>Employee Business Expense & Reimbursement Report — {{ $year }}{{ $month ? ' / Month ' . $month : '' }}</p>
    </div>

    <div class="kpi-container">
        <table class="kpi-table">
            <tr>
                <td class="kpi-cell">
                    <div class="kpi-value">{{ $summary['total_claims'] ?? 0 }}</div>
                    <div class="kpi-label">Total Claims</div>
                </td>
                <td class="kpi-cell">
                    <div class="kpi-value">₹{{ number_format($summary['total_amount'] ?? 0, 2) }}</div>
                    <div class="kpi-label">Total Claimed (INR)</div>
                </td>
                <td class="kpi-cell">
                    <div class="kpi-value">₹{{ number_format($summary['total_reimbursed'] ?? 0, 2) }}</div>
                    <div class="kpi-label">Total Reimbursed</div>
                </td>
                <td class="kpi-cell">
                    <div class="kpi-value">{{ $summary['pending_approval'] ?? 0 }}</div>
                    <div class="kpi-label">Pending Review</div>
                </td>
            </tr>
        </table>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th>Claim #</th>
                <th>Employee</th>
                <th>Branch</th>
                <th>Date</th>
                <th>Category</th>
                <th>Purpose</th>
                <th>Amount (INR)</th>
                <th>Status</th>
                <th>Reimbursement</th>
            </tr>
        </thead>
        <tbody>
            @forelse($claims as $claim)
                <tr>
                    <td><strong>{{ $claim->claim_number }}</strong></td>
                    <td>{{ $claim->employee?->name ?? 'Staff' }} ({{ $claim->employee?->employee_code ?? '-' }})</td>
                    <td>{{ $claim->employee?->company?->name ?? 'Main' }}</td>
                    <td>{{ $claim->expense_date ? $claim->expense_date->format('d M Y') : '-' }}</td>
                    <td>{{ $claim->category?->name ?? 'General' }}</td>
                    <td>{{ Str::limit($claim->business_purpose, 35) }}</td>
                    <td><strong>₹{{ number_format($claim->amount, 2) }}</strong></td>
                    <td>
                        @if(in_array($claim->status, ['finance_approved', 'paid']))
                            <span class="badge badge-approved">{{ $claim->status }}</span>
                        @elseif($claim->status === 'rejected')
                            <span class="badge badge-rejected">Rejected</span>
                        @else
                            <span class="badge badge-pending">{{ str_replace('_', ' ', $claim->status) }}</span>
                        @endif
                    </td>
                    <td>
                        <span class="badge badge-paid">{{ str_replace('_', ' ', $claim->reimbursement_status) }}</span>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="9" style="text-align: center; padding: 15px; color: #94a3b8;">No expense records found.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Generated on {{ now()->format('d M Y, h:i A') }} | Confidential Company SaaS Financial Record
    </div>

</body>

</html>