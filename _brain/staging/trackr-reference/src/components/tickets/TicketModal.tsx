"use client";

import { useState } from "react";
import TicketBadge from "@/components/ui/TicketBadge";
import { STATUS_CONFIG } from "@/config/constants";
import { useAbac } from "@/hooks/useAbac";
import { getInitials, formatDate } from "../../utils/ticket";
import { getSlaStatus, getTimeRemaining, SLA_CONFIG } from "../../utils/sla";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface TicketModalProps {
  ticket:   any;
  onClose:  () => void;
  onUpdate: () => void;
}

const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
  ADMIN:  { color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
  MEMBER: { color: "#38bdf8", bg: "rgba(56,189,248,0.15)"  },
};

export default function TicketModal({ ticket, onClose, onUpdate }: TicketModalProps) {
  const [comment,        setComment]        = useState("");
  const [posting,        setPosting]        = useState(false);
  const [status,         setStatus]         = useState(ticket.status);
  const [comments,       setComments]       = useState<any[]>(ticket.comments ?? []);
  const [deleteConfirm,  setDeleteConfirm]  = useState<{ id: string; body: string } | null>(null);
  const { canChangeStatus, canAddComment, canDeleteComment, canSelfAssign, user } = useAbac();

  const ticketAttrs = {
    creatorId:    ticket.creator?.id    ?? ticket.creatorId    ?? "",
    assigneeId:   ticket.assignee?.id   ?? ticket.assigneeId   ?? null,
    departmentId: ticket.department?.id ?? ticket.departmentId ?? null,
    status:       ticket.status,    
  };

  if (!ticket) return null;

  const slaStatus = getSlaStatus(ticket.slaDeadline, status);
  const slaCfg    = SLA_CONFIG[slaStatus];
  const timeLeft  = getTimeRemaining(ticket.slaDeadline);

  const handleSelfAssign = async () => {
    await fetch(`/api/tickets/${ticket.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ selfAssign: true }),
    });
    onUpdate();
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    await fetch(`/api/tickets/${ticket.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: newStatus }),
    });
    onUpdate();
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ body: comment }),
    });
    const data = await res.json();
    if (data.data) {
      setComments((prev) => [...prev, data.data]);
    }
    setComment("");
    setPosting(false);
    onUpdate();
  };

  const handleDeleteComment = async () => {
    if (!deleteConfirm) return;
    await fetch(`/api/tickets/${ticket.id}/comments/${deleteConfirm.id}`, {
      method: "DELETE",
    });
    setComments((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
    setDeleteConfirm(null);
    onUpdate();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#13131a", border: "1px solid #2a2a3a", borderRadius: 20, width: "100%", maxWidth: 640, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>

        {/* Header */}
        <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid #1e1e2e", flexShrink: 0 }}>
          <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "#2a2a3a", border: "none", color: "#888", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ color: "#5a5a7a", fontSize: 12, fontFamily: "monospace", background: "#1e1e2e", padding: "3px 8px", borderRadius: 6 }}>{ticket.ticketNumber}</span>
            <TicketBadge type="priority" value={ticket.priority} />
            <TicketBadge type="status" value={status} />
            {ticket.slaDeadline && (
              <span style={{ background: slaCfg.bg, color: slaCfg.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>
                ⏱ {slaCfg.label} — {timeLeft}
              </span>
            )}
          </div>

          <h2 style={{ color: "#f0f0ff", fontSize: 20, fontWeight: 700, lineHeight: 1.3, fontFamily: "'Syne', sans-serif", paddingRight: 40 }}>{ticket.title}</h2>

          {ticket.description && (
            <p style={{ color: "#8888aa", fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>{ticket.description}</p>
          )}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 32px" }}>

          {/* Status changer */}
          {canChangeStatus(ticketAttrs) && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "#5a5a7a", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Change Status</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button key={key} onClick={() => handleStatusChange(key)} style={{ background: status === key ? cfg.bg : "#1a1a27", border: `1px solid ${status === key ? cfg.color : "#2a2a3a"}`, borderRadius: 8, color: status === key ? cfg.color : "#5a5a7a", fontSize: 11, fontWeight: 600, padding: "6px 12px", cursor: "pointer", transition: "all 0.15s" }}>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
          )}

           {/* Self Assign Button */}
          {canSelfAssign(ticketAttrs) && (
            <div style={{ marginBottom: 20 }}>
              <button onClick={handleSelfAssign} style={{ width: "100%", background: "rgba(124,92,252,0.15)", border: "1px solid rgba(124,92,252,0.3)", borderRadius: 10, color: "#a78bfa", fontSize: 13, fontWeight: 700, padding: "10px", cursor: "pointer" }}>
                + Assign to me
              </button>
            </div>
          )}

          {/* Metadata */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            {[
              ["Assignee",   ticket.assignee?.name ?? "Unassigned"],
              ["Creator",    ticket.creator?.name  ?? "Unknown"],
              ["Department", ticket.department?.name ?? "—"],
              ["Created",    formatDate(ticket.createdAt)],
              ["Tags",       ticket.tags?.join(", ") || "—"],
              ["Comments",   comments.length],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "#1a1a27", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ color: "#5a5a7a", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{k}</div>
                <div style={{ color: "#c0c0e0", fontSize: 13 }}>{String(v)}</div>
              </div>
            ))}
          </div>

          {/* Comments Section */}
          <div style={{ borderTop: "1px solid #2a2a3a", paddingTop: 20 }}>
            <div style={{ color: "#5a5a7a", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
              Comments ({comments.length})
            </div>

            {/* Comment list */}
            {comments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#3a3a5a", fontSize: 13 }}>
                No comments yet. Be the first to comment!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                {comments.map((c) => (
                  <div key={c.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {/* Avatar */}
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `hsl(${c.author?.name?.charCodeAt(0) * 7 % 360}, 55%, 40%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                      {getInitials(c.author?.name)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, background: "#1a1a27", borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ color: "#d0d0f0", fontSize: 13, fontWeight: 600 }}>{c.author?.name ?? "Unknown"}</span>
                        {c.author?.role && (
                          <span style={{ background: ROLE_COLORS[c.author.role]?.bg, color: ROLE_COLORS[c.author.role]?.color, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999 }}>
                            {c.author.role.charAt(0) + c.author.role.slice(1).toLowerCase()}
                          </span>
                        )}
                        <span style={{ color: "#3a3a5a", fontSize: 11, marginLeft: "auto" }}>{formatDate(c.createdAt)}</span>
                        {/* Delete button */}
                        {canDeleteComment(c.author?.id) && (
                          <button onClick={() => setDeleteConfirm({ id: c.id, body: c.body })} style={{ background: "none", border: "none", color: "#3a3a5a", cursor: "pointer", fontSize: 12, padding: "0 4px" }}
                            title="Delete comment">
                            ✕
                          </button>
                        )}
                      </div>
                      <p style={{ color: "#c0c0e0", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment */}
            {canAddComment() ? (
              <div>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment…"
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleComment(); }}
                  style={{ width: "100%", background: "#1a1a27", border: "1px solid #2a2a3a", borderRadius: 10, color: "#c0c0e0", fontSize: 14, padding: "12px 14px", resize: "vertical", minHeight: 80, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <span style={{ color: "#3a3a5a", fontSize: 11 }}>Ctrl + Enter to submit</span>
                  <button onClick={handleComment} disabled={posting || !comment.trim()} style={{ background: "linear-gradient(135deg, #7c5cfc, #a78bfa)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 22px", cursor: posting ? "not-allowed" : "pointer", opacity: posting || !comment.trim() ? 0.5 : 1 }}>
                    {posting ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ color: "#5a5a7a", fontSize: 13, textAlign: "center", padding: "12px 0" }}>
                You don't have permission to comment on this ticket.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete comment confirmation */}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete Comment"
          message={`Are you sure you want to delete this comment? This cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDeleteComment}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
