import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface Props {
    children: React.ReactNode;
    title?: string;
}

function FlashToast() {
    const { props } = usePage<SharedProps>();
    const { flash } = props;
    const [visible, setVisible] = useState(false);
    const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (flash.success) {
            setMsg({ text: flash.success, type: 'success' });
            setVisible(true);
            const t = setTimeout(() => setVisible(false), 4000);
            return () => clearTimeout(t);
        }
        if (flash.error) {
            setMsg({ text: flash.error, type: 'error' });
            setVisible(true);
            const t = setTimeout(() => setVisible(false), 5000);
            return () => clearTimeout(t);
        }
    }, [flash.success, flash.error]);

    if (!visible || !msg) return null;

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm animate-in slide-in-from-bottom-2 ${msg.type === 'success' ? 'bg-success-500 text-white' : 'bg-danger-500 text-white'}`}>
            <span>{msg.text}</span>
            <button onClick={() => setVisible(false)} className="ml-2 opacity-75 hover:opacity-100 text-base leading-none">✕</button>
        </div>
    );
}

export default function AppLayout({ children, title }: Props) {
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try { return localStorage.getItem('sidebar-collapsed') === 'true'; }
        catch { return false; }
    });

    function toggleSidebar() {
        setCollapsed(prev => {
            const next = !prev;
            try { localStorage.setItem('sidebar-collapsed', String(next)); } catch {}
            return next;
        });
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[--color-bg]">
            <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />

            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <Topbar title={title} />

                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>

            <FlashToast />
        </div>
    );
}
