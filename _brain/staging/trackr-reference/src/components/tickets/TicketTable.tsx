"use client";

import TicketBadge from "@/components/ui/TicketBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatDate } from "@/utils/ticket";
import { getSlaStatus, getTimeRemaining, SLA_CONFIG } from "@/utils/sla";
import { useRouter } from "next/navigation";
import SkeletonRows from "@/components/ui/SkeletonRows";

const TICKET_COLUMNS = "88px 1fr 116px 96px 136px 120px 88px 44px";

const SKELETON_CELLS = [
  { width: "60px" },
  { width: "70%",  shape: "double" as const },
  { width: "80px", shape: "badge"  as const },
  { width: "70px", shape: "badge"  as const },
  { width: "60px", gap: true },
  { width: "65px", shape: "badge"  as const },
  { width: "55px" },
  { width: "20px" },
];

interface TicketTableProps {
  tickets:    any[];
  isLoading?: boolean;
}

export default function TicketTable({ tickets, isLoading }: TicketTableProps) {
  const router = useRouter();

  return (
    <div style={{
      background:   "var(--card)",
      border:       "1px solid var(--border)",
      borderRadius: 8,
      overflow:     "hidden",
    }}>

      {/* Header */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: TICKET_COLUMNS,
        padding:             "10px 16px",
        borderBottom:        "1px solid var(--border)",
        background:          "var(--muted)",
      }}>
        {["ID", "Title", "Status", "Priority", "Assignee", "SLA", "Created", "💬"].map((h) => (
          <div key={h} style={{
            color:         "var(--muted-foreground)",
            fontSize:      10,
            fontWeight:    600,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
          }}>
            {h}
          </div>
        ))}
      </div>

      {/* Loading */}
      {isLoading ? (
        <SkeletonRows columns={TICKET_COLUMNS} rows={7} cells={SKELETON_CELLS} />
      ) : (
        <>
          {/* Empty */}
          {tickets.length === 0 && (
            <div style={{
              padding:   "56px 20px",
              textAlign: "center",
              color:     "var(--muted-foreground)",
              fontSize:  13,
            }}>
              No tickets match your filters.
            </div>
          )}

          {/* Rows */}
          {tickets.map((t, i) => {
            const slaStatus = getSlaStatus(t.slaDeadline, t.status, t.slaBreached);
            const cfg       = SLA_CONFIG[slaStatus];
            const timeLeft = getTimeRemaining(t.slaDeadline, t.status);

            return (
              <div
                key={t.id}
                onClick={() => router.push(`/tickets/${t.id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--muted)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                style={{
                  display:             "grid",
                  gridTemplateColumns: TICKET_COLUMNS,
                  padding:             "12px 16px",
                  borderBottom:        i < tickets.length - 1 ? "1px solid var(--border)" : "none",
                  cursor:              "pointer",
                  alignItems:          "center",
                  transition:          "background 0.1s",
                }}
              >
                {/* ID */}
                <div style={{
                  color:              "var(--muted-foreground)",
                  fontSize:           12,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {t.ticketNumber}
                </div>

                {/* Title + tags */}
                <div style={{ paddingRight: 12 }}>
                  <div style={{
                    color:        "var(--foreground)",
                    fontSize:     13,
                    fontWeight:   500,
                    marginBottom: 4,
                    lineHeight:   1.3,
                  }}>
                    {t.title}
                  </div>
                  {t.tags?.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {t.tags.map((tag: string) => (
                        <span key={tag} style={{
                          background:    "var(--muted)",
                          border:        "1px solid var(--border)",
                          color:         "var(--muted-foreground)",
                          fontSize:      10,
                          fontWeight:    500,
                          padding:       "1px 6px",
                          borderRadius:  4,
                          letterSpacing: "0.03em",
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div>
                  <TicketBadge type="status" value={t.status} />
                </div>

                {/* Priority */}
                <div>
                  <TicketBadge type="priority" value={t.priority} />
                </div>

                {/* Assignee */}
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Avatar style={{ width: 24, height: 24, flexShrink: 0 }}>
                    <AvatarFallback style={{
                      fontSize:   9,
                      fontWeight: 600,
                      background: "var(--muted)",
                      color:      "var(--muted-foreground)",
                    }}>
                      {getInitials(t.assignee?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>
                    {t.assignee?.name?.split(" ")[0] ?? "—"}
                  </span>
                </div>

                {/* SLA */}
                <div>
                  {t.slaDeadline ? (
                    <div>
                      <span style={{
                        background:   cfg.bg,
                        color:        cfg.color,
                        fontSize:     10,
                        fontWeight:   500,
                        padding:      "2px 7px",
                        borderRadius: 4,
                        display:      "inline-block",
                        marginBottom: 2,
                      }}>
                        {cfg.label}
                      </span>
                      <div style={{ color: "var(--muted-foreground)", fontSize: 10 }}>
                        {timeLeft}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>—</span>
                  )}
                </div>

                {/* Created */}
                <div style={{ color: "var(--muted-foreground)", fontSize: 12 }}>
                  {formatDate(t.createdAt)}
                </div>

                {/* Comments */}
                <div style={{
                  color:              "var(--muted-foreground)",
                  fontSize:           12,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {t._count?.comments ?? 0}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}