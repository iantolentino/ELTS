import { useState, useCallback, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Button, Input, Table } from '@/Components/UI';
import type { Column } from '@/Components/UI/Table';
import type { PaginatedData, Ticket, TicketStatus, TicketCategory } from '@/types';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

interface AgentOption {
    id: number;
    name: string;
}

interface Filters {
    search:      string;
    status_id:   string | number;
    priority:    string;
    category_id: string | number;
    assignee_id: string | number;
    team_id:     string | number;
    date_from:   string;
    date_to:     string;
    sort_by:     string;
    sort_dir:    'asc' | 'desc';
    per_page:    number;
}

interface Props {
    tickets:    PaginatedData<Ticket>;
    filters:    Filters;
    statuses:   TicketStatus[];
    categories: TicketCategory[];
    agents:     AgentOption[];
}

const PRIORITIES = [
    { value: 'critical', label: 'Critical' },
    { value: 'high',     label: 'High' },
    { value: 'medium',   label: 'Medium' },
    { value: 'low',      label: 'Low' },
];

const PER_PAGE_OPTIONS = [15, 25, 50, 100];

const SELECT_CLS = 'border border-[--color-border] rounded-lg px-3 py-2 text-sm text-[--color-text] bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none';

export default function Index({ tickets, filters, statuses, categories, agents }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const applyFilter = useCallback((overrides: Partial<Filters>) => {
        router.get('/tickets', { ...filters, ...overrides, page: 1 } as Record<string, unknown>, {
            preserveState: true, preserveScroll: true, replace: true,
        });
    }, [filters]);

    const handleSearch = (value: string) => {
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => applyFilter({ search: value }), 400);
    };

    const handleSort = (key: string) => {
        const newDir = filters.sort_by === key && filters.sort_dir === 'asc' ? 'desc' : 'asc';
        applyFilter({ sort_by: key, sort_dir: newDir });
    };

    const clearFilters = () => {
        setSearch('');
        router.get('/tickets', {}, { preserveState: false });
    };

    const hasFilters = !!(
        filters.search || filters.status_id || filters.priority ||
        filters.category_id || filters.assignee_id || filters.date_from || filters.date_to
    );

    const columns: Column<Ticket>[] = [
        {
            key: 'ticket_number',
            label: '#',
            sortable: true,
            className: 'w-36',
            render: (row) => (
                <Link
                    href={`/tickets/${row.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-mono text-xs text-primary-600 hover:underline font-semibold"
                >
                    {row.ticket_number}
                </Link>
            ),
        },
        {
            key: 'subject',
            label: 'Subject',
            sortable: true,
            render: (row) => (
                <div className="flex items-center gap-1.5 min-w-0">
                    {row.is_vip && <StarIcon className="w-3.5 h-3.5 text-warning-500 flex-shrink-0" />}
                    <span className="text-[--color-text] font-medium truncate max-w-xs">{row.subject}</span>
                    {row.tags.length > 0 && (
                        <div className="flex gap-1 ml-1 flex-shrink-0">
                            {row.tags.slice(0, 2).map(tag => (
                                <span
                                    key={tag.id}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                                    style={{ backgroundColor: tag.color ?? '#6B7280' }}
                                >
                                    {tag.name}
                                </span>
                            ))}
                            {row.tags.length > 2 && (
                                <span className="text-[10px] text-[--color-text-muted]">+{row.tags.length - 2}</span>
                            )}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <span
                    className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: row.status.color }}
                >
                    {row.status.name}
                </span>
            ),
        },
        {
            key: 'priority',
            label: 'Priority',
            sortable: true,
            render: (row) => (
                <Badge priority={row.priority} dot>
                    {row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
                </Badge>
            ),
        },
        {
            key: 'category',
            label: 'Category',
            render: (row) => (
                <span className="text-xs text-[--color-text-muted]">{row.category?.name ?? '—'}</span>
            ),
        },
        {
            key: 'requester',
            label: 'Requester',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-[10px] font-semibold flex-shrink-0">
                        {row.requester.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-[--color-text] truncate max-w-[120px]">{row.requester.name}</span>
                </div>
            ),
        },
        {
            key: 'assignee',
            label: 'Assignee',
            render: (row) => row.assignee ? (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-success-100 flex items-center justify-center text-success-700 text-[10px] font-semibold flex-shrink-0">
                        {row.assignee.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-[--color-text] truncate max-w-[120px]">{row.assignee.name}</span>
                </div>
            ) : (
                <span className="text-xs italic text-[--color-text-subtle]">Unassigned</span>
            ),
        },
        {
            key: 'created_at',
            label: 'Created',
            sortable: true,
            render: (row) => (
                <span className="text-xs text-[--color-text-muted] whitespace-nowrap">{row.created_at}</span>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Tickets" />

            <div className="p-6 space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-[--color-text]">Tickets</h1>
                        <p className="text-sm text-[--color-text-muted] mt-0.5">
                            {tickets.total.toLocaleString()} {tickets.total === 1 ? 'ticket' : 'tickets'}
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.visit('/tickets/create')}
                    >
                        <PlusIcon className="w-4 h-4 mr-1.5" />
                        New Ticket
                    </Button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-[--color-border] p-4 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex-1 min-w-56">
                            <Input
                                placeholder="Search ticket #, subject, or requester…"
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>

                        <select
                            value={filters.status_id ?? ''}
                            onChange={(e) => applyFilter({ status_id: e.target.value })}
                            className={SELECT_CLS}
                        >
                            <option value="">All Statuses</option>
                            {statuses.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>

                        <select
                            value={filters.priority ?? ''}
                            onChange={(e) => applyFilter({ priority: e.target.value })}
                            className={SELECT_CLS}
                        >
                            <option value="">All Priorities</option>
                            {PRIORITIES.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>

                        <select
                            value={filters.category_id ?? ''}
                            onChange={(e) => applyFilter({ category_id: e.target.value })}
                            className={SELECT_CLS}
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        <select
                            value={filters.assignee_id ?? ''}
                            onChange={(e) => applyFilter({ assignee_id: e.target.value })}
                            className={SELECT_CLS}
                        >
                            <option value="">All Assignees</option>
                            <option value="unassigned">Unassigned</option>
                            {agents.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>

                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1 text-sm text-[--color-text-muted] hover:text-danger-600 transition-colors whitespace-nowrap"
                            >
                                <XMarkIcon className="w-4 h-4" />
                                Clear filters
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-[--color-text-muted] whitespace-nowrap">Created:</span>
                        <input
                            type="date"
                            value={filters.date_from ?? ''}
                            onChange={(e) => applyFilter({ date_from: e.target.value })}
                            className="border border-[--color-border] rounded-lg px-3 py-1.5 text-sm text-[--color-text] bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        <span className="text-xs text-[--color-text-muted]">to</span>
                        <input
                            type="date"
                            value={filters.date_to ?? ''}
                            onChange={(e) => applyFilter({ date_to: e.target.value })}
                            className="border border-[--color-border] rounded-lg px-3 py-1.5 text-sm text-[--color-text] bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                </div>

                {/* Table */}
                <Table<Ticket>
                    columns={columns}
                    data={tickets.data}
                    rowKey={(row) => row.id}
                    sortKey={filters.sort_by}
                    sortDir={filters.sort_dir}
                    onSort={handleSort}
                    onRowClick={(row) => router.visit(`/tickets/${row.id}`)}
                    emptyMessage="No tickets found. Try adjusting your filters."
                />

                {/* Pagination */}
                {tickets.last_page > 1 && (
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <p className="text-sm text-[--color-text-muted]">
                            Showing {tickets.from}–{tickets.to} of {tickets.total.toLocaleString()}
                        </p>

                        <div className="flex items-center gap-1">
                            {tickets.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url, { preserveState: true, preserveScroll: true })}
                                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                        link.active
                                            ? 'bg-primary-600 text-white border-primary-600'
                                            : 'border-[--color-border] text-[--color-text-muted] hover:bg-[--color-bg] disabled:opacity-40 disabled:cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-[--color-text-muted]">Per page:</span>
                            <select
                                value={filters.per_page}
                                onChange={(e) => applyFilter({ per_page: Number(e.target.value) })}
                                className="border border-[--color-border] rounded-lg px-2 py-1.5 text-sm bg-white text-[--color-text]"
                            >
                                {PER_PAGE_OPTIONS.map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
