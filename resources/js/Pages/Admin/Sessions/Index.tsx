import { useEffect, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { MagnifyingGlassIcon, ComputerDesktopIcon, XMarkIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Card } from '@/Components/UI';
import type { PaginatedData } from '@/types';

interface SessionEntry {
    id:            string;
    user_id:       number | null;
    user_name:     string | null;
    user_email:    string | null;
    ip_address:    string | null;
    user_agent:    string | null;
    last_activity: number;
    is_current:    boolean;
}

interface Filters {
    search?:   string;
    per_page?: number;
}

interface Props {
    sessions:   PaginatedData<SessionEntry>;
    filters:    Filters;
    current_id: string;
}

function parseBrowser(ua: string | null): string {
    if (!ua) return '—';
    if (/Edg\//.test(ua))     return 'Edge';
    if (/OPR\//.test(ua))     return 'Opera';
    if (/Chrome\//.test(ua))  return 'Chrome';
    if (/Firefox\//.test(ua)) return 'Firefox';
    if (/Safari\//.test(ua))  return 'Safari';
    return ua.slice(0, 30);
}

function timeAgo(unix: number): string {
    const diff = Math.floor(Date.now() / 1000) - unix;
    if (diff < 60)    return 'Just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminSessionsIndex({ sessions, filters }: Props) {
    const [search,  setSearch]  = useState(filters.search   ?? '');
    const [perPage, setPerPage] = useState(filters.per_page ?? 25);

    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    function apply(overrides: Partial<Filters> = {}) {
        router.get('/admin/sessions', {
            search:   overrides.search   !== undefined ? overrides.search   : search,
            per_page: overrides.per_page !== undefined ? overrides.per_page : perPage,
            page:     1,
        }, { preserveState: true, replace: true });
    }

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => apply({ search }), 400);
        return () => clearTimeout(debounceRef.current);
    }, [search]);

    function forceLogout(id: string) {
        if (!confirm('Force-logout this session?')) return;
        router.delete(`/admin/sessions/${id}`, { preserveScroll: true });
    }

    return (
        <AppLayout>
            <Head title="Active Sessions" />
            <div className="p-6 space-y-4">

                <div>
                    <h1 className="text-xl font-semibold text-[--color-text]">Active Sessions</h1>
                    <p className="text-sm text-[--color-text-muted] mt-0.5">
                        All authenticated user sessions currently in the database.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search user, email, IP…"
                            className="w-full pl-9 pr-3 py-2 text-sm border border-[--color-border] rounded-lg bg-white text-[--color-text] placeholder-[--color-text-muted] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {search && (
                        <button
                            onClick={() => { setSearch(''); apply({ search: '' }); }}
                            className="text-sm text-primary-600 hover:underline"
                        >
                            Clear
                        </button>
                    )}

                    <div className="ml-auto flex items-center gap-2 text-sm text-[--color-text-muted]">
                        Show
                        <select
                            value={perPage}
                            onChange={e => { const v = Number(e.target.value); setPerPage(v); apply({ per_page: v }); }}
                            className="py-1.5 pl-2 pr-6 border border-[--color-border] rounded-lg bg-white text-[--color-text]"
                        >
                            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        per page
                    </div>
                </div>

                <Card padding={false}>
                    {sessions.data.length === 0 ? (
                        <p className="py-10 text-center text-sm text-[--color-text-muted]">No active sessions found.</p>
                    ) : (
                        <ul className="divide-y divide-[--color-border]">
                            {sessions.data.map(session => (
                                <li key={session.id} className={`flex items-center gap-4 px-4 py-3 ${session.is_current ? 'bg-primary-50/30' : ''}`}>
                                    <ComputerDesktopIcon className="w-7 h-7 text-[--color-text-muted] flex-shrink-0" />

                                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-y-0.5 gap-x-4">
                                        <div>
                                            <p className="text-sm font-medium text-[--color-text] truncate">
                                                {session.user_name ?? <span className="italic text-[--color-text-muted]">Unknown</span>}
                                            </p>
                                            <p className="text-xs text-[--color-text-muted] truncate">{session.user_email}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-mono text-[--color-text]">{session.ip_address ?? '—'}</p>
                                            <p className="text-xs text-[--color-text-muted]">{parseBrowser(session.user_agent)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {session.is_current
                                                ? <Badge variant="success" size="sm">Your session</Badge>
                                                : <span className="text-xs text-[--color-text-muted]">{timeAgo(session.last_activity)}</span>
                                            }
                                        </div>
                                    </div>

                                    {!session.is_current && (
                                        <button
                                            onClick={() => forceLogout(session.id)}
                                            title="Force logout"
                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-danger-600 border border-danger-200 hover:bg-danger-50 transition-colors flex-shrink-0"
                                        >
                                            <XMarkIcon className="w-3.5 h-3.5" />
                                            Force logout
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                {/* Pagination */}
                {sessions.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-[--color-text-muted]">
                        <span>Showing {sessions.from}–{sessions.to} of {sessions.total}</span>
                        <div className="flex gap-1">
                            {sessions.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url || link.active}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                    className={`px-3 py-1 rounded-lg text-xs ${
                                        link.active
                                            ? 'bg-primary-600 text-white'
                                            : link.url
                                                ? 'border border-[--color-border] text-[--color-text] hover:bg-[--color-bg]'
                                                : 'text-[--color-text-muted] cursor-default'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
