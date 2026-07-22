import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import TicketBadge from "@/components/ui/TicketBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, getInitials } from "@/utils/ticket";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function MyRequestDetailPage({ params }: Params) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?redirect=/portal/my-requests");

  const { id } = await params;
  const ticket = await prisma.ticket.findFirst({
    where: {
      id,
      creatorId: session.user.id as string,
    },
    include: {
      department: { select: { id: true, name: true, color: true } },
      assignee:   { select: { id: true, name: true } },
      creator:    { select: { id: true, name: true } },
      requestType: {
        select: {
          id: true,
          name: true,
          fields: { select: { key: true, label: true }, orderBy: { order: "asc" } },
        },
      },
      comments: {
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) notFound();

  const customFieldRows = Object.entries((ticket.customFields as Record<string, unknown> | null) ?? {}).map(([key, value]) => ({
    key,
    label: ticket.requestType?.fields.find((field) => field.key === key)?.label ?? key,
    value,
  })).filter((field) => field.value !== null && field.value !== "");

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <nav style={{
        borderBottom: "1px solid var(--border)",
        background:   "var(--background)",
        padding:      "0 24px",
        height:       56,
        display:      "flex",
        alignItems:   "center",
        justifyContent: "space-between",
        position:     "sticky",
        top:          0,
        zIndex:       50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: "var(--foreground)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }} />
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--foreground)" }}>Trackr</span>
          <Badge variant="outline" style={{ fontSize: 10 }}>Portal</Badge>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button asChild variant="ghost" size="sm" style={{ fontSize: 13, fontFamily: "inherit" }}>
            <Link href="/portal/my-requests">My Requests</Link>
          </Button>
          <Button asChild variant="outline" size="sm" style={{ fontSize: 13, fontFamily: "inherit" }}>
            <Link href="/portal">Browse Portal</Link>
          </Button>
        </div>
      </nav>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px" }}>
        <Button asChild variant="ghost" size="sm" style={{ fontSize: 12, color: "var(--muted-foreground)", fontFamily: "inherit", paddingLeft: 0, marginBottom: 16 }}>
          <Link href="/portal/my-requests">Back to My Requests</Link>
        </Button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
            <span style={{ color: "var(--muted-foreground)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
              {ticket.ticketNumber}
            </span>
            {ticket.department && (
              <Badge variant="outline" style={{ fontSize: 10, color: ticket.department.color }}>
                {ticket.department.name}
              </Badge>
            )}
            <TicketBadge type="status" value={ticket.status} />
            <TicketBadge type="priority" value={ticket.priority} />
          </div>
          <h1 style={{ color: "var(--foreground)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>
            {ticket.title}
          </h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
            Submitted {formatDate(ticket.createdAt)}
            {" "}&middot;{" "}
            {ticket.assignee ? `Assigned to ${ticket.assignee.name}` : "Awaiting assignment"}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 260px", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <CardContent style={{ padding: "18px 20px" }}>
                <p style={{ color: "var(--muted-foreground)", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
                  Details
                </p>
                <p style={{ color: ticket.description ? "var(--foreground)" : "var(--muted-foreground)", fontSize: 13, lineHeight: 1.8, fontStyle: ticket.description ? "normal" : "italic" }}>
                  {ticket.description ?? "No description provided."}
                </p>
              </CardContent>
            </Card>

            {customFieldRows.length > 0 && (
              <Card>
                <CardContent style={{ padding: "18px 20px" }}>
                  <p style={{ color: "var(--muted-foreground)", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 14 }}>
                    Request Details
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                    {customFieldRows.map((field) => (
                      <div key={field.key}>
                        <div style={{ color: "var(--muted-foreground)", fontSize: 11, marginBottom: 4 }}>{field.label}</div>
                        <div style={{ color: "var(--foreground)", fontSize: 13, lineHeight: 1.5 }}>
                          {typeof field.value === "boolean" ? (field.value ? "Yes" : "No") : String(field.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent style={{ padding: "18px 20px" }}>
                <p style={{ color: "var(--muted-foreground)", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 14 }}>
                  Activity &middot; {ticket.comments.length} comment{ticket.comments.length === 1 ? "" : "s"}
                </p>
                {ticket.comments.length === 0 ? (
                  <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>No activity yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {ticket.comments.map((comment) => (
                      <div key={comment.id} style={{ display: "flex", gap: 10 }}>
                        <Avatar style={{ width: 32, height: 32 }}>
                          <AvatarFallback style={{ fontSize: 10, fontWeight: 600 }}>
                            {getInitials(comment.author?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ color: "var(--foreground)", fontSize: 13, fontWeight: 500 }}>
                              {comment.author?.name ?? "Unknown"}
                            </span>
                            <span style={{ color: "var(--muted-foreground)", fontSize: 11 }}>
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p style={{ color: "var(--foreground)", fontSize: 13, lineHeight: 1.7 }}>
                            {comment.body}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent style={{ padding: "18px 20px" }}>
              <p style={{ color: "var(--muted-foreground)", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>
                Request Info
              </p>
              {[
                ["Department", ticket.department?.name ?? "-"],
                ["Status", ticket.status.replace("_", " ")],
                ["Priority", ticket.priority],
                ["Created", formatDate(ticket.createdAt)],
                ["Updated", formatDate(ticket.updatedAt)],
                ["Assignee", ticket.assignee?.name ?? "Unassigned"],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>{label}</span>
                  <span style={{ color: "var(--foreground)", fontSize: 12, textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
