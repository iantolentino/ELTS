import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
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

interface DashboardProps {
    kpis:    KPIs;
    trend:   TrendPoint[];
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

interface KpiCardProps {
    label:    string;
    value:    string | number;
    sub?:     string;
    color?:   string;
}

function KpiCard({ label, value, sub, color = 'var(--color-primary)' }: KpiCardProps) {
    return (
        <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5 flex flex-col gap-1">
            <span className="text-xs font-medium text-[--color-text-muted] uppercase tracking-wide">{label}</span>
            <span className="text-3xl font-bold" style={{ color }}>{value}</span>
            {sub && <span className="text-xs text-[--color-text-muted]">{sub}</span>}
        </div>
    );
}

export default function Dashboard({ kpis, trend, filters }: DashboardProps) {
    const [from, setFrom]               = useState(filters.from);
    const [to, setTo]                   = useState(filters.to);
    const [granularity, setGranularity] = useState(filters.granularity);

    function apply() {
        router.get('/dashboard', { from, to, granularity }, { preserveScroll: true });
    }

    const slaColor = kpis.sla_compliance_pct === null
        ? 'var(--color-text-muted)'
        : kpis.sla_compliance_pct >= 90
            ? '#22c55e'
            : kpis.sla_compliance_pct >= 70
                ? '#f59e0b'
                : '#ef4444';

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

                {/* KPI cards */}
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
                                <Legend
                                    iconSize={10}
                                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                                />
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

            </div>
        </AppLayout>
    );
}
