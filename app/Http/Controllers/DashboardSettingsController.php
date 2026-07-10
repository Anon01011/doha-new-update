<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardSettingsController extends Controller
{
    /**
     * Update the user's dashboard settings.
     */
    public function update(Request $request)
    {
        $request->validate([
            'settings' => 'required|array',
        ]);

        $user = Auth::user();
        $user->dashboard_settings = $request->settings;
        $user->save();

        return response()->json([
            'message' => 'Dashboard settings updated successfully.',
            'settings' => $user->dashboard_settings,
        ]);
    }
}
