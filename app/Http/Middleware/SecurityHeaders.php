<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Foundation\Vite;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * SecurityHeaders middleware
 *
 * Adds HTTP security headers to every response to protect against:
 *  - Clickjacking (X-Frame-Options)
 *  - MIME sniffing (X-Content-Type-Options)
 *  - XSS (X-XSS-Protection)
 *  - Information leakage (Referrer-Policy)
 *  - Protocol downgrade (Strict-Transport-Security - only over HTTPS)
 *  - Permissions policy (camera, mic, geolocation)
 *  - Content injection (Content-Security-Policy)
 */
class SecurityHeaders
{
    /**
     * The Content-Security-Policy applied to every response.
     *
     * Kept permissive enough for the Inertia + Vite build (inline bootstrap
     * script, style injection for the theme) while still blocking the
     * high-impact vectors: inline event handlers, plugins, framing by third
     * parties and base-tag hijacking.
     *
     * `style-src` allows https://fonts.googleapis.com and `font-src` allows
     * https://fonts.gstatic.com because resources/views/app.blade.php loads
     * the configured webfont (Poppins/Inter/Roboto/Nunito/Outfit) from those
     * origins. Without them the browser blocks the stylesheet and the app
     * silently falls back to a system font.
     */
    public const CSP = "default-src 'self'; ".
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; ".
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ".
        "img-src 'self' data: blob: https://www.transparenttextures.com; ".
        "font-src 'self' data: https://fonts.gstatic.com; ".
        "connect-src 'self'; ".
        "object-src 'none'; ".
        "base-uri 'self'; ".
        "form-action 'self'; ".
        "frame-ancestors 'self'";

    /**
     * Build the Content-Security-Policy for the current request.
     *
     * While the Vite dev server is running (`public/hot` present) the app
     * assets and the HMR websocket are served from a different origin than
     * the application itself, so that origin has to be allowed explicitly
     * in `script-src` and `connect-src`. Without it the whole front end
     * fails to boot in local development.
     *
     * The dev-server origin is never added in production because
     * `public/hot` does not exist once the production bundle is built, so
     * the deployed policy stays strict.
     */
    private function buildCsp(): string
    {
        $origins = $this->devServerOrigin();

        if ($origins === null) {
            return self::CSP;
        }

        $wsOrigins = $this->websocketOrigins($origins);

        return "default-src 'self'; ".
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' {$origins}; ".
            "style-src 'self' 'unsafe-inline' {$origins} https://fonts.googleapis.com; ".
            "img-src 'self' data: blob: https://www.transparenttextures.com; ".
            "font-src 'self' data: https://fonts.gstatic.com; ".
            "connect-src 'self' {$origins} {$wsOrigins}; ".
            "object-src 'none'; ".
            "base-uri 'self'; ".
            "form-action 'self'; ".
            "frame-ancestors 'self'";
    }

    /**
     * Derive the websocket origins that match http(s) dev-server origins.
     */
    private function websocketOrigins(string $origins): string
    {
        $wsList = [];
        foreach (explode(' ', $origins) as $origin) {
            if (str_starts_with($origin, 'https://')) {
                $wsList[] = 'wss://' . substr($origin, strlen('https://'));
            } elseif (str_starts_with($origin, 'http://')) {
                $wsList[] = 'ws://' . substr($origin, strlen('http://'));
            }
        }
        return implode(' ', array_unique($wsList));
    }

    /**
     * Reduce the Vite dev-server URL to valid scheme://host:port origins.
     * Normalizes IPv6 loopback [::1] to 127.0.0.1 and localhost to satisfy browser CSP parsers.
     */
    private function devServerOrigin(): ?string
    {
        try {
            $vite = app(Vite::class);

            if (! $vite->isRunningHot()) {
                return null;
            }

            $hotUrl = trim((string) @file_get_contents($vite->hotFile()));
        } catch (\Throwable $e) {
            return null;
        }

        if ($hotUrl === '') {
            return null;
        }

        // MED-05: strict character allowlist before the origin enters the CSP header
        if (! preg_match('/^https?:\/\/(\[?[a-fA-F0-9:.\]a-zA-Z0-9_\-]+\]?)(:\d{1,5})?$/', $hotUrl)) {
            return null;
        }

        $parts = parse_url($hotUrl);
        if ($parts === false || empty($parts['scheme']) || empty($parts['host'])) {
            return null;
        }

        $scheme = strtolower($parts['scheme']);

        if (! in_array($scheme, ['http', 'https'], true)) {
            return null;
        }

        $host = $parts['host'];
        // Chrome CSP parser flags literal bracketed IPv6 [::1] as invalid source syntax; normalize to 127.0.0.1
        if ($host === '[::1]' || $host === '::1') {
            $host = '127.0.0.1';
        }

        $portSuffix = ! empty($parts['port']) ? ':' . $parts['port'] : '';
        $primaryOrigin = $scheme . '://' . $host . $portSuffix;

        // Allow both 127.0.0.1 and localhost on the dev port
        $allowed = array_unique([
            $primaryOrigin,
            $scheme . '://127.0.0.1' . $portSuffix,
            $scheme . '://localhost' . $portSuffix,
        ]);

        return implode(' ', $allowed);
    }

    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        // Prevent the page from being loaded in a frame/iframe (clickjacking)
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // Prevent MIME-type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Enable browser XSS filter (legacy browsers)
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Control how much referrer information is sent
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Restrict browser feature access
        $response->headers->set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=()'
        );

        // LOW-02: Content-Security-Policy as defence in depth. This is the only
        // browser-side mitigation for any XSS that manages to slip through the
        // application-level output encoding.
        if (!$response->headers->has('Content-Security-Policy')) {
            $response->headers->set('Content-Security-Policy', $this->buildCsp());
        }

        // Only set HSTS when running over HTTPS
        if ($request->isSecure()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains'
            );
        }

        // Remove server information headers that leak stack details
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        return $response;
    }
}