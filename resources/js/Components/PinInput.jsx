import React, { useRef, useEffect } from 'react';

/**
 * 6-Digit Numeric PIN Input Component
 * Supports auto-focus, paste, keyboard arrows, backspace, masking, and configurable sizes.
 */
export default function PinInput({
    value = '',
    onChange,
    length = 6,
    disabled = false,
    autoFocus = true,
    masked = true,
    error = false,
    size = 'md', // 'sm' | 'md' | 'lg'
    className = '',
}) {
    const inputRefs = useRef([]);

    // Split value into array of individual characters
    const digits = (value || '').padEnd(length, '').slice(0, length).split('');

    useEffect(() => {
        if (autoFocus && inputRefs.current[0] && !disabled) {
            inputRefs.current[0].focus();
        }
    }, [autoFocus, disabled]);

    const handleDigitChange = (index, char) => {
        if (disabled) return;

        // Ensure character is numeric
        if (char && !/^[0-9]$/.test(char)) return;

        const newDigits = [...digits];
        newDigits[index] = char;
        const newValue = newDigits.join('').replace(/\s/g, '');

        if (onChange) {
            onChange(newValue);
        }

        // Auto-advance to next input if digit entered
        if (char && index < length - 1 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus();
            inputRefs.current[index + 1].select();
        }
    };

    const handleKeyDown = (index, e) => {
        if (disabled) return;

        if (e.key === 'Backspace') {
            e.preventDefault();
            const newDigits = [...digits];
            if (newDigits[index]) {
                newDigits[index] = '';
                if (onChange) onChange(newDigits.join('').replace(/\s/g, ''));
            } else if (index > 0 && inputRefs.current[index - 1]) {
                newDigits[index - 1] = '';
                if (onChange) onChange(newDigits.join('').replace(/\s/g, ''));
                inputRefs.current[index - 1].focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            e.preventDefault();
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        if (disabled) return;

        const pastedData = e.clipboardData.getData('text/plain').trim();
        const numericOnly = pastedData.replace(/\D/g, '').slice(0, length);

        if (numericOnly.length > 0 && onChange) {
            onChange(numericOnly);
            const nextFocusIndex = Math.min(numericOnly.length, length - 1);
            inputRefs.current[nextFocusIndex]?.focus();
        }
    };

    // Size variants
    const sizeClasses = {
        sm: 'w-8 h-9.5 sm:w-8.5 sm:h-10 text-base font-semibold rounded-md border border-slate-200',
        md: 'w-9 h-10.5 sm:w-9.5 sm:h-11 text-lg font-semibold rounded-md border border-slate-200',
        lg: 'w-10.5 h-12 sm:w-11 sm:h-13 text-xl font-bold rounded-lg border-2 border-slate-200',
    }[size] || 'w-8.5 h-10 text-base font-semibold rounded-md border border-slate-200';

    const gapClass = size === 'sm' ? 'gap-1.5' : size === 'lg' ? 'gap-2.5' : 'gap-2';

    return (
        <div className={`flex items-center justify-center ${gapClass} ${className}`}>
            {Array.from({ length }).map((_, idx) => {
                const char = digits[idx] || '';
                const isFilled = char !== '';

                return (
                    <input
                        key={idx}
                        ref={(el) => (inputRefs.current[idx] = el)}
                        type={masked ? 'password' : 'text'}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={char}
                        disabled={disabled}
                        onChange={(e) => handleDigitChange(idx, e.target.value.slice(-1))}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onPaste={handlePaste}
                        onFocus={(e) => e.target.select()}
                        className={`${sizeClasses} text-center font-bold tracking-widest transition-all duration-150 outline-none
                            ${error
                                ? 'border-red-400 bg-red-50 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                                : isFilled
                                    ? 'border-indigo-500 bg-indigo-50/50 text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-sm'
                                    : 'border-slate-200 bg-slate-50/60 hover:bg-white text-slate-800 hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}
                            ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'cursor-text'}
                        `}
                        aria-label={`Digit ${idx + 1}`}
                    />
                );
            })}
        </div>
    );
}
