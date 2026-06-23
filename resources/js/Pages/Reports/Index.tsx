import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';

interface FirstResponseRow {
    agent?:       string;
    team?:        string;
    avg_minutes:  number;
    count:        number;
}

interface PriorityRow  { priority: string; count: number; }
interface StatusRow   { status: string; count: number; is_closed: boolean; }
interface CategoryRow { category: string; count: number; }

interface TeamRow {
    team:                    string;
    tickets_handled:         number;
    avg_resolution_minutes:  number | null;
}

interface AgentRow {
    agent_id:                    number;
    agent:                       string;
    tickets_handled:             number;
    avg_resolution_minutes:      number | null;
    avg_first_response_minutes:  number | null;
    sla_compliance_pct:          number | null;
    csat_avg:                    number | null;
}

interface SlaCompliance {
    total:                   number;
    first_response_breached: number;
    resolution_breached:     number;
    compliant:               number;
    compliance_pct:          number | null;
}

interface Filters {
    from:     string;
    to:       string;
    group_by: string;
}

interface Props {
    first_response:    FirstResponseRow[];
    sla_compliance:    SlaCompliance;
    agent_performance: AgentRow[];
    team_comparison:   TeamRow[];
    by_priority:       PriorityRow[];
    by_status:         StatusRow[];
    by_category:       CategoryRow[];
    filters:           Filters;
}

function formatMinutes(minutes: number): string {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const BAR_COLORS = [
    '#6366f1', '#8b5cf6', '#a78bfa', '#7c3aed', '#4f46e5',
    '#818cf8', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff',
];

interface CustomTooltipProps {
    active?:  boolean;
    payload?: { value: number }[];
    label?:   string;
}

function FirstResponseTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-[--color-border] bg-[--color-surface] p-3 shadow-md text-sm">
            <p className="font-medium text-[--color-text] mb-1">{label}</p>
            <p className="text-[--color-text-muted]">
                Avg: <span className="font-semibold text-[--color-text]">{formatMinutes(payload[0].value)}</span>
            </p>
        </div>
    );
}

// ── SLA Gauge ────────────────────────────────────────────────────────────────

interface SlaGaugeProps { pct: number | null; }

