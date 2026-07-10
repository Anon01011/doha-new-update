<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        if (file_exists(public_path('hot'))) {
            return null;
        }

        if (file_exists($manifest = public_path('build/manifest.json'))) {
            return md5_file($manifest);
        }

        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        if ($user) {
            // Load roles if not already loaded
            if (!$user->relationLoaded('roles')) {
                $user->load('roles');
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'image' => $user->image ?: ($user->employee ? $user->employee->employee_image : null),
                    'role' => $user->role,
                    'employee_id' => $user->employee_id,
                    'roles' => $user->roles ? $user->roles->map(fn($role) => [
                        'id' => $role->id,
                        'name' => $role->name,
                        'slug' => $role->slug,
                    ])->toArray() : [],
                    'permissions' => $user ? $user->getAllPermissions()->map(fn($perm) => $perm->slug)->toArray() : [],
                    'employee' => $user->employee ? [
                        'id' => $user->employee->id,
                        'employee_image' => $user->employee->employee_image,
                    ] : null,
                    'todayAttendance' => $user->employee_id ? \App\Models\EmployeeAttendance::where('employee_id', $user->employee_id)->where('date', now()->toDateString())->first() : null,
                    'unreadNotifications' => $user ? $user->unreadNotifications()->get()->map(fn($n) => [
                        'id' => $n->id,
                        'data' => $n->data,
                        'created_at' => $n->created_at->diffForHumans(),
                        'read_at' => $n->read_at,
                    ]) : [],
                ] : null,
            ],
            'appSettings' => [
                'app_name' => \App\Models\Setting::get('app_name', config('app.name'), $user?->employee?->company_id),
                'app_logo' => \App\Models\Setting::get('app_logo', null, $user?->employee?->company_id),
                'favicon' => \App\Models\Setting::get('favicon', null, $user?->employee?->company_id),
                'company_stamp' => \App\Models\Setting::get('company_stamp', null, $user?->employee?->company_id),
                'currency' => \App\Models\Setting::get('currency', 'USD', $user?->employee?->company_id),
                'currency_symbol' => \App\Models\Setting::get('currency_symbol', '$', $user?->employee?->company_id),
                'theme_color' => \App\Models\Setting::get('theme_color', '#090b4e', $user?->employee?->company_id),
                'secondary_color' => \App\Models\Setting::get('secondary_color', '#103c7f', $user?->employee?->company_id),
                'accent_color' => \App\Models\Setting::get('accent_color', '#818cf8', $user?->employee?->company_id),
                'app_font' => \App\Models\Setting::get('app_font', 'Inter', $user?->employee?->company_id),
                'timezone' => config('app.timezone'),
                'salary_slip_stamp' => \App\Models\Setting::get('salary_slip_stamp', null, $user?->employee?->company_id),
                'salary_slip_show_photo' => \App\Models\Setting::get('salary_slip_show_photo', '1', $user?->employee?->company_id) === '1' || \App\Models\Setting::get('salary_slip_show_photo', '1', $user?->employee?->company_id) === true,
                'salary_slip_show_charts' => \App\Models\Setting::get('salary_slip_show_charts', '1', $user?->employee?->company_id) === '1' || \App\Models\Setting::get('salary_slip_show_charts', '1', $user?->employee?->company_id) === true,
            ],
            'csrf_token' => csrf_token(),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }
}
