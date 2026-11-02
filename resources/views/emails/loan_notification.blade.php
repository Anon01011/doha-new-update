<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loan Notification</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #090b4e 0%, #0f172a 60%, #0d9488 100%); padding: 32px 40px; text-align: center; }
        .header h1 { color: #ffffff; font-size: 22px; margin: 0; font-weight: 700; letter-spacing: 0.5px; }
        .header p { color: #99f6e4; font-size: 13px; margin: 6px 0 0; text-transform: uppercase; letter-spacing: 0.8px; }
        .badge { display: inline-block; margin-top: 14px; padding: 6px 18px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
        .badge-disbursed { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .badge-installment_paid { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
        .badge-completed { background: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
        .body { padding: 36px 40px; }
        .greeting { font-size: 16px; color: #1e293b; font-weight: 600; margin-bottom: 8px; }
        .message { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 24px; }
        .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; }
        .info-card table { width: 100%; border-collapse: collapse; }
        .info-card td { padding: 8px 0; font-size: 13px; vertical-align: top; }
        .info-card td:first-child { color: #64748b; font-weight: 600; width: 45%; }
        .info-card td:last-child { color: #1e293b; font-weight: 700; }
        .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
        .cta { text-align: center; margin: 24px 0; }
        .cta a { display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(13,148,136,0.25); }
        .footer { background: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { font-size: 11px; color: #94a3b8; margin: 4px 0; }
    </style>
</head>
<body>
<div class="wrapper">
    <div class="header">
        <h1>Loan Notification</h1>
        <p>{{ $company->name }}</p>
        <span class="badge badge-{{ $type }}">
            @if($type === 'disbursed') 💰 Loan Disbursed
            @elseif($type === 'installment_paid') ✅ Installment Paid
            @elseif($type === 'completed') 🎉 Loan Completed
            @else {{ ucfirst($type) }}
            @endif
        </span>
    </div>
    <div class="body">
        <p class="greeting">Dear {{ $employee->name }},</p>

        @if($type === 'disbursed')
        <p class="message">
            We are pleased to inform you that your loan of <strong>{{ $currencySymbol }}{{ number_format($loan->amount, 2) }}</strong> has been successfully <strong>disbursed</strong>. You will start repaying in monthly installments as per the schedule below.
        </p>
        @elseif($type === 'installment_paid')
        <p class="message">
            This is to confirm that your loan installment of <strong>{{ $currencySymbol }}{{ number_format($installmentAmount, 2) }}</strong> has been successfully marked as <strong>paid</strong>. Please keep this email for your records.
        </p>
        @elseif($type === 'completed')
        <p class="message">
            Congratulations! 🎉 Your loan has been <strong>fully repaid</strong>. All installments have been cleared. Thank you for your timely payments!
        </p>
        @endif

        <div class="info-card">
            <table>
                <tr>
                    <td>Loan Type</td>
                    <td>{{ $loan->loan_type }}</td>
                </tr>
                <tr>
                    <td>Loan Amount ({{ $currencyCode }})</td>
                    <td>{{ $currencySymbol }}{{ number_format($loan->amount, 2) }}</td>
                </tr>
                <tr>
                    <td>Monthly Installment ({{ $currencyCode }})</td>
                    <td>{{ $currencySymbol }}{{ number_format($loan->monthly_installment, 2) }}</td>
                </tr>
                <tr>
                    <td>Tenure</td>
                    <td>{{ $loan->tenure_months }} Months</td>
                </tr>
                <tr>
                    <td>Repayment Method</td>
                    <td>{{ $loan->repayment_method === 'salary_deduction' ? 'Salary Deduction' : 'Direct / Manual Payment' }}</td>
                </tr>
                <tr>
                    <td>Disbursement Status</td>
                    <td>{{ $loan->disbursed_at ? 'Disbursed on ' . \Carbon\Carbon::parse($loan->disbursed_at)->format('d M Y') : 'Pending Disbursement' }}</td>
                </tr>
                @if($type === 'installment_paid')
                <tr>
                    <td>Amount Paid ({{ $currencyCode }})</td>
                    <td>{{ $currencySymbol }}{{ number_format($installmentAmount, 2) }}</td>
                </tr>
                <tr>
                    <td>Date Paid</td>
                    <td>{{ now()->format('d M Y') }}</td>
                </tr>
                @endif
                <tr>
                    <td>Status</td>
                    <td>{{ ucfirst($loan->status) }}</td>
                </tr>
            </table>
        </div>

        <hr class="divider">

        <div class="cta">
            <a href="{{ route('loans.show', $loan->id) }}">View Loan Details</a>
        </div>
    </div>
    <div class="footer">
        <p>This is an automated notification from {{ $company->name }}.</p>
        <p>Please do not reply to this email. Contact HR for any queries.</p>
    </div>
</div>
</body>
</html>
