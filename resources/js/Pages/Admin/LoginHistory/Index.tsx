import { useEffect, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { CheckCircleIcon, XCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Table } from '@/Components/UI';
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
}

interface Props {
    entries: PaginatedData<LoginEntry>;
    filters: Filters;
}

function parseBrowser(ua: string | null): string {
    if (!ua) return '—';
    if (/Edg\//.test(ua))    return 'Edge';
    if (/OPR\//.test(ua))    return 'Opera';
    if (/Chrome\//.test(ua)) return 'Chrome';
    if (/Firefox\//.test(ua)) return 'Firefox';
    if (/Safari\//.test(ua)) return 'Safari';
    return ua.slice(0, 30);
}

const STATUS_VARIANT: Record<string, 'success' | 'danger'> = {
    success: 'success',
    failed:  'danger',
};

export default function AdminLoginHistory({ entries, filters }: Props) {
    const [search,   setSearch]   = useState(filters.search   ?? '');
    const [status,   setStatus]   = useState(filters.status   ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo,   setDateTo]   = useState(filters.date_to   ?? '');
    const [perPage,  setPerPage]  = useState(filters.per_page  ?? 25);

    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    function apply(overrides: Partial<Filters> = {}) {
        const params = {
            search:    overrides.search   !== undefined ? overrides.search   : search,
            status:    overrides.status   !== undefined ? overrides.status   : status,
            date_from: overrides.date_from !== undefined ? overrides.date_from : dateFrom,
            date_to:   overrides.date_to   !== undefined ? overrides.date_to   : dateTo,
            per_page:  overrides.per_page  !== undefined ? overrides.per_page  : perPage,
            page:      1,
        };
        router.get('/admin/login-history', params, { preserveState: true, replace: true });
    }

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => apply({ search }), 400);
        return () => clearTimeout(debounceRef.current);
    }, [search]);

    const clearFilters = () => {
        setSearch(''); setStatus(''); setDateFrom(''); setDateTo(''); setPerPage(25);
        router.get('/admin/login-history', {}, { preserveState: true, replace: true });
    };

    const hasFilters = search || status || dateFrom || dateTo;

    const columns = [
        {
            key:   'user',
            label: 'User',
            render: (_: unknown, row: LoginEntry) => (
                <div>
                    <p className="text-sm font-medium text-[--color-text]">
                        {row.user?.name ?? <span className="italic text-[--color-text-muted]">Deleted user</span>}
                    </p>
                    <p className="text-xs text-[--color-text-muted]">{row.email}</p>
                </div>
            ),
        },
        {
            key:   'ip_address',
            label: 'IP Address',
            render: (v: unknown) => <span className="font-mono text-xs text-[--color-text]">{String(v)}</span>,
        },
        {
            key:   'user_agent',
            label: 'Browser',
            render: (v: unknown) => (
                <span className="text-sm text-[--color-text-muted]" title={v as string ?? ''}>
                    {parseBrowser(v as string | null)}
                </span>
            ),
        },
        {
            key:   'status',
            label: 'Status',
            render: (v: unknown) => {
                const s = v as 'success' | 'failed';
                return (
                    <div className="flex items-center gap-1.5">
                        {s === 'success'
                            ? <CheckCircleIcon className="w-4 h-4 text-success-500" />
                            : <XCircleIcon    className="w-4 h-4 text-danger-500" />}
                        <Badge variant={STATUS_VARIANT[s]} size="sm">
                            {s === 'success' ? 'Success' : 'Failed'}
                        </Badge>
                    </div>
                );
            },
        },
        {
            key:   'created_at',
            label: 'Time',
            render: (v: unknown) => (
                <span className="text-sm text-[--color-text-muted]">
                    {new Date(v as string).toLocaleString()}
                </span>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Login History" />
            <div className="p-6 space-y-4">
                <h1 className="text-xl font-semibold text-[--color-text]">Login History</h1>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search email, IP, name…"
                            className="w-full pl-9 pr-3 py-2 text-sm border border-[--color-border] rounded-lg bg-white text-[--color-text] placeholder-[--color-text-muted] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={e => { setStatus(e.target.value); apply({ status: e.target.value }); }}
                        className="py-2 pl-3 pr-8 text-sm border border-[--color-border] rounded-lg bg-white text-[--color-text]"
                    >
                        <option value="">All statuses</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                    </select>

                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => { setDateFrom(e.target.value); apply({ date_from: e.target.value }); }}
                        className="py-2 px-3 text-sm border border-[--color-border] rounded-lg bg-white text-[--color-text]"
                    />
                    <span className="text-[--color-text-muted] text-sm">to</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => { setDateTo(e.target.value); apply({ date_to: e.target.value }); }}
                        className="py-2 px-3 text-sm border border-[--color-border] rounded-lg bg-white text-[--color-text]"
                    />

                    {hasFilters && (
                        <button
                            onClick={clearFilters}
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

                <Table
                    columns={columns}
                    data={entries.data}
                    keyField="id"
                    emptyMessage="No login records found."
                />

                {/* Pagination */}
                {entries.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-[--color-text-muted]">
                        <span>Showing {entries.from}–{entries.to} of {entries.total}</span>
                        <div className="flex gap-1">
                            {entries.links.map((link, i) => (
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
