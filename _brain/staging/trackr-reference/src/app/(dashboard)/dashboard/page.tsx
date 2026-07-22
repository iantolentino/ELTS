"use client";

import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell, PieChart, Pie,
} from "recharts";
import { getSlaStatus, SLA_CONFIG } from "@/utils/sla";
import useSWR from "swr";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
} from "@tabler/icons-react";
import SkeletonStatCards from "@/components/ui/SkeletonStatCards";

const STATUS_COLORS: Record<string, string> = {
  OPEN:        "var(--color-open)",
  IN_PROGRESS: "var(--color-progress)",
  RESOLVED:    "var(--color-resolved)",
  CLOSED:      "var(--color-closed)",
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "var(--color-critical)",
  HIGH:     "var(--color-high)",
  MEDIUM:   "var(--color-medium)",
  LOW:      "var(--color-low)",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open", IN_PROGRESS: "In Progress", RESOLVED: "Resolved", CLOSED: "Closed",
};

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: "Critical", HIGH: "High", MEDIUM: "Medium", LOW: "Low",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:   "var(--popover)",
      border:       "1px solid var(--border)",
      borderRadius: 6,
      padding:      "8px 12px",
      boxShadow:    "var(--shadow-dropdown)",
    }}>
      <div style={{ color: "var(--foreground)", fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: "var(--muted-foreground)", fontSize: 12 }}>
          <span style={{ color: p.color }}>{p.value}</span> tickets
        </div>
      ))}
    </div>
  );
};

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

const date = new Date().toLocaleDateString("en-US", {
  weekday: "long", month: "long", day: "numeric", year: "numeric",
});

// ── Metric Card ────────────────────────────────────────────────────
interface MetricCardProps {
  label:       string;
  value:       number | string;
  percentage?: number;
  trendLabel?: string;
  sub?:        string;
}

