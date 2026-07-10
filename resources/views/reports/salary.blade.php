@extends('reports.layout')

@section('title', 'Salary Report')
@section('report_title', 'Payroll Summary Report')

@section('content')
    <div class="meta">
        <table style="width: 100%">
            <tr>
                <td style="width: 50%">
                    <strong>Period:</strong> {{ $month }} {{ $year }}
                </td>
                <td style="width: 50%; text-align: right;">
                    <strong>Generated On:</strong> {{ now()->format('d M Y H:i') }}
                </td>
            </tr>
        </table>
    </div>

    @if($summary)
    <div class="summary-box">
        <div class="summary-title">Payroll Summary</div>
        <table class="summary-grid">
            <tr>
                <td class="summary-item">
                    <span class="label">Employees:</span>
                    <span class="value">{{ $summary['total_employees'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Basic Salary:</span>
                    <span class="value">{{ number_format($summary['total_basic'], 2) }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Allowances:</span>
                    <span class="value bg-emerald">+{{ number_format($summary['total_allowances'], 2) }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Deductions:</span>
                    <span class="value bg-rose">-{{ number_format($summary['total_deductions'], 2) }}</span>
                </td>
            </tr>
            <tr>
                <td class="summary-item" colspan="2"></td>
                <td class="summary-item" colspan="2" style="text-align: right;">
                    <span class="label" style="font-size: 11px;">Total Net Payroll:</span>
                    <span class="value" style="font-size: 11px; color: #0284c7;">{{ number_format($summary['total_net_salary'], 2) }}</span>
                </td>
            </tr>
        </table>
    </div>
    @endif

    <table class="table">
        <thead>
            <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Basic Salary</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Salary</th>
            </tr>
        </thead>
        <tbody>
            @foreach($salaryPostings as $posting)
            <tr>
                <td>{{ $posting->employee->employee_code ?? '-' }}</td>
                <td>{{ $posting->employee->name }}</td>
                <td class="text-right">{{ number_format($posting->basic_salary, 2) }}</td>
                <td class="text-right bg-emerald">
                    @php
                        $allowances = is_array($posting->allowances) ? array_sum($posting->allowances) : 0;
                    @endphp
                    {{ number_format($allowances, 2) }}
                </td>
                <td class="text-right bg-rose">
                    @php
                        $deductions = is_array($posting->deductions) ? array_sum($posting->deductions) : 0;
                    @endphp
                    {{ number_format($deductions, 2) }}
                </td>
                <td class="text-right" style="font-weight: bold;">{{ number_format($posting->net_salary, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
@endsection
