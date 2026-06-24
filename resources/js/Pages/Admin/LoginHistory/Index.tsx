import { useEffect, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircleIcon, XCircleIcon, MagnifyingGlassIcon, FunnelIcon,
} from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import type { PaginatedData } from '@/types';

interface UserSnippet { id: number; name: string; email: string; }

interface LoginEntry {
    id:         number;
    user:       UserSnippet | null;
    email:      string;
    ip_address: string;
    user_agent: string | null;
    status:     'success' | 'failed';
    created_at: string;
}

interface Filters {
    search?:    string;
    status?:    string;
    date_from?: string;
    date_to?:   string;
    per_page?:  number;
    user_id?:   string | number;
}

interface Props {
    entries: PaginatedData<LoginEntry>;
    filters: Filters;
    users:   { id: number; name: string }[];
    total:   number;
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

const SEL = 'border border-[--color-border] rounded-lg px-3 h-9 text-sm bg-[--color-surface] text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500';

export default function AdminLoginHistory({ entries, filters, users, total }: Props) {
    const [search,   setSearch]   = useState(filters.search   ?? '');
    const [status,   setStatus]   = useState(filters.status   ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo,   setDateTo]   = useState(filters.date_to   ?? '');
    const [userId,   setUserId]   = useState(String(filters.user_id ?? ''));
    const [perPage,  setPerPage]  = useState(filters.per_page  ?? 25);

    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    function apply(overrides: Partial<Filters & { user_id: string }> = {}) {
        const params: Record<string, unknown> = {
            search:    overrides.search    !== undefined ? overrides.search    : search,
            status:    overrides.status    !== undefined ? overrides.status    : status,
            date_from: overrides.date_from !== undefined ? overrides.date_from : dateFrom,
            date_to:   overrides.date_to   !== undefined ? overrides.date_to   : dateTo,
            user_id:   overrides.user_id   !== undefined ? overrides.user_id   : userId,
            per_page:  overrides.per_page  !== undefined ? overrides.per_page  : perPage,
            page:      1,
        };
        // Strip empty values so URL stays clean
        Object.keys(params).forEach(k => { if (params[k] === '' || params[k] === null) delete params[k]; });
        router.get('/admin/login-history', params, { preserveState: true, replace: true });
    }

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => apply({ search }), 400);
        return () => clearTimeout(debounceRef.current);
    }, [search]);

    const clearFilters = () => {
        setSearch(''); setStatus(''); setDateFrom(''); setDateTo(''); setUserId(''); setPerPage(25);
        router.get('/admin/login-history', {}, { preserveState: false });
    };

    const hasFilters = !!(search || status || dateFrom || dateTo || userId);

    return (
        <AppLayout>
            <Head title="Login History" />
            <div className="px-6 py-6 space-y-5 max-w-7xl">

                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-[--color-text]">Login History</h1>
                    <span className="text-xs text-[--color-text-muted]">{total.toLocaleString()} records</span>
                </div>

                {/* Filter bar */}
                <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-4 space-y-3">
                    <div className="flex flex-wrap gap-3">
                        {/* Search */}
                        <div className="relative flex-1 min-w-48">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search email, IP, name…"
                                className={SEL + ' pl-9 w-full'}
                            />
                        </div>

                        {/* User select */}
                        <select
                            value={userId}
                            onChange={e => { setUserId(e.target.value); apply({ user_id: e.target.value }); }}
                            className={SEL + ' min-w-40'}
                        >
                            <option value="">All users</option>
                            {users.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
                        </select>

                        {/* Status */}
                        <select
                            value={status}
                            onChange={e => { setStatus(e.target.value); apply({ status: e.target.value }); }}
                            className={SEL}
                        >
                            <option value="">All statuses</option>
                            <option value="success">Success</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={e => { setDateFrom(e.target.value); apply({ date_from: e.target.value }); }}
                            className={SEL + ' w-40'}
                        />
                        <span className="text-xs text-[--color-text-muted]">to</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={e => { setDateTo(e.target.value); apply({ date_to: e.target.value }); }}
                            className={SEL + ' w-40'}
                        />
                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1.5 px-3 h-9 border border-[--color-border] text-sm rounded-lg text-[--color-text-muted] hover:border-primary-400 transition-colors"
                            >
                                <FunnelIcon className="w-3.5 h-3.5" />Clear filters
                            </button>
                        )}
                        <div className="ml-auto flex items-center gap-2 text-sm text-[--color-text-muted]">
                            Show
                            <select
                                value={perPage}
                                onChange={e => { const v = Number(e.target.value); setPerPage(v); apply({ per_page: v }); }}
                                className={SEL + ' w-20'}
                            >
                                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            per page
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-[--color-surface] border border-[--color-border] rounded-xl overflow-hidden">
                    {entries.data.length === 0 ? (
                        <div className="py-16 text-center text-sm text-[--color-text-muted]">No login records found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[--color-border] bg-[--color-bg]">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">User</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">IP Address</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">Browser</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider whitespace-nowrap">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[--color-border]">
                                    {entries.data.map(entry => (
                                        <tr key={entry.id} className="hover:bg-[--color-bg] transition-colors">
                                            <td className="px-4 py-3">
                                                {entry.user ? (
                                                    <div>
                                                        <Link
                                                            href={`/admin/users/${entry.user.id}/edit`}
                                                            className="text-sm font-medium text-primary-600 hover:underline"
                                                        >
                                                            {entry.user.name}
                                                        </Link>
                                                        <p className="text-xs text-[--color-text-muted]">{entry.email}</p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span className="text-sm italic text-[--color-text-muted]">Deleted user</span>
                                                        <p className="text-xs text-[--color-text-muted]">{entry.email}</p>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs text-[--color-text]">{entry.ip_address}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-[--color-text-muted]" title={entry.user_agent ?? ''}>
                                                    {parseBrowser(entry.user_agent)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    {entry.status === 'success'
                                                        ? <CheckCircleIcon className="w-4 h-4 text-success-500" />
                                                        : <XCircleIcon    className="w-4 h-4 text-danger-500" />}
                                                    <span className={`text-xs font-semibold ${entry.status === 'success' ? 'text-success-700' : 'text-danger-700'}`}>
                                                        {entry.status === 'success' ? 'Success' : 'Failed'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-[--color-text-muted] whitespace-nowrap">
                                                {new Date(entry.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {entries.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-[--color-text-muted]">
                        <span>Showing {entries.from}–{entries.to} of {entries.total.toLocaleString()}</span>
                        <div className="flex gap-2">
                            {entries.links.map((link, i) => (
                                link.url ? (
                                    <Link key={i} href={link.url}
                                        className={`px-3 py-1.5 rounded-lg border text-sm ${link.active ? 'bg-primary-600 text-white border-primary-600' : 'border-[--color-border] hover:border-primary-400 text-[--color-text]'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span key={i} className="px-3 py-1.5 rounded-lg border border-[--color-border] text-sm text-[--color-text-muted] opacity-50"
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                )
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
