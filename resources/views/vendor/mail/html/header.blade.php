@props(['url'])
<tr>
<td class="header" style="background: linear-gradient(135deg, #090b4e 0%, #0f172a 60%, #0d9488 100%); padding: 24px 32px; text-align: center; border-radius: 12px 12px 0 0;">
<a href="{{ $url }}" style="display: inline-block; text-decoration: none;">
<span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
{{ config('app.name', 'Worklance') }}
</span>
</a>
</td>
</tr>
