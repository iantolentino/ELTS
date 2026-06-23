import { Link, usePage } from '@inertiajs/react';
import { TicketIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { SharedProps } from '@/types';

interface Props {
    children: React.ReactNode;
    title?: string;
}

export default function PublicLayout({ children, title }: Props) {
    const { props } = usePage<SharedProps>();
    const user = props.auth.user;

    return (
        <div className="min-h-screen bg-[--color-bg] flex flex-col">
            <header className="bg-[--color-sidebar] border-b border-[--color-border] sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2 text-[--color-text] hover:opacity-80 transition-opacity flex-shrink-0">
                        <div className="w-7 h-7 rounded-md bg-primary-600 flex items-center justify-center">
                            <TicketIcon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-sm">ELTS</span>
                    </Link>

                    {title && (
                        <span className="text-sm font-medium text-[--color-text-muted] hidden sm:block">{title}</span>
                    )}

                    <div className="flex items-center gap-3 ml-auto">
                        {user ? (
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                                <ArrowLeftIcon className="w-4 h-4" />
                                Dashboard
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="text-sm font-medium text-primary-600 hover:text-primary-700"
                            >
                                Sign in
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {children}
            </main>

            <footer className="border-t border-[--color-border] py-4 text-center text-xs text-[--color-text-subtle]">
                &copy; {new Date().getFullYear()} Enterprise Ticketing System
            </footer>
        </div>
    );
}
