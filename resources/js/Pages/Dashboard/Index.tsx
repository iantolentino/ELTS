import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    AreaChart, Area, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useState } from 'react';

interface KPIs {
    ticket_volume:              number;
    open_tickets:               number;
    avg_first_response_minutes: number | null;
    avg_resolution_minutes:     number | null;
    sla_compliance_pct:         number | null;
}

interface TrendPoint {
    label: string;
    count: number;
}

interface CsatMetrics {
    avg_score:       number | null;
    total_responses: number;
    total_sent:      number;
    response_rate:   number | null;
}

interface CsatTrendPoint {
    label:     string;
    avg_score: number | null;
    responses: number;
}

interface NpsMetrics {
    nps_score:       number | null;
    promoters_pct:   number;
    passives_pct:    number;
    detractors_pct:  number;
    total_responses: number;
}

interface DashboardProps {
    kpis:       KPIs;
    trend:      TrendPoint[];
    csat:       CsatMetrics;
    csat_trend: CsatTrendPoint[];
    nps:        NpsMetrics;
    filters: {
        from:        string;
        to:          string;
        granularity: string;
    };
}

function formatMinutes(minutes: number | null): string {
    if (minutes === null) return '—';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function KpiCard({ label, value, sub, color = 'var(--color-primary)' }: {
    label: string; value: string | number; sub?: string; color?: string;
}) {
    return (
        <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5 flex flex-col gap-1">
            <span className="text-xs font-medium text-[--color-text-muted] uppercase tracking-wide">{label}</span>
            <span className="text-3xl font-bold" style={{ color }}>{value}</span>
            {sub && <span className="text-xs text-[--color-text-muted]">{sub}</span>}
        </div>
    );
}

function NpsBar({ label, pct, color }: { label: string; pct: number; color: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-[--color-text-muted] w-20 shrink-0">{label}</span>
            <div className="flex-1 h-2 rounded-full bg-[--color-border]">
                <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-xs font-medium text-[--color-text] w-10 text-right">{pct}%</span>
        </div>
    );
}

function npsColor(score: number | null): string {
    if (score === null) return 'var(--color-text-muted)';
    if (score >= 50)  return '#22c55e';
    if (score >= 0)   return '#f59e0b';
    return '#ef4444';
}

function csatColor(score: number | null): string {
    if (score === null) return 'var(--color-text-muted)';
    if (score >= 4.0) return '#22c55e';
    if (score >= 3.0) return '#f59e0b';
    return '#ef4444';
}

function csatEmoji(score: number | null): string {
    if (score === null) return '—';
    if (score >= 4.5) return '😄';
    if (score >= 3.5) return '🙂';
    if (score >= 2.5) return '😐';
    if (score >= 1.5) return '😕';
    return '😞';
}

export default function Dashboard({ kpis, trend, csat, csat_trend, nps, filters }: DashboardProps) {
    const [from, setFrom]               = useState(filters.from);
    const [to, setTo]                   = useState(filters.to);
    const [granularity, setGranularity] = useState(filters.granularity);

    function apply() {
        router.get('/dashboard', { from, to, granularity }, { preserveScroll: true });
    }

    const slaColor = kpis.sla_compliance_pct === null
        ? 'var(--color-text-muted)'
        : kpis.sla_compliance_pct >= 90 ? '#22c55e'
        : kpis.sla_compliance_pct >= 70 ? '#f59e0b'
        : '#ef4444';

    // Filter out null avg_score points for the line chart so gaps are visible
    const csatChartData = csat_trend.map(p => ({
        ...p,
        avg_score: p.avg_score ?? undefined,
    }));

    const hasCsatData = csat_trend.some(p => p.avg_score !== null);

    return (
        <AppLayout>
            <Head title="Dashboard" />

            <div className="px-6 py-6 space-y-6">

                {/* Header + date filters */}
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <h1 className="text-xl font-semibold text-[--color-text]">Dashboard</h1>

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
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-[--color-text-muted]">Granularity</label>
                            <select
                                value={granularity}
                                onChange={e => setGranularity(e.target.value)}
                                className="h-8 rounded-md border border-[--color-border] bg-[--color-surface] px-2 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                            >
                                <option value="day">Daily</option>
                                <option value="week">Weekly</option>
                                <option value="month">Monthly</option>
                            </select>
                        </div>
                        <button
                            onClick={apply}
                            className="h-8 px-4 rounded-md bg-[--color-primary] text-white text-sm font-medium hover:opacity-90"
                        >
                            Apply
                        </button>
                    </div>
                </div>

                {/* Ticket KPI cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <KpiCard
                        label="Open Tickets"
                        value={kpis.open_tickets.toLocaleString()}
                        sub="currently open"
                    />
                    <KpiCard
                        label="New (period)"
                        value={kpis.ticket_volume.toLocaleString()}
                        sub="tickets created"
                    />
                    <KpiCard
                        label="Avg First Response"
                        value={formatMinutes(kpis.avg_first_response_minutes)}
                        sub="from creation"
                    />
                    <KpiCard
                        label="Avg Resolution"
                        value={formatMinutes(kpis.avg_resolution_minutes)}
                        sub="from creation"
                    />
                    <KpiCard
                        label="SLA Compliance"
                        value={kpis.sla_compliance_pct !== null ? `${kpis.sla_compliance_pct}%` : '—'}
                        sub="resolution SLA"
                        color={slaColor}
                    />
                </div>

                {/* Volume trend chart */}
                <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-[--color-text] mb-4">Ticket Volume</h2>
                    {trend.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-[--color-text-muted] text-sm">
                            No data for selected period
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={trend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="var(--color-primary)" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                                    tickLine={false}
                                    axisLine={false}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={32}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 8,
                                        fontSize: 12,
                                    }}
                                />
                                <Legend iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    name="Tickets created"
                                    stroke="var(--color-primary)"
                                    strokeWidth={2}
                                    fill="url(#grad)"
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Satisfaction section */}
                <div>
                    <h2 className="text-base font-semibold text-[--color-text] mb-4">Customer Satisfaction</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                        {/* CSAT score card */}
                        <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5 flex flex-col gap-3">
                            <span className="text-xs font-medium text-[--color-text-muted] uppercase tracking-wide">CSAT Score</span>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold" style={{ color: csatColor(csat.avg_score) }}>
                                    {csat.avg_score !== null ? csat.avg_score.toFixed(1) : '—'}
                                </span>
                                {csat.avg_score !== null && (
                                    <span className="text-2xl mb-0.5">{csatEmoji(csat.avg_score)}</span>
                                )}
                                <span className="text-[--color-text-muted] text-sm mb-1">/ 5</span>
                            </div>
                            <div className="space-y-1 text-xs text-[--color-text-muted]">
                                <div className="flex justify-between">
                                    <span>Responses</span>
                                    <span className="font-medium text-[--color-text]">{csat.total_responses}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Surveys sent</span>
                                    <span className="font-medium text-[--color-text]">{csat.total_sent}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Response rate</span>
                                    <span className="font-medium text-[--color-text]">
                                        {csat.response_rate !== null ? `${csat.response_rate}%` : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* NPS score card */}
                        <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5 flex flex-col gap-3">
                            <span className="text-xs font-medium text-[--color-text-muted] uppercase tracking-wide">NPS Score</span>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold" style={{ color: npsColor(nps.nps_score) }}>
                                    {nps.nps_score !== null
                                        ? (nps.nps_score > 0 ? `+${nps.nps_score}` : `${nps.nps_score}`)
                                        : '—'}
                                </span>
                                <span className="text-[--color-text-muted] text-sm mb-1">/ 100</span>
                            </div>
                            <div className="space-y-2">
                                <NpsBar label="Promoters"  pct={nps.promoters_pct}  color="#22c55e" />
                                <NpsBar label="Passives"   pct={nps.passives_pct}   color="#f59e0b" />
                                <NpsBar label="Detractors" pct={nps.detractors_pct} color="#ef4444" />
                            </div>
                            <p className="text-xs text-[--color-text-muted]">
                                {nps.total_responses} response{nps.total_responses !== 1 ? 's' : ''} in period
                            </p>
                        </div>

                        {/* CSAT trend chart */}
                        <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5">
                            <span className="text-xs font-medium text-[--color-text-muted] uppercase tracking-wide block mb-4">
                                CSAT Trend
                            </span>
                            {!hasCsatData ? (
                                <div className="flex items-center justify-center h-[120px] text-[--color-text-muted] text-xs">
                                    No survey responses in period
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={140}>
                                    <LineChart data={csatChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            domain={[1, 5]}
                                            ticks={[1, 2, 3, 4, 5]}
                                            tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                                            tickLine={false}
                                            axisLine={false}
                                            width={24}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'var(--color-surface)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 8,
                                                fontSize: 11,
                                            }}
                                            formatter={(v: number) => [v?.toFixed(2), 'Avg CSAT']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="avg_score"
                                            name="Avg CSAT"
                                            stroke="#22c55e"
                                            strokeWidth={2}
                                            dot={{ r: 3, fill: '#22c55e' }}
                                            connectNulls={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
