@extends('reports.layout')

@section('title', 'Leave Report')
@section('report_title', 'Leave Summary Report')

@section('content')
    @if($summary)
    <div class="summary-box">
        <div class="summary-title">Summary Statistics</div>
        <table class="summary-grid">
            <tr>
                <td class="summary-item">
                    <span class="label">Total Requests:</span>
                    <span class="value">{{ $summary['total_requests'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Approved:</span>
                    <span class="value bg-emerald">{{ $summary['approved'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Pending:</span>
                    <span class="value bg-sky">{{ $summary['pending'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Rejected:</span>
                    <span class="value bg-rose">{{ $summary['rejected'] }}</span>
                </td>
            </tr>
            <tr>
                <td class="summary-item">
                    <span class="label">Total Days:</span>
                    <span class="value">{{ $summary['total_days'] }}</span>
                </td>
                <td colspan="3"></td>
            </tr>
        </table>
    </div>
    @endif

    <table class="table">
        <thead>
            <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($leaveRequests as $request)
            <tr>
                <td>{{ $request->employee->name }}</td>
                <td>{{ $request->leaveType->name }}</td>
                <td>{{ \Carbon\Carbon::parse($request->start_date)->format('d M Y') }}</td>
                <td>{{ \Carbon\Carbon::parse($request->end_date)->format('d M Y') }}</td>
                <td class="text-right">{{ $request->days_requested }}</td>
                <td>
                    <span class="{{ $request->status === 'approved' ? 'bg-emerald' : ($request->status === 'rejected' ? 'bg-rose' : 'bg-sky') }}">
                        {{ ucfirst($request->status) }}
                    </span>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
@endsection
