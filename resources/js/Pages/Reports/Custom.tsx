import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from 'recharts';

interface ResultRow {
    label:                  string;
    count:                  number;
    avg_resolution_minutes: number | null;
}

interface SelectOption { id: number; name: string; }

interface Filters {
    from:        string;
    to:          string;
    metric:      string;
    group_by:    string;
    priority:    string;
    status_id:   string;
    category_id: string;
    assignee_id: string;
    team_id:     string;
}

interface Props {
    results:    ResultRow[];
    statuses:   SelectOption[];
    categories: SelectOption[];
    agents:     SelectOption[];
    teams:      SelectOption[];
    filters:    Filters;
}

function formatMinutes(minutes: number): string {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const PALETTE = [
    '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
    '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
];

const METRIC_OPTIONS = [
    { value: 'volume',         label: 'Ticket Volume' },
    { value: 'avg_resolution', label: 'Avg Resolution Time' },
];

const GROUP_OPTIONS = [
    { value: 'day',      label: 'Day' },
    { value: 'week',     label: 'Week' },
    { value: 'month',    label: 'Month' },
    { value: 'priority', label: 'Priority' },
    { value: 'status',   label: 'Status' },
    { value: 'category', label: 'Category' },
    { value: 'agent',    label: 'Agent' },
    { value: 'team',     label: 'Team' },
];

const PRIORITY_OPTIONS = [
    { value: 'critical', label: 'Critical' },
    { value: 'high',     label: 'High' },
    { value: 'medium',   label: 'Medium' },
    { value: 'low',      label: 'Low' },
];

const SELECT_CLS =
    'h-9 w-full rounded-md border border-[--color-border] bg-[--color-bg] px-2.5 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-[--color-primary]';

export default function CustomReport({ results, statuses, categories, agents, teams, filters }: Props) {
    const [from,       setFrom]       = useState(filters.from);
    const [to,         setTo]         = useState(filters.to);
    const [metric,     setMetric]     = useState(filters.metric);
    const [groupBy,    setGroupBy]    = useState(filters.group_by);
    const [priority,   setPriority]   = useState(filters.priority);
    const [statusId,   setStatusId]   = useState(filters.status_id);
    const [categoryId, setCategoryId] = useState(filters.category_id);
    const [assigneeId, setAssigneeId] = useState(filters.assignee_id);
    const [teamId,     setTeamId]     = useState(filters.team_id);

    function buildParams(overrides: Record<string, string> = {}) {
        const base: Record<string, string> = { from, to, metric, group_by: groupBy };
        if (priority)   base.priority    = priority;
        if (statusId)   base.status_id   = statusId;
        if (categoryId) base.category_id = categoryId;
        if (assigneeId) base.assignee_id = assigneeId;
        if (teamId)     base.team_id     = teamId;
        return { ...base, ...overrides };
    }

    function apply() {
        router.get('/reports/custom', buildParams(), { preserveScroll: true });
    }

    function clearFilters() {
        setPriority(''); setStatusId(''); setCategoryId(''); setAssigneeId(''); setTeamId('');
        router.get('/reports/custom', { from, to, metric, group_by: groupBy }, { preserveScroll: true });
    }

    const isAvgMetric = metric === 'avg_resolution';
    const groupLabel  = GROUP_OPTIONS.find(g => g.value === groupBy)?.label ?? groupBy;

    const chartData = results.map(r => ({
        label: r.label,
        value: isAvgMetric ? (r.avg_resolution_minutes ?? 0) : r.count,
        count: r.count,
        avg_resolution_minutes: r.avg_resolution_minutes,
    }));

    const totalTickets = results.reduce((s, r) => s + r.count, 0);

    const hasActiveFilters = !!(priority || statusId || categoryId || assigneeId || teamId);

    return (
        <AppLayout>
            <Head title="Custom Report" />

            <div className="px-6 py-6 space-y-6">

                {/* Page header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold text-[--color-text]">Custom Report Builder</h1>
                        <p className="text-sm text-[--color-text-muted] mt-0.5">
                            Select a metric, date range, grouping, and optional filters
                        </p>
                    </div>
                    <Link
                        href="/reports"
                        className="text-sm text-[--color-primary] hover:underline mt-1"
                    >
                        ← Back to Reports
                    </Link>
                </div>

                {/* ── Parameter panel ──────────────────────────────────────── */}
                <section className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-[--color-text]">Report Parameters</h2>

                    {/* Core params row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-[--color-text-muted]">From</label>
                            <input
                                type="date" value={from}
                                onChange={e => setFrom(e.target.value)}
                                className={SELECT_CLS}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-[--color-text-muted]">To</label>
                            <input
                                type="date" value={to}
                                onChange={e => setTo(e.target.value)}
                                className={SELECT_CLS}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-[--color-text-muted]">Metric</label>
                            <select value={metric} onChange={e => setMetric(e.target.value)} className={SELECT_CLS}>
                                {METRIC_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-[--color-text-muted]">Group By</label>
                            <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className={SELECT_CLS}>
                                {GROUP_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Optional filters row */}
                    <div className="border-t border-[--color-border] pt-4">
                        <p className="text-xs font-medium text-[--color-text-muted] mb-3">
                            Optional filters
                            {hasActiveFilters && (
                                <span className="ml-2 inline-flex items-center gap-1 text-[--color-primary]">
                                    · filters active
                                </span>
                            )}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-[--color-text-muted]">Priority</label>
                                <select value={priority} onChange={e => setPriority(e.target.value)} className={SELECT_CLS}>
                                    <option value="">All</option>
                                    {PRIORITY_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-[--color-text-muted]">Status</label>
                                <select value={statusId} onChange={e => setStatusId(e.target.value)} className={SELECT_CLS}>
                                    <option value="">All</option>
                                    {statuses.map(s => (
                                        <option key={s.id} value={String(s.id)}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-[--color-text-muted]">Category</label>
                                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={SELECT_CLS}>
                                    <option value="">All</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-[--color-text-muted]">Agent</label>
                                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className={SELECT_CLS}>
                                    <option value="">All</option>
                                    {agents.map(a => (
                                        <option key={a.id} value={String(a.id)}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-[--color-text-muted]">Team</label>
                                <select value={teamId} onChange={e => setTeamId(e.target.value)} className={SELECT_CLS}>
                                    <option value="">All</option>
                                    {teams.map(t => (
                                        <option key={t.id} value={String(t.id)}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                        <button
                            onClick={apply}
                            className="h-9 px-5 rounded-md bg-[--color-primary] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            Run Report
                        </button>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="h-9 px-4 rounded-md border border-[--color-border] text-sm text-[--color-text-muted] hover:bg-[--color-bg] transition-colors"
                            >
                                Clear Filters
                            </button>
                        )}
                        <span className="ml-auto flex items-center gap-2">
                            <a
                                href={`/reports/custom/export/pdf?${new URLSearchParams(buildParams()).toString()}`}
                                target="_blank"
                                rel="noreferrer"
                                className="h-9 px-3 rounded-md border border-[--color-border] text-sm text-[--color-text-muted] hover:bg-[--color-bg] transition-colors flex items-center gap-1.5"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                PDF
                            </a>
                            <a
                                href={`/reports/custom/export/excel?${new URLSearchParams(buildParams()).toString()}`}
                                className="h-9 px-3 rounded-md border border-[--color-border] text-sm text-[--color-text-muted] hover:bg-[--color-bg] transition-colors flex items-center gap-1.5"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                Excel
                            </a>
                            <a
                                href={`/reports/custom/export/csv?${new URLSearchParams(buildParams()).toString()}`}
                                className="h-9 px-3 rounded-md border border-[--color-border] text-sm text-[--color-text-muted] hover:bg-[--color-bg] transition-colors flex items-center gap-1.5"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                CSV
                            </a>
                        </span>
                    </div>
                </section>

                {/* ── Results ──────────────────────────────────────────────── */}
                {results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 h-48 bg-[--color-surface] border border-[--color-border] rounded-xl text-[--color-text-muted]">
                        <span className="text-3xl">📊</span>
                        <p className="text-sm">No data for the selected parameters</p>
                        <p className="text-xs">Try adjusting the date range or removing filters</p>
                    </div>
                ) : (
                    <>
                        {/* Summary chip */}
                        <p className="text-xs text-[--color-text-muted]">
                            Showing <span className="font-semibold text-[--color-text]">{totalTickets.toLocaleString()}</span> tickets
                            {' · '}grouped by <span className="font-semibold text-[--color-text]">{groupLabel}</span>
                            {' · '}{METRIC_OPTIONS.find(m => m.value === metric)?.label}
                        </p>

                        {/* Chart */}
                        <section className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5 space-y-2">
                            <h2 className="text-sm font-semibold text-[--color-text]">
                                {isAvgMetric ? 'Avg Resolution Time' : 'Ticket Volume'} by {groupLabel}
                            </h2>

                            <ResponsiveContainer width="100%" height={290}>
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 4, right: 16, left: 0, bottom: 52 }}
                                    barSize={Math.max(14, Math.min(48, 480 / Math.max(chartData.length, 1)))}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                                        tickLine={false}
                                        axisLine={false}
                                        angle={-35}
                                        textAnchor="end"
                                        interval={0}
                                    />
                                    <YAxis
                                        tickFormatter={isAvgMetric ? v => formatMinutes(v) : undefined}
                                        tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={isAvgMetric ? 60 : 36}
                                        allowDecimals={!isAvgMetric ? false : undefined}
                                    />
                                    <Tooltip
                                        formatter={(v: number) => [
                                            isAvgMetric ? formatMinutes(v) : v.toLocaleString(),
                                            isAvgMetric ? 'Avg resolution' : 'Tickets',
                                        ]}
                                        contentStyle={{
                                            background: 'var(--color-surface)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                        cursor={{ fill: 'var(--color-border)', opacity: 0.4 }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {chartData.map((_, i) => (
                                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </section>

                        {/* Table */}
                        <section className="bg-[--color-surface] border border-[--color-border] rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[--color-border] bg-[--color-bg]">
                                            <th className="text-left py-2.5 px-4 text-xs font-medium text-[--color-text-muted]">
                                                {groupLabel}
                                            </th>
                                            <th className="text-right py-2.5 px-4 text-xs font-medium text-[--color-text-muted]">
                                                Tickets
                                            </th>
                                            <th className="text-right py-2.5 px-4 text-xs font-medium text-[--color-text-muted]">
                                                Avg Resolution
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((row, i) => (
                                            <tr
                                                key={i}
                                                className="border-b border-[--color-border] last:border-0 hover:bg-[--color-bg]"
                                            >
                                                <td className="py-2.5 px-4 font-medium text-[--color-text] capitalize">
                                                    {row.label}
                                                </td>
                                                <td className="py-2.5 px-4 text-right tabular-nums text-[--color-text]">
                                                    {row.count.toLocaleString()}
                                                </td>
                                                <td className="py-2.5 px-4 text-right tabular-nums text-[--color-text-muted]">
                                                    {row.avg_resolution_minutes !== null
                                                        ? formatMinutes(row.avg_resolution_minutes)
                                                        : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t-2 border-[--color-border]">
                                        <tr>
                                            <td className="py-2.5 px-4 text-xs font-semibold text-[--color-text-muted]">
                                                Total
                                            </td>
                                            <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-[--color-text]">
                                                {totalTickets.toLocaleString()}
                                            </td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </section>
                    </>
                )}

            </div>
        </AppLayout>
    );
}
