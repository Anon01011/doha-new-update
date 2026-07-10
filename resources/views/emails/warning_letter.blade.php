<!DOCTYPE html>
<html>

<head>
    <title>{{ $warningLetter->subject }}</title>
</head>

<body>
    <h1>{{ $warningLetter->type }}</h1>
    <p>Dear {{ $warningLetter->employee->name }},</p>

    <div>
        {!! nl2br(e($warningLetter->content)) !!}
    </div>

    <p>Regards,<br>
        {{ $warningLetter->company->name }} Management</p>
</body>

</html>