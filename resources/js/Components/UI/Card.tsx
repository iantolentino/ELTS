import { ReactNode } from 'react';

interface Props {
    children:   ReactNode;
    header?:    ReactNode;
    footer?:    ReactNode;
    className?: string;
    padding?:   boolean;
}

export default function Card({ children, header, footer, className = '', padding = true }: Props) {
    return (
        <div className={`bg-white border border-[--color-border] rounded-xl shadow-sm overflow-hidden ${className}`}>
            {header && (
                <div className="px-5 py-4 border-b border-[--color-border]">
                    {header}
                </div>
            )}
            <div className={padding ? 'p-5' : ''}>
                {children}
            </div>
            {footer && (
                <div className="px-5 py-4 border-t border-[--color-border] bg-[--color-bg]">
                    {footer}
                </div>
            )}
        </div>
    );
}
