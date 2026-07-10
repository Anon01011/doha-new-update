import React from 'react';
import Select from 'react-select';

export default function SearchableSelect({
    id,
    name,
    value,
    options,
    onChange,
    placeholder = 'Select an option...',
    className = '',
    isClearable = true,
    isDisabled = false,
    isMulti = false,
    ...props
}) {
    // Find the current selected option object(s)
    let selectedOption = null;
    if (isMulti) {
        const values = Array.isArray(value)
            ? value
            : (value ? String(value).split(',') : []);
        selectedOption = options?.filter(opt => values.some(v => String(v) == String(opt.value))) || [];
    } else {
        selectedOption = options?.find(opt => opt.value == value) || null;
    }

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: '#f8fafc', // slate-50
            border: state.isFocused ? '1px solid #6366f1' : '1px solid transparent', // indigo-500 or transparent
            borderRadius: '1rem', // rounded-lg
            padding: '4px',
            boxShadow: state.isFocused ? '0 0 0 4px rgba(99, 102, 241, 0.1)' : 'none',
            '&:hover': {
                backgroundColor: '#ffffff',
            },
            transition: 'all 300ms ease',
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            border: '1px solid #e2e8f0', // slate-200
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected 
                ? '#4f46e5' // indigo-600 
                : state.isFocused 
                ? '#e0e7ff' // indigo-100 
                : 'transparent',
            color: state.isSelected 
                ? 'white' 
                : state.isFocused 
                ? '#3730a3' // indigo-800
                : '#334155', // slate-700
            padding: '10px 16px',
            cursor: 'pointer',
            fontSize: '0.875rem', // text-sm
            fontWeight: state.isSelected ? '600' : '500',
            '&:active': {
                backgroundColor: '#4338ca', // indigo-700
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#334155', // slate-700
            fontWeight: '600',
            fontSize: '0.875rem',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#cbd5e1', // slate-300
            fontSize: '0.875rem',
        }),
        input: (provided) => ({
            ...provided,
            color: '#334155', // slate-700
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
                    // We simulate standard event structure to match existing onChange handlers
                    const finalValue = isMulti
                        ? (option ? option.map(opt => opt.value) : [])
                        : (option ? option.value : '');

                    const event = {
                        target: {
                            name,
                            value: finalValue,
                        }
                    };
                    onChange(event);
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
