<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class BrandingSettingsController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $companyId = $user->employee && $user->role !== 'admin' ? $user->employee->company_id : null;

        $settings = [
            'app_name' => Setting::get('app_name', config('app.name'), $companyId),
            'app_logo' => Setting::get('app_logo', null, $companyId),
            'favicon' => Setting::get('favicon', null, $companyId),
            'theme_color' => Setting::get('theme_color', '#4f46e5', $companyId),
        ];

        return Inertia::render('Settings/BrandingSettings', [
            'settings' => $settings
        ]);
    }

    public function update(Request $request)
    {
        $user = auth()->user();
        $companyId = $user->employee && $user->role !== 'admin' ? $user->employee->company_id : null;

        $request->validate([
            'app_name' => 'required|string|max:255',
            'logo' => 'nullable|image|mimes:png,jpg,jpeg,svg|max:2048',
            'favicon' => 'nullable|mimes:ico,png|max:512',
            'theme_color' => ['nullable', 'string', 'regex:@^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$@'],
        ]);

        // Update app name
        Setting::set('app_name', $request->app_name, 'branding', 'string', $companyId);

        // Handle logo upload
        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            $oldLogo = Setting::get('app_logo', null, $companyId);
            if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
                Storage::disk('public')->delete($oldLogo);
            }

            // Store new logo
            $logoPath = $request->file('logo')->store('branding', 'public');
            Setting::set('app_logo', $logoPath, 'branding', 'string', $companyId);
        }

        // Handle favicon upload
        if ($request->hasFile('favicon')) {
            // Delete old favicon if exists
            $oldFavicon = Setting::get('favicon', null, $companyId);
            if ($oldFavicon && Storage::disk('public')->exists($oldFavicon)) {
                Storage::disk('public')->delete($oldFavicon);
            }

            // Store new favicon
            $faviconPath = $request->file('favicon')->store('branding', 'public');
            Setting::set('favicon', $faviconPath, 'branding', 'string', $companyId);
        }

        // Update theme color
        Setting::set('theme_color', $request->theme_color ?: '#4f46e5', 'branding', 'string', $companyId);

        return back()->with('success', 'Branding settings updated successfully!');
    }

    public function deleteLogo()
    {
        $user = auth()->user();
        $companyId = $user->employee && $user->role !== 'admin' ? $user->employee->company_id : null;

        $logo = Setting::get('app_logo', null, $companyId);
        if ($logo && Storage::disk('public')->exists($logo)) {
            Storage::disk('public')->delete($logo);
        }

        Setting::where('key', 'app_logo')->where('company_id', $companyId)->delete();

        return back()->with('success', 'Logo deleted successfully!');
    }

    public function deleteFavicon()
    {
        $user = auth()->user();
        $companyId = $user->employee && $user->role !== 'admin' ? $user->employee->company_id : null;

        $favicon = Setting::get('favicon', null, $companyId);
        if ($favicon && Storage::disk('public')->exists($favicon)) {
            Storage::disk('public')->delete($favicon);
        }

        Setting::where('key', 'favicon')->where('company_id', $companyId)->delete();

        return back()->with('success', 'Favicon deleted successfully!');
    }
}
