import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { setAppTimezone } from '@/helpers/dateHelpers';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Synchronize CSRF token and timezone with axios, meta tag, and dateHelpers on every Inertia navigation
router.on('finish', (event) => {
    const pageProps = event.detail.page?.props;
    const csrfToken = pageProps?.csrf_token;
    if (csrfToken) {
        // Update meta tag
        const meta = document.head.querySelector('meta[name="csrf-token"]');
        if (meta) meta.content = csrfToken;

        // Update axios header
        if (window.axios) {
            window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
        }
    }

    const tz = pageProps?.appSettings?.timezone || pageProps?.appSettings?.app_timezone;
    if (tz) {
        setAppTimezone(tz);
    }
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        const tz = props.initialPage?.props?.appSettings?.timezone || props.initialPage?.props?.appSettings?.app_timezone;
        if (tz) {
            setAppTimezone(tz);
        }

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
