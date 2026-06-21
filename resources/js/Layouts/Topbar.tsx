import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { SharedProps } from '@/types';

interface Props {
    title?: string;
}

export default function Topbar({ title }: Props) {
    const { props } = usePage<SharedProps>();
    const user = props.auth.user;
    const [menuOpen, setMenuOpen] = useState(false);

    function logout() {
        router.post('/logout');
    }

    return (
        <header className="h-16 bg-[--color-sidebar] border-b border-[--color-border] flex items-center gap-4 px-6 flex-shrink-0">

            {title && (
                <h1 className="text-base font-semibold text-[--color-text] hidden md:block">{title}</h1>
            )}

            <div className="flex-1" />

            {/* Search */}
            <div className="relative hidden md:block">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[--color-text-muted] pointer-events-none" />
                <input
                    type="search"
                    placeholder="Search tickets…"
                    className="w-64 pl-9 pr-4 py-1.5 text-sm bg-[--color-bg] border border-[--color-border] rounded-lg focus:outline-none focus:border-primary-400 transition-colors"
                />
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-[--color-text-muted] hover:bg-[--color-bg] transition-colors" aria-label="Notifications">
                <BellIcon className="w-5 h-5" />
                {/* Badge wired in P12-02 */}
            </button>

            {/* User dropdown */}
            {user && (
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen(v => !v)}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[--color-bg] transition-colors"
                        aria-expanded={menuOpen}
                        aria-haspopup="true"
                    >
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="hidden md:block text-sm font-medium text-[--color-text]">{user.name}</span>
                    </button>

                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[--color-border] rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                                <div className="px-4 py-2 border-b border-[--color-border]">
                                    <p className="text-xs font-medium text-[--color-text] truncate">{user.name}</p>
                                    <p className="text-xs text-[--color-text-muted] truncate">{user.email}</p>
                                </div>
                                <Link
                                    href="/profile"
                                    className="flex items-center px-4 py-2 text-sm text-[--color-text] hover:bg-[--color-bg] transition-colors"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Profile
                                </Link>
                                <Link
                                    href="/settings/security"
                                    className="flex items-center px-4 py-2 text-sm text-[--color-text] hover:bg-[--color-bg] transition-colors"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Security
                                </Link>
                                <hr className="my-1 border-[--color-border]" />
                                <button
                                    onClick={logout}
                                    className="w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                                >
                                    Sign out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}
