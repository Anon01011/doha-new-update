import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // Exposed as an RGB channel triplet so Tailwind opacity modifiers
                // (e.g. bg-primary/10, shadow-primary/20) compile and work.
                // The layout sets --primary-rgb alongside --primary-color; the
                // fallback keeps a sane value when it is unavailable.
                primary: 'rgb(var(--primary-rgb, 9, 11, 78) / <alpha-value>)',
                secondary: 'var(--secondary-color)',
                accent: 'var(--accent-color)',
            },
        },
    },

    plugins: [forms],
};
