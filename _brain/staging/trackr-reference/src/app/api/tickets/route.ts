import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ticketService } from "@/services/ticket.service";
import { createTicketSchema } from "@/lib/validations/ticket";
import { abac } from "@/lib/abac";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = {
      id:           session.user.id as string,
      role:         (session.user as any).role         ?? "REQUESTER",
      departmentId: (session.user as any).departmentId ?? null,
    };

    const { searchParams } = new URL(req.url);
    const assignee = searchParams.get("assignee");

    let assigneeId: string | null | undefined = undefined;
    if (assignee === "me" && session?.user?.id) {
      assigneeId = session.user.id;
    } else if (assignee === "unassigned") {
      assigneeId = null;
    }

    const filters = {
      status:       searchParams.get("status")       ?? undefined,
      priority:     searchParams.get("priority")     ?? undefined,
      search:       searchParams.get("search")       ?? undefined,
      departmentId: searchParams.get("departmentId") ?? undefined,
      assigneeId,
      visibilityWhere: abac.ticketVisibilityWhere(user),
    };

    const includeMeta = searchParams.get("includeMeta") === "1";
    const [tickets, unassignedCount] = await Promise.all([
      ticketService.getAll(filters),
      includeMeta
        ? prisma.ticket.count({ where: { AND: [abac.ticketVisibilityWhere(user), { assigneeId: null }] } })
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      data: tickets,
      ...(includeMeta && { meta: { unassignedCount } }),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = {
      id:           session.user.id,
      role:         (session.user as any).role         ?? "REQUESTER",
      departmentId: (session.user as any).departmentId ?? null,
    };

    if (!abac.canCreateTicket(user)) {
      return NextResponse.json({ error: "Forbidden — insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const department = parsed.data.departmentId
      ? await prisma.department.findUnique({
          where:  { id: parsed.data.departmentId },
          select: { id: true },
        })
      : null;

    if (!department) {
      return NextResponse.json({ error: "A valid department is required" }, { status: 400 });
    }

    if (parsed.data.requestTypeId) {
      const requestType = await prisma.requestType.findFirst({
        where: {
          id:           parsed.data.requestTypeId,
          departmentId: department.id,
        },
        select: {
          id: true,
          fields: {
            select: { key: true, label: true, required: true },
          },
        },
      });

      if (!requestType) {
        return NextResponse.json({ error: "Request type not found for this department" }, { status: 400 });
      }

      const values = parsed.data.customFields ?? {};
      const missing = requestType.fields.find((field) => {
        if (!field.required) return false;
        const value = values[field.key];
        return value === undefined || value === null || value === "";
      });

      if (missing) {
        return NextResponse.json({ error: `${missing.label} is required` }, { status: 400 });
      }
    }

    if (parsed.data.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where:  { id: parsed.data.assigneeId },
        select: { id: true, role: true, status: true, departmentId: true },
      });

      if (
        !assignee ||
        assignee.status !== "ACTIVE" ||
        !["ADMIN", "MANAGER", "MEMBER"].includes(assignee.role) ||
        assignee.departmentId !== department.id
      ) {
        return NextResponse.json({ error: "Assignee must be an active staff member in the selected department" }, { status: 400 });
      }

      const canAssignOnCreate =
        user.role === "ADMIN" ||
        (user.role === "MANAGER" && user.departmentId === department.id) ||
        (user.role === "MEMBER" && user.departmentId === department.id && assignee.id === user.id);

      if (!canAssignOnCreate) {
        return NextResponse.json({ error: "You can submit requests to this department, but you cannot assign them" }, { status: 403 });
      }
    }

    const ticket = await ticketService.create(parsed.data, session.user.id);
    return NextResponse.json({ data: ticket }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
