import React, { useState, useEffect, useRef, useMemo } from 'react';
import Checkbox from '@/Components/Checkbox';
import { FiChevronDown, FiSearch, FiX } from 'react-icons/fi';

export default function MultiCheckboxSelect({
    name = '',
    label,
    icon: Icon,
    value = [],
    options = [],
    onChange,
    placeholder = 'Select options...',
    searchPlaceholder = 'Search options...',
    className = '',
    searchable = true,
    disabled = false,
    required = false,
    error,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    // Close on click outside and escape key
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Normalize value safely
    const selectedValues = useMemo(() => {
        if (!value) return [];
        if (Array.isArray(value)) return value.map(String);
        if (typeof value === 'object' && Array.isArray(value?.target?.value)) {
            return value.target.value.map(String);
        }
        if (typeof value === 'string') {
            return value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
        }
        if (typeof value === 'number') {
            return [String(value)];
        }
        return [];
    }, [value]);

    const filteredOptions = useMemo(() => {
        if (!Array.isArray(options)) return [];
        if (!searchTerm.trim()) return options;
        const lower = searchTerm.toLowerCase();
        return options.filter(opt => {
            const labelStr = typeof opt === 'object' ? String(opt.label || opt.name || '') : String(opt);
            return labelStr.toLowerCase().includes(lower);
        });
    }, [options, searchTerm]);

    const emitChange = (newValues) => {
        if (!onChange) return;
        // Always call onChange with the plain array as the primary argument.
        // This matches the Employee Create/Edit calling convention: onChange={(vals) => ...}
        onChange(newValues);
    };

    const handleToggleOption = (optValue) => {
        if (disabled) return;
        const strVal = String(optValue);
        let newValue;
        if (selectedValues.includes(strVal)) {
            newValue = selectedValues.filter(v => v !== strVal);
        } else {
            newValue = [...selectedValues, strVal];
        }
        emitChange(newValue);
    };

    const handleSelectAllFiltered = () => {
        if (disabled) return;
        const filteredValues = filteredOptions.map(o => typeof o === 'object' ? String(o.value) : String(o));
        const allFilteredSelected = filteredValues.length > 0 && filteredValues.every(val => selectedValues.includes(val));

        let newValue;
        if (allFilteredSelected) {
            // Deselect visible
            newValue = selectedValues.filter(v => !filteredValues.includes(v));
        } else {
            // Select all visible
            newValue = Array.from(new Set([...selectedValues, ...filteredValues]));
        }
        emitChange(newValue);
    };

    // Text to display on the button
    let buttonText = placeholder;
    if (selectedValues.length > 0) {
        if (options.length > 0 && selectedValues.length === options.length) {
            buttonText = 'All Selected';
        } else {
            const selectedLabels = options
                .filter(o => {
                    const optVal = typeof o === 'object' ? String(o.value) : String(o);
                    return selectedValues.includes(optVal);
                })
                .map(o => typeof o === 'object' ? (o.label || o.name || o.value) : o);

            if (selectedLabels.length > 0) {
                buttonText = selectedLabels.join(', ');
                if (buttonText.length > 32) {
                    buttonText = `${selectedValues.length} Selected`;
                }
            } else {
                buttonText = `${selectedValues.length} Selected`;
            }
        }
    }

    const isAllFilteredSelected = filteredOptions.length > 0 &&
        filteredOptions.every(o => {
            const optVal = typeof o === 'object' ? String(o.value) : String(o);
            return selectedValues.includes(optVal);
        });

    return (
        <div ref={containerRef} className={`relative w-full space-y-1.5 ${className}`}>
            {label && (
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    {Icon && <Icon className="w-3.5 h-3.5 text-blue-500" />}
                    <span>{label}</span>
                    {required && <span className="text-rose-500">*</span>}
                </label>
            )}

            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full min-h-[42px] flex items-center justify-between border rounded-xl px-3.5 py-2 text-sm transition-all text-left font-normal ${
                    disabled
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-80'
                        : error
                        ? 'bg-[#f8fafc] border-rose-300 text-slate-700 hover:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                        : isOpen
                        ? 'bg-white border-blue-500 ring-4 ring-blue-500/10 text-slate-700'
                        : 'bg-[#f8fafc] border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                }`}
            >
                <span className={`truncate max-w-[85%] ${selectedValues.length > 0 ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                    {buttonText}
                </span>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    {selectedValues.length > 0 && !disabled && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-md">
                            {selectedValues.length}
                        </span>
                    )}
                    <FiChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
                </div>
            </button>

            {error && (
                <p className="text-xs font-medium text-rose-500 mt-1">{error}</p>
            )}

            {isOpen && !disabled && (
                <div className="absolute left-0 right-0 z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 max-h-72 flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
                    {searchable && options.length > 4 && (
                        <div className="relative mb-2">
                            <FiSearch className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-0 outline-none transition-all"
                                autoFocus
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                                >
                                    <FiX className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 rounded-lg mb-1.5 text-xs text-slate-600">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <Checkbox
                                checked={isAllFilteredSelected}
                                onChange={handleSelectAllFiltered}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="font-semibold text-slate-700">
                                {isAllFilteredSelected ? 'Deselect All' : 'Select All'}
                            </span>
                        </label>
                        <span className="text-[11px] text-slate-400 font-medium">
                            {selectedValues.length} of {options.length}
                        </span>
                    </div>

                    <div className="space-y-0.5 overflow-y-auto max-h-48 pr-1 divide-y divide-slate-100/50">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => {
                                const optVal = typeof opt === 'object' ? String(opt.value) : String(opt);
                                const optLabel = typeof opt === 'object' ? (opt.label || opt.name || opt.value) : opt;
                                const isChecked = selectedValues.includes(optVal);
                                return (
                                    <label
                                        key={optVal}
                                        className={`flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer text-xs sm:text-sm text-slate-700 hover:bg-blue-50/60 transition-colors select-none ${
                                            isChecked ? 'bg-blue-50/50 text-blue-900 font-medium' : 'font-normal'
                                        }`}
                                    >
                                        <Checkbox
                                            checked={isChecked}
                                            onChange={() => handleToggleOption(optVal)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="truncate flex-1">{optLabel}</span>
                                    </label>
                                );
                            })
                        ) : (
                            <div className="py-4 text-center text-xs text-slate-400">
                                No matching options found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

