"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { RiDownloadLine, RiCalendarLine, RiCloseLine } from "react-icons/ri";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

// ─── Types ────────────────────────────────────────────────────────────────────
type ViewTab = "overview" | "tickets" | "kpi";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN:        { label: "Open",        color: "var(--color-open)"      },
  IN_PROGRESS: { label: "In Progress", color: "var(--color-progress)"  },
  RESOLVED:    { label: "Resolved",    color: "var(--color-resolved)"  },
  CLOSED:      { label: "Closed",      color: "var(--color-closed)"    },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  CRITICAL: { label: "Critical", color: "var(--color-critical)" },
  HIGH:     { label: "High",     color: "var(--color-high)"     },
  MEDIUM:   { label: "Medium",   color: "var(--color-medium)"   },
  LOW:      { label: "Low",      color: "var(--color-low)"      },
};

const KPI_GRADE = (score: number) => {
  if (score >= 80) return { label: "Excellent", color: "var(--color-resolved)" };
  if (score >= 60) return { label: "Good",      color: "var(--color-progress)" };
  if (score >= 40) return { label: "Fair",      color: "var(--color-high)"     };
  return                  { label: "Poor",      color: "var(--color-critical)" };
};

const SLA_COLORS = [
  "var(--color-resolved)",
  "var(--color-critical)",
  "var(--color-progress)",
];

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

// ─── Tooltip ──────────────────────────────────────────────────────────────────
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
      <div style={{ color: "var(--foreground)", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: "var(--muted-foreground)", fontSize: 12 }}>
          <span style={{ color: p.color }}>{p.name}</span>: {p.value}
        </div>
      ))}
    </div>
  );
};

