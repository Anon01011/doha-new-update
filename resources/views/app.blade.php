<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">

    <title inertia>{{ \App\Models\Setting::get('app_name', config('app.name', 'Laravel')) }}</title>

    @php
        $favicon = \App\Models\Setting::get('favicon');
        $themeColor = \App\Models\Setting::get('theme_color', '#090b4e');
        $secondaryColor = \App\Models\Setting::get('secondary_color', '#103c7f');
        $accentColor = \App\Models\Setting::get('accent_color', '#818cf8');
        $appFont = \App\Models\Setting::get('app_font', 'Inter');

        $fontConfigs = [
            'Inter' => 'Inter:wght@300;400;500;600;700;800;900',
            'Roboto' => 'Roboto:wght@300;400;500;700;900',
            'Poppins' => 'Poppins:wght@300;400;500;600;700;800;900',
            'Nunito' => 'Nunito:wght@300;400;500;600;700;800;900',
            'Outfit' => 'Outfit:wght@300;400;500;600;700;800;900',
        ];
        $fontLoadQuery = $fontConfigs[$appFont] ?? $fontConfigs['Inter'];
    @endphp
    @if($favicon)
        <link rel="icon" type="image/x-icon" href="{{ asset('storage/' . $favicon) }}">
    @else
        <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    @endif

    <style>
        :root {
            --primary-color: {{ $themeColor }};
            --secondary-color: {{ $secondaryColor }};
            --accent-color: {{ $accentColor }};
            --app-font-family: '{{ $appFont }}', sans-serif;
        }
        
        body, .font-sans { 
            font-family: var(--app-font-family) !important; 
            font-weight: 400;
        }

        /* Proper weight for headings and titles */
        h1, h2, h3, h4, h5, h6, 
        .title, .heading, .card-title,
        [class*="text-lg"], [class*="text-xl"], [class*="text-2xl"], [class*="text-3xl"] {
            font-weight: 600 !important;
            letter-spacing: -0.01em;
        }

        /* Exceptions for inputs and small labels */
        input, select, textarea, label, .text-xs, .text-sm {
            font-weight: 400 !important;
        }

        .bg-indigo-600, .bg-purple-600, .bg-blue-600, .bg-indigo-500, .bg-purple-500, .bg-blue-500, .bg-indigo-700, .bg-purple-700, .bg-blue-700, .bg-primary, .hover\:bg-primary:hover, .bg-slate-900, .bg-gray-900, .hover\:bg-slate-800:hover, .hover\:bg-gray-800:hover { background-color: var(--primary-color) !important; color: white !important; }
        .text-indigo-600, .text-purple-600, .text-blue-600, .text-indigo-500, .text-purple-500, .text-blue-500, .text-indigo-700, .text-purple-700, .text-blue-700, .text-primary { color: var(--primary-color) !important; }
        .border-indigo-600, .border-purple-600, .border-blue-600, .border-indigo-500, .border-purple-500, .border-blue-500, .border-primary { border-color: var(--primary-color) !important; }
        .ring-primary, .focus\:ring-primary:focus, .ring-indigo-500, .focus\:ring-indigo-500:focus, .ring-blue-600, .focus\:ring-blue-600:focus, .ring-slate-900, .focus\:ring-slate-900:focus { --tw-ring-color: var(--primary-color) !important; }
        
        /* Enforce white icons on all colored/theme backgrounds */
        .bg-primary svg, .bg-indigo-600 svg, .bg-purple-600 svg, .bg-blue-600 svg, 
        .bg-emerald-600 svg, .bg-rose-600 svg, .bg-amber-600 svg, .bg-indigo-500 svg, 
        .bg-emerald-500 svg, .bg-rose-500 svg, .bg-amber-500 svg,
        .bg-slate-900 svg, .bg-gray-900 svg, .bg-indigo-700 svg, .bg-emerald-700 svg,
        .hover\:bg-primary:hover svg, .hover\:bg-indigo-600:hover svg, .hover\:bg-indigo-700:hover svg,
        .hover\:bg-emerald-600:hover svg, .hover\:bg-rose-600:hover svg,
        .group:hover .group-hover\:bg-primary svg, .group:hover .group-hover\:bg-indigo-600 svg {
            color: white !important;
            stroke: white !important;
        }

        .bg-primary-light { background-color: color-mix(in srgb, var(--primary-color), white 90%) !important; }

        /* Force white buttons on primary/theme backgrounds */
        .bg-primary button.bg-primary, .bg-primary a.bg-primary,
        .bg-primary button.bg-indigo-600, .bg-primary a.bg-indigo-600,
        .bg-slate-900 button.bg-primary, .bg-slate-900 a.bg-primary,
        .bg-slate-900 button.bg-slate-900, .bg-slate-900 a.bg-slate-900,
        .bg-primary .bg-white\/10:not(svg), .bg-slate-900 .bg-white\/10:not(svg) {
            background-color: white !important;
            color: var(--primary-color) !important;
            border-color: white !important;
        }
        
        /* Ensure icons inside forced white buttons take the primary color */
        .bg-primary .bg-white svg, .bg-slate-900 .bg-white svg,
        .bg-primary button.bg-white svg, .bg-primary a.bg-white svg,
        .bg-slate-900 button.bg-white svg, .bg-slate-900 a.bg-white svg {
            color: var(--primary-color) !important;
            stroke: var(--primary-color) !important;
        }
        .text-primary-dark { color: color-mix(in srgb, var(--primary-color), black 20%) !important; }
        
        .bg-secondary { background-color: var(--secondary-color) !important; }
        .text-secondary { color: var(--secondary-color) !important; }
        
        .bg-accent { background-color: var(--accent-color) !important; }
        .text-accent { color: var(--accent-color) !important; }

        .from-indigo-600, .from-purple-600, .from-blue-600, .from-indigo-500, .from-purple-500, .from-blue-500 { --tw-gradient-from: var(--primary-color) !important; --tw-gradient-to: var(--primary-color) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
        .to-indigo-600, .to-purple-600, .to-blue-600, .to-indigo-700, .to-purple-700, .to-blue-700 { --tw-gradient-to: var(--primary-color) !important; }
        .hover\:bg-indigo-700:hover, .hover\:bg-purple-700:hover, .hover\:bg-blue-700:hover { background-color: var(--primary-color) !important; filter: brightness(0.9); }
        .focus\:ring-indigo-500:focus, .focus\:ring-purple-500:focus, .focus\:ring-blue-500:focus { --tw-ring-color: var(--primary-color) !important; }
        .shadow-indigo-100, .shadow-purple-100, .shadow-blue-100 { --tw-shadow-color: color-mix(in srgb, var(--primary-color), transparent 80%) !important; }
        .shadow-indigo-200, .shadow-purple-200, .shadow-blue-200 { --tw-shadow-color: color-mix(in srgb, var(--primary-color), transparent 60%) !important; }
    </style>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family={{ $fontLoadQuery }}&display=swap" rel="stylesheet">

    <!-- Scripts -->
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>