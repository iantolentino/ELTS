import { Head, router, Link } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import type { PaginatedData } from '@/types';

interface AssetRow {
    id:                   number;
    name:                 string;
    asset_tag:            string;
    type:                 string;
    status:               'purchased' | 'in_use' | 'maintenance' | 'retired';
    make:                 string | null;
    model:                string | null;
    warranty_expires_at:  string | null;
    warranty_expired:     boolean;
    location:             string | null;
    assignee:             { id: number; name: string } | null;
}

interface Props {
    assets:  PaginatedData<AssetRow>;
    types:   string[];
    agents:  { id: number; name: string }[];
    filters: {
        search?:      string;
        type?:        string;
        status?:      string;
        assignee_id?: string;
        sort_by?:     string;
        sort_dir?:    string;
    };
    can: { create: boolean; edit: boolean; delete: boolean };
}

const STATUS_LABELS: Record<string, string> = {
    purchased:   'Purchased',
    in_use:      'In Use',
    maintenance: 'Maintenance',
    retired:     'Retired',
};

const STATUS_COLORS: Record<string, string> = {
    purchased:   'bg-blue-100 text-blue-700',
    in_use:      'bg-green-100 text-green-700',
    maintenance: 'bg-amber-100 text-amber-700',
    retired:     'bg-gray-100 text-gray-500',
};

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABELS[status] ?? status}
        </span>
    );
}

