@extends('reports.layout')

@section('title', 'Advance Report')
@section('report_title', 'Salary Advance Request Report')

@section('content')
    <div class="meta">
        <table style="width: 100%">
            <tr>
                <td style="width: 50%">
                    <strong>Period:</strong> {{ \Carbon\Carbon::parse($startDate)->format('d M Y') }} - {{ \Carbon\Carbon::parse($endDate)->format('d M Y') }}
                </td>
                <td style="width: 50%; text-align: right;">
                    <strong>Generated On:</strong> {{ now()->format('d M Y H:i') }}
                </td>
            </tr>
        </table>
    </div>

    @if($summary)
    <div class="summary-box">
        <div class="summary-title">Advance Summary</div>
        <table class="summary-grid">
            <tr>
                <td class="summary-item">
                    <span class="label">Total Requests:</span>
                    <span class="value">{{ $summary['total_count'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Total Amount:</span>
                    <span class="value">{{ number_format($summary['total_amount'], 2) }}</span>
                </td>
            </tr>
        </table>
    </div>
    @endif

    <table class="table">
        <thead>
            <tr>
                <th>Employee</th>
                <th class="text-right">Amount</th>
                <th>Request Date</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Repayment Date</th>
            </tr>
        </thead>
        <tbody>
            @foreach($advances as $adv)
            <tr>
                <td>{{ $adv->employee->name }}</td>
                <td class="text-right">{{ number_format($adv->amount, 2) }}</td>
                <td>{{ $adv->request_date->format('d M Y') }}</td>
                <td style="font-size: 9px;">{{ $adv->purpose }}</td>
                <td>
                    <span class="{{ $adv->status === 'repaid' ? 'bg-emerald' : ($adv->status === 'approved' ? 'bg-sky' : ($adv->status === 'rejected' ? 'bg-rose' : 'bg-amber')) }}">
                        {{ ucfirst($adv->status) }}
                    </span>
                </td>
                <td>{{ $adv->repayment_date ? $adv->repayment_date->format('d M Y') : '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
@endsection
