import React from 'react';

/**
 * High-fidelity Avatar component with photo display and fallback logic.
 * 
 * @param {string} src - The image source URL.
 * @param {string} name - The name to generate a fallback initial from.
 * @param {string} size - The size of the avatar (xs, sm, md, lg, xl).
 * @param {string} className - Additional CSS classes.
 */
export default function Avatar({ src, name = 'User', size = 'md', className = '' }) {
    const getInitials = (userName) => {
        if (!userName) return 'U';
        return userName.charAt(0).toUpperCase();
    };

    const sizeClasses = {
        xs: 'h-6 w-6 text-[10px]',
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-16 w-16 text-xl',
        xl: 'h-24 w-24 text-3xl',
        '2xl': 'h-32 w-32 text-4xl'
    };

    const selectedSize = sizeClasses[size] || sizeClasses.md;

    if (src) {
        return (
            <div className={`relative flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 ring-2 ring-white shadow-sm ${selectedSize} ${className}`}>
                <img
                    src={(src.startsWith('http') || src.startsWith('blob:')) ? src : `/storage/${src}`}
                    alt={name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.parentNode.classList.add('flex', 'items-center', 'justify-center', 'bg-gradient-to-br', 'from-indigo-500', 'to-blue-600');
                        const span = document.createElement('span');
                        span.className = 'font-black text-white';
                        span.innerText = getInitials(name);
                        e.target.parentNode.appendChild(span);
                    }}
                />
            </div>
        );
    }

    return (
        <div className={`relative flex-shrink-0 flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-blue-600 to-violet-700 shadow-lg shadow-indigo-100 ring-2 ring-white ${selectedSize} ${className}`}>
            <span className="font-black text-white leading-none">
                {getInitials(name)}
            </span>
        </div>
    );
}
