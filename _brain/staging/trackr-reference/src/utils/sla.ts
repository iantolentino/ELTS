// src/utils/sla.ts

export const SLA_HOURS: Record<string, number> = {
  CRITICAL: 1,
  HIGH:     4,
  MEDIUM:   8,
  LOW:      24,
};

export function calculateSlaDeadline(priority: string): Date {
  const hours = SLA_HOURS[priority] ?? 8;
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}

export type SlaStatus = "ON_TRACK" | "AT_RISK" | "BREACHED" | "COMPLETED" | "BREACHED_CLOSED";

export function getSlaStatus(
  deadline:     Date | null,
  ticketStatus: string,
  slaBreached?: boolean,
): SlaStatus {
  if (!deadline) return "ON_TRACK";

  // ── Closed/Resolved — check if it was breached before closing ──
  if (ticketStatus === "RESOLVED" || ticketStatus === "CLOSED") {
    return slaBreached ? "BREACHED_CLOSED" : "COMPLETED";
  }

  const now        = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs     = deadlineDate.getTime() - now.getTime();
  const diffHours  = diffMs / (1000 * 60 * 60);

  if (diffMs < 0)     return "BREACHED";
  if (diffHours <= 1) return "AT_RISK";
  return "ON_TRACK";
}

export function getTimeRemaining(deadline: Date | null, ticketStatus?: string): string {
  if (!deadline) return "—";

  if (ticketStatus === "RESOLVED" || ticketStatus === "CLOSED") return "Completed";

  const now          = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs       = deadlineDate.getTime() - now.getTime();
  const overdue      = diffMs < 0;
  const absMs        = Math.abs(diffMs);

  const minutes = Math.floor(absMs / (1000 * 60));
  const hours   = Math.floor(absMs / (1000 * 60 * 60));
  const days    = Math.floor(absMs / (1000 * 60 * 60 * 24));
  const months  = Math.floor(days / 30);
  const years   = Math.floor(days / 365);

  let label: string;
  if (years >= 1)       label = `${years}y ${Math.floor((days % 365) / 30)}mo`;
  else if (months >= 1) label = `${months}mo ${days % 30}d`;
  else if (days >= 1)   label = `${days}d ${hours % 24}h`;
  else if (hours >= 1)  label = `${hours}h ${minutes % 60}m`;
  else                  label = `${minutes}m`;

  return overdue ? `${label} overdue` : `${label} remaining`;
}

export const SLA_CONFIG: Record<SlaStatus, { label: string; color: string; bg: string }> = {
  ON_TRACK:      { label: "On Track",  color: "var(--color-resolved)", bg: "var(--color-resolved-bg)" },
  AT_RISK:       { label: "At Risk",   color: "var(--color-high)",     bg: "var(--color-high-bg)"     },
  BREACHED:      { label: "Breached",  color: "var(--color-critical)", bg: "var(--color-critical-bg)" },
  COMPLETED:     { label: "Completed", color: "var(--color-resolved)", bg: "var(--color-resolved-bg)" },
  BREACHED_CLOSED: { label: "Breached", color: "var(--color-critical)", bg: "var(--color-critical-bg)" },
};