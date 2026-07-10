@extends('reports.layout')

@section('title', $reportType === 'summary' ? 'Attendance Summary Report' : ($reportType === 'overtime' ? 'Overtime Report' : 'Attendance Detail Report'))
@section('report_title', $reportType === 'summary' ? 'Attendance Summary Report' : ($reportType === 'overtime' ? 'Overtime Report' : 'Attendance Detail Report'))

@section('content')
    @if($summary && $reportType !== 'summary')
    <div class="summary-box">
        <div class="summary-title">Summary Statistics</div>
        <table class="summary-grid">
            <tr>
                <td class="summary-item">
                    <span class="label">Total Days:</span>
                    <span class="value">{{ $summary['total_days'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Present:</span>
                    <span class="value bg-emerald">{{ $summary['present'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Absent:</span>
                    <span class="value bg-rose">{{ $summary['absent'] }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">Leave:</span>
                    <span class="value bg-sky">{{ $summary['leave'] }}</span>
                </td>
            </tr>
            <tr>
                <td class="summary-item">
                    <span class="label">Total Hours:</span>
                    <span class="value">{{ number_format($summary['total_hours'], 1) }}</span>
                </td>
                <td class="summary-item">
                    <span class="label">OT Hours:</span>
                    <span class="value">{{ number_format($summary['total_ot_hours'], 1) }}</span>
                </td>
                <td colspan="2"></td>
            </tr>
        </table>
    </div>
    @endif

    @if($reportType === 'summary')
    <table class="table">
        <thead>
            <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Company</th>
                <th>Total Days</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Leave</th>
                <th>Weekly Off</th>
                <th>Total Hours</th>
                <th>OT Hours</th>
            </tr>
        </thead>
        <tbody>
            @foreach($attendances->groupBy('employee_id') as $empId => $empAttendances)
                @php
                    $first = $empAttendances->first();
                    $present = $empAttendances->whereIn('attendance', ['Present', 'Late'])->count();
                    $absent = $empAttendances->where('attendance', 'Absent')->count();
                    $leave = $empAttendances->filter(fn($a) => stripos($a->attendance, 'leave') !== false)->count();
                    $weeklyOff = $empAttendances->where('attendance', 'Weekly Off')->count();
                    $workHours = $empAttendances->sum('hours_worked');
                    $otHours = $empAttendances->sum('ot');
                @endphp
                <tr>
                    <td>{{ $first->employee->employee_code ?? '-' }}</td>
                    <td>{{ $first->employee->name }}</td>
                    <td>{{ $first->company->name }}</td>
                    <td>{{ $empAttendances->count() }}</td>
                    <td>{{ $present }}</td>
                    <td>{{ $absent }}</td>
                    <td>{{ $leave }}</td>
                    <td>{{ $weeklyOff }}</td>
                    <td>{{ number_format($workHours, 1) }}</td>
                    <td>{{ number_format($otHours, 1) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    @elseif($reportType === 'overtime')
    <table class="table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Normal Hours</th>
                <th>Actual Hours</th>
                <th>OT Hours</th>
                <th>OT Rate</th>
                <th>OT Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($attendances->where('ot', '>', 0) as $attendance)
            <tr>
                <td>{{ \Carbon\Carbon::parse($attendance->date)->format('d M Y') }}</td>
                <td>{{ $attendance->employee->employee_code ?? '-' }}</td>
                <td>{{ $attendance->employee->name }}</td>
                <td>{{ $attendance->normal_hours ?: 8 }}</td>
                <td>{{ $attendance->hours_worked }}</td>
                <td>{{ $attendance->ot }}</td>
                <td>{{ \App\Models\Setting::get('overtime_rate_multiplier', 1.5, $attendance->company_id) }}</td>
                <td>{{ number_format($attendance->ot_amt, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @else
    <table class="table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Status</th>
                <th>Work Hours</th>
                <th>OT Hours</th>
            </tr>
        </thead>
        <tbody>
            @foreach($attendances as $attendance)
            <tr>
                <td>{{ \Carbon\Carbon::parse($attendance->date)->format('d M Y') }}</td>
                <td>{{ $attendance->employee->employee_code ?? '-' }}</td>
                <td>{{ $attendance->employee->name }}</td>
                <td>
                    <span class="{{ $attendance->attendance === 'Present' ? 'bg-emerald' : ($attendance->attendance === 'Absent' ? 'bg-rose' : 'bg-sky') }}">
                        {{ $attendance->attendance }}
                    </span>
                </td>
                <td class="text-right">{{ $attendance->hours_worked ?? 0 }}</td>
                <td class="text-right">{{ $attendance->ot ?? 0 }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif
@endsection
