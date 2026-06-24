import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { ChevronDownIcon, ChevronRightIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import type { PaginatedData } from '@/types';

interface LogEntry {
    id:           number;
    log_name:     string | null;
    description:  string;
    event:        string | null;
    subject_type: string | null;
    subject_id:   number | null;
    subject_link: string | null;
    causer:       { id: number; name: string } | null;
    changes:      Record<string, unknown>;
    old:          Record<string, unknown>;
    created_at:   string;
}

interface Props {
    logs:      PaginatedData<LogEntry>;
    filters:   Record<string, string>;
    log_names: string[];
    users:     { id: number; name: string }[];
}

const EVENT_COLORS: Record<string, string> = {
    created: 'bg-green-100 text-green-700',
    updated: 'bg-blue-100 text-blue-700',
    deleted: 'bg-red-100 text-red-700',
};

const LOG_COLORS: Record<string, string> = {
    ticket:     'bg-primary-100 text-primary-700',
    user:       'bg-violet-100 text-violet-700',
    asset:      'bg-amber-100 text-amber-700',
    team:       'bg-cyan-100 text-cyan-700',
    department: 'bg-teal-100 text-teal-700',
    knowledge:  'bg-emerald-100 text-emerald-700',
    sla:        'bg-orange-100 text-orange-700',
    automation: 'bg-pink-100 text-pink-700',
    system:     'bg-gray-100 text-gray-600',
};

function DiffRow({ label, oldVal, newVal }: { label: string; oldVal: unknown; newVal: unknown }) {
    const fmt = (v: unknown) => v === null || v === undefined ? <em className="text-[--color-text-subtle]">null</em> : String(v);
    return (
        <div className="grid grid-cols-3 gap-2 py-1 border-b border-[--color-border] last:border-0 text-xs">
            <span className="font-mono text-[--color-text-muted] truncate">{label}</span>
            <span className="text-red-600 line-through truncate">{fmt(oldVal)}</span>
            <span className="text-green-700 truncate">{fmt(newVal)}</span>
        </div>
    );
}

function LogRow({ entry }: { entry: LogEntry }) {
    const [open, setOpen] = useState(false);
    const hasChanges = Object.keys(entry.changes).length > 0;
    const diffKeys   = Object.keys(entry.changes);

    return (
        <>
            <tr className="hover:bg-[--color-bg] transition-colors cursor-pointer" onClick={() => hasChanges && setOpen(v => !v)}>
                <td className="px-4 py-3 text-xs text-[--color-text-muted] whitespace-nowrap">{entry.created_at}</td>
                <td className="px-4 py-3 text-sm">
                    {entry.causer
                        ? <span className="font-medium text-[--color-text]">{entry.causer.name}</span>
                        : <em className="text-[--color-text-subtle] text-xs">System</em>
                    }
                </td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        {entry.event && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${EVENT_COLORS[entry.event] ?? 'bg-gray-100 text-gray-600'}`}>
                                {entry.event}
                            </span>
                        )}
                        {entry.log_name && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${LOG_COLORS[entry.log_name] ?? 'bg-gray-100 text-gray-600'}`}>
                                {entry.log_name}
                            </span>
                        )}
                        <span className="text-sm text-[--color-text] capitalize">{entry.description}</span>
                    </div>
                </td>
                <td className="px-4 py-3 text-sm">
                    {entry.subject_type ? (
                        entry.subject_link ? (
                            <Link href={entry.subject_link} className="text-primary-600 hover:underline font-mono text-xs"
                                onClick={e => e.stopPropagation()}>
                                {entry.subject_type} #{entry.subject_id}
                            </Link>
                        ) : (
                            <span className="text-xs font-mono text-[--color-text-muted]">{entry.subject_type} #{entry.subject_id}</span>
                        )
                    ) : <span className="text-[--color-text-subtle]">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                    {hasChanges
                        ? open
                            ? <ChevronDownIcon  className="w-4 h-4 text-[--color-text-muted] mx-auto" />
                            : <ChevronRightIcon className="w-4 h-4 text-[--color-text-muted] mx-auto" />
                        : null
                    }
                </td>
            </tr>
            {open && hasChanges && (
                <tr>
                    <td colSpan={5} className="px-4 pb-4 pt-0 bg-[--color-bg]">
                        <div className="ml-4 border border-[--color-border] rounded-lg p-3">
                            <div className="grid grid-cols-3 gap-2 pb-1 mb-1 border-b border-[--color-border] text-[10px] font-semibold text-[--color-text-muted] uppercase tracking-wider">
                                <span>Field</span>
                                <span>Before</span>
                                <span>After</span>
                            </div>
                            {diffKeys.map(k => (
                                <DiffRow key={k} label={k} oldVal={(entry.old as Record<string, unknown>)[k]} newVal={entry.changes[k]} />
                            ))}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export default function AuditLogIndex({ logs, filters, log_names, users }: Props) {
    const [search,   setSearch]   = useState(filters.search   ?? '');
    const [logName,  setLogName]  = useState(filters.log_name ?? '');
    const [event,    setEvent]    = useState(filters.event    ?? '');
    const [causerId, setCauserId] = useState(filters.causer_id ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo,   setDateTo]   = useState(filters.date_to   ?? '');

    const apply = () => {
        router.get('/admin/audit-logs', {
            search, log_name: logName, event, causer_id: causerId, date_from: dateFrom, date_to: dateTo,
        }, { preserveState: true, replace: true });
    };

    const exportUrl = (format: 'csv' | 'pdf') => {
        const p = new URLSearchParams();
        if (search)   p.set('search',    search);
        if (logName)  p.set('log_name',  logName);
        if (event)    p.set('event',     event);
        if (causerId) p.set('causer_id', causerId);
        if (dateFrom) p.set('date_from', dateFrom);
        if (dateTo)   p.set('date_to',   dateTo);
        const qs = p.toString();
        return `/admin/audit-logs/export/${format}${qs ? '?' + qs : ''}`;
    };

    const clear = () => {
        setSearch(''); setLogName(''); setEvent(''); setCauserId(''); setDateFrom(''); setDateTo('');
        router.get('/admin/audit-logs', {}, { preserveState: false });
    };

    const SELECT = 'border border-[--color-border] rounded-lg px-3 h-9 text-sm bg-[--color-surface] text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500';

    const hasFilters = !!(search || logName || event || causerId || dateFrom || dateTo);

    return (
        <AppLayout>
            <Head title="Audit Logs" />
            <div className="px-6 py-6 space-y-5 max-w-7xl">

                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-[--color-text]">Audit Logs</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-[--color-text-muted]">{logs.total.toLocaleString()} entries</span>
                        <a href={exportUrl('csv')}
                            className="inline-flex items-center gap-1.5 px-3 h-8 border border-[--color-border] rounded-lg text-xs font-medium text-[--color-text-muted] hover:border-primary-400 hover:text-primary-600 transition-colors">
                            <ArrowDownTrayIcon className="w-3.5 h-3.5" />CSV
                        </a>
                        <a href={exportUrl('pdf')}
                            className="inline-flex items-center gap-1.5 px-3 h-8 border border-[--color-border] rounded-lg text-xs font-medium text-[--color-text-muted] hover:border-primary-400 hover:text-primary-600 transition-colors">
                            <ArrowDownTrayIcon className="w-3.5 h-3.5" />PDF
                        </a>
                    </div>
                </div>

                {/* Filter bar */}
                <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-4 space-y-3">
                    <div className="flex flex-wrap gap-3">
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && apply()}
                            placeholder="Search description…"
                            className={SELECT + ' flex-1 min-w-48 px-3'}
                        />
                        <select value={logName} onChange={e => setLogName(e.target.value)} className={SELECT}>
                            <option value="">All models</option>
                            {log_names.map(n => (
                                <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
                            ))}
                        </select>
                        <select value={event} onChange={e => setEvent(e.target.value)} className={SELECT}>
                            <option value="">All events</option>
                            <option value="created">Created</option>
                            <option value="updated">Updated</option>
                            <option value="deleted">Deleted</option>
                        </select>
                        <select value={causerId} onChange={e => setCauserId(e.target.value)} className={SELECT}>
                            <option value="">All users</option>
                            {users.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={SELECT + ' w-40'} />
                        <span className="text-xs text-[--color-text-muted]">to</span>
                        <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   className={SELECT + ' w-40'} />
                        <button onClick={apply} className="px-4 h-9 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg">
                            Search
                        </button>
                        {hasFilters && (
                            <button onClick={clear} className="px-3 h-9 border border-[--color-border] text-sm rounded-lg text-[--color-text-muted] hover:border-primary-400">
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-[--color-surface] border border-[--color-border] rounded-xl overflow-hidden">
                    {logs.data.length === 0 ? (
                        <div className="py-16 text-center text-sm text-[--color-text-muted]">No audit log entries found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[--color-border] bg-[--color-bg]">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider whitespace-nowrap">Time</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">User</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">Action</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">Subject</th>
                                        <th className="px-4 py-3 w-8" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[--color-border]">
                                    {logs.data.map(entry => <LogRow key={entry.id} entry={entry} />)}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {logs.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-[--color-text-muted]">
                        <span>Page {logs.current_page} of {logs.last_page}</span>
                        <div className="flex gap-2">
                            {logs.links.map((link, i) => (
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
