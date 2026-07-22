import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ticketService } from "@/services/ticket.service";
import {
  changeTicketPrioritySchema,
  changeTicketStatusSchema,
  createCommentSchema,
  reassignTicketSchema,
  selfAssignTicketSchema,
  updateTicketSchema,
} from "@/lib/validations/ticket";
import { prisma } from "@/lib/prisma";
import { abac } from "@/lib/abac";

type Params = { params: Promise<{ id: string }> };

// ── Shared helper — fetch ticket + build abac attrs in one query ───
async function getTicketAttrs(id: string) {
  return prisma.ticket.findUnique({
    where:  { id },
    select: {
      creatorId:    true,
      assigneeId:   true,
      departmentId: true,
      status:       true,
      slaDeadline:  true,
      slaBreached:  true,
    },
  });
}

function validationError(error: any) {
  return NextResponse.json({ error: error.flatten?.() ?? error }, { status: 400 });
}

// ── GET ───────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const [{ id }, session] = await Promise.all([params, auth()]);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ticket = await ticketService.getById(id);
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const actor = {
      id:           session.user.id as string,
      role:         (session.user as any).role         ?? "REQUESTER",
      departmentId: (session.user as any).departmentId ?? null,
    };

    if (!abac.canViewTicket(actor, {
      creatorId:    ticket.creatorId,
      assigneeId:   ticket.assigneeId   ?? null,
      departmentId: ticket.departmentId ?? null,
      status:       ticket.status,
    })) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data: ticket });
  } catch {
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

// ── PATCH ─────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const [{ id }, session, body] = await Promise.all([params, auth(), req.json()]);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = {
      id:           session.user.id,
      role:         (session.user as any).role         ?? "REQUESTER",
      departmentId: (session.user as any).departmentId ?? null,
    };

    const ticket = await getTicketAttrs(id);
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const ticketAttrs = {
      creatorId:    ticket.creatorId,
      assigneeId:   ticket.assigneeId   ?? null,
      departmentId: ticket.departmentId ?? null,
      status:       ticket.status,
    };

    if (!abac.canViewTicket(actor, ticketAttrs)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Self assign ──────────────────────────────────────────────
    if ("selfAssign" in body) {
      const parsed = selfAssignTicketSchema.safeParse(body);
      if (!parsed.success) return validationError(parsed.error);

      if (!abac.canSelfAssign(actor, ticketAttrs)) {
        return NextResponse.json({ error: "Cannot assign this ticket" }, { status: 403 });
      }
      const updated = await prisma.ticket.update({
        where: { id },
        data:  { assigneeId: actor.id },
      });
      return NextResponse.json({ data: updated });
    }

    // ── Reassign ─────────────────────────────────────────────────
    if ("assigneeId" in body) {
      const parsed = reassignTicketSchema.safeParse(body);
      if (!parsed.success) return validationError(parsed.error);

      if (!abac.canReassign(actor, ticketAttrs)) {
        return NextResponse.json({ error: "You don't have permission to reassign this ticket" }, { status: 403 });
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
          assignee.departmentId !== ticketAttrs.departmentId
        ) {
          return NextResponse.json({ error: "Assignee must be an active staff member in this ticket's department" }, { status: 400 });
        }
      }

      const updated = await prisma.ticket.update({
        where: { id },
        data:  { assigneeId: parsed.data.assigneeId },
      });
      return NextResponse.json({ data: updated });
    }

    // ── Status change ────────────────────────────────────────────
    if ("status" in body) {
      const parsed = changeTicketStatusSchema.safeParse(body);
      if (!parsed.success) return validationError(parsed.error);

      if (!abac.canChangeStatus(actor, ticketAttrs)) {
        return NextResponse.json({ error: "You don't have permission to change this status" }, { status: 403 });
      }

      const isClosing    = parsed.data.status === "RESOLVED" || parsed.data.status === "CLOSED";
      const alreadyBreached = ticket.slaBreached;
      const nowBreached  = ticket.slaDeadline && new Date(ticket.slaDeadline) < new Date();

      const updated = await prisma.ticket.update({
        where: { id },
        data:  {
          status: parsed.data.status,
          // Mark slaBreached if closing and deadline already passed
          ...(isClosing && !alreadyBreached && nowBreached && { slaBreached: true }),
        },
      });
      return NextResponse.json({ data: updated });
    }

    // ── Priority change ──────────────────────────────────────────
    if ("priority" in body) {
      const parsed = changeTicketPrioritySchema.safeParse(body);
      if (!parsed.success) return validationError(parsed.error);

      if (!abac.canEditPriority(actor, ticketAttrs)) {
        return NextResponse.json({ error: "You don't have permission to change priority" }, { status: 403 });
      }
      const updated = await prisma.ticket.update({
        where: { id },
        data:  { priority: parsed.data.priority },
        include: { assignee: true, creator: true, department: true },
      });
      return NextResponse.json({ data: updated });
    }

    // ── General update (title, description etc) — admin/manager ──
    if (!["ADMIN", "MANAGER"].includes(actor.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = updateTicketSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const updated = await prisma.ticket.update({
      where: { id },
      data:  parsed.data,
    });
    return NextResponse.json({ data: updated });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const [{ id }, session] = await Promise.all([params, auth()]);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = {
      id:           session.user.id,
      role:         (session.user as any).role         ?? "REQUESTER",
      departmentId: (session.user as any).departmentId ?? null,
    };

    const ticket = await getTicketAttrs(id);
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const ticketAttrs = {
      creatorId:    ticket.creatorId,
      assigneeId:   ticket.assigneeId   ?? null,
      departmentId: ticket.departmentId ?? null,
      status:       ticket.status,
    };

    if (!abac.canViewTicket(actor, ticketAttrs)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!abac.canDeleteTicket(actor)) {
      return NextResponse.json({ error: "Forbidden — Admin only" }, { status: 403 });
    }

    await ticketService.delete(id);
    return NextResponse.json({ message: "Ticket deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}

// ── POST (comment) ────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const [{ id }, session, body] = await Promise.all([params, auth(), req.json()]);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = {
      id:           session.user.id,
      role:         (session.user as any).role         ?? "REQUESTER",
      departmentId: (session.user as any).departmentId ?? null,
    };

    const ticket = await getTicketAttrs(id);
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const ticketAttrs = {
      creatorId:    ticket.creatorId,
      assigneeId:   ticket.assigneeId   ?? null,
      departmentId: ticket.departmentId ?? null,
      status:       ticket.status,
    };

    if (!abac.canViewTicket(actor, ticketAttrs)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!abac.canAddComment(actor)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const comment = await ticketService.addComment(id, parsed.data.body, session.user.id);
    return NextResponse.json({ data: comment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
