import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Synchronize CSRF token with axios and meta tag on every Inertia navigation
router.on('finish', (event) => {
    const csrfToken = event.detail.page?.props?.csrf_token;
    if (csrfToken) {
        // Update meta tag
        const meta = document.head.querySelector('meta[name="csrf-token"]');
        if (meta) meta.content = csrfToken;

        // Update axios header
        if (window.axios) {
            window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
        }
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

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
