import React, { useEffect } from 'react';

const Lightbox = ({ isOpen, onClose, src, title, type = 'auto' }) => {
    useEffect(() => {
        if (!isOpen) return;

        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isPdf = type?.includes('pdf') || src?.toLowerCase().endsWith('.pdf') || (src?.startsWith('blob:') && type?.includes('pdf'));
    const isImage = type?.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].some(ext => src?.toLowerCase().endsWith(ext)) || (src?.startsWith('blob:') && type?.includes('image'));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            ></div>

            {/* Content Container */}
            <div className="relative w-full h-full max-w-6xl bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <h3 className="text-lg font-bold text-gray-800 truncate pr-8">{title || 'Document View'}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors group"
                    >
                        <svg className="w-6 h-6 text-gray-500 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center p-4 md:p-12">
                    {isPdf ? (
                        <iframe
                            src={src}
                            className="w-full h-full border-none rounded-lg shadow-inner bg-white"
                            title={title}
                        />
                    ) : isImage ? (
                        <img
                            src={src}
                            alt={title}
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center space-y-6 p-12 bg-white rounded-lg shadow-xl border border-gray-200 max-w-md">
                            <div className="w-24 h-24 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shadow-inner">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-gray-800 uppercase tracking-tight">Preview Unavailable</h4>
                                <p className="text-gray-500 text-sm mt-2 font-medium leading-relaxed">
                                    This file type cannot be previewed directly in the browser. Please download it to view the contents.
                                </p>
                            </div>
                            <a
                                href={src}
                                download
                                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-200 active:scale-95"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download Now
                            </a>
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="px-6 py-3 border-t border-gray-100 bg-white flex justify-end gap-3">
                    <a
                        href={src}
                        download
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold shadow-md"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                    </a>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-bold"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Lightbox;
