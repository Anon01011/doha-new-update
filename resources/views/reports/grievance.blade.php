@extends('reports.layout')

@section('title', 'Grievance Report')
@section('report_title', 'Workplace Grievance & Resolution Report')

@section('content')
    @if($summary)
    <div class="summary-box">
        <div class="summary-title">Grievance Summary</div>
        <table class="summary-grid">
            <tr>
                <td class="summary-item">
                    <span class="label">Total Grievances:</span>
                    <span class="value">{{ $summary['total_grievances'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Resolved:</span>
                    <span class="value bg-emerald">{{ $summary['resolved'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Under Review:</span>
                    <span class="value bg-sky">{{ $summary['under_review'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Closed:</span>
                    <span class="value bg-slate">{{ $summary['closed'] }}</span>
                </td>
            </tr>
        </table>
    </div>
    @endif

    <table class="table">
        <thead>
            <tr>
                <th>Employee</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Date Filed</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($grievances as $grievance)
            <tr>
                <td>{{ $grievance->employee->name }}</td>
                <td>{{ $grievance->subject }}</td>
                <td>
                    <span class="{{ $grievance->priority === 'high' || $grievance->priority === 'urgent' ? 'bg-rose' : ($grievance->priority === 'medium' ? 'bg-amber' : 'bg-sky') }}">
                        {{ ucfirst($grievance->priority) }}
                    </span>
                </td>
                <td>{{ \Carbon\Carbon::parse($grievance->created_at)->format('d M Y') }}</td>
                <td>
                    <span class="{{ $grievance->status === 'resolved' ? 'bg-emerald' : ($grievance->status === 'closed' ? 'bg-slate' : 'bg-sky') }}">
                        {{ str_replace('_', ' ', ucfirst($grievance->status)) }}
                    </span>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
@endsection
