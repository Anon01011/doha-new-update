import React, { useState, useEffect, useRef } from 'react';
import Checkbox from '@/Components/Checkbox';
import { FiChevronDown } from 'react-icons/fi';

export default function MultiCheckboxSelect({
    value = [],
    options = [],
    onChange,
    placeholder = 'Select options...',
    className = ''
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedValues = Array.isArray(value) ? value.map(String) : [];

    const handleToggleOption = (optValue) => {
        const strVal = String(optValue);
        let newValue;
        if (selectedValues.includes(strVal)) {
            newValue = selectedValues.filter(v => v !== strVal);
        } else {
            newValue = [...selectedValues, strVal];
        }
        onChange({ target: { value: newValue } });
    };

    const handleSelectAll = () => {
        if (selectedValues.length === options.length) {
            onChange({ target: { value: [] } });
        } else {
            onChange({ target: { value: options.map(o => String(o.value)) } });
        }
    };

    // Text to display on the button
    let buttonText = placeholder;
    if (selectedValues.length > 0) {
        if (selectedValues.length === options.length) {
            buttonText = 'All Selected';
        } else {
            const selectedLabels = options
                .filter(o => selectedValues.includes(String(o.value)))
                .map(o => o.label);
            buttonText = selectedLabels.join(', ');
            if (buttonText.length > 25) {
                buttonText = `${selectedValues.length} Selected`;
            }
        }
    }

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 hover:bg-white transition-all text-left font-normal"
            >
                <span className="truncate max-w-[90%] font-normal text-slate-700">
                    {buttonText}
                </span>
                <FiChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl p-3 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-sm font-normal text-slate-700">
                        <Checkbox
                            checked={options.length > 0 && selectedValues.length === options.length}
                            onChange={handleSelectAll}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-semibold text-slate-800">Select All</span>
                    </label>

                    <div className="h-px bg-slate-100 my-1.5" />

                    <div className="space-y-1.5">
                        {options.map(opt => {
                            const isChecked = selectedValues.includes(String(opt.value));
                            return (
                                <label
                                    key={opt.value}
                                    className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-sm font-normal text-slate-600 transition-colors"
                                >
                                    <Checkbox
                                        checked={isChecked}
                                        onChange={() => handleToggleOption(opt.value)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="truncate font-medium">{opt.label}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
