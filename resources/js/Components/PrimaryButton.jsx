export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-lg border border-transparent bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 ease-in-out hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 shadow-lg shadow-primary/20 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
