@extends('reports.layout')

@section('title', 'Training Report')
@section('report_title', 'Employee Training & Development Report')

@section('content')
    @if($summary)
    <div class="summary-box">
        <div class="summary-title">Training Summary</div>
        <table class="summary-grid">
            <tr>
                <td class="summary-item">
                    <span class="label">Total Trainings:</span>
                    <span class="value">{{ $summary['total_trainings'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Scheduled:</span>
                    <span class="value bg-sky">{{ $summary['scheduled'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Completed:</span>
                    <span class="value bg-emerald">{{ $summary['completed'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Participants:</span>
                    <span class="value">{{ $summary['total_participants'] }}</span>
                </td>
            </tr>
        </table>
    </div>
    @endif

    <table class="table">
        <thead>
            <tr>
                <th>Training Name</th>
                <th>Category</th>
                <th>Trainer</th>
                <th>Period</th>
                <th>Participants</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($trainings as $training)
            <tr>
                <td>{{ $training->title }}</td>
                <td>{{ $training->category }}</td>
                <td>{{ $training->trainer_name }}</td>
                <td>{{ \Carbon\Carbon::parse($training->start_date)->format('d M') }} - {{ \Carbon\Carbon::parse($training->end_date)->format('d M Y') }}</td>
                <td class="text-right">{{ $training->assignments->count() }}</td>
                <td>
                    <span class="{{ $training->status === 'completed' ? 'bg-emerald' : ($training->status === 'ongoing' ? 'bg-sky' : 'bg-rose') }}">
                        {{ ucfirst($training->status) }}
                    </span>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
@endsection
