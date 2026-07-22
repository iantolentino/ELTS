"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import TicketBadge from "@/components/ui/TicketBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/config/constants";
import { useAbac } from "@/hooks/useAbac";
import { getInitials, formatDate } from "@/utils/ticket";
import { getSlaStatus, getTimeRemaining, SLA_CONFIG } from "@/utils/sla";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  RiUserAddLine, RiDeleteBinLine, RiArrowLeftLine,
  RiSendPlaneLine, RiArrowDownSLine, RiUserLine,
} from "react-icons/ri";

const ROLE_COLORS: Record<string, string> = {
  ADMIN:   "var(--color-critical)",
  MANAGER: "var(--color-high)",
  MEMBER:  "var(--color-progress)",
};

export default function TicketDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const [ticket,        setTicket]        = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [comment,       setComment]       = useState("");
  const [posting,       setPosting]       = useState(false);
  const [deleteComment, setDeleteComment] = useState<{ id: string } | null>(null);
  const [deleteTicket,  setDeleteTicket]  = useState(false);
  const [members,       setMembers]       = useState<any[]>([]);
  const [reassigning,   setReassigning]   = useState(false);

  const { canChangeStatus, canAddComment, canDeleteComment, canDeleteTicket, canSelfAssign, canReassign, canEditPriority } = useAbac();

  const fetchTicket = async () => {
    const res  = await fetch(`/api/tickets/${id}`);
    const data = await res.json();
    setTicket(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchTicket(); }, [id]);

  // Fetch members when ticket loads
  useEffect(() => {
    if (!ticket?.department?.id) return;
    fetch(`/api/users?departmentId=${ticket.department.id}&status=ACTIVE`)
      .then((r) => r.json())
      .then((d) => setMembers(d.data ?? []));
  }, [ticket?.department?.id]);

  const handleSelfAssign = async () => {
    await fetch(`/api/tickets/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ selfAssign: true }),
    });
    fetchTicket();
  };

  const handleReassign = async (userId: string) => {
    setReassigning(true);
    await fetch(`/api/tickets/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ assigneeId: userId }),
    });
    await fetchTicket();
    setReassigning(false);
  };

  const handleUnassign = async () => {
    setReassigning(true);
    await fetch(`/api/tickets/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ assigneeId: null }),
    });
    await fetchTicket();
    setReassigning(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    setTicket((t: any) => ({ ...t, status: newStatus }));
    await fetch(`/api/tickets/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: newStatus }),
    });
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    const res  = await fetch(`/api/tickets/${id}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ body: comment }),
    });
    const data = await res.json();
    if (data.data) {
      setTicket((t: any) => ({ ...t, comments: [...(t.comments ?? []), data.data] }));
    }
    setComment("");
    setPosting(false);
  };

  const handleDeleteComment = async () => {
    if (!deleteComment) return;
    await fetch(`/api/tickets/${id}/comments/${deleteComment.id}`, { method: "DELETE" });
    setTicket((t: any) => ({ ...t, comments: t.comments.filter((c: any) => c.id !== deleteComment.id) }));
    setDeleteComment(null);
  };

  const handleDeleteTicket = async () => {
    await fetch(`/api/tickets/${id}`, { method: "DELETE" });
    router.push("/tickets");
  };

  const handlePriorityChange = async (newPriority: string) => {
  setTicket((t: any) => ({ ...t, priority: newPriority }));
  await fetch(`/api/tickets/${id}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ priority: newPriority }),
  });
};

  // ── Loading ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
      <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>Loading ticket...</p>
    </div>
  );

  if (!ticket) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
      <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>Ticket not found.</p>
    </div>
  );

  const ticketAttrs = {
    creatorId:    ticket.creator?.id    ?? "",
    assigneeId:   ticket.assignee?.id   ?? null,
    departmentId: ticket.department?.id ?? null,
    status:       ticket.status,
  };

  const slaStatus = getSlaStatus(ticket.slaDeadline, ticket.status, ticket.slaBreached);
  const slaCfg    = SLA_CONFIG[slaStatus];
  const timeLeft = getTimeRemaining(ticket.slaDeadline, ticket.status);
  const statusCfg = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG];

  const canReassignTicket = canReassign?.(ticketAttrs);
  const customFieldRows = Object.entries(ticket.customFields ?? {}).map(([key, value]) => ({
    key,
    label: ticket.requestType?.fields?.find((field: any) => field.key === key)?.label ?? key,
    value,
  })).filter((field) => field.value !== null && field.value !== "");

  return (
    <>
      {/* ── Header ── */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        padding:      "14px 24px",
        flexShrink:   0,
        background:   "var(--background)",
      }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/tickets")}
            style={{ fontSize: 12, color: "var(--muted-foreground)", gap: 4, fontFamily: "inherit", height: 26, padding: "0 6px" }}
          >
            <RiArrowLeftLine size={13} /> Tickets
          </Button>
          <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>/</span>
          <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>{ticket.ticketNumber}</span>
        </div>

        {/* Title */}
        <h1 style={{
          fontWeight:    600,
          fontSize:      18,
          color:         "var(--foreground)",
          letterSpacing: "-0.02em",
          lineHeight:    1.3,
          marginBottom:  10,
        }}>
          {ticket.title}
        </h1>

        {/* Status + badges row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {canChangeStatus(ticketAttrs) ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  style={{
                    fontSize:    12,
                    gap:         5,
                    fontFamily:  "inherit",
                    color:       statusCfg?.color ?? "var(--muted-foreground)",
                    borderColor: "var(--border)",
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusCfg?.color, display: "inline-block" }} />
                  {statusCfg?.label ?? ticket.status}
                  <RiArrowDownSLine size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" style={{ minWidth: 160 }}>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handleStatusChange(key)}
                    style={{
                      fontSize:   13,
                      fontWeight: ticket.status === key ? 500 : 400,
                      color:      ticket.status === key ? "var(--foreground)" : "var(--muted-foreground)",
                      gap:        8,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, display: "inline-block", flexShrink: 0 }} />
                    {cfg.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <TicketBadge type="status" value={ticket.status} />
          )}

          {/* Priority dropdown */}
          {canEditPriority(ticketAttrs) ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  style={{
                    fontSize:    12,
                    gap:         5,
                    fontFamily:  "inherit",
                    borderColor: "var(--border)",
                  }}
                >
                  <span style={{
                    width:        6,
                    height:       6,
                    borderRadius: "50%",
                    background: PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG]?.color ?? "var(--muted-foreground)",
                    display:      "inline-block",
                  }} />
                  {PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG]?.label ?? ticket.priority}
                  <RiArrowDownSLine size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" style={{ minWidth: 160 }}>
                {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handlePriorityChange(key)}
                    style={{
                      fontSize:   13,
                      fontWeight: ticket.priority === key ? 500 : 400,
                      color:      ticket.priority === key ? "var(--foreground)" : "var(--muted-foreground)",
                      gap:        8,
                    }}
                  >
                    <span style={{
                      width:        6,
                      height:       6,
                      borderRadius: "50%",
                      background:   cfg.color,
                      display:      "inline-block",
                      flexShrink:   0,
                    }} />
                    {cfg.label}
                    {ticket.priority === key && (
                      <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "var(--color-resolved)", display: "inline-block" }} />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <TicketBadge type="priority" value={ticket.priority} />
          )}

          {ticket.slaDeadline && (
            <Badge variant="outline" style={{ fontSize: 11, fontWeight: 500, color: slaCfg.color, gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: slaCfg.color, display: "inline-block" }} />
              {slaCfg.label} · {timeLeft}
            </Badge>
          )}

          {ticket.tags?.map((tag: string) => (
            <Badge key={tag} variant="secondary" style={{ fontSize: 11, fontWeight: 400 }}>
              {tag}
            </Badge>
          ))}
        </div>
      </header>

      {/* ── Main layout ── */}
      <div style={{
        flex:                1,
        overflow:            "hidden",
        display:             "grid",
        gridTemplateColumns: "1fr 280px",
        background:          "var(--background)",
      }}>

        {/* ── Left — Description + Comments ── */}
        <div style={{ overflowY: "auto", padding: "20px 24px", borderRight: "1px solid var(--border)" }}>

          {/* Description */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ color: "var(--muted-foreground)", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
              Description
            </p>
            <Card>
              <CardContent style={{ padding: "16px 20px" }}>
                <p style={{
                  color:      ticket.description ? "var(--foreground)" : "var(--muted-foreground)",
                  fontSize:   13,
                  lineHeight: 1.8,
                  margin:     0,
                  fontStyle:  ticket.description ? "normal" : "italic",
                }}>
                  {ticket.description ?? "No description provided."}
                </p>
              </CardContent>
            </Card>
          </div>

          {customFieldRows.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <p style={{ color: "var(--muted-foreground)", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
                Request Details
              </p>
              <Card>
                <CardContent style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                  {customFieldRows.map((field) => (
                    <div key={field.key}>
                      <div style={{ color: "var(--muted-foreground)", fontSize: 11, marginBottom: 4 }}>{field.label}</div>
                      <div style={{ color: "var(--foreground)", fontSize: 13, lineHeight: 1.5 }}>
                        {typeof field.value === "boolean" ? (field.value ? "Yes" : "No") : String(field.value)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Comments */}
          <div>
            <p style={{ color: "var(--muted-foreground)", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 14 }}>
              Activity · {ticket.comments?.length ?? 0} comment{ticket.comments?.length !== 1 ? "s" : ""}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {(ticket.comments ?? []).length === 0 ? (
                <Card>
                  <CardContent style={{ padding: "32px 20px", textAlign: "center" }}>
                    <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
                      No activity yet. Add a comment to get started.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                (ticket.comments ?? []).map((c: any) => (
                  <div key={c.id} style={{ display: "flex", gap: 12 }}>
                    <Avatar style={{ width: 32, height: 32, flexShrink: 0, marginTop: 2 }}>
                      <AvatarFallback style={{ fontSize: 10, fontWeight: 600, background: "var(--muted)", color: "var(--foreground)" }}>
                        {getInitials(c.author?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ color: "var(--foreground)", fontSize: 13, fontWeight: 500 }}>
                          {c.author?.name}
                        </span>
                        {c.author?.role && (
                          <Badge variant="outline" style={{ fontSize: 9, fontWeight: 500, color: ROLE_COLORS[c.author.role], gap: 4 }}>
                            <span style={{ width: 4, height: 4, borderRadius: "50%", background: ROLE_COLORS[c.author.role], display: "inline-block" }} />
                            {c.author.role.charAt(0) + c.author.role.slice(1).toLowerCase()}
                          </Badge>
                        )}
                        <span style={{ color: "var(--muted-foreground)", fontSize: 11 }}>
                          {formatDate(c.createdAt)}
                        </span>
                        {canDeleteComment(c.author?.id) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteComment({ id: c.id })}
                            style={{ marginLeft: "auto", width: 22, height: 22, color: "var(--muted-foreground)" }}
                            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = "var(--destructive)")}
                            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = "var(--muted-foreground)")}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                      <Card>
                        <CardContent style={{ padding: "12px 16px" }}>
                          <p style={{ color: "var(--foreground)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                            {c.body}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))
              )}
            </div>

            {canAddComment() ? (
              <div style={{ display: "flex", gap: 12 }}>
                <Avatar style={{ width: 32, height: 32, flexShrink: 0, marginTop: 2 }}>
                  <AvatarFallback style={{ fontSize: 10, fontWeight: 600, background: "var(--muted)", color: "var(--foreground)" }}>
                    Me
                  </AvatarFallback>
                </Avatar>
                <div style={{ flex: 1 }}>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment… (Ctrl+Enter to submit)"
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleComment(); }}
                    style={{ fontSize: 13, minHeight: 80, fontFamily: "inherit", resize: "vertical", marginBottom: 8 }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--muted-foreground)", fontSize: 11 }}>Ctrl + Enter to submit</span>
                    <Button
                      size="sm"
                      onClick={handleComment}
                      disabled={posting || !comment.trim()}
                      style={{ fontSize: 12, gap: 5, fontFamily: "inherit" }}
                    >
                      <RiSendPlaneLine size={12} />
                      {posting ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent style={{ padding: "14px 16px", textAlign: "center" }}>
                  <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
                    You don't have permission to comment on this ticket.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ── Right — Details panel ── */}
        <div style={{
          overflowY:     "auto",
          padding:       "20px 20px",
          display:       "flex",
          flexDirection: "column",
          background:    "var(--background)",
          borderLeft:    "1px solid var(--border)",
        }}>
          <p style={{ color: "var(--muted-foreground)", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>
            Details
          </p>

          {/* ── Assignee row with reassign dropdown ── */}
          <div style={{
            padding:        "9px 0",
            borderBottom:   "1px solid var(--border)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            gap:            8,
          }}>
            <span style={{ color: "var(--muted-foreground)", fontSize: 12, flexShrink: 0 }}>Assignee</span>

            {canReassignTicket ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    style={{
                      display:      "flex",
                      alignItems:   "center",
                      gap:          6,
                      background:   "transparent",
                      border:       "none",
                      cursor:       reassigning ? "not-allowed" : "pointer",
                      padding:      "2px 4px",
                      borderRadius: 4,
                      opacity:      reassigning ? 0.5 : 1,
                    }}
                  >
                    <Avatar style={{ width: 20, height: 20 }}>
                      <AvatarFallback style={{ fontSize: 8, fontWeight: 600, background: "var(--muted)", color: "var(--foreground)" }}>
                        {ticket.assignee?.name ? getInitials(ticket.assignee.name) : <RiUserLine size={9} />}
                      </AvatarFallback>
                    </Avatar>
                    <span style={{ color: "var(--foreground)", fontSize: 12 }}>
                      {ticket.assignee?.name ?? "Unassigned"}
                    </span>
                    <RiArrowDownSLine size={11} style={{ color: "var(--muted-foreground)" }} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" style={{ minWidth: 180 }}>
                  <DropdownMenuLabel style={{ fontSize: 10, color: "var(--muted-foreground)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                    Assign to
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {members.map((m: any) => (
                    <DropdownMenuItem
                      key={m.id}
                      onClick={() => handleReassign(m.id)}
                      style={{
                        gap:        8,
                        fontSize:   13,
                        fontWeight: ticket.assignee?.id === m.id ? 500 : 400,
                        color:      ticket.assignee?.id === m.id ? "var(--foreground)" : "var(--muted-foreground)",
                      }}
                    >
                      <Avatar style={{ width: 20, height: 20, flexShrink: 0 }}>
                        <AvatarFallback style={{ fontSize: 8, fontWeight: 600, background: "var(--muted)", color: "var(--foreground)" }}>
                          {getInitials(m.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span style={{ flex: 1 }}>{m.name}</span>
                      {ticket.assignee?.id === m.id && (
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-resolved)", display: "inline-block" }} />
                      )}
                    </DropdownMenuItem>
                  ))}
                  {ticket.assignee && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleUnassign}
                        style={{ fontSize: 13, color: "var(--color-danger)", gap: 8 }}
                      >
                        <RiUserLine size={14} /> Unassign
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Avatar style={{ width: 20, height: 20 }}>
                  <AvatarFallback style={{ fontSize: 8, fontWeight: 600, background: "var(--muted)", color: "var(--foreground)" }}>
                    {getInitials(ticket.assignee?.name)}
                  </AvatarFallback>
                </Avatar>
                <span style={{ color: "var(--foreground)", fontSize: 12 }}>
                  {ticket.assignee?.name ?? "Unassigned"}
                </span>
              </div>
            )}
          </div>

          {/* Other detail rows */}
          {[
            { label: "Reporter",   value: ticket.creator?.name    ?? "Unknown", avatar: ticket.creator?.name  },
            { label: "Department", value: ticket.department?.name ?? "—",       avatar: null                  },
            { label: "Priority",   value: null,                                  badge: "priority"             },
            { label: "Created",    value: formatDate(ticket.createdAt),          avatar: null                  },
            { label: "Updated",    value: formatDate(ticket.updatedAt),          avatar: null                  },
          ].map(({ label, value, avatar, badge }: any) => (
            <div key={label} style={{
              padding:        "9px 0",
              borderBottom:   "1px solid var(--border)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              gap:            8,
            }}>
              <span style={{ color: "var(--muted-foreground)", fontSize: 12, flexShrink: 0 }}>{label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {avatar && (
                  <Avatar style={{ width: 20, height: 20 }}>
                    <AvatarFallback style={{ fontSize: 8, fontWeight: 600, background: "var(--muted)", color: "var(--foreground)" }}>
                      {getInitials(avatar)}
                    </AvatarFallback>
                  </Avatar>
                )}
                {badge === "priority" ? (
                  <TicketBadge type="priority" value={ticket.priority} />
                ) : (
                  <span style={{ color: "var(--foreground)", fontSize: 12, textAlign: "right" }}>{value}</span>
                )}
              </div>
            </div>
          ))}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 16 }}>
            {canSelfAssign(ticketAttrs) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelfAssign}
                style={{ width: "100%", fontSize: 12, gap: 6, fontFamily: "inherit" }}
              >
                <RiUserAddLine size={13} /> Assign to me
              </Button>
            )}
            {canDeleteTicket() && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTicket(true)}
                style={{ width: "100%", fontSize: 12, gap: 6, color: "var(--destructive)", borderColor: "var(--border)", fontFamily: "inherit" }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.borderColor = "var(--destructive)")}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <RiDeleteBinLine size={13} /> Delete Ticket
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {deleteComment && (
        <ConfirmModal
          title="Delete Comment"
          message="Are you sure you want to delete this comment? This cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDeleteComment}
          onCancel={() => setDeleteComment(null)}
        />
      )}
      {deleteTicket && (
        <ConfirmModal
          title="Delete Ticket"
          message={`Are you sure you want to delete "${ticket.title}"? This will permanently remove the ticket and all its comments.`}
          confirmLabel="Delete Ticket"
          variant="danger"
          onConfirm={handleDeleteTicket}
          onCancel={() => setDeleteTicket(false)}
        />
      )}
    </>
  );
}
