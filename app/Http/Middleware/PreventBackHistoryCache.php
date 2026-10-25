<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

class PreventBackHistoryCache
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // SECURITY FIX #14: do not override the cache policy of a file download.
        //
        // This middleware exists to stop a browser from restoring a cached
        // copy of an authenticated HTML page when the user presses Back. That
        // risk does not apply to binary file responses, and blindly stamping
        // `no-store` over them broke the caching of the public branding assets
        // (logo / favicon) that the `/storage/{path}` route serves with an
        // explicit, deliberate `Cache-Control`.
        //
        // A BinaryFileResponse carries its own cache policy, so it is left
        // untouched.
        if ($response instanceof BinaryFileResponse) {
            return $response;
        }

        $response->headers->set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', 'Sun, 02 Jan 1990 00:00:00 GMT');

        return $response;
    }
}
