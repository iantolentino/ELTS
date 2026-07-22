import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { abac } from "@/lib/abac";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = {
      id:           session.user.id,
      role:         (session.user as any).role         ?? "REQUESTER",
      departmentId: (session.user as any).departmentId ?? null,
    };

    // Portal customers and read-only viewers do not use the internal reports area.
    if (actor.role === "REQUESTER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status     = searchParams.get("status")     ?? undefined;
    const priority   = searchParams.get("priority")   ?? undefined;
    const dateFrom   = searchParams.get("dateFrom")   ?? undefined;
    const dateTo     = searchParams.get("dateTo")     ?? undefined;
    const departmentId = searchParams.get("departmentId") ?? undefined;
    const visibilityWhere = abac.ticketVisibilityWhere(actor);
    const scopedWhere = (extraWhere: any = {}) => ({ AND: [visibilityWhere, extraWhere] });

    // Build base where clause
    const where: any = {};
    if (status)       where.status   = status;
    if (priority)     where.priority = priority;
    if (departmentId) where.departmentId = departmentId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo)   where.createdAt.lte = new Date(dateTo);
    }

    const reportWhere = scopedWhere(where);

    const [
      tickets,
      createdVsResolved,
      departmentStats,
      memberStats,
    ] = await Promise.all([

      // All tickets for table
      prisma.ticket.findMany({
        where: reportWhere,
        include: {
          assignee:   { select: { id: true, name: true } },
          creator:    { select: { id: true, name: true } },
          department: { select: { id: true, name: true, color: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Created vs resolved last 14 days
      Promise.all(
        Array.from({ length: 14 }, (_, i) => {
          const date  = new Date();
          date.setDate(date.getDate() - (13 - i));
          const start = new Date(new Date(date).setHours(0,  0,  0,  0));
          const end   = new Date(new Date(date).setHours(23, 59, 59, 999));
          return Promise.all([
            prisma.ticket.count({ where: scopedWhere({ createdAt:  { gte: start, lte: end } }) }),
            prisma.ticket.count({ where: scopedWhere({ status: { in: ["RESOLVED", "CLOSED"] }, updatedAt: { gte: start, lte: end } }) }),
          ]).then(([created, resolved]) => ({
            date: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            created,
            resolved,
          }));
        })
      ),

      // Department breakdown — admin only
      actor.role === "ADMIN"
        ? prisma.department.findMany({
            include: {
              _count: { select: { tickets: true, users: true } },
              tickets: {
                select: {
                  status:      true,
                  slaDeadline: true,
                  slaBreached: true,
                },
              },
            },
          })
        : Promise.resolve([]),

      // Member KPI stats
      prisma.user.findMany({
        where: {
          status: "ACTIVE",
          role:   { in: ["MEMBER", "MANAGER"] },
          ...(actor.role === "MANAGER" ? { departmentId: actor.departmentId } : {}),
          ...(actor.role === "MEMBER"  ? { id: actor.id } : {}),
        },
        select: {
          id:         true,
          name:       true,
          role:       true,
          department: { select: { name: true, color: true } },
          tickets: {
            where: visibilityWhere,
            select: {
                status:      true,
                priority:    true,
                slaDeadline: true,
                slaBreached: true,
                createdAt:   true,
                updatedAt:   true,
            },
          },
        },
      }),
    ]);

    // ── Calculate KPI scores ──────────────────────────────────────────────────
    const kpiData = memberStats.map((member) => {
      const assigned  = member.tickets.length;
      const resolved  = member.tickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status)).length;
      const breached  = member.tickets.filter((t) => t.slaBreached || (t.slaDeadline && new Date(t.slaDeadline) < new Date() && !["RESOLVED", "CLOSED"].includes(t.status))).length;
      const open      = member.tickets.filter((t) => !["RESOLVED", "CLOSED"].includes(t.status)).length;
      const critical  = member.tickets.filter((t) => t.priority === "CRITICAL").length;

      // Avg resolution time in hours
      const resolvedTickets = member.tickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status));
      const avgResolutionHrs = resolvedTickets.length > 0
        ? resolvedTickets.reduce((sum, t) => {
            const hrs = (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()) / 36e5;
            return sum + hrs;
          }, 0) / resolvedTickets.length
        : 0;

      // KPI Score (0-100)
      const resolvedRate  = assigned > 0 ? (resolved / assigned) * 100 : 0;
      const slaCompliance = assigned > 0 ? ((assigned - breached) / assigned) * 100 : 100;
      const speedScore    = avgResolutionHrs > 0 ? Math.max(0, 100 - (avgResolutionHrs / 24) * 100) : 100;
      const kpiScore      = Math.round((resolvedRate * 0.4) + (slaCompliance * 0.4) + (speedScore * 0.2));

      return {
        id:               member.id,
        name:             member.name,
        role:             member.role,
        department:       member.department,
        assigned,
        resolved,
        open,
        breached,
        critical,
        avgResolutionHrs: Math.round(avgResolutionHrs * 10) / 10,
        kpiScore:         Math.min(100, Math.max(0, kpiScore)),
      };
    });

    // ── SLA summary ───────────────────────────────────────────────────────────
    const now        = new Date();
    const onTrack    = tickets.filter((t) => t.slaDeadline && new Date(t.slaDeadline) > now && !["RESOLVED","CLOSED"].includes(t.status)).length;
    const breached   = tickets.filter((t) => t.slaDeadline && new Date(t.slaDeadline) < now && !["RESOLVED","CLOSED"].includes(t.status)).length;
    const resolved   = tickets.filter((t) => ["RESOLVED","CLOSED"].includes(t.status)).length;

    return NextResponse.json({
      data: {
        tickets,
        createdVsResolved,
        departmentStats,
        kpiData,
        summary: {
          total:    tickets.length,
          resolved,
          breached,
          onTrack,
          avgResolutionHrs: kpiData.length > 0
            ? Math.round((kpiData.reduce((s, m) => s + m.avgResolutionHrs, 0) / kpiData.length) * 10) / 10
            : 0,
        },
      },
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
