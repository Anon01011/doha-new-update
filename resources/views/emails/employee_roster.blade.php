@component('mail::message')
# Your Shift Roster

Dear **{{ $employee->name }}**,

Here is your shift roster for **{{ $dateRange }}** at **{{ $company->name }}**.

@if(count($roster) > 0)
## Your Shifts This Week

@component('mail::table')
| Day | Date | Shift Time | Type | Designation | Notes |
|-----|------|------------|------|-------------|-------|
@foreach($roster as $shift)
| {{ $shift['day'] ?? 'N/A' }} | {{ $shift['date'] }} | **{{ $shift['shift_time'] }}** | {{ $shift['shift_type'] ?? '-' }} | {{ $shift['designation'] ?? '-' }} | {{ $shift['notes'] ?? '-' }} |
@endforeach
@endcomponent

@if(count($roster) == 0)
**No shifts assigned for this period.**

Please contact your supervisor if you believe this is an error.
@endif

## Important Reminders

- Please arrive 10 minutes before your shift start time
- Wear appropriate uniform/attire as per company policy
- Bring any required equipment or materials
- Contact your supervisor immediately if you cannot attend your shift

## Contact Information

If you have any questions about your roster, please contact:
- **Your Supervisor**: {{ $employee->reported_to ?? 'Contact HR' }}
- **HR Department**: hr@{{ $company->name ?? 'company.com' }}
- **Emergency Contact**: {{ $employee->mobile ?? 'Contact HR' }}

@component('mail::button', ['url' => config('app.url')])
View Full Roster Online
@endcomponent

@else
**No shifts have been assigned for this period.**

Please contact your supervisor or HR department for clarification.
@endif

---

**Company**: {{ $company->name }}  
**Employee ID**: {{ $employee->employee_code ?? 'N/A' }}  
**Department**: {{ $employee->department ?? 'N/A' }}  
**Location**: {{ $employee->location ?? 'N/A' }}

Thanks,<br>
**{{ config('app.name') }}**  
*HR Department*

@if(config('app.url'))
<div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
    <small style="color: #666;">
        This is an automated message. Please do not reply to this email.<br>
        For questions, contact your supervisor or HR department.
    </small>
</div>
@endif
@endcomponent
