import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { abac } from "@/lib/abac";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = {
      id:           session.user.id,
      role:         (session.user as any).role         ?? "REQUESTER",
      departmentId: (session.user as any).departmentId ?? null,
    };
    const visibilityWhere = abac.ticketVisibilityWhere(actor);
    const scopedWhere = (where: any = {}) => ({ AND: [visibilityWhere, where] });

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") ?? "7");
    const now  = new Date();

    // ── Last N days chart data ──────────────────────────────────────
    const chartData = await Promise.all(
      Array.from({ length: days }, (_, i) => {
        const date  = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const start = new Date(date.setHours(0,  0,  0,  0));
        const end   = new Date(date.setHours(23, 59, 59, 999));

        const label = days <= 7
          ? start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
          : days <= 30
          ? start.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : start.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        return prisma.ticket.count({
          where: scopedWhere({ createdAt: { gte: start, lte: end } }),
        }).then((count) => ({ date: label, count }));
      })
    );

    // ── Monthly chart data (for 3m, 6m, 1y) ────────────────────────
    const monthlyData = days > 30
      ? await Promise.all(
          Array.from({ length: Math.ceil(days / 30) }, (_, i) => {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - (Math.ceil(days / 30) - 1 - i), 1);
            const monthEnd   = new Date(now.getFullYear(), now.getMonth() - (Math.ceil(days / 30) - 2 - i), 0, 23, 59, 59);
            const label      = monthStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
            return prisma.ticket.count({
              where: scopedWhere({ createdAt: { gte: monthStart, lte: monthEnd } }),
            }).then((count) => ({ date: label, count }));
          })
        )
      : null;

    const [
      statusCounts,
      priorityCounts,
      slaCounts,
      recentTickets,
    ] = await Promise.all([
      prisma.ticket.groupBy({ by: ["status"],   where: scopedWhere(), _count: { id: true } }),
      prisma.ticket.groupBy({ by: ["priority"], where: scopedWhere(), _count: { id: true } }),
      Promise.all([
        prisma.ticket.count({ where: scopedWhere({ status: { notIn: ["RESOLVED", "CLOSED"] }, slaBreached: false, OR: [{ slaDeadline: null }, { slaDeadline: { gt: now } }] }) }),
        prisma.ticket.count({ where: scopedWhere({ status: { notIn: ["RESOLVED", "CLOSED"] }, slaDeadline: { lt: now } }) }),
        prisma.ticket.count({ where: scopedWhere({ status: { in: ["RESOLVED", "CLOSED"] }, slaBreached: false }) }),
        prisma.ticket.count({ where: scopedWhere({ status: { in: ["RESOLVED", "CLOSED"] }, slaBreached: true  }) }),
      ]),
      prisma.ticket.findMany({
        where:   scopedWhere(),
        take:    5,
        orderBy: { createdAt: "desc" },
        include: {
          assignee:   { select: { name: true } },
          department: { select: { name: true, color: true } },
        },
      }),
    ]);

    const [onTrack, breached, completed, breachedClosed] = slaCounts;

    return NextResponse.json({
      data: {
        statusCounts:   statusCounts.map((s) => ({ name: s.status,    value: s._count.id })),
        priorityCounts: priorityCounts.map((p) => ({ name: p.priority, value: p._count.id })),
        sla:            { onTrack, breached, completed, breachedClosed, resolved: completed + breachedClosed },
        last7Days:      chartData,                      // kept for backward compat
        chartData:      monthlyData ?? chartData,       // grouped by month if > 30 days
        recentTickets,
        totals: {
          open:       statusCounts.find((s) => s.status === "OPEN")?._count.id         ?? 0,
          inProgress: statusCounts.find((s) => s.status === "IN_PROGRESS")?._count.id  ?? 0,
          resolved:   statusCounts.find((s) => s.status === "RESOLVED")?._count.id     ?? 0,
          critical:   priorityCounts.find((p) => p.priority === "CRITICAL")?._count.id ?? 0,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
