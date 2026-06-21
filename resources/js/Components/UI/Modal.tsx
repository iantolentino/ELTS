import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

type Size = 'sm' | 'md' | 'lg' | 'xl';

interface Props {
    open:       boolean;
    onClose:    () => void;
    title?:     string;
    children:   ReactNode;
    footer?:    ReactNode;
    size?:      Size;
}

const sizeCls: Record<Size, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
};

export default function Modal({ open, onClose, title, children, footer, size = 'md' }: Props) {
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className={`relative bg-white rounded-2xl shadow-xl w-full ${sizeCls[size]} max-h-[90vh] flex flex-col`}>

                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[--color-border] flex-shrink-0">
                        <h2 className="text-base font-semibold text-[--color-text]">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg text-[--color-text-muted] hover:bg-[--color-bg] transition-colors"
                            aria-label="Close"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-[--color-border] flex items-center justify-end gap-3 flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