export default function AssetsIndex({ assets, types, agents, filters, can }: Props) {
    const [search, setSearch]         = useState(filters.search ?? '');
    const [type, setType]             = useState(filters.type ?? '');
    const [status, setStatus]         = useState(filters.status ?? '');
    const [assigneeId, setAssigneeId] = useState(filters.assignee_id ?? '');

    const apply = useCallback((overrides: Record<string, string> = {}) => {
        router.get('/admin/assets', {
            search:      search,
            type:        type,
            status:      status,
            assignee_id: assigneeId,
            sort_by:     filters.sort_by ?? '',
            sort_dir:    filters.sort_dir ?? '',
            ...overrides,
        }, { preserveScroll: true });
    }, [search, type, status, assigneeId, filters]);

    function clearFilters() {
        setSearch(''); setType(''); setStatus(''); setAssigneeId('');
        router.get('/admin/assets', {}, { preserveScroll: true });
    }

    function handleSort(col: string) {
        const sameCol = filters.sort_by === col;
        apply({ sort_by: col, sort_dir: sameCol && filters.sort_dir === 'asc' ? 'desc' : 'asc' });
    }

    function SortIcon({ col }: { col: string }) {
        if (filters.sort_by !== col) return <span className="ml-1 opacity-30">↕</span>;
        return <span className="ml-1">{filters.sort_dir === 'asc' ? '↑' : '↓'}</span>;
    }

    const hasFilters = search || type || status || assigneeId;

    return (
        <AppLayout>
            <Head title="Assets" />

            <div className="px-6 py-6 space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-[--color-text]">Assets</h1>
                        <p className="text-sm text-[--color-text-muted] mt-0.5">
                            {assets.total.toLocaleString()} asset{assets.total !== 1 ? 's' : ''} total
                        </p>
                    </div>
                    {can.create && (
                        <Link
                            href="/admin/assets/create"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg"
                        >
                            <PlusIcon className="w-4 h-4" />
                            New Asset
                        </Link>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-4">
                    <div className="flex flex-wrap gap-3">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && apply()}
                                placeholder="Search name, tag, serial…"
                                className="w-full pl-9 pr-3 h-9 rounded-lg border border-[--color-border] bg-[--color-bg] text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* Type */}
                        <select
                            value={type}
                            onChange={e => { setType(e.target.value); apply({ type: e.target.value }); }}
                            className="h-9 rounded-lg border border-[--color-border] bg-[--color-bg] px-3 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">All types</option>
                            {types.map(t => (
                                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                            ))}
                        </select>

                        {/* Status */}
                        <select
                            value={status}
                            onChange={e => { setStatus(e.target.value); apply({ status: e.target.value }); }}
                            className="h-9 rounded-lg border border-[--color-border] bg-[--color-bg] px-3 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">All statuses</option>
                            <option value="purchased">Purchased</option>
                            <option value="in_use">In Use</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="retired">Retired</option>
                        </select>

                        {/* Assignee */}
                        <select
                            value={assigneeId}
                            onChange={e => { setAssigneeId(e.target.value); apply({ assignee_id: e.target.value }); }}
                            className="h-9 rounded-lg border border-[--color-border] bg-[--color-bg] px-3 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">All assignees</option>
                            {agents.map(a => (
                                <option key={a.id} value={String(a.id)}>{a.name}</option>
                            ))}
                        </select>

                        <button
                            onClick={() => apply()}
                            className="h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg"
                        >
                            Search
                        </button>

                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="h-9 px-3 text-sm text-[--color-text-muted] hover:text-[--color-text] border border-[--color-border] rounded-lg"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-[--color-surface] border border-[--color-border] rounded-xl overflow-hidden">
                    {assets.data.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-[--color-text-muted] text-sm">
                            No assets found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-[--color-border]">
                                    <tr>
                                        <th
                                            onClick={() => handleSort('asset_tag')}
                                            className="text-left py-3 px-4 text-xs font-medium text-[--color-text-muted] cursor-pointer select-none hover:text-[--color-text]"
                                        >
                                            Asset Tag <SortIcon col="asset_tag" />
                                        </th>
                                        <th
                                            onClick={() => handleSort('name')}
                                            className="text-left py-3 px-4 text-xs font-medium text-[--color-text-muted] cursor-pointer select-none hover:text-[--color-text]"
                                        >
                                            Name <SortIcon col="name" />
                                        </th>
                                        <th
                                            onClick={() => handleSort('type')}
                                            className="text-left py-3 px-4 text-xs font-medium text-[--color-text-muted] cursor-pointer select-none hover:text-[--color-text]"
                                        >
                                            Type <SortIcon col="type" />
                                        </th>
                                        <th
                                            onClick={() => handleSort('status')}
                                            className="text-left py-3 px-4 text-xs font-medium text-[--color-text-muted] cursor-pointer select-none hover:text-[--color-text]"
                                        >
                                            Status <SortIcon col="status" />
                                        </th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-[--color-text-muted]">Assignee</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-[--color-text-muted]">Location</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-[--color-text-muted]">Warranty</th>
                                        <th className="py-3 px-4" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {assets.data.map(asset => (
                                        <tr
                                            key={asset.id}
                                            className="border-b border-[--color-border] last:border-0 hover:bg-[--color-bg] cursor-pointer"
                                            onClick={() => router.visit(`/admin/assets/${asset.id}`)}
                                        >
                                            <td className="py-3 px-4 font-mono text-xs text-[--color-text-muted]">
                                                {asset.asset_tag}
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="font-medium text-[--color-text]">{asset.name}</p>
                                                {(asset.make || asset.model) && (
                                                    <p className="text-xs text-[--color-text-muted]">
                                                        {[asset.make, asset.model].filter(Boolean).join(' ')}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-[--color-text] capitalize">{asset.type}</td>
                                            <td className="py-3 px-4">
                                                <StatusBadge status={asset.status} />
                                            </td>
                                            <td className="py-3 px-4 text-[--color-text-muted]">
                                                {asset.assignee?.name ?? '—'}
                                            </td>
                                            <td className="py-3 px-4 text-[--color-text-muted]">
                                                {asset.location ?? '—'}
                                            </td>
                                            <td className="py-3 px-4">
                                                {asset.warranty_expires_at ? (
                                                    <span className={`text-xs ${asset.warranty_expired ? 'text-red-500' : 'text-[--color-text-muted]'}`}>
                                                        {asset.warranty_expired ? '⚠ Expired' : asset.warranty_expires_at}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-[--color-text-muted]">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                                                {can.edit && (
                                                    <Link
                                                        href={`/admin/assets/${asset.id}/edit`}
                                                        className="p-1.5 rounded hover:bg-[--color-border] text-[--color-text-muted] hover:text-[--color-text]"
                                                    >
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {assets.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-[--color-text-muted]">
                        <span>
                            Showing {assets.from}–{assets.to} of {assets.total.toLocaleString()}
                        </span>
                        <div className="flex gap-1">
                            {assets.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url || link.active}
                                    onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                                    className={`px-3 py-1 rounded text-xs border transition-colors
                                        ${link.active
                                            ? 'bg-primary-600 text-white border-primary-600'
                                            : link.url
                                                ? 'border-[--color-border] hover:border-primary-400 hover:text-[--color-text]'
                                                : 'border-[--color-border] opacity-40 cursor-not-allowed'}`}
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
