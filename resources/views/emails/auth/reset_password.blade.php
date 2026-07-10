@component('mail::message')
# Reset Your Password

Hello **{{ $user->name }}**,

You are receiving this email because we received a password reset request for your account.

@component('mail::button', ['url' => $url])
Reset Password
@endcomponent

This password reset link will expire in **{{ $count }} minutes**.

If you did not request a password reset, no further action is required.

---

## Secure Your Account
For your security, never share this link with anyone else. Our team will never ask for your password via email.

Thanks,<br>
**{{ config('app.name') }}**

@if(config('app.url'))
    <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
        <small style="color: #666;">
            If you're having trouble clicking the "Reset Password" button, copy and paste the URL below into your web
            browser:<br>
            [{{ $url }}]({{ $url }})
        </small>
    </div>
@endif
@endcomponent