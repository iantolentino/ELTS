"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  RiArrowLeftLine, RiSearchLine, RiTicketLine,
  RiAddLine, RiTimeLine, RiCheckLine,
} from "react-icons/ri";
import { formatDate } from "@/utils/ticket";
import PortalAccountMenu from "@/components/portal/PortalAccountMenu";

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

export default function MyRequestsClient({ tickets, user }: { tickets: any[]; user: any }) {
  const router = useRouter();
  const [search,         setSearch]         = useState("");
  const [filterStatus,   setFilterStatus]   = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const isInternal = ["ADMIN", "MANAGER", "MEMBER"].includes((user as any)?.role);

  const filtered = tickets.filter((t) => {
    const matchSearch   = t.title.toLowerCase().includes(search.toLowerCase()) ||
                          t.ticketNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus   = filterStatus   === "all" || t.status   === filterStatus;
    const matchPriority = filterPriority === "all" || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const counts = {
    all:        tickets.length,
    open:       tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    resolved:   tickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status)).length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>

      {/* ── Nav ── */}
      <nav style={{
        borderBottom:   "1px solid var(--border)",
        background:     "var(--background)",
        padding:        "0 24px",
        height:         56,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        position:       "sticky",
        top:            0,
        zIndex:         50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: "var(--foreground)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="var(--background)" />
              <rect x="8" y="1" width="5" height="5" rx="1" fill="var(--background)" />
              <rect x="1" y="8" width="5" height="5" rx="1" fill="var(--background)" />
              <rect x="8" y="8" width="5" height="5" rx="1" fill="var(--background)" opacity="0.4" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--foreground)", letterSpacing: "-0.02em" }}>
            Trackr
          </span>
          <Badge variant="outline" style={{ fontSize: 10, marginLeft: 4 }}>Portal</Badge>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {isInternal && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/tickets")}
              style={{ fontSize: 13, fontFamily: "inherit" }}
            >
              Agent Dashboard
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/portal")}
            style={{ fontSize: 13, fontFamily: "inherit" }}
          >
            Browse Portal
          </Button>
          <PortalAccountMenu user={user} />
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/portal")}
              style={{ fontSize: 12, color: "var(--muted-foreground)", gap: 4, fontFamily: "inherit", paddingLeft: 0, marginBottom: 8 }}
            >
              <RiArrowLeftLine size={13} /> Back to Portal
            </Button>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.02em", marginBottom: 4 }}>
              My Requests
            </h1>
            <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
              Track and manage all requests you've submitted
            </p>
          </div>
          <Button
            onClick={() => router.push("/portal")}
            style={{ fontSize: 13, fontFamily: "inherit", gap: 6 }}
          >
            <RiAddLine size={14} /> New Request
          </Button>
        </div>

        {/* ── Summary pills ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { label: "All",         value: counts.all,        icon: <RiTicketLine size={12} /> },
            { label: "Open",        value: counts.open,       icon: <RiTimeLine   size={12} />, color: "var(--color-open)"     },
            { label: "In Progress", value: counts.inProgress, icon: <RiTimeLine   size={12} />, color: "var(--color-progress)" },
            { label: "Resolved",    value: counts.resolved,   icon: <RiCheckLine  size={12} />, color: "var(--color-resolved)" },
          ].map((s) => (
            <div key={s.label} style={{
              display:      "flex",
              alignItems:   "center",
              gap:          6,
              padding:      "6px 12px",
              borderRadius: 6,
              background:   "var(--muted)",
              fontSize:     12,
              color:        s.color ?? "var(--muted-foreground)",
            }}>
              {s.icon}
              <span style={{ color: "var(--foreground)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
              <span style={{ color: "var(--muted-foreground)" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <RiSearchLine size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)", pointerEvents: "none" }} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requests…"
              style={{ paddingLeft: 30, fontSize: 13, height: 34, fontFamily: "inherit" }}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger style={{ width: 130, fontSize: 12, height: 34, fontFamily: "inherit" }}>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger style={{ width: 130, fontSize: 12, height: 34, fontFamily: "inherit" }}>
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Ticket list ── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <RiTicketLine size={32} style={{ color: "var(--muted-foreground)", marginBottom: 12, opacity: 0.4 }} />
            <p style={{ color: "var(--foreground)", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              {tickets.length === 0 ? "No requests yet" : "No requests match your filters"}
            </p>
            <p style={{ color: "var(--muted-foreground)", fontSize: 13, marginBottom: 20 }}>
              {tickets.length === 0 ? "Submit your first request through the portal" : "Try adjusting your filters"}
            </p>
            {tickets.length === 0 && (
              <Button onClick={() => router.push("/portal")} style={{ fontSize: 13, fontFamily: "inherit", gap: 6 }}>
                <RiAddLine size={14} /> Browse Departments
              </Button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((t) => {
              const statusCfg   = STATUS_CONFIG[t.status];
              const priorityCfg = PRIORITY_CONFIG[t.priority];
              return (
                <Card
                  key={t.id}
                  style={{ cursor: "pointer", transition: "box-shadow 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-card)")}
                  onClick={() => router.push(`/portal/my-requests/${t.id}`)}
                >
                  <CardContent style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>

                      {/* Department avatar */}
                      <Avatar style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }}>
                        <AvatarFallback style={{
                          borderRadius: 8, fontSize: 10, fontWeight: 600,
                          background:   (t.department?.color ?? "#7c5cfc") + "18",
                          color:        t.department?.color ?? "var(--muted-foreground)",
                        }}>
                          {t.department?.name?.slice(0, 2).toUpperCase() ?? "—"}
                        </AvatarFallback>
                      </Avatar>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ color: "var(--muted-foreground)", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
                            {t.ticketNumber}
                          </span>
                          {t.department && (
                            <Badge variant="outline" style={{ fontSize: 10, color: t.department.color }}>
                              {t.department.name}
                            </Badge>
                          )}
                        </div>
                        <div style={{ color: "var(--foreground)", fontSize: 13, fontWeight: 500, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.title}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ color: "var(--muted-foreground)", fontSize: 11 }}>
                            {formatDate(t.createdAt)}
                          </span>
                          {t.assignee && (
                            <span style={{ color: "var(--muted-foreground)", fontSize: 11 }}>
                              Assigned to {t.assignee.name}
                            </span>
                          )}
                          {(t._count?.comments ?? 0) > 0 && (
                            <span style={{ color: "var(--muted-foreground)", fontSize: 11 }}>
                              {t._count.comments} comment{t._count.comments !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right side badges */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                        <Badge variant="outline" style={{
                          fontSize: 10, fontWeight: 500,
                          color:       statusCfg?.color,
                          borderColor: statusCfg?.color + "40",
                          background:  statusCfg?.color + "10",
                          gap:         4,
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusCfg?.color, display: "inline-block" }} />
                          {statusCfg?.label}
                        </Badge>
                        <Badge variant="outline" style={{
                          fontSize: 10, fontWeight: 500,
                          color:       priorityCfg?.color,
                          borderColor: priorityCfg?.color + "40",
                          background:  priorityCfg?.color + "10",
                          gap:         4,
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: priorityCfg?.color, display: "inline-block" }} />
                          {priorityCfg?.label}
                        </Badge>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        borderTop:  "1px solid var(--border)",
        padding:    "20px 24px",
        textAlign:  "center",
        color:      "var(--muted-foreground)",
        fontSize:   12,
      }}>
        © 2026 Powered by{" "}
        <span style={{ color: "var(--foreground)", fontWeight: 500 }}>Trackr</span>
        . All rights reserved.
      </div>
    </div>
  );
}
