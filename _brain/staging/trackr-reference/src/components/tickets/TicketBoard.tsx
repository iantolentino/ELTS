"use client";

import { useState } from "react";
import useSWR from "swr";
import TicketTable from "@/components/tickets/TicketTable";
import NewTicketModal from "@/components/tickets/NewTicketModal";
import StatCard from "@/components/dashboard/StatCard";
import SkeletonTable from "@/components/ui/SkeletonTable";
import SkeletonStatCards from "@/components/ui/SkeletonStatCards";
import PageHeader from "@/components/layout/PageHeader";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "@/config/constants";
import { useDebounce } from "use-debounce";
import { useAbac } from "@/hooks/useAbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  RiAddLine,
  RiTicketLine, RiCheckboxCircleLine, RiAlarmWarningLine,
  RiTicket2Line, RiUserLine, RiUserUnfollowLine, RiSearchLine,
  RiArrowDownSLine, RiCloseLine,
} from "react-icons/ri";
import { FaRegClock } from "react-icons/fa";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TicketBoard() {
  const [newOpen,        setNewOpen]        = useState(false);
  const [filterStatus,   setFilterStatus]   = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState<"all" | "me" | "unassigned">("all");
  const [search,         setSearch]         = useState("");
  const [debouncedSearch] = useDebounce(search, 400);
  const { canCreateTicket } = useAbac();

  const params = new URLSearchParams();
  params.set("includeMeta", "1");
  if (filterStatus   !== "all") params.set("status",   filterStatus);
  if (filterPriority !== "all") params.set("priority", filterPriority);
  if (debouncedSearch)          params.set("search",   debouncedSearch);
  if (filterAssignee === "me")         params.set("assignee", "me");
  if (filterAssignee === "unassigned") params.set("assignee", "unassigned");

  const { data: ticketResponse, isLoading, mutate } = useSWR(
    `/api/tickets?${params.toString()}`, fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000, keepPreviousData: true }
  );
  const tickets = ticketResponse?.data ?? [];

  const stats = {
    open:       tickets.filter((t: any) => t.status === "OPEN").length,
    inProgress: tickets.filter((t: any) => t.status === "IN_PROGRESS").length,
    resolved:   tickets.filter((t: any) => t.status === "RESOLVED").length,
    critical:   tickets.filter((t: any) => t.priority === "CRITICAL").length,
  };

  const unassignedCount  = ticketResponse?.meta?.unassignedCount ?? 0;
  const hasActiveFilters = filterStatus !== "all" || filterPriority !== "all" || filterAssignee !== "all" || !!debouncedSearch;
  const initialLoading   = isLoading;

  const clearFilters = () => {
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterAssignee("all");
    setSearch("");
  };

  const handleAdd = async (data: any) => {
    try {
      const res = await fetch("/api/tickets", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      if (res.ok) mutate();
    } catch (err) { console.error(err); }
  };

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  // ── Skeleton ───────────────────────────────────────────────────────
  if (initialLoading) return (
    <>
      <PageHeader title="Tickets" subtitle={date} />
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px", background: "var(--background)" }}>
        <SkeletonStatCards count={4} />
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div className="skeleton" style={{ flex: 1, height: 36, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: 240, height: 36, borderRadius: 6 }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <div className="skeleton" style={{ width: 80, height: 28, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: 80, height: 28, borderRadius: 6 }} />
          </div>
        </div>
        <SkeletonTable
          columns="90px 1fr 120px 100px 140px 130px 90px 50px" rows={7}
          cells={[
            { width: "60px" }, { width: "70%", shape: "double" },
            { width: "80px", shape: "badge" }, { width: "70px", shape: "badge" },
            { width: "60px", gap: true }, { width: "65px", shape: "badge" },
            { width: "55px" }, { width: "20px" },
          ]}
        />
      </div>
    </>
  );

  // ── Full render ────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        title="Tickets"
        subtitle={date}
        actions={
          canCreateTicket() && (
            <Button size="sm" onClick={() => setNewOpen(true)}>
              <RiAddLine size={14} /> New Ticket
            </Button>
          )
        }
      />

      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px", background: "var(--background)" }}>

        {/* ── Stat cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
          <StatCard label="Open"        value={stats.open}       sub="Awaiting action"           accent="var(--color-open)"     icon={<RiTicketLine        size={18} />} />
          <StatCard label="In Progress" value={stats.inProgress} sub="Being worked on"           accent="var(--color-progress)" icon={<FaRegClock          size={18} />} />
          <StatCard label="Resolved"    value={stats.resolved}   sub="Closed this week"          accent="var(--color-resolved)" icon={<RiCheckboxCircleLine size={18} />} />
          <StatCard label="Critical"    value={stats.critical}   sub="Needs immediate attention" accent="var(--color-critical)" icon={<RiAlarmWarningLine   size={18} />} />
        </div>

        {/* ── Filter bar ── */}
        <div style={{
          background:    "var(--card)",
          border:        "1px solid var(--border)",
          borderRadius:  8,
          padding:       "10px 14px",
          marginBottom:  12,
          display:       "flex",
          flexDirection: "column",
          gap:           8,
        }}>

          {/* Row 1 — search + assignee tabs */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>

            {/* Search */}
            <div style={{ position: "relative", flex: 1 }}>
              <RiSearchLine
                size={13}
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)", pointerEvents: "none", zIndex: 1 }}
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets…"
                style={{ paddingLeft: 30, fontSize: 13, height: 34, fontFamily: "inherit" }}
              />
            </div>

            {/* Assignee tabs */}
            <div style={{
              display:      "flex",
              gap:          2,
              background:   "var(--muted)",
              borderRadius: 6,
              padding:      3,
            }}>
              {([
                { id: "all",        label: "All",        icon: <RiTicket2Line      size={12} /> },
                { id: "me",         label: "Mine",       icon: <RiUserLine         size={12} /> },
                { id: "unassigned", label: "Unassigned", icon: <RiUserUnfollowLine size={12} /> },
              ] as const).map((f) => (
                <Button
                  key={f.id}
                  variant={filterAssignee === f.id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilterAssignee(f.id)}
                  style={{
                    fontSize:   12,
                    fontWeight: filterAssignee === f.id ? 500 : 400,
                    height:     28,
                    gap:        5,
                    fontFamily: "inherit",
                    color:      filterAssignee === f.id ? "var(--foreground)" : "var(--muted-foreground)",
                  }}
                >
                  {f.icon}
                  {f.label}
                  {f.id === "unassigned" && unassignedCount > 0 && filterAssignee !== "unassigned" && (
                    <span style={{
                      background:     "var(--destructive)",
                      color:          "#fff",
                      fontSize:       9,
                      fontWeight:     600,
                      borderRadius:   "50%",
                      width:          14,
                      height:         14,
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                    }}>
                      {unassignedCount}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Row 2 — dropdowns + chips */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>

            <span style={{ fontSize: 11, color: "var(--muted-foreground)", marginRight: 2 }}>
              Filter
            </span>

            {/* Status dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" style={{ fontSize: 12, height: 28, gap: 5, fontFamily: "inherit" }}>
                  {filterStatus !== "all" && (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_CONFIG[filterStatus as keyof typeof STATUS_CONFIG]?.color }} />
                  )}
                  {filterStatus !== "all" ? STATUS_CONFIG[filterStatus as keyof typeof STATUS_CONFIG]?.label : "Status"}
                  <RiArrowDownSLine size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" style={{ minWidth: 160 }}>
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={filterStatus} onValueChange={setFilterStatus}>
                  <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <DropdownMenuRadioItem key={k} value={k}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: v.color }} />
                        {v.label}
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Priority dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" style={{ fontSize: 12, height: 28, gap: 5, fontFamily: "inherit" }}>
                  {filterPriority !== "all" && (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: PRIORITY_CONFIG[filterPriority as keyof typeof PRIORITY_CONFIG]?.color }} />
                  )}
                  {filterPriority !== "all" ? PRIORITY_CONFIG[filterPriority as keyof typeof PRIORITY_CONFIG]?.label : "Priority"}
                  <RiArrowDownSLine size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" style={{ minWidth: 160 }}>
                <DropdownMenuLabel>Priority</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={filterPriority} onValueChange={setFilterPriority}>
                  <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                    <DropdownMenuRadioItem key={k} value={k}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: v.color }} />
                        {v.label}
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Active filter chips */}
            {filterStatus !== "all" && (
              <Badge variant="secondary" style={{ gap: 4, fontSize: 11, fontWeight: 500, cursor: "default" }}>
                {STATUS_CONFIG[filterStatus as keyof typeof STATUS_CONFIG]?.label}
                <RiCloseLine
                  size={11}
                  style={{ cursor: "pointer", opacity: 0.6 }}
                  onClick={() => setFilterStatus("all")}
                />
              </Badge>
            )}
            {filterPriority !== "all" && (
              <Badge variant="secondary" style={{ gap: 4, fontSize: 11, fontWeight: 500, cursor: "default" }}>
                {PRIORITY_CONFIG[filterPriority as keyof typeof PRIORITY_CONFIG]?.label}
                <RiCloseLine
                  size={11}
                  style={{ cursor: "pointer", opacity: 0.6 }}
                  onClick={() => setFilterPriority("all")}
                />
              </Badge>
            )}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                style={{
                  marginLeft: "auto",
                  fontSize:   11,
                  height:     26,
                  color:      "var(--muted-foreground)",
                  gap:        3,
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = "var(--destructive)")}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = "var(--muted-foreground)")}
              >
                <RiCloseLine size={11} /> Clear all
              </Button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <TicketTable tickets={tickets} isLoading={isLoading} />

        <div style={{ marginTop: 8, color: "var(--muted-foreground)", fontSize: 11, textAlign: "right" }}>
          {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
        </div>
      </div>

      {newOpen && <NewTicketModal onClose={() => setNewOpen(false)} onAdd={handleAdd} />}
    </>
  );
}
