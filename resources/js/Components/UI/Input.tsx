import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
    label?:  string;
    error?:  string;
    hint?:   string;
    prefix?: ReactNode;
    suffix?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, Props>(
    ({ label, error, hint, prefix, suffix, className = '', id, ...props }, ref) => {
        const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

        return (
            <div className="flex flex-col gap-1">
                {label && (
                    <label htmlFor={inputId} className="text-sm font-medium text-[--color-text]">
                        {label}
                        {props.required && <span className="text-danger-500 ml-0.5">*</span>}
                    </label>
                )}

                <div className="relative flex items-center">
                    {prefix && (
                        <span className="absolute left-3 flex items-center text-[--color-text-muted] pointer-events-none">
                            {prefix}
                        </span>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={`w-full h-9 rounded-lg border text-sm bg-white transition-colors placeholder:text-[--color-text-subtle] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:bg-[--color-bg] disabled:cursor-not-allowed ${error ? 'border-danger-400' : 'border-[--color-border]'} ${prefix ? 'pl-9' : 'pl-3'} ${suffix ? 'pr-9' : 'pr-3'} ${className}`}
                        {...props}
                    />
                    {suffix && (
                        <span className="absolute right-3 flex items-center text-[--color-text-muted] pointer-events-none">
                            {suffix}
                        </span>
                    )}
                </div>

                {error  && <p className="text-xs text-danger-500">{error}</p>}
                {!error && hint && <p className="text-xs text-[--color-text-muted]">{hint}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
export default Input;
