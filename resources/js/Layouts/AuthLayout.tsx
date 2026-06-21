import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { TicketIcon } from '@heroicons/react/24/outline';
import type { SharedProps } from '@/types';

interface Props {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: Props) {
    const { props } = usePage<SharedProps>();
    const { flash } = props;
    const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (flash.success) setToast({ text: flash.success, type: 'success' });
        else if (flash.error) setToast({ text: flash.error, type: 'error' });
    }, [flash.success, flash.error]);

    return (
        <div className="min-h-screen bg-[--color-bg] flex flex-col items-center justify-center p-4">

            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                    <TicketIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-[--color-text]">Enterprise Ticketing</span>
            </div>

            {/* Card */}
            <div className="w-full max-w-md bg-white border border-[--color-border] rounded-2xl shadow-sm p-8">
                {(title || subtitle) && (
                    <div className="mb-6 text-center">
                        {title && <h1 className="text-xl font-semibold text-[--color-text]">{title}</h1>}
                        {subtitle && <p className="mt-1 text-sm text-[--color-text-muted]">{subtitle}</p>}
                    </div>
                )}

                {toast && (
                    <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between ${toast.type === 'success' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-600'}`}>
                        <span>{toast.text}</span>
                        <button onClick={() => setToast(null)} className="ml-3 opacity-60 hover:opacity-100 text-base leading-none">✕</button>
                    </div>
                )}

                {children}
            </div>

            <p className="mt-6 text-xs text-[--color-text-subtle]">
                © {new Date().getFullYear()} Enterprise Ticketing System
            </p>
        </div>
    );
}