// ─── CSV Export ───────────────────────────────────────────────────────────────
const exportCSV = (tickets: any[]) => {
  const headers = ["Ticket #", "Title", "Status", "Priority", "Assignee", "Department", "Created", "SLA Deadline"];
  const rows    = tickets.map((t) => [
    t.ticketNumber,
    `"${t.title.replace(/"/g, '""')}"`,
    t.status, t.priority,
    t.assignee?.name   ?? "Unassigned",
    t.department?.name ?? "—",
    new Date(t.createdAt).toLocaleDateString(),
    t.slaDeadline ? new Date(t.slaDeadline).toLocaleDateString() : "—",
  ]);
  const csv  = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `trackr-report-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── PDF Export ───────────────────────────────────────────────────────────────
const exportPDF = (summary: any, kpiData: any[]) => {
  const html = `
    <html><head><title>Trackr Report</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
      h1   { font-size: 24px; margin-bottom: 4px; }
      h2   { font-size: 16px; margin: 24px 0 12px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
      p    { color: #666; font-size: 13px; margin-bottom: 24px; }
      .stats { display: flex; gap: 16px; margin-bottom: 24px; }
      .stat  { background: #f5f5f5; border-radius: 8px; padding: 16px 24px; flex: 1; text-align: center; }
      .stat-value { font-size: 28px; font-weight: 700; color: #333; }
      .stat-label { font-size: 12px; color: #888; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th    { background: #f5f5f5; padding: 8px 12px; text-align: left; font-weight: 600; }
      td    { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
    </style></head>
    <body>
      <h1>Trackr Report</h1>
      <p>Generated on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      <h2>Summary</h2>
      <div class="stats">
        <div class="stat"><div class="stat-value">${summary?.total ?? 0}</div><div class="stat-label">Total Tickets</div></div>
        <div class="stat"><div class="stat-value">${summary?.resolved ?? 0}</div><div class="stat-label">Resolved</div></div>
        <div class="stat"><div class="stat-value">${summary?.breached ?? 0}</div><div class="stat-label">SLA Breached</div></div>
        <div class="stat"><div class="stat-value">${summary?.avgResolutionHrs ?? 0}h</div><div class="stat-label">Avg Resolution</div></div>
      </div>
      <h2>Member KPI</h2>
      <table>
        <thead><tr><th>Member</th><th>Assigned</th><th>Resolved</th><th>SLA Breached</th><th>Avg Time</th><th>KPI Score</th></tr></thead>
        <tbody>
          ${kpiData.map((m) => `
            <tr>
              <td>${m.name}</td><td>${m.assigned}</td><td>${m.resolved}</td>
              <td>${m.breached}</td><td>${m.avgResolutionHrs}h</td>
              <td>${m.kpiScore} — ${KPI_GRADE(m.kpiScore).label}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </body></html>
  `;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.print();
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [activeTab,      setActiveTab]      = useState<ViewTab>("overview");
  const [filterStatus,   setFilterStatus]   = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterDept,     setFilterDept]     = useState("");
  const [dateRange,      setDateRange]      = useState<DateRange | undefined>();
  const [calOpen,        setCalOpen]        = useState(false);
  const [sortCol,        setSortCol]        = useState("createdAt");
  const [sortDir,        setSortDir]        = useState<"asc" | "desc">("desc");
  const [tempRange, setTempRange] = useState<DateRange | undefined>();

  const params = new URLSearchParams();
  if (filterStatus)          params.set("status",      filterStatus);
  if (filterPriority)        params.set("priority",    filterPriority);
  if (filterDept)            params.set("departmentId", filterDept);
  if (dateRange?.from)       params.set("dateFrom",    format(dateRange.from, "yyyy-MM-dd"));
  if (dateRange?.to)         params.set("dateTo",      format(dateRange.to,   "yyyy-MM-dd"));

  const { data, isLoading } = useSWR(
    `/api/reports?${params.toString()}`, fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const departments = useMemo(() => {
    if (!data?.tickets) return [];
    const seen = new Map();
    data.tickets.forEach((t: any) => {
      if (t.department && !seen.has(t.department.id)) seen.set(t.department.id, t.department);
    });
    return Array.from(seen.values());
  }, [data?.tickets]);

  const sortedTickets = useMemo(() => {
    if (!data?.tickets) return [];
    return [...data.tickets].sort((a: any, b: any) => {
      const aVal = a[sortCol] ?? "";
      const bVal = b[sortCol] ?? "";
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data?.tickets, sortCol, sortDir]);

  const slaChartData = [
    { name: "On Track", value: data?.summary?.onTrack  ?? 0 },
    { name: "Breached", value: data?.summary?.breached ?? 0 },
    { name: "Resolved", value: data?.summary?.resolved ?? 0 },
  ];

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const hasFilters = filterStatus || filterPriority || filterDept || dateRange?.from;

  const clearFilters = () => {
    setFilterStatus("");
    setFilterPriority("");
    setFilterDept("");
    setDateRange(undefined);
  };

  // ── Shared filter bar ──────────────────────────────────────────────
  const FilterBar = () => (
    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>

      {/* Status */}
      <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
        <SelectTrigger style={{ width: 130, fontSize: 12, height: 32, fontFamily: "inherit" }}>
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <SelectItem key={k} value={k}>
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: v.color, display: "inline-block" }} />
                {v.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority */}
      <Select value={filterPriority || "all"} onValueChange={(v) => setFilterPriority(v === "all" ? "" : v)}>
        <SelectTrigger style={{ width: 130, fontSize: 12, height: 32, fontFamily: "inherit" }}>
          <SelectValue placeholder="All Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
            <SelectItem key={k} value={k}>
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: v.color, display: "inline-block" }} />
                {v.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Department */}
      <Select value={filterDept || "all"} onValueChange={(v) => setFilterDept(v === "all" ? "" : v)}>
        <SelectTrigger style={{ width: 150, fontSize: 12, height: 32, fontFamily: "inherit" }}>
          <SelectValue placeholder="All Departments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map((d: any) => (
            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date range picker */}
      <Popover open={calOpen} onOpenChange={(open) => {
        setCalOpen(open);
        if (open) setTempRange(dateRange); // reset temp to current on open
      }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            style={{
              height:     32,
              fontSize:   12,
              fontFamily: "inherit",
              fontWeight: 400,
              gap:        6,
              color:      dateRange?.from ? "var(--foreground)" : "var(--muted-foreground)",
              minWidth:   200,
              justifyContent: "flex-start",
            }}
          >
            <RiCalendarLine size={13} style={{ flexShrink: 0 }} />
            {dateRange?.from ? (
              dateRange.to
                ? `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`
                : format(dateRange.from, "MMM d, yyyy")
            ) : (
              <span style={{ color: "var(--muted-foreground)" }}>
                {format(new Date(), "MMM d, yyyy")} – {format(new Date(), "MMM d, yyyy")}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" style={{ padding: 0, width: "auto" }}>
          {/* Quick presets */}
          <div style={{
            display:       "flex",
            gap:           4,
            padding:       "10px 12px",
            borderBottom:  "1px solid var(--border)",
            flexWrap:      "wrap",
          }}>
            {[
              { label: "Today",      from: new Date(),                                          to: new Date()                                        },
              { label: "Last 7d",    from: new Date(Date.now() - 6  * 86400000),                to: new Date()                                        },
              { label: "Last 30d",   from: new Date(Date.now() - 29 * 86400000),                to: new Date()                                        },
              { label: "This month", from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), to: new Date()                               },
              { label: "Last month", from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), to: new Date(new Date().getFullYear(), new Date().getMonth(), 0) },
            ].map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => setTempRange({ from: preset.from, to: preset.to })}
                style={{
                  height:     26,
                  fontSize:   11,
                  fontFamily: "inherit",
                  fontWeight: 400,
                  color:      tempRange?.from?.toDateString() === preset.from.toDateString() && tempRange?.to?.toDateString() === preset.to.toDateString()
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
                  borderColor: tempRange?.from?.toDateString() === preset.from.toDateString() && tempRange?.to?.toDateString() === preset.to.toDateString()
                    ? "var(--border-strong)"
                    : "var(--border)",
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar */}
          <Calendar
            mode="range"
            selected={tempRange}
            onSelect={setTempRange}
            numberOfMonths={2}
            initialFocus
          />

          {/* Footer — Apply + Clear */}
          <div style={{
            display:      "flex",
            justifyContent: "space-between",
            alignItems:   "center",
            padding:      "10px 12px",
            borderTop:    "1px solid var(--border)",
            gap:          8,
          }}>
            <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
              {tempRange?.from && tempRange?.to
                ? `${format(tempRange.from, "MMM d")} – ${format(tempRange.to, "MMM d, yyyy")}`
                : tempRange?.from
                ? `From ${format(tempRange.from, "MMM d, yyyy")}`
                : "Select a date range"
              }
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTempRange(undefined);
                  setDateRange(undefined);
                  setCalOpen(false);
                }}
                style={{ fontSize: 11, height: 28, fontFamily: "inherit" }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setDateRange(tempRange);
                  setCalOpen(false);
                }}
                disabled={!tempRange?.from}
                style={{ fontSize: 11, height: 28, fontFamily: "inherit" }}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          style={{ fontSize: 11, height: 32, color: "var(--muted-foreground)", fontFamily: "inherit", gap: 4 }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = "var(--destructive)")}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = "var(--muted-foreground)")}
        >
          <RiCloseLine size={12} /> Clear
        </Button>
      )}
    </div>
  );

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Analyze performance, SLA compliance and team KPIs"
        actions={
          <div style={{ display: "flex", gap: 6 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => data?.tickets && exportCSV(data.tickets)}
              style={{ fontSize: 12, gap: 5, fontFamily: "inherit" }}
            >
              <RiDownloadLine size={13} /> CSV
            </Button>
            <Button
              size="sm"
              onClick={() => data && exportPDF(data.summary, data.kpiData)}
              style={{ fontSize: 12, gap: 5, fontFamily: "inherit" }}
            >
              <RiDownloadLine size={13} /> PDF
            </Button>
          </div>
        }
      />

      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px", background: "var(--background)" }}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ViewTab)}>

          {/* ── Tab triggers ── */}
          <TabsList style={{ marginBottom: 16, height: "auto", padding: 4, width: "fit-content" }}>
            <TabsTrigger value="overview" style={{ fontSize: 13, fontFamily: "inherit", padding: "6px 16px", height: 32 }}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="tickets"  style={{ fontSize: 13, fontFamily: "inherit", padding: "6px 16px", height: 32 }}>
              Ticket Log
            </TabsTrigger>
            <TabsTrigger value="kpi"      style={{ fontSize: 13, fontFamily: "inherit", padding: "6px 16px", height: 32 }}>
              KPI / Members
            </TabsTrigger>
          </TabsList>

          {/* ── Loading ── */}
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent style={{ padding: "16px 20px" }}>
                      <div className="skeleton" style={{ height: 28, width: "40%", borderRadius: 4, marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 10, width: "60%", borderRadius: 4 }} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* ── OVERVIEW ── */}
              <TabsContent value="overview">
                <FilterBar />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                    {[
                      { label: "Total Tickets",  value: data?.summary?.total              ?? 0,    color: "var(--foreground)"     },
                      { label: "Resolved",       value: data?.summary?.resolved            ?? 0,    color: "var(--color-resolved)" },
                      { label: "SLA Breached",   value: data?.summary?.breached            ?? 0,    color: "var(--color-critical)" },
                      { label: "Avg Resolution", value: `${data?.summary?.avgResolutionHrs ?? 0}h`, color: "var(--color-progress)" },
                    ].map((s) => (
                      <Card key={s.label}>
                        <CardContent style={{ padding: "16px 20px" }}>
                          <div style={{ color: s.color, fontSize: 26, fontWeight: 700, fontVariantNumeric: "tabular-nums", lineHeight: 1, marginBottom: 4 }}>
                            {s.value}
                          </div>
                          <div style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{s.label}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 10 }}>
                    <Card>
                      <CardHeader style={{ padding: "16px 20px 0" }}>
                        <CardTitle style={{ fontSize: 13, fontWeight: 600 }}>Created vs Resolved</CardTitle>
                        <CardDescription style={{ fontSize: 11 }}>Last 14 days</CardDescription>
                      </CardHeader>
                      <CardContent style={{ padding: "12px 20px 16px" }}>
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={data?.createdVsResolved ?? []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }} />
                            <Line type="monotone" dataKey="created"  name="Created"  stroke="var(--color-progress)" strokeWidth={1.5} dot={false} />
                            <Line type="monotone" dataKey="resolved" name="Resolved" stroke="var(--color-resolved)" strokeWidth={1.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader style={{ padding: "16px 20px 0" }}>
                        <CardTitle style={{ fontSize: 13, fontWeight: 600 }}>SLA Compliance</CardTitle>
                        <CardDescription style={{ fontSize: 11 }}>Current period</CardDescription>
                      </CardHeader>
                      <CardContent style={{ padding: "12px 20px 16px" }}>
                        <ResponsiveContainer width="100%" height={140}>
                          <PieChart>
                            <Pie data={slaChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value" stroke="none">
                              {slaChartData.map((_, i) => <Cell key={i} fill={SLA_COLORS[i]} opacity={0.85} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 4 }}>
                          {slaChartData.map((s, i) => (
                            <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: SLA_COLORS[i], opacity: 0.85 }} />
                                <span style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{s.name}</span>
                              </div>
                              <span style={{ color: "var(--foreground)", fontSize: 11, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {data?.departmentStats?.length > 0 && (
                    <Card>
                      <CardHeader style={{ padding: "16px 20px 0" }}>
                        <CardTitle style={{ fontSize: 13, fontWeight: 600 }}>Tickets by Department</CardTitle>
                        <CardDescription style={{ fontSize: 11 }}>Total ticket count per department</CardDescription>
                      </CardHeader>
                      <CardContent style={{ padding: "12px 20px 16px" }}>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={data.departmentStats.map((d: any) => ({ name: d.name, tickets: d._count.tickets }))} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="tickets" name="Tickets" radius={[4, 4, 0, 0]} fill="var(--foreground)" opacity={0.15} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* ── TICKET LOG ── */}
              <TabsContent value="tickets">
                <FilterBar />
                <Card style={{ overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 120px 100px 140px 140px 120px", borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
                    {[
                      { label: "Ticket #",   col: "ticketNumber" },
                      { label: "Title",      col: "title"        },
                      { label: "Status",     col: "status"       },
                      { label: "Priority",   col: "priority"     },
                      { label: "Assignee",   col: "assignee"     },
                      { label: "Department", col: "department"   },
                      { label: "Created",    col: "createdAt"    },
                    ].map(({ label, col }) => (
                      <div key={col} onClick={() => handleSort(col)} style={{ padding: "10px 14px", color: sortCol === col ? "var(--foreground)" : "var(--muted-foreground)", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, userSelect: "none" }}>
                        {label} {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : ""}
                      </div>
                    ))}
                  </div>

                  {sortedTickets.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--muted-foreground)", fontSize: 13 }}>
                      No tickets match your filters
                    </div>
                  ) : sortedTickets.map((t: any, i: number) => (
                    <div key={t.id}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--muted)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      style={{ display: "grid", gridTemplateColumns: "120px 1fr 120px 100px 140px 140px 120px", borderBottom: i < sortedTickets.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", transition: "background 0.1s" }}
                    >
                      <div style={{ padding: "11px 14px", color: "var(--muted-foreground)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{t.ticketNumber}</div>
                      <div style={{ padding: "11px 14px", color: "var(--foreground)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                      <div style={{ padding: "11px 14px" }}>
                        <Badge variant="outline" style={{ fontSize: 10, fontWeight: 500, color: STATUS_CONFIG[t.status]?.color, gap: 5 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_CONFIG[t.status]?.color, display: "inline-block" }} />
                          {STATUS_CONFIG[t.status]?.label ?? t.status}
                        </Badge>
                      </div>
                      <div style={{ padding: "11px 14px" }}>
                        <Badge variant="outline" style={{ fontSize: 10, fontWeight: 500, color: "var(--muted-foreground)", gap: 5 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: PRIORITY_CONFIG[t.priority]?.color, display: "inline-block" }} />
                          {PRIORITY_CONFIG[t.priority]?.label ?? t.priority}
                        </Badge>
                      </div>
                      <div style={{ padding: "11px 14px", color: "var(--muted-foreground)", fontSize: 12 }}>{t.assignee?.name ?? "Unassigned"}</div>
                      <div style={{ padding: "11px 14px" }}>
                        {t.department && (
                          <Badge variant="outline" style={{ fontSize: 10, fontWeight: 500, color: "var(--muted-foreground)" }}>
                            {t.department.name}
                          </Badge>
                        )}
                      </div>
                      <div style={{ padding: "11px 14px", color: "var(--muted-foreground)", fontSize: 12 }}>{new Date(t.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))}

                  <div style={{ padding: "10px 14px", color: "var(--muted-foreground)", fontSize: 11, borderTop: "1px solid var(--border)", background: "var(--muted)" }}>
                    {sortedTickets.length} ticket{sortedTickets.length !== 1 ? "s" : ""}
                  </div>
                </Card>
              </TabsContent>

              {/* ── KPI ── */}
              <TabsContent value="kpi">
                <FilterBar />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                    {(data?.kpiData ?? []).map((m: any) => {
                      const grade = KPI_GRADE(m.kpiScore);
                      const bars  = Math.round(m.kpiScore / 20);
                      return (
                        <Card key={m.id}>
                          <CardContent style={{ padding: "16px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                              <Avatar style={{ width: 36, height: 36, flexShrink: 0 }}>
                                <AvatarFallback style={{ fontSize: 11, fontWeight: 600, background: "var(--muted)", color: "var(--foreground)" }}>
                                  {m.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: "var(--foreground)", fontWeight: 500, fontSize: 13 }}>{m.name}</div>
                                <div style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{m.department?.name ?? "—"}</div>
                              </div>
                              <Badge variant="outline" style={{ color: grade.color, fontSize: 11, gap: 4 }}>
                                {m.kpiScore} · {grade.label}
                              </Badge>
                            </div>
                            <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
                              {Array.from({ length: 5 }, (_, i) => (
                                <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i < bars ? grade.color : "var(--border)" }} />
                              ))}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                              {[
                                { label: "Assigned", value: m.assigned,               color: "var(--foreground)"      },
                                { label: "Resolved", value: m.resolved,               color: "var(--color-resolved)"  },
                                { label: "Open",     value: m.open,                   color: "var(--color-progress)"  },
                                { label: "Breached", value: m.breached,               color: "var(--color-critical)"  },
                                { label: "Critical", value: m.critical,               color: "var(--color-high)"      },
                                { label: "Avg Time", value: `${m.avgResolutionHrs}h`, color: "var(--muted-foreground)" },
                              ].map((s) => (
                                <div key={s.label} style={{ background: "var(--muted)", borderRadius: 6, padding: "7px 8px", textAlign: "center" }}>
                                  <div style={{ color: s.color, fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                                  <div style={{ color: "var(--muted-foreground)", fontSize: 10, marginTop: 1 }}>{s.label}</div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <Card style={{ overflow: "hidden" }}>
                    <CardHeader style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                      <CardTitle style={{ fontSize: 13, fontWeight: 600 }}>KPI Summary Table</CardTitle>
                    </CardHeader>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px 80px 100px 120px", background: "var(--muted)" }}>
                      {["Member", "Assigned", "Resolved", "Open", "Breached", "Critical", "Avg Time", "KPI Score"].map((h) => (
                        <div key={h} style={{ padding: "9px 14px", color: "var(--muted-foreground)", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {(data?.kpiData ?? []).map((m: any) => {
                      const grade = KPI_GRADE(m.kpiScore);
                      return (
                        <div key={m.id}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--muted)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px 80px 100px 120px", borderTop: "1px solid var(--border)", alignItems: "center", transition: "background 0.1s" }}
                        >
                          <div style={{ padding: "11px 14px" }}>
                            <div style={{ color: "var(--foreground)", fontSize: 12, fontWeight: 500 }}>{m.name}</div>
                            <div style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{m.department?.name}</div>
                          </div>
                          <div style={{ padding: "11px 14px", color: "var(--foreground)",       fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{m.assigned}</div>
                          <div style={{ padding: "11px 14px", color: "var(--color-resolved)",   fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{m.resolved}</div>
                          <div style={{ padding: "11px 14px", color: "var(--color-progress)",   fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{m.open}</div>
                          <div style={{ padding: "11px 14px", color: "var(--color-critical)",   fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{m.breached}</div>
                          <div style={{ padding: "11px 14px", color: "var(--color-high)",       fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{m.critical}</div>
                          <div style={{ padding: "11px 14px", color: "var(--muted-foreground)", fontSize: 12 }}>{m.avgResolutionHrs}h</div>
                          <div style={{ padding: "11px 14px" }}>
                            <Badge variant="outline" style={{ fontSize: 10, fontWeight: 500, color: grade.color, gap: 4 }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: grade.color, display: "inline-block" }} />
                              {m.kpiScore} · {grade.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </Card>
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </>
  );
}