function MetricCard({ label, value, percentage, trendLabel, sub }: MetricCardProps) {
  const isUp      = percentage !== undefined && percentage > 0;
  const isDown    = percentage !== undefined && percentage < 0;

  const TrendIcon = isUp ? IconTrendingUp : isDown ? IconTrendingDown : IconMinus;

  const badgeStyle = isUp ? {
    color:       "var(--color-resolved)",
    borderColor: "var(--color-resolved-bg)",
    background:  "var(--color-resolved-bg)",
  } : isDown ? {
    color:       "var(--color-critical)",
    borderColor: "var(--color-critical-bg)",
    background:  "var(--color-critical-bg)",
  } : {
    color:       "var(--muted-foreground)",
    borderColor: "var(--border)",
    background:  "transparent",
  };

  return (
    <Card className="@container/card">
      <CardHeader className="pb-2 pt-5 px-5">
        <CardDescription className="text-xs font-medium uppercase tracking-wide">
          {label}
        </CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums mt-1">
          {value}
        </CardTitle>
        {percentage !== undefined && (
          <CardAction>
            <Badge
              variant="outline"
              style={badgeStyle}
              className="gap-1 text-xs font-medium px-2 py-0.5"
            >
              <TrendIcon className="size-3" />
              {percentage > 0 ? "+" : ""}{percentage}%
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 px-5 pb-5 pt-2">
        {trendLabel && (
          <div className="flex gap-1.5 items-center text-sm font-medium text-foreground">
            {trendLabel}
            <TrendIcon className="size-3.5" />
          </div>
        )}
        {sub && (
          <div className="text-xs text-muted-foreground">{sub}</div>
        )}
      </CardFooter>
    </Card>
  );
}

export default function DashboardPage() {
  const [chartDays, setChartDays] = useState(7);

  const { data: stats, isLoading: loading } = useSWR(
    `/api/tickets/stats?days=${chartDays}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  // ── Skeleton ────────────────────────────────────────────────────────
  if (loading) return (
    <>
      <PageHeader title="Dashboard" subtitle={date} />
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px", background: "var(--background)" }}>
        <SkeletonStatCards count={4} />
        <SkeletonStatCards count={4} />
        {[0, 1].map((row) => (
          <div key={row} style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 10, marginBottom: 10 }}>
            {[0, 1].map((i) => (
              <Card key={i}>
                <CardContent style={{ padding: "16px 20px" }}>
                  <div className="skeleton" style={{ height: 13, width: "35%", borderRadius: 4, marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 10, width: "20%", borderRadius: 4, marginBottom: 16 }} />
                  <div className="skeleton" style={{ height: 200, borderRadius: 6 }} />
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </>
  );

  const statusData   = (stats?.statusCounts   ?? []).map((s: any) => ({ ...s, name: STATUS_LABELS[s.name]   ?? s.name }));
  const priorityData = (stats?.priorityCounts ?? []).map((p: any) => ({ ...p, name: PRIORITY_LABELS[p.name] ?? p.name }));

  // ── Percentages ──────────────────────────────────────────────────
  const totalSla      = (stats?.sla?.onTrack ?? 0) + (stats?.sla?.breached ?? 0) + (stats?.sla?.completed ?? 0) + (stats?.sla?.breachedClosed ?? 0);
  const onTrackPct    = totalSla === 0 ? 0 : Math.round((stats?.sla?.onTrack      ?? 0) / totalSla * 100);
  const breachedPct   = totalSla === 0 ? 0 : Math.round((stats?.sla?.breached     ?? 0) / totalSla * 100);
  const completedPct  = totalSla === 0 ? 0 : Math.round((stats?.sla?.completed    ?? 0) / totalSla * 100);
  const breachClPct   = totalSla === 0 ? 0 : Math.round((stats?.sla?.breachedClosed ?? 0) / totalSla * 100);

  const totalTickets  = (stats?.totals?.open ?? 0) + (stats?.totals?.inProgress ?? 0) + (stats?.totals?.resolved ?? 0);
  const resolvedPct   = totalTickets === 0 ? 0 : Math.round((stats?.totals?.resolved ?? 0) / totalTickets * 100);
  const criticalPct   = totalTickets === 0 ? 0 : -Math.round((stats?.totals?.critical ?? 0) / totalTickets * 100);

  return (
  <>
    <PageHeader title="Dashboard" subtitle={date} />

    <div style={{
      flex:          1,
      overflow:      "auto",
      padding:       "24px",
      background:    "var(--background)",
      display:       "flex",
      flexDirection: "column",
      gap:           16,
    }}>

      {/* ── Ticket stat cards ── */}
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 lg:grid-cols-4">
        <MetricCard
          label="Open Tickets"
          value={stats?.totals?.open ?? 0}
          percentage={0}
          trendLabel="Awaiting action"
          sub="Tickets pending response"
        />
        <MetricCard
          label="In Progress"
          value={stats?.totals?.inProgress ?? 0}
          trendLabel="Currently being worked on"
          sub="Active ticket count"
        />
        <MetricCard
          label="Resolved"
          value={stats?.totals?.resolved ?? 0}
          percentage={resolvedPct}
          trendLabel={resolvedPct >= 50 ? "Good resolution rate" : "Resolution needs attention"}
          sub="Closed tickets this period"
        />
        <MetricCard
          label="Critical"
          value={stats?.totals?.critical ?? 0}
          percentage={criticalPct}
          trendLabel={stats?.totals?.critical === 0 ? "No critical tickets" : "Needs immediate attention"}
          sub="High priority tickets"
        />
      </div>

      {/* ── SLA cards ── */}
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 lg:grid-cols-4">
        <MetricCard
          label="SLA On Track"
          value={stats?.sla?.onTrack ?? 0}
          percentage={onTrackPct}
          trendLabel={onTrackPct >= 50 ? "Healthy SLA compliance" : "SLA compliance at risk"}
          sub="Relative to total tickets"
        />
        <MetricCard
          label="SLA Breached"
          value={stats?.sla?.breached ?? 0}
          percentage={breachedPct > 0 ? -breachedPct : 0}
          trendLabel={breachedPct === 0 ? "No active breaches" : "Breaches need attention"}
          sub="Open tickets past deadline"
        />
        <MetricCard
          label="SLA Completed"
          value={stats?.sla?.completed ?? 0}
          percentage={completedPct}
          trendLabel={completedPct >= 50 ? "Strong completion rate" : "Completion rate below target"}
          sub="Closed within SLA"
        />
        <MetricCard
          label="Breached & Closed"
          value={stats?.sla?.breachedClosed ?? 0}
          percentage={breachClPct > 0 ? -breachClPct : 0}
          trendLabel={breachClPct === 0 ? "None breached on close" : "Some closed after breach"}
          sub="Closed after SLA breach"
        />
      </div>

      {/* ── Charts row 1 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <Card>
          <CardHeader style={{ padding: "20px 24px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <CardTitle style={{ fontSize: 13, fontWeight: 600 }}>Tickets Created</CardTitle>
                <CardDescription style={{ fontSize: 11, marginTop: 2 }}>
                  {chartDays === 7   ? "Last 7 days"   :
                   chartDays === 30  ? "Last 30 days"  :
                   chartDays === 90  ? "Last 3 months" :
                   chartDays === 180 ? "Last 6 months" :
                   "Last 12 months"}
                </CardDescription>
              </div>
              <div style={{
                display:      "flex",
                gap:          2,
                background:   "var(--muted)",
                borderRadius: 6,
                padding:      3,
              }}>
                {[
                  { label: "7D",  days: 7   },
                  { label: "30D", days: 30  },
                  { label: "3M",  days: 90  },
                  { label: "6M",  days: 180 },
                  { label: "1Y",  days: 365 },
                ].map((opt) => (
                  <button
                    key={opt.days}
                    onClick={() => setChartDays(opt.days)}
                    style={{
                      background:   chartDays === opt.days ? "var(--background)" : "transparent",
                      border:       "none",
                      borderRadius: 4,
                      color:        chartDays === opt.days ? "var(--foreground)" : "var(--muted-foreground)",
                      fontSize:     11,
                      fontWeight:   chartDays === opt.days ? 500 : 400,
                      padding:      "3px 8px",
                      cursor:       "pointer",
                      transition:   "all 0.1s",
                      fontFamily:   "inherit",
                      boxShadow:    chartDays === opt.days ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent style={{ padding: "16px 24px 24px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats?.chartData ?? stats?.last7Days ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={chartDays > 30 ? 0 : "preserveStartEnd"}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--foreground)"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader style={{ padding: "20px 24px 0" }}>
            <CardTitle style={{ fontSize: 13, fontWeight: 600 }}>By Status</CardTitle>
            <CardDescription style={{ fontSize: 11 }}>Ticket distribution</CardDescription>
          </CardHeader>
          <CardContent style={{ padding: "16px 24px 24px" }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={90}
                  paddingAngle={2}
                  cornerRadius={4}
                  startAngle={-90}
                  endAngle={270}
                >
                  {statusData.map((s: any, i: number) => (
                    <Cell key={s.name} fill={Object.values(STATUS_COLORS)[i % 4] as string} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {statusData.map((s: any, i: number) => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: Object.values(STATUS_COLORS)[i % 4] as string, opacity: 0.85 }} />
                    <span style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{s.name}</span>
                  </div>
                  <span style={{ color: "var(--foreground)", fontSize: 11, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts row 2 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <Card>
          <CardHeader style={{ padding: "20px 24px 0" }}>
            <CardTitle style={{ fontSize: 13, fontWeight: 600 }}>By Priority</CardTitle>
            <CardDescription style={{ fontSize: 11 }}>Ticket breakdown</CardDescription>
          </CardHeader>
          <CardContent style={{ padding: "16px 24px 24px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((_: any, index: number) => (
                    <Cell key={index} fill={Object.values(PRIORITY_COLORS)[index % 4] as string} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader style={{ padding: "20px 24px 0" }}>
            <CardTitle style={{ fontSize: 13, fontWeight: 600 }}>Recent Tickets</CardTitle>
            <CardDescription style={{ fontSize: 11 }}>Latest activity</CardDescription>
          </CardHeader>
          <CardContent style={{ padding: "16px 24px 24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(stats?.recentTickets ?? []).map((t: any) => {
                const slaStatus = getSlaStatus(t.slaDeadline, t.status, t.slaBreached);
                const slaCfg    = SLA_CONFIG[slaStatus];
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar style={{ width: 32, height: 32, borderRadius: 6, flexShrink: 0 }}>
                      <AvatarFallback style={{
                        borderRadius: 6, fontSize: 9, fontWeight: 600,
                        background: "var(--muted)", color: "var(--muted-foreground)",
                      }}>
                        {t.department?.name?.slice(0, 2).toUpperCase() ?? "—"}
                      </AvatarFallback>
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "var(--foreground)", fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.title}
                      </div>
                      <div style={{ color: "var(--muted-foreground)", fontSize: 11, marginTop: 1 }}>
                        {t.assignee?.name ?? "Unassigned"}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      style={{
                        fontSize:    10,
                        fontWeight:  500,
                        color:       slaCfg.color,
                        borderColor: slaCfg.color + "40",
                        background:  slaCfg.color + "10",
                        flexShrink:  0,
                      }}
                    >
                      {slaCfg.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  </>
);
}