function SlaGauge({ pct }: SlaGaugeProps) {
    const value = pct ?? 0;
    const color = value >= 90 ? '#22c55e' : value >= 70 ? '#f59e0b' : '#ef4444';
    const track = 'var(--color-border)';

    // Semicircle gauge: startAngle=180 (left) → endAngle=0 (right)
    const gaugeData = [
        { value: value,       fill: color },
        { value: 100 - value, fill: track },
    ];

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-48 h-24 overflow-hidden">
                <PieChart width={192} height={192} style={{ marginTop: -96 }}>
                    <Pie
                        data={gaugeData}
                        cx={96}
                        cy={192}
                        startAngle={180}
                        endAngle={0}
                        innerRadius={68}
                        outerRadius={92}
                        dataKey="value"
                        strokeWidth={0}
                        isAnimationActive={true}
                    >
                        {gaugeData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                        ))}
                    </Pie>
                </PieChart>
                {/* Centre label */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pointer-events-none pb-1">
                    <span className="text-3xl font-bold" style={{ color }}>
                        {pct !== null ? `${pct}%` : '—'}
                    </span>
                    <span className="text-xs text-[--color-text-muted]">compliant</span>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

// ── Donut chart ───────────────────────────────────────────────────────────────

interface DonutDatum { name: string; value: number; color: string; }

interface DonutChartProps { title: string; data: DonutDatum[]; }

function DonutChart({ title, data }: DonutChartProps) {
    const total = data.reduce((s, d) => s + d.value, 0);

    return (
        <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-[--color-text]">{title}</h3>

            {total === 0 ? (
                <div className="flex items-center justify-center h-40 text-[--color-text-muted] text-sm">
                    No data
                </div>
            ) : (
                <>
                    <div className="flex justify-center">
                        <PieChart width={200} height={200}>
                            <Pie
                                data={data}
                                cx={100}
                                cy={100}
                                innerRadius={58}
                                outerRadius={88}
                                dataKey="value"
                                paddingAngle={2}
                                strokeWidth={0}
                            >
                                {data.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(v: number, name: string) => [
                                    `${v} (${total > 0 ? Math.round((v / total) * 100) : 0}%)`,
                                    name,
                                ]}
                                contentStyle={{
                                    background: 'var(--color-surface)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 8,
                                    fontSize: 12,
                                }}
                            />
                        </PieChart>
                    </div>

                    {/* Legend */}
                    <ul className="space-y-1.5 text-sm">
                        {data.map(d => (
                            <li key={d.name} className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-2 min-w-0">
                                    <span
                                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ background: d.color }}
                                    />
                                    <span className="text-[--color-text] truncate capitalize">{d.name}</span>
                                </span>
                                <span className="text-[--color-text-muted] tabular-nums shrink-0">
                                    {d.value} ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
                                </span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
    critical: '#ef4444',
    high:     '#f97316',
    medium:   '#f59e0b',
    low:      '#22c55e',
};

const CATEGORY_PALETTE = [
    '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
    '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
];

export default function ReportsIndex({ first_response, sla_compliance, agent_performance, team_comparison, by_priority, by_status, by_category, filters }: Props) {
    const [from, setFrom]         = useState(filters.from);
    const [to, setTo]             = useState(filters.to);
    const [groupBy, setGroupBy]   = useState(filters.group_by);

    function apply() {
        router.get('/reports', { from, to, group_by: groupBy }, { preserveScroll: true });
    }

    const chartData = first_response.map(r => ({
        name:        r.agent ?? r.team ?? '—',
        avg_minutes: r.avg_minutes,
        count:       r.count,
    }));

    const priorityDonut: DonutDatum[] = by_priority.map(r => ({
        name:  r.priority,
        value: r.count,
        color: PRIORITY_COLORS[r.priority.toLowerCase()] ?? '#94a3b8',
    }));

    const statusDonut: DonutDatum[] = by_status.map((r, i) => ({
        name:  r.status,
        value: r.count,
        color: r.is_closed ? '#22c55e' : BAR_COLORS[i % BAR_COLORS.length],
    }));

    const categoryDonut: DonutDatum[] = by_category.map((r, i) => ({
        name:  r.category,
        value: r.count,
        color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
    }));

    return (
        <AppLayout>
            <Head title="Reports" />

            <div className="px-6 py-6 space-y-6">

                {/* Page header */}
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <h1 className="text-xl font-semibold text-[--color-text]">Reports</h1>

                    {/* Global date filter */}
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-[--color-text-muted]">From</label>
                            <input
                                type="date"
                                value={from}
                                onChange={e => setFrom(e.target.value)}
                                className="h-8 rounded-md border border-[--color-border] bg-[--color-surface] px-2 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-[--color-text-muted]">To</label>
                            <input
                                type="date"
                                value={to}
                                onChange={e => setTo(e.target.value)}
                                className="h-8 rounded-md border border-[--color-border] bg-[--color-surface] px-2 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                            />
                        </div>
                        <button
                            onClick={apply}
                            className="h-8 px-4 rounded-md bg-[--color-primary] text-white text-sm font-medium hover:opacity-90"
                        >
                            Apply
                        </button>
                        <a
                            href={`/reports/export/pdf?from=${from}&to=${to}&group_by=${groupBy}`}
                            target="_blank"
                            rel="noreferrer"
                            className="h-8 px-3 rounded-md border border-[--color-border] text-sm text-[--color-text-muted] hover:bg-[--color-bg] flex items-center gap-1.5"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            PDF
                        </a>
                        <a
                            href={`/reports/export/excel?from=${from}&to=${to}&group_by=${groupBy}`}
                            className="h-8 px-3 rounded-md border border-[--color-border] text-sm text-[--color-text-muted] hover:bg-[--color-bg] flex items-center gap-1.5"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            Excel
                        </a>
                    </div>
                </div>

                {/* ── First Response Time ─────────────────────────────────── */}
                <section className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-semibold text-[--color-text]">First Response Time</h2>
                            <p className="text-xs text-[--color-text-muted] mt-0.5">
                                Average time from ticket creation to first agent reply
                            </p>
                        </div>

                        {/* Agent / Team toggle */}
                        <div className="flex rounded-lg border border-[--color-border] overflow-hidden text-sm">
                            {(['agent', 'team'] as const).map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => {
                                        setGroupBy(opt);
                                        router.get('/reports', { from, to, group_by: opt }, { preserveScroll: true });
                                    }}
                                    className={[
                                        'px-4 py-1.5 capitalize transition-colors',
                                        groupBy === opt
                                            ? 'bg-[--color-primary] text-white'
                                            : 'text-[--color-text-muted] hover:bg-[--color-bg]',
                                    ].join(' ')}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {chartData.length === 0 ? (
                        <div className="flex items-center justify-center h-52 text-[--color-text-muted] text-sm">
                            No data for selected period
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart
                                data={chartData}
                                margin={{ top: 4, right: 16, left: 0, bottom: 48 }}
                                barSize={Math.max(16, Math.min(48, 480 / chartData.length))}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                                    tickLine={false}
                                    axisLine={false}
                                    angle={-35}
                                    textAnchor="end"
                                    interval={0}
                                />
                                <YAxis
                                    tickFormatter={v => formatMinutes(v)}
                                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={52}
                                />
                                <Tooltip content={<FirstResponseTooltip />} cursor={{ fill: 'var(--color-border)', opacity: 0.4 }} />
                                <Bar dataKey="avg_minutes" name="Avg first response" radius={[4, 4, 0, 0]}>
                                    {chartData.map((_, i) => (
                                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}

                    {/* Summary table under chart */}
                    {chartData.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[--color-border]">
                                        <th className="text-left py-2 px-3 text-xs font-medium text-[--color-text-muted] capitalize">{groupBy}</th>
                                        <th className="text-right py-2 px-3 text-xs font-medium text-[--color-text-muted]">Avg Response</th>
                                        <th className="text-right py-2 px-3 text-xs font-medium text-[--color-text-muted]">Tickets</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chartData
                                        .slice()
                                        .sort((a, b) => a.avg_minutes - b.avg_minutes)
                                        .map((row, i) => (
                                            <tr key={i} className="border-b border-[--color-border] last:border-0 hover:bg-[--color-bg]">
                                                <td className="py-2 px-3 font-medium text-[--color-text]">{row.name}</td>
                                                <td className="py-2 px-3 text-right text-[--color-text]">{formatMinutes(row.avg_minutes)}</td>
                                                <td className="py-2 px-3 text-right text-[--color-text-muted]">{row.count}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* ── Agent Performance Scorecard ────────────────────────── */}
                <section className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5">
                    <div className="mb-4">
                        <h2 className="text-sm font-semibold text-[--color-text]">Agent Performance</h2>
                        <p className="text-xs text-[--color-text-muted] mt-0.5">
                            Tickets resolved, response times, and SLA compliance per agent
                        </p>
                    </div>

                    {agent_performance.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-[--color-text-muted] text-sm">
                            No resolved tickets for selected period
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[--color-border]">
                                        <th className="text-left py-2 px-3 text-xs font-medium text-[--color-text-muted]">Agent</th>
                                        <th className="text-right py-2 px-3 text-xs font-medium text-[--color-text-muted]">Handled</th>
                                        <th className="text-right py-2 px-3 text-xs font-medium text-[--color-text-muted]">Avg 1st Response</th>
                                        <th className="text-right py-2 px-3 text-xs font-medium text-[--color-text-muted]">Avg Resolution</th>
                                        <th className="text-right py-2 px-3 text-xs font-medium text-[--color-text-muted]">SLA %</th>
                                        <th className="text-right py-2 px-3 text-xs font-medium text-[--color-text-muted]">CSAT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {agent_performance.map(row => {
                                        const slaColor =
                                            row.sla_compliance_pct === null ? 'text-[--color-text-muted]' :
                                            row.sla_compliance_pct >= 90    ? 'text-green-500' :
                                            row.sla_compliance_pct >= 70    ? 'text-amber-500' :
                                                                              'text-red-500';
                                        return (
                                            <tr key={row.agent_id} className="border-b border-[--color-border] last:border-0 hover:bg-[--color-bg]">
                                                <td className="py-2.5 px-3 font-medium text-[--color-text]">{row.agent}</td>
                                                <td className="py-2.5 px-3 text-right tabular-nums text-[--color-text]">
                                                    {row.tickets_handled}
                                                </td>
                                                <td className="py-2.5 px-3 text-right tabular-nums text-[--color-text]">
                                                    {row.avg_first_response_minutes !== null
                                                        ? formatMinutes(row.avg_first_response_minutes)
                                                        : '—'}
                                                </td>
                                                <td className="py-2.5 px-3 text-right tabular-nums text-[--color-text]">
                                                    {row.avg_resolution_minutes !== null
                                                        ? formatMinutes(row.avg_resolution_minutes)
                                                        : '—'}
                                                </td>
                                                <td className={`py-2.5 px-3 text-right tabular-nums font-semibold ${slaColor}`}>
                                                    {row.sla_compliance_pct !== null ? `${row.sla_compliance_pct}%` : '—'}
                                                </td>
                                                <td className="py-2.5 px-3 text-right text-[--color-text-muted]">
                                                    {row.csat_avg !== null ? row.csat_avg.toFixed(1) : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* ── Team Comparison ────────────────────────────────────── */}
                <section className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5 space-y-4">
                    <div>
                        <h2 className="text-sm font-semibold text-[--color-text]">Team Comparison</h2>
                        <p className="text-xs text-[--color-text-muted] mt-0.5">
                            Tickets resolved and average resolution time per team
                        </p>
                    </div>

                    {team_comparison.length === 0 ? (
                        <div className="flex items-center justify-center h-52 text-[--color-text-muted] text-sm">
                            No data for selected period
                        </div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart
                                    data={team_comparison}
                                    margin={{ top: 4, right: 16, left: 0, bottom: 40 }}
                                    barCategoryGap="30%"
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                    <XAxis
                                        dataKey="team"
                                        tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                                        tickLine={false}
                                        axisLine={false}
                                        angle={-30}
                                        textAnchor="end"
                                        interval={0}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        allowDecimals={false}
                                        tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={36}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tickFormatter={v => formatMinutes(v)}
                                        tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={52}
                                    />
                                    <Tooltip
                                        formatter={(value: number, name: string) =>
                                            name === 'Avg resolution'
                                                ? [formatMinutes(value), name]
                                                : [value, name]
                                        }
                                        contentStyle={{
                                            background: 'var(--color-surface)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                        cursor={{ fill: 'var(--color-border)', opacity: 0.4 }}
                                    />
                                    <Bar
                                        yAxisId="left"
                                        dataKey="tickets_handled"
                                        name="Tickets resolved"
                                        fill="#6366f1"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        yAxisId="right"
                                        dataKey="avg_resolution_minutes"
                                        name="Avg resolution"
                                        fill="#a78bfa"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>

                            {/* Legend */}
                            <div className="flex items-center gap-5 text-xs text-[--color-text-muted] justify-center">
                                <span className="flex items-center gap-1.5">
                                    <span className="inline-block w-3 h-3 rounded-sm bg-[#6366f1]" />
                                    Tickets resolved (left axis)
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="inline-block w-3 h-3 rounded-sm bg-[#a78bfa]" />
                                    Avg resolution time (right axis)
                                </span>
                            </div>
                        </>
                    )}
                </section>

                {/* ── Ticket Breakdown ──────────────────────────────────── */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-[--color-text]">Ticket Breakdown</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <DonutChart title="By Priority" data={priorityDonut} />
                        <DonutChart title="By Status"   data={statusDonut} />
                        <DonutChart title="By Category" data={categoryDonut} />
                    </div>
                </section>

                {/* ── SLA Compliance ─────────────────────────────────────── */}
                <section className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5">
                    <div className="mb-4">
                        <h2 className="text-sm font-semibold text-[--color-text]">SLA Compliance</h2>
                        <p className="text-xs text-[--color-text-muted] mt-0.5">
                            Tickets where both first-response and resolution SLA were met
                        </p>
                    </div>

                    {sla_compliance.total === 0 ? (
                        <div className="flex items-center justify-center h-40 text-[--color-text-muted] text-sm">
                            No SLA records for selected period
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-8">
                            {/* Gauge */}
                            <SlaGauge pct={sla_compliance.compliance_pct} />

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 flex-1 w-full">
                                {[
                                    { label: 'Total SLA tickets',       value: sla_compliance.total,                   color: 'text-[--color-text]' },
                                    { label: 'Fully compliant',          value: sla_compliance.compliant,               color: 'text-green-500' },
                                    { label: 'First response breached',  value: sla_compliance.first_response_breached, color: 'text-amber-500' },
                                    { label: 'Resolution breached',      value: sla_compliance.resolution_breached,     color: 'text-red-500' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="rounded-lg border border-[--color-border] p-4">
                                        <p className="text-xs text-[--color-text-muted] mb-1">{label}</p>
                                        <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

            </div>
        </AppLayout>
    );
}
