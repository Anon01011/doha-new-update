import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiChevronDown, FiChevronUp, FiX, FiArrowRight } from 'react-icons/fi';

export default function FormErrorNotification({
    errors = {},
    isOpen = false,
    onClose,
    onNavigateTab,
    fieldTabMap = {},
}) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [visible, setVisible] = useState(isOpen);

    useEffect(() => {
        setVisible(isOpen);
        if (isOpen) {
            setIsExpanded(true);
        }
    }, [isOpen]);

    const errorEntries = Object.entries(errors).filter(([_, msg]) => Boolean(msg));

    if (!visible || errorEntries.length === 0) {
        return null;
    }

    const formatFieldName = (key) => {
        return key
            .replace(/_id$/i, '')
            .replace(/_ids$/i, 's')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    };

    const handleItemClick = (key) => {
        if (onNavigateTab && fieldTabMap[key]) {
            onNavigateTab(fieldTabMap[key]);
        }
    };

    return (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-rose-200 shadow-2xl shadow-rose-500/10 overflow-hidden">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                            <FiAlertCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-xs font-bold uppercase tracking-wider truncate">
                                Submission Errors ({errorEntries.length})
                            </h4>
                            <p className="text-[11px] text-rose-100 font-normal truncate">
                                Please correct the highlighted fields
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
                            title={isExpanded ? "Collapse notification" : "Expand notification"}
                        >
                            {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setVisible(false);
                                if (onClose) onClose();
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
                            title="Dismiss notification"
                        >
                            <FiX className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                    <div className="p-4 max-h-72 overflow-y-auto space-y-2 bg-slate-50/50">
                        <p className="text-[11px] text-slate-500 font-medium px-1">
                            Click any item below to jump to that section:
                        </p>
                        <div className="space-y-1.5">
                            {errorEntries.map(([key, message]) => {
                                const targetTab = fieldTabMap[key];
                                return (
                                    <div
                                        key={key}
                                        onClick={() => handleItemClick(key)}
                                        className={`p-2.5 rounded-xl border border-rose-100 bg-white hover:bg-rose-50/60 transition-all text-left flex items-start gap-2.5 ${
                                            targetTab ? 'cursor-pointer group' : ''
                                        }`}
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[11px] font-bold text-slate-800">
                                                    {formatFieldName(key)}
                                                </span>
                                                {targetTab && (
                                                    <span className="text-[9px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 flex items-center gap-1 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                                        Go to {targetTab} <FiArrowRight className="w-2.5 h-2.5" />
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-rose-600 font-normal mt-0.5 leading-snug">
                                                {Array.isArray(message) ? message[0] : message}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
