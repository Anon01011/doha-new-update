@extends('reports.layout')

@section('title', 'Evaluation Report')
@section('report_title', 'Employee Performance Evaluation Report')

@section('content')
    <div class="meta">
        <table style="width: 100%">
            <tr>
                <td style="width: 50%">
                    <strong>Period:</strong> {{ date('F', mktime(0, 0, 0, $month, 10)) }} {{ $year }}
                </td>
                <td style="width: 50%; text-align: right;">
                    <strong>Generated On:</strong> {{ now()->format('d M Y H:i') }}
                </td>
            </tr>
        </table>
    </div>

    @if($summary)
    <div class="summary-box">
        <div class="summary-title">Performance Summary</div>
        <table class="summary-grid">
            <tr>
                <td class="summary-item">
                    <span class="label">Total Evaluations:</span>
                    <span class="value">{{ $summary['total_evaluations'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Avg. Score:</span>
                    <span class="value">{{ number_format($summary['avg_score'], 2) }} / 5.00</span>
                </td>
            </tr>
        </table>
    </div>
    @endif

    <table class="table">
        <thead>
            <tr>
                <th>Employee / Dept</th>
                <th class="text-center">Attitude</th>
                <th class="text-center">Resp.</th>
                <th class="text-center">Comp.</th>
                <th class="text-right">Overall</th>
                <th>Comments</th>
            </tr>
        </thead>
        <tbody>
            @foreach($evaluations as $ev)
            @php
                $scores = $ev['criteria_scores'] ?? [];
                
                $attitudeKeys = ['Service Quality', 'Communication Skills', 'Cleanliness', 'Teamwork', 'Leadership', 'Professional Behavior', 'Work Under Pressure'];
                $respKeys = ['Attendance Punctuality', 'Accuracy in Cash Handling', 'Following Company Procedures', 'Accountability for Transactions', 'Work on Deadline', 'Willingness to take more responsibility', 'Open to feedback'];
                $compKeys = ['Creativity', 'Speed & Efficiency at Checkout', 'Accuracy in Transactions', 'Product Knowledge', 'Handling Customer Complaints', 'Use of POS System', 'Productivity', 'Initiative', 'Effective Problem Solving'];

                $getAvg = function($keys, $data) {
                    $vals = array_filter(array_map(fn($k) => $data[$k] ?? 0, $keys));
                    return count($vals) ? number_format(array_sum($vals) / count($vals), 1) : '-';
                };
            @endphp
            <tr>
                <td>
                    <strong>{{ $ev['employee']['name'] }}</strong><br>
                    <small>{{ $ev['employee']['department'] }}</small>
                </td>
                <td class="text-center">{{ $getAvg($attitudeKeys, $scores) }}</td>
                <td class="text-center">{{ $getAvg($respKeys, $scores) }}</td>
                <td class="text-center">{{ $getAvg($compKeys, $scores) }}</td>
                <td class="text-right">
                    <span class="{{ $ev['overall_score'] >= 80 ? 'bg-emerald' : ($ev['overall_score'] < 50 ? 'bg-rose' : 'bg-sky') }}">
                        {{ number_format($ev['overall_score'], 0) }}%
                    </span>
                </td>
                <td style="font-size: 8px; width: 150px;">{{ $ev['comments'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
@endsection
