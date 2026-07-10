@extends('reports.layout')

@section('title', 'Loan Report')
@section('report_title', 'Loan & Advances Summary Report')

@section('content')
    @if($summary)
    <div class="summary-box">
        <div class="summary-title">Loan Summary</div>
        <table class="summary-grid">
            <tr>
                <td class="summary-item">
                    <span class="label">Total Loans:</span>
                    <span class="value">{{ $summary['total_loans'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Total Amount:</span>
                    <span class="value">{{ number_format($summary['total_amount'], 2) }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Outstanding:</span>
                    <span class="value bg-rose">{{ number_format($summary['total_outstanding'], 2) }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Completed:</span>
                    <span class="value bg-emerald">{{ $summary['completed'] }}</span>
                </td>
            </tr>
        </table>
    </div>
    @endif

    <table class="table">
        <thead>
            <tr>
                <th>Employee</th>
                <th>Loan Type</th>
                <th>Amount</th>
                <th>Interest</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($loans as $loan)
            <tr>
                <td>{{ $loan->employee->name }}</td>
                <td>{{ ucfirst($loan->loan_type) }}</td>
                <td class="text-right">{{ number_format($loan->amount, 2) }}</td>
                <td class="text-right">{{ number_format($loan->interest_amount, 2) }}</td>
                <td class="text-right">{{ number_format($loan->total_payable, 2) }}</td>
                <td class="text-right bg-emerald">{{ number_format($loan->total_paid, 2) }}</td>
                <td>
                    <span class="{{ $loan->status === 'completed' ? 'bg-emerald' : ($loan->status === 'rejected' ? 'bg-rose' : 'bg-sky') }}">
                        {{ ucfirst($loan->status) }}
                    </span>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
@endsection
