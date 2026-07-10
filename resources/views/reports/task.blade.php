@extends('reports.layout')

@section('title', 'Task Report')
@section('report_title', 'Operational Task & Performance Report')

@section('content')
    @if($summary)
    <div class="summary-box">
        <div class="summary-title">Task Summary</div>
        <table class="summary-grid">
            <tr>
                <td class="summary-item">
                    <span class="label">Total Tasks:</span>
                    <span class="value">{{ $summary['total_tasks'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Completed:</span>
                    <span class="value bg-emerald">{{ $summary['completed'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">In Progress:</span>
                    <span class="value bg-sky">{{ $summary['in_progress'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Pending:</span>
                    <span class="value bg-amber">{{ $summary['pending'] }}</span>
                </td>
            </tr>
        </table>
    </div>
    @endif

    <table class="table">
        <thead>
            <tr>
                <th>Task Title</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Assignments</th>
                <th>Progress</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($tasks as $task)
            <tr>
                <td>{{ $task->title }}</td>
                <td>
                    <span class="{{ $task->priority === 'high' || $task->priority === 'urgent' ? 'bg-rose' : ($task->priority === 'medium' ? 'bg-amber' : 'bg-sky') }}">
                        {{ ucfirst($task->priority) }}
                    </span>
                </td>
                <td>{{ \Carbon\Carbon::parse($task->due_date)->format('d M Y') }}</td>
                <td class="text-right">{{ $task->assignments->count() }}</td>
                <td class="text-right">{{ $task->progress }}%</td>
                <td>
                    <span class="{{ $task->status === 'completed' ? 'bg-emerald' : ($task->status === 'in_progress' ? 'bg-sky' : ($task->status === 'cancelled' ? 'bg-rose' : 'bg-amber')) }}">
                        {{ str_replace('_', ' ', ucfirst($task->status)) }}
                    </span>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
@endsection
