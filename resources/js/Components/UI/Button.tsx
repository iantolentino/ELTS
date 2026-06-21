import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size    = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    icon?: ReactNode;
}

const variants: Record<Variant, string> = {
    primary:   'bg-primary-600 text-white border border-transparent hover:bg-primary-700 focus-visible:ring-primary-500',
    secondary: 'bg-white text-[--color-text] border border-[--color-border] hover:bg-[--color-bg]',
    danger:    'bg-danger-500 text-white border border-transparent hover:bg-danger-600 focus-visible:ring-danger-400',
    ghost:     'bg-transparent text-[--color-text-muted] border border-transparent hover:bg-[--color-bg]',
};

const sizes: Record<Size, string> = {
    sm: 'h-7 px-3 text-xs gap-1.5',
    md: 'h-9 px-4 text-sm gap-2',
    lg: 'h-11 px-5 text-sm gap-2',
};

export default function Button({
    variant  = 'primary',
    size     = 'md',
    loading  = false,
    icon,
    children,
    className = '',
    disabled,
    ...props
}: Props) {
    return (
        <button
            {...props}
            disabled={disabled || loading}
            className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {loading ? (
                <svg className="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            ) : (
                icon && <span className="flex-shrink-0 flex items-center">{icon}</span>
            )}
            {children && <span>{children}</span>}
        </button>
    );
}
