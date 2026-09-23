import React, { useMemo } from 'react';
import Select from 'react-select';

export default function SearchableSelect({
    id,
    name,
    value,
    options = [],
    onChange,
    placeholder = 'Select an option...',
    className = '',
    isClearable = true,
    isDisabled = false,
    isMulti = false,
    ...props
}) {
    // Flatten options if grouped for safe value resolution
    const flatOptions = useMemo(() => {
        if (!options || !Array.isArray(options)) return [];
        return options.flatMap(opt => (opt && opt.options ? opt.options : opt));
    }, [options]);

    // Find the current selected option object(s)
    let selectedOption = null;
    if (isMulti) {
        const values = Array.isArray(value)
            ? value.map(String)
            : (value !== null && value !== undefined && value !== '' ? String(value).split(',') : []);
        selectedOption = flatOptions.filter(opt => opt && values.includes(String(opt.value))) || [];
    } else {
        selectedOption = (value !== null && value !== undefined && value !== '')
            ? flatOptions.find(opt => opt && String(opt.value) === String(value)) || null
            : null;
    }

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: '#f8fafc', // slate-50
            border: state.isFocused ? '1px solid #3b82f6' : '1px solid #e2e8f0', // blue-500 or slate-200
            borderRadius: '0.75rem', // rounded-xl
            minHeight: '42px',
            padding: '2px 4px',
            boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : 'none',
            '&:hover': {
                backgroundColor: '#ffffff',
                borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1',
            },
            transition: 'all 200ms ease',
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: '0.75rem',
            overflow: 'hidden',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            border: '1px solid #e2e8f0', // slate-200
            backgroundColor: '#ffffff',
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        groupHeading: (provided) => ({
            ...provided,
            fontSize: '0.65rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            color: '#64748b',
            letterSpacing: '0.05em',
            padding: '6px 12px',
            backgroundColor: '#f1f5f9',
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected 
                ? '#2563eb' // blue-600 
                : state.isFocused 
                ? '#eff6ff' // blue-50 
                : 'transparent',
            color: state.isSelected 
                ? '#ffffff' 
                : state.isFocused 
                ? '#1e40af' // blue-800
                : '#334155', // slate-700
            padding: '8px 14px',
            cursor: 'pointer',
            fontSize: '0.875rem', // text-sm
            fontWeight: state.isSelected ? '600' : '400',
            '&:active': {
                backgroundColor: '#1d4ed8',
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#1e293b', // slate-800
            fontWeight: '500',
            fontSize: '0.875rem',
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: '#eff6ff',
            borderRadius: '0.375rem',
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: '#1e40af',
            fontSize: '0.75rem',
            fontWeight: '500',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#94a3b8', // slate-400
            fontSize: '0.875rem',
        }),
        input: (provided) => ({
            ...provided,
            color: '#1e293b',
            fontSize: '0.875rem',
        }),
        indicatorSeparator: () => ({
            display: 'none',
        }),
    };

    return (
        <div className={`relative ${className}`}>
            <Select
                inputId={id}
                name={name}
                value={selectedOption}
                options={options}
                isMulti={isMulti}
                onChange={(option) => {
                    const finalValue = isMulti
                        ? (option ? option.map(opt => opt.value) : [])
                        : (option ? option.value : '');

                    const event = {
                        target: {
                            name,
                            value: finalValue,
                        }
                    };
                    if (onChange) {
                        onChange(event);
                    }
                }}
                styles={customStyles}
                placeholder={placeholder}
                isClearable={isClearable}
                isDisabled={isDisabled}
                classNamePrefix="react-select"
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                {...props}
            />
        </div>
    );
}
