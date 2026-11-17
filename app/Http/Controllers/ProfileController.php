<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'pinSecurity' => [
                'isEligible'     => $user->isPinEligible(),
                'hasPin'         => $user->hasPinConfigured(),
                'pinSetAt'       => $user->pin_set_at ? $user->pin_set_at->diffForHumans() : null,
                'isLocked'       => $user->isPinLocked(),
                'lockRemaining'  => $user->pinLockRemainingSeconds(),
                'trustedDevices' => $user->trustedDevices()
                    ->active()
                    ->orderBy('last_used_at', 'desc')
                    ->get(['id', 'device_name', 'device_type', 'ip_address', 'last_used_at', 'expires_at']),
            ],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        if ($request->hasFile('image')) {
            $user = $request->user();

            // Delete old user image if exists
            if ($user->image) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->image);
            }

            $path = $request->file('image')->store('user_images', 'public');
            $user->update(['image' => $path]);

            // Sync with employee image if exists
            if ($user->employee_id) {
                $employee = \App\Models\Employee::find($user->employee_id);
                if ($employee) {
                    if ($employee->employee_image) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($employee->employee_image);
                    }
                    $employee->update(['employee_image' => $path]);
                }
            }
        }

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